from pydantic import BaseModel
from typing import Optional

class TaskCreateResponse(BaseModel):
    task_id: str
    ws_url: str   # WebSocket URL for live logs

class TaskStatus(BaseModel):
    status: str   # "PENDING", "STARTED", "SUCCESS", "FAILURE"
    info: Optional[dict] = None