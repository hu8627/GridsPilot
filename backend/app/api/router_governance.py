# backend/app/api/router_governance.py
from fastapi import APIRouter
from app.core.storage import FileStorage

router = APIRouter()

# ==============================================================================
# 模块 G：监控与熔断规则探针 (Monitors / Guards)
# ==============================================================================

@router.get("/monitors")
async def get_monitors():
    """获取所有全局探针规则，如果为空则注入出厂默认规则"""
    monitors = FileStorage.list_all("monitors")
    
    if not monitors:
        # 💡 极具极客感和业务深度的出厂默认探针
        default_rules = [
            {"id": "m_budget", "name": "全局 Token 熔断", "target": "Global", "condition": "Single Run Token > $0.5", "action": "Suspend & Alert", "status": "active"},
            {"id": "m_captcha", "name": "反爬虫/验证码拦截", "target": "Action: browser_open", "condition": "Detect 'CAPTCHA' in DOM", "action": "Suspend & HITL", "status": "active"},
            {"id": "m_sensitive", "name": "敏感数据写入", "target": "Action: crm_api_submit", "condition": "Always", "action": "Require Human Confirm", "status": "active"}
        ]
        for rule in default_rules:
            FileStorage.save("monitors", rule, rule["id"])
        monitors = default_rules

    return {"status": "success", "data": monitors}