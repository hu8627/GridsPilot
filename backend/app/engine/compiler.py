import time
from typing import Dict, Any, Callable
from langgraph.graph import StateGraph, END
from app.models.bpnl import FlowSchema, NodeSchema, EdgeSchema
from app.engine.state import AgentState

class BPNLCompiler:
    """
    NexaFlow 核心编译器：BPNL Schema -> LangGraph StateGraph
    """
    def __init__(self, flow_schema: FlowSchema):
        self.flow = flow_schema
        self.workflow = StateGraph(AgentState)
        
    def _create_node_executor(self, node: NodeSchema) -> Callable:
        """
        闭包工厂：将静态的 NodeSchema 包装成 LangGraph 可执行的 Python 节点函数
        """
        def execute_node(state: AgentState) -> dict:
            print(f"\n[🚀 引擎执行] 进入节点: {node.name} ({node.id})")
            
            # 这里是具体的组件执行逻辑 (Action, Judge, Record)
            # POC 阶段我们先用打印模拟，后续这里会拉起 browser-use 或 LLM
            for comp in node.components:
                print(f"   ├─ 执行组件 [{comp.type.value.upper()}]: {comp.tool_name}")
                time.sleep(0.5) # 模拟执行耗时
            
            # 记录轨迹
            new_trace = {
                "node_id": node.id, 
                "status": "success",
                "logs": f"Executed {len(node.components)} components."
            }
            
            return {
                "traces": [new_trace] # 注意：因为 state.py 里用了 operator.add，这里返回列表会自动追加
            }
            
        return execute_node

    def _create_router(self, edges: list[EdgeSchema]) -> Callable:
        """
        闭包工厂：创建 Supervisor 路由函数
        解析 BPNL 中的条件表达式，决定下一步去哪
        """
        def route(state: AgentState) -> str:
            # 💡 修复：将整个 context_data 作为一个名为 "context_data" 的变量注入 eval 环境
            env = {"context_data": state.get("context_data", {})}
            
            for edge in edges:
                if not edge.condition:
                    continue
                # 警告：POC 阶段为了快，直接用 eval 解析字符串条件 (如 "country == 'US'")
                # 生产环境必须替换为安全的规则引擎 (如 simpleeval 或 asteval)！
                try:
                    # 将 context_data 展开作为局部变量供条件判断
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
        # 1. 注册所有节点 (Nodes)
        interrupt_nodes = []
        for node in self.flow.nodes:
            self.workflow.add_node(node.id, self._create_node_executor(node))
            if node.interrupt_before:
                interrupt_nodes.append(node.id)

        # 2. 注册所有连线 (Edges / Routers)
        # 将连线按起点 (source) 分组
        edges_by_source: Dict[str, list[EdgeSchema]] = {}
        for edge in self.flow.edges:
            edges_by_source.setdefault(edge.source, []).append(edge)

        for source_id, outgoing_edges in edges_by_source.items():
            if len(outgoing_edges) == 1 and not outgoing_edges[0].condition:
                # 只有一条无条件直线，使用普通边
                self.workflow.add_edge(source_id, outgoing_edges[0].target)
            else:
                # 有分支或条件，注册为条件边 (Conditional Edge)
                # target_mapping 用于告诉 LangGraph 所有可能的目标节点，做图校验
                path_map = {e.target: e.target for e in outgoing_edges}
                path_map[END] = END 
                
                self.workflow.add_conditional_edges(
                    source_id,
                    self._create_router(outgoing_edges),
                    path_map
                )

        # 3. 设置入口节点 (默认找没有被任何 target 指向的节点)
        all_targets = {e.target for e in self.flow.edges}
        start_nodes = [n.id for n in self.flow.nodes if n.id not in all_targets]
        if start_nodes:
            self.workflow.set_entry_point(start_nodes[0])
        else:
            # 防御性回退
            self.workflow.set_entry_point(self.flow.nodes[0].id)

        # 4. 编译输出最终图！(挂载 A: Auditor 熔断点)
        print(f"\n⚙️ NexaFlow 编译器: 流程 [{self.flow.name}] 编译完成！包含 {len(self.flow.nodes)} 个节点。")
        if interrupt_nodes:
            print(f"⚠️ 挂载 Auditor 拦截点: {interrupt_nodes}")
            
        return self.workflow.compile(interrupt_before=interrupt_nodes)