# backend/app/api/router_ecosystem.py
from fastapi import APIRouter
from pydantic import BaseModel
import json

from app.core.storage import FileStorage, SessionLocal, GenericAssetRecord

router = APIRouter()

# 1. 上帝视角的系统数据字典
@router.get("/assets/meta")
async def get_system_meta_assets():
    # 💡 覆盖你定义的全部 10 张表
    domains = ["flows", "models", "skills", "integrations", "monitors", "chats", "agents", "traces", "cases", "workspaces", "prompts"]
    meta_stats = []
    db = SessionLocal()
    try:
        for domain in domains:
            try:
                ModelClass = FileStorage._get_model_class(domain)
                query = db.query(ModelClass)
                if ModelClass == GenericAssetRecord: query = query.filter(GenericAssetRecord.domain == domain)
                count = query.count()
                meta_stats.append({
                    "id": f"sys_db_{domain}", "name": f"系统表: {domain.capitalize()}",
                    "category": "System Meta-Data", "type": "SQLite Table",
                    "records": count, "size": f"{round(count * 2.5, 2)} KB", "domain": domain, "last_updated": "Live Sync", "is_system": True
                })
            except Exception: pass
        return {"status": "success", "data": meta_stats}
    finally:
        db.close()

# 2. 第三方应用 Integration 密钥
class IntegrationConfig(BaseModel):
    id: str
    name: str
    desc: str
    type: str
    color: str
    config: dict

@router.get("/integrations")
async def get_integrations():
    """获取所有第三方生态凭证，带出厂兜底数据"""
    apps = FileStorage.list_all("integrations")
    
    # 💡 极其重要的兜底：如果库是空的，注入 3 个标准的占位符
    if not apps:
        default_apps = [
            {"id": "lark", "name": "飞书 (Lark)", "desc": "双向打通：接收飞书群消息指令，向飞书发送执行报告。", "type": "IM & Bot", "color": "bg-[#3370FF]", "config": {"app_id": "", "webhook": ""}},
            {"id": "notion", "name": "Notion", "desc": "知识库同步：自动将抓取的数据格式化并写入指定的 Database。", "type": "Workspace", "color": "bg-slate-800", "config": {"token": ""}},
            {"id": "github", "name": "GitHub", "desc": "研发联动：拉取代码仓库内容进行 Code Review。", "type": "Developer", "color": "bg-[#24292F]", "config": {"personal_access_token": ""}}
        ]
        for app in default_apps:
            FileStorage.save("integrations", app, app["id"])
        apps = default_apps

    # 动态判断状态并打码
    for app in apps:
        config_values = app.get("config", {}).values()
        is_configured = all(v != "" for v in config_values) and len(config_values) > 0
        app["status"] = "active" if is_configured else "error"
        
        masked_config = {}
        for k, v in app.get("config", {}).items():
            masked_config[k] = f"{v[:4]}...{v[-4:]}" if isinstance(v, str) and len(v) > 10 else ("***" if v else "")
        app["config_masked"] = masked_config

    return {"status": "success", "data": apps}

@router.post("/integrations")
async def save_integration(app_data: IntegrationConfig):
    FileStorage.save("integrations", app_data.dict(), app_data.id)
    return {"status": "success"}