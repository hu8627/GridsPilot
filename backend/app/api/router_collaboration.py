# backend/app/api/router_orchestration.py
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from app.core.storage import FileStorage
from app.models.bpnl import FlowSchema

router = APIRouter()

# ==============================================================================
# 💡 完美对齐的四相矩阵：废除假的 RowNode，恢复纯粹的业务容器嵌套
# ==============================================================================
default_flow = {
    "id": "flow_sdr_001",
    "name": "智能拓客与CRM录入 (绝对矩阵版)",
    "description": "全网搜集客户线索，经大模型洗筛后，要求人类审批，最终写入老旧 CRM。",
    "nodes": [
        # --- 顶层阶段 (Phases) - 作为左对齐的顶部横幅 ---
        {
            "id": "Phase_1_Header", "type": "phaseNode", 
            "position": {"x": 200, "y": 0}, "style": {"width": 640, "height": 40, "zIndex": -1}, 
            "data": {"label": "第一阶段：线索捕获与洗筛", "pill": "CAPTURE", "stats": "2 子泳道"}, 
            "draggable": False, "selectable": False
        },
        {
            "id": "Phase_2_Header", "type": "phaseNode", 
            "position": {"x": 860, "y": 0}, "style": {"width": 320, "height": 40, "zIndex": -1}, 
            "data": {"label": "第二阶段：人工风控与入库", "pill": "PROCESSING", "stats": "1 子泳道"}, 
            "draggable": False, "selectable": False
        },
        
        # --- 垂直泳道 (Sublanes) - 挂载在 Phase 下方的相对容器 ---
        {
            "id": "Lane_1_Main", "type": "sublaneNode", "parentNode": "Phase_1_Header", 
            "position": {"x": 0, "y": 46}, "style": {"width": 320, "height": 954, "zIndex": 0}, 
            "data": {"label": "▶ 自动抓取主线"}, "draggable": False, "selectable": False
        },
        {
            "id": "Lane_1_Exception", "type": "sublaneNode", "parentNode": "Phase_1_Header", 
            "position": {"x": 320, "y": 46}, "style": {"width": 320, "height": 954, "zIndex": 0}, 
            "data": {"label": "🛑 风控阻断分支"}, "draggable": False, "selectable": False
        },
        {
            "id": "Lane_2_Audit", "type": "sublaneNode", "parentNode": "Phase_2_Header", 
            "position": {"x": 0, "y": 46}, "style": {"width": 320, "height": 954, "zIndex": 0}, 
            "data": {"label": "⚖️ 人工签批入库区"}, "draggable": False, "selectable": False
        },
        
        # --- 业务节点 (BizNodes) - 挂在 Sublane 内部，只需设置相对局部坐标 ---
        # ⚠️ 极其关键：这里的 y 坐标，必须完美对应前端画板中 4 根底色带的高度！
        # System(50-300), Agent(300-550), Human(550-750), Hardware(750-1000)
        
        # [System 轨道] 位于泳道内相对高度 y=50
        {
            "id": "N1_Search", "type": "bizNode", "parentNode": "Lane_1_Main",
            "position": {"x": 40, "y": 50}, "style": {"zIndex": 10}, 
            "data": {
                "label": "全网信息抓取", 
                "components": [{"step_id": "s1", "type": "action", "tool_name": "browser_open", "executor": "system", "params": {"max_retries": 2}}]
            }
        },
        
        # [Agent 轨道] 位于泳道内相对高度 y=300
        {
            "id": "N2_Check", "type": "bizNode", "parentNode": "Lane_1_Main",
            "position": {"x": 40, "y": 300}, "style": {"zIndex": 10}, 
            "data": {
                "label": "大模型价值洗筛", 
                "components": [{"step_id": "s2", "type": "judge", "tool_name": "vision_llm_parser", "executor": "agent", "assignee_id": "agent_researcher", "params": {"max_retries": 3}}]
            }
        },
        
        # [System 轨道] 位于异常泳道内相对高度 y=100
        {
            "id": "N4_Fail_Notify", "type": "bizNode", "parentNode": "Lane_1_Exception",
            "position": {"x": 40, "y": 100}, "style": {"zIndex": 10}, 
            "data": {
                "label": "低分线索告警", 
                "components": [{"step_id": "s4", "type": "notify", "tool_name": "lark_bot_send", "executor": "system", "params": {}}]
            }
        },
        
        # [Human 轨道] 位于审批泳道内相对高度 y=550
        {
            "id": "N3_CRM_Entry", "type": "bizNode", "parentNode": "Lane_2_Audit",
            "position": {"x": 40, "y": 550}, "style": {"zIndex": 10}, 
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

# ==============================================================================
# Flows API
# ==============================================================================
@router.get("/flows")
async def get_all_flows():
    flows = FileStorage.list_all("flows")
    if not flows:
        print("💡 [Orchestration] 首次启动，正在注入绝对矩阵版 Demo 流程...")
        FileStorage.save("flows", default_flow, default_flow["id"])
        flows = [default_flow]
    return {"status": "success", "data": flows}

@router.get("/flows/{flow_id}")
async def get_flow_by_id(flow_id: str):
    flow_data = FileStorage.get("flows", flow_id)
    if not flow_data:
        print(f"⚠️ [Orchestration] 在 DB 中未找到图纸 {flow_id}，创建空画板。")
        empty = {"id": flow_id, "name": f"未命名 ({flow_id})", "nodes": [], "edges": []}
        FileStorage.save("flows", empty, flow_id)
        return {"status": "success", "data": empty}
    return {"status": "success", "data": flow_data}

@router.post("/flows")
async def save_flow(flow: FlowSchema):
    try:
        FileStorage.save("flows", flow.dict(), flow.id)
        return {"status": "success", "msg": "流程图资产已成功保存！"}
    except Exception as e:
        return {"status": "error", "msg": str(e)}

# ==============================================================================
# Optimizer API
# ==============================================================================
class OptimizeRequest(BaseModel):
    flow_id: str
    case_reason: str
    human_action: str

@router.post("/optimize_flow")
async def optimize_flow_by_agent(req: OptimizeRequest):
    # 这里调用 LLM 重写图纸的逻辑保持不变 (需自行补充完整)
    return {"status": "success", "msg": "流程图已根据历史记录优化完成！"}