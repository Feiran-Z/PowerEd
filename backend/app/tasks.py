from celery import Celery
import docker
import redis
import shutil
from pathlib import Path

redis_client = redis.Redis(host='redis', port=6379, decode_responses=True)
celery_app = Celery('tasks', broker='redis://redis:6379/0', backend='redis://redis:6379/0')

def publish_log(task_id, line):
    redis_client.publish(f"logs:{task_id}", line)

@celery_app.task(bind=True)
def run_claude_task(self, workspace_dir, prompt, api_key, base_url, model, task_id):
    publish_log(task_id, "🚀 Starting Claude container using Docker SDK...\n")
    publish_log(task_id, f"Workspace: {workspace_dir}\n")
    publish_log(task_id, f"Prompt length: {len(prompt)} chars\n")

    # Prepare environment variables (remove None values)
    env_vars = {
        "ANTHROPIC_API_KEY": api_key,
    }
    if base_url:
        env_vars["ANTHROPIC_BASE_URL"] = base_url
    if model:
        env_vars["ANTHROPIC_MODEL"] = model

    # Command to run inside container
    cmd = [
        "-p", prompt,
        "--no-session-persistence",
        "--permission-mode", "bypassPermissions"
    ]

    # Docker client (uses mounted /var/run/docker.sock)
    try:
        client = docker.from_env()
    except Exception as e:
        publish_log(task_id, f"❌ Failed to connect to Docker daemon: {e}\n")
        return {"error": "Docker daemon unavailable"}

    try:
        # Run container
        container = client.containers.run(
            image="claude-image:latest",
            command=cmd,
            environment=env_vars,
            volumes={workspace_dir: {"bind": "/workspace", "mode": "rw"}},
            working_dir="/workspace",
            remove=False,          # keep so we can get logs
            detach=True,
            stdout=True,
            stderr=True,
        )
        publish_log(task_id, f"Container ID: {container.id}\n")
        #publish_log(task_id, f"Command: {cmd}\n")
        #publish_log(task_id, f"Environment keys: {list(env_vars.keys())}\n")

        # Wait for completion
        result = container.wait()
        exit_code = result.get('StatusCode', -1)

        # Get all logs after exit (both stdout and stderr)
        logs = container.logs(stdout=True, stderr=True).decode('utf-8', errors='replace')
        if logs:
            publish_log(task_id, logs)
        else:
            publish_log(task_id, "(No output from container)\n")

        publish_log(task_id, f"Container exited with code {exit_code}\n")

        # After container.wait() and before container.remove()
        logs = container.logs(stdout=True, stderr=True).decode('utf-8', errors='replace')
        with open(Path(workspace_dir) / "claude_debug.log", "w") as f:
            f.write(logs)

        # Clean up
        container.remove()
    except docker.errors.ImageNotFound:
        publish_log(task_id, "\n❌ Docker image 'claude-image:latest' not found. Build it first.\n")
        return {"error": "Image not found"}
    except Exception as e:
        publish_log(task_id, f"\n❌ Docker error: {e}\n")
        return {"error": str(e)}

    # After container finishes
    output_dir = Path(workspace_dir) / "output"
    publish_log(task_id, f"Looking for output at: {output_dir}\n")
    if not output_dir.exists():
        publish_log(task_id, "⚠️ No output folder created\n")
        # Also list workspace contents for debugging
        try:
            contents = "\n".join(str(p) for p in Path(workspace_dir).iterdir())
            publish_log(task_id, f"Workspace contents:\n{contents}\n")
        except:
            pass
        return {"error": "No output generated"}

    # Create zip in workspace (writable)
    try:
        temp_zip = Path(workspace_dir) / f"{task_id}.zip"
        publish_log(task_id, f"Creating zip: {temp_zip}\n")
        shutil.make_archive(str(temp_zip).replace('.zip', ''), 'zip', output_dir)
        publish_log(task_id, f"✅ Zip created at {temp_zip}\n")
    except Exception as e:
        publish_log(task_id, f"❌ Failed to create zip: {e}\n")
        return {"error": f"Zip creation failed: {e}"}

    # Move to results directory
    try:
        results_dir = Path("/tmp/results")
        results_dir.mkdir(parents=True, exist_ok=True)
        final_zip = results_dir / f"{task_id}.zip"
        shutil.move(str(temp_zip), str(final_zip))
        publish_log(task_id, f"✅ Results moved to: {final_zip}\n")
        publish_log(task_id, "Results zipped\n")   # This exact string triggers download button
    except Exception as e:
        publish_log(task_id, f"❌ Failed to move zip: {e}\n")
        return {"error": f"Move failed: {e}"}

    return {"download_url": f"/api/tasks/{self.request.id}/download"}