/**
 * Bandwidth API Routes
 * ====================
 * Fetches REAL bandwidth data from Prometheus
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');

const PROMELLEUS_URL = process.env.PROMETHEUS_URL || 'http://localhost:9090';

// Parse duration string to milliseconds
function parseDuration(duration) {
  const durationMap = {
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '30m': 30 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '3h': 3 * 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '12h': 12 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '2d': 2 * 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    'today': getTodayRange(),
    'week': getWeekRange(),
    'month': getMonthRange(),
    'year': getYearRange()
  };
  return durationMap[duration] || 24 * 60 * 60 * 1000; // Default 24 hours
}

function getTodayRange() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return now.getTime() - startOfDay.getTime();
}

function getWeekRange() {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  return now.getTime() - startOfWeek.getTime();
}

function getMonthRange() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return now.getTime() - startOfMonth.getTime();
}

function getYearRange() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  return now.getTime() - startOfYear.getTime();
}

// Calculate appropriate step based on duration
function calculateStep(duration) {
  const steps = {
    '5m': '15s',
    '15m': '30s',
    '30m': '1m',
    '1h': '2m',
    '3h': '5m',
    '6h': '10m',
    '12h': '15m',
    '24h': '5m',
    '2d': '15m',
    '7d': '30m',
    '30d': '1h',
    'today': '2m',
    'week': '10m',
    'month': '1h',
    'year': '1h'
  };
  return steps[duration] || '5m';
}

// Network locations with IP mapping and SLA configuration
const LOCATIONS = [
  { name: 'Ganpati Peth Sangli', ip: '103.219.0.157', lat: 16.862013, lng: 74.560903, provisionedSla: 100 },
  { name: 'Gadhinglaj', ip: '163.223.65.200', lat: 16.22582, lng: 74.35093, provisionedSla: 50 },
  { name: 'Market Yard Sangli', ip: '103.219.0.158', lat: 16.850162, lng: 74.584864, provisionedSla: 100 },
  { name: 'Miraj', ip: '103.219.1.142', lat: 16.828588, lng: 74.646139, provisionedSla: 75 },
  { name: 'Kothrud Pune', ip: '103.200.105.88', lat: 18.507197, lng: 73.792366, provisionedSla: 150 }
];

// Query Prometheus
async function queryPrometheus(query) {
  try {
    const response = await axios.get(`${PROMELLEUS_URL}/api/v1/query`, {
      params: { query }
    });
    return response.data;
  } catch (error) {
    console.error('Prometheus query error:', error.message);
    throw error;
  }
}

// Query Prometheus with time range
async function queryPrometheusRange(query, start, end, step = '1m') {
  try {
    const response = await axios.get(`${PROMELLEUS_URL}/api/v1/query_range`, {
      params: { query, start, end, step }
    });
    return response.data;
  } catch (error) {
    console.error('Prometheus query_range error:', error.message);
    throw error;
  }
}

/**
 * GET /api/bandwidth/current
 * Get current bandwidth for all locations from REAL Prometheus data
 */
router.get('/current', async (req, res) => {
  try {
    // Query download bandwidth (ifHCInOctets)
    const downloadQuery = 'rate(ifHCInOctets[5m]) * 8';
    // Query upload bandwidth (ifHCOutOctets)
    const uploadQuery = 'rate(ifHCOutOctets[5m]) * 8';
    
    const [downloadResult, uploadResult] = await Promise.all([
      queryPrometheus(downloadQuery),
      queryPrometheus(uploadQuery)
    ]);
    
    // Process results and map to locations
    const results = LOCATIONS.map(location => {
      const instance = location.ip;
      
      // Get download for this router (sum all interfaces)
      let totalDownload = 0;
      if (downloadResult.data?.result) {
        const downloadMetrics = downloadResult.data.result.filter(m => m.metric.instance === instance);
        downloadMetrics.forEach(m => {
          totalDownload += parseFloat(m.value[1]) || 0;
        });
      }
      
      // Get upload for this router (sum all interfaces)
      let totalUpload = 0;
      if (uploadResult.data?.result) {
        const uploadMetrics = uploadResult.data.result.filter(m => m.metric.instance === instance);
        uploadMetrics.forEach(m => {
          totalUpload += parseFloat(m.value[1]) || 0;
        });
      }
      
      const isOnline = totalDownload > 0 || totalUpload > 0;
      
      // Calculate total in Mbps for SLA calculation
      const totalMbps = (totalDownload + totalUpload) / 1000000;
      const provisionedSla = location.provisionedSla || 100;
      const slaUtilization = isOnline ? ((totalMbps / provisionedSla) * 100).toFixed(1) : null;
      
      return {
        location: location.name,
        ip: location.ip,
        lat: location.lat,
        lng: location.lng,
        download: totalDownload,
        upload: totalUpload,
        downloadMbps: (totalDownload / 1000000).toFixed(2),
        uploadMbps: (totalUpload / 1000000).toFixed(2),
        provisionedSla: provisionedSla,
        slaUtilization: slaUtilization,
        status: isOnline ? 'online' : 'offline'
      };
    });
    
    res.json({
      success: true,
      source: 'prometheus',
      data: results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching bandwidth:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bandwidth data',
      message: error.message
    });
  }
});

/**
 * GET /api/bandwidth/history
 * Get bandwidth history for all locations
 */
router.get('/history', async (req, res) => {
  try {
    const { duration = '24h' } = req.query;
    
    // Parse duration to milliseconds
    const durationMs = parseDuration(duration);
    const end = new Date();
    const start = new Date(end.getTime() - durationMs);
    
    // Calculate appropriate step based on duration
    const step = calculateStep(duration);
    
    const downloadQuery = 'rate(ifHCInOctets[5m]) * 8';
    const uploadQuery = 'rate(ifHCOutOctets[5m]) * 8';
    
    const [downloadResult, uploadResult] = await Promise.all([
      queryPrometheusRange(downloadQuery, start, end, '5m'),
      queryPrometheusRange(uploadQuery, start, end, '5m')
    ]);
    
    // Transform data for each location
    const results = LOCATIONS.map(location => {
      const instance = location.ip;
      
      // Get download history
      const downloadHistory = [];
      if (downloadResult.data?.result) {
        const downloadMetrics = downloadResult.data.result.filter(m => m.metric.instance === instance);
        if (downloadMetrics.length > 0) {
          // Use the first interface that has data (or sum them)
          const metric = downloadMetrics[0];
          metric.values.forEach(([timestamp, value]) => {
            downloadHistory.push({
              timestamp: new Date(timestamp * 1000).toISOString(),
              time: new Date(timestamp * 1000).toISOString(),
              value: parseFloat(value) || 0
            });
          });
        }
      }
      
      // Get upload history
      const uploadHistory = [];
      if (uploadResult.data?.result) {
        const uploadMetrics = uploadResult.data.result.filter(m => m.metric.instance === instance);
        if (uploadMetrics.length > 0) {
          const metric = uploadMetrics[0];
          metric.values.forEach(([timestamp, value]) => {
            uploadHistory.push({
              timestamp: new Date(timestamp * 1000).toISOString(),
              value: parseFloat(value) || 0
            });
          });
        }
      }
      
      // Merge download and upload into single history
      const history = downloadHistory.map((d, i) => ({
        time: d.time,
        timestamp: d.timestamp,
        download: d.value,
        upload: uploadHistory[i]?.value || 0
      }));
      
      return {
        location: location.name,
        ip: instance,
        history
      };
    });
    
    res.json({
      success: true,
      source: 'prometheus',
      data: results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching bandwidth history:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bandwidth history',
      message: error.message
    });
  }
});

/**
 * GET /api/bandwidth/location/:name
 * Get bandwidth for specific location
 */
router.get('/location/:name', async (req, res) => {
  const { name } = req.params;
  const location = LOCATIONS.find(l => l.name.toLowerCase().includes(name.toLowerCase()));
  
  if (!location) {
    return res.status(404).json({
      success: false,
      error: 'Location not found'
    });
  }
  
  try {
    const downloadQuery = `rate(ifHCInOctets{instance="${location.ip}"}[5m]) * 8`;
    const uploadQuery = `rate(ifHCOutOctets{instance="${location.ip}"}[5m]) * 8`;
    
    const [downloadResult, uploadResult] = await Promise.all([
      queryPrometheus(downloadQuery),
      queryPrometheus(uploadQuery)
    ]);
    
    let totalDownload = 0;
    let totalUpload = 0;
    const interfaces = {};
    
    if (downloadResult.data?.result) {
      downloadResult.data.result.forEach(m => {
        const ifName = m.metric.ifName || m.metric.ifDescr;
        interfaces[ifName] = { ...interfaces[ifName], download: parseFloat(m.value[1]) || 0 };
        totalDownload += parseFloat(m.value[1]) || 0;
      });
    }
    
    if (uploadResult.data?.result) {
      uploadResult.data.result.forEach(m => {
        const ifName = m.metric.ifName || m.metric.ifDescr;
        interfaces[ifName] = { ...interfaces[ifName], upload: parseFloat(m.value[1]) || 0 };
        totalUpload += parseFloat(m.value[1]) || 0;
      });
    }
    
    res.json({
      success: true,
      source: 'prometheus',
      data: {
        location: location.name,
        ip: location.ip,
        lat: location.lat,
        lng: location.lng,
        interfaces,
        total: {
          download: totalDownload,
          upload: totalUpload,
          downloadMbps: (totalDownload / 1000000).toFixed(2),
          uploadMbps: (totalUpload / 1000000).toFixed(2)
        },
        status: totalDownload > 0 || totalUpload > 0 ? 'online' : 'offline'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/bandwidth/locations
 * Get all locations
 */
router.get('/locations', (req, res) => {
  res.json({
    success: true,
    data: LOCATIONS.map(loc => ({
      name: loc.name,
      ip: loc.ip,
      lat: loc.lat,
      lng: loc.lng
    }))
  });
});

module.exports = router;
