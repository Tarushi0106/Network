const express = require('express');
const router = express.Router();
const grafanaService = require('../services/grafanaService');

/**
 * GET /api/grafana/alerts
 * Fetch all active alerts from Grafana
 */
router.get('/alerts', async (req, res) => {
  try {
    const alerts = await grafanaService.getAlerts();
    const transformedAlerts = grafanaService.transformAlerts(alerts);
    res.json(transformedAlerts);
  } catch (error) {
    console.error('Error in /alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

/**
 * GET /api/grafana/locations
 * Fetch all router locations with bandwidth data
 */
router.get('/locations', async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '1h';
    const locations = await grafanaService.getAllRoutersBandwidth(timeRange);
    res.json(locations);
  } catch (error) {
    console.error('Error in /locations:', error);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

/**
 * GET /api/grafana/bandwidth/:routerIP
 * Fetch bandwidth data for specific router
 */
router.get('/bandwidth/:routerIP', async (req, res) => {
  try {
    const { routerIP } = req.params;
    const { timeRange = '1h' } = req.query;
    const bandwidth = await grafanaService.getRouterBandwidth(routerIP, timeRange);
    res.json(bandwidth);
  } catch (error) {
    console.error('Error in /bandwidth:', error);
    res.status(500).json({ error: 'Failed to fetch bandwidth data' });
  }
});

/**
 * GET /api/grafana/status/:routerIP
 * Fetch status for specific router
 */
router.get('/status/:routerIP', async (req, res) => {
  try {
    const { routerIP } = req.params;
    const status = await grafanaService.getRouterStatus(routerIP);
    res.json({ ip: routerIP, status });
  } catch (error) {
    console.error('Error in /status:', error);
    res.status(500).json({ error: 'Failed to fetch router status' });
  }
});

/**
 * GET /api/grafana/dashboard/:uid
 * Fetch Grafana dashboard by UID
 */
router.get('/dashboard/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const dashboard = await grafanaService.getDashboard(uid);
    res.json(dashboard);
  } catch (error) {
    console.error('Error in /dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

/**
 * GET /api/grafana/summary
 * Get summary of all network metrics
 */
router.get('/summary', async (req, res) => {
  try {
    const locations = await grafanaService.getAllRoutersBandwidth('1h');
    
    const summary = {
      totalLocations: locations.length,
      onlineRouters: locations.filter(l => l.status === 'online').length,
      offlineRouters: locations.filter(l => l.status === 'offline').length,
      totalBandwidth: {
        download: locations.reduce((sum, l) => sum + (l.download || 0), 0),
        upload: locations.reduce((sum, l) => sum + (l.upload || 0), 0),
      },
      locations: locations,
    };
    
    res.json(summary);
  } catch (error) {
    console.error('Error in /summary:', error);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

module.exports = router;
