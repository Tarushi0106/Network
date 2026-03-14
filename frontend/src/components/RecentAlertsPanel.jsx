import React, { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, Info, X, Clock, MapPin, RefreshCw } from 'lucide-react';

// Get severity color
function getSeverityColor(severity) {
  switch (severity?.toLowerCase()) {
    case 'critical':
      return '#dc2626';
    case 'warning':
      return '#f97316';
    case 'info':
    default:
      return '#2563eb';
  }
}

// Get severity background color
function getSeverityBg(severity) {
  switch (severity?.toLowerCase()) {
    case 'critical':
      return '#fef2f2';
    case 'warning':
      return '#fff7ed';
    case 'info':
    default:
      return '#eff6ff';
  }
}

// Format date
function formatDate(isoString) {
  if (!isoString) return 'Unknown';
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

// Map IP to location name
function mapIpToLocation(ip) {
  const locations = {
    '103.219.0.157': 'Ganpati Peth Sangli',
    '103.200.105.88': 'Gadhinglaj',
    '103.200.105.89': 'Market Yard Sangli',
    '103.219.1.142': 'Miraj',
    '103.200.105.90': 'Kothrud Pune'
  };
  return locations[ip] || ip || 'Unknown Location';
}

// Alert Item Component
function AlertItem({ alert }) {
  const severity = alert.severity || 'warning';
  const color = getSeverityColor(severity);
  const bgColor = getSeverityBg(severity);
  
  const SeverityIcon = severity === 'critical' ? AlertTriangle : 
                       severity === 'warning' ? AlertCircle : Info;
  
  const isFiring = alert.state === 'firing' || alert.state === 'alerting';
  
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '10px',
      padding: '12px',
      marginBottom: '8px',
      border: `1px solid ${color}30`,
      borderLeft: `3px solid ${color}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: bgColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <SeverityIcon size={14} color={color} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ 
              fontSize: '13px', 
              fontWeight: '600', 
              color: '#1e293b', 
              margin: '0 0 4px 0' 
            }}>
              {alert.name || alert.labels?.alertname || 'Unknown Alert'}
            </p>
            <p style={{ 
              fontSize: '11px', 
              color: '#64748b', 
              margin: '0 0 6px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <MapPin size={10} />
              {mapIpToLocation(alert.labels?.instance || alert.labels?.host)}
            </p>
            {alert.description && (
              <p style={{ 
                fontSize: '10px', 
                color: '#94a3b8', 
                margin: '0 0 6px 0',
                lineHeight: 1.4
              }}>
                {alert.description.length > 80 
                  ? alert.description.substring(0, 80) + '...' 
                  : alert.description}
              </p>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '10px',
                fontWeight: '600',
                color: color,
                textTransform: 'uppercase',
              }}>
                {isFiring ? 'Firing' : alert.state}
              </span>
              <span style={{
                fontSize: '10px',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                gap: '3px'
              }}>
                <Clock size={10} />
                {formatDate(alert.startsAt)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Recent Alerts Panel
function RecentAlertsPanel() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Use backend API as proxy to avoid CORS
  const API_URL = 'http://51.20.52.19:5000';
  
  const fetchAlerts = async () => {
    try {
      console.log('Fetching alerts from backend...');
      
      // Use backend proxy endpoint
      const response = await fetch(`${API_URL}/api/alerts/grafana?limit=10`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log('Alerts response:', data);
      
      // Handle both response formats
      const alertsArray = data.alerts || data.data || [];
      
      if (Array.isArray(alertsArray)) {
        // Map alerts to our format
        const mappedAlerts = alertsArray.map((alert, index) => ({
          name: alert.name || alert.labels?.alertname || 'Unknown',
          severity: alert.severity || alert.labels?.severity || 'warning',
          state: alert.status || alert.state || 'pending',
          labels: alert.labels || {},
          description: alert.description || alert.annotations?.description || '',
          startsAt: alert.time || alert.startedAt || alert.startsAt || new Date().toISOString(),
          fingerprint: alert.fingerprint || `alert-${index}`
        }));
        
        // Sort by start time (newest first)
        mappedAlerts.sort((a, b) => new Date(b.startsAt) - new Date(a.startsAt));
        
        setAlerts(mappedAlerts);
        setError(null);
      }
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
      setError('Unable to fetch alerts');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAlerts();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);
  
  // Count alerts by state
  const firingCount = alerts.filter(a => a.state === 'firing' || a.state === 'alerting').length;
  const pendingCount = alerts.filter(a => a.state === 'pending').length;
  
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      height: '100%',
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <div>
          <h3 style={{ 
            fontSize: '15px', 
            fontWeight: '600', 
            color: '#1e293b', 
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <AlertTriangle size={16} color="#f97316" />
            Recent Alerts
          </h3>
          <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0 0' }}>
            Live alerts from Grafana
          </p>
        </div>
        <button 
          onClick={fetchAlerts}
          style={{
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            padding: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
          title="Refresh"
        >
          <RefreshCw size={14} color="#64748b" />
        </button>
      </div>
      
      {/* Summary badges */}
      {(firingCount > 0 || pendingCount > 0) && (
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '12px',
          flexWrap: 'wrap'
        }}>
          {firingCount > 0 && (
            <span style={{
              fontSize: '10px',
              fontWeight: '600',
              padding: '3px 8px',
              borderRadius: '10px',
              backgroundColor: '#fef2f2',
              color: '#dc2626',
            }}>
              {firingCount} Firing
            </span>
          )}
          {pendingCount > 0 && (
            <span style={{
              fontSize: '10px',
              fontWeight: '600',
              padding: '3px 8px',
              borderRadius: '10px',
              backgroundColor: '#fff7ed',
              color: '#f97316',
            }}>
              {pendingCount} Pending
            </span>
          )}
        </div>
      )}
      
      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
          Loading alerts...
        </div>
      )}
      
      {/* Error state */}
      {error && (
        <div style={{ 
          textAlign: 'center', 
          padding: '30px 20px', 
          color: '#64748b',
          backgroundColor: '#fef2f2',
          borderRadius: '10px',
          border: '1px solid #fecaca'
        }}>
          <AlertTriangle size={24} color="#dc2626" style={{ marginBottom: '8px' }} />
          <p style={{ fontSize: '13px', fontWeight: '500', margin: 0, color: '#dc2626' }}>
            {error}
          </p>
          <p style={{ fontSize: '11px', margin: '4px 0 0 0', color: '#94a3b8' }}>
            Check backend connection
          </p>
        </div>
      )}
      
      {/* No alerts */}
      {!loading && !error && alerts.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '30px 20px', 
          color: '#64748b',
          backgroundColor: '#f8fafc',
          borderRadius: '10px',
        }}>
          <Info size={24} color="#94a3b8" style={{ marginBottom: '8px' }} />
          <p style={{ fontSize: '13px', fontWeight: '500', margin: 0 }}>
            No active alerts
          </p>
          <p style={{ fontSize: '11px', margin: '4px 0 0 0' }}>
            All systems running normally
          </p>
        </div>
      )}
      
      {/* Alert list */}
      {!loading && alerts.length > 0 && (
        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {alerts.slice(0, 10).map((alert, index) => (
            <AlertItem key={alert.fingerprint || index} alert={alert} />
          ))}
        </div>
      )}
    </div>
  );
}

export default RecentAlertsPanel;
