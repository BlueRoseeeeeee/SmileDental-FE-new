# Frontend Deployment Guide

## 🚀 Quick Deploy Production Build

### 1️⃣ Build for Production
```bash
cd SmileDental-FE-new
npm run build
```

This will:
- Use `.env.production` (points to https://be.smilecare.io.vn)
- Generate optimized build in `dist/` folder

### 2️⃣ Deploy to Server

**Option A: Upload via FTP/SFTP**
- Upload entire `dist/` folder to your web server
- Configure web server (Nginx/Apache) to serve static files

**Option B: Deploy to Vercel/Netlify (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Option C: Self-hosted with Nginx**
```bash
# Copy build to VPS
scp -r dist/* root@your-server-ip:/var/www/smilecare

# Nginx config example:
server {
    listen 80;
    server_name smilecare.io.vn;
    
    root /var/www/smilecare;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 🔧 Environment Configuration

### Production (`.env.production`)
- Backend: `https://be.smilecare.io.vn`
- Used when: `npm run build`

### Development (`.env.development`)
- Backend: `http://localhost:3001-3013`
- Used when: `npm run dev`

---

## ✅ What Was Changed

### Files Created:
1. `.env.production` - Production environment variables
2. `.env.development` - Development environment variables

### Files Updated:
1. `package.json` - Added build scripts with mode flags
2. `.gitignore` - Allow committing .env.production/.env.development
3. `src/pages/EditUser.jsx` - Use env vars instead of hardcoded localhost
4. `src/pages/Patient/PaymentSelection.jsx` - Use env vars for payment API
5. `src/pages/QueueDashboard.jsx` - Fix incorrect port fallback

### Already Using Env Vars (No Changes Needed):
- `src/services/apiFactory.js` ✅
- `src/services/appointmentService.js` ✅
- `src/services/recordService.js` ✅
- `src/services/queueService.js` ✅
- `src/services/paymentService.js` ✅
- `src/services/invoiceService.js` ✅

---

## 🧪 Testing

### Test Production Build Locally:
```bash
npm run build
npm run preview
```

Visit `http://localhost:4173` to test production build locally.

---

## 📝 Notes

- **Environment files are committed** (`.env.production`, `.env.development`)
- **Sensitive data** like API keys should still use `.env.local` (gitignored)
- Frontend will automatically use correct backend URLs based on build mode
- No need to manually change URLs when switching between dev/prod

---

## 🔗 URLs

| Environment | Frontend URL | Backend URL |
|-------------|--------------|-------------|
| **Production** | https://smilecare.io.vn | https://be.smilecare.io.vn |
| **Development** | http://localhost:5173 | http://localhost:3001-3013 |
