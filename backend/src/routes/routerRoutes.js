/**
 * Router Routes
 * =============
 * 
 * REST API endpoints for router management and data retrieval.
 */

const express = require('express');
const router = express.Router();
const { Router, Alert } = require('../models/Router');
const prometheusService = require('../services/prometheusService');

// ============================================================================
// ROUTES
// ============================================================================

/**
 * GET /api/routers
 * Get all router locations
 * 
 * Query parameters:
 * - status: Filter by status (online, offline, etc.)
 * - tags: Filter by tags (comma-separated)
 * 
 * @returns {Array} Array of router locations
 */
router.get('/', async (req, res) => {
  try {
    const { status, tags, priority } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (tags) filter.tags = { $in: tags.split(',') };
    if (priority) filter.priority = priority;
    
    const routers = await Router.find(filter)
      .select('-monitoring.snmp')
      .sort({ priority: 1, name: 1 });
    
    res.json({
      success: true,
      count: routers.length,
      data: routers
    });
  } catch (error) {
    console.error('Error fetching routers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch routers',
      message: error.message
    });
  }
});

/**
 * GET /api/routers/with-bandwidth
 * Get all routers with their current bandwidth data
 * 
 * @returns {Array} Array of routers with bandwidth
 */
router.get('/with-bandwidth', async (req, res) => {
  try {
    // Get all routers from MongoDB
    const routers = await Router.find({ 'monitoring.enabled': true })
      .select('name shortName staticIP location status priority');
    
    // Get bandwidth from Prometheus for all routers
    const bandwidthData = await prometheusService.getAllRoutersBandwidth();
    
    // Map bandwidth to routers
    const bandwidthMap = {};
    bandwidthData.forEach(bw => {
      bandwidthMap[bw.routerIP] = bw;
    });
    
    // Combine router info with bandwidth
    const result = routers.map(router => {
      const bw = bandwidthMap[router.staticIP] || { 
        totalDownload: 0, 
        totalUpload: 0,
        interfaces: {}
      };
      
      return {
        _id: router._id,
        name: router.name,
        shortName: router.shortName,
        staticIP: router.staticIP,
        location: router.location,
        status: router.status,
        priority: router.priority,
        bandwidth: {
          download: bw.totalDownload,
          upload: bw.totalUpload,
          downloadMbps: parseFloat(bw.totalDownloadMbps) || 0,
          uploadMbps: parseFloat(bw.totalUploadMbps) || 0,
          interfaces: bw.interfaces
        }
      };
    });
    
    res.json({
      success: true,
      count: result.length,
      data: result
    });
  } catch (error) {
    console.error('Error fetching routers with bandwidth:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch router bandwidth data',
      message: error.message
    });
  }
});

/**
 * GET /api/routers/map
 * Get routers formatted for map visualization
 * 
 * @returns {Array} Array of routers with geo coordinates
 */
router.get('/map', async (req, res) => {
  try {
    const routers = await Router.find({ 'monitoring.enabled': true })
      .select('name shortName staticIP location status priority');
    
    const mapData = routers.map(router => ({
      id: router._id,
      name: router.name,
      shortName: router.shortName,
      ip: router.staticIP,
      lat: router.location.coordinates[1],
      lng: router.location.coordinates[0],
      address: router.location.address || router.location.city,
      status: router.status,
      priority: router.priority
    }));
    
    res.json({
      success: true,
      count: mapData.length,
      data: mapData
    });
  } catch (error) {
    console.error('Error fetching map data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch map data',
      message: error.message
    });
  }
});

/**
 * GET /api/routers/:id
 * Get single router details
 * 
 * @param {string} id - Router MongoDB ID
 * @returns {Object} Router details
 */
router.get('/:id', async (req, res) => {
  try {
    const router = await Router.findById(req.params.id)
      .select('-monitoring.snmp');
    
    if (!router) {
      return res.status(404).json({
        success: false,
        error: 'Router not found'
      });
    }
    
    res.json({
      success: true,
      data: router
    });
  } catch (error) {
    console.error('Error fetching router:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch router',
      message: error.message
    });
  }
});

/**
 * GET /api/routers/ip/:ip
 * Get router by IP address
 * 
 * @param {string} ip - Router IP address
 * @returns {Object} Router details
 */
router.get('/ip/:ip', async (req, res) => {
  try {
    const router = await Router.findOne({ staticIP: req.params.ip })
      .select('-monitoring.snmp');
    
    if (!router) {
      return res.status(404).json({
        success: false,
        error: 'Router not found'
      });
    }
    
    res.json({
      success: true,
      data: router
    });
  } catch (error) {
    console.error('Error fetching router by IP:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch router',
      message: error.message
    });
  }
});

/**
 * GET /api/routers/:id/bandwidth
 * Get bandwidth for a specific router
 * 
 * @param {string} id - Router MongoDB ID
 * @query {number} duration - Duration in minutes (default: 60)
 * @returns {Object} Bandwidth data
 */
router.get('/:id/bandwidth', async (req, res) => {
  try {
    const router = await Router.findById(req.params.id);
    
    if (!router) {
      return res.status(404).json({
        success: false,
        error: 'Router not found'
      });
    }
    
    const duration = parseInt(req.query.duration) || 60;
    const bandwidth = await prometheusService.getCurrentBandwidth(router.staticIP);
    
    res.json({
      success: true,
      router: {
        id: router._id,
        name: router.name,
        ip: router.staticIP
      },
      data: bandwidth
    });
  } catch (error) {
    console.error('Error fetching bandwidth:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bandwidth data',
      message: error.message
    });
  }
});

/**
 * GET /api/routers/:id/bandwidth/history
 * Get bandwidth history for a router
 * 
 * @param {string} id - Router MongoDB ID
 * @query {number} duration - Duration in minutes (default: 60)
 * @query {string} step - Step interval (default: 1m)
 * @returns {Object} Bandwidth history
 */
router.get('/:id/bandwidth/history', async (req, res) => {
  try {
    const router = await Router.findById(req.params.id);
    
    if (!router) {
      return res.status(404).json({
        success: false,
        error: 'Router not found'
      });
    }
    
    const duration = parseInt(req.query.duration) || 60;
    const step = req.query.step || '1m';
    
    const history = await prometheusService.getBandwidthHistory(
      router.staticIP, 
      duration, 
      step
    );
    
    res.json({
      success: true,
      router: {
        id: router._id,
        name: router.name,
        ip: router.staticIP
      },
      data: history
    });
  } catch (error) {
    console.error('Error fetching bandwidth history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bandwidth history',
      message: error.message
    });
  }
});

/**
 * GET /api/routers/:id/interfaces
 * Get interface-specific bandwidth for a router
 * 
 * @param {string} id - Router MongoDB ID
 * @returns {Object} Interface bandwidth data
 */
router.get('/:id/interfaces', async (req, res) => {
  try {
    const router = await Router.findById(req.params.id);
    
    if (!router) {
      return res.status(404).json({
        success: false,
        error: 'Router not found'
      });
    }
    
    const interfaces = router.interfaces || [];
    const interfaceBandwidths = [];
    
    for (const iface of interfaces) {
      const bw = await prometheusService.getInterfaceBandwidth(
        router.staticIP, 
        iface.name
      );
      interfaceBandwidths.push({
        name: iface.name,
        description: iface.description,
        type: iface.type,
        ...bw
      });
    }
    
    res.json({
      success: true,
      router: {
        id: router._id,
        name: router.name,
        ip: router.staticIP
      },
      data: interfaceBandwidths
    });
  } catch (error) {
    console.error('Error fetching interfaces:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch interface data',
      message: error.message
    });
  }
});

/**
 * GET /api/routers/:id/status
 * Get online/offline status for a router
 * 
 * @param {string} id - Router MongoDB ID
 * @returns {Object} Status information
 */
router.get('/:id/status', async (req, res) => {
  try {
    const router = await Router.findById(req.params.id);
    
    if (!router) {
      return res.status(404).json({
        success: false,
        error: 'Router not found'
      });
    }
    
    const isOnline = await prometheusService.checkRouterOnline(router.staticIP);
    
    // Update router status in MongoDB
    router.status = isOnline ? 'online' : 'offline';
    router.lastSeen = isOnline ? new Date() : router.lastSeen;
    if (!isOnline && router.status !== 'offline') {
      router.lastDowntime = new Date();
    }
    await router.save();
    
    res.json({
      success: true,
      router: {
        id: router._id,
        name: router.name,
        ip: router.staticIP
      },
      status: router.status,
      lastSeen: router.lastSeen,
      isOnline
    });
  } catch (error) {
    console.error('Error checking status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check router status',
      message: error.message
    });
  }
});

/**
 * POST /api/routers
 * Create a new router location
 * 
 * @body {Object} Router data
 * @returns {Object} Created router
 */
router.post('/', async (req, res) => {
  try {
    const router = new Router(req.body);
    await router.save();
    
    res.status(201).json({
      success: true,
      data: router
    });
  } catch (error) {
    console.error('Error creating router:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to create router',
      message: error.message
    });
  }
});

/**
 * PUT /api/routers/:id
 * Update a router
 * 
 * @param {string} id - Router MongoDB ID
 * @body {Object} Updated router data
 * @returns {Object} Updated router
 */
router.put('/:id', async (req, res) => {
  try {
    const router = await Router.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!router) {
      return res.status(404).json({
        success: false,
        error: 'Router not found'
      });
    }
    
    res.json({
      success: true,
      data: router
    });
  } catch (error) {
    console.error('Error updating router:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to update router',
      message: error.message
    });
  }
});

/**
 * DELETE /api/routers/:id
 * Delete a router
 * 
 * @param {string} id - Router MongoDB ID
 * @returns {Object} Success message
 */
router.delete('/:id', async (req, res) => {
  try {
    const router = await Router.findByIdAndDelete(req.params.id);
    
    if (!router) {
      return res.status(404).json({
        success: false,
        error: 'Router not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Router deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting router:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete router',
      message: error.message
    });
  }
});

/**
 * POST /api/routers/seed
 * Seed initial router data (for development)
 * 
 * @returns {Array} Created routers
 */
router.post('/seed', async (req, res) => {
  try {
    const seedRouters = [
      {
        name: 'Ganpati Peth Sangli',
        shortName: 'Ganpati Peth',
        staticIP: '103.219.0.157',
        hostname: 'router-ganpati',
        location: {
          type: 'Point',
          coordinates: [74.560903, 16.862013],
          address: 'Ganpati Peth, Sangli',
          city: 'Sangli',
          state: 'Maharashtra',
          country: 'India'
        },
        hardware: {
          model: 'CCR1009-7G-1C-1S+',
          manufacturer: 'MikroTik'
        },
        interfaces: [
          { name: 'ether1', description: 'WAN', type: 'wan', ifIndex: 1 },
          { name: 'ether2', description: 'LAN1', type: 'lan', ifIndex: 2 },
          { name: 'ether3', description: 'LAN2', type: 'lan', ifIndex: 3 },
          { name: 'wlan1', description: 'WiFi 2.4GHz', type: 'wireless', ifIndex: 4 }
        ],
        monitoring: {
          enabled: true,
          snmp: { community: 'public', version: 'v2c' },
          alertThreshold: { bandwidth: 900, cpu: 80, memory: 90 }
        },
        status: 'online',
        priority: 1,
        tags: ['branch', 'primary']
      },
      {
        name: 'Gadhinglaj',
        shortName: 'Gadhinglaj',
        staticIP: '163.223.65.200',
        hostname: 'router-gadhinglaj',
        location: {
          type: 'Point',
          coordinates: [74.35093, 16.22582],
          address: 'Gadhinglaj',
          city: 'Gadhinglaj',
          state: 'Maharashtra',
          country: 'India'
        },
        hardware: {
          model: 'CCR1016-12G',
          manufacturer: 'MikroTik'
        },
        interfaces: [
          { name: 'ether1', description: 'WAN', type: 'wan', ifIndex: 1 },
          { name: 'ether2', description: 'LAN1', type: 'lan', ifIndex: 2 },
          { name: 'wlan1', description: 'WiFi', type: 'wireless', ifIndex: 3 }
        ],
        monitoring: {
          enabled: true,
          snmp: { community: 'public', version: 'v2c' },
          alertThreshold: { bandwidth: 900, cpu: 80, memory: 90 }
        },
        status: 'online',
        priority: 2,
        tags: ['branch']
      },
      {
        name: 'Market Yard Sangli',
        shortName: 'Market Yard',
        staticIP: '103.219.0.158',
        hostname: 'router-marketyard',
        location: {
          type: 'Point',
          coordinates: [74.584864, 16.850162],
          address: 'Market Yard, Sangli',
          city: 'Sangli',
          state: 'Maharashtra',
          country: 'India'
        },
        hardware: {
          model: 'CCR1009-7G-1C-1S+',
          manufacturer: 'MikroTik'
        },
        interfaces: [
          { name: 'ether1', description: 'WAN', type: 'wan', ifIndex: 1 },
          { name: 'ether2', description: 'LAN1', type: 'lan', ifIndex: 2 },
          { name: 'ether3', description: 'LAN2', type: 'lan', ifIndex: 3 },
          { name: 'wlan1', description: 'WiFi', type: 'wireless', ifIndex: 4 }
        ],
        monitoring: {
          enabled: true,
          snmp: { community: 'public', version: 'v2c' },
          alertThreshold: { bandwidth: 900, cpu: 80, memory: 90 }
        },
        status: 'online',
        priority: 1,
        tags: ['branch', 'primary']
      },
      {
        name: 'Miraj',
        shortName: 'Miraj',
        staticIP: '103.219.1.142',
        hostname: 'router-miraj',
        location: {
          type: 'Point',
          coordinates: [74.646139, 16.828588],
          address: 'Miraj',
          city: 'Miraj',
          state: 'Maharashtra',
          country: 'India'
        },
        hardware: {
          model: 'CCR1036-12G-4S+',
          manufacturer: 'MikroTik'
        },
        interfaces: [
          { name: 'ether1', description: 'WAN1', type: 'wan', ifIndex: 1 },
          { name: 'ether2', description: 'WAN2', type: 'wan', ifIndex: 2 },
          { name: 'ether3', description: 'LAN1', type: 'lan', ifIndex: 3 },
          { name: 'wlan1', description: 'WiFi', type: 'wireless', ifIndex: 4 }
        ],
        monitoring: {
          enabled: true,
          snmp: { community: 'public', version: 'v2c' },
          alertThreshold: { bandwidth: 900, cpu: 80, memory: 90 }
        },
        status: 'online',
        priority: 1,
        tags: ['branch', 'primary', 'datacenter']
      },
      {
        name: 'Kothrud Pune',
        shortName: 'Kothrud',
        staticIP: '103.200.105.88',
        hostname: 'router-kothrud',
        location: {
          type: 'Point',
          coordinates: [73.792366, 18.507197],
          address: 'Kothrud, Pune',
          city: 'Pune',
          state: 'Maharashtra',
          country: 'India'
        },
        hardware: {
          model: 'CCR1072-1G-8S+',
          manufacturer: 'MikroTik'
        },
        interfaces: [
          { name: 'ether1', description: 'WAN', type: 'wan', ifIndex: 1 },
          { name: 'ether2', description: 'LAN1', type: 'lan', ifIndex: 2 },
          { name: 'ether3', description: 'LAN2', type: 'lan', ifIndex: 3 },
          { name: 'wlan1', description: 'WiFi 2.4GHz', type: 'wireless', ifIndex: 4 },
          { name: 'wlan2', description: 'WiFi 5GHz', type: 'wireless', ifIndex: 5 }
        ],
        monitoring: {
          enabled: true,
          snmp: { community: 'public', version: 'v2c' },
          alertThreshold: { bandwidth: 900, cpu: 80, memory: 90 }
        },
        status: 'online',
        priority: 1,
        tags: ['branch', 'headquarters']
      }
    ];
    
    // Clear existing routers and insert new ones
    await Router.deleteMany({});
    const routers = await Router.insertMany(seedRouters);
    
    res.status(201).json({
      success: true,
      count: routers.length,
      message: 'Routers seeded successfully',
      data: routers
    });
  } catch (error) {
    console.error('Error seeding routers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to seed routers',
      message: error.message
    });
  }
});

module.exports = router;
