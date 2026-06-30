#!/bin/bash

# Define Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

show_header() {
    clear
    echo -e "${CYAN}=================================================${NC}"
    echo -e "${GREEN}    UNSPEC DASHBOARD - Maintenance App (Hybrid)   ${NC}"
    echo -e "${CYAN}=================================================${NC}"
}

while true; do
    show_header
    echo -e "${YELLOW}MANAJEMEN SERVER:${NC}"
    echo -e " [1] Nyalakan Semua Servis (UP)"
    echo -e " [2] Matikan Semua Servis (DOWN)"
    echo -e " [3] Mulai Ulang Semua Servis"
    echo -e " [4] Cek Status & Health Sistem"
    
    echo -e "\n${YELLOW}MULAI ULANG SATUAN:${NC}"
    echo -e " [R1] Mulai Ulang BACKEND (PM2)"
    echo -e " [R2] Mulai Ulang FRONTEND (PM2)"
    echo -e " [R3] Mulai Ulang DATABASE (Docker)"
    
    echo -e "\n${YELLOW}PEMANTAUAN LOG:${NC}"
    echo -e " [5] Pantau Log Backend (PM2)"
    echo -e " [6] Pantau Log Frontend (PM2)"
    echo -e " [7] Pantau Log Database (Docker)"
    
    echo -e "\n${YELLOW}PEMELIHARAAN KHUSUS:${NC}"
    echo -e " [10] Update Penuh (Tarik Git Code + Build + Restart)"
    echo -e " [11] Bersihkan Sampah Memori Docker"
    echo -e " [0] Keluar"
    echo ""
    
    read -p "Masukkan pilihan lo (angka): " choice

    echo ""
    case $choice in
        1)
            echo -e "${GREEN}Menyalakan database (Docker) & apps (PM2)...${NC}"
            docker compose up -d postgres
            npx pm2 start gpon-backend || true
            npx pm2 start gpon-frontend || true
            ;;
        2)
            echo -e "${RED}Mematikan database (Docker) & apps (PM2)...${NC}"
            npx pm2 stop gpon-backend || true
            npx pm2 stop gpon-frontend || true
            docker compose stop postgres || true
            ;;
        3)
            echo -e "${CYAN}Memulai ulang seluruh sistem...${NC}"
            docker compose restart postgres
            npx pm2 restart gpon-backend gpon-frontend --update-env
            ;;
        4)
            echo -e "${CYAN}--- Status Database (Docker) ---${NC}"
            docker compose ps postgres
            echo -e "\n${CYAN}--- Status Aplikasi (PM2) ---${NC}"
            npx pm2 list
            ;;
        R1|r1)
            echo -e "${GREEN}Memulai ulang Backend (PM2)...${NC}"
            npx pm2 restart gpon-backend --update-env
            ;;
        R2|r2)
            echo -e "${GREEN}Memulai ulang Frontend (PM2)...${NC}"
            npx pm2 restart gpon-frontend --update-env
            ;;
        R3|r3)
            echo -e "${GREEN}Memulai ulang Database (Docker)...${NC}"
            docker compose restart postgres
            ;;
        5)
            echo -e "${YELLOW}Memantau Log Backend (Tekan Ctrl+C buat keluar monitor)...${NC}"
            npx pm2 logs gpon-backend
            ;;
        6)
            echo -e "${YELLOW}Memantau Log Frontend (Tekan Ctrl+C buat keluar monitor)...${NC}"
            npx pm2 logs gpon-frontend
            ;;
        7)
            echo -e "${YELLOW}Memantau Log Database (Tekan Ctrl+C buat keluar monitor)...${NC}"
            docker compose logs -f postgres
            ;;
        10)
            echo -e "${CYAN}Menarik kode terbaru dari Git & Merakit Ulang Servis...${NC}"
            git pull
            
            # Rebuild Backend dependencies
            echo -e "${YELLOW}Menginstal ulang dependensi Backend...${NC}"
            cd backend
            ./venv/bin/pip install .
            cd ..
            
            # Rebuild Frontend NextJS
            echo -e "${YELLOW}Membangun ulang Frontend Next.js...${NC}"
            cd frontend
            npm install
            npm run build
            cd ..
            
            # Restart PM2
            echo -e "${GREEN}Merestart aplikasi di PM2...${NC}"
            npx pm2 restart gpon-backend gpon-frontend --update-env
            
            echo -e "${GREEN}✓ Update Sukses!${NC}"
            ;;
        11)
            echo -e "${RED}Menghapus sampah Docker (Network & Image nganggur)...${NC}"
            docker system prune -af
            ;;
        0)
            echo -e "${GREEN}Keluar aplikasi. Selamat menikmati hidup lambat! 😎${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Pilihan salah! Coba masukin angka yang bener bosku.${NC}"
            ;;
    esac
    
    echo ""
    read -p "Tekan [Enter] buat balik ke menu utama..."
done
