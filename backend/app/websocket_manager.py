# backend/app/websocket_manager.py
from fastapi import WebSocket
import redis.asyncio as redis
import asyncio

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, task_id: str):
        await websocket.accept()
        self.active_connections.setdefault(task_id, []).append(websocket)

    def disconnect(self, task_id: str):
        self.active_connections.pop(task_id, None)

    async def send_log(self, task_id: str, message: str):
        for ws in self.active_connections.get(task_id, []):
            await ws.send_text(message)

manager = ConnectionManager()

async def listen_redis():
    """Subscribe to Redis logs and forward to WebSockets, with auto-reconnect."""
    while True:
        try:
            redis_client = await redis.from_url("redis://redis:6379", decode_responses=True)
            pubsub = redis_client.pubsub()
            await pubsub.subscribe("logs:*")
            async for message in pubsub.listen():
                if message['type'] == 'message':
                    channel = message['channel']
                    task_id = channel.split(':')[1]
                    log_line = message['data']
                    await manager.send_log(task_id, log_line)
        except Exception as e:
            print(f"Redis listener error: {e}, reconnecting in 5s...")
            await asyncio.sleep(5)