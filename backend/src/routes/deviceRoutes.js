/**
 * Device Routes
 * =============
 * 
 * REST API endpoints for device monitoring:
 * - GET /api/devices - Total routers and device status
 * - GET /api/network-health - Device health categories
 * - GET /api/alerts - Network alerts
 * - GET /api/bandwidth/:routerIp - Bandwidth for specific router
 */
const ping = require("ping");
const express = require('express');
const router = express.Router();
const axios = require('axios');

const PROMELLEUS_URL = process.env.PROMETHEUS_URL || 'http://localhost:9090';
async function checkRouter(ip) {
  const result = await ping.promise.probe(ip);
  return result.alive;
}
// Network locations with IP mapping (fallback if MongoDB not available)
const LOCATIONS = [
  { name: 'Ganpati Peth Sangli', ip: '103.219.0.157', lat: 16.862013, lng: 74.560903, status: 'online' },
  { name: 'Gadhinglaj', ip: '103.200.105.88', lat: 16.22582, lng: 74.35093, status: 'offline' },
  { name: 'Market Yard Sangli', ip: '103.200.105.88', lat: 16.850162, lng: 74.584864, status: 'online' },
  { name: 'Miraj', ip: '103.219.1.142', lat: 16.828588, lng: 74.646139, status: 'online' },
  { name: 'Kothrud Pune', ip: '103.200.105.88', lat: 18.507197, lng: 73.792366, status: 'online' }
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
    return { status: 'error', data: { result: [] } };
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
    return { status: 'error', data: { result: [] } };
  }
}

/**
 * GET /api/devices
 * Returns total routers and device status
 */
router.get("/devices", async (req, res) => {

  const devices = await Promise.all(
    LOCATIONS.map(async (loc) => {

      const upMetric = upResult?.data?.result?.find(
        m => m.metric.instance === loc.ip
      );

let isOnline = false;

if (upMetric && upMetric.value && upMetric.value[1] === "1") {
  isOnline = true;
}

return {
  name: loc.name,
  ip: loc.ip,
  status: isOnline ? "online" : "offline",
  latitude: loc.lat,
  longitude: loc.lng
};

    })
  );

  res.json({
    success: true,
    devices
  });

});
/**
 * GET /api/network-health
 * Returns counts of devices in health categories
 */
router.get('/network-health', async (req, res) => {
  try {
    // Query various health metrics from Prometheus
    const cpuQuery = '100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)';
    const memoryQuery = '(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100';
    
    const [cpuResult, memoryResult] = await Promise.all([
      queryPrometheus(cpuQuery),
      queryPrometheus(memoryQuery)
    ]);
    
    // Calculate health based on metrics
    const healthData = [];
    let totalScore = 0;
    let deviceCount = 0;
    
    for (const loc of LOCATIONS) {
      const cpuMetric = cpuResult?.data?.result?.find(m => m.metric.instance === loc.ip);
      const memMetric = memoryResult?.data?.result?.find(m => m.metric.instance === loc.ip);
      
      const cpu = cpuMetric ? parseFloat(cpuMetric.value[1]) : Math.random() * 50 + 10;
      const memory = memMetric ? parseFloat(memMetric.value[1]) : Math.random() * 40 + 20;
      
      // Calculate health score (100 = excellent, 0 = critical)
      const score = Math.max(0, 100 - cpu - memory);
      
      let category;
      if (score >= 90) category = 'Excellent';
      else if (score >= 75) category = 'Good';
      else if (score >= 60) category = 'Fair';
      else if (score >= 40) category = 'Poor';
      else category = 'Critical';
      
      healthData.push({
        name: loc.name,
        ip: loc.ip,
        score: Math.round(score),
        category,
        cpu: Math.round(cpu),
        memory: Math.round(memory)
      });
      
      totalScore += score;
      deviceCount++;
    }
    
    // Group by category
    const categoryCounts = {
      Excellent: healthData.filter(d => d.category === 'Excellent').length,
      Good: healthData.filter(d => d.category === 'Good').length,
      Fair: healthData.filter(d => d.category === 'Fair').length,
      Poor: healthData.filter(d => d.category === 'Poor').length,
      Critical: healthData.filter(d => d.category === 'Critical').length
    };
    
    res.json({
      success: true,
      data: {
        categories: [
          { category: 'Excellent', count: categoryCounts.Excellent, score: 95 },
          { category: 'Good', count: categoryCounts.Good, score: 82 },
          { category: 'Fair', count: categoryCounts.Fair, score: 65 },
          { category: 'Poor', count: categoryCounts.Poor, score: 45 },
          { category: 'Critical', count: categoryCounts.Critical, score: 25 }
        ],
        averageScore: deviceCount > 0 ? Math.round(totalScore / deviceCount) : 0,
        devices: healthData
      }
    });
  } catch (error) {
    console.error('Error fetching network health:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch network health',
      message: error.message
    });
  }
});

/**
 * GET /api/alerts
 * Returns network alerts
 */
router.get('/alerts', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // Query for down routers
    const downQuery = 'up{job="snmp"} == 0';
    const downResult = await queryPrometheus(downQuery);
    
    // Query for high bandwidth
    const highBandwidthQuery = 'rate(ifHCInOctets[5m]) * 8 / 1000000 > 80';
    const bandwidthResult = await queryPrometheus(highBandwidthQuery);
    
    // Query for high CPU
    const highCpuQuery = '100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80';
    const cpuResult = await queryPrometheus(highCpuQuery);
    
    const alerts = [];
    
    // Add offline alerts
    downResult?.data?.result?.forEach(metric => {
      const instance = metric.metric.instance;
      const location = LOCATIONS.find(l => l.ip === instance);
      if (location) {
        alerts.push({
          id: `offline-${instance}`,
          severity: 'critical',
          message: `Router offline - ${location.name}`,
          location: location.name,
          time: 'Just now',
          routerIp: instance
        });
      }
    });
    
    // Add high bandwidth alerts
    bandwidthResult?.data?.result?.forEach(metric => {
      const instance = metric.metric.instance;
      const location = LOCATIONS.find(l => l.ip === instance);
      const value = parseFloat(metric.value[1]).toFixed(2);
      if (location) {
        alerts.push({
          id: `bandwidth-${instance}`,
          severity: 'warning',
          message: `High bandwidth usage at ${location.name}: ${value} Mbps`,
          location: location.name,
          time: '5 mins ago',
          routerIp: instance
        });
      }
    });
    
    // Add high CPU alerts
    cpuResult?.data?.result?.forEach(metric => {
      const instance = metric.metric.instance;
      const location = LOCATIONS.find(l => l.ip === instance);
      const value = parseFloat(metric.value[1]).toFixed(1);
      if (location) {
        alerts.push({
          id: `cpu-${instance}`,
          severity: 'warning',
          message: `High CPU usage on ${location.name}: ${value}%`,
          location: location.name,
          time: '10 mins ago',
          routerIp: instance
        });
      }
    });
    
    // Sort by severity
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
    
    res.json({
      success: true,
      count: alerts.length,
      data: alerts.slice(0, parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alerts',
      message: error.message
    });
  }
});

/**
 * GET /api/bandwidth/:routerIp
 * Fetch bandwidth metrics from Prometheus for specific router IP
 */
router.get('/bandwidth/:routerIp', async (req, res) => {
  try {
    const { routerIp } = req.params;
    const { duration = '1h' } = req.query;
    
    // Parse duration
    const durationMs = {
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '30m': 30 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '3h': 3 * 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '12h': 12 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000
    };
    
    const ms = durationMs[duration] || 60 * 60 * 1000;
    const end = new Date();
    const start = new Date(end.getTime() - ms);
    
    // Prometheus queries for bandwidth
    const downloadQuery = `rate(ifHCInOctets{instance="${routerIp}"}[5m]) * 8 / 1000000`;
    const uploadQuery = `rate(ifHCOutOctets{instance="${routerIp}"}[5m]) * 8 / 1000000`;
    
    const [downloadResult, uploadResult] = await Promise.all([
      queryPrometheusRange(downloadQuery, start.toISOString(), end.toISOString(), '1m'),
      queryPrometheusRange(uploadQuery, start.toISOString(), end.toISOString(), '1m')
    ]);
    
    // Get current values
    const currentDownloadQuery = `rate(ifHCInOctets{instance="${routerIp}"}[5m]) * 8 / 1000000`;
    const currentUploadQuery = `rate(ifHCOutOctets{instance="${routerIp}"}[5m]) * 8 / 1000000`;
    
    const [currentDownload, currentUpload] = await Promise.all([
      queryPrometheus(currentDownloadQuery),
      queryPrometheus(currentUploadQuery)
    ]);
    
    // Extract current values
    const currentDownloadValue = currentDownload?.data?.result?.[0]?.value?.[1] || 0;
    const currentUploadValue = currentUpload?.data?.result?.[0]?.value?.[1] || 0;
    
    // Process history data
    const downloadHistory = [];
    downloadResult?.data?.result?.[0]?.values?.forEach(([timestamp, value]) => {
      downloadHistory.push({
        timestamp: new Date(timestamp * 1000).toISOString(),
        value: parseFloat(value) || 0
      });
    });
    
    const uploadHistory = [];
    uploadResult?.data?.result?.[0]?.values?.forEach(([timestamp, value]) => {
      uploadHistory.push({
        timestamp: new Date(timestamp * 1000).toISOString(),
        value: parseFloat(value) || 0
      });
    });
    
    // Merge into single history array
    const history = downloadHistory.map((d, i) => ({
      time: d.timestamp,
      download: d.value,
      upload: uploadHistory[i]?.value || 0
    }));
    
    // Get location info
    const location = LOCATIONS.find(l => l.ip === routerIp);
    
    res.json({
      success: true,
      data: {
        routerIp,
        location: location?.name || 'Unknown',
        current: {
          download: parseFloat(currentDownloadValue) || 0,
          upload: parseFloat(currentUploadValue) || 0
        },
        history
      }
    });
  } catch (error) {
    console.error('Error fetching bandwidth:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bandwidth',
      message: error.message
    });
  }
});

/**
 * GET /api/bandwidth/top
 * Returns top 5 routers by bandwidth usage
 */
router.get('/bandwidth/top', async (req, res) => {
  try {
    // Query current bandwidth for all routers
    const downloadQuery = 'rate(ifHCInOctets[5m]) * 8 / 1000000';
    const uploadQuery = 'rate(ifHCOutOctets[5m]) * 8 / 1000000';
    
    const [downloadResult, uploadResult] = await Promise.all([
      queryPrometheus(downloadQuery),
      queryPrometheus(uploadQuery)
    ]);
    
    // Also get device status
    const upQuery = 'up{job="snmp"}';
    const upResult = await queryPrometheus(upQuery);
    
    // Build bandwidth data for each location
    const bandwidthData = LOCATIONS.map(loc => {
      // Find download metric for this router
      const downloadMetric = downloadResult?.data?.result?.find(
        m => m.metric.instance === loc.ip
      );
      const download = downloadMetric ? parseFloat(downloadMetric.value[1]) : 0;
      
      // Find upload metric for this router
      const uploadMetric = uploadResult?.data?.result?.find(
        m => m.metric.instance === loc.ip
      );
      const upload = uploadMetric ? parseFloat(uploadMetric.value[1]) : 0;
      
      // Find online status
      const upMetric = upResult?.data?.result?.find(
        m => m.metric.instance === loc.ip
      );
      const isOnline = !!upMetric;
      
      // Calculate total bandwidth for sorting
      const total = download + upload;
      
      return {
        name: loc.name,
        ip: loc.ip,
        download: parseFloat(download.toFixed(2)),
        upload: parseFloat(upload.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        status: isOnline ? 'online' : 'offline'
      };
    });
    
    // Sort by total bandwidth (descending) and take top 5
    const topBandwidth = bandwidthData
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
    
    // Calculate totals
    const totalDownload = topBandwidth.reduce((sum, r) => sum + r.download, 0);
    const totalUpload = topBandwidth.reduce((sum, r) => sum + r.upload, 0);
    const activeDevices = topBandwidth.filter(r => r.status === 'online').length;
    
    res.json({
      success: true,
      data: {
        topBandwidth,
        summary: {
          totalDownload: parseFloat(totalDownload.toFixed(2)),
          totalUpload: parseFloat(totalUpload.toFixed(2)),
          activeDevices,
          totalDevices: topBandwidth.length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching top bandwidth:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch top bandwidth',
      message: error.message
    });
  }
});

module.exports = router;

/**
 * GET /api/network-downtime
 * Fetch network downtime events from Prometheus
 * 
 * Uses the 'up' metric to detect when devices were down.
 * When up == 0, the device is down.
 * 
 * Query parameters:
 * - hours: Number of hours to look back (default: 24)
 * 
 * Returns:
 * - Array of downtime events with device name, down time, up time, and duration
 */
router.get('/network-downtime', async (req, res) => {
  try {
    const { hours = 24 } = req.query;
    const hoursNum = parseInt(hours) || 24;
    
    const end = new Date();
    const start = new Date(end.getTime() - hoursNum * 60 * 60 * 1000);
    
    console.log(`Fetching network downtime for last ${hoursNum} hours`);
    console.log(`Time range: ${start.toISOString()} to ${end.toISOString()}`);
    
    // Query for 'up' metric to get device status over time
    const upQuery = 'up';
    
    const upResult = await queryPrometheusRange(
      upQuery,
      start.toISOString(),
      end.toISOString(),
      '1m' // 1 minute resolution
    );
    
    if (!upResult?.data?.result || upResult.data.result.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: 'No uptime data available'
      });
    }
    
    // Process each device's uptime data
    const downtimeEvents = [];
    
    for (const metric of upResult.data.result) {
      const instance = metric.metric.instance;
      const job = metric.metric.job || 'snmp';
      
      // Find location name from IP
      const location = LOCATIONS.find(loc => loc.ip === instance);
      const deviceName = location?.name || instance;
      
      // Get the time series data
      const values = metric.values || [];
      
      if (values.length < 2) continue;
      
      // Find downtime periods (where up == 0)
      let downStart = null;
      
      for (let i = 0; i < values.length; i++) {
        const [timestamp, value] = values[i];
        const time = new Date(timestamp * 1000);
        const isUp = parseFloat(value) === 1;
        
        if (!isUp && downStart === null) {
          // Device went down
          downStart = time;
        } else if (isUp && downStart !== null) {
          // Device came back up
          const durationMs = time.getTime() - downStart.getTime();
          const duration = formatDuration(durationMs);
          
          downtimeEvents.push({
            device: deviceName,
            ip: instance,
            downAt: downStart.toISOString(),
            upAt: time.toISOString(),
            duration: duration,
            durationMs: durationMs
          });
          
          downStart = null;
        }
      }
      
      // If device is still down at end of time range
      if (downStart !== null) {
        const now = new Date();
        const durationMs = now.getTime() - downStart.getTime();
        const duration = formatDuration(durationMs);
        
        downtimeEvents.push({
          device: deviceName,
          ip: instance,
          downAt: downStart.toISOString(),
          upAt: null, // Still down
          duration: duration,
          durationMs: durationMs,
          isActive: true
        });
      }
    }
    
    // Sort by downAt time (newest first)
    downtimeEvents.sort((a, b) => new Date(b.downAt) - new Date(a.downAt));
    
    // Calculate total downtime in last 24 hours
    const totalDowntimeMs = downtimeEvents.reduce((sum, event) => {
      // For active outages, count up to current time
      return sum + (event.isActive ? event.durationMs : event.durationMs);
    }, 0);
    
    console.log(`Found ${downtimeEvents.length} downtime events`);
    
    res.json({
      success: true,
      data: downtimeEvents,
      summary: {
        totalEvents: downtimeEvents.length,
        activeOutages: downtimeEvents.filter(e => e.isActive).length,
        totalDowntimeMs: totalDowntimeMs,
        totalDowntimeFormatted: formatDuration(totalDowntimeMs)
      }
    });
  } catch (error) {
    console.error('Error fetching network downtime:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch network downtime',
      message: error.message
    });
  }
});

// Helper function to format duration
function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes} minutes`;
  } else {
    return `${seconds} seconds`;
  }
}
