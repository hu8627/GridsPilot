# backend/app/api/router_records.py
from fastapi import APIRouter
from app.core.storage import FileStorage

router = APIRouter()

@router.get("/{domain}")
async def get_records(domain: str):
    if domain not in ["traces", "cases", "tickets", "ledger"]: return {"status": "error"}
    return {"status": "success", "data": FileStorage.list_all(domain)}