# Network Operations Center (NOC) Dashboard

A professional network monitoring dashboard system for monitoring MikroTik routers across multiple locations in Maharashtra, India.

## 🏗️ Architecture

```
MikroTik Routers
    ↓ SNMP
SNMP Exporter
    ↓ Metrics
Prometheus (port 9090)
    ↓ Queries
Grafana (port 3000) ← Visualizations
    ↓
Node.js/Express API (port 5000)
    ↓
React Dashboard (port 3002)
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB
- Docker (optional, for Grafana/Prometheus)

### Installation

1. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Start Backend**
   ```bash
   npm run dev
   ```
   Backend runs on http://localhost:5000

4. **Start Frontend**
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend runs on http://localhost:3002

5. **Start Grafana (with embedding enabled)**
   
   Option A - Docker (recommended):
   ```bash
   cd grafana
   docker-compose up -d
   ```
   
   Option B - Manual:
   ```bash
   # Edit grafana.ini and set:
   [security]
   allow_embedding = true
   ```

6. **Access Dashboard**
   - URL: http://localhost:3002
   - Login: `admin` / `admin123`

## ⚠️ Important: Grafana Embedding Fix

If you see `X-Frame-Options: deny` error, you need to enable embedding in Grafana:

### Option 1: Docker (Recommended)
```bash
cd grafana
docker-compose up -d
```

### Option 2: Environment Variables
```bash
# Linux/Mac
export GF_SECURITY_ALLOW_EMBEDDING=true

# Windows (PowerShell)
$env:GF_SECURITY_ALLOW_EMBEDDING="true"
```

### Option 3: grafana.ini
```ini
[security]
allow_embedding = true
```

## 📍 Network Locations

| Location | IP Address | Coordinates |
|----------|------------|-------------|
| Ganpati Peth Sangli | 103.219.0.157 | 16.862013, 74.560903 |
| Gadhinglaj | 163.223.65.200 | 16.22582, 74.35093 |
| Market Yard Sangli | 103.219.0.158 | 16.850162, 74.584864 |
| Miraj | 103.219.1.142 | 16.828588, 74.646139 |
| Kothrud Pune | 103.200.105.88 | 18.507197, 73.792366 |

## 📡 Prometheus Queries

Bandwidth monitoring uses these queries:

```promql
# Download bandwidth (Mbps)
rate(ifHCInOctets{instance="$router"}[5m]) * 8 / 1000000

# Upload bandwidth (Mbps)
rate(ifHCOutOctets{instance="$router"}[5m]) * 8 / 1000000

# Total bandwidth
(rate(ifHCInOctets[5m]) + rate(ifHCOutOctets[5m])) * 8 / 1000000
```

## 🔌 API Endpoints

### Routers
- `GET /api/routers` - Get all routers
- `GET /api/routers/:id` - Get router by ID
- `GET /api/routers/:id/metrics` - Get router metrics
- `POST /api/routers` - Add new router

### Bandwidth
- `GET /api/bandwidth/current` - Current bandwidth
- `GET /api/bandwidth/history` - Historical data
- `GET /api/bandwidth/location/:name` - Bandwidth by location

### Alerts
- `GET /api/alerts` - Get all alerts
- `GET /api/alerts/active` - Get active alerts
- `POST /api/alerts` - Create alert rule

### Grafana
- `GET /api/grafana/dashboards` - List dashboards
- `GET /api/grafana/panels/:id` - Get panel data
- `GET /api/grafana/health` - Check Grafana status

## 📁 Project Structure

```
├── backend/
│   ├── src/
│   │   ├── models/        # MongoDB schemas
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   └── index.js       # Express app
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API calls
│   │   └── App.jsx        # Main app
│   └── package.json
│
├── grafana/
│   ├── grafana.ini        # Grafana config
│   └── docker-compose.yml
│
├── prometheus/
│   └── prometheus.yml     # Prometheus config
│
└── docs/
    └── architecture.md    # Architecture docs
```

## 🔧 Configuration

### Environment Variables (backend/.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/noc-dashboard
GRAFANA_URL=http://localhost:3000
GRAFANA_API_KEY=your-api-key
PROMETHEUS_URL=http://localhost:9090
```

### Frontend Config (frontend/src/config.js)
```javascript
export const API_URL = 'http://localhost:5000';
export const GRAFANA_URL = 'http://localhost:3000';
```

## 🎨 Features

- ✅ Location-based network dashboard
- ✅ Interactive map with router locations
- ✅ Real-time bandwidth monitoring
- ✅ Upload/Download traffic visualization
- ✅ Router interface monitoring (ether1, ether2, wlan1)
- ✅ Historical bandwidth graphs
- ✅ Network status indicators (online/offline)
- ✅ Alert system for downtime/thresholds
- ✅ Grafana integration
- ✅ Professional NOC-style dark theme

## 📝 License

MIT License
