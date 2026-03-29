# backend/app/execution/skills/notion_skill.py
import requests
import json
from app.core.storage import FileStorage

async def append_to_notion(page_id: str, content_markdown: str) -> dict:
    """
    [SYSTEM] 纯基建技能：将传入的 Markdown 文本追加到 Notion 页面。
    """
    print(f"🔗 [Skill: Notion] 正在将 {len(content_markdown)} 字节的数据写入页面 {page_id}...")
    
    # 1. 动态获取 Integration 库中配置好的 Notion Token
    notion_config = FileStorage.get("integrations", "notion")
    if not notion_config or not notion_config.get("config", {}).get("token"):
        return {"status": "error", "message": "缺失 Notion Integration Token，请在 Connects 大盘中配置。"}
    
    token = notion_config["config"]["token"]
    
    # 2. 构造极其稳定的 API 请求
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
    }
    
    # 将 Markdown 文本包装为 Notion 的 Paragraph Block
    payload = {
        "children": [
            {
                "object": "block",
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [{"type": "text", "text": {"content": content_markdown}}]
                }
            }
        ]
    }
    
    try:
        url = f"https://api.notion.com/v1/blocks/{page_id}/children"
        response = requests.patch(url, headers=headers, json=payload, timeout=10)
        
        if response.status_code == 200:
            print("✅ [Skill: Notion] 写入成功！")
            return {"status": "success", "message": f"成功向 Notion 页面追加了内容。"}
        else:
            print(f"❌ [Skill: Notion] 写入失败: {response.text}")
            return {"status": "error", "message": f"Notion API 报错: {response.status_code}"}
            
    except Exception as e:
        print(f"❌ [Skill: Notion] 网络请求异常: {str(e)}")
        return {"status": "error", "message": f"网络异常: {str(e)}"}