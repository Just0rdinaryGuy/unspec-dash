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
    echo -e "${GREEN}    UNSPEC DASHBOARD - Maintenance App    ${NC}"
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
    echo -e " [R1] Mulai Ulang BACKEND"
    echo -e " [R2] Mulai Ulang FRONTEND"
    echo -e " [R3] Mulai Ulang NGINX"
    
    echo -e "\n${YELLOW}PEMANTAUAN LOG:${NC}"
    echo -e " [5] Pantau Log Backend"
    echo -e " [6] Pantau Log Frontend"
    echo -e " [7] Pantau Semua Log Server"
    
    echo -e "\n${YELLOW}PEMELIHARAAN KHUSUS:${NC}"
    echo -e " [10] Update Penuh (Tarik Git Code + Rebuild)"
    echo -e " [11] Bersihkan Sampah Memori Docker"
    echo -e " [0] Keluar"
    echo ""
    
    read -p "Masukkan pilihan lo (angka): " choice

    echo ""
    case $choice in
        1)
            echo -e "${GREEN}Menyalakan semua servis di latar belakang...${NC}"
            sudo docker compose up -d
            ;;
        2)
            echo -e "${RED}Mematikan semua servis...${NC}"
            sudo docker compose down
            ;;
        3)
            echo -e "${CYAN}Memulai ulang seluruh sistem...${NC}"
            sudo docker compose restart
            ;;
        4)
            echo -e "${CYAN}Mengambil status sistem saat ini...${NC}"
            sudo docker compose ps
            ;;
        R1|r1)
            echo -e "${GREEN}Memulai ulang mesin Backend...${NC}"
            sudo docker compose restart backend
            ;;
        R2|r2)
            echo -e "${GREEN}Memulai ulang mesin Frontend...${NC}"
            sudo docker compose restart frontend
            ;;
        R3|r3)
            echo -e "${GREEN}Memulai ulang Nginx...${NC}"
            sudo docker compose restart nginx
            ;;
        5)
            echo -e "${YELLOW}Memantau Log Backend (Tekan Ctrl+C buat keluar monitor)...${NC}"
            sudo docker compose logs -f backend
            ;;
        6)
            echo -e "${YELLOW}Memantau Log Frontend (Tekan Ctrl+C buat keluar monitor)...${NC}"
            sudo docker compose logs -f frontend
            ;;
        7)
            echo -e "${YELLOW}Memantau Semua Log Sistem (Tekan Ctrl+C buat keluar monitor)...${NC}"
            sudo docker compose logs -f
            ;;
        10)
            echo -e "${CYAN}Menarik kode terbaru dari Git & merakit ulang kontainer...${NC}"
            git pull
            sudo docker compose up -d --build
            ;;
        11)
            echo -e "${RED}Menghapus sampah Docker (Network & Image nganggur)...${NC}"
            sudo docker system prune -af
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
