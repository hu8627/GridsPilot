# backend/app/execution/skills/memory_skill.py
from app.core.storage import FileStorage

async def fetch_workspace_history(channel_id: str = "marketing") -> dict:
    """
    [SYSTEM] 内部基建：从底层数据库提取指定频道的群聊记录
    """
    print(f"🔍 [Skill: Memory] 正在检索频道 {channel_id} 的交互记录...")
    
    # 1. 从底层读出对应的 Workspace 频道数据
    channel_data = FileStorage.get("workspaces", channel_id)
    if not channel_data:
        return {"status": "error", "message": f"找不到频道 {channel_id} 的数据。"}
        
    messages = channel_data.get("messages", [])
    
    if not messages:
         return {"status": "error", "message": "该频道无任何聊天记录。"}
         
    # 2. 拼接成一个巨大的纯文本字符串，准备发给大模型总结
    history_text = f"【频道 {channel_data.get('name', channel_id)} 的历史记录】\n"
    for msg in messages:
        # 如果是系统消息，略过或简写
        if msg.get("type") == "system":
            continue
            
        sender = msg.get("user") if msg.get("type") == "human" else msg.get("agentName", "BOT")
        text = msg.get("text", "")
        time = msg.get("time", "")
        
        history_text += f"[{time}] {sender}: {text}\n"
        
    print(f"✅ [Skill: Memory] 成功提取 {len(history_text)} 个字符的对话上下文。")
    return {"status": "success", "data": history_text}