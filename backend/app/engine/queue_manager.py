# backend/app/engine/queue_manager.py
import asyncio
import traceback
from typing import Dict, Set, List
from fastapi import WebSocket

# 引入核心执行引擎和存储
from app.core.storage import FileStorage
from app.models.bpnl import FlowSchema
from app.engine.compiler import BPNLCompiler

class TaskQueueManager:
    """
    GridsPilot 核心：全局内存任务队列与 WebSocket 事件广播总线
    (The Concurrency & Broadcasting Hub)
    """
    def __init__(self):
        # 1. 任务篮子：存放待执行的任务载荷 (flow_id, task_id, initial_state)
        # 这是一个异步安全的 FIFO 队列，Worker 会在这里排队抢活干
        self.queue: asyncio.Queue = asyncio.Queue()
        
        # 2. 活跃的任务池：记录当前正在被 Worker 啃着的硬骨头
        self.active_tasks: Set[str] = set()
        
        # 3. WebSocket 广播列表：存放所有连上来的前端大屏 (Clients)
        # 生产环境中可按 channel_id / user_id 划分房间 (Rooms) 进行定点推送
        self.connected_clients: List[WebSocket] = []

    async def submit_task(self, flow_id: str, task_id: str, initial_state: dict):
        """
        [接客层 API/WS 调用]：将前端触发的任务瞬间压入篮子，立即返回，绝不阻塞！
        """
        payload = {
            "flow_id": flow_id,
            "task_id": task_id,
            "state": initial_state
        }
        await self.queue.put(payload)
        print(f"📥 [Queue] 任务 {task_id} 已压入队列 (当前排队总数: {self.queue.qsize()})")

    async def broadcast(self, message: dict):
        """
        [干活层 Worker 调用]：把节点的高亮状态和执行日志，极其暴力地群发给所有连接的前端大屏！
        """
        if not self.connected_clients:
            return
            
        disconnected = []
        for client in self.connected_clients:
            try:
                # 💡 极速推流：将 Python 字典转为 JSON 发送给 React 前端
                await client.send_json(message)
            except Exception:
                # 如果发的时候发现前端断网了（比如关了网页），先记下来，等下清理
                disconnected.append(client)
        
        # 🧹 自动清理死连接，防止内存泄漏 (Memory Leak)
        for client in disconnected:
            if client in self.connected_clients:
                self.connected_clients.remove(client)
                print("🧹 [Queue] 自动清理了一个已断开的 WebSocket 僵尸连接。")


# ==============================================================================
# 全局单例实例化 (Global Singleton)
# ==============================================================================
task_manager = TaskQueueManager()


# ==============================================================================
# 👷 守护进程：后台苦力 (The Daemon Worker)
# ==============================================================================
async def background_worker(worker_id: int):
    """
    永远在后台 `while True` 循环拿任务干活的协程。
    (FastAPI 启动时会拉起多个这种 Worker 形成集群)
    """
    print(f"👷 [Worker-{worker_id}] 引擎已点火就绪，正在监听任务队列...")
    
    while True:
        try:
            # 1. 🛑 阻塞等待：如果没有任务，Worker 就在这里安静地睡觉，释放 CPU
            task_payload = await task_manager.queue.get()
            
            flow_id = task_payload["flow_id"]
            task_id = task_payload["task_id"]
            initial_state = task_payload["state"]
            
            task_manager.active_tasks.add(task_id)
            
            # 2. 抢到活了！先敲一声锣，广播告诉前端大屏
            print(f"\n🚀 [Worker-{worker_id}] 认领任务 {task_id} (图纸: {flow_id})")
            await task_manager.broadcast({
                "type": "log", 
                "msg": f"🚀 [Worker-{worker_id}] 成功认领任务 {task_id[:8]}，正在解析图纸 {flow_id}..."
            })
            
            # 3. 从底层的 SQLite 实时读取这张图的最新物理结构
            flow_data = FileStorage.get("flows", flow_id)
            if not flow_data:
                await task_manager.broadcast({"type": "log", "msg": f"❌ [Worker-{worker_id}] 致命错误：在底层资产库中找不到图纸 {flow_id}"})
                continue
                
            # 4. 动态编译图纸：BPNL Schema -> LangGraph StateGraph
            try:
                schema = FlowSchema(**flow_data)
                compiler = BPNLCompiler(schema)
                compiled_graph = compiler.compile()
                await task_manager.broadcast({"type": "log", "msg": f"✅ [Worker-{worker_id}] LangGraph 内存状态机编译成功，开始流转。"})
            except Exception as compile_err:
                await task_manager.broadcast({"type": "log", "msg": f"❌ [Worker-{worker_id}] 编译流程图失败，请检查图纸连线逻辑: {compile_err}"})
                continue
            
            # 5. 🌟 核心：流式遍历执行图 (Stream Execution)
            # 让图一步步地跑，并将状态极其丝滑地推送给前端！
            try:
                # 💡 注意：这里传入的 thread_id 是我们刚才的 task_id，这是未来做断点续传的伏笔！
                for output in compiled_graph.stream(initial_state, {"configurable": {"thread_id": task_id}}):
                    
                    # 获取当前刚跑完（或正在跑）的节点 ID (例如 'N1_Search')
                    node_id = list(output.keys())[0]
                    
                    # 💡 向前端发送神级指令：点亮这颗节点的赛博呼吸灯！
                    await task_manager.broadcast({"type": "node_active", "node_id": node_id})
                    await task_manager.broadcast({"type": "log", "msg": f"⚙️ [Executor] 进入节点: {node_id}"})
                    
                    # (这里的 sleep 仅为视觉效果，真实生产环境中引擎会根据组件的复杂程度自然耗时)
                    await asyncio.sleep(1.5) 
                    
                    await task_manager.broadcast({"type": "log", "msg": f"✅ [Executor] 节点 {node_id} 执行完成。"})
                    await asyncio.sleep(0.5)

                # 当 for 循环自然结束时，说明图纸跑完了（或者是被 interrupt_before 挂起了）
                await task_manager.broadcast({"type": "log", "msg": "🛑 [Auditor] 流程流转完毕，或被安全规则强行挂起 (Suspended)。"})
                
            except Exception as run_err:
                err_trace = traceback.format_exc()
                print(f"❌ [Worker-{worker_id}] 运行时崩溃: {err_trace}")
                await task_manager.broadcast({"type": "log", "msg": f"❌ [Runtime Error] 引擎在执行节点时崩溃: {str(run_err)}"})
            
            finally:
                # 无论任务是成功、挂起还是报错，跑完后必须通知前端：熄灭画布上所有的节点高亮灯！
                await task_manager.broadcast({"type": "node_active", "node_id": None})
                
        except asyncio.CancelledError:
            # 当 FastAPI 服务器被强制关闭时，优雅地退出 Worker
            print(f"🛑 [Worker-{worker_id}] 收到关机指令，正在安全下线。")
            break
            
        except Exception as e:
            print(f"❌ [Worker-{worker_id}] 发生未捕获的致命错误: {traceback.format_exc()}")
            
        finally:
            # 6. 🧹 擦屁股：清理任务状态，告诉 Queue 这个任务我处理完了
            if 'task_id' in locals() and task_id in task_manager.active_tasks:
                task_manager.active_tasks.discard(task_id)
                task_manager.queue.task_done()