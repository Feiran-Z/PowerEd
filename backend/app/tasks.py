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
        # Run container with logs streaming
        container = client.containers.run(
            image="claude-image:latest",
            command=cmd,
            environment=env_vars,
            volumes={workspace_dir: {"bind": "/workspace", "mode": "rw"}},
            working_dir="/workspace",
            remove=True,          # automatically remove container when finished
            detach=True,          # run in background so we can stream logs
            stdout=True,
            stderr=True,
        )

        # Stream logs line by line
        for line in container.logs(stream=True, follow=True):
            publish_log(task_id, line.decode('utf-8'))

        # Wait for container to finish and get exit code
        result = container.wait()
        exit_code = result.get('StatusCode', -1)

        if exit_code != 0:
            publish_log(task_id, f"\n❌ Container failed with exit code {exit_code}\n")
            return {"error": f"Claude execution failed (exit {exit_code})"}

    except docker.errors.ImageNotFound:
        publish_log(task_id, "\n❌ Docker image 'claude-image:latest' not found. Build it first.\n")
        return {"error": "Image not found"}
    except Exception as e:
        publish_log(task_id, f"\n❌ Docker error: {e}\n")
        return {"error": str(e)}

    # Zip output folder
    output_dir = Path(workspace_dir) / "output"
    if not output_dir.exists():
        publish_log(task_id, "⚠️ No output folder created\n")
        return {"error": "No output generated"}

    zip_path = Path("/tmp/results") / f"{task_id}.zip"
    shutil.make_archive(str(zip_path).replace('.zip', ''), 'zip', output_dir)
    publish_log(task_id, f"✅ Results zipped: {zip_path}\n")

    return {"download_url": f"/api/tasks/{self.request.id}/download"}