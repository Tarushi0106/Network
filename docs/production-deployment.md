# Production Deployment Guide

## Architecture Overview

```
┌─────────────────────────────┐         ┌─────────────────────────────┐
│   AWS Amplify               │         │   AWS EC2                   │
│   (React Frontend)          │   ──▶   │   Nginx Reverse Proxy       │
│   https://yourapp.com       │  HTTPS   │   ✓ Port 443 (HTTPS)       │
│                             │         │   ✓ Port 80 (HTTP)         │
└─────────────────────────────┘         └─────────────────────────────┘
                                                    │
                                                    ▼
                                         ┌─────────────────────────────┐
                                         │   Services (localhost)     │
                                         │   - Express:5000          │
                                         │   - Grafana:3000          │
                                         │   - Prometheus:9090        │
                                         │   - SNMP Exporter:9116     │
                                         └─────────────────────────────┘
```

---

## Step 1: Configure Amplify Rewrites and Redirects

In **Amplify Console → App settings → Rewrites and redirects**:

| Source address | Target address | Type |
|----------------|----------------|------|
| `/api/<*>` | `https://api.yourdomain.com/api/<*>` | 200 (Rewrite) |
| `/grafana/<*>` | `https://api.yourdomain.com/grafana/<*>` | 200 (Rewrite) |

---

## Step 2: Install and Configure Nginx on EC2

```bash
# 1. Install Nginx
sudo apt update
sudo apt install nginx

# 2. Create Nginx config
sudo nano /etc/nginx/sites-available/network-dashboard
```

Paste the content from `nginx/nginx.conf` (update `api.yourdomain.com` with your domain).

```bash
# 3. Enable the site
sudo ln -s /etc/nginx/sites-available/network-dashboard /etc/nginx/sites-enabled/

# 4. Test Nginx config
sudo nginx -t

# 5. Restart Nginx
sudo systemctl restart nginx
```

---

## Step 3: Set Up SSL with Let's Encrypt

```bash
# 1. Install Certbot
sudo apt install certbot python3-certbot-nginx

# 2. Get SSL certificate (replace with your domain)
sudo certbot --nginx -d api.yourdomain.com

# 3. Certbot will automatically modify Nginx config and enable HTTPS

# 4. Test auto-renewal
sudo certbot renew --dry-run
```

---

## Step 4: Configure AWS Security Groups

In **EC2 → Security Groups**, ensure these inbound rules:

| Type | Protocol | Port | Source |
|------|----------|------|--------|
| HTTP | TCP | 80 | 0.0.0.0/0 |
| HTTPS | TCP | 443 | 0.0.0.0/0 |
| Custom TCP | TCP | 5000 | Your Amplify IP range |
| Custom TCP | TCP | 3000 | Your IP (for Grafana admin) |
| Custom TCP | TCP | 9090 | Your IP (for Prometheus admin) |

---

## Step 5: Update Frontend Configuration

In Amplify environment variables, add:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://api.yourdomain.com` |
| `VITE_GRAFANA_URL` | `https://api.yourdomain.com/grafana` |

Or update `frontend/src/config.js`:

```javascript
const CONFIG = {
  API_URL: '',  // Use relative URLs - they'll be proxied through same domain
  GRAFANA_URL: '',  // Same here
};
```

---

## Step 6: Frontend API Calls

Use **relative URLs** to avoid CORS and Mixed Content issues:

```javascript
// ✅ Correct - uses same origin
const response = await fetch('/api/devices');

// ❌ Wrong - different origin causes CORS/Mixed Content
const response = await fetch('http://51.20.52.19:5000/api/devices');
```

For the Grafana embed:

```javascript
// Use relative URL with proxy
const grafanaUrl = `/grafana/d-solo/adhj2dk/network-monitor?panelId=2&theme=dark`;

// Or use full HTTPS URL
const grafanaUrl = 'https://api.yourdomain.com/grafana/d-solo/adhj2dk/network-monitor?panelId=2&theme=dark';
```

---

## Step 7: Restart Services

```bash
# Restart backend
cd ~/Network/backend
pm2 restart backend

# Check status
pm2 status
```

---

## Troubleshooting

### Check Nginx logs:
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Check backend logs:
```bash
pm2 logs backend --lines 50
```

### Test API locally on EC2:
```bash
curl http://localhost:5000/api/health
curl http://localhost:3000/api/grafana/summary
```
