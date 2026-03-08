/**
 * Alert Routes
 * =============
 * 
 * REST API endpoints for alerts management.
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const { Alert, Router } = require('../models/Router');
const prometheusService = require('../services/prometheusService');

// Grafana configuration
const GRAFANA_URL = process.env.GRAFANA_URL || 'http://localhost:3000';
const GRAFANA_API_KEY = process.env.GRAFANA_API_KEY || '';

// ============================================================================
// ROUTES
// ============================================================================

/**
 * GET /api/alerts
 * Get all alerts
 * 
 * Query parameters:
 * - status: Filter by status (active, acknowledged, resolved)
 * - severity: Filter by severity (critical, warning, info)
 * - routerId: Filter by router ID
 * - limit: Number of results (default: 50)
 * 
 * @returns {Array} Array of alerts
 */
router.get('/', async (req, res) => {
  try {
    const { status, severity, routerId, limit = 50 } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (severity) filter.severity = severity;
    if (routerId) filter.router = routerId;
    
    const alerts = await Alert.find(filter)
      .populate('router', 'name shortName staticIP')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      count: alerts.length,
      data: alerts
    });
  } catch (error) {
    console.error('Error fetching alerts:', error.message);
    // Return empty array instead of error when MongoDB is unavailable
    res.json({
      success: true,
      count: 0,
      data: [],
      message: 'MongoDB unavailable, using mock data'
    });
  }
});

/**
 * GET /api/alerts/active
 * Get all active (unresolved) alerts
 * 
 * @returns {Array} Active alerts
 */
router.get('/active', async (req, res) => {
  try {
    const alerts = await Alert.find({ status: 'active' })
      .populate('router', 'name shortName staticIP')
      .sort({ severity: 1, createdAt: -1 });
    
    res.json({
      success: true,
      count: alerts.length,
      data: alerts
    });
  } catch (error) {
    console.error('Error fetching active alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active alerts',
      message: error.message
    });
  }
});

/**
 * GET /api/alerts/grafana
 * Fetch alerts directly from Grafana Alertmanager API
 * 
 * Query parameters:
 * - limit: Number of alerts to return (default: 5)
 * 
 * @returns {Array} Array of Grafana alerts
 */
router.get('/grafana', async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    
    // Grafana configuration
    const GRAFANA_URL = process.env.GRAFANA_URL || 'http://localhost:3000';
    const GRAFANA_TOKEN = 'glsa_TLiJx5EmwvFbpaI035273T9HlIKe4UbN_42cc8698'; // Use the provided token
    
    console.log(`Fetching alerts from Grafana: ${GRAFANA_URL}/api/alertmanager/grafana/api/v2/alerts`);
    
    // Fetch from Grafana Alertmanager API
    const response = await axios.get(`${GRAFANA_URL}/api/alertmanager/grafana/api/v2/alerts`, {
      headers: {
        'Authorization': `Bearer ${GRAFANA_TOKEN}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    const alertsData = response.data || [];
    console.log(`Grafana returned ${alertsData.length} alerts`);
    
    // Map Grafana alerts to our format
    const mappedAlerts = alertsData.slice(0, parseInt(limit)).map(alert => {
      const instance = alert.labels?.instance || alert.labels?.host || 'Unknown';
      const location = mapIpToLocation(instance);
      
      return {
        name: alert.labels?.alertname || 'Unknown Alert',
        severity: mapSeverity(alert.labels?.severity || 'warning'),
        location: location,
        status: alert.state === 'firing' ? 'firing' : 'resolved',
        time: alert.startsAt ? new Date(alert.startsAt).toISOString() : new Date().toISOString()
      };
    });
    
    // Sort by newest first
    mappedAlerts.sort((a, b) => new Date(b.time) - new Date(a.time));
    
    // Return alerts to frontend
    res.json({
      alerts: mappedAlerts
    });
  } catch (error) {
    console.error(`Grafana API error: ${error.message}`);
    
    // Return 503 if Grafana is unreachable
    return res.status(503).json({
      error: 'Grafana alerts service unavailable'
    });
  }
});

// Helper function to map IP to location name
function mapIpToLocation(ip) {
  const locations = {
    '103.219.0.157': 'Ganpati Peth Sangli',
    '163.223.65.200': 'Gadhinglaj',
    '103.219.0.158': 'Market Yard Sangli',
    '103.219.1.142': 'Miraj',
    '103.200.105.88': 'Kothrud Pune'
  };
  return locations[ip] || ip;
}

// Helper function to map severity levels
function mapSeverity(severity) {
  const severityMap = {
    'critical': 'critical',
    'error': 'critical',
    'warning': 'warning',
    'warn': 'warning',
    'info': 'info',
    'information': 'info'
  };
  return severityMap[severity?.toLowerCase()] || 'info';
}

/**
 * GET /api/alerts/stats
 * Get alert statistics
 * 
 * @returns {Object} Alert statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const [total, active, critical, warning, acknowledged, resolved] = await Promise.all([
      Alert.countDocuments(),
      Alert.countDocuments({ status: 'active' }),
      Alert.countDocuments({ status: 'active', severity: 'critical' }),
      Alert.countDocuments({ status: 'active', severity: 'warning' }),
      Alert.countDocuments({ status: 'acknowledged' }),
      Alert.countDocuments({ status: 'resolved' })
    ]);
    
    res.json({
      success: true,
      data: {
        total,
        active,
        critical,
        warning,
        acknowledged,
        resolved
      }
    });
  } catch (error) {
    console.error('Error fetching alert stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alert statistics',
      message: error.message
    });
  }
});

/**
 * POST /api/alerts
 * Create a new alert
 * 
 * @body {Object} Alert data
 * @returns {Object} Created alert
 */
router.post('/', async (req, res) => {
  try {
    const alert = new Alert(req.body);
    await alert.save();
    
    // Populate router info
    await alert.populate('router', 'name shortName staticIP');
    
    res.status(201).json({
      success: true,
      data: alert
    });
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to create alert',
      message: error.message
    });
  }
});

/**
 * PUT /api/alerts/:id/acknowledge
 * Acknowledge an alert
 * 
 * @param {string} id - Alert MongoDB ID
 * @body {string} acknowledgedBy - User who acknowledged
 * @returns {Object} Updated alert
 */
router.put('/:id/acknowledge', async (req, res) => {
  try {
    const { acknowledgedBy } = req.body;
    
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      {
        status: 'acknowledged',
        acknowledgedBy,
        acknowledgedAt: new Date()
      },
      { new: true }
    ).populate('router', 'name shortName staticIP');
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }
    
    res.json({
      success: true,
      data: alert
    });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to acknowledge alert',
      message: error.message
    });
  }
});

/**
 * PUT /api/alerts/:id/resolve
 * Resolve an alert
 * 
 * @param {string} id - Alert MongoDB ID
 * @returns {Object} Updated alert
 */
router.put('/:id/resolve', async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      {
        status: 'resolved',
        resolvedAt: new Date()
      },
      { new: true }
    ).populate('router', 'name shortName staticIP');
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }
    
    res.json({
      success: true,
      data: alert
    });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resolve alert',
      message: error.message
    });
  }
});

/**
 * DELETE /api/alerts/:id
 * Delete an alert
 * 
 * @param {string} id - Alert MongoDB ID
 * @returns {Object} Success message
 */
router.delete('/:id', async (req, res) => {
  try {
    const alert = await Alert.findByIdAndDelete(req.params.id);
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Alert deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete alert',
      message: error.message
    });
  }
});

/**
 * DELETE /api/alerts/clear-resolved
 * Clear all resolved alerts
 * 
 * @returns {Object} Number of deleted alerts
 */
router.delete('/clear/resolved', async (req, res) => {
  try {
    const result = await Alert.deleteMany({ status: 'resolved' });
    
    res.json({
      success: true,
      deletedCount: result.deletedCount,
      message: 'Resolved alerts cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear alerts',
      message: error.message
    });
  }
});

module.exports = router;
