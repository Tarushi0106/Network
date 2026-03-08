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

// Format time
function formatTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
}

// Format relative time
function formatRelativeTime(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

// Alert Item Component
function AlertItem({ alert, onClose }) {
  const severity = alert.severity || 'info';
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
              {alert.name}
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
              {alert.location || alert.instance || 'Unknown Location'}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '10px',
                fontWeight: '600',
                color: color,
                textTransform: 'uppercase',
              }}>
                {alert.severity}
              </span>
              <span style={{
                fontSize: '10px',
                color: '#94a3b8',
                textTransform: 'capitalize',
              }}>
                {alert.status}
              </span>
              <span style={{
                fontSize: '10px',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                gap: '3px'
              }}>
                <Clock size={10} />
                {formatRelativeTime(alert.startedAt)}
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
  const [showModal, setShowModal] = useState(false);
  const [allAlerts, setAllAlerts] = useState([]);
  
  const API_URL = 'http://localhost:5000';
  
  const fetchAlerts = async () => {
    try {
      // Fetch from Grafana endpoint
      const response = await fetch(`${API_URL}/api/alerts/grafana?limit=5`);
      
      // Check if response is OK
      if (!response.ok) {
        if (response.status === 503) {
          setError('Grafana alerts service unavailable');
        } else {
          setError('Unable to fetch alerts from Grafana');
        }
        setAlerts([]);
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      
      // Check for alerts array in response
      if (data.alerts && Array.isArray(data.alerts)) {
        setAlerts(data.alerts);
        setError(null);
      } else if (data.error) {
        setError(data.error);
        setAlerts([]);
      }
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
      setError('Unable to fetch alerts from Grafana');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchAllAlerts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/alerts/grafana?limit=20`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setAllAlerts(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch all alerts:', err);
    }
  };
  
  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);
  
  const handleViewAll = () => {
    fetchAllAlerts();
    setShowModal(true);
  };
  
  // Count alerts by severity
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;
  const infoCount = alerts.filter(a => a.severity === 'info').length;
  
  return (
    <>
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
              Latest alerts from Grafana
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
        {(criticalCount > 0 || warningCount > 0 || infoCount > 0) && (
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
            {infoCount > 0 && (
              <span style={{
                fontSize: '10px',
                fontWeight: '600',
                padding: '3px 8px',
                borderRadius: '10px',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
              }}>
                {infoCount} Info
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
              Please check Grafana connection and try again
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
        
        {/* View All button */}
        {!error && alerts.length > 0 && (
          <button
            onClick={handleViewAll}
            style={{
              width: '100%',
              marginTop: '12px',
              padding: '10px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              color: '#64748b',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            View All Alerts →
          </button>
        )}
      </div>
      
      {/* Modal for viewing all alerts */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
        onClick={() => setShowModal(false)}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              width: '90%',
              maxWidth: '600px',
              maxHeight: '80vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <h2 style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#1e293b',
                  margin: 0,
                }}>
                  All Alerts
                </h2>
                <p style={{
                  fontSize: '12px',
                  color: '#64748b',
                  margin: '4px 0 0 0',
                }}>
                  {allAlerts.length} alerts from Grafana
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '8px',
                  cursor: 'pointer',
                }}
              >
                <X size={18} color="#64748b" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div style={{
              padding: '20px',
              overflowY: 'auto',
              flex: 1,
            }}>
              {allAlerts.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px', 
                  color: '#64748b' 
                }}>
                  <Info size={32} color="#94a3b8" style={{ marginBottom: '8px' }} />
                  <p style={{ fontSize: '14px', fontWeight: '500', margin: 0 }}>
                    No alerts available
                  </p>
                </div>
              ) : (
                allAlerts.map((alert, index) => (
                  <AlertItem key={alert.fingerprint || index} alert={alert} />
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default RecentAlertsPanel;
