import asyncio
import time
from typing import Dict, Any, Callable
from langgraph.graph import StateGraph, END
from app.models.bpnl import FlowSchema, NodeSchema, EdgeSchema
from app.engine.state import AgentState

# 💡 引入真实的具身浏览器技能 (Browser Skill)
from app.execution.skills.browser_skill import execute_browser_task

class BPNLCompiler:
    """
    NexaFlow 核心编译器：BPNL Schema -> LangGraph StateGraph (Async Mode)
    """
    def __init__(self, flow_schema: FlowSchema):
        self.flow = flow_schema
        self.workflow = StateGraph(AgentState)
        
    def _create_node_executor(self, node: NodeSchema) -> Callable:
        """
        闭包工厂：将静态的 NodeSchema 包装成 LangGraph 可执行的 Python 节点函数
        """
        # 💡 核心升级：将普通 def 改为 async def，允许我们在节点里进行长时间的物理抓取和模型请求
        async def execute_node(state: AgentState) -> dict:
            print(f"\n[🚀 引擎执行] 进入节点: {node.name} ({node.id})")
            
            node_logs = []
            context = state.get("context_data", {})
            
            # 遍历该节点内配置的原子组件 (Component)
            for comp in node.components:
                print(f"   ├─ 执行组件 [{comp.type.value.upper()}]: {comp.tool_name}")
                
                # =========================================================
                # ⚔️ 真实物理执行层 (Execution Routing)
                # =========================================================
                if comp.tool_name in ["browser_open", "browser_use"]:
                    # 1. 从组件配置里拿指令，没写就给个酷炫的默认指令测试
                    instruction = comp.params.get(
                        "instruction", 
                        "打开 Hacker News (news.ycombinator.com)，提取目前排在第一位的新闻标题，并返回文本。"
                    )
                    
                    # 2. 调用 Browser-Use 操控真实浏览器！
                    node_logs.append(f"🌐 正在启动无头浏览器并执行指令: {instruction}")
                    print("   │  (正在召唤大模型分析 DOM 树，请耐心等待...)")
                    
                    result = await execute_browser_task(instruction)
                    
                    if result["status"] == "success":
                        success_msg = f"✅ 网页操作成功。抓取结果:\n{result['result']}"
                        node_logs.append(success_msg)
                        print(f"   └─ {success_msg}")
                        # 💡 极其重要：把抓取到的数据写进全局上下文，供后续的节点或 Supervisor 使用！
                        context["browser_result"] = result["result"]
                    else:
                        error_msg = f"❌ 网页操作失败: {result['message']}"
                        node_logs.append(error_msg)
                        print(f"   └─ {error_msg}")
                        # 给路由引擎留个标记，让连线可以走重试分支
                        context["has_error"] = True 

                # =========================================================
                # 💡 其他组件（如 vision_llm, crm_api_submit, dingtalk_bot）
                # 暂未实现真实物理逻辑的，我们先用 sleep 模拟
                # =========================================================
                else:
                    await asyncio.sleep(1.5) # 模拟真实耗时
                    msg = f"✅ 组件 {comp.tool_name} 模拟执行完成。"
                    node_logs.append(msg)
                    print(f"   └─ {msg}")
            
            # 记录轨迹
            new_trace = {
                "node_id": node.id, 
                "status": "success",
                "logs": "\n".join(node_logs)
            }
            
            return {
                "traces": [new_trace], # 会被 operator.add 追加
                "context_data": context # 把修改过的上下文更新回状态机
            }
            
        return execute_node

    def _create_router(self, edges: list[EdgeSchema]) -> Callable:
        """
        闭包工厂：创建 Supervisor 路由函数
        解析 BPNL 中的条件表达式，决定下一步去哪
        """
        def route(state: AgentState) -> str:
            # 将整个 context_data 作为一个名为 "context_data" 的变量注入 eval 环境
            env = {"context_data": state.get("context_data", {})}
            
            for edge in edges:
                if not edge.condition:
                    continue
                # 警告：生产环境必须替换为安全的规则引擎！
                try:
                    if eval(edge.condition, {}, env):
                        print(f"   └─ ⚡ [Supervisor 路由] 命中条件 '{edge.condition}', 流向 -> {edge.target}")
                        return edge.target
                except Exception as e:
                    print(f"   └─ ❌ [路由报错] 评估条件 '{edge.condition}' 失败: {e}")
            
            # 如果没有条件命中，找一条无条件的默认连线
            default_edge = next((e for e in edges if not e.condition), None)
            if default_edge:
                print(f"   └─ ⚡ [Supervisor 路由] 走默认连线 -> {default_edge.target}")
                return default_edge.target
            
            print("   └─ 🏁 [Supervisor 路由] 终点 (END)")
            return END

        return route

    def compile(self):
        """
        执行图的组装与编译
        """
        interrupt_nodes = []
        
        # 1. 注册所有节点 (Nodes)
        for node in self.flow.nodes:
            self.workflow.add_node(node.id, self._create_node_executor(node))
            if node.interrupt_before:
                interrupt_nodes.append(node.id)

        # 2. 注册所有连线 (Edges / Routers)
        edges_by_source: Dict[str, list[EdgeSchema]] = {}
        for edge in self.flow.edges:
            edges_by_source.setdefault(edge.source, []).append(edge)

        for source_id, outgoing_edges in edges_by_source.items():
            if len(outgoing_edges) == 1 and not outgoing_edges[0].condition:
                self.workflow.add_edge(source_id, outgoing_edges[0].target)
            else:
                path_map = {e.target: e.target for e in outgoing_edges}
                path_map[END] = END 
                self.workflow.add_conditional_edges(
                    source_id,
                    self._create_router(outgoing_edges),
                    path_map
                )

        # 3. 设置入口节点
        all_targets = {e.target for e in self.flow.edges}
        start_nodes = [n.id for n in self.flow.nodes if n.id not in all_targets]
        if start_nodes:
            self.workflow.set_entry_point(start_nodes[0])
        else:
            self.workflow.set_entry_point(self.flow.nodes[0].id)

        # 4. 编译输出
        print(f"\n⚙️ NexaFlow 编译器: 流程 [{self.flow.name}] 编译完成！包含 {len(self.flow.nodes)} 个节点。")
        if interrupt_nodes:
            print(f"⚠️ 挂载 Auditor 拦截点: {interrupt_nodes}")
            
        return self.workflow.compile(interrupt_before=interrupt_nodes)