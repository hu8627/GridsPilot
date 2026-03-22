import json
import uuid
from app.execution.llm import ask_llm
from app.core.storage import FileStorage

MASTER_ROUTER_PROMPT = """
你是 NexaFlow OS 的核心中枢智能体 (Intent Router)。你的职责是解析用户的输入指令。

【判断逻辑】：
1. 如果用户只是进行普通问候、闲聊、或询问通用信息 -> 直接用自然语言回答即可，不要输出 JSON。
2. 如果用户要求执行一个【复杂的业务流程】（如：抓取数据、多步操作、判断、写入系统、发送通知） -> 你必须立即设计一个 SOP 流程，并输出 JSON 格式的 BPNL (业务流程节点图) 协议，让系统将其渲染为可视化拖拽图。

【BPNL JSON 协议规范】：
如果你决定生成 SOP，请严格输出以下 JSON 格式（必须且只能包裹在 ```json 和 ``` 之间）：
{
  "intent_type": "CREATE_SOP",
  "sop_name": "流程名称（如：智能拓客与CRM录入）",
  "extracted_params": {"提取的上下文变量名": "值"},
  "bpnl": {
    "nodes": [
      {
        "id": "节点ID（必须以 N_ 开头，如 N_Search）", 
        "data": { 
          "label": "节点展示名称", 
          "interrupt_before": false, 
          "components": [
            {
              "type": "组件类型（只能从这四个选: action, judge, notify, record）", 
              "tool_name": "具体调用的动作名（如 browser_open, vision_llm, crm_submit, dingtalk_bot）"
            }
          ] 
        }
      }
    ],
    "edges": [
      {
        "id": "连线ID（必须以 E_ 开头，如 E_1）", 
        "source": "起点节点ID", 
        "target": "终点节点ID", 
        "label": "连线条件说明（如：'Has Captcha'，无条件则留空）",
        "condition": "如果是条件判断后的分支，用简单的表达式描述，如 context_data.get('success') == True，无条件则不要传此字段"
      }
    ]
  }
}

【设计要求】：
1. 节点设计必须合理，且必须是链式或分支结构（DAG 有向无环图）。
2. 如果任务涉及“写入重要数据”或“执行高危操作”（如付款、最终拒绝、写入 CRM），建议将其对应的节点属性 "interrupt_before" 设置为 true，这会触发 NexaFlow 的 Auditor 人工审核熔断机制。
3. 请确保 edges 中的 source 和 target ID 必须真实存在于 nodes 列表中。
"""
def process_chat_intent(user_input: str) -> dict:
    response_text = ask_llm(prompt=user_input, system_prompt=MASTER_ROUTER_PROMPT)
    
    if "```json" in response_text:
        try:
            json_str = response_text.split("```json")[1].split("```")[0].strip()
            sop_data = json.loads(json_str)
            
            new_flow_id = f"flow_auto_{uuid.uuid4().hex[:6]}"
            flow_name = sop_data.get('sop_name', 'AI 动态生成流程')
            
            bpnl_asset = {
                "id": new_flow_id,
                "name": flow_name,
                "description": f"由 Chat 意图自动生成的业务流：{user_input}",
                "nodes": sop_data.get('bpnl', {}).get('nodes', []),
                "edges": sop_data.get('bpnl', {}).get('edges', [])
            }
            
            # 💡 核心：保存到硬盘
            FileStorage.save(domain="flows", data=bpnl_asset, file_id=new_flow_id)
            
            return {
                "type": "COMPLEX_TASK",
                "message": f"✅ 我已经为您动态生成了业务流程：**{flow_name}**。\n该资产已保存为 `{new_flow_id}`。",
                "sop_data": sop_data,
                "flow_id": new_flow_id 
            }
        except Exception as e:
            return {"type": "GENERAL_CHAT", "message": f"我在尝试生成流程时遇到了错误: {str(e)}"}
    else:
        return {"type": "GENERAL_CHAT", "message": response_text}