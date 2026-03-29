# backend/app/engine/compiler.py
import asyncio
import time
import re
import sqlite3 
import os
from pathlib import Path
from typing import Dict, Any, Callable

from langgraph.graph import StateGraph, END
from langgraph.checkpoint.sqlite import SqliteSaver

from app.models.bpnl import FlowSchema, NodeSchema, EdgeSchema
from app.engine.state import AgentState

# 💡 引入真实的具身浏览器技能 (Browser Skill)
from app.execution.skills.browser_skill import execute_browser_task

# ==============================================================================
# 💡 战役二核心：配置 LangGraph 的专属断点记忆库 (Checkpoints DB)
# 我们把它和主数据库放在同一个目录下，物理隔离业务数据和运行时快照
# ==============================================================================
USER_HOME = str(Path.home())
CHECKPOINT_DB_PATH = os.path.join(USER_HOME, ".gridspilot", "data", "checkpoints.db")
os.makedirs(os.path.dirname(CHECKPOINT_DB_PATH), exist_ok=True)
# 创建持久化的 SQLite 连接 (作为图纸挂起与恢复的物理冷冻舱)
conn = sqlite3.connect(CHECKPOINT_DB_PATH, check_same_thread=False)
memory_saver = SqliteSaver(conn)


class BPNLCompiler:
    """
    GridsPilot 核心编译器：BPNL Schema -> LangGraph StateGraph (Async Mode)
    支持底层原子动作的动态复用与上下文变量插值 {{context.xxx}}。
    """
    def __init__(self, flow_schema: FlowSchema):
        self.flow = flow_schema
        self.workflow = StateGraph(AgentState)
        
    def _create_node_executor(self, node: NodeSchema) -> Callable:
        """
        闭包工厂：将静态的 NodeSchema 包装成 LangGraph 可执行的 Python 节点函数
        """
        async def execute_node(state: AgentState) -> dict:
            print(f"\n[🚀 引擎执行] 进入节点: {node.name} ({node.id})")
            
            node_logs = []
            context = state.get("context_data", {})
            
            # =========================================================
            # 💡 神级核心：动态参数解析引擎 (Variable Interpolation)
            # =========================================================
            def resolve_params(params_dict: dict, current_context: dict) -> dict:
                """
                递归解析组件 Params 里的 {{context.xxx}} 模板变量，
                将其替换为上游节点写入 state.context_data 中的真实值。
                """
                resolved = {}
                for key, value in params_dict.items():
                    if isinstance(value, str):
                        # 查找所有 {{...}} 格式的变量，如 "{{context.daily_summary}}"
                        matches = re.findall(r"\{\{(.*?)\}\}", value)
                        resolved_val = value
                        for match in matches:
                            var_path = match.strip()
                            
                            # 解析 'context.xxx' 语法
                            if var_path.startswith("context."):
                                var_key = var_path.split(".")[1]
                                real_data = current_context.get(var_key, "")
                                
                                # 如果整个字符串就是一个变量 (如 value == "{{context.data}}")
                                # 保持它原有的数据类型（比如传进来的是个 Dict/List，不要强转成 String）
                                if value == f"{{{{{match}}}}}":
                                    resolved_val = real_data
                                else:
                                    # 否则作为字符串拼接进去
                                    resolved_val = resolved_val.replace(f"{{{{{match}}}}}", str(real_data))
                                    
                        resolved[key] = resolved_val
                        
                    elif isinstance(value, dict):
                        resolved[key] = resolve_params(value, current_context)
                    elif isinstance(value, list):
                        resolved[key] = [resolve_params(item, current_context) if isinstance(item, dict) else item for item in value]
                    else:
                        resolved[key] = value
                return resolved

            # =========================================================
            # 遍历该节点内配置的原子组件 (Component)
            # =========================================================
            for comp in node.components:
                print(f"   ├─ 执行组件 [{comp.type.value.upper()}]: {comp.tool_name}")
                
                # 🚨 在把参数喂给底层动作之前，必须先进行动态变量的“实弹装填”！
                rendered_params = resolve_params(comp.params, context)
                
                # ---------------------------------------------------------
                # ⚔️ 真实物理执行层 (Execution Routing)
                # ---------------------------------------------------------
                
                if comp.tool_name in ["browser_open", "browser_use"]:
                    instruction = rendered_params.get(
                        "instruction", 
                        "打开 Hacker News (news.ycombinator.com)，提取目前排在第一位的新闻标题，并返回文本。"
                    )
                    
                    node_logs.append(f"🌐 正在启动无头浏览器并执行指令: {instruction}")
                    print("   │  (正在召唤大模型分析 DOM 树，请耐心等待...)")
                    
                    result = await execute_browser_task(instruction)
                    
                    if result["status"] == "success":
                        success_msg = f"✅ 网页操作成功。抓取结果:\n{result['result']}"
                        node_logs.append(success_msg)
                        print(f"   └─ {success_msg}")
                        # 💡 将抓取结果写入全局上下文，供后续节点使用！
                        context["browser_result"] = result["result"]
                    else:
                        error_msg = f"❌ 网页操作失败: {result['message']}"
                        node_logs.append(error_msg)
                        print(f"   └─ {error_msg}")
                        context["has_error"] = True 

                # 💡 [SYSTEM] 基础能力：写入 Notion (极简复用版)
                elif comp.tool_name == "notion_append":
                    from app.execution.skills.notion_skill import append_to_notion
                    
                    # 此时拿到的 page_id 和 content 已经是被替换过真实数据的了！
                    page_id = rendered_params.get("page_id", "")
                    content_to_write = rendered_params.get("content", "")
                    
                    if not page_id or not content_to_write:
                        error_msg = "❌ Notion 写入失败: 缺少 page_id 或 content (可能上游未生成对应变量)。"
                        node_logs.append(error_msg)
                        print(f"   └─ {error_msg}")
                        context["has_error"] = True
                    else:
                        node_logs.append(f"🔗 正在向 Notion 页面 {page_id[:8]}... 写入数据")
                        result = await append_to_notion(page_id, content_to_write)
                        
                        if result["status"] == "success":
                            msg = "✅ Notion 写入成功!"
                            node_logs.append(msg)
                            print(f"   └─ {msg}")
                        else:
                            error_msg = f"❌ Notion 写入失败: {result['message']}"
                            node_logs.append(error_msg)
                            print(f"   └─ {error_msg}")
                            context["has_error"] = True

                # 💡 [SYSTEM] 基础能力：提取群聊记忆
                elif comp.tool_name == "fetch_workspace_history":
                    from app.execution.skills.memory_skill import fetch_workspace_history
                    
                    channel_id = rendered_params.get("channel_id", "marketing")
                    node_logs.append(f"🔍 正在从底层数据库提取频道 [{channel_id}] 的记忆...")
                    
                    result = await fetch_workspace_history(channel_id)
                    if result["status"] == "success":
                        node_logs.append(f"✅ 成功提取 {len(result['data'])} 字符的对话记录")
                        print(f"   └─ 成功提取记忆")
                        # 💡 将拉到的聊天记录塞进上下文，供下一个节点的大模型总结！
                        context["raw_chat_history"] = result["data"]
                    else:
                        error_msg = f"❌ 提取记忆失败: {result['message']}"
                        node_logs.append(error_msg)
                        print(f"   └─ {error_msg}")
                        context["has_error"] = True

                # 💡 [AGENT] 智能体能力：大模型总结
                elif comp.tool_name == "llm_summarize":
                    from app.execution.llm import ask_llm
                    
                    # 这个数据必须是由上游节点 (如 fetch_workspace_history) 提前准备好的
                    history_text = context.get("raw_chat_history", "")
                    
                    if not history_text:
                        error_msg = "❌ 没有可总结的上下文数据 (raw_chat_history 为空)。"
                        node_logs.append(error_msg)
                        print(f"   └─ {error_msg}")
                        context["has_error"] = True
                    else:
                        node_logs.append("🧠 Agent 正在提炼结构化报告，请稍候...")
                        print("   │  (正在呼叫大模型进行推理...)")
                        
                        # 可以从参数里动态配置 Prompt
                        custom_prompt = rendered_params.get("prompt", "请提炼以下记录中的核心讨论点和待办事项，输出为极简的 Markdown 格式：\n\n{history}")
                        prompt = custom_prompt.replace("{history}", history_text)
                        
                        system_prompt = rendered_params.get("system_prompt", "你是一个高效的私人秘书。只输出 Markdown 内容，禁止任何多余的寒暄和解释。")
                        
                        # 如果指定了具体的 Agent ID，实际生产中应去查该 Agent 挂载的专属模型，这里暂简化
                        summary = ask_llm(prompt, system_prompt=system_prompt)
                        
                        msg = "✅ Agent 总结提炼完毕！"
                        node_logs.append(msg)
                        print(f"   └─ {msg}")
                        
                        # 💡 极其精华的总结写回上下文，供下一步 Notion 节点使用！
                        context["daily_summary"] = summary

                # =========================================================
                # 其他尚未实现物理落地的模拟组件
                # =========================================================
                else:
                    await asyncio.sleep(1.0) # 模拟真实耗时
                    msg = f"✅ 组件 {comp.tool_name} (Executor: {comp.executor.value}) 模拟执行完成。"
                    node_logs.append(msg)
                    print(f"   └─ {msg}")
            
            # 记录轨迹
            new_trace = {
                "node_id": node.id, 
                "status": "success" if not context.get("has_error") else "error",
                "logs": "\n".join(node_logs)
            }
            
            return {
                "traces": [new_trace],
                "context_data": context # 把修改过/追加了变量的上下文更新回 LangGraph 状态机
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
                # 警告：生产环境必须替换为安全的规则引擎 (如 jsonlogic)！
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
        print(f"\n⚙️ GridsPilot 编译器: 流程 [{self.flow.name}] 编译完成！包含 {len(self.flow.nodes)} 个节点。")
        if interrupt_nodes:
            print(f"⚠️ 挂载 Auditor 拦截点 (强制熔断): {interrupt_nodes}")
            
        # 💡 绝杀时刻：将 memory_saver 注入编译核心！图纸将拥有物理记忆！
        return self.workflow.compile(
            checkpointer=memory_saver, 
            interrupt_before=interrupt_nodes
        )