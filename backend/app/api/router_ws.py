# backend/app/api/router_ws.py
import uuid
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

# 💡 引入我们刚写的全局任务大管家
from app.engine.queue_manager import task_manager
from app.engine.state import AgentState

router = APIRouter()

@router.websocket("/state")
async def websocket_endpoint(websocket: WebSocket):
    """
    全双工执行总线：现在只负责“接客和广播”，绝不阻塞！
    """
    await websocket.accept()
    print("\n🔌 [WebSocket] 前端驾驶舱已连接 WS_STATE!")
    
    # 1. 登记这块大屏
    task_manager.connected_clients.append(websocket)
    
    try:
        while True:
            raw_data = await websocket.receive_text()
            print(f"📥 [WebSocket] 收到前端指令: {raw_data}")
            
            if raw_data.startswith("START_TASK"):
                flow_id_to_run = raw_data.split("|")[1] if len(raw_data.split("|")) > 1 else None
                
                if not flow_id_to_run:
                    await websocket.send_json({"type": "log", "msg": "❌ [System] 错误：未提供图纸 ID。"})
                    continue
                
                # 构造初始状态
                task_id = f"task_{uuid.uuid4().hex[:8]}"
                initial_state = AgentState(
                    task_id=task_id, flow_id=flow_id_to_run, context_data={"has_captcha": False}, traces=[], next_node=""
                )
                
                # 2. 💡 绝杀：极其优雅地把任务扔给后台 Worker，主线程瞬间释放！
                await task_manager.submit_task(flow_id_to_run, task_id, initial_state)
                await websocket.send_json({"type": "log", "msg": f"📥 [System] 任务已压入队列 (ID: {task_id})，等待 Worker 认领..."})
                
    except WebSocketDisconnect:
        print("🔌 [WebSocket] 前端驾驶舱已断开连接")
        if websocket in task_manager.connected_clients:
            task_manager.connected_clients.remove(websocket)