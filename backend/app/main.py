# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# 引入我们刚才拆分好的六大护法路由
from app.api.router_collaboration import router as col_router
from app.api.router_orchestration import router as orch_router
from app.api.router_workforces import router as wf_router
from app.api.router_ecosystem import router as eco_router
from app.api.router_governance import router as gov_router
from app.api.router_records import router as rec_router
from app.api.router_ws import router as ws_router

app = FastAPI(title="GridsPilot OS Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def health_check():
    return {"status": "GridsPilot OS Engine is Alive", "version": "1.0.0"}

# ==============================================================================
# 🚀 六大核心业务域路由挂载 (The 6 Pillars Assembly)
# ==============================================================================

app.include_router(col_router, prefix="/api", tags=["Collaboration"])
app.include_router(orch_router, prefix="/api", tags=["Orchestration"])
app.include_router(wf_router, prefix="/api", tags=["AI Workforces"])
app.include_router(eco_router, prefix="/api", tags=["Business Ecosystem"])
app.include_router(gov_router, prefix="/api", tags=["Governance"])
app.include_router(rec_router, prefix="/api", tags=["Records & Insights"])

# ==============================================================================
# 🚀 物理引擎总线挂载
# ==============================================================================
app.include_router(ws_router, prefix="/ws", tags=["Execution Streaming Bus"])