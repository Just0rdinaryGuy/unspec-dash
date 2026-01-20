import asyncio
from telegram import Bot
import os

TELEGRAM_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
# Domain VPS bapak, jangan diganti-ganti kalo gak pindah server
WEBHOOK_URL = "https://wargaonlineceria.my.id/api/bot/webhook"

async def set_webhook():
    if not TELEGRAM_TOKEN:
        print("Waduh error: TELEGRAM_BOT_TOKEN gak ketemu Bos.")
        return

    print(f"Gas setting webhook ke: {WEBHOOK_URL}")
    bot = Bot(TELEGRAM_TOKEN)
    await bot.set_webhook(url=WEBHOOK_URL)
    print("✓ Webhook beres diseting!")
    
    info = await bot.get_webhook_info()
    print(f"Webhook Info: {info}")

if __name__ == "__main__":
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(set_webhook())
