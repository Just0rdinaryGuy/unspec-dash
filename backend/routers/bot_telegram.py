from fastapi import APIRouter, Request, HTTPException
from services.bot_service import bot_service
import logging

router = APIRouter(prefix="/api/bot", tags=["bot"])
logger = logging.getLogger(__name__)

@router.on_event("startup")
async def startup_event():
    """Initialize bot on app startup"""
    await bot_service.initialize()

@router.post("/webhook")
async def telegram_webhook(request: Request):
    """Receive webhook connection from Telegram"""
    try:
        data = await request.json()
        await bot_service.process_update(data)
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Error processing webhook: {e}")
        return {"status": "error", "detail": str(e)}
