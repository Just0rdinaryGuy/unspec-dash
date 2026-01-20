import asyncio
from telegram import Bot
import os

TELEGRAM_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
# VPS Domain from user context
WEBHOOK_URL = "https://wargaonlineceria.my.id/api/bot/webhook"

async def set_webhook():
    if not TELEGRAM_TOKEN:
        print("Error: TELEGRAM_BOT_TOKEN not found.")
        return

    print(f"Setting webhook to: {WEBHOOK_URL}")
    bot = Bot(TELEGRAM_TOKEN)
    await bot.set_webhook(url=WEBHOOK_URL)
    print("✓ Webhook set successfully!")
    
    info = await bot.get_webhook_info()
    print(f"Webhook Info: {info}")

if __name__ == "__main__":
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(set_webhook())
