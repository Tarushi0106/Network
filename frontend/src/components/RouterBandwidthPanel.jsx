const API_URL = "https://weed-promotions-satisfy-oaks.trycloudflare.com";
import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Router locations mapping
const LOCATIONS = [
  { name: 'Ganpati Peth Sangli', ip: '103.219.0.157' },
  { name: 'Gadhinglaj', ip: '163.223.65.200' },
  { name: 'Market Yard Sangli', ip: '103.219.0.158' },
  { name: 'Miraj', ip: '103.219.1.142' },
  { name: 'Kothrud Pune', ip: '103.200.105.88' }
];

const RouterBandwidthPanel = () => {
  // State management
  const [selectedLocation, setSelectedLocation] = useState(LOCATIONS[1]); // Default: Gadhinglaj
  const [routerStatus, setRouterStatus] = useState('checking');
  const [bandwidthData, setBandwidthData] = useState([]);
  const [currentValues, setCurrentValues] = useState({ download: 0, upload: 0 });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');

  const d = "";

  // Fetch bandwidth data
  const fetchData = async () => {
    setLoading(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    try {
      // Fetch current bandwidth
      const currentRes = await fetch(`${API_URL}/api/bandwidth/current`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (!currentRes.ok) throw new Error(`HTTP ${currentRes.status}`);
      const currentData = await currentRes.json();

      // Fetch history
      const historyRes = await fetch(`${API_URL}/api/bandwidth/history?duration=${timeRange}`, {
        signal: controller.signal
      });
      if (!historyRes.ok) throw new Error(`HTTP ${historyRes.status}`);
      const historyData = await historyRes.json();

      if (currentData.success && historyData.success) {
        // Get current values for selected location
        const locationData = currentData.data?.find(l => l.ip === selectedLocation.ip);
        if (locationData) {
          setCurrentValues({
            download: parseFloat(locationData.downloadMbps) || 0,
            upload: parseFloat(locationData.uploadMbps) || 0,
            status: locationData.status
          });
          setRouterStatus(locationData.status);
        }

        // Get history for selected location
        const locHistory = historyData.data?.find(l => l.ip === selectedLocation.ip);
        if (locHistory?.history && Array.isArray(locHistory.history)) {
          const formattedData = locHistory.history.map(h => ({
            time: h.time || '',
            download: ((h.download || 0) / 1000000),
            upload: ((h.upload || 0) / 1000000)
          })).filter(h => h.time); // Filter out empty entries
          setBandwidthData(formattedData);
        } else {
          setBandwidthData([]);
        }
      }
    } catch (err) {
      // Don't log error for aborted requests (timeout)
      if (err.name !== 'AbortError') {
        console.error('Failed to fetch data:', err);
      }
      setBandwidthData([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle location change
  const handleLocationChange = (e) => {
    const location = LOCATIONS.find(loc => loc.ip === e.target.value);
    if (location) {
      setSelectedLocation(location);
      setLoading(true);
    }
  };

  // Handle time range change
  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
    setLoading(true);
  };

  // Fetch on location or time range change
  useEffect(() => {
    fetchData();
  }, [selectedLocation, timeRange]);

  // Handle refresh
  const handleRefresh = () => {
    setLoading(true);
    fetchData();
  };

  // Format time label based on time range
  const formatTimeLabel = (timeStr) => {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    if (isNaN(date.getTime())) return timeStr;
    
    // For short ranges (minutes), show time only
    if (timeRange === '5m' || timeRange === '15m' || timeRange === '30m') {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    // For hours, show date + time
    if (timeRange === '1h' || timeRange === '3h' || timeRange === '6h' || timeRange === '12h') {
      return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    // For days, show date only
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Time range options - Grafana style
  const timeRanges = [
    { label: 'Last 5 minutes', value: '5m', category: 'quick' },
    { label: 'Last 15 minutes', value: '15m', category: 'quick' },
    { label: 'Last 30 minutes', value: '30m', category: 'quick' },
    { label: 'Last 1 hour', value: '1h', category: 'quick' },
    { label: 'Last 3 hours', value: '3h', category: 'quick' },
    { label: 'Last 6 hours', value: '6h', category: 'quick' },
    { label: 'Last 12 hours', value: '12h', category: 'quick' },
    { label: 'Last 24 hours', value: '24h', category: 'quick' },
    { label: 'Last 2 days', value: '2d', category: 'quick' },
    { label: 'Last 7 days', value: '7d', category: 'quick' },
    { label: 'Today', value: 'today', category: 'relative' },
    { label: 'This week', value: 'week', category: 'relative' },
    { label: 'This month', value: 'month', category: 'relative' },
    { label: 'This year', value: 'year', category: 'relative' },
  ];

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#f9fafb',
        padding: '12px 16px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>📊</span>
          <h3 style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: 600,
            color: '#111827'
          }}>
            Router Bandwidth Monitoring
          </h3>
        </div>

        {/* Location Dropdown - BLACK FONT */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{
            fontSize: '13px',
            fontWeight: 500,
            color: '#111827'  // Black
          }}>
            Location:
          </label>
          <select
            value={selectedLocation.ip}
            onChange={handleLocationChange}
            style={{
              backgroundColor: '#ffffff',
              color: '#111827',  // Black
              padding: '6px 32px 6px 12px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              fontSize: '13px',
              fontWeight: 600,  // Bold
              cursor: 'pointer',
              minWidth: '180px',
              appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23111217'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
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

      {/* Router Info Bar */}
      <div style={{
        backgroundColor: '#f9fafb',
        padding: '8px 16px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        {/* Router IP */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: '#111827', fontWeight: 500 }}>Router IP:</span>
          <code style={{
            backgroundColor: '#f3f4f6',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '13px',
            fontFamily: 'monospace',
            color: '#2563eb',
            fontWeight: 600
          }}>
            {selectedLocation.ip}
          </code>
        </div>

        {/* Current Values */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '12px', color: '#111827' }}>↓</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#16a34a' }}>
              {currentValues.download.toFixed(2)} Mbps
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '12px', color: '#111827' }}>↑</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#2563eb' }}>
              {currentValues.upload.toFixed(2)} Mbps
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: routerStatus === 'online' ? '#22c55e' : '#ef4444'
            }}></span>
            <span style={{
              fontSize: '13px',
              fontWeight: 600,
              color: routerStatus === 'online' ? '#16a34a' : '#dc2626',
              textTransform: 'capitalize'
            }}>
              {routerStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Time Range Selector - Grafana Style Dropdown */}
      <div style={{
        padding: '8px 16px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 500 }}>Time range:</span>
          <select
            value={timeRange}
            onChange={(e) => handleTimeRangeChange(e.target.value)}
            style={{
              backgroundColor: '#ffffff',
              color: '#111827',
              padding: '6px 32px 6px 12px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              minWidth: '160px',
              appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23111217'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 8px center',
              backgroundSize: '16px'
            }}
          >
            <optgroup label="Quick ranges">
              {timeRanges.filter(r => r.category === 'quick').map(range => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="Relative">
              {timeRanges.filter(r => r.category === 'relative').map(range => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
        <button
          onClick={handleRefresh}
          style={{
            backgroundColor: '#f3f4f6',
            color: '#4b5563',
            border: '1px solid #e5e7eb',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          ↻ Refresh
        </button>
      </div>

      {/* Chart Container */}
      <div style={{ padding: '16px', height: '350px' }}>
        {loading ? (
          <div style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                border: '3px solid #3b82f6',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              <span style={{ fontSize: '13px', color: '#6b7280' }}>Loading data...</span>
            </div>
          </div>
        ) : !bandwidthData || bandwidthData.length === 0 ? (
          <div style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <span style={{ fontSize: '13px', color: '#9ca3af' }}>No historical data available for this router</span>
            <button
              onClick={handleRefresh}
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Refresh
            </button>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={bandwidthData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="downloadGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="uploadGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="time" 
                stroke="#6b7280" 
                tick={{ fontSize: 11 }}
                tickFormatter={formatTimeLabel}
                interval={Math.floor(bandwidthData.length / 8)}
                minTickGap={50}
              />
              <YAxis 
                stroke="#6b7280" 
                tick={{ fontSize: 11 }}
                label={{ 
                  value: 'Mbps', 
                  angle: -90, 
                  position: 'insideLeft', 
                  fill: '#6b7280',
                  fontSize: 12
                }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                labelStyle={{ color: '#111827', fontWeight: 600 }}
              />
              <Area
                type="monotone"
                dataKey="download"
                stroke="#22c55e"
                strokeWidth={2}
                fill="url(#downloadGradient)"
                name="Download (Mbps)"
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="upload"
                stroke="#2563eb"
                strokeWidth={2}
                fill="url(#uploadGradient)"
                name="Upload (Mbps)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer */}
      <div style={{
        backgroundColor: '#f9fafb',
        padding: '8px 16px',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ fontSize: '12px', color: '#9ca3af' }}>
          📈 Data from Prometheus (rate over 5m interval)
        </div>
        <button
          onClick={handleRefresh}
          style={{
            backgroundColor: '#2563eb',
            color: '#ffffff',
            border: 'none',
            padding: '6px 14px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default RouterBandwidthPanel;
