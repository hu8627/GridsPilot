# backend/app/api/router_orchestration.py
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from app.core.storage import FileStorage
from app.models.bpnl import FlowSchema
from app.execution.llm import ask_llm

router = APIRouter()

# 我们之前调试好的精美 4 轨道默认图纸 (为了代码整洁，你可以把它提取到一个独立的 fixtures 模块里，这里简写)
default_flow = {"id": "flow_sdr_001", "name": "智能拓客与CRM录入", "nodes": [], "edges": []} 

@router.get("/flows")
async def get_all_flows():
    flows = FileStorage.list_all("flows")
    if not flows:
        FileStorage.save("flows", default_flow, default_flow["id"])
        flows = [default_flow]
    return {"status": "success", "data": flows}

@router.get("/flows/{flow_id}")
async def get_flow_by_id(flow_id: str):
    flow_data = FileStorage.get("flows", flow_id)
    if not flow_data:
        empty = {"id": flow_id, "name": f"未命名 ({flow_id})", "nodes": [], "edges": []}
        FileStorage.save("flows", empty, flow_id)
        return {"status": "success", "data": empty}
    return {"status": "success", "data": flow_data}

@router.post("/flows")
async def save_flow(flow: FlowSchema):
    FileStorage.save("flows", flow.dict(), flow.id)
    return {"status": "success"}

class OptimizeRequest(BaseModel):
    flow_id: str
    case_reason: str
    human_action: str

@router.post("/optimize_flow")
async def optimize_flow_by_agent(req: OptimizeRequest):
    # ... Optimizer Agent 的重写逻辑 (调用 LLM)
    return {"status": "success", "msg": "流程图已根据历史记录优化完成！"}