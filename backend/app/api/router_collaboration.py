# backend/app/api/router_collaboration.py
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List
import uuid
import json

from app.core.storage import FileStorage
from app.engine.router_agent import process_chat_intent
from app.engine.compiler import BPNLCompiler
from app.models.bpnl import FlowSchema

router = APIRouter()

# ==============================================================================
# 数据模型定义
# ==============================================================================
class ChatRequest(BaseModel):
    message: str

class ChatSessionParams(BaseModel):
    id: str
    title: str
    time: str
    messages: list

class ChannelMessage(BaseModel):
    id: str
    type: str
    user: Optional[str] = None
    agentId: Optional[str] = None
    agentName: Optional[str] = None
    text: str
    time: str
    isAction: Optional[bool] = False
    actionCard: Optional[dict] = None

class WorkspaceChannel(BaseModel):
    id: str
    name: str
    unread: int
    desc: str
    messages: List[ChannelMessage]

class WorkspaceChatRequest(BaseModel):
    channel_id: str
    agent_id: str
    message: str

class ResumeTaskRequest(BaseModel):
    thread_id: str        # 挂起时的任务 ID
    flow_id: str          # 是哪张图纸
    human_inputs: dict    # 人类在 Workbench 里填写的数据（如 {"discount_rate": 0.8}）

# ==============================================================================
# 1. Copilot (意图路由与单聊记忆)
# ==============================================================================
@router.post("/chat")
async def chat_with_copilot(req: ChatRequest):
    return process_chat_intent(req.message)

@router.get("/chats")
async def get_chat_sessions():
    chats = FileStorage.list_all("chats")
    chats.sort(key=lambda x: x.get("id", ""), reverse=True)
    return {"status": "success", "data": chats}

@router.post("/chats")
async def save_chat_session(session: ChatSessionParams):
    FileStorage.save("chats", session.dict(), session.id)
    return {"status": "success"}

# ==============================================================================
# 2. Workspace (多智能体群聊场域)
# ==============================================================================
@router.get("/workspaces")
async def get_workspace_channels():
    channels = FileStorage.list_all("workspaces")
    if not channels:
        defaults = [{"id": "marketing", "name": "营销活动与增长", "unread": 0, "desc": "与 Agent 共同策划", "messages": []}]
        for c in defaults: FileStorage.save("workspaces", c, c["id"])
        channels = defaults
    return {"status": "success", "data": channels}

@router.post("/workspaces")
async def save_workspace_channel(channel: WorkspaceChannel):
    FileStorage.save("workspaces", channel.dict(), channel.id)
    return {"status": "success"}

@router.post("/workspace/chat")
async def workspace_chat_agent(req: WorkspaceChatRequest):
    """
    真实的群聊分发中枢：
    从 FileDB 读取频道的历史记忆，并唤醒被 @ 的特定 Agent 模型进行回复。
    """
    print(f"\n📢 [Workspace] 频道 {req.channel_id} 收到消息，试图唤醒 Agent: {req.agent_id}")
    
    agent_config = FileStorage.get("agents", req.agent_id)
    if not agent_config:
        return {"status": "error", "message": "该员工不存在或已被开除。"}

    agent_name = agent_config.get("name")
    agent_model = agent_config.get("model", "gpt-4o")
    agent_persona = agent_config.get("desc", "你是一个工作助手。")
    
    channel_data = FileStorage.get("workspaces", req.channel_id)
    history_messages = channel_data.get("messages", []) if channel_data else []
    
    memory_context = "【以下是本群的历史聊天记录】：\n"
    for msg in history_messages[-10:]:
        sender = msg.get("user") if msg.get("type") == "human" else msg.get("agentName")
        memory_context += f"[{sender}]: {msg.get('text')}\n"

    system_prompt = f"""
    你是 GridsPilot OS 里的数字员工。
    你的名字是：{agent_name}
    你的角色和能力边界是：{agent_persona}
    
    你现在身处一个企业内部的群聊频道中。请根据上下文和你的角色职责，回复 @ 你的用户。
    如果用户要求你执行复杂的业务流程，你可以生成一个 BPNL JSON SOP 并输出（和 Intent Router 规则一致）。
    """
    
    full_prompt = f"{memory_context}\n\n【最新消息】\n[Admin]: {req.message}"
    
    from app.execution.llm import ask_llm
    response_text = ask_llm(prompt=full_prompt, system_prompt=system_prompt, model_id=agent_model)
    
    if "```json" in response_text:
        try:
            json_str = response_text.split("```json")[1].split("```")[0].strip()
            sop_data = json.loads(json_str)
            
            new_flow_id = f"flow_auto_{uuid.uuid4().hex[:6]}"
            bpnl_asset = {
                "id": new_flow_id, "name": sop_data.get('sop_name', f'{agent_name} 自动生成的流程'),
                "description": f"由 {agent_name} 在群聊中生成",
                "nodes": sop_data.get('bpnl', {}).get('nodes', []), "edges": sop_data.get('bpnl', {}).get('edges', [])
            }
            FileStorage.save("flows", bpnl_asset, new_flow_id)
            
            return {
                "status": "success",
                "message": f"老板，我已经为您生成了流程图。请点击下方卡片审查或执行。",
                "is_action": True,
                "action_card": {"title": bpnl_asset["name"], "nodes": len(bpnl_asset["nodes"]), "flow_id": new_flow_id}
            }
        except Exception as e:
            return {"status": "success", "message": f"(生成流程时出错：{e})\n" + response_text, "is_action": False}

    return {"status": "success", "message": response_text, "is_action": False}

# ==============================================================================
# 💡 3. Workbench (人工干预接管与真实断点唤醒) [战役二核心战果！]
# ==============================================================================
@router.post("/workbench/resume")
async def resume_suspended_task(req: ResumeTaskRequest):
    """
    [人类接管台] 放行并复活被冻结的状态机！
    """
    print(f"\n🔓 [Auditor] 收到人类指令，准备复活任务线程: {req.thread_id}")
    
    # 1. 重新调出图纸并编译 (此时编译器内部带有 SqliteSaver)
    flow_data = FileStorage.get("flows", req.flow_id)
    if not flow_data:
         return {"status": "error", "msg": "找不到图纸"}
         
    schema = FlowSchema(**flow_data)
    compiled_graph = BPNLCompiler(schema).compile()
    
    # 2. 定位到被冻结的那个线程 (Thread)
    config = {"configurable": {"thread_id": req.thread_id}}
    
    # 3. 读取冻结时的上下文，把人类的新数据强行注入进去！
    current_state = compiled_graph.get_state(config)
    if not current_state.next:
        return {"status": "error", "msg": "该任务并未处于挂起状态。"}
        
    print(f"📥 [Auditor] 注入人类填写的数据: {req.human_inputs}")
    # 将人类输入合并到 context_data 中
    new_context = current_state.values.get("context_data", {})
    new_context.update(req.human_inputs)
    
    # 4. 💡 魔法时刻：用 update_state 篡改内存，然后空发流转唤醒！
    # 真实生产中，这里的执行可能会消耗时间，建议放入后台 Celery/Queue 中跑
    try:
        # update_state 可以强行篡改图里的数据
        compiled_graph.update_state(config, {"context_data": new_context})
        
        # 恢复执行 (Resume)
        for output in compiled_graph.stream(None, config):
            node_id = list(output.keys())[0]
            print(f"⚙️ [Executor] 断点续传，继续执行节点: {node_id}")
            
        print("🎉 [Auditor] 断点续传任务执行完毕！")
        return {"status": "success", "msg": "任务已恢复并执行完毕"}
    except Exception as e:
        print(f"❌ [Auditor] 恢复任务失败: {e}")
        return {"status": "error", "msg": str(e)}