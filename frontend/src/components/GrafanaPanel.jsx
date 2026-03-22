import { useState, useEffect, useCallback } from 'react';

// Router locations mapping
const LOCATIONS = [
  { name: 'Ganpati Peth Sangli', ip: '103.219.0.157' },
  { name: 'Gadhinglaj', ip: '163.223.65.200' },
  { name: 'Market Yard Sangli', ip: '103.219.0.158' },
  { name: 'Miraj', ip: '103.219.1.142' },
  { name: 'Kothrud Pune', ip: '103.200.105.88' }
];

// Grafana configuration
const GRAFANA_CONFIG = {
  baseUrl: 'https://weed-promotions-satisfy-oaks.trycloudflare.com:3000',
  dashboardUid: 'adhj2dk',
  panelId: '2', // Adjust based on your panel
  theme: 'dark'
};

const GrafanaPanel = () => {
  // State management
  const [selectedLocation, setSelectedLocation] = useState(LOCATIONS[1]); // Default: Gadhinglaj
  const [routerStatus, setRouterStatus] = useState('online');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [iframeKey, setIframeKey] = useState(0); // Force iframe refresh

  // Generate Grafana embed URL with all parameters
  const generateGrafanaUrl = useCallback((location) => {
    const { baseUrl, dashboardUid, panelId, theme } = GRAFANA_CONFIG;
    
    // Build embed URL: /d-solo/{uid}/dashboard-name
    const url = new URL(`${baseUrl}/d-solo/${dashboardUid}/router-traffic-monitoring`);
    url.searchParams.set('orgId', '1');
    url.searchParams.set('panelId', panelId);
    url.searchParams.set('var-router', location.ip);
    url.searchParams.set('theme', theme);
    url.searchParams.set('timeout', '60');
    url.searchParams.set('refresh', '5s'); // Auto-refresh
    
    return url.toString();
  }, []);

  // Fetch router status from backend
  const fetchRouterStatus = async () => {
    try {
      const response = await fetch('https://weed-promotions-satisfy-oaks.trycloudflare.com/api/bandwidth/current');
      const data = await response.json();
      
      if (data.success) {
        const routerData = data.data.find(r => r.ip === selectedLocation.ip);
        if (routerData) {
          setRouterStatus(routerData.status);
        }
      }
    } catch (err) {
      console.error('Failed to fetch router status:', err);
    }
  };

  // Handle location change
  const handleLocationChange = (e) => {
    const location = LOCATIONS.find(loc => loc.ip === e.target.value);
    if (location) {
      setSelectedLocation(location);
      setLoading(true);
      setIframeKey(prev => prev + 1); // Force iframe reload
      fetchRouterStatus();
    }
  };

  // Handle iframe load
  const handleIframeLoad = () => {
    setLoading(false);
    setError(null);
  };

  // Handle iframe error
  const handleIframeError = () => {
    setLoading(false);
    setError('Failed to load Grafana panel. Please check Grafana configuration.');
  };

  // Manual refresh
  const handleRefresh = () => {
    setLoading(true);
    setIframeKey(prev => prev + 1);
  };

  // Open in full Grafana
  const openInGrafana = () => {
    const { baseUrl, dashboardUid } = GRAFANA_CONFIG;
    const url = new URL(`${baseUrl}/d/${dashboardUid}/router-traffic-monitoring`);
    url.searchParams.set('var-router', selectedLocation.ip);
    window.open(url.toString(), '_blank');
  };

  // Initial fetch
  useEffect(() => {
    fetchRouterStatus();
  }, [selectedLocation]);

  const iframeUrl = generateGrafanaUrl(selectedLocation);

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Title */}
          <div className="flex items-center gap-3">
            <span className="text-xl">📊</span>
            <h3 className="text-lg font-semibold text-white">
              Router Bandwidth Monitoring
            </h3>
          </div>

          {/* Location Dropdown */}
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-400 font-medium">Location:</label>
            <select
              value={selectedLocation.ip}
              onChange={handleLocationChange}
              className="bg-gray-700 text-white px-3 py-1.5 pr-8 rounded border border-gray-600 text-sm font-medium focus:outline-none focus:border-blue-500 cursor-pointer min-w-[200px]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 8px center',
                backgroundSize: '16px'
              }}
            >
              {LOCATIONS.map(loc => (
                <option key={loc.ip} value={loc.ip}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Router Info Bar */}
      <div className="bg-gray-800/50 px-4 py-2 border-b border-gray-700">
        <div className="flex items-center justify-between">
          {/* Router IP */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">Router IP:</span>
            <code className="bg-gray-700 px-2 py-0.5 rounded text-sm text-blue-400 font-mono">
              {selectedLocation.ip}
            </code>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${
              routerStatus === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`}></span>
            <span className={`text-sm font-medium capitalize ${
              routerStatus === 'online' ? 'text-green-400' : 'text-red-400'
            }`}>
              {routerStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Grafana Iframe Container */}
      <div className="relative bg-gray-950" style={{ height: '450px' }}>
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-gray-900/90 flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-400 text-sm">Loading Grafana panel...</span>
            </div>
          </div>
        )}

        {/* Error Overlay */}
        {error && (
          <div className="absolute inset-0 bg-gray-900/90 flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-3 text-center px-4">
              <span className="text-red-400 text-lg">⚠️</span>
              <span className="text-gray-300 text-sm">{error}</span>
              <div className="mt-2 p-3 bg-gray-800 rounded text-xs text-gray-400 max-w-md">
                <p className="font-medium text-white mb-1">To fix X-Frame-Options error:</p>
                <p>Add to Grafana config (grafana.ini):</p>
                <code className="block mt-1 bg-gray-900 px-2 py-1 rounded">[security]
allow_embedding = true</code>
              </div>
            </div>
          </div>
        )}

        {/* Grafana Iframe */}
        <iframe
          key={iframeKey}
          src={iframeUrl}
          width="100%"
          height="100%"
          frameBorder="0"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          title={`Grafana - ${selectedLocation.name}`}
          className="w-full h-full"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
        />
      </div>

      {/* Footer Actions */}
      <div className="bg-gray-800 px-4 py-2 border-t border-gray-700">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            📈 Grafana native graph with time picker, zoom & pan
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded transition flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <button
              onClick={openInGrafana}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open in Grafana
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrafanaPanel;
