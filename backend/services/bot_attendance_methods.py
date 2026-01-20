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

    async def cancel_absen(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        await update.message.reply_text("❌ Absen dibatalkan.")
        return ConversationHandler.END
