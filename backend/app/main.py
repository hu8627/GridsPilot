#  Copyright (C) 2026 NexaFlow Team (charismamikoo@gmail.com)
#  This file is part of NexaFlow.
#  NexaFlow is free software: you can redistribute it and/or modify
#  it under the terms of the GNU Affero General Public License as published by
#  the Free Software Foundation, either version 3 of the License.
import asyncio
import json
import uuid
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

# 引入核心模块
from app.models.bpnl import FlowSchema
from app.engine.compiler import BPNLCompiler
from app.engine.state import AgentState
from app.engine.router_agent import process_chat_intent
from app.core.storage import FileStorage
from app.execution.llm import ask_llm  # 用于迭代 Optimizer Agent 与群聊 Agent

app = FastAPI(title="NexaFlow Orchestration Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def health_check():
    return {"status": "NexaFlow Engine is Alive", "version": "1.0.0"}


# ==============================================================================
# 模块 I：元数据与全域资产总台 (Meta Asset Hub)
# ==============================================================================

@app.get("/api/assets/meta")
async def get_system_meta_assets():
    """
    扫描整个 SQLite 的存储状况，返回各域的表结构及数据量。
    极其坚固的防崩溃版本。
    """
    domains = ["flows", "models", "skills", "integrations", "monitors", "chats", "agents", "traces", "cases", "workspaces", "prompts"]
    meta_stats = []
    
    # 我们直接引入数据库 session，用原生的 COUNT() 查询，绝对不会因为 JSON 序列化报错！
    from app.core.storage import SessionLocal, FileStorage, GenericAssetRecord
    db = SessionLocal()
    
    try:
        for domain in domains:
            try:
                # 1. 尝试获取表模型
                ModelClass = FileStorage._get_model_class(domain)
                
                # 2. 原生 SQL 查询数量
                query = db.query(ModelClass)
                if ModelClass == GenericAssetRecord:
                    query = query.filter(GenericAssetRecord.domain == domain)
                
                count = query.count()
                
                # 3. 为了前端的视觉效果，给个伪造的存储大小 (1条记录算 2.5KB)
                size_kb = round(count * 2.5, 2) if count > 0 else 0.00
                
                meta_stats.append({
                    "id": f"sys_db_{domain}",
                    "name": f"系统表: {domain.capitalize()}",
                    "category": "System Meta-Data",
                    "type": "SQLite Table",
                    "records": count,
                    "size": f"{size_kb} KB",
                    "domain": domain,
                    "last_updated": "Live Sync",
                    "is_system": True
                })
            except Exception as inner_e:
                print(f"⚠️ [Meta API] 跳过损坏的域 {domain}: {inner_e}")
                # 即使查不到，也塞个空壳子给前端！绝对不能白屏！
                meta_stats.append({
                    "id": f"sys_db_{domain}", "name": f"系统表: {domain.capitalize()}",
                    "category": "System Meta-Data", "type": "Error",
                    "records": 0, "size": "0 KB", "domain": domain,
                    "last_updated": "Error", "is_system": True
                })

        return {"status": "success", "data": meta_stats}
    except Exception as e:
        print(f"❌ [Meta API] 致命错误: {e}")
        return {"status": "error", "msg": str(e), "data": []}
    finally:
        db.close()

# ==============================================================================
# 模块 A：Chat 与意图路由 (Intent Router)
# ==============================================================================
class ChatRequest(BaseModel):
    message: str

@app.post("/api/chat")
async def chat_with_copilot(req: ChatRequest):
    """
    接收前端对话，进行意图解析：
    1. 普通对话 -> 返回 GENERAL_CHAT
    2. 复杂任务 -> LLM 动态生成 BPNL 流程图 -> 自动落盘到 FileDB -> 返回 COMPLEX_TASK
    """
    print(f"\n💬 [API] 收到前端 Chat 请求: {req.message}")
    result = process_chat_intent(req.message)
    print(f"✅ [API] 意图解析完成，返回类型: {result.get('type')}")
    return result


# ==============================================================================
# 模块 B：聊天历史持久化 (Chats Ledger)
# ==============================================================================
class ChatSessionParams(BaseModel):
    id: str
    title: str
    time: str
    messages: list

@app.get("/api/chats")
async def get_chat_sessions():
    """获取历史聊天列表"""
    chats = FileStorage.list_all("chats")
    chats.sort(key=lambda x: x.get("id", ""), reverse=True)
    return {"status": "success", "data": chats}

@app.post("/api/chats")
async def save_chat_session(session: ChatSessionParams):
    """保存或更新单个聊天会话"""
    FileStorage.save("chats", session.dict(), session.id)
    return {"status": "success"}

# ==============================================================================
# 模块 B-7：公共频道群聊持久化 (Workspace Channels)
# ==============================================================================
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

@app.get("/api/workspaces")
async def get_workspace_channels():
    """获取所有群聊频道及其历史消息"""
    channels = FileStorage.list_all("workspaces")
    
    # 注入出厂默认的三个频道和演示消息
    if not channels:
        default_channels = [
            {
                "id": "marketing", "name": "营销活动与增长", "unread": 2, 
                "desc": "与 [文案写手] 和 [数据分析师] 共同策划 Campaign",
                "messages": [
                    {"id": "m1", "type": "system", "text": "Welcome to #营销活动与增长 channel. Agent [文案小李] and [数据老王] have joined.", "time": "09:00 AM"},
                    {"id": "m2", "type": "human", "user": "产品经理 (我)", "text": "大家早上好。我们需要策划一下下周五的大促。@数据老王 拉一下去年数据。", "time": "09:05 AM"},
                    {"id": "m3", "type": "agent", "agentId": "a_data", "agentName": "数据老王", "text": "收到。已生成可视化报表，是否需要我将数据喂给 @文案小李？", "time": "09:06 AM", "isAction": False},
                    {"id": "m4", "type": "human", "user": "产品经理 (我)", "text": "好的。@文案小李 根据数据写推文。", "time": "09:10 AM"},
                    {"id": "m5", "type": "agent", "agentId": "a_writer", "agentName": "文案小李", "text": "文案已生成完毕，并已打包为标准 SOP 卡片。您可以直接一键分发。", "time": "09:12 AM", "isAction": True, "actionCard": {"title": "大促推文分发 SOP", "nodes": 3, "target": "Social Media"}}
                ]
            },
            {"id": "customer_service", "name": "售后与投诉处理", "unread": 0, "desc": "与 [客服专员] 处理客诉 SOP", "messages": []},
            {"id": "finance", "name": "财务对账与报销", "unread": 5, "desc": "与 [财务审批流] 对接", "messages": []}
        ]
        for c in default_channels:
            FileStorage.save("workspaces", c, c["id"])
        channels = default_channels

    return {"status": "success", "data": channels}

@app.post("/api/workspaces")
async def save_workspace_channel(channel: WorkspaceChannel):
    """保存或更新单个频道的消息记录"""
    FileStorage.save("workspaces", channel.dict(), channel.id)
    return {"status": "success"}

# ==============================================================================
# 💡 模块 B-8：多智能体群聊引擎 (带有长期记忆与真实 Agent 挂载) [补充部分]
# ==============================================================================
class WorkspaceChatRequest(BaseModel):
    channel_id: str
    agent_id: str
    message: str

@app.post("/api/workspace/chat")
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
    你是 NexaFlow OS 里的数字员工。
    你的名字是：{agent_name}
    你的角色和能力边界是：{agent_persona}
    
    你现在身处一个企业内部的群聊频道中。请根据上下文和你的角色职责，回复 @ 你的用户。
    如果用户要求你执行复杂的业务流程，你可以生成一个 BPNL JSON SOP 并输出（和 Intent Router 规则一致）。
    """
    
    full_prompt = f"{memory_context}\n\n【最新消息】\n[Admin]: {req.message}"
    
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
# 模块 C：资产管理 API (业务流程 Flows)
# ==============================================================================

# 💡 乐高式拼接布局：去除沉重的容器包裹，全节点自由对齐横纵轨道
# ==============================================================================
# 💡 精密计算过的网格坐标数据 (彻底消除重叠，展现完美的控制流转)
# ==============================================================================
# 💡 极其规整、像素级对齐的四相矩阵排版
# 💡 完美平铺的乐高矩阵布局：彻底剥离父子嵌套，全员绝对坐标！
mock_default_bpnl = {
    "id": "flow_sdr_001",
    "name": "智能拓客与CRM录入 (绝对矩阵版)",
    "description": "全网搜集客户线索，经大模型洗筛后，要求人类审批，最终写入老旧 CRM。",
    "nodes": [
        # =================================================================
        # 1. 顶层阶段 (Phases) - 绝对坐标，紧贴上方
        # =================================================================
        {
            "id": "Phase_1_Header", "type": "phaseNode", 
            "position": {"x": 200, "y": 0}, "style": {"width": 640, "height": 40, "zIndex": -1}, 
            "data": {"label": "第一阶段：线索捕获与洗筛", "pill": "CAPTURE", "stats": "2 子泳道"}, 
            "draggable": False, "selectable": False
        },
        {
            "id": "Phase_2_Header", "type": "phaseNode", 
            "position": {"x": 860, "y": 0}, "style": {"width": 320, "height": 40, "zIndex": -1}, 
            "data": {"label": "第二阶段：风控与入库", "pill": "PROCESSING", "stats": "1 子泳道"}, 
            "draggable": False, "selectable": False
        },
        
        # =================================================================
        # 2. 垂直泳道 (Sublanes) - 绝对坐标，紧贴在 Phase 下方
        # 🚨 注意：去掉了 parentNode 属性！x 坐标就是它们在全局画板上的真实位置！
        # =================================================================
        {
            "id": "Lane_1_Main", "type": "sublaneNode", 
            "position": {"x": 200, "y": 46}, "style": {"width": 320, "height": 954, "zIndex": 0}, 
            "data": {"label": "▶ 自动抓取主线"}, 
            "draggable": False, "selectable": False
        },
        {
            "id": "Lane_1_Exception", "type": "sublaneNode", 
            "position": {"x": 520, "y": 46}, "style": {"width": 320, "height": 954, "zIndex": 0}, 
            "data": {"label": "🛑 风控阻断分支"}, 
            "draggable": False, "selectable": False
        },
        {
            "id": "Lane_2_Audit", "type": "sublaneNode", 
            "position": {"x": 860, "y": 46}, "style": {"width": 320, "height": 954, "zIndex": 0}, 
            "data": {"label": "⚖️ 人工签批入库区"}, 
            "draggable": False, "selectable": False
        },
        
        # =================================================================
        # 3. 业务节点 (BizNodes) - 绝对坐标，精准落入对应的行列交叉口！
        # =================================================================
        
        # [System 轨道 - Y: 100] | [自动抓取主线 - X: 240]
        {
            "id": "N1_Search", "type": "bizNode", 
            "position": {"x": 240, "y": 100}, "style": {"zIndex": 10}, 
            "data": {
                "label": "全网信息抓取", 
                "components": [{"step_id": "s1", "type": "action", "tool_name": "browser_open", "executor": "system", "params": {"max_retries": 2}}]
            }
        },
        
        # [Agent 轨道 - Y: 350] | [自动抓取主线 - X: 240]
        {
            "id": "N2_Check", "type": "bizNode", 
            "position": {"x": 240, "y": 350}, "style": {"zIndex": 10}, 
            "data": {
                "label": "大模型价值洗筛", 
                "components": [{"step_id": "s2", "type": "judge", "tool_name": "vision_llm_parser", "executor": "agent", "assignee_id": "agent_researcher", "params": {"max_retries": 3}}]
            }
        },
        
        # [System 轨道 - Y: 100] | [风控阻断分支 - X: 560]
        {
            "id": "N4_Fail_Notify", "type": "bizNode", 
            "position": {"x": 560, "y": 100}, "style": {"zIndex": 10}, 
            "data": {
                "label": "低分线索告警", 
                "components": [{"step_id": "s4", "type": "notify", "tool_name": "lark_bot_send", "executor": "system", "params": {}}]
            }
        },
        
        # [Human 轨道 - Y: 600] | [人工签批入库区 - X: 900]
        {
            "id": "N3_CRM_Entry", "type": "bizNode", 
            "position": {"x": 900, "y": 600}, "style": {"zIndex": 10}, 
            "data": {
                "label": "审批写入老旧 CRM", 
                "interrupt_before": True, 
                "components": [
                    {"step_id": "s3_1", "type": "input", "tool_name": "human_approval_form", "executor": "human", "params": {"form_schema": [{"field": "discount_rate", "type": "number", "label": "批准最高折扣", "required": True}]}},
                    {"step_id": "s3_2", "type": "action", "tool_name": "crm_api_submit", "executor": "system", "params": {}}
                ]
            }
        }
    ],
    "edges": [
        {"id": "e1", "source": "N1_Search", "target": "N2_Check", "animated": True, "style": {"stroke": "#3b82f6", "strokeWidth": 2}},
        {"id": "e2", "source": "N2_Check", "target": "N3_CRM_Entry", "label": "高分价值线索 (跨阶段)", "animated": True, "style": {"stroke": "#10b981", "strokeWidth": 2, "strokeDasharray": "5 5"}},
        {"id": "e3", "source": "N2_Check", "target": "N4_Fail_Notify", "label": "价值过低 (告警)", "animated": True, "style": {"stroke": "#ef4444", "strokeWidth": 2}}
    ]
}


@app.get("/api/flows")
async def get_all_flows():
    flows = FileStorage.list_all("flows")
    if not flows:
        print("💡 [System] 首次启动，正在注入默认 Demo 流程资产...")
        FileStorage.save("flows", mock_default_bpnl, mock_default_bpnl["id"])
        flows = [mock_default_bpnl]
    return {"status": "success", "data": flows}

@app.get("/api/flows/{flow_id}")
async def get_flow_by_id(flow_id: str):
    """根据 ID 获取完整的 BPNL 图数据 (带自动兜底生成)"""
    flow_data = FileStorage.get("flows", flow_id)
    
    if not flow_data:
        print(f"⚠️ [API] 在 FileDB 中未找到图纸 {flow_id}。")
        empty_canvas_fallback = {
            "id": flow_id, "name": f"未命名流程 ({flow_id})", "description": "系统自动创建的空画板",
            "nodes": [], "edges": []
        }
        FileStorage.save("flows", empty_canvas_fallback, flow_id)
        return {"status": "success", "data": empty_canvas_fallback, "msg": "已自动为您创建空画板"}
    
    return {"status": "success", "data": flow_data}

# ==============================================================================
# 模块 D：智能体自我进化 API (Optimizer Agent)
# ==============================================================================
class OptimizeRequest(BaseModel):
    flow_id: str
    case_reason: str
    human_action: str

@app.post("/api/optimize_flow")
async def optimize_flow_by_agent(req: OptimizeRequest):
    old_flow = FileStorage.get("flows", req.flow_id)
    if not old_flow:
        return {"status": "error", "msg": "找不到原流程"}

    prompt = f"""
    你是一个工作流优化智能体。请分析现有的 BPNL 流程图 JSON，并根据人类的接管记录对其进行升级修复。
    【失败原因】: {req.case_reason}
    【人类修正方案】: {req.human_action}
    【要求】: 仅输出修改后的 BPNL JSON 代码块。你可以在对应的 Node 中增加参数，或修改连线。
    【原图 JSON】: {json.dumps(old_flow, ensure_ascii=False)}
    """
    
    response = ask_llm(prompt, system_prompt="你必须严格输出 JSON 格式的 BPNL 图。")
    
    if "```json" in response:
        try:
            json_str = response.split("```json")[1].split("```")[0].strip()
            optimized_flow = json.loads(json_str)
            FileStorage.save("flows", optimized_flow, req.flow_id)
            return {"status": "success", "msg": "流程图已根据历史记录优化完成！", "data": optimized_flow}
        except Exception as e:
            return {"status": "error", "msg": str(e)}
            
    return {"status": "error", "msg": "大模型未能生成合法的 JSON"}

# ==============================================================================
# 模块 E：大模型基建配置 (Models)
# ==============================================================================
class ModelConfig(BaseModel):
    id: str
    name: str
    provider: str
    type: str
    api_key: str = ""

@app.get("/api/models")
async def get_system_models():
    models = FileStorage.list_all("models")
    if not models:
        default_models = [
            {"id": "gpt-4o", "name": "GPT-4 Omni", "provider": "OpenAI", "type": "LLM & Vision", "api_key": ""},
            {"id": "deepseek-chat", "name": "DeepSeek V3", "provider": "DeepSeek", "type": "LLM (Reasoning)", "api_key": ""}
        ]
        for m in default_models:
            FileStorage.save("models", m, m["id"])
        models = default_models

    for m in models:
        key = m.get("api_key", "")
        m["status"] = "active" if key and "xxxx" not in key else "error"
        m["api_key_masked"] = f"{key[:5]}...{key[-4:]}" if len(key) > 10 else "***" if key else ""

    return {"status": "success", "data": models}

@app.post("/api/models")
async def add_new_model(model: ModelConfig):
    FileStorage.save("models", model.dict(), model.id)
    return {"status": "success", "msg": "模型配置已保存"}

# ==============================================================================
# 模块 E-2：数字员工资产 API (Agents)
# ==============================================================================
class AgentConfig(BaseModel):
    id: str
    name: str
    role: str
    desc: str
    model: str
    skills: list
    isSystem: bool
    status: str = "active"

@app.get("/api/agents")
async def get_system_agents():
    agents = FileStorage.list_all("agents")
    if not agents:
        default_agents = [
            {"id": "agent_router", "name": "Intent Router (系统主脑)", "role": "System Core", "desc": "负责在 Copilot 窗口接待用户，分析意图，动态生成并分发 SOP。", "model": "gpt-4o", "skills": ["Zero-shot BPNL Gen"], "status": "active", "isSystem": True},
            {"id": "agent_researcher", "name": "Web 调研员", "role": "Executor", "desc": "专精于操控无头浏览器进行深度信息搜集与长文本总结。", "model": "deepseek-chat", "skills": ["browser_use"], "status": "active", "isSystem": False},
            {"id": "agent_auditor", "name": "合规核查员", "role": "Supervisor", "desc": "负责检查关键数据的合规性，判断是否需要呼叫人类。", "model": "qwen-max", "skills": ["rule_engine_eval"], "status": "idle", "isSystem": False}
        ]
        for a in default_agents:
            FileStorage.save("agents", a, a["id"])
        agents = default_agents
    return {"status": "success", "data": agents}

@app.post("/api/agents")
async def save_agent(agent: AgentConfig):
    FileStorage.save("agents", agent.dict(), agent.id)
    return {"status": "success", "msg": "数字员工配置已保存"}

# ==============================================================================
# 模块 E-3：提示词工程资产 API (Prompts)
# ==============================================================================
class PromptConfig(BaseModel):
    id: str
    name: str
    desc: str
    content: str
    tags: list
    version: str = "1.0"

@app.get("/api/prompts")
async def get_system_prompts():
    """获取所有已持久化的提示词资产"""
    prompts = FileStorage.list_all("prompts")
    
    if not prompts:
        default_prompts = [
            {
                "id": "p_router_core", "name": "Intent Router 核心宪法", "desc": "定义了系统主脑如何解析用户意图，并动态输出 BPNL 协议。绝对不可随意修改。",
                "content": "你是 NexaFlow OS 的核心中枢智能体。如果用户要求执行复杂任务，必须输出严格的 JSON 格式...",
                "tags": ["System", "Routing", "BPNL"], "version": "1.0"
            },
            {
                "id": "p_qa_agent", "name": "金牌客服答疑规范", "desc": "规定了售后专员必须使用的语气、赔偿红线及反问话术。",
                "content": "作为金牌客服，你的语气必须专业且克制。最高退款金额不得超过 {max_refund_amount}。在任何情况下不得向用户承认系统存在漏洞...",
                "tags": ["Business", "Customer Service"], "version": "2.1"
            },
            {
                "id": "p_data_extractor", "name": "非结构化数据抽取模板", "desc": "用于从网页快照中提取价格、库存等关键指标，并输出规整的 JSON。",
                "content": "请分析传入的 DOM 或截图，提取以下信息并严格以 JSON 数组返回：[{\"product_name\": \"\", \"price\": 0.0}]...",
                "tags": ["Utility", "Extraction"], "version": "1.0"
            }
        ]
        for p in default_prompts:
            FileStorage.save("prompts", p, p["id"])
        prompts = default_prompts

    return {"status": "success", "data": prompts}

@app.post("/api/prompts")
async def save_prompt(prompt: PromptConfig):
    FileStorage.save("prompts", prompt.dict(), prompt.id)
    return {"status": "success", "msg": "提示词配置已固化至数据库"}


# 💡 记得修改 main.py 里原有的 /api/assets/meta 接口，把 prompts 加进去！
@app.get("/api/assets/meta")
async def get_system_meta_assets():
    domains = ["flows", "models", "skills", "integrations", "monitors", "chats", "agents", "traces", "cases", "workspaces", "prompts"] # <--- 新增 "prompts"
    meta_stats = []

# ==============================================================================
# 模块 F：第三方生态集成 (Integrations)
# ==============================================================================
class IntegrationConfig(BaseModel):
    id: str
    name: str
    desc: str
    type: str
    color: str
    config: dict

@app.get("/api/integrations")
async def get_integrations():
    integrations = FileStorage.list_all("integrations")
    if not integrations:
        default_apps = [
            {"id": "lark", "name": "飞书 (Lark)", "desc": "双向打通：接收飞书群消息指令，向飞书发送执行报告。", "type": "IM & Bot", "color": "bg-[#3370FF]", "config": {"app_id": "", "webhook": ""}},
            {"id": "notion", "name": "Notion", "desc": "知识库同步：自动将抓取的数据格式化并写入指定的 Database。", "type": "Workspace", "color": "bg-slate-800", "config": {"token": ""}},
            {"id": "github", "name": "GitHub", "desc": "研发联动：拉取代码仓库内容进行 Code Review。", "type": "Developer", "color": "bg-[#24292F]", "config": {"personal_access_token": ""}}
        ]
        for app in default_apps:
            FileStorage.save("integrations", app, app["id"])
        integrations = default_apps

    for app in integrations:
        config_values = app.get("config", {}).values()
        is_configured = all(v != "" for v in config_values) and len(config_values) > 0
        app["status"] = "active" if is_configured else "error"
        masked_config = {}
        for k, v in app.get("config", {}).items():
            masked_config[k] = f"{v[:4]}...{v[-4:]}" if len(v) > 10 else ("***" if v else "")
        app["config_masked"] = masked_config

    return {"status": "success", "data": integrations}

@app.post("/api/integrations")
async def save_integration(app_data: IntegrationConfig):
    FileStorage.save("integrations", app_data.dict(), app_data.id)
    return {"status": "success", "msg": "集成配置已保存"}

# ==============================================================================
# 模块 B-6：运行时数据与人工修正账本 (Traces & Cases)
# ==============================================================================
class TraceLog(BaseModel):
    id: str
    flow_id: str
    intent: str
    user: str
    status: str
    time: str
    duration: str

class InterventionCase(BaseModel):
    id: str
    flow_id: str
    node_id: str
    reason: str
    human_action: str
    time: str

@app.get("/api/traces")
async def get_traces():
    traces = FileStorage.list_all("traces")
    if not traces:
        default_traces = [
            {"id": "TRC-10024", "intent": "背调 Shopify 并录入 CRM", "flow_id": "智能拓客与CRM录入", "user": "销售-张三", "status": "success", "time": "10 mins ago", "duration": "45s"},
            {"id": "TRC-10023", "intent": "查一下用户 U-882 的风控", "flow_id": "KYC 自动化复核", "user": "风控-李四", "status": "suspended", "time": "1 hour ago", "duration": "Running"}
        ]
        for t in default_traces:
            FileStorage.save("traces", t, t["id"])
        traces = default_traces
    return {"status": "success", "data": traces}

@app.post("/api/traces")
async def save_trace(trace: TraceLog):
    FileStorage.save("traces", trace.dict(), trace.id)
    return {"status": "success"}

@app.get("/api/cases")
async def get_intervention_cases():
    cases = FileStorage.list_all("cases")
    if not cases:
        default_cases = [
            {"id": "CASE-009", "flow_id": "flow_sdr_001", "node_id": "N3_CRM_Entry", "reason": "找不到[保存]按钮", "human_action": "Clicked XPath: /div/dropdown/li[3]", "time": "Yesterday"},
            {"id": "CASE-008", "flow_id": "flow_kyc_002", "node_id": "N2_AntiFraud", "reason": "新版图形验证码识别失败", "human_action": "Manually solved Captcha slider", "time": "2 days ago"}
        ]
        for c in default_cases:
            FileStorage.save("cases", c, c["id"])
        cases = default_cases
    return {"status": "success", "data": cases}

@app.post("/api/cases")
async def save_case(case_data: InterventionCase):
    FileStorage.save("cases", case_data.dict(), case_data.id)
    return {"status": "success"}

# ==============================================================================
# 模块 G：监控与熔断规则 (Monitors & Guards)
# ==============================================================================
@app.get("/api/monitors")
async def get_monitors():
    monitors = FileStorage.list_all("monitors")
    if not monitors:
        default_rules = [
            {"id": "m_budget", "name": "全局 Token 熔断", "target": "Global", "condition": "Single Run Token > $0.5", "action": "Suspend & Alert", "status": "active"},
            {"id": "m_captcha", "name": "反爬虫/验证码拦截", "target": "Action: browser_open", "condition": "Detect 'CAPTCHA' in DOM", "action": "Suspend & HITL", "status": "active"},
            {"id": "m_sensitive", "name": "敏感数据写入", "target": "Action: crm_api_submit", "condition": "Always", "action": "Require Human Confirm", "status": "active"}
        ]
        for rule in default_rules:
            FileStorage.save("monitors", rule, rule["id"])
        monitors = default_rules
    return {"status": "success", "data": monitors}

# ==============================================================================
# 模块 H：执行总线 WS (LangGraph 运行调度器)
# ==============================================================================
@app.websocket("/ws/state")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("\n🔌 [WebSocket] 前端驾驶舱已连接 WS_STATE!")
    
    try:
        while True:
            raw_data = await websocket.receive_text()
            if raw_data.startswith("START_TASK"):
                flow_id_to_run = raw_data.split("|")[1] if len(raw_data.split("|")) > 1 else "flow_sdr_001"
                
                await websocket.send_json({"type": "log", "msg": f"🚀 [System] 任务点火：准备加载图纸 {flow_id_to_run}..."})
                
                flow_data = FileStorage.get("flows", flow_id_to_run) or mock_default_bpnl
                
                try:
                    schema = FlowSchema(**flow_data)
                    compiler = BPNLCompiler(schema)
                    compiled_graph = compiler.compile()
                    await websocket.send_json({"type": "log", "msg": "✅ [System] LangGraph 内存状态机编译成功，开始流转。"})
                except Exception as compile_err:
                    await websocket.send_json({"type": "log", "msg": f"❌ [System] 编译流程图失败: {compile_err}"})
                    continue
                
                initial_state = AgentState(
                    task_id="task_1001", flow_id=flow_id_to_run, context_data={"has_captcha": False}, traces=[], next_node=""
                )
                
                for output in compiled_graph.stream(initial_state, {"configurable": {"thread_id": "ws_1"}}):
                    node_id = list(output.keys())[0]
                    await websocket.send_json({"type": "node_active", "node_id": node_id})
                    await websocket.send_json({"type": "log", "msg": f"⚙️ [Executor] 进入节点: {node_id}"})
                    await asyncio.sleep(1.5) 
                    await websocket.send_json({"type": "log", "msg": f"✅ [Executor] 节点 {node_id} 执行成功。"})
                    await asyncio.sleep(0.5)

                await websocket.send_json({"type": "log", "msg": "🛑 [Auditor] 流程流转完毕或被规则安全挂起。"})
                await websocket.send_json({"type": "node_active", "node_id": None})
                
    except WebSocketDisconnect:
        pass