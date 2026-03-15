import React, { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, Info, RefreshCw } from 'lucide-react';

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

// Format timestamp
function formatTimestamp(timestamp) {
  if (!timestamp) return 'Unknown';
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
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
  return locations[ip] || ip || 'Unknown';
}

// Alert Item Component
function AlertItem({ alert }) {
  const severity = alert.severity || alert.labels?.severity || 'warning';
  const color = getSeverityColor(severity);
  const bgColor = getSeverityBg(severity);
  
  const SeverityIcon = severity === 'critical' ? AlertTriangle : 
                       severity === 'warning' ? AlertCircle : Info;
  
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '10px',
      padding: '12px',
      marginBottom: '8px',
      border: `1px solid ${color}30`,
      borderLeft: `3px solid ${color}`,
    }}>
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
            margin: '0 0 6px 0'
          }}>
            Instance: {alert.device || alert.labels?.instance || 'Unknown'}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '10px',
              fontWeight: '600',
              color: color,
              textTransform: 'uppercase',
            }}>
              {alert.state || 'firing'}
            </span>
            <span style={{
              fontSize: '10px',
              color: '#94a3b8',
            }}>
              {formatTimestamp(alert.activeAt)}
            </span>
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
  
  const API_URL = 'http://51.20.52.19:5000';
  
  const fetchAlerts = async () => {
    try {
      console.log('Fetching alerts from:', `${API_URL}/api/alerts`);
      
      const response = await fetch(`${API_URL}/api/alerts`);
      const data = await response.json();
      
      console.log('Alerts response:', data);
      
      // Parse alerts from response.data.data (as per backend format)
      const alertsArray = data?.data || [];
      console.log('Alerts array:', alertsArray);
      
      if (Array.isArray(alertsArray)) {
        setAlerts(alertsArray);
      }
      
      setError(null);
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
  
  // Count by severity
  const criticalCount = alerts.filter(a => (a.severity || a.labels?.severity) === 'critical').length;
  const warningCount = alerts.filter(a => (a.severity || a.labels?.severity) === 'warning').length;
  
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
            From Prometheus
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
          }}
          title="Refresh"
        >
          <RefreshCw size={14} color="#64748b" />
        </button>
      </div>
      
      {/* Summary badges */}
      {(criticalCount > 0 || warningCount > 0) && (
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '12px',
          flexWrap: 'wrap'
        }}>
          {criticalCount > 0 && (
            <span style={{
              fontSize: '10px',
              fontWeight: '600',
              padding: '3px 8px',
              borderRadius: '10px',
              backgroundColor: '#fef2f2',
              color: '#dc2626',
            }}>
              {criticalCount} Critical
            </span>
          )}
          {warningCount > 0 && (
            <span style={{
              fontSize: '10px',
              fontWeight: '600',
              padding: '3px 8px',
              borderRadius: '10px',
              backgroundColor: '#fff7ed',
              color: '#f97316',
            }}>
              {warningCount} Warning
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
          {alerts.map((alert, index) => (
            <AlertItem key={alert.fingerprint || index} alert={alert} />
          ))}
        </div>
      )}
    </div>
  );
}

export default RecentAlertsPanel;
