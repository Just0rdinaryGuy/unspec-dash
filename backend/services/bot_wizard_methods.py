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
            # TODO: Logic assignment yang lebih canggih (by Team)
            tickets = db.query(NetworkNodeDB).filter(
                NetworkNodeDB.nama_teknisi == db_user.full_name, # Simple match
                NetworkNodeDB.ticket_status != "CLOSED"
            ).all()

            if not tickets:
                await update.message.reply_text("✅ Tidak ada tiket aktif yang assigned ke Anda. Santai dulu bos!")
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
        keyboard = [
            [InlineKeyboardButton("🚧 PROGRESS (Sedang Dikerjakan)", callback_data="PROGRESS")],
            [InlineKeyboardButton("✅ CLOSED (Selesai)", callback_data="CLOSED")],
            [InlineKeyboardButton("⚠️ KENDALA (Pending)", callback_data="KENDALA")],
            [InlineKeyboardButton("⬅️ Kembali", callback_data="back")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await query.edit_message_text(
            f"🔧 **Update Status Tiket #{data}:**\nPilih status baru:",
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
            "Silakan ketik **Keterangan / RFO** pengerjaan:\n"
            "(Contoh: Kabel putus digigit tikus, sudah disambung)"
        )
        return self.INPUT_RFO

    async def handle_rfo_input(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """User input text RFO"""
        rfo_text = update.message.text
        context.user_data['rfo'] = rfo_text
        
        # Minta Bukti Foto
        await update.message.reply_text(
            "📸 **Upload Bukti Foto (Opsional)**\n"
            "Kirim foto perbaikan (atau ketik /skip jika tidak ada)."
        )
        return self.UPLOAD_EVIDENCE

    async def handle_evidence_upload(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """User upload foto"""
        photo_file = await update.message.photo[-1].get_file()
        # TODO: Save photo to server/S3
        # photo_url = photo_file.file_path 
        
        # Mocking save logic
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
                ticket.status_rfo = "CLOSE" if new_status == "CLOSED" else "ON PROGRESS"
                ticket.keterangan = f"{ticket.keterangan or ''} | {datetime.now().strftime('%d/%m %H:%M')}: {rfo}"
                # ticket.evidence = ...
                db.commit()
                
                await update.message.reply_text(
                    f"✅ **Tiket #{ticket.id} Berhasil Diupdate!**\n"
                    f"Status: {new_status}\n"
                    f"Ket: {rfo}"
                )
            else:
                await update.message.reply_text("❌ Tiket tidak ditemukan saat menyimpan.")
                
        except Exception as e:
            logger.error(f"Error finalizing ticket: {e}")
            await update.message.reply_text("❌ Gagal menyimpan data.")
        finally:
            db.close()
            
        return ConversationHandler.END

    async def cancel_wizard(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        await update.message.reply_text("❌ Wizard dibatalkan.")
        return ConversationHandler.END
