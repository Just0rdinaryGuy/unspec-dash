FROM python:3.11-slim

WORKDIR /app

# Install dependencies pake PIP standar (Fallback karena UV timeout di VPS)
# RUN uv pip install --system -r pyproject.toml
RUN pip install --no-cache-dir .

# Copy semua code aplikasi
COPY . .

EXPOSE 8000

# Jalanin FastAPI pake uvicorn dengan hot-reload
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
