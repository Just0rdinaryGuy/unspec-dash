# Dashboard Monitoring Unspec WOC Balikpapan 🚀

> **Sistem Monitoring dan Manajemen Jaringan berbasis Web untuk PT Telkom Akses**

Platform web modern yang dirancang khusus untuk membantu tim HD WOC Balikpapan dalam memonitor, menganalisis, dan mengelola node jaringan yang mengalami Unspec (redaman tidak sesuai standar). Aplikasi ini menyediakan dashboard real-time, sistem pelaporan otomatis, dan tracking tiket service recovery.

---

## 📋 Daftar Isi

- [Tentang Aplikasi](#-tentang-aplikasi)
- [Fitur Utama](#-fitur-utama)
- [Teknologi yang Dipakai](#%EF%B8%8F-teknologi-yang-dipakai)
- [Arsitektur Sistem](#-arsitektur-sistem)
- [Cara Install](#-cara-install)
- [Cara Pakai](#-cara-pakai)
- [Alur Kerja Aplikasi](#-alur-kerja-aplikasi)
- [Panduan User](#-panduan-user)
- [Database Schema](#-database-schema)
- [API Documentation](#-api-documentation)
- [Troubleshooting](#-troubleshooting)
- [Maintenance](#-maintenance)
- [Kontribusi](#-kontribusi)

---

## 🎯 Tentang Aplikasi

### Latar Belakang

Dalam operasional jaringan PT Telkom Akses, salah satu parameter kritis yang harus dipantau adalah **redaman** (signal loss) pada setiap node pelanggan. Redaman yang tidak sesuai standar (UNSPEC) dapat menyebabkan degradasi kualitas layanan atau bahkan service down.

Sebelumnya, proses monitoring dan reporting dilakukan secara manual menggunakan Excel, yang memiliki beberapa kendala:
- **Inefficient**: Update data memakan waktu lama
- **Error-prone**: Risiko human error dalam input dan kalkulasi
- **No Real-time**: Data tidak ter-update secara real-time
- **Limited Analysis**: Sulit melakukan analisis trend
- **Poor Collaboration**: Sulit koordinasi antar tim

### Solusi

Dashboard Monitoring Unspec  hadir sebagai solusi **digitalisasi** dan **automasi** proses monitoring jaringan dengan fitur:

✅ **Auto-import** dari Excel semesta dan hasil ukur ulang  
✅ **Dashboard real-time** dengan visualisasi data interaktif  
✅ **Sistem reporting** otomatis dengan grafik trend  
✅ **Tracking tiket** service recovery untuk maintenance  
✅ **Filter & Search** advanced untuk analisis detail  
✅ **Export report** ke Excel untuk dokumentasi  
✅ **User management** dengan role-based access  

### Manfaat

**Untuk Tim Operasional:**
- Monitoring kondisi jaringan lebih cepat dan akurat
- Identifikasi problem area dengan mudah
- Tracking progress perbaikan jaringan
- Report otomatis tanpa manual input

**Untuk Management:**
- Dashboard KPI real-time
- Trend analysis untuk decision making
- Dokumentasi lengkap untuk audit
- Monitoring performa tim teknisi

**Untuk Skripsi/Akademik:**
- Studi kasus nyata implementasi Full-stack Web App
- Best practices Software Engineering
- Dokumentasi lengkap sistem
- Production-ready codebase

---

## ✨ Fitur Utama

### 1. Dashboard Overview 📊

**Fungsi:**
- Tampilan ringkasan kondisi jaringan secara keseluruhan
- Monitoring KPI utama dalam bentuk cards dan chart

**Fitur Detail:**
- **Total Customer per Tipe**
  - Breakdown pelanggan: Diamond, Gold, Platinum, Regular
  - Total keseluruhan customer
  
- **Kualitas Jaringan**
  - Persentase node SPEC vs UNSPEC
  - Progress bar visual
  - Trend indicator
  
- **Ticket Status**
  - Total tiket maintenance
  - Split antara Open vs Closed
  
- **HVC Distribution Table**
  - Distribusi pelanggan HVC per STO
  - Pivot table interaktif
  
- **Status Kurma (SPEC/UNSPEC) Table**
  - Breakdown SPEC vs UNSPEC per STO
  - Identifikasi area problematik
  
- **Top ODP List**
  - List ODP dengan subscriber terbanyak
  - Prioritas maintenance

**Use Case:**
Setiap pagi, supervisor bisa langsung lihat kondisi jaringan secara keseluruhan, identifikasi STO mana yang paling banyak UNSPEC, dan prioritaskan tim untuk handle area tersebut.

---

### 2. Data Explorer 🔍

**Fungsi:**
- Browse dan explore data network node secara detail
- Filter dan search advanced

**Fitur Detail:**
- **High-density Table**
  - Display semua node dengan 10+ columns
  - Info lengkap: ND, ODP, RX Power, Status, dll
  
- **Filtering Multi-dimensi**
  - Filter by STO (multiple selection)
  - Filter by Sektor
  - Filter by Status (SPEC/UNSPEC)
  
- **Search**
  - Cari by ND (Node ID)
  - Cari by ODP
  
- **Pagination**
  - Load 150 rows per page
  - Navigation controls
  - Total count display
  
- **Color Coding**
  - SPEC = Green (signal bagus)
  - UNSPEC = Red (signal jelek, perlu perbaikan)
  
- **Export to Excel**
  - Download filtered data
  - Auto-formatted columns
  - Timestamp included

**Use Case:**
Tim teknisi butuh list semua node UNSPEC di STO tertentu untuk dijadwalkan maintenance. Mereka bisa filter by STO + Status UNSPEC, lalu export ke Excel untuk dibawa ke lapangan.

---

### 3. Service Recovery Tickets 🎫

**Fungsi:**
- Tracking dan management tiket perbaikan jaringan
- Monitor progress teknisi

**Fitur Detail:**
- **Ticket Table**
  - Tanggal tiket
  - STO dan ODP
  - Nama teknisi yang handle
  - Nomor tiket
  - Redaman awal vs akhir
  - Status RFO (Reason for Outage)
  - ND terkait
  
- **Inline Editing**
  - Edit langsung di table
  - Field yang editable:
    - Nama Teknisi
    - No Tiket
    - Redaman Akhir
    - Status RFO
    - Keterangan
  - Auto-save
  
- **Filtering**
  - By Status (OPEN/CLOSED)
  - By STO
  - By Date
  - By SPEC Status
  
- **Search**
  - Search by ND
  - Search by ODP
  
- **Ticket Statistics Cards**
  - Total tiket
  - Open count
  - Close count
  - Average resolution time
  
- **Export**
  - Export filtered tickets ke Excel
  - Include all details

**Use Case:**
Supervisor assign tiket ke teknisi A untuk perbaiki 20 node UNSPEC. Teknisi A update progress real-time di aplikasi: update status RFO, input redaman hasil ukur ulang, close tiket. Supervisor bisa monitor progress secara live tanpa perlu telpon-telponan.

---

### 4. Report Bulanan 📈

**Fungsi:**
- Generate dan visualisasi laporan harian/bulanan
- Tracking trend Unspec dari waktu ke waktu

**Fitur Detail:**
- **Date Selector**
  - Pilih bulan dan tahun
  - Auto-load data
  
- **Saldo Unspec Chart**
  - Combined Bar + Line Chart
  - Bar: Total Saldo (jumlah unspec hari itu)
  - Bar: Close (jumlah yang selesai diperbaiki)
  - Line: Saldo Lama (sisa unspec dari hari sebelumnya)
  - Line: Target (target maksimal unspec)
  - Interactive tooltip
  - Real-time clock display
  
- **Report Table**
  - Daily breakdown per tanggal
  - Columns:
    - Tanggal
    - Total Saldo
    - Close
    - Saldo Lama
    - Target
  - Color coding untuk exceed target
  
- **Export Report**
  - Download ke Excel format
  - Multi-sheet:
    - Sheet 1: Summary Report
    - Sheet 2: Detail Unspec
    - Sheet 3: Data Ukur Massal
  - Include chart di Excel
  - Auto-formatted

**Use Case:**
Akhir bulan, supervisor perlu buat laporan untuk manager. Tinggal pilih bulan, klik export, langsung dapet Excel lengkap dengan chart yang bisa langsung di-attach ke email atau presentasi.

---

### 5. Update Data 📤

**Fungsi:**
- Upload dan import data dari Excel
- Auto-parse dan validasi data

**Fitur Detail:**
- **Dual File Upload**
  - File 1: Unspec Semesta (data jaringan lengkap)
  - File 2: Ukur Massal (hasil pengukuran ulang)
  - Drag & drop support
  - File preview
  
- **Auto-detection**
  - Otomatis detect tipe file
  - Validasi header dan structure
  
- **Smart Merge**
  - Auto-merge data dari 2 file
  - VLOOKUP otomatis
  - Match by ND
  
- **Auto-categorization**
  - Auto-detect SPEC/UNSPEC berdasarkan threshold (-24.89 to -13.5 dB)
  - Flag HVC customer
  
- **Import Mode**
  - **Full Import**: Upload kedua file, replace all data
  - **Partial Update**: Upload hanya Ukur Massal, update redaman saja
  
- **Progress Indicator**
  - Upload progress bar
  - Processing status
  
- **Import Summary**
  - Total rows imported
  - SPEC count
  - UNSPEC count
  - Timestamp import
  
- **Auto Report Generation**
  - Otomatis generate daily report
  - Update statistics

**Use Case:**
Setiap hari, tim dapat data export dari sistem semesta Telkom dalam format Excel. Mereka tinggal drag-drop file ke aplikasi, sistem otomatis proses, categorize, dan update dashboard. Gak perlu manual copy-paste atau formula Excel lagi.

---

### 6. User Management 👥

**Fungsi:**
- Manage user access dan permissions
- Role-based access control

**Fitur Detail:**
- **User List Table**
  - Username
  - NIK
  - Full name
  - Role (admin/developer/user)
  - Status (active/inactive)
  - Actions
  
- **User Registration**
  - Self-registration dengan approval workflow
  - Input: username, NIK, password, nama lengkap
  - Default inactive → Admin approve → Active
  
- **Role Management**
  - **Admin**: Full access semua fitur
  - **Developer**: Access untuk testing dan development
  - **User**: Read-only, no edit/delete
  
- **User Activation/Deactivation**
  - Admin bisa activate/deactivate user
  - Deactive user ga bisa login
  
- **Inline Edit**
  - Edit nama, role, status langsung di table

**Use Case:**
Teknisi baru join tim. Dia register sendiri di aplikasi. Admin terima notifikasi, verify NIK-nya, approve, set role sebagai "user". Teknisi baru bisa langsung akses dashboard untuk liat data, tapi ga bisa edit atau delete.

---

## 🛠️ Teknologi yang Dipakai

### Frontend (Client-side)

**Framework & Library:**
- **Next.js 14** - React framework dengan Server-Side Rendering
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Re-usable component library
- **Recharts** - Chart dan visualization library
- **Axios** - HTTP client
- **date-fns** - Date utility
- **XLSX** - Excel file processing

**Why:**
- Next.js: Fast, SEO-friendly, modern React framework
- TypeScript: Catch bugs early, better code maintainability
- Tailwind: Rapid UI development, consistent design
- Recharts: Beautiful interactive charts
- shadcn/ui: Production-ready components

### Backend (Server-side)

**Framework & Library:**
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - SQL ORM
- **PostgreSQL 15** - Production database
- **Pydantic** - Data validation
- **Pandas** - Data processing
- **openpyxl** - Excel file reading
- **XlsxWriter** - Excel file generation
- **python-jose** - JWT tokens
- **passlib** - Password hashing

**Why:**
- FastAPI: Super fast, auto-generated API docs, async support
- PostgreSQL: Robust, scalable, production-ready
- Pandas: Powerful data manipulation
- SQLAlchemy: Database agnostic, migration support

### Infrastructure

**Containerization:**
- **Docker** - Container platform
- **Docker Compose** - Multi-container orchestration

**Why:**
- Consistent environment across dev/staging/prod
- Easy deployment
- Isolated services
- Scalable architecture

---

## 🏗️ Arsitektur Sistem

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                         │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Browser   │  │  Browser   │  │  Browser   │            │
│  │  (Admin)   │  │  (User 1)  │  │  (User 2)  │            │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘            │
│        │                │                │                   │
│        └────────────────┼────────────────┘                   │
│                         │                                    │
└─────────────────────────┼────────────────────────────────────┘
                          │ HTTP/HTTPS
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND LAYER                           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │            Next.js 14 Application                     │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │  │
│  │  │  Pages   │  │Components│  │  Utils   │           │  │
│  │  ├──────────┤  ├──────────┤  ├──────────┤           │  │
│  │  │Dashboard │  │  Charts  │  │   Auth   │           │  │
│  │  │Reports   │  │  Tables  │  │ Formatter│           │  │
│  │  │Tickets   │  │  Forms   │  │ Constants│           │  │
│  │  └──────────┘  └──────────┘  └──────────┘           │  │
│  └───────────────────────────────────────────────────────┘  │
│                  Port: 3000                                  │
└─────────────────────────┼───────────────────────────────────┘
                          │ REST API
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND LAYER                           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              FastAPI Application                      │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │  │
│  │  │ Routers  │  │ Services │  │  Models  │           │  │
│  │  ├──────────┤  ├──────────┤  ├──────────┤           │  │
│  │  │Dashboard │  │Real Data │  │ Network  │           │  │
│  │  │Tickets   │  │  Service │  │ Report   │           │  │
│  │  │Reports   │  │Auth Svc  │  │   User   │           │  │
│  │  │Import    │  │          │  │          │           │  │
│  │  └──────────┘  └──────────┘  └──────────┘           │  │
│  │                                                       │  │
│  │  ┌──────────┐  ┌──────────┐                         │  │
│  │  │  Utils   │  │   Auth   │                         │  │
│  │  ├──────────┤  ├──────────┤                         │  │
│  │  │Excel     │  │   JWT    │                         │  │
│  │  │Import    │  │Password  │                         │  │
│  │  └──────────┘  └──────────┘                         │  │
│  └───────────────────────────────────────────────────────┘  │
│                  Port: 8000                                  │
└─────────────────────────┼───────────────────────────────────┘
                          │ SQL
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                     DATABASE LAYER                           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │         PostgreSQL 15 (Production)                    │  │
│  │  ┌──────────────┐  ┌──────────────┐                  │  │
│  │  │network_nodes │  │daily_reports │                  │  │
│  │  │   (1000+)    │  │    (60+)     │                  │  │
│  │  └──────────────┘  └──────────────┘                  │  │
│  │                                                       │  │
│  │  ┌──────────────┐                                    │  │
│  │  │    users     │                                    │  │
│  │  │              │                                    │  │
│  │  └──────────────┘                                    │  │
│  │                                                       │  │
│  │  Volume: postgres_data (Persistent)                  │  │
│  └───────────────────────────────────────────────────────┘  │
│                  Port: 5432                                  │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

**1. Import Flow (Upload Excel)**
```
User Upload Excel → Frontend validate file → 
→ POST /api/import → Backend parse Excel → 
→ Detect file type → Merge data → 
→ Calculate SPEC/UNSPEC → Save to DB → 
→ Generate daily report → Return summary
```

**2. Dashboard Flow**
```
User open dashboard → GET /api/dashboard/summary → 
→ Backend query DB → Calculate stats → 
→ Return JSON → Frontend render charts
```

**3. Ticket Update Flow**
```
User edit ticket → PUT /api/tickets/{id} → 
→ Backend validate → Update DB → 
→ Return updated ticket → Frontend refresh table
```

---

## 🚀 Cara Install

### Prerequisites

Sebelum install, pastikan sudah install tools ini:

1. **Docker Desktop**
   - Download: https://www.docker.com/products/docker-desktop
   - Version: 20.10 atau lebih baru
   
2. **Git** (optional, untuk clone)
   - Download: https://git-scm.com/downloads

### Installation Steps

#### Option 1: Pakai Docker (Recommended)

1. **Clone Repository**
   ```bash
   git clone https://github.com/Just0rdinaryGuy/unspec-dash.git
   cd unspec-dash
   ```

2. **Start Aplikasi**
   ```bash
   docker-compose up -d
   ```
   
   Tunggu sampai semua container download dan start (~5 menit pertama kali)

3. **Akses Aplikasi**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

4. **Login**
   - Buat user baru di halaman Register
   - Atau pakai default admin (jika sudah ada di DB)

#### Option 2: Manual Install (Development)

**Backend:**
```bash
cd backend

# Install uv (package manager)
pip install uv

# Install dependencies
uv pip install -e .

# Setup database URL
# Edit .env file atau set environment variable:
# DATABASE_URL=postgresql://gpon_user:password@localhost:5432/gpon_network

# Run database migration
python -c "from database import init_db; init_db()"

# Start server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd frontend

# Install dependencies
npm install

# Setup environment
# Edit .env.local:
# NEXT_PUBLIC_API_URL=http://localhost:8000

# Start dev server
npm run dev
```

**PostgreSQL:**
```bash
# Install PostgreSQL 15
# Atau pakai Docker:
docker run -d \
  --name postgres-gpon \
  -e POSTGRES_DB=gpon_network \
  -e POSTGRES_USER=gpon_user \
  -e POSTGRES_PASSWORD=your_password \
  -p 5432:5432 \
  postgres:15-alpine
```

---

## 📖 Cara Pakai

### First Time Setup

1. **Akses Aplikasi**
   - Buka browser
   - Go to http://localhost:3000

2. **Register User Pertama**
   - Klik "Register" di halaman login
   - Isi form:
     - Username (huruf dan angka aja)
     - NIK
     - Password (min 8 karakter)
     - Nama Lengkap
   - Submit

3. **Activate User (Admin)**
   - User pertama otomatis jadi admin
   - Login dengan user pertama
   - Go to "Users" menu
   - Activate user lain yang register

4. **Upload Data Awal**
   - Go to "Update Data"
   - Upload File Unspec Semesta (Excel)
   - Upload File Ukur Massal (Excel)
   - Klik "Upload"
   - Tunggu proses selesai

5. **Lihat Dashboard**
   - Dashboard otomatis ter-update dengan data
   - Explore fitur-fitur lain

### Daily Operations

**Pagi Hari:**
1. Login
2. Lihat Dashboard → Check kondisi jaringan
3. Lihat Report → Check trend dari kemarin
4. Identifikasi area dengan UNSPEC tinggi

**Upload Data Baru:**
1. Dapat export Excel dari sistem Telkom
2. Go to "Update Data"
3. Upload file (Full Import atau Partial Update)
4. Verify di Dashboard bahwa data sudah update

**Assign & Track Tiket:**
1. Go to "Service Recovery"
2. Filter by STO atau status OPEN
3. Double-click cell untuk edit
4. Assign ke teknisi
5. Input nomor tiket
6. Save (auto)

**Update Progress Perbaikan:**
1. Teknisi selesai perbaiki
2. Edit tiket yang relevan
3. Update "Redaman Akhir" dengan hasil ukur
4. Update "Status RFO" jadi "CLOSED"
5. Input keterangan
6. Save

**Generate Report Bulanan:**
1. Go to "Report"
2. Pilih bulan dan tahun
3. Review data di table dan chart
4. Klik "Export to Excel"
5. Download file
6. Share ke management

---

## 🔄 Alur Kerja Aplikasi

### Workflow 1: Daily Monitoring dan Reporting

```mermaid
graph TD
    classDef default fill:none,stroke:#333,stroke-width:1px,color:#000000;
    A[Tim Telkom Akses Export Data dari Sistem] --> B[Data dalam format Excel]
    B --> C[Upload ke Web via 'Update Data']
    C --> D{Auto-process}
    D --> E[Parse Excel files]
    E --> F[Validate data structure]
    F --> G[Merge Unspec + Ukur Massal]
    G --> H[Calculate SPEC/UNSPEC]
    H --> I[Save to PostgreSQL]
    I --> J[Generate Daily Report]
    J --> K[Update Dashboard Stats]
    K --> L[Supervisor Monitor Dashboard]
    L --> M{Ada UNSPEC tinggi?}
    M -->|Ya| N[Assign ke Teknisi]
    M -->|Tidak| O[Continue Monitoring]
    N --> P[Create Service Ticket]
    P --> Q[Track Progress]
```

### Workflow 2: Service Recovery Process

```mermaid
graph TD
    classDef default fill:none,stroke:#333,stroke-width:1px,color:#000000;
    A[Identifikasi Node UNSPEC] --> B[Filter by STO/Area]
    B --> C[Create Ticket]
    C --> D[Assign ke Teknisi]
    D --> E[Teknisi ke Lapangan]
    E --> F[Lakukan Perbaikan]
    F --> G[Ukur Ulang Redaman]
    G --> H{SPEC?}
    H -->|Ya| I[Update Ticket: Status CLOSED]
    H -->|Tidak| J[Troubleshoot Lanjut]
    I --> K[Input Redaman Akhir]
    K --> L[Input Keterangan]
    L --> M[Save Ticket]
    M --> N[Supervisor Review]
    N --> O[Generate Report]
    J --> F
```

### Workflow 3: Monthly Reporting

```mermaid
graph TD
    classDef default fill:none,stroke:#333,stroke-width:1px,color:#000000;
    A[Akhir Bulan] --> B[Supervisor Login]
    B --> C[Go to Report Page]
    C --> D[Select Month & Year]
    D --> E[View Chart Trend]
    E --> F[Analyze Data]
    F --> G{Data OK?}
    G -->|Ya| H[Export to Excel]
    G -->|Tidak| I[Investigate Anomaly]
    H --> J[Download Report]
    J --> K[Attach to Email]
    K --> L[Send to Manager]
    I --> M[Check Detail di Data Explorer]
    M --> N[Fix Data jika perlu]
    N --> C
```

---

## 👨‍💻 Panduan User

### Login & Authentication

**Login:**
1. Akses http://localhost:3000
2. Masukkan username dan password
3. Klik "Login"
4. Redirect ke Dashboard

**Register:**
1. Klik "Register" di login page
2. Isi form lengkap
3. Submit
4. Tunggu admin approve
5. Akan dapat notifikasi (atau tanya admin)

**Logout:**
1. Klik icon user di sidebar
2. Pilih "Logout"

### Dashboard

**Cara Baca Cards:**
- **Total Customer Tipe**: Ringkasan customer breakdown
- **Kualitas Jaringan**: Persentase SPEC (green = bagus)
- **Ticket Status**: Monitoring tiket open vs closed

**Cara Pakai Tables:**
- Scroll horizontal untuk lihat semua kolom
- Hover untuk lihat detail

**Color Coding:**
- 🟢 Green = SPEC (bagus)
- 🔴 Red = UNSPEC (jelek, perlu perbaikan)
- 🔵 Blue = In progress

### Data Explorer

**Filter Data:**
1. Click dropdown "STO"
2. Pilih satu atau beberapa STO
3. Data otomatis ter-filter
4. Lakukan hal sama untuk Sektor dan Status

**Search:**
1. Ketik di search box
2. Cari by ND atau ODP
3. Real-time filter

**Pagination:**
1. Klik "Next" untuk halaman berikut
2. Klik "Previous" untuk halaman sebelum
3. Lihat "Page X of Y" untuk posisi saat ini

**Export:**
1. Filter data sesuai kebutuhan
2. Klik "Export to Excel"
3. File otomatis download
4. Buka di Excel

### Service Recovery

**Filter Tiket:**
1. Pilih "Status" (ALL/PROGRESS/CLOSED)
2. Pilih "STO"
3. Pilih "Date"
4. Table otomatis update

**Edit Tiket:**
1. **Double-click** cell yang mau diedit
2. Ketik value baru
3. Click di luar cell atau tekan Enter
4. Otomatis save ke database

**Field yang Bisa Diedit:**
- Nama Teknisi
- No Tiket
- Redaman Akhir
- Status RFO
- Keterangan

**Export Tiket:**
1. Filter sesuai kebutuhan
2. Klik "Export" button
3. Download Excel

### Report

**Select Period:**
1. Klik dropdown "Month"
2. Pilih bulan
3. Klik dropdown "Year"
4. Pilih tahun
5. Data otomatis load

**Baca Chart:**
- **Bar Biru (Total Saldo)**: Total UNSPEC hari itu
- **Bar Hijau (Close)**: Yang selesai diperbaiki hari itu
- **Line Orange (Saldo Lama)**: Sisa UNSPEC dari hari sebelum
- **Line Red (Target)**: Maksimal target UNSPEC

**Export Report:**
1. Pastikan sudah pilih bulan/tahun yang benar
2. Klik "Export to Excel"
3. Wait download selesai
4. Buka file Excel
5. Ada 3 sheets: Summary, Detail, Ukur Massal
6. Chart otomatis ter-embed

### Update Data

**Full Import (2 Files):**
1. Drag File 1 (Unspec Semesta) ke kotak pertama
2. Drag File 2 (Ukur Massal) ke kotak kedua
3. Preview file name muncul
4. Klik "Upload"
5. Wait process selesai
6. Lihat summary (total imported, SPEC count, UNSPEC count)

**Partial Update (1 File):**
1. **Hanya** upload File 2 (Ukur Massal)
2. Klik "Upload"
3. System akan update **hanya redaman** dari existing data
4. Daily report otomatis update

**Clear File:**
1. Klik icon X di preview
2. File di-remove dari upload queue

**Error Handling:**
Jika error saat upload:
- Check format Excel (header harus sesuai)
- Check file tidak corrupt
- Check internet connection
- Lihat error message untuk detail

### User Management (Admin Only)

**View Users:**
1. Go to "Users" menu (hanya admin yang bisa akses)
2. Lihat list semua user

**Activate User:**
1. Cari user yang status "Inactive"
2. Click toggle switch di kolom "Status"
3. Confirm
4. User sekarang bisa login

**Change Role:**
1. Double-click di cell "Role"
2. Pilih role baru (admin/developer/user)
3. Save

**Deactivate User:**
1. Click toggle di "Status" jadi OFF
2. User tidak bisa login lagi

---

## 🗄️ Database Schema

### Table: `network_nodes`

**Deskripsi:** Menyimpan semua data node jaringan 

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| id | INTEGER | Primary key, auto-increment | 1 |
| row_number | INTEGER | Nomor urut dari Excel | 1 |
| sto | VARCHAR | Nama STO | "BPN" |
| sector | VARCHAR | Sektor area | "BALIKPAPAN - TERITIP" |
| nd | VARCHAR | Node ID (subscriber ID) | "BPNOLT10-D6-TNG-4PBLKG01-0002" |
| odp | VARCHAR | ODP name | "BALIKPAPAN-ODP-FAT/D31/007" |
| port | VARCHAR | Port OLT | "1/1/2/22:4" |
| node_id | VARCHAR | IP OLT | "10.10.79.23" |
| fiber_length | VARCHAR | Panjang fiber | "2.5 KM" |
| rx_power_before | FLOAT | RX power dari unspec file | -18.5 |
| rx_power_after | FLOAT | RX power dari ukur massal | -20.3 |
| spec_status | VARCHAR | SPEC atau UNSPEC | "SPEC" |
| ticket_status | VARCHAR | Status tiket | "OPEN" / "CLOSED" |
| nama_teknisi | VARCHAR | Nama teknisi yang handle | "Raffy Jomok" |
| status_rfo | VARCHAR | Status RFO | "PERBAIKAN_FIBER" |
| no_tiket | VARCHAR | Nomor tiket | "INC123456" |
| tanggal_ukur_ulang | DATETIME | Tanggal ukur ulang | 2026-01-15 |
| import_date | DATETIME | Tanggal import data | 2026-01-17 10:30:00 |
| hvc_category | VARCHAR | Kategori HVC | "Gold" |
| created_at | TIMESTAMP | Waktu record dibuat | 2026-01-17 10:30:00 |

**Indexes:**
- Primary: `id`
- Index: `sto`, `sector`, `nd`, `spec_status`, `ticket_status`, `hvc_category`, `import_date`

**Business Rules:**
- `spec_status` = "SPEC" jika rx_power_after between -24.89 and -13.5 dB
- `spec_status` = "UNSPEC" jika diluar range tersebut
- `import_date` dipakai untuk filter data terbaru (avoid duplicates)

---

### Table: `daily_reports`

**Deskripsi:** Menyimpan laporan harian agregasi data Unspec

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| date | DATE | Tanggal laporan (PK) | 2026-01-17 |
| total_saldo | INTEGER | Total node UNSPEC hari itu | 508 |
| close | INTEGER | Total yang selesai diperbaiki | 87 |
| saldo_lama | INTEGER | Sisa UNSPEC dari hari sebelum | 421 |
| target | INTEGER | Target maksimal UNSPEC | 127 |
| created_at | TIMESTAMP | Waktu record dibuat | 2026-01-17 10:30:00 |
| updated_at | TIMESTAMP | Waktu terakhir update | 2026-01-17 15:20:00 |

**Indexes:**
- Primary: `date`

**Business Rules:**
- Auto-generate saat upload data baru
- `total_saldo` = COUNT(*) dari network_nodes untuk tanggal tersebut
- `close` = COUNT(*) dari network_nodes dengan ticket_status = 'CLOSED'
- `saldo_lama` = total_saldo - close (sisa yang belum selesai)
- `target` = default 127 (bisa diubah)

---

### Table: `users`

**Deskripsi:** Menyimpan data user untuk authentication

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| id | INTEGER | Primary key | 1 |
| username | VARCHAR | Username (unique) | "raffy_jomok" |
| nik | VARCHAR | NIK karyawan (unique) | "3374012345678901" |
| password_hash | VARCHAR | Hashed password (bcrypt) | "$2b$12$..." |
| full_name | VARCHAR | Nama lengkap | "Raffy Jomok" |
| role | VARCHAR | Role user | "user" / "admin" / "developer" |
| is_active | BOOLEAN | Status active | TRUE / FALSE |
| created_at | TIMESTAMP | Waktu register | 2026-01-17 09:00:00 |
| updated_at | TIMESTAMP | Waktu terakhir update | 2026-01-17 09:00:00 |

**Indexes:**
- Primary: `id`
- Unique: `username`, `nik`

**Business Rules:**
- User baru default `is_active` = FALSE
- Admin perlu approve (set `is_active` = TRUE)
- Password di-hash pakai bcrypt
- JWT token untuk authentication

---

## 📡 API Documentation

Base URL: `http://localhost:8000`

### Authentication

**Register User**
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "user123",
  "nik": "1234567890123456",
  "password": "password123",
  "full_name": "User Name"
}

Response: 201 Created
{
  "id": 1,
  "username": "user123",
  "nik": "1234567890123456",
  "full_name": "User Name",
  "role": "user",
  "is_active": false
}
```

**Login**
```http
POST /api/auth/login
Content-Type: application/x-www-form-urlencoded

username=user123&password=password123

Response: 200 OK
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Get Current User**
```http
GET /api/users/me
Authorization: Bearer {token}

Response: 200 OK
{
  "id": 1,
  "username": "user123",
  "full_name": "User Name",
  "role": "user"
}
```

### Dashboard

**Get Summary**
```http
GET /api/dashboard/summary

Response: 200 OK
{
  "total_hvc": {
    "diamond": 1,
    "gold": 37,
    "platinum": 43,
    "regular": 433,
    "total": 514
  },
  "network_health": {
    "spec": 75.5,
    "unspec": 24.5,
    "spec_count": 388,
    "unspec_count": 126,
    "total_nodes": 514
  },
  "ticket_status": {
    "open": 126,
    "closed": 388,
    "total": 514
  }
}
```

**Get HVC Distribution**
```http
GET /api/dashboard/hvc-pivot

Response: 200 OK
[
  {
    "sto": "BPN",
    "diamond": 1,
    "gold": 37,
    "platinum": 43,
    "regular": 433,
    "grand_total": 514
  }
]
```

### Data Explorer

**Get Network Nodes (Paginated)**
```http
GET /api/data-explorer/nodes?page=1&limit=50&sto=BPN&spec_status=UNSPEC

Response: 200 OK
{
  "data": [ ... ],
  "pagination": {
    "total": 126,
    "page": 1,
    "limit": 50,
    "total_pages": 3,
    "has_next": true,
    "has_prev": false
  }
}
```

**Export Nodes**
```http
GET /api/data-explorer/export?sto=BPN&spec_status=UNSPEC

Response: 200 OK (Excel file download)
```

### Service Recovery

**Get Tickets**
```http
GET /api/tickets/service-recovery?page=1&limit=50&status=OPEN&sto=BPN

Response: 200 OK
{
  "items": [ ... ],
  "total": 126,
  "page": 1,
  "limit": 50
}
```

**Update Ticket**
```http
PUT /api/tickets/{ticket_id}
Content-Type: application/json

{
  "nama_teknisi": "RaffyJOMOK",
  "no_tiket": "INC123456",
  "redaman_akhir": -18.5,
  "status_rfo": "CLOSED",
  "keterangan": "Sudah diperbaiki"
}

Response: 200 OK
{
  "id": 123,
  "nama_teknisi": "RaffyJOMOK",
  ...
}
```

**Get Ticket Summary**
```http
GET /api/tickets/summary

Response: 200 OK
{
  "total_tickets": 514,
  "total_open": 126,
  "total_close": 388,
  ...
}
```

### Reports

**Get Monthly Reports**
```http
GET /api/reports?month=1&year=2026

Response: 200 OK
[
  {
    "date": "2026-01-01",
    "total_saldo": 500,
    "close": 80,
    "saldo_lama": 420,
    "target": 127,
    "created_at": "2026-01-01T10:00:00",
    "updated_at": "2026-01-01T10:00:00"
  },
  ...
]
```

**Export Report to Excel**
```http
GET /api/reports/export?month=1&year=2026

Response: 200 OK (Excel file download with chart)
```

### Data Import

**Upload Excel Files**
```http
POST /api/import/upload
Content-Type: multipart/form-data

file1=@unspec_semesta.xlsx
file2=@ukur_massal.xlsx

Response: 200 OK
{
  "status": "success",
  "message": "Data berhasil diimport",
  "summary": {
    "total_imported": 514,
    "spec_count": 388,
    "unspec_count": 126,
    "timestamp": "2026-01-17T10:30:00"
  }
}
```

**Full API Documentation:** http://localhost:8000/docs (Swagger UI)

---

## 🔧 Troubleshooting

### Backend Tidak Start

**Symptom:** Container backend crash atau tidak responding

**Possible Causes:**
1. IndentationError di Python code
2. PostgreSQL belum ready
3. Port 8000 sudah dipakai

**Solution:**
```bash
# Check logs
docker-compose logs backend --tail=50

# Restart backend
docker-compose restart backend

# Rebuild jika perlu
docker-compose up -d --build backend
```

### Frontend Tidak Connect ke Backend

**Symptom:** NetworkError di browser console

**Possible Causes:**
1. Backend tidak running
2. CORS issue
3. Wrong API URL

**Solution:**
```bash
# Check backend status
curl http://localhost:8000/health

# Check CORS setting di backend/main.py
# Pastikan ada:
# allow_origins=["http://localhost:3000"]

# Restart services
docker-compose restart
```

### Import Excel Gagal

**Symptom:** Error saat upload file

**Possible Causes:**
1. Format Excel tidak sesuai
2. Header tidak match
3. File corrupt

**Solution:**
1. Check header Excel harus ada: ND, STO, SEKTOR, ODP, dll
2. Header harus di row yang benar (row 5 untuk Unspec, row 3 untuk Ukur)
3. Coba upload sample file dulu

### Data Tidak Muncul di Dashboard

**Symptom:** Dashboard kosong atau stats = 0

**Possible Causes:**
1. Belum upload data
2. Filter salah
3. Database kosong

**Solution:**
```bash
# Check data di database
docker-compose exec postgres psql -U gpon_user -d gpon_network -c "SELECT COUNT(*) FROM network_nodes;"

# Check latest import_date
docker-compose exec postgres psql -U gpon_user -d gpon_network -c "SELECT MAX(import_date) FROM network_nodes;"

# Jika kosong, upload data dulu
```

### PostgreSQL Connection Error

**Symptom:** "Connection refused" atau "Can't connect to database"

**Possible Causes:**
1. PostgreSQL container tidak running
2. Wrong credentials
3. Port conflict

**Solution:**
```bash
# Check PostgreSQL status
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres

# Verify connection
docker-compose exec postgres psql -U gpon_user -d gpon_network -c "SELECT 1;"
```

---

## 🔒 Maintenance

### Backup Database

**Manual Backup:**
```bash
# Backup to file
docker-compose exec postgres pg_dump -U gpon_user gpon_network > backup_$(date +%Y%m%d).sql

# Restore from file
docker-compose exec -T postgres psql -U gpon_user gpon_network < backup_20260117.sql
```

**Automated Backup (Cron):**
```bash
# Crontab entry (run daily at 2 AM)
0 2 * * * cd /path/to/web-unspec && docker-compose exec postgres pg_dump -U gpon_user gpon_network > backup_$(date +\%Y\%m\%d).sql
```

### Log Management

**View Logs:**
```bash
# All containers
docker-compose logs --tail=100

# Specific container
docker-compose logs backend --tail=100

# Follow logs
docker-compose logs -f backend
```

**Clear Logs:**
```bash
# Truncate logs
truncate -s 0 $(docker inspect --format='{{.LogPath}}' web-unspec-backend-1)
```

### Database Optimization

**Vacuum Database:**
```bash
docker-compose exec postgres psql -U gpon_user -d gpon_network -c "VACUUM ANALYZE;"
```

**Reindex:**
```bash
docker-compose exec postgres psql -U gpon_user -d gpon_network -c "REINDEX DATABASE gpon_network;"
```

### Update Aplikasi

**Pull Latest Code:**
```bash
git pull origin main
```

**Rebuild Containers:**
```bash
docker-compose down
docker-compose up -d --build
```

**Run Database Migration (jika ada):**
```bash
docker-compose exec backend alembic upgrade head
```

---

## 🤝 Kontribusi

### Development Workflow

1. **Fork Repository**
2. **Create Feature Branch**
   ```bash
   git checkout -b feature/nama-fitur
   ```
3. **Develop**
   - Write code
   - Add tests
   - Update documentation
4. **Commit**
   ```bash
   git commit -m "feat: menambahkan fitur X"
   ```
5. **Push**
   ```bash
   git push origin feature/nama-fitur
   ```
6. **Create Pull Request**

### Code Standards

**Python (Backend):**
- Follow PEP 8
- Type hints untuk function parameters
- Docstring untuk semua functions
- Comment pakai Bahasa Indonesia santai

**TypeScript (Frontend):**
- Follow ESLint config
- Use TypeScript types
- Functional components
- Comment pakai Bahasa Indonesia santai

### Testing

**Backend Tests:**
```bash
cd backend
pytest
```

**Frontend Tests:**
```bash
cd frontend
npm test
```

---

## 📄 License

Project ini adalah software Proprietary/Private. Dilarang mendistribusikan ulang tanpa izin pemilik.
---

## 👥 Credits

**Developer:**
- Just0rdinaryGuy

**Acknowledgments:**
- PT Telkom Akses - untuk use case dan requirements
- Tim HD WOC Balikpapan - untuk user feedback

---

## 📞 Support

**Issues:* mikir aja sendiri :)* 

**Telegram:** @exprimb

**Documentation:** Check folder `docs/` untuk dokumentasi lebih detail

---

## 🎓 Untuk Keperluan Skripsi ini khusus Arya Dharma 

### Poin-Poin yang Bisa Dibahas

1. **BAB 1 - Pendahuluan**
   - Latar belakang manual monitoring
   - Identifikasi masalah
   - Rumusan masalah
   - Tujuan penelitian
   - Manfaat penelitian

2. **BAB 2 - Landasan Teori**
   - Web-based Monitoring System
   - Full-stack Development (Next.js + FastAPI)
   - PostgreSQL Database
   - REST API
   - Docker containerization

3. **BAB 3 - Analisis dan Perancangan**
   - Analisis kebutuhan sistem
   - Use case diagram
   - Flowchart
   - Database schema (ERD)
   - Arsitektur sistem
   - UI/UX Design

4. **BAB 4 - Implementasi**
   - Tools dan teknologi
   - Code implementation
   - Database implementation
   - Testing

5. **BAB 5 - Pengujian**
   - Unit testing
   - Integration testing
   - User acceptance testing
   - Performance testing

6. **BAB 6 - Penutup**
   - Kesimpulan
   - Saran pengembangan

### Dokumentasi Pendukung

Semua ada di folder ini:
- Flowchart: bisa diambil dari section "Alur Kerja"
- ERD: section "Database Schema"
- Screenshots: ambil dari aplikasi yang running
- Code: full source code tersedia
- API Docs: auto-generated di `/docs`

---

**Last Updated:** 17 Januari 2026  
**Version:** 2.0.0  
**Status:** Production Ready ✅
