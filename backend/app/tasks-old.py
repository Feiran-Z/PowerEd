from celery import Celery
import subprocess
import docker
import redis
import os
import shutil
from pathlib import Path
from .websocket_manager import manager

redis_client = redis.Redis(host='redis', port=6379, decode_responses=True)
celery_app = Celery('tasks', broker='redis://redis:6379/0', backend='redis://redis:6379/0')

def publish_log(task_id, line):
    redis_client.publish(f"logs:{task_id}", line)
    # Also send via WebSocket if a connection exists
    # (WebSocket manager runs in FastAPI process, not here - we use Redis pub/sub)

@celery_app.task(bind=True)
def run_claude_task(self, workspace_dir, prompt, api_key, base_url, model, task_id):
    publish_log(task_id, "🚀 Starting Claude container...\n")
    
    # Build command
    cmd = [
        "docker", "run", "--rm",
        "-v", f"{workspace_dir}:/workspace",
        "-w", "/workspace",
        "-e", f"ANTHROPIC_API_KEY={api_key}",
        "-e", f"ANTHROPIC_BASE_URL={base_url}" if base_url else "",
        "-e", f"ANTHROPIC_MODEL={model}" if model else "",
        "claude-image:latest",
        "-p", prompt,
        "--no-session-persistence",
        "--permission-mode", "bypassPermissions"
    ]
    # Remove empty env vars
    cmd = [x for x in cmd if x]
    
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1)
    for line in proc.stdout:
        publish_log(task_id, line)
    proc.wait()
    
    if proc.returncode != 0:
        publish_log(task_id, f"\n❌ Container failed with code {proc.returncode}\n")
        return {"error": "Claude execution failed"}
    
    # Zip output folder
    output_dir = Path(workspace_dir) / "output"
    if not output_dir.exists():
        publish_log(task_id, "⚠️ No output folder created\n")
        return {"error": "No output generated"}
    
    zip_path = Path("/tmp/results") / f"{task_id}.zip"
    shutil.make_archive(str(zip_path).replace('.zip', ''), 'zip', output_dir)
    publish_log(task_id, f"✅ Results zipped: {zip_path}\n")
    
    return {"download_url": f"/api/tasks/{self.request.id}/download"}