/**
 * MongoDB Schema Design for Network Monitoring Dashboard
 * =======================================================
 * 
 * This file defines the Mongoose schemas for storing router
 * locations, metadata, and monitoring configuration.
 */

const mongoose = require('mongoose');

// ============================================================================
// ROUTER SCHEMA
// ============================================================================

const routerInterfaceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    example: 'ether1'
  },
  description: {
    type: String,
    example: 'WAN Interface'
  },
  type: {
    type: String,
    enum: ['wan', 'lan', 'wireless', 'vlan', 'bridge'],
    default: 'lan'
  },
  ifIndex: {
    type: Number,
    required: true
  },
  macAddress: String,
  mtu: {
    type: Number,
    default: 1500
  },
  speed: {
    type: Number, // in Mbps
    default: 1000
  }
}, { _id: false });

const routerLocationSchema = new mongoose.Schema({
  // Location Information
  name: {
    type: String,
    required: true,
    trim: true,
    example: 'Ganpati Peth Sangli'
  },
  shortName: {
    type: String,
    trim: true,
    example: 'Ganpati Peth'
  },
  
  // Network Information
  staticIP: {
    type: String,
    required: true,
    unique: true,
    example: '103.219.0.157'
  },
  hostname: {
    type: String,
    trim: true,
    example: 'router-ganpati'
  },
  
  // Geographic Information
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      example: [74.560903, 16.862013]
    },
    address: String,
    city: String,
    state: {
      type: String,
      default: 'Maharashtra'
    },
    country: {
      type: String,
      default: 'India'
    }
  },
  
  // Router Hardware Information
  hardware: {
    model: String,
    manufacturer: {
      type: String,
      default: 'MikroTik'
    },
    serialNumber: String,
    firmwareVersion: String,
    routerOSVersion: String
  },
  
  // Network Interfaces
  interfaces: [routerInterfaceSchema],
  
  // Monitoring Configuration
  monitoring: {
    enabled: {
      type: Boolean,
      default: true
    },
    snmp: {
      community: {
        type: String,
        default: 'public'
      },
      port: {
        type: Number,
        default: 161
      },
      version: {
        type: String,
        enum: ['v1', 'v2c', 'v3'],
        default: 'v2c'
      },
      timeout: {
        type: Number,
        default: 5000
      }
    },
    pollingInterval: {
      type: Number,
      default: 60 // seconds
    },
    alertThreshold: {
      bandwidth: {
        type: Number, // Mbps
        default: 900
      },
      cpu: {
        type: Number, // percentage
        default: 80
      },
      memory: {
        type: Number, // percentage
        default: 90
      }
    }
  },
  
  // Status
  status: {
    type: String,
    enum: ['online', 'offline', 'degraded', 'maintenance', 'unknown'],
    default: 'unknown'
  },
  lastSeen: Date,
  uptime: Number, // in seconds
  lastDowntime: Date,
  lastCheck: Date,
  
  // Tags for filtering
  tags: [{
    type: String,
    trim: true
  }],
  
  // Priority for alerts
  priority: {
    type: Number,
    default: 1,
    min: 1,
    max: 5
  },
  
  // Notes
  notes: String,
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ============================================================================
// ALERT SCHEMA
// ============================================================================

const alertSchema = new mongoose.Schema({
  router: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Router',
    required: true
  },
  routerName: String,
  
  type: {
    type: String,
    enum: ['bandwidth', 'cpu', 'memory', 'downtime', 'packet_loss', 'latency', 'custom'],
    required: true
  },
  
  severity: {
    type: String,
    enum: ['critical', 'warning', 'info'],
    required: true
  },
  
  message: {
    type: String,
    required: true
  },
  
  metric: {
    name: String,
    value: Number,
    threshold: Number,
    unit: String
  },
  
  status: {
    type: String,
    enum: ['active', 'acknowledged', 'resolved'],
    default: 'active'
  },
  
  acknowledgedBy: String,
  acknowledgedAt: Date,
  
  resolvedAt: Date,
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// ============================================================================
// SETTINGS SCHEMA
// ============================================================================

const settingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  value: mongoose.Schema.Types.Mixed,
  description: String,
  category: {
    type: String,
    enum: ['general', 'prometheus', 'grafana', 'alerts', 'notifications'],
    default: 'general'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// ============================================================================
// BANDWIDTH HISTORY SCHEMA (For caching Prometheus data)
// ============================================================================

const bandwidthHistorySchema = new mongoose.Schema({
  router: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Router',
    required: true
  },
  interface: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  download: {
    type: Number, // bps
    required: true
  },
  upload: {
    type: Number, // bps
    required: true
  },
  total: {
    type: Number // bps
  }
}, {
  timestamps: true
});

// Create compound index for efficient queries
bandwidthHistorySchema.index({ router: 1, interface: 1, timestamp: -1 });
bandwidthHistorySchema.index({ router: 1, timestamp: -1 });

// ============================================================================
// VIRTUALS & METHODS
// ============================================================================

// Calculate bandwidth in human-readable format
bandwidthHistorySchema.virtual('downloadFormatted').get(function() {
  return formatBytes(this.download);
});

bandwidthHistorySchema.virtual('uploadFormatted').get(function() {
  return formatBytes(this.upload);
});

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Get current status based on lastSeen
routerLocationSchema.virtual('isOnline').get(function() {
  if (!this.lastSeen) return false;
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return this.lastSeen > fiveMinutesAgo;
});

// ============================================================================
// EXPORTS
// ============================================================================

const Router = mongoose.model('Router', routerLocationSchema);
const Alert = mongoose.model('Alert', alertSchema);
const Settings = mongoose.model('Settings', settingsSchema);
const BandwidthHistory = mongoose.model('BandwidthHistory', bandwidthHistorySchema);

module.exports = {
  Router,
  Alert,
  Settings,
  BandwidthHistory,
  routerLocationSchema,
  routerInterfaceSchema,
  alertSchema,
  settingsSchema,
  bandwidthHistorySchema
};

/**
 * =============================================================================
 * EXAMPLE MONGODB DOCUMENTS
 * =============================================================================
 * 
 * {
 *   "_id": ObjectId("..."),
 *   "name": "Ganpati Peth Sangli",
 *   "shortName": "Ganpati Peth",
 *   "staticIP": "103.219.0.157",
 *   "hostname": "router-ganpati",
 *   "location": {
 *     "type": "Point",
 *     "coordinates": [74.560903, 16.862013],
 *     "address": "Ganpati Peth, Sangli",
 *     "city": "Sangli",
 *     "state": "Maharashtra",
 *     "country": "India"
 *   },
 *   "hardware": {
 *     "model": "CCR1009-7G-1C-1S+",
 *     "manufacturer": "MikroTik",
 *     "firmwareVersion": "7.13.5"
 *   },
 *   "interfaces": [
 *     { "name": "ether1", "description": "WAN", "type": "wan", "ifIndex": 1 },
 *     { "name": "ether2", "description": "LAN1", "type": "lan", "ifIndex": 2 },
 *     { "name": "wlan1", "description": "WiFi", "type": "wireless", "ifIndex": 3 }
 *   ],
 *   "monitoring": {
 *     "enabled": true,
 *     "snmp": { "community": "public", "version": "v2c" },
 *     "pollingInterval": 60,
 *     "alertThreshold": { "bandwidth": 900, "cpu": 80, "memory": 90 }
 *   },
 *   "status": "online",
 *   "lastSeen": ISODate("2026-03-05T18:30:00Z"),
 *   "priority": 1,
 *   "tags": ["branch", "primary"],
 *   "createdAt": ISODate("2026-01-01T00:00:00Z"),
 *   "updatedAt": ISODate("2026-03-05T18:30:00Z")
 * }
 */
