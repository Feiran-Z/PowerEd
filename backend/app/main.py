from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from celery.result import AsyncResult
from .models import TaskCreateResponse, TaskStatus
from .tasks import run_claude_task
from .websocket_manager import manager, listen_redis
from .utils import ensure_dir, cleanup_old_workspaces
import asyncio
import uuid
import os
from pathlib import Path

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"])

UPLOAD_DIR = ensure_dir(Path("/tmp/uploads"))
RESULTS_DIR = ensure_dir(Path("/tmp/results"))

@app.post("/api/tasks", response_model=TaskCreateResponse)
async def create_task(
    prompt: str = Form(...),
    api_key: str = Form(...),
    base_url: str = Form(None),
    model: str = Form(None),
    files: list[UploadFile] = File(None)
):
    task_id = str(uuid.uuid4())
    workspace = UPLOAD_DIR / task_id
    workspace.mkdir()

    # Save uploaded files
    if files:
        # Create a 'userfiles' subdirectory inside the workspace
        userfiles_dir = workspace / "userfiles"
        userfiles_dir.mkdir(exist_ok=True)
    
    for f in files:
        content = await f.read()
        (userfiles_dir / f.filename).write_bytes(content)
    
    enhanced_prompt = (
        f"{prompt}\n\n"
        f"You MUST use the powered-planning skill in '/home/node/.claude/skills/powered-planning/SKILL.md'.\n"
        f"(Note: You are operating inside the folder '/workspace'. "
        f"All user supplied files are in the './userfiles/' subfolder."
        f"Please create all output files in the './output/' subfolder.)"
    )

    # Launch Celery task
    celery_task = run_claude_task.delay(
        str(workspace), enhanced_prompt, api_key, base_url, model, task_id
    )
    return {"task_id": celery_task.id, "ws_url": f"/ws/{task_id}"}

@app.get("/api/tasks/{task_id}/status")
async def get_status(task_id: str):
    result = AsyncResult(task_id, app=run_claude_task)
    return {"status": result.state, "info": result.info}

@app.get("/api/tasks/{task_id}/download")
async def download_result(task_id: str):
    zip_path = RESULTS_DIR / f"{task_id}.zip"
    if not zip_path.exists():
        raise HTTPException(404, "Result not ready or expired")
    return FileResponse(zip_path, media_type="application/zip", filename="output.zip")

from fastapi import WebSocket, WebSocketDisconnect
@app.websocket("/ws/{task_id}")
async def websocket_endpoint(websocket: WebSocket, task_id: str):
    await manager.connect(websocket, task_id)
    try:
        while True:
            await websocket.receive_text()  # keep alive
    except WebSocketDisconnect:
        manager.disconnect(task_id)

async def periodic_cleanup():
    while True:
        await asyncio.sleep(3600)  # every hour
        cleanup_old_workspaces(UPLOAD_DIR, RESULTS_DIR, max_age_hours=1)

@app.on_event("startup")
async def startup():
    asyncio.create_task(listen_redis())
    asyncio.create_task(periodic_cleanup())