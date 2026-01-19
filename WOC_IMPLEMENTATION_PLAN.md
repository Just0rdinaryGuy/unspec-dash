# Master Implementation Plan: WOC Job Management System

**Status**: FINAL MASTER SPECIFICATION 👑
**Codename**: Project WOC (Warga Online Ceria)

Dokumen ini adalah **Rencana Induk** yang menggabungkan seluruh kebutuhan arsitektur, database, bot, dan dashboard yang telah disepakati.

---

## 1. Arsitektur & Alur Kerja

### Konsep Utama
*   **Headless Technician**: Teknisi bekerja 100% via Telegram Bot (tanpa login web).
*   **Web Dashboard**: Pusat kendali bagi Admin/Helpdesk.
*   **Zero-Local Storage**: Foto bukti tidak didownload ke server VPS, melainkan di-stream langsung dari Telegram Cloud via `file_id`.

### Status Lifecycle
1.  **OPEN (Creation)**
    *   **Sumber**: Import Excel (Bulk) atau Input Manual.
    *   **Kondisi**: Tiket tersimpan di DB, belum ada Tim yang ditunjuk (`assigned_team_id = NULL`).
2.  **IN_PROGRESS (Distribution)**
    *   **Trigger**: Helpdesk melakukan assign Team di Dashboard.
    *   **Action**: Status berubah otomatis, Bot mengirim notifikasi ke Grup Tim.
3.  **CLOSED / KENDALA (Resolution)**
    *   **Trigger**: Teknisi melakukan update laporan via Bot.
    *   **Action**: Data RFO, Material, Foto, dan Lokasi tersimpan. Tiket selesai.

---

## 2. Skema Database (PostgreSQL)

### A. Tabel `teams` (Manajemen Tim & Sektor)
| Kolom | Tipe | Keterangan |
| :--- | :--- | :--- |
| `id` | SERIAL (PK) | |
| `team_name` | VARCHAR | Nama Unik (Contoh: "SURYA-JAURDAN") |
| `telegram_group_id` | BIGINT | ID Grup Telegram (untuk notifikasi blast) |
| `sector` | VARCHAR | **Grouping Sektor** (Contoh: "BATU AMPAR", "PENAJAM") |

### B. Tabel `users` (Personel)
| Kolom | Tipe | Keterangan |
| :--- | :--- | :--- |
| `id` | SERIAL (PK) | |
| `full_name` | VARCHAR | Nama Lengkap |
| `role` | ENUM | `ADMIN`, `HELPDESK`, `TECHNICIAN` |
| `telegram_chat_id` | BIGINT | ID Akun Telegram (Wajib untuk notifikasi personal) |
| `team_id` | INT (FK) | Relasi ke Tim (Member Tim) |
| `last_lat` | FLOAT | **[NEW]** Latitude Terakhir |
| `last_long` | FLOAT | **[NEW]** Longitude Terakhir |
| `last_seen` | TIMESTAMP | **[NEW]** Waktu Update Terakhir |

### C. Tabel `woc_tickets` (Transaksi Utama)
| Kolom | Tipe | Keterangan |
| :--- | :--- | :--- |
| `id` | SERIAL (PK) | |
| `incident_no` | VARCHAR | Nomor Insiden (Unique, Format INC...) |
| `service_no` | VARCHAR | Nomor Layanan / ND |
| `status` | VARCHAR | `OPEN`, `IN_PROGRESS`, `CLOSED`, `KENDALA` |
| `checklist` | VARCHAR | Kategori Tiket (HVC_GOLD, SILVER, dll) |
| `summary` | TEXT | Deskripsi keluhan pelanggan |
| `assigned_team_id`| INT (FK) | Tim Penanggung Jawab |
| `created_at` | TIMESTAMP | Waktu Import/Input |
| `updated_at` | TIMESTAMP | Waktu Closing |

### D. Tabel `ticket_updates` (Log Laporan Lapangan)
| Kolom | Tipe | Keterangan |
| :--- | :--- | :--- |
| `id` | SERIAL (PK) | |
| `ticket_id` | INT (FK) | Relasi ke Tiket |
| `technician_id` | INT (FK) | Teknisi Pelapor |
| `status_update` | VARCHAR | Status Akhir |
| `description` | TEXT | RFO (Reason For Outage) |
| `material_usage` | JSONB | **Struktur Material** (Contoh: `{"dc": 100, "soc": 2}`) |
| `coordinates` | VARCHAR | Geotagging (Lat, Long) |
| `file_id_house` | VARCHAR | ID Foto Rumah |
| `file_id_odp` | VARCHAR | ID Foto ODP |
| `file_id_dc_route`| VARCHAR | ID Foto Jalur DC |
| `file_id_cause` | VARCHAR | ID Foto Penyebab |
| `file_id_progress`| VARCHAR | ID Foto Progres |
| `file_id_after` | VARCHAR | ID Foto Setelah Progres |
| `file_id_redaman` | VARCHAR | ID Foto Redaman (Bukti Sinyal) |
| `file_id_sn_ont` | VARCHAR | ID Foto SN ONT |
| `file_id_material`| VARCHAR | ID Foto Material |

---

## 3. Spesifikasi Bot Telegram

### A. Notifikasi Assignment (WOC Custom Style)
Format pesan saat Helpdesk menunjuk tim. Data penting diformat `code` agar mudah disalin (Click-to-Copy).

```text
🚀 **NEW JOB ASSIGNMENT**
Tim: **SURYA-JAURDAN**
➖➖➖➖➖➖➖➖➖➖➖➖
🆔 Ticket: `INC44486767`
👤 Service: `162105102907`
⚠️ Checklist: **HVC_GOLD**

📍 **LOKASI:**
`Jl. Mulawarman No 45, RT 02 (Depan Indomaret)`
*SEKTOR BATU AMPAR*

📜 **SUMMARY / KELUHAN:**
`Pelanggan lapor internet mati total, lampu LOS merah.`

⏰ **SLA Target:** 2026-01-08 18:00
➖➖➖➖➖➖➖➖➖➖➖➖
👉 /update_INC44486767 (Klik untuk lapor)
```

### B. Wizard Laporan (Interaksi Teknisi)
Alur input laporan bertahap untuk memastikan kelengkapan data.

1.  **Status**: Bot menanyakan status akhir (`[✅ CLOSED]`, `[🚧 KENDALA]`).
2.  **Penyebab**: Pilih kategori (`[Putus]`, `[Modul]`, `[Lainnya]`).
3.  **Input Detail**: Input teks RFO.
4.  **Input Material** (Structured):
    *   "Berapa meter Dropcore?" (Input Angka)
    *   "Berapa pcs SOC?" (Input Angka)
    *   "Berapa pcs Prekso?" (Input Angka)
5.  **Gallery (9 Foto)**:
    *   Upload foto satu per satu.
    *   Tersedia tombol `[⏭ SKIP]` untuk foto opsional (Rumah, ODP, Jalur DC, Material).
    *   Foto Wajib: Penyebab, Progres, After, Redaman, SN ONT.
6.  **Lokasi**: Share Live Location.
7.  **Auto-Report**: Bot mengirim Laporan Selesai ke **Grup Telegram Tim**.

---

## 4. Spesifikasi Dashboard Analytics

### A. Tabel Produktifitas Sektor
Menampilkan kinerja tim per area dengan breakdown status detail:
*   **Grouping**: Berdasarkan `teams.sector`.
*   **Kolom Metric**: 
    1.  **Progress**: Sedang dikerjakan (In Progress).
    2.  **Kendala Pelanggan (KP)**: Pending sisi pelanggan.
    3.  **Kendala Teknisi (KT)**: Pending sisi teknis/infra.
    4.  **Closed**: Selesai hari ini.
    5.  **Total Tiket**.

### B. Laporan Penggunaan Material
Rekapitulasi logistik dari input teknisi.
*   **Data Source**: Parsing kolom JSONB `material_usage`.
*   **Tampilan**: Tabel Total per Sektor (Total DC meter, Total SOC pcs, dll).

### C. Trend Order Chart
Grafik garis untuk memantau volume tiket harian.
*   **X-Axis**: Tanggal.
*   **Y-Axis**: Jumlah Tiket.
*   **Series**: Dibedakan per Kategori Tiket (HVC, Reguler, Unspec, WA).

---

### E. Realtime Location Tracking (Live Map)
Fitur monitoring posisi teknisi secara real-time.
1.  **Bot Logic**:
    *   Teknisi melakukan Check-in: `/absen_masuk`.
    *   Bot meminta **Share Live Location** (Durasi 8 Jam).
    *   Backend menerima event `edited_message` dari Telegram setiap kali posisi berubah.
2.  **Database**:
    *   Update tabel `users`: tambah kolom `last_lat`, `last_long`, `last_seen`.
3.  **Frontend (Map Dashboard)**:
    *   Halaman Peta (Leaflet/Mapbox).
    *   Marker bergerak sesuai update terakhir teknisi.
    *   Status indikator (Active/Inactive berdasarkan `last_seen`).

---

## 5. Rencana Eksekusi (Phase 2)
1.  **Database Migration**: Membuat tabel `teams`, `users`, `woc_tickets` , `ticket_updates`.
2.  **Backend Logic**: 
    *   Setup Webhook & State Machine.
    *   Implementasi Listener `Live Location`.
3.  **Frontend**: Dashboard Monitoring & Realtime Maps.
