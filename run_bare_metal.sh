#!/usr/bin/env bash
set -e

echo "=== GPON Network Dashboard: Bare-metal Migration ==="

# 1. Initialize .env file first to prevent docker compose from complaining about missing env file
echo "Initializing .env file..."
if [ ! -f .env ]; then
    echo "CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3005,http://localhost:3005" > .env
    echo "DATABASE_URL=postgresql://gpon_user:gpon_secure_pass_2026@localhost:5432/gpon_network" >> .env
else
    # Replace postgres with localhost
    sed -i 's/@postgres:5432/@localhost:5432/g' .env
fi

# 2. Stop and remove frontend and backend Docker containers
echo "Stopping Docker containers for frontend and backend..."
docker compose stop frontend backend || true
docker compose rm -f frontend backend || true

# Ensure postgres is running
echo "Starting Postgres database container..."
docker compose up -d postgres

# Fix ownership of files that were created by Docker root user
echo "Fixing ownership of project files (may prompt for sudo password)..."
sudo chown -R $(whoami):$(whoami) .

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

# 5. Start with PM2 (Menggunakan local pm2 via npx untuk menghindari sudo/password prompt)
echo "Ensuring pm2 is installed locally..."
if [ ! -d "node_modules/pm2" ]; then
    npm install pm2 --no-save
fi

echo "Starting Backend and Frontend with PM2..."
npx pm2 delete gpon-backend || true
npx pm2 delete gpon-frontend || true

# Start backend on port 8005
cd backend
../node_modules/.bin/pm2 start "./venv/bin/uvicorn main:app --host 0.0.0.0 --port 8005" --name gpon-backend
cd ..

# Start frontend on port 3005
cd frontend
../node_modules/.bin/pm2 start "npm run start -- -p 3005" --name gpon-frontend
cd ..

npx pm2 save

echo "=== Bare-metal Migration Successful ==="
echo "Backend running on port 8005"
echo "Frontend running on port 3005"
npx pm2 list
