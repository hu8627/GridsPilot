from typing import TypedDict, Annotated, Dict, Any, List
import operator

class AgentState(TypedDict):
    """
    NexaFlow 全局运行状态 (The Context)
    在 LangGraph 的节点流转中，这个字典会被不断传递和修改
    """
    task_id: str
    flow_id: str
    
    # 核心记忆区：存放 AI 提取的数据、API 返回值、或者用于条件路由的变量
    # 比如: {"country": "US", "has_captcha": True, "retry_count": 1}
    context_data: Dict[str, Any]
    
    # 执行轨迹日志 (Annotated + operator.add 表示这是一个追加写入的列表)
    traces: Annotated[List[dict], operator.add]
    
    # 内部路由标记：用于告诉 Supervisor 下一步该去哪个节点
    next_node: str