#!/usr/bin/env bash
set -e

echo "=== GPON Network Dashboard: Bare-metal Migration ==="

# 1. Stop and remove frontend and backend Docker containers
echo "Stopping Docker containers for frontend and backend..."
docker compose stop frontend backend || true
docker compose rm -f frontend backend || true

# Ensure postgres is running
echo "Starting Postgres database container..."
docker compose up -d postgres

# 2. Update .env file to point to localhost instead of docker name 'postgres'
echo "Updating .env file..."
if [ -f .env ]; then
    # Replace postgres with localhost
    sed -i 's/@postgres:5432/@localhost:5432/g' .env
else
    echo "CORS_ORIGINS=http://localhost:3000,http://100.121.193.23:3005,http://100.121.193.23:3000" > .env
    echo "DATABASE_URL=postgresql://gpon_user:gpon_secure_pass_2026@localhost:5432/gpon_network" >> .env
fi

# 3. Backend Setup
echo "Setting up Python virtual environment for backend..."
cd backend
rm -rf venv
python3 -m venv venv
./venv/bin/pip install --upgrade pip
./venv/bin/pip install wheel hatchling
./venv/bin/pip install .
cd ..

# 4. Frontend Setup
echo "Installing and building Frontend..."
cd frontend
npm install
npm run build
cd ..

# 5. Start with PM2
echo "Installing PM2 globally if needed..."
if ! command -v pm2 &> /dev/null; then
    echo "pm2 not found, installing via npm..."
    sudo npm install -g pm2 || npm install -g pm2
fi

echo "Starting Backend and Frontend with PM2..."
pm2 delete gpon-backend || true
pm2 delete gpon-frontend || true

# Start backend on port 8005
cd backend
pm2 start "./venv/bin/uvicorn main:app --host 0.0.0.0 --port 8005" --name gpon-backend
cd ..

# Start frontend on port 3005
cd frontend
pm2 start "npm run start -- -p 3005" --name gpon-frontend
cd ..

pm2 save

echo "=== Bare-metal Migration Successful ==="
echo "Backend running on port 8005"
echo "Frontend running on port 3005"
pm2 list
