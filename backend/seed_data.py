# backend/seed_data.py
import json
import uuid
import os
from pathlib import Path
from app.core.storage import Base, engine, SessionLocal
from app.core.storage import FlowRecord, ModelRecord, AgentRecord, WorkspaceRecord, CaseRecord, GenericAssetRecord, PromptRecord

# 1. 极其激进的操作：为了确保纯净，如果存在旧库，直接物理删除！
DB_PATH = os.path.join(str(Path.home()), ".nexaflow", "data", "nexaflow_v2.db")
if os.path.exists(DB_PATH):
    print(f"🧹 正在删除旧数据库: {DB_PATH}")
    os.remove(DB_PATH)

# 2. 重新创建所有表结构
print("🏗️ 正在创建全新的物理数据表...")
Base.metadata.create_all(bind=engine)

db = SessionLocal()

try:
    print("🌱 正在注入黄金级演示资产 (Golden Seed Data)...")

    # =====================================================================
    # 资产 1：大模型 (Models)
    # =====================================================================
    db.add(ModelRecord(id="gpt-4o", name="GPT-4 Omni", provider="OpenAI", type="LLM & Vision", api_key=""))
    db.add(ModelRecord(id="deepseek-chat", name="DeepSeek V3", provider="DeepSeek", type="LLM (Reasoning)", api_key=""))

    # =====================================================================
    # 资产 2：数字员工 (Agents)
    # =====================================================================
    db.add(AgentRecord(id="agent_router", name="Intent Router (系统主脑)", role="System Core", desc="解析意图，生成SOP", model_id="gpt-4o", skills_json=json.dumps(["Zero-shot BPNL Gen"]), is_system=True, status="active"))
    db.add(AgentRecord(id="agent_researcher", name="Web 调研员", role="Executor", desc="操控无头浏览器搜集信息", model_id="deepseek-chat", skills_json=json.dumps(["browser_use"]), is_system=False, status="active"))

    # =====================================================================
    # 资产 3：极其完美的二维矩阵图纸 (Flows)
    # =====================================================================
    perfect_flow = {
        "id": "flow_sdr_001",
        "name": "智能拓客与CRM录入 (四相矩阵版)",
        "description": "全网搜集客户线索，经大模型洗筛后，要求人类审批，最终写入老旧 CRM。",
        "nodes": [
            {"id": "Phase_1_Header", "type": "phaseNode", "position": {"x": 200, "y": 0}, "style": {"width": 640, "height": 40, "zIndex": -1}, "data": {"label": "第一阶段：线索捕获与洗筛", "pill": "CAPTURE", "stats": "2 子泳道"}},
            {"id": "Phase_2_Header", "type": "phaseNode", "position": {"x": 860, "y": 0}, "style": {"width": 320, "height": 40, "zIndex": -1}, "data": {"label": "第二阶段：风控与入库", "pill": "PROCESSING", "stats": "1 子泳道"}},
            {"id": "Lane_1_Main", "type": "sublaneNode", "position": {"x": 200, "y": 46}, "style": {"width": 320, "height": 954, "zIndex": 0}, "data": {"label": "▶ 自动抓取主线"}},
            {"id": "Lane_1_Exception", "type": "sublaneNode", "position": {"x": 520, "y": 46}, "style": {"width": 320, "height": 954, "zIndex": 0}, "data": {"label": "🛑 风控阻断分支"}},
            {"id": "Lane_2_Audit", "type": "sublaneNode", "position": {"x": 860, "y": 46}, "style": {"width": 320, "height": 954, "zIndex": 0}, "data": {"label": "⚖️ 人工签批入库区"}},
            {"id": "N1_Search", "type": "bizNode", "position": {"x": 240, "y": 100}, "style": {"zIndex": 10}, "data": {"label": "全网信息抓取", "components": [{"step_id": "s1", "type": "action", "tool_name": "browser_open", "executor": "system", "params": {"max_retries": 2}}]}},
            {"id": "N2_Check", "type": "bizNode", "position": {"x": 240, "y": 350}, "style": {"zIndex": 10}, "data": {"label": "大模型价值洗筛", "components": [{"step_id": "s2", "type": "judge", "tool_name": "vision_llm_parser", "executor": "agent", "assignee_id": "agent_researcher", "params": {"max_retries": 3}}]}},
            {"id": "N4_Fail_Notify", "type": "bizNode", "position": {"x": 560, "y": 100}, "style": {"zIndex": 10}, "data": {"label": "低分线索告警", "components": [{"step_id": "s4", "type": "notify", "tool_name": "lark_bot_send", "executor": "system", "params": {}}]}},
            {"id": "N3_CRM_Entry", "type": "bizNode", "position": {"x": 900, "y": 600}, "style": {"zIndex": 10}, "data": {"label": "审批写入老旧 CRM", "interrupt_before": True, "components": [{"step_id": "s3_1", "type": "input", "tool_name": "human_approval_form", "executor": "human", "params": {"form_schema": [{"field": "discount_rate", "type": "number", "label": "批准最高折扣", "required": True}]}}, {"step_id": "s3_2", "type": "action", "tool_name": "crm_api_submit", "executor": "system", "params": {}}]}}
        ],
        "edges": [
            {"id": "e1", "source": "N1_Search", "target": "N2_Check", "animated": True, "style": {"stroke": "#3b82f6", "strokeWidth": 2}},
            {"id": "e2", "source": "N2_Check", "target": "N3_CRM_Entry", "label": "高分价值线索 (跨阶段)", "animated": True, "style": {"stroke": "#10b981", "strokeWidth": 2, "strokeDasharray": "5 5"}},
            {"id": "e3", "source": "N2_Check", "target": "N4_Fail_Notify", "label": "价值过低 (告警)", "animated": True, "style": {"stroke": "#ef4444", "strokeWidth": 2}}
        ]
    }
    db.add(FlowRecord(id=perfect_flow["id"], name=perfect_flow["name"], description=perfect_flow["description"], nodes_json=json.dumps(perfect_flow["nodes"], ensure_ascii=False), edges_json=json.dumps(perfect_flow["edges"], ensure_ascii=False)))

    # =====================================================================
    # 资产 4：群聊记忆 (Workspaces)
    # =====================================================================
    mock_messages = [
        {"id": "m1", "type": "system", "text": "Welcome to #营销活动与增长 channel.", "time": "09:00 AM"},
        {"id": "m2", "type": "human", "user": "产品经理 (我)", "text": "@Web 调研员 帮我整理一下竞品 Shopify 的最新动态，准备生成日报。", "time": "09:05 AM"},
        {"id": "m3", "type": "agent", "agentId": "agent_researcher", "agentName": "Web 调研员", "text": "收到。已为您检索并匹配到标准的业务流。请点击执行。", "time": "09:06 AM", "isAction": True, "actionCard": {"title": "智能拓客与CRM录入", "nodes": 4, "flow_id": "flow_sdr_001"}}
    ]
    db.add(WorkspaceRecord(id="marketing", name="营销活动与增长", desc="与 Agent 共同策划", unread=2, messages_json=json.dumps(mock_messages, ensure_ascii=False)))

    # =====================================================================
    # 资产 5：人工纠错账本 (Cases) - 用于展示 Optimizer 能力
    # =====================================================================
    db.add(CaseRecord(id="CASE-009", flow_id="flow_sdr_001", node_id="N3_CRM_Entry", reason="找不到[Save]按钮", human_action="Clicked XPath: /div/dropdown/li[3]", time="Yesterday"))

    # 提交所有事务
    db.commit()
    print("✅ 黄金种子数据已成功注入！")
    print("🚀 您的 NexaFlow POC 环境已处于完美展示状态，随时可以录制 Demo 或开源发布！")

except Exception as e:
    db.rollback()
    print(f"❌ 注入失败: {e}")
finally:
    db.close()