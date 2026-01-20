from fastapi import APIRouter, Request, HTTPException
from services.bot_service import bot_service
import logging

router = APIRouter(prefix="/api/bot", tags=["bot"])
logger = logging.getLogger(__name__)

@router.on_event("startup")
async def startup_event():
    """Nyalain mesin bot pas app start"""
    await bot_service.initialize()

@router.post("/webhook")
async def telegram_webhook(request: Request):
    """Nangkep update dari Telegram lewat webhook"""
    try:
        data = await request.json()
        await bot_service.process_update(data)
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Error processing webhook: {e}")
        return {"status": "error", "detail": str(e)}
