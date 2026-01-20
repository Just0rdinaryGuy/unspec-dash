import os
import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, BotCommand
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
        self._is_running = False
        if not TELEGRAM_TOKEN:
            logger.error("TELEGRAM_BOT_TOKEN not found in env")
            return
            
        self.application = Application.builder().token(TELEGRAM_TOKEN).build()
        self.application.add_handler(CommandHandler("start", self.start_command))
        self.application.add_handler(CommandHandler("link", self.link_command))
        # Utility command buat cek Group ID
        self.application.add_handler(CommandHandler("id", self.check_id_command))
        self.application.add_handler(CommandHandler("help", self.help_command))
        
        # Tiket Wizard States
        self.SELECT_ACTION, self.CHOOSE_STATUS, self.REQUEST_LOCATION, self.INPUT_RFO, self.UPLOAD_EVIDENCE = range(5)
        # Absensi States
        self.ABSEN_LOCATION, self.ABSEN_SELFIE = range(5, 7)

        # Wizard Conversation Handler
        wizard_handler = ConversationHandler(
            entry_points=[
                CommandHandler("update_ticket", self.start_wizard_command),
                CommandHandler("absen", self.absen_command)
            ],
            states={
                self.SELECT_ACTION: [CallbackQueryHandler(self.handle_ticket_selection)],
                self.CHOOSE_STATUS: [CallbackQueryHandler(self.handle_status_selection)],
                self.REQUEST_LOCATION: [
                    MessageHandler(filters.LOCATION, self.handle_location_checkin),
                    MessageHandler(filters.TEXT & ~filters.COMMAND, self.reject_fake_location)
                ],
                self.INPUT_RFO: [MessageHandler(filters.TEXT & ~filters.COMMAND, self.handle_rfo_input)],
                self.UPLOAD_EVIDENCE: [
                    MessageHandler(filters.PHOTO, self.handle_evidence_upload),
                    CommandHandler("skip", self.skip_evidence)
                ],
                # ABSEN STATES
                self.ABSEN_LOCATION: [MessageHandler(filters.LOCATION, self.handle_absen_location)],
                self.ABSEN_SELFIE: [MessageHandler(filters.PHOTO, self.handle_absen_selfie)],
            },
            fallbacks=[
                CommandHandler("cancel", self.cancel_wizard) # Shared cancel
            ]
        )
        self.application.add_handler(wizard_handler)

    async def initialize(self):
        if not self.application:
            logger.warning("Bot belum init karena token ga ada. Skip start.")
            return

        if self._is_running:
            logger.info("Bot is already running. Skipping init.")
            return

        await self.application.initialize()
        await self.application.start()
        
        # Set Menu Command di Telegram
        commands = [
            BotCommand("start", "Mulai Bot WOC"),
            BotCommand("absen", "Absensi Harian (Masuk/Pulang)"),
            BotCommand("link", "Hubungkan Akun Dashboard"),
            BotCommand("update_ticket", "Update Status & List Tiket"),
            BotCommand("id", "Cek Group/Chat ID"),
            BotCommand("help", "Bantuan Penggunaan")
        ]
        await self.application.bot.set_my_commands(commands)
        logger.info("Bot commands set successfully.")
        
        self._is_running = True

    async def process_update(self, update_data: dict):
        if not self.application:
            return
        update = Update.de_json(update_data, self.application.bot)
        await self.application.process_update(update)

    async def start_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        user = update.effective_user
        await update.message.reply_text(
            f"Halo {user.first_name}! 👋\n\n"
            "Saya adalah Bot WOC (Warga Online Ceria).\n"
            "Gunakan /link <Nama> untuk menghubungkan akun Telegram ini dengan Dashboard.\n\n"
            "Contoh: `/link Budi`"
        )

    async def link_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        if not context.args:
            await update.message.reply_text("⚠️ Format salah. Gunakan: `/link <Nama>`")
            return

        username_input = context.args[0]
        telegram_user = update.effective_user
        chat_id = update.effective_chat.id

        db: Session = SessionLocal()
        try:
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

    async def check_id_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Cek Chat/Group ID"""
        chat_id = update.effective_chat.id
        chat_title = update.effective_chat.title or "Private Chat"
        await update.message.reply_text(f"🆔 **ID Chat Ini:** `{chat_id}`\n({chat_title})")

    async def help_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        await update.message.reply_text(
            "📋 **Bantuan Bot WOC**\n\n"
            "/start - Mulai bot\n"
            "/link <username> - Hubungkan akun\n"
            "/update_ticket - Update status tiket tugas"
        )

    # --- WIZARD HANDLERS ---
    
    async def start_wizard_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        user = update.effective_user
        db: Session = SessionLocal()
        try:
            db_user = db.query(UserDB).filter(UserDB.chat_id == user.id).first()
            if not db_user:
                await update.message.reply_text("⛔ Akun Telegram belum terhubung. Gunakan `/link <username>` dulu.")
                return ConversationHandler.END

            tickets = db.query(NetworkNodeDB).filter(
                NetworkNodeDB.nama_teknisi == db_user.full_name,
                NetworkNodeDB.ticket_status != "CLOSED"
            ).all()

            if not tickets:
                await update.message.reply_text(
                    "✅ Tidak ada tiket aktif yang assigned ke Anda. Santai dulu bos!\n\n"
                    "*(Pastikan Nama Lengkap di Dashboard sama dengan Nama Teknisi di Data)*"
                )
                return ConversationHandler.END
            
            keyboard = []
            for t in tickets:
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
        query = update.callback_query
        await query.answer()
        
        data = query.data
        if data == "cancel":
            await query.edit_message_text("❌ Update dibatalkan.")
            return ConversationHandler.END
            
        context.user_data['ticket_id'] = int(data)
        
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
            await query.edit_message_text("🔙 Kembali ke awal. Ketik /update_ticket lagi.")
            return ConversationHandler.END
            
        context.user_data['new_status'] = status
        
        # BARU: Minta Share Location dulu (Anti-Cheat)
        await query.edit_message_text(
            f"📝 **Status dipilih: {status}**\n\n"
            "📍 **Wajib Check-in Lokasi!**\n"
            "Silakan tap tombol **Attach (📎)** -> pilih **Location** -> **Send current location**.\n\n"
            "⚠️ Jangan kirim link Google Maps atau teks koordinat manual!"
        )
        return self.REQUEST_LOCATION

    async def handle_location_checkin(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle native location attachment"""
        if not update.message.location:
             await update.message.reply_text("⚠️ Wajib kirim lokasi via Attachment (📎) Telegram!")
             return self.REQUEST_LOCATION

        loc = update.message.location
        # Simpan koordinat di context
        context.user_data['lat'] = loc.latitude
        context.user_data['long'] = loc.longitude
        
        # Lanjut ke RFO
        await update.message.reply_text(
            f"✅ **Lokasi Diterima!**\n"
            f"Setpoint: {loc.latitude}, {loc.longitude}\n\n"
            "Sekarang tulis **Keterangan / RFO** pengerjaannya:\n"
            "(Contoh: Kabel putus digigit tikus, sudah disambung aman)"
        )
        return self.INPUT_RFO

    async def reject_fake_location(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Tolak input teks/link maps"""
        await update.message.reply_text(
            "⛔ **DILARANG CURANG!** ⛔\n\n"
            "Mohon jangan ketik koordinat manual atau kirim link Google Maps.\n"
            "Gunakan fitur **Share Location** asli dari Telegram (tombol 📎)."
        )
        return self.REQUEST_LOCATION

    async def handle_rfo_input(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        rfo_text = update.message.text
        context.user_data['rfo'] = rfo_text
        
        await update.message.reply_text(
            "📸 **Upload Bukti Foto (Opsional)**\n"
            "Kirim foto perbaikan biar afdol (atau ketik /skip kalo gak ada)."
        )
        return self.UPLOAD_EVIDENCE

    async def handle_evidence_upload(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        context.user_data['evidence'] = "Foto diterima" 
        return await self.finalize_update(update, context)

    async def skip_evidence(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        context.user_data['evidence'] = None
        return await self.finalize_update(update, context)

    async def finalize_update(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        ticket_id = context.user_data['ticket_id']
        new_status = context.user_data['new_status']
        rfo = context.user_data['rfo']
        # Ambil lokasi
        lat = context.user_data.get('lat')
        long = context.user_data.get('long')
        
        db: Session = SessionLocal()
        try:
            ticket = db.query(NetworkNodeDB).filter(NetworkNodeDB.id == ticket_id).first()
            if ticket:
                ticket.ticket_status = new_status
                if new_status == "CLOSED":
                     ticket.status_rfo = "CLOSE"
                elif new_status == "KENDALA":
                     ticket.status_rfo = "KENDALA"
                else:
                     ticket.status_rfo = "ON PROGRESS"
                
                # Format keterangan dengan Lokasi
                loc_string = f" | [Loc: {lat}, {long}]" if lat else ""
                ticket.keterangan = f"{ticket.keterangan or ''} | {datetime.now().strftime('%d/%m %H:%M')}: {rfo}{loc_string}"
                db.commit()
                
                await update.message.reply_text(
                    f"✅ **Tiket #{ticket.id} Berhasil Diupdate!**\n\n"
                    f"Status: {new_status}\n"
                    f"RFO: {rfo}\n"
                    f"Lokasi: {lat}, {long}\n\n"
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

    # --- ATTENDANCE HANDLERS ---

    async def absen_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        user = update.effective_user
        db: Session = SessionLocal()
        try:
            db_user = db.query(UserDB).filter(UserDB.chat_id == user.id).first()
            if not db_user:
                await update.message.reply_text("⛔ Akun Telegram belum terhubung. Gunakan `/link <username>` dulu.")
                return ConversationHandler.END
            
            await update.message.reply_text(
                "☀️ **Absensi Harian**\n\n"
                "📍 **Wajib Share Location!**\n"
                "Silakan tap tombol **Attach (📎)** -> **Location** -> **Send current location**."
            )
            return self.ABSEN_LOCATION
            
        finally:
            db.close()

    async def handle_absen_location(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        if not update.message.location:
             await update.message.reply_text("⚠️ Wajib kirim lokasi via Attachment (📎) Telegram!")
             return self.ABSEN_LOCATION

        loc = update.message.location
        context.user_data['absen_lat'] = loc.latitude
        context.user_data['absen_long'] = loc.longitude
        
        await update.message.reply_text(
            "📸 **Satu langkah lagi!**\n"
            "Kirim **Foto Selfie** Anda sekarang (Wajib)."
        )
        return self.ABSEN_SELFIE

    async def handle_absen_selfie(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        photo = update.message.photo[-1]
        file_id = photo.file_id
        
        lat = context.user_data['absen_lat']
        long = context.user_data['absen_long']
        user = update.effective_user
        
        db: Session = SessionLocal()
        try:
            db_user = db.query(UserDB).filter(UserDB.chat_id == user.id).first()
            
            # Save to DB
            from models.attendance import AttendanceDB
            new_absen = AttendanceDB(
                user_id=db_user.id,
                latitude=lat,
                longitude=long,
                photo_file_id=file_id,
                keterangan="Present"
            )
            db.add(new_absen)
            db.commit()
            
            # Broadcast to Group
            group_id = os.getenv("TELEGRAM_ABSENCE_GROUP_ID")
            if group_id:
                caption = (
                    f"✅ **Absensi Masuk**\n"
                    f"👤 **Nama:** {db_user.full_name}\n"
                    f"⏰ **Waktu:** {datetime.now().strftime('%d/%m/%Y %H:%M')}\n"
                    f"📍 **Lokasi:** {lat}, {long}\n"
                    f"#ABSEN #WOC"
                )
                await context.bot.send_photo(chat_id=group_id, photo=file_id, caption=caption)
            else:
                logger.warning("TELEGRAM_ABSENCE_GROUP_ID not set")

            await update.message.reply_text("✅ **Absensi Berhasil!** Selamat bekerja! 💪")
            
        except Exception as e:
            logger.error(f"Error absen: {e}")
            await update.message.reply_text("❌ Gagal menyimpan absen. Coba lagi.")
        finally:
            db.close()
            
        return ConversationHandler.END

# Singleton instance
bot_service = BotService()
