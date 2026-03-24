# backend/app/models/bpnl.py
from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

# ==============================================================================
# 1. 基础枚举类型 (Enums)
# ==============================================================================

class ComponentType(str, Enum):
    ACTION = "action"     # 纯软件动作：如 API调用、读写文件
    JUDGE = "judge"       # 逻辑判断：如 LLM 分析、规则引擎过滤
    RECORD = "record"     # 数据记录：如 写入数据库、追加至 Notion
    NOTIFY = "notify"     # 消息通知：如 发送邮件、企业微信/Slack告警
    INPUT = "input"       # 🧑‍💻 人类输入：流程跑到这里必须强制挂起，推送动态表单供人类填写
    CONFIRM = "confirm"   # 🧑‍💻 人类确认：极简审批，只需人类点击同意或拒绝（二选一）
    PHYSICAL = "physical" # 🦾 物理动作：驱动外部硬件 (如: 控制机械臂 'move_arm', 开启水泵 'turn_on_pump')

class ExecutorType(str, Enum):
    """
    四权分立架构的核心：决定原子组件的执行主体和算力/物理来源
    """
    SYSTEM = "system"     # ⚙️ 确定性纯软件基建 (如: 发邮件、写数据库、标准 API 请求)
    AGENT = "agent"       # 🧠 智能体推理代码 (如: LLM 总结、Browser-use 非结构化网页冲浪)
    HUMAN = "human"       # 🧑‍💻 人类干预节点 (如: 审批表单、填写扭曲验证码、确认打款)
    HARDWARE = "hardware" # 🦾 物理世界驱动！控制机械臂、传感器、IoT 继电器等实体设备

# ==============================================================================
# 2. BPNL 核心协议定义 (The Protocol Schema)
# ==============================================================================

class ComponentSchema(BaseModel):
    """
    节点内部的原子动作 (Component / Skill)
    """
    step_id: str
    type: ComponentType
    tool_name: str = Field(..., description="底层调用的原子工具、表单名或硬件驱动指令，如 'browser_click', 'notion_append', 'turn_on_pump'")
    
    # 💡 核心升级：四权分立的执行器。
    # 引擎会根据这个字段，决定是直接运行 Python (System)、去调大模型 (Agent)、挂起推送 Inbox (Human)，还是发送串口/网络指令给物理设备 (Hardware)。
    executor: ExecutorType = Field(default=ExecutorType.SYSTEM, description="该组件的执行主体")
    
    # 💡 强关联调度：如果是 AGENT 执行，必须指定挂载了哪个大脑；如果是 HARDWARE 执行，必须指定挂载了哪台设备的 ID。
    assignee_id: Optional[str] = Field(None, description="如果 executor=agent，这里填具体的 Agent ID (如 agent_researcher)；如果 executor=hardware，这里填设备 MAC 或别名 (如 pump_01)")
    
    # 动态参数：可以是 API Payload，也可以是要求人类输入的动态表单 Form Schema，或者是硬件的运动参数
    params: Dict[str, Any] = Field(default_factory=dict, description="工具参数、表单配置或硬件指令负荷")

class NodeSchema(BaseModel):
    """
    业务阶段节点 (Node)
    """
    id: str
    name: str
    description: Optional[str] = None
    components: List[ComponentSchema] = Field(default_factory=list, description="节点内按顺序执行的原子动作列表")
    
    # PNSA 架构控制参数
    max_retries: int = Field(default=3, description="该节点的最大重试次数")
    
    # 💡 核心断点：无论节点内部是什么组件，只要开启此项，到达该节点前系统将强制挂起，进行安全确认。
    # 对于包含 executor="hardware" 的节点，在生产环境中强烈建议将此项设为 True。
    interrupt_before: bool = Field(default=False, description="Auditor 机制：执行该节点前是否强制人工确认 (HITL)")
    
    # UI 排版信息 (由前端 React Flow 生成并持久化)
    parentNode: Optional[str] = Field(None, description="嵌套关系：所属的 Sublane 容器 ID")
    extent: Optional[str] = Field(None, description="React Flow 属性：限制拖拽范围 (如 'parent')")
    style: Dict[str, Any] = Field(default_factory=dict)
    position: Dict[str, float] = Field(default={"x": 0, "y": 0}, description="前端画布绝对/相对坐标")
    data: Dict[str, Any] = Field(default_factory=dict, description="节点展示元数据，如 label, stats")
    type: str = Field(default="bizNode", description="React Flow 的节点类型 (bizNode, phaseNode, sublaneNode)")

class EdgeSchema(BaseModel):
    """
    有向无环图连线 (Edge / Supervisor Route)
    """
    id: str
    source: str
    target: str
    condition: Optional[str] = Field(None, description="Supervisor 路由条件表达式，如 'context_data.get(\"success\") == True'")
    label: Optional[str] = None
    animated: Optional[bool] = False
    style: Dict[str, Any] = Field(default_factory=dict)

class FlowSchema(BaseModel):
    """
    完整的业务图纸资产 (The BPNL Workflow)
    """
    id: str
    name: str
    description: Optional[str] = Field(None, description="该流程的业务意图、适用场景或合规说明")
    nodes: List[NodeSchema]
    edges: List[EdgeSchema]