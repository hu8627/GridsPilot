# backend/app/api/router_workforces.py
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List

from app.core.storage import FileStorage

router = APIRouter()

class AssetConfig(BaseModel):
    id: str
    name: str
    # 使用大字典兼容 models, skills, prompts, agents 的各种杂项字段
    provider: Optional[str] = ""
    type: Optional[str] = ""
    api_key: Optional[str] = ""
    desc: Optional[str] = ""
    env: Optional[str] = ""
    content: Optional[str] = ""
    tags: Optional[list] = []
    version: Optional[str] = "1.0"
    role: Optional[str] = ""
    model: Optional[str] = ""
    skills: Optional[list] = []
    isSystem: Optional[bool] = False
    status: Optional[str] = "active"
    params_schema: Optional[list] = []

# --- Models ---
@router.get("/models")
async def get_models():
    models = FileStorage.list_all("models")
    if not models:
        defaults = [{"id": "gpt-4o", "name": "GPT-4 Omni", "provider": "OpenAI", "type": "LLM & Vision", "api_key": ""}]
        for m in defaults: FileStorage.save("models", m, m["id"])
        models = defaults
    for m in models:
        key = m.get("api_key", "")
        m["status"] = "active" if key and "xxxx" not in key else "error"
        m["api_key_masked"] = f"{key[:5]}...{key[-4:]}" if len(key) > 10 else ("***" if key else "")
    return {"status": "success", "data": models}

@router.post("/models")
async def save_model(model: AssetConfig):
    FileStorage.save("models", model.dict(exclude_none=True), model.id)
    return {"status": "success"}

# --- Skills, Prompts, Agents 接口写法与上面完全相同，只是 domain 名称改变。为节省篇幅，可以复用 CRUD 逻辑 ---
@router.get("/{domain}")
async def get_workforce_assets(domain: str):
    if domain not in ["skills", "prompts", "agents"]: return {"status": "error"}
    return {"status": "success", "data": FileStorage.list_all(domain)}

@router.post("/{domain}")
async def save_workforce_asset(domain: str, asset: AssetConfig):
    FileStorage.save(domain, asset.dict(exclude_none=True), asset.id)
    return {"status": "success"}