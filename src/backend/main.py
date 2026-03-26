from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import close_db, connect_db, get_database
from app.routers.admin_users import router as admin_users_router
from app.routers.audit_logs import router as audit_logs_router
from app.routers.auth import router as auth_router
from app.routers.contracts import router as contracts_router
from app.routers.customers import router as customers_router
from app.routers.metrics_definitions import router as metrics_router
from app.routers.plans import router as plans_router
from app.routers.products import router as products_router
from app.routers.dashboard import router as dashboard_router
from app.routers.imports import router as imports_router
from app.routers.users import router as users_router
from app.services.user_service import create_initial_admin


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """アプリケーションの起動・終了時の処理。"""
    await connect_db()
    db = get_database()
    await create_initial_admin(db)
    yield
    await close_db()


app = FastAPI(
    title="SaaS管理アプリ API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(products_router)
app.include_router(plans_router)
app.include_router(metrics_router)
app.include_router(admin_users_router)
app.include_router(audit_logs_router)
app.include_router(customers_router)
app.include_router(contracts_router)
app.include_router(dashboard_router)
app.include_router(imports_router)
app.include_router(users_router)


@app.get("/health")
async def health() -> dict:
    """ヘルスチェックエンドポイント。"""
    return {"status": "ok"}
