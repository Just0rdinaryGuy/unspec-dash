FROM python:3.11-slim

WORKDIR /app

# Install UV - package manager cepet buat python
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Copy file konfigurasi dulu
COPY pyproject.toml ./

# Install dependencies pake UV (lebih cepet dari pip)
RUN uv pip install --system -r pyproject.toml

# Copy semua code aplikasi
COPY . .

EXPOSE 8000

# Jalanin FastAPI pake uvicorn dengan hot-reload
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
