# Task: Deploy ke VPS dengan Domain

## Target
Deploy Dashboard Monitoring Unspec ke VPS dengan domain: `wargaonlineceria.my.id`

## Checklist

### Prerequisites Check
- [x] Check Docker installed di VPS
- [x] Check Docker Compose installed
- [x] Check Nginx installed
- [x] Check port 80, 443, 3000, 8000 available

### Repository Setup
- [x] Clone repo dari GitHub ke `/var/www/unspec-dash`
- [x] Configure environment variables

### Docker Setup
- [x] Build dan start containers
- [x] Verify PostgreSQL running
- [x] Verify backend running
- [x] Verify frontend running
- [x] Migrate data (optional - jika ada backup)

### Nginx Configuration
- [x] Create Nginx config untuk frontend (port 3000)
- [x] Create Nginx config untuk backend API (port 8000)
- [x] Setup reverse proxy
- [x] Test Nginx config
- [x] Reload Nginx

### SSL/HTTPS Setup
- [x] Install Certbot
- [x] Generate SSL certificate untuk wargaonlineceria.my.id
- [x] Configure auto-renewal

### DNS Configuration (Info for User)
- [x] Point domain ke VPS IP
- [x] Point domain ke VPS IP
- [x] Verify DNS propagation

### Performance Optimization
- [x] Switch Frontend to Production Mode (npm start)

### Mobile/Tablet Optimization
- [x] Implement Responsive Sidebar (Hamburger Menu)
- [x] Ensure Tables are horizontally scrollable on mobile
- [x] Adjust Dashboard Cards Grid (1 col mobile, 2 col tablet)
- [x] Verify Charts responsiveness
- [x] Test Navigation on small screens


### Testing & Verification
- [x] Access https://wargaonlineceria.my.id
- [x] Test login
- [x] Test upload Excel
- [x] Test all features
- [x] Verify PostgreSQL persistence

### Documentation
- [x] Update deployment guide di README
- [x] Document environment setup

### Debugging & Features (New)
- [ ] Check console errors (Application logs) <!-- id: 3 -->
- [ ] Fix 500 Error (Login Redirect) <!-- id: 4 -->
- [x] Debug Export Missing Edit Data <!-- id: 5 -->
- [x] Fix Filter Sharing issue <!-- id: 6 -->

# Phase 2: WOC Job Management System (Telegram Integration)

## 1. Database & Models
- [x] **Finalize WOC Master Documentation (Spec & Plan)** <!-- id: new -->
- [/] Create `Team`, `WOCTicket`, `TicketUpdate` models <!-- id: 10 -->
- [/] Update `User` model with Telegram fields (`chat_id`, `role`) <!-- id: 11 -->
- [/] Create migration/init script for new tables <!-- id: 12 -->

## 2. Backend Bot Integration
- [ ] Setup `python-telegram-bot` or raw requests structure <!-- id: 13 -->
- [ ] Create `bot_service.py` (State Machine Logic) <!-- id: 14 -->
- [ ] Create `routers/bot_telegram.py` (Webhook Handler) <!-- id: 15 -->
- [ ] Implement "/link" account flow <!-- id: 16 -->
- [ ] Implement Ticket Update Wizard (Status -> RFO -> Evidence) <!-- id: 17 -->
- [ ] Implement Realtime Location Listener (Live Location) <!-- id: 23 -->

## 3. Frontend WOC Dashboard
- [ ] Create `/app/woc` layout and navigation <!-- id: 18 -->
- [ ] Create Team Management Page (Mapping Chat IDs) <!-- id: 19 -->
- [ ] Create Ticket Monitoring Page (Real-time updates) <!-- id: 20 -->
- [ ] Create Realtime Map Dashboard (Leaflet) <!-- id: 24 -->

## 4. Integration
- [ ] Deploy Webhook to VPS <!-- id: 21 -->
- [ ] Test End-to-End Flow (Bot -> DB -> Dashboard) <!-- id: 22 -->
