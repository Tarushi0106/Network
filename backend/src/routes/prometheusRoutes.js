/**
 * Prometheus API Bridge
 * ====================
 * Express routes that query Prometheus and expose clean API endpoints
 * for the React frontend.
 * 
 * Why use this backend instead of calling Prometheus directly?
 * -----------------------------------------------------------
 * 1. CORS: Prometheus doesn't support CORS, so browser requests fail
 * 2. Security: Frontend shouldn't have direct access to Prometheus
 * 3. Data transformation: Clean up Prometheus responses for frontend
 * 4. Caching: Can add caching to reduce Prometheus load
 * 5. Authentication: Can add auth before exposing to frontend
 */

const express = require('express');
const axios = require('axios');
const router = express.Router();

// Configuration
const PROMETHEUS_URL = process.env.PROMETHEUS_URL || 'http://localhost:9090';

/**
 * Helper function to query Prometheus
 */
async function queryPrometheus(query) {
  try {
    const response = await axios.get(`${PROMETHEUS_URL}/api/v1/query`, {
      params: { query }
    });
    return response.data;
  } catch (error) {
    console.error(`Prometheus query error: ${query}`, error.message);
    throw error;
  }
}

/**
 * Helper function to query Prometheus with time range
 */
async function queryPrometheusRange(query, start, end, step = '1m') {
  try {
    const response = await axios.get(`${PROMETHEUS_URL}/api/v1/query_range`, {
      params: { query, start, end, step }
    });
    return response.data;
  } catch (error) {
    console.error(`Prometheus range query error: ${query}`, error.message);
    throw error;
  }
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    prometheus: PROMETHEUS_URL
  });
});

/**
 * GET /api/cpu
 * Returns CPU usage percentage from all nodes
 * 
 * PromQL: Average CPU usage across all cores
 */
router.get('/cpu', async (req, res) => {
  try {
    // Query 1: CPU usage (100% - idle)
    const query = '100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)';
    const result = await queryPrometheus(query);
    
    // Transform for frontend
    const data = result.data.result.map(metric => ({
      instance: metric.metric.instance,
      cpu: parseFloat(metric.value[1]).toFixed(2),
      timestamp: metric.value[0]
    }));
    
    res.json({
      success: true,
      metric: 'cpu_usage_percent',
      data: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch CPU metrics',
      message: error.message
    });
  }
});

/**
 * GET /api/memory
 * Returns memory usage percentage
 * 
 * PromQL: (1 - available/total) * 100
 */
router.get('/memory', async (req, res) => {
  try {
    const query = '(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100';
    const result = await queryPrometheus(query);
    
    const data = result.data.result.map(metric => ({
      instance: metric.metric.instance,
      memory: parseFloat(metric.value[1]).toFixed(2),
      timestamp: metric.value[0]
    }));
    
    res.json({
      success: true,
      metric: 'memory_usage_percent',
      data: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch memory metrics',
      message: error.message
    });
  }
});

/**
 * GET /api/network
 * Returns network traffic (bytes per second)
 * 
 * PromQL: Sum of network receive/transmit rates
 */
router.get('/network', async (req, res) => {
  try {
    // Network received bytes
    const receiveQuery = 'sum by (instance) (rate(node_network_receive_bytes_total[5m]))';
    const receiveResult = await queryPrometheus(receiveQuery);
    
    // Network transmitted bytes  
    const transmitQuery = 'sum by (instance) (rate(node_network_transmit_bytes_total[5m]))';
    const transmitResult = await queryPrometheus(transmitQuery);
    
    // Combine results
    const networkData = {};
    
    receiveResult.data.result.forEach(metric => {
      const instance = metric.metric.instance;
      networkData[instance] = networkData[instance] || { instance };
      networkData[instance].receive_bytes_per_sec = parseFloat(metric.value[1]).toFixed(2);
    });
    
    transmitResult.data.result.forEach(metric => {
      const instance = metric.metric.instance;
      networkData[instance] = networkData[instance] || { instance };
      networkData[instance].transmit_bytes_per_sec = parseFloat(metric.value[1]).toFixed(2);
    });
    
    res.json({
      success: true,
      metric: 'network_traffic',
      data: Object.values(networkData)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch network metrics',
      message: error.message
    });
  }
});

/**
 * GET /api/disk
 * Returns disk usage percentage
 * 
 * PromQL: (1 - available/total) * 100
 */
router.get('/disk', async (req, res) => {
  try {
    const query = '(1 - (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"})) * 100';
    const result = await queryPrometheus(query);
    
    const data = result.data.result.map(metric => ({
      instance: metric.metric.instance,
      device: metric.metric.device,
      mountpoint: metric.metric.mountpoint,
      disk: parseFloat(metric.value[1]).toFixed(2),
      timestamp: metric.value[0]
    }));
    
    res.json({
      success: true,
      metric: 'disk_usage_percent',
      data: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch disk metrics',
      message: error.message
    });
  }
});

// ============================================================================
// SCALABILITY SUGGESTIONS
// ============================================================================

/*
 * To scale this architecture:
 * 
 * 1. Add Redis caching:
 *    - Cache Prometheus responses for 10-30 seconds
 *    - Reduce load on Prometheus
 *    - Improve response times
 * 
 * 2. Add authentication:
 *    - Use JWT tokens
 *    - Validate tokens before querying Prometheus
 *    - Rate limiting per user
 * 
 * 3. Add load balancing:
 *    - Run multiple backend instances
 *    - Use AWS ALB or Nginx
 * 
 * 4. Add metrics for the backend itself:
 *    - Track request counts
 *    - Track response times
 *    - Track Prometheus query times
 */

module.exports = router;
