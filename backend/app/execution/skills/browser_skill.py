# backend/app/execution/skills/browser_skill.py
import asyncio
from langchain_openai import ChatOpenAI
from browser_use import Agent

# 引入我们自己管理的 API Key
from app.core.storage import FileStorage
import os

async def execute_browser_task(task_instruction: str, model_id: str = "gpt-4o"):
    """
    真实的具身浏览器执行器：
    接收自然语言指令，拉起无头浏览器，让大模型自动规划动作并执行。
    """
    print(f"🌐 [Browser Skill] 正在拉起真实浏览器执行任务: {task_instruction}")
    
    # 1. 动态获取 API Key (从 FileDB 或环境变量)
    api_key = None
    model_config = FileStorage.get("models", model_id)
    if model_config and model_config.get("api_key"):
        api_key = model_config.get("api_key")
    else:
        api_key = os.getenv("OPENAI_API_KEY")
        
    if not api_key:
        return {"status": "error", "message": "缺少 LLM API Key，无法驱动浏览器。"}

    # 2. 初始化驱动浏览器的 LLM (browser-use 强依赖 langchain 接口)
    # 注意：browser-use 目前对 gpt-4o 的视觉理解支持最好
    llm = ChatOpenAI(model="gpt-4o", api_key=api_key)

    try:
        # 3. 实例化 browser-use Agent 并执行
        # 在开发模式下，默认会弹出一个真实的 Chrome 窗口让你看到它在乱点！
        agent = Agent(
            task=task_instruction,
            llm=llm,
        )
        
        # 开始执行 (这是一个阻塞的异步过程，大模型在疯狂截屏、分析、点击)
        result = await agent.run()
        
        print(f"✅ [Browser Skill] 任务执行完毕！")
        return {
            "status": "success",
            "message": "浏览器操作已完成",
            "result": str(result) # 把网页上抓取到的最终结果转成文本
        }
        
    except Exception as e:
        print(f"❌ [Browser Skill] 浏览器操作崩溃: {str(e)}")
        return {"status": "error", "message": str(e)}