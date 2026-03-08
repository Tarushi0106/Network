/**
 * Prometheus API Integration Service
 * ===================================
 * 
 * This service handles all communication with Prometheus
 * for fetching network bandwidth metrics.
 */

const axios = require('axios');

// Prometheus configuration
const PROMETHUES_CONFIG = {
  baseURL: process.env.PROMETHEUS_URL || 'http://localhost:9090',
  timeout: parseInt(process.env.PROMETHEUS_TIMEOUT) || 30000
};

// Create axios instance for Prometheus
const prometheusClient = axios.create({
  baseURL: PROMETHUES_CONFIG.baseURL,
  timeout: PROMETHUES_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json'
  }
});

class PrometheusService {
  
  /**
   * Query Prometheus with a PromQL expression
   * @param {string} query - PromQL query
   * @param {string} time - Optional specific time
   * @returns {Promise<Object>} Prometheus response
   */
  async query(query, time = null) {
    try {
      const params = { query };
      if (time) {
        params.time = time;
      }
      
      const response = await prometheusClient.get('/api/v1/query', { params });
      return response.data;
    } catch (error) {
      console.error('Prometheus query error:', error.message);
      throw new Error(`Failed to query Prometheus: ${error.message}`);
    }
  }
  
  /**
   * Query Prometheus with a time range
   * @param {string} query - PromQL query
   * @param {string} start - Start time
   * @param {string} end - End time
   * @param {string} step - Step interval
   * @returns {Promise<Object>} Prometheus response
   */
  async queryRange(query, start, end, step = '1m') {
    try {
      const params = {
        query,
        start,
        end,
        step
      };
      
      const response = await prometheusClient.get('/api/v1/query_range', { params });
      return response.data;
    } catch (error) {
      console.error('Prometheus query_range error:', error.message);
      throw new Error(`Failed to query Prometheus range: ${error.message}`);
    }
  }
  
  /**
   * Get current bandwidth (in bps) for a router
   * @param {string} routerIP - Router IP address
   * @returns {Promise<Object>} Bandwidth data
   */
  async getCurrentBandwidth(routerIP) {
    // Download: sum by instance of rate(ifHCInOctets{instance="<IP>"}[5m]) * 8
    // Upload: sum by instance of rate(ifHCOutOctets{instance="<IP>"}[5m]) * 8
    
    const downloadQuery = `sum by (instance) (rate(ifHCInOctets{instance="${routerIP}"}[5m])) * 8`;
    const uploadQuery = `sum by (instance) (rate(ifHCOutOctets{instance="${routerIP}"}[5m])) * 8`;
    
    const [downloadResult, uploadResult] = await Promise.all([
      this.query(downloadQuery),
      this.query(uploadQuery)
    ]);
    
    // Transform to interface-level data
    const interfaces = {};
    
    // Process download metrics
    if (downloadResult.data && downloadResult.data.result) {
      downloadResult.data.result.forEach(metric => {
        const interfaceName = metric.metric.ifName || metric.metric.ifDescr;
        if (!interfaces[interfaceName]) {
          interfaces[interfaceName] = { download: 0, upload: 0 };
        }
        interfaces[interfaceName].download = parseFloat(metric.value[1]) || 0;
      });
    }
    
    // Process upload metrics
    if (uploadResult.data && uploadResult.data.result) {
      uploadResult.data.result.forEach(metric => {
        const interfaceName = metric.metric.ifName || metric.metric.ifDescr;
        if (!interfaces[interfaceName]) {
          interfaces[interfaceName] = { download: 0, upload: 0 };
        }
        interfaces[interfaceName].upload = parseFloat(metric.value[1]) || 0;
      });
    }
    
    // Calculate totals
    let totalDownload = 0;
    let totalUpload = 0;
    
    Object.values(interfaces).forEach(iface => {
      totalDownload += iface.download;
      totalUpload += iface.upload;
    });
    
    return {
      timestamp: new Date().toISOString(),
      routerIP,
      interfaces,
      total: {
        download: totalDownload,
        upload: totalUpload,
        downloadMbps: (totalDownload / 1000000).toFixed(2),
        uploadMbps: (totalUpload / 1000000).toFixed(2)
      }
    };
  }
  
  /**
   * Get bandwidth history for a router over time
   * @param {string} routerIP - Router IP address
   * @param {number} durationMinutes - Duration in minutes
   * @param {string} step - Step interval
   * @returns {Promise<Array>} Bandwidth history data
   */
  async getBandwidthHistory(routerIP, durationMinutes = 60, step = '1m') {
    const end = new Date().toISOString();
    const start = new Date(Date.now() - durationMinutes * 60 * 1000).toISOString();
    
    // Use sum by (instance) to aggregate all interfaces - gives total bandwidth
    const downloadQuery = `sum by (instance) (rate(ifHCInOctets{instance="${routerIP}"}[5m])) * 8`;
    const uploadQuery = `sum by (instance) (rate(ifHCOutOctets{instance="${routerIP}"}[5m])) * 8`;
    
    const [downloadResult, uploadResult] = await Promise.all([
      this.queryRange(downloadQuery, start, end, step),
      this.queryRange(uploadQuery, start, end, step)
    ]);
    
    // Process and combine results
    const timeSeries = {};
    
    // Process download
    if (downloadResult.data && downloadResult.data.result) {
      downloadResult.data.result.forEach(metric => {
        const interfaceName = metric.metric.ifName || 'total';
        if (!timeSeries[interfaceName]) {
          timeSeries[interfaceName] = { download: [], upload: [] };
        }
        metric.values.forEach(([timestamp, value]) => {
          timeSeries[interfaceName].download.push({
            timestamp: new Date(timestamp * 1000).toISOString(),
            value: parseFloat(value) || 0
          });
        });
      });
    }
    
    // Process upload
    if (uploadResult.data && uploadResult.data.result) {
      uploadResult.data.result.forEach(metric => {
        const interfaceName = metric.metric.ifName || 'total';
        if (!timeSeries[interfaceName]) {
          timeSeries[interfaceName] = { download: [], upload: [] };
        }
        metric.values.forEach(([timestamp, value]) => {
          timeSeries[interfaceName].upload.push({
            timestamp: new Date(timestamp * 1000).toISOString(),
            value: parseFloat(value) || 0
          });
        });
      });
    }
    
    return {
      routerIP,
      start,
      end,
      duration: durationMinutes,
      interfaces: timeSeries
    };
  }
  
  /**
   * Get bandwidth for all routers
   * @returns {Promise<Array>} All routers bandwidth data
   */
  async getAllRoutersBandwidth() {
    // Query all routers at once using sum to aggregate interfaces
    const downloadQuery = 'sum by (instance) (rate(ifHCInOctets[5m])) * 8';
    const uploadQuery = 'sum by (instance) (rate(ifHCOutOctets[5m])) * 8';
    
    const [downloadResult, uploadResult] = await Promise.all([
      this.query(downloadQuery),
      this.query(uploadQuery)
    ]);
    
    // Group by router IP
    const routers = {};
    
    // Process download
    if (downloadResult.data && downloadResult.data.result) {
      downloadResult.data.result.forEach(metric => {
        const instance = metric.metric.instance;
        const interfaceName = metric.metric.ifName || metric.metric.ifDescr;
        
        if (!routers[instance]) {
          routers[instance] = {
            routerIP: instance,
            interfaces: {},
            totalDownload: 0,
            totalUpload: 0
          };
        }
        
        routers[instance].interfaces[interfaceName] = {
          ...routers[instance].interfaces[interfaceName],
          download: parseFloat(metric.value[1]) || 0
        };
        routers[instance].totalDownload += parseFloat(metric.value[1]) || 0;
      });
    }
    
    // Process upload
    if (uploadResult.data && uploadResult.data.result) {
      uploadResult.data.result.forEach(metric => {
        const instance = metric.metric.instance;
        const interfaceName = metric.metric.ifName || metric.metric.ifDescr;
        
        if (!routers[instance]) {
          routers[instance] = {
            routerIP: instance,
            interfaces: {},
            totalDownload: 0,
            totalUpload: 0
          };
        }
        
        routers[instance].interfaces[interfaceName] = {
          ...routers[instance].interfaces[interfaceName],
          upload: parseFloat(metric.value[1]) || 0
        };
        routers[instance].totalUpload += parseFloat(metric.value[1]) || 0;
      });
    }
    
    // Format results
    return Object.values(routers).map(router => ({
      ...router,
      totalDownloadMbps: (router.totalDownload / 1000000).toFixed(2),
      totalUploadMbps: (router.totalUpload / 1000000).toFixed(2),
      timestamp: new Date().toISOString()
    }));
  }
  
  /**
   * Check if a router is online by querying a metric
   * @param {string} routerIP - Router IP address
   * @returns {Promise<boolean>} Router online status
   */
  async checkRouterOnline(routerIP) {
    try {
      // Query any metric from the router with a short timeout
      const query = `up{instance="${routerIP}"}`;
      const result = await this.query(query);
      
      if (result.data && result.data.result && result.data.result.length > 0) {
        const value = parseFloat(result.data.result[0].value[1]);
        return value === 1;
      }
      
      // If no up metric, check if we can get any interface data
      const ifQuery = `ifHCInOctets{instance="${routerIP}"}[1m]`;
      const ifResult = await this.query(ifQuery);
      return ifResult.data && ifResult.data.result && ifResult.data.result.length > 0;
      
    } catch (error) {
      console.error(`Router online check failed for ${routerIP}:`, error.message);
      return false;
    }
  }
  
  /**
   * Get interface-specific bandwidth
   * @param {string} routerIP - Router IP address
   * @param {string} interfaceName - Interface name (e.g., 'ether1')
   * @returns {Promise<Object>} Interface bandwidth data
   */
  async getInterfaceBandwidth(routerIP, interfaceName) {
    const downloadQuery = `rate(ifHCInOctets{instance="${routerIP}",ifName="${interfaceName}"}[5m]) * 8`;
    const uploadQuery = `rate(ifHCOutOctets{instance="${routerIP}",ifName="${interfaceName}"}[5m]) * 8`;
    
    const [downloadResult, uploadResult] = await Promise.all([
      this.query(downloadQuery),
      this.query(uploadQuery)
    ]);
    
    const download = downloadResult.data?.result?.[0] 
      ? parseFloat(downloadResult.data.result[0].value[1]) 
      : 0;
      
    const upload = uploadResult.data?.result?.[0] 
      ? parseFloat(uploadResult.data.result[0].value[1]) 
      : 0;
    
    return {
      routerIP,
      interface: interfaceName,
      download,
      upload,
      downloadMbps: (download / 1000000).toFixed(2),
      uploadMbps: (upload / 1000000).toFixed(2),
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Get average bandwidth over a time period
   * @param {string} routerIP - Router IP address
   * @param {number} durationMinutes - Duration in minutes
   * @returns {Promise<Object>} Average bandwidth
   */
  async getAverageBandwidth(routerIP, durationMinutes = 60) {
    const history = await this.getBandwidthHistory(routerIP, durationMinutes, '5m');
    
    // Calculate averages from the time series
    const totals = { download: 0, upload: 0, count: 0 };
    
    Object.values(history.interfaces).forEach(iface => {
      iface.download.forEach(point => totals.download += point.value);
      iface.upload.forEach(point => totals.upload += point.value);
      totals.count = Math.max(totals.count, iface.download.length, iface.upload.length);
    });
    
    const avgDownload = totals.count > 0 ? totals.download / totals.count : 0;
    const avgUpload = totals.count > 0 ? totals.upload / totals.count : 0;
    
    return {
      routerIP,
      duration: durationMinutes,
      average: {
        download: avgDownload,
        upload: avgUpload,
        downloadMbps: (avgDownload / 1000000).toFixed(2),
        uploadMbps: (avgUpload / 1000000).toFixed(2)
      },
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Get top bandwidth consumers
   * @param {string} type - 'download' or 'upload'
   * @param {number} limit - Number of results
   * @returns {Promise<Array>} Top bandwidth consumers
   */
  async getTopBandwidth(type = 'download', limit = 10) {
    const metric = type === 'download' ? 'ifHCInOctets' : 'ifHCOutOctets';
    const query = `topk(${limit}, rate(${metric}[5m]) * 8)`;
    
    const result = await this.query(query);
    
    if (!result.data || !result.data.result) {
      return [];
    }
    
    return result.data.result.map(metric => ({
      routerIP: metric.metric.instance,
      interface: metric.metric.ifName || 'unknown',
      value: parseFloat(metric.value[1]) || 0,
      valueMbps: ((parseFloat(metric.value[1]) || 0) / 1000000).toFixed(2),
      timestamp: new Date().toISOString()
    }));
  }
}

module.exports = new PrometheusService();
