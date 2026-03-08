# EC2 Deployment Guide for NOC Dashboard

## Problem
The hosted dashboard shows "No historical data available" while local works fine.

## Root Cause
The backend needs proper environment configuration to connect to Prometheus on EC2.

## Solution Steps

### Step 1: Upload Production .env to EC2
Create a `.env` file on your EC2 with these contents:

```bash
# On EC2, create the file:
nano ~/Network/backend/.env
```

Add this content:
```
PORT=5000
NODE_ENV=production
PROMETHEUS_URL=http://localhost:9090
PROMETHEUS_TIMEOUT=30000
GRAFANA_URL=http://localhost:3000
GRAFANA_API_KEY=glsa_TLiJx5EmwvFbpaI035273T9HlIKe4UbN_42cc8698
FRONTEND_URL=http://51.20.52.19:4173
```

### Step 2: Restart Backend
```bash
cd ~/Network/backend
pm2 restart backend
```

### Step 3: Verify Prometheus is Collecting Data
On EC2, check if Prometheus is scraping:
```bash
curl http://localhost:9090/api/v1/query?query=up
```

### Step 4: Check Backend Logs
```bash
pm2 logs backend --lines 30
```

### Step 5: Verify Bandwidth API
```bash
curl http://localhost:5000/api/bandwidth/current
```

## Common Issues

### Issue: Prometheus not scraping routers
- Check if SNMP Exporter is running: `pm2 status`
- Check router IPs in prometheus.yml are correct
- Check if routers are accessible from EC2

### Issue: Historical data empty
- Prometheus needs time to collect data (wait 5-15 minutes)
- Check prometheus.yml has all router IPs

### Issue: Frontend can't reach backend
- Check security group allows port 5000
- Check CORS settings in backend/.env
