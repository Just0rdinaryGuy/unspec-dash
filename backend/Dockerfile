FROM python:3.11-slim

WORKDIR /app

# Copy file konfigurasi dulu
COPY pyproject.toml ./

# Install dependencies pake PIP standar (Fallback karena UV timeout di VPS)
# Tambah timeout panjang (1000s) biar gak gagal pas koneksi lemot
RUN pip install --default-timeout=1000 --no-cache-dir .

# Copy semua code aplikasi
COPY . .

EXPOSE 8000

# Jalanin FastAPI pake uvicorn dengan hot-reload
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
