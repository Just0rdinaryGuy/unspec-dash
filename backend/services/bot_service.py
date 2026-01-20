import os
import logging
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes
from sqlalchemy.orm import Session
from database import SessionLocal, UserDB
from datetime import datetime

# Nyalain logging biar tau kalo ada error
logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)
logger = logging.getLogger(__name__)

TELEGRAM_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

class BotService:
    def __init__(self):
        self.application = None
        if not TELEGRAM_TOKEN:
            logger.error("TELEGRAM_BOT_TOKEN not found in env")
            return
            
        self.application = Application.builder().token(TELEGRAM_TOKEN).build()
        self.application.add_handler(CommandHandler("start", self.start_command))
        self.application.add_handler(CommandHandler("link", self.link_command))
        self.application.add_handler(CommandHandler("help", self.help_command))

    async def initialize(self):
        """
        Inisialisasi aplikasi bot.
        Biasanya webhook diset di router, tapi ini buat starting engine-nya.
        """
        if not self.application:
            logger.warning("Bot belum init karena token ga ada. Skip start.")
            return

        await self.application.initialize()
        await self.application.start()

    async def process_update(self, update_data: dict):
        """
        Proses update yang masuk dari webhook Telegram.
        Ini yang bikin bot bisa 'denger' chat.
        """
        if not self.application:
            return

        update = Update.de_json(update_data, self.application.bot)
        await self.application.process_update(update)

    async def start_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """
        Handle command /start.
        Sapa user pas pertama kali nongol.
        """
        user = update.effective_user
        await update.message.reply_text(
            f"Halo {user.first_name}! 👋\n\n"
            "Saya adalah Bot WOC (Warga Online Ceria).\n"
            "Gunakan /link <username_dashboard> untuk menghubungkan akun Telegram ini dengan Dashboard.\n\n"
            "Contoh: `/link budi_teknisi`"
        )

    async def link_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """
        Handle command /link.
        Buat nyambungin akun Telegram sama user Dashboard.
        """
        if not context.args:
            await update.message.reply_text("⚠️ Format salah. Gunakan: `/link <username_dashboard>`")
            return

        username_input = context.args[0]
        telegram_user = update.effective_user
        chat_id = update.effective_chat.id

        db: Session = SessionLocal()
        try:
            # Coba cari user di DB berdasarkan username yang dikirim
            user = db.query(UserDB).filter(UserDB.username == username_input).first()
            if not user:
                await update.message.reply_text(f"❌ User dashboard dengan username `{username_input}` tidak ditemukan.")
                return

            if user.chat_id:
                if user.chat_id == chat_id:
                     await update.message.reply_text("✅ Akun ini sudah terhubung dengan Anda.")
                else:
                     await update.message.reply_text("⚠️ User ini sudah terhubung dengan akun Telegram lain. Hubungi Admin.")
                return

            # Gas update chat_id sama username telegram-nya
            user.chat_id = chat_id
            user.telegram_username = telegram_user.username
            db.commit()
            
            await update.message.reply_text(
                f"✅ **Berhasil!**\n\n"
                f"Akun Telegram Anda sekarang terhubung dengan user: `{user.full_name or user.username}`.\n"
                "Anda akan menerima notifikasi tiket dan tugas di sini."
            )
            
        except Exception as e:
            logger.error(f"Error linking user: {e}")
            await update.message.reply_text("❌ Terjadi kesalahan sistem.")
        finally:
            db.close()

    async def help_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        await update.message.reply_text(
            "📋 **Bantuan Bot WOC**\n\n"
            "/start - Mulai bot\n"
            "/link <username> - Hubungkan akun\n"
            "/status - Cek status (Coming Soon)"
        )

# Singleton instance - biar satau object aja yang idup
bot_service = BotService()
