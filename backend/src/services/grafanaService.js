const axios = require('axios');

// Grafana configuration
const GRAFANA_URL = process.env.GRAFANA_URL || 'http://localhost:3000';
const GRAFANA_API_KEY = process.env.GRAFANA_API_KEY || '';

// Create axios instance for Grafana API
const grafanaClient = axios.create({
  baseURL: `${GRAFANA_URL}/api`,
  headers: GRAFANA_API_KEY ? {
    'Authorization': `Bearer ${GRAFANA_API_KEY}`,
    'Content-Type': 'application/json'
  } : {
    'Content-Type': 'application/json'
  }
});

/**
 * Fetch all alerts from Grafana
 */
async function getAlerts() {
  try {
    const response = await grafanaClient.get('/alerts');
    return response.data;
  } catch (error) {
    console.error('Error fetching Grafana alerts:', error.message);
    return [];
  }
}

/**
 * Fetch alert states for dashboard
 */
async function getAlertStates() {
  try {
    const response = await grafanaClient.get('/alerts/states-for-dashboard');
    return response.data;
  } catch (error) {
    console.error('Error fetching alert states:', error.message);
    return [];
  }
}

/**
 * Fetch dashboard data by UID
 */
async function getDashboard(uid) {
  try {
    const response = await grafanaClient.get(`/dashboards/uid/${uid}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard:', error.message);
    return null;
  }
}

/**
 * Fetch metrics from Prometheus via Grafana
 */
async function getPrometheusMetrics(query, timeRange = '1h') {
  try {
    const end = Math.floor(Date.now() / 1000);
    let start;
    
    switch (timeRange) {
      case '5m': start = end - 300; break;
      case '15m': start = end - 900; break;
      case '30m': start = end - 1800; break;
      case '1h': start = end - 3600; break;
      case '6h': start = end - 21600; break;
      case '12h': start = end - 43200; break;
      case '24h': start = end - 86400; break;
      case '7d': start = end - 604800; break;
      default: start = end - 3600;
    }

    const response = await grafanaClient.get('/ds/query', {
      params: {
        ds_type: 'prometheus',
        qs: JSON.stringify([{
          refId: 'A',
          expr: query,
        }]),
        from: start * 1000,
        to: end * 1000,
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching Prometheus metrics:', error.message);
    return null;
  }
}

/**
 * Fetch bandwidth data for a specific router
 * Uses the same queries as your Grafana dashboard
 */
async function getRouterBandwidth(routerIP, timeRange = '1h') {
  try {
    // Download: rate(ifHCInOctets{instance="$router"}[5m]) * 8
    const downloadQuery = `rate(ifHCInOctets{instance="${routerIP}"}[5m]) * 8`;
    // Upload: rate(ifHCOutOctets{instance="$router"}[5m]) * 8
    const uploadQuery = `rate(ifHCOutOctets{instance="${routerIP}"}[5m]) * 8`;

    const [downloadData, uploadData] = await Promise.all([
      getPrometheusMetrics(downloadQuery, timeRange),
      getPrometheusMetrics(uploadQuery, timeRange)
    ]);

    return {
      download: downloadData,
      upload: uploadData,
    };
  } catch (error) {
    console.error('Error fetching router bandwidth:', error.message);
    return null;
  }
}

/**
 * Fetch all routers bandwidth data
 */
async function getAllRoutersBandwidth(timeRange = '1h') {
  const routers = [
    { name: 'Ganpati Peth Sangli', ip: '103.219.0.157', lat: 16.862013, lng: 74.560903 },
    { name: 'Gadhinglaj', ip: '163.223.65.200', lat: 16.22582, lng: 74.35093 },
    { name: 'Market Yard Sangli', ip: '103.219.0.158', lat: 16.850162, lng: 74.584864 },
    { name: 'Miraj', ip: '103.219.1.142', lat: 16.828588, lng: 74.646139 },
    { name: 'Kothrud Pune', ip: '103.200.105.88', lat: 18.507197, lng: 73.792366 },
  ];

  const results = await Promise.all(
    routers.map(async (router) => {
      const bandwidth = await getRouterBandwidth(router.ip, timeRange);
      
      // Calculate current bandwidth (latest value)
      const downloadMbps = bandwidth?.download?.results?.[0]?.frames?.[0]?.data?.values?.slice(-1)?.[0] || 0;
      const uploadMbps = bandwidth?.upload?.results?.[0]?.frames?.[0]?.data?.values?.slice(-1)?.[0] || 0;

      return {
        ...router,
        download: Math.round(downloadMbps * 8) / 8,
        upload: Math.round(uploadMbps * 8) / 8,
        status: downloadMbps > 0 || uploadMbps > 0 ? 'online' : 'offline',
      };
    })
  );

  return results;
}

/**
 * Fetch router status (up/down)
 */
async function getRouterStatus(routerIP) {
  try {
    const query = 'up{instance="' + routerIP + '"}';
    const response = await getPrometheusMetrics(query, '5m');
    
    const value = response?.results?.[0]?.frames?.[0]?.data?.values?.slice(-1)?.[0];
    return value === 1 ? 'online' : 'offline';
  } catch (error) {
    console.error('Error fetching router status:', error.message);
    return 'unknown';
  }
}

/**
 * Transform Grafana alerts to our format
 */
function transformAlerts(grafanaAlerts) {
  if (!grafanaAlerts || !Array.isArray(grafanaAlerts)) {
    return [];
  }

  return grafanaAlerts.map(alert => {
    let severity = 'info';
    if (alert.state === 'alerting' || alert.state === 'pending') {
      severity = 'critical';
    } else if (alert.state === 'no_data') {
      severity = 'warning';
    }

    return {
      id: alert.id,
      severity,
      message: alert.name,
      time: formatTimeAgo(alert.lastEvaluation || alert.createdAt),
      location: extractLocationFromAlert(alert.name),
      state: alert.state,
    };
  });
}

/**
 * Format timestamp to time ago string
 */
function formatTimeAgo(timestamp) {
  if (!timestamp) return 'Unknown';
  
  const now = Date.now();
  const time = new Date(timestamp).getTime();
  const diff = Math.floor((now - time) / 1000);

  if (diff < 60) return diff + 's ago';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return Math.floor(diff / 86400) + 'd ago';
}

/**
 * Extract location from alert name
 */
function extractLocationFromAlert(alertName) {
  const locations = ['Ganpati Peth', 'Gadhinglaj', 'Market Yard', 'Miraj', 'Kothrud'];
  for (const loc of locations) {
    if (alertName.toLowerCase().includes(loc.toLowerCase())) {
      return loc;
    }
  }
  return 'All Locations';
}

module.exports = {
  getAlerts,
  getAlertStates,
  getDashboard,
  getPrometheusMetrics,
  getRouterBandwidth,
  getAllRoutersBandwidth,
  getRouterStatus,
  transformAlerts,
};
