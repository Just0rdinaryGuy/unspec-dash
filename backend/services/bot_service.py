import os
import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, ContextTypes, ConversationHandler, CallbackQueryHandler, MessageHandler, filters
from sqlalchemy.orm import Session
from database import SessionLocal, UserDB, NetworkNodeDB
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
        
        # Tiket Wizard States
        self.SELECT_ACTION, self.CHOOSE_STATUS, self.INPUT_RFO, self.UPLOAD_EVIDENCE = range(4)

        # Wizard Conversation Handler
        wizard_handler = ConversationHandler(
            entry_points=[CommandHandler("update_ticket", self.start_wizard_command)],
            states={
                self.SELECT_ACTION: [CallbackQueryHandler(self.handle_ticket_selection)],
                self.CHOOSE_STATUS: [CallbackQueryHandler(self.handle_status_selection)],
                self.INPUT_RFO: [MessageHandler(filters.TEXT & ~filters.COMMAND, self.handle_rfo_input)],
                self.UPLOAD_EVIDENCE: [
                    MessageHandler(filters.PHOTO, self.handle_evidence_upload),
                    CommandHandler("skip", self.skip_evidence)
                ],
            },
            fallbacks=[CommandHandler("cancel", self.cancel_wizard)]
        )
        self.application.add_handler(wizard_handler)

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
            "/update_ticket - Update status tiket tugas"
        )

    # --- WIZARD HANDLERS ---
    
    async def start_wizard_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Mulai wizard update tiket"""
        user = update.effective_user
        db: Session = SessionLocal()
        try:
            # 1. Cek User terdaftar & linked
            db_user = db.query(UserDB).filter(UserDB.chat_id == user.id).first()
            if not db_user:
                await update.message.reply_text("⛔ Akun Telegram belum terhubung. Gunakan `/link <username>` dulu.")
                return ConversationHandler.END

            # 2. Ambil tiket yang assign ke dia (atau timnya)
            # Sementara ambil tiket yang nama_teknisi match username atau full_name
            tickets = db.query(NetworkNodeDB).filter(
                NetworkNodeDB.nama_teknisi == db_user.full_name, # Simple match
                NetworkNodeDB.ticket_status != "CLOSED"
            ).all()

            if not tickets:
                await update.message.reply_text(
                    "✅ Tidak ada tiket aktif yang assigned ke Anda. Santai dulu bos!\n\n"
                    "*(Pastikan Nama Lengkap di Dashboard sama dengan Nama Teknisi di Data)*"
                )
                return ConversationHandler.END
            
            # 3. Tampilkan list tiket sebagai tombol inline
            keyboard = []
            for t in tickets:
                # Format: [STO-ND] Status
                label = f"[{t.sto}-{t.nd}] {t.ticket_status}"
                keyboard.append([InlineKeyboardButton(label, callback_data=str(t.id))])
            
            keyboard.append([InlineKeyboardButton("❌ Batal", callback_data="cancel")])
            reply_markup = InlineKeyboardMarkup(keyboard)

            await update.message.reply_text(
                "📋 **Pilih Tiket untuk Diupdate:**",
                reply_markup=reply_markup
            )
            return self.SELECT_ACTION

        except Exception as e:
            logger.error(f"Error start wizard: {e}")
            await update.message.reply_text("❌ Error sistem.")
            return ConversationHandler.END
        finally:
            db.close()

    async def handle_ticket_selection(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """User milih tiket dari list"""
        query = update.callback_query
        await query.answer()
        
        data = query.data
        if data == "cancel":
            await query.edit_message_text("❌ Update dibatalkan.")
            return ConversationHandler.END
            
        # Simpan ticket_id di context
        context.user_data['ticket_id'] = int(data)
        
        # Tampilkan pilihan Status
        # Update bahasa gaul dikit
        keyboard = [
            [InlineKeyboardButton("🚧 PROGRESS (Otw Kerjain)", callback_data="PROGRESS")],
            [InlineKeyboardButton("✅ CLOSED (Beres)", callback_data="CLOSED")],
            [InlineKeyboardButton("⚠️ KENDALA (Macet)", callback_data="KENDALA")],
            [InlineKeyboardButton("⬅️ Kembali", callback_data="back")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await query.edit_message_text(
            f"🔧 **Update Status Tiket #{data}:**\nMau diupdate jadi apa?",
            reply_markup=reply_markup
        )
        return self.CHOOSE_STATUS

    async def handle_status_selection(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """User milih status baru"""
        query = update.callback_query
        await query.answer()
        
        status = query.data
        if status == "back":
            # Harusnya balik ke list tiket, tapi biar simple cancel dulu
            await query.edit_message_text("🔙 Kembali ke awal. Ketik /update_ticket lagi.")
            return ConversationHandler.END
            
        context.user_data['new_status'] = status
        
        # Minta RFO / Keterangan
        await query.edit_message_text(
            f"📝 **Status dipilih: {status}**\n\n"
            "Tulis **Keterangan / RFO** pengerjaannya dong:\n"
            "(Contoh: Kabel putus digigit tikus, sudah disambung aman)"
        )
        return self.INPUT_RFO

    async def handle_rfo_input(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """User input text RFO"""
        rfo_text = update.message.text
        context.user_data['rfo'] = rfo_text
        
        # Minta Bukti Foto
        await update.message.reply_text(
            "📸 **Upload Bukti Foto (Opsional)**\n"
            "Kirim foto perbaikan biar afdol (atau ketik /skip kalo gak ada)."
        )
        return self.UPLOAD_EVIDENCE

    async def handle_evidence_upload(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """User upload foto"""
        # photo_file = await update.message.photo[-1].get_file()
        # TODO: Save photo to server/S3
        
        context.user_data['evidence'] = "Foto diterima" 
        return await self.finalize_update(update, context)

    async def skip_evidence(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """User skip upload foto"""
        context.user_data['evidence'] = None
        return await self.finalize_update(update, context)

    async def finalize_update(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Simpan semua perubahan ke DB"""
        ticket_id = context.user_data['ticket_id']
        new_status = context.user_data['new_status']
        rfo = context.user_data['rfo']
        
        db: Session = SessionLocal()
        try:
            ticket = db.query(NetworkNodeDB).filter(NetworkNodeDB.id == ticket_id).first()
            if ticket:
                ticket.ticket_status = new_status
                # Auto logic for status_rfo
                if new_status == "CLOSED":
                     ticket.status_rfo = "CLOSE"
                elif new_status == "KENDALA":
                     ticket.status_rfo = "KENDALA"
                else:
                     ticket.status_rfo = "ON PROGRESS"
                     
                ticket.keterangan = f"{ticket.keterangan or ''} | {datetime.now().strftime('%d/%m %H:%M')}: {rfo}"
                db.commit()
                
                await update.message.reply_text(
                    f"✅ **Tiket #{ticket.id} Berhasil Diupdate!**\n\n"
                    f"Status: {new_status}\n"
                    f"Ket: {rfo}\n\n"
                    "Lanjut kerja keras bagai kuda! 🐴"
                )
            else:
                await update.message.reply_text("❌ Waduh tiketnya ilang pas mau disimpen.")
                
        except Exception as e:
            logger.error(f"Error finalizing ticket: {e}")
            await update.message.reply_text("❌ Gagal menyimpan data. Server lagi ngambek.")
        finally:
            db.close()
            
        return ConversationHandler.END

    async def cancel_wizard(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        await update.message.reply_text("❌ Oke cancel. Update dibatalkan.")
        return ConversationHandler.END

# Singleton instance - biar satau object aja yang idup
bot_service = BotService()
