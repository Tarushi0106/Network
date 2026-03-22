/**
 * Network Monitoring Dashboard - Backend Server
 * ==============================================
 * 
 * Express.js server REST APIs providing for the
 * network monitoring dashboard.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');

// Load environment variables
require('dotenv').config();
console.log('PROMETHEUS_URL from .env:', process.env.PROMETHEUS_URL);
console.log('GRAFANA_URL from .env:', process.env.GRAFANA_URL);

// Import routes
const routerRoutes = require('./routes/routerRoutes');
const alertRoutes = require('./routes/alertRoutes');
const grafanaRoutes = require('./routes/grafanaRoutes');
const bandwidthRoutes = require('./routes/bandwidthRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const networkMonitoringRoutes = require('./routes/networkMonitoringRoutes');
const prometheusRoutes = require('./routes/prometheusRoutes');

// Import services
const prometheusService = require('./services/prometheusService');

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Security middleware
app.use(helmet());

// CORS configuration - allow Amplify frontend
app.use(cors({
  origin: ["https://main.d1hq5872boy64e.amplifyapp.com", "http://localhost:3001", "http://localhost:3002"]
}));
// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('combined'));

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', async (req, res) => {
  try {
    // Check MongoDB connection
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Check Prometheus connection
    let prometheusStatus = 'unknown';
    try {
      await prometheusService.query('up');
      prometheusStatus = 'connected';
    } catch (e) {
      prometheusStatus = 'disconnected';
    }
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        mongodb: mongoStatus,
        prometheus: prometheusStatus
      },
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

/**
 * GET /api/ping
 * Simple ping endpoint
 */
app.get('/api/ping', (req, res) => {
  res.json({ 
    message: 'pong',
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// API ROUTES
// ============================================================================

// Router routes
app.use('/api/routers', routerRoutes);

// Alert routes
app.use('/api/alerts', alertRoutes);

// Grafana routes
app.use('/api/grafana', grafanaRoutes);

// Bandwidth routes (doesn't require MongoDB)
app.use('/api/bandwidth', bandwidthRoutes);

// Device routes (doesn't require MongoDB)
app.use('/api', deviceRoutes);

// Network Monitoring routes (consolidated - network-downtime and network-outage-history)
app.use('/api', networkMonitoringRoutes);

// Prometheus API routes (CPU, Memory, Network, Disk)
app.use('/api', prometheusRoutes);

// ============================================================================
// PROMETHEUS DIRECT PROXY (Optional - for frontend to query Prometheus directly)
// ============================================================================

/**
 * POST /api/prometheus/query
 * Proxy Prometheus query to frontend
 */
app.post('/api/prometheus/query', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    const result = await prometheusService.query(query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/prometheus/query_range
 * Proxy Prometheus query_range to frontend
 */
app.post('/api/prometheus/query_range', async (req, res) => {
  try {
    const { query, start, end, step } = req.body;
    
    if (!query || !start || !end) {
      return res.status(400).json({ 
        error: 'query, start, and end are required' 
      });
    }
    
    const result = await prometheusService.queryRange(query, start, end, step);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// GRAFANA INTEGRATION
// ============================================================================

/**
 * GET /api/grafana/dashboards
 * Get list of Grafana dashboards
 */
app.get('/api/grafana/dashboards', async (req, res) => {
  try {
    const GRAFANA_URL = process.env.GRAFANA_URL || 'http://localhost:3000';
    const GRAFANA_API_KEY = process.env.GRAFANA_API_KEY;
    
    const response = await fetch(`${GRAFANA_URL}/api/search?type=dash-db`, {
      headers: {
        'Authorization': `Bearer ${GRAFANA_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const dashboards = await response.json();
    res.json({
      success: true,
      data: dashboards
    });
  } catch (error) {
    console.error('Error fetching Grafana dashboards:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Grafana dashboards',
      message: error.message
    });
  }
});

/**
 * GET /api/grafana/dashboard/:uid
 * Get specific Grafana dashboard
 */
app.get('/api/grafana/dashboard/:uid', async (req, res) => {
  try {
    const GRAFANA_URL = process.env.GRAFANA_URL || 'http://localhost:3000';
    const GRAFANA_API_KEY = process.env.GRAFANA_API_KEY;
    
    const response = await fetch(
      `${GRAFANA_URL}/api/dashboards/uid/${req.params.uid}`,
      {
        headers: {
          'Authorization': `Bearer ${GRAFANA_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const dashboard = await response.json();
    res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    console.error('Error fetching Grafana dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Grafana dashboard',
      message: error.message
    });
  }
});

/**
 * GET /api/grafana/embed/:uid
 * Get embed URL for a Grafana panel
 */
app.get('/api/grafana/embed/:uid', (req, res) => {
  const GRAFANA_URL = process.env.GRAFANA_URL || 'http://localhost:3000';
  const GRAFANA_API_KEY = process.env.GRAFANA_API_KEY;
  
  const { panelId, theme } = req.query;
  const uid = req.params.uid;
  
  const embedUrl = `${GRAFANA_URL}/d-solo/${uid}?orgId=1&panelId=${panelId || 1}&theme=${theme || 'dark'}`;
  
  res.json({
    success: true,
    data: {
      embedUrl,
      iframeUrl: `${GRAFANA_URL}/d-solo/${uid}?orgId=1&panelId=${panelId || 1}`
    }
  });
});

// ============================================================================
// REAL-TIME BANDWIDTH ENDPOINT
// ============================================================================

/**
 * GET /api/metrics/realtime
 * Get real-time bandwidth for all routers
 */
app.get('/api/metrics/realtime', async (req, res) => {
  try {
    const { Router } = require('./models/Router');
    
    // Get all enabled routers
    const routers = await Router.find({ 'monitoring.enabled': true })
      .select('name shortName staticIP location status priority');
    
    // Get bandwidth for all routers
    const bandwidthData = await prometheusService.getAllRoutersBandwidth();
    
    // Create a map for quick lookup
    const bandwidthMap = {};
    bandwidthData.forEach(bw => {
      bandwidthMap[bw.routerIP] = bw;
    });
    
    // Combine data
    const result = routers.map(router => {
      const bw = bandwidthMap[router.staticIP] || { 
        totalDownload: 0, 
        totalUpload: 0,
        interfaces: {}
      };
      
      return {
        id: router._id,
        name: router.name,
        shortName: router.shortName,
        ip: router.staticIP,
        status: router.status,
        priority: router.priority,
        bandwidth: {
          download: parseFloat(bw.totalDownloadMbps) || 0,
          upload: parseFloat(bw.totalUploadMbps) || 0,
          downloadRaw: bw.totalDownload,
          uploadRaw: bw.totalUpload
        },
        timestamp: new Date().toISOString()
      };
    });
    
    res.json({
      success: true,
      count: result.length,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching realtime metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch realtime metrics',
      message: error.message
    });
  }
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ============================================================================
// DATABASE CONNECTION & SERVER START
// ============================================================================

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/network-monitor';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✓ Connected to MongoDB');
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`  Health check: http://localhost:${PORT}/api/health`);
      console.log(`  API base: http://localhost:${PORT}/api`);
    });
  })
  .catch(err => {
    console.error('✗ MongoDB connection error:', err.message);
    console.log('⚠️  Running without MongoDB - using mock data');
    
    // Start server anyway without MongoDB
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✓ Server running on port ${PORT} (without MongoDB)`);
      console.log(`  Health check: http://localhost:${PORT}/api/health`);
      console.log(`  API base: http://localhost:${PORT}/api`);
    });
  });

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

module.exports = app;
