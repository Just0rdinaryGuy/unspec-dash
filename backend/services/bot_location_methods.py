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
