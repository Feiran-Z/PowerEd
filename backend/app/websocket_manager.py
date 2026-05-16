from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, task_id: str):
        await websocket.accept()
        if task_id not in self.active_connections:
            self.active_connections[task_id] = []
        self.active_connections[task_id].append(websocket)
    
    def disconnect(self, task_id: str):
        if task_id in self.active_connections:
            del self.active_connections[task_id]
    
    async def send_log(self, task_id: str, message: str):
        if task_id in self.active_connections:
            for ws in self.active_connections[task_id]:
                await ws.send_text(message)

manager = ConnectionManager()

# Redis subscriber (run in a background thread inside FastAPI)
import asyncio
import aioredis
async def listen_redis():
    while True:
        try:
            pubsub = await aioredis.from_url("redis://redis:6379").pubsub()
            await pubsub.subscribe("logs:*")
            async for msg in pubsub.listen():
                if msg['type'] == 'message':
                    channel = msg['channel'].decode()
                    task_id = channel.split(':')[1]
                    await manager.send_log(task_id, msg['data'].decode())
        except Exception as e:
            print(f"Redis listener error: {e}, reconnecting in 5s...")
            await asyncio.sleep(5)