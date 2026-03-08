const API_BASE_URL = '/api';

// API endpoints
const endpoints = {
  // Grafana endpoints
  grafanaAlerts: () => `${API_BASE_URL}/grafana/alerts`,
  grafanaLocations: () => `${API_BASE_URL}/grafana/locations`,
  grafanaBandwidth: (ip) => `${API_BASE_URL}/grafana/bandwidth/${ip}`,
  grafanaStatus: (ip) => `${API_BASE_URL}/grafana/status/${ip}`,
  grafanaDashboard: (uid) => `${API_BASE_URL}/grafana/dashboard/${uid}`,
  grafanaSummary: () => `${API_BASE_URL}/grafana/summary`,
  
  // Router endpoints
  routers: () => `${API_BASE_URL}/routers`,
  routerById: (id) => `${API_BASE_URL}/routers/${id}`,
  routerStatus: () => `${API_BASE_URL}/routers/status`,
  
  // Alert endpoints
  alerts: () => `${API_BASE_URL}/alerts`,
  alertById: (id) => `${API_BASE_URL}/alerts/${id}`,
  
  // Health check
  health: () => `${API_BASE_URL}/health`,
};

/**
 * Fetch data from API
 */
async function fetchAPI(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// ==================== Grafana API Functions ====================

/**
 * Fetch all alerts from Grafana
 */
export async function getGrafanaAlerts() {
  return fetchAPI(endpoints.grafanaAlerts());
}

/**
 * Fetch all router locations with bandwidth data
 */
export async function getLocations(timeRange = '1h') {
  return fetchAPI(`${endpoints.grafanaLocations()}?timeRange=${timeRange}`);
}

/**
 * Fetch bandwidth data for specific router
 */
export async function getRouterBandwidth(routerIP, timeRange = '1h') {
  return fetchAPI(`${endpoints.grafanaBandwidth(routerIP)}?timeRange=${timeRange}`);
}

/**
 * Fetch status for specific router
 */
export async function getRouterStatus(routerIP) {
  return fetchAPI(endpoints.grafanaStatus(routerIP));
}

/**
 * Fetch Grafana dashboard by UID
 */
export async function getGrafanaDashboard(uid) {
  return fetchAPI(endpoints.grafanaDashboard(uid));
}

/**
 * Get summary of all network metrics
 */
export async function getSummary() {
  return fetchAPI(endpoints.grafanaSummary());
}

// ==================== Router API Functions ====================

/**
 * Fetch all routers
 */
export async function getRouters() {
  return fetchAPI(endpoints.routers());
}

/**
 * Fetch router by ID
 */
export async function getRouterById(id) {
  return fetchAPI(endpoints.routerById(id));
}

/**
 * Fetch all router statuses
 */
export async function getRouterStatuses() {
  return fetchAPI(endpoints.routerStatus());
}

// ==================== Alert API Functions ====================

/**
 * Fetch all alerts
 */
export async function getAlerts() {
  return fetchAPI(endpoints.alerts());
}

/**
 * Fetch alert by ID
 */
export async function getAlertById(id) {
  return fetchAPI(endpoints.alertById(id));
}

// ==================== Health Check ====================

/**
 * Check API health
 */
export async function checkHealth() {
  return fetchAPI(endpoints.health());
}

export default {
  getGrafanaAlerts,
  getLocations,
  getRouterBandwidth,
  getRouterStatus,
  getGrafanaDashboard,
  getSummary,
  getRouters,
  getRouterById,
  getRouterStatuses,
  getAlerts,
  getAlertById,
  checkHealth,
};
