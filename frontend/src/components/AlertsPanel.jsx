import React from 'react';
import { AlertTriangle, XCircle, Wifi, Info, Clock, MapPin } from 'lucide-react';

const AlertsPanel = ({ alerts = [] }) => {
  const getAlertIcon = (severity) => {
    switch (severity) {
      case 'critical': return <XCircle size={18} />;
      case 'warning': return <AlertTriangle size={18} />;
      case 'offline': return <Wifi size={18} />;
      default: return <Info size={18} />;
    }
  };

  const getAlertStyles = (severity) => {
    switch (severity) {
      case 'critical': return { 
        bg: '#fef2f2', 
        border: '#fecaca',
        iconColor: '#dc2626',
        badgeBg: '#fee2e2',
        badgeText: '#b91c1c',
      };
      case 'warning': return { 
        bg: '#fffbeb', 
        border: '#fde68a',
        iconColor: '#d97706',
        badgeBg: '#fef3c7',
        badgeText: '#b45309',
      };
      case 'offline': return { 
        bg: '#f8fafc', 
        border: '#e2e8f0',
        iconColor: '#64748b',
        badgeBg: '#f1f5f9',
        badgeText: '#475569',
      };
      default: return { 
        bg: '#eff6ff', 
        border: '#bfdbfe',
        iconColor: '#2563eb',
        badgeBg: '#dbeafe',
        badgeText: '#1d4ed8',
      };
    }
  };

  const getSeverityLabel = (severity) => {
    switch (severity) {
      case 'critical': return 'Critical';
      case 'warning': return 'Warning';
      case 'offline': return 'Offline';
      default: return 'Info';
    }
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
      height: '100%',
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '20px',
      }}>
        <div>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '700',
            color: '#1e293b',
            margin: 0,
            letterSpacing: '-0.02em',
          }}>
            Recent Alerts
          </h3>
          <p style={{
            fontSize: '13px',
            color: '#94a3b8',
            margin: '4px 0 0 0',
          }}>
            Network notifications
          </p>
        </div>
        <button style={{
          fontSize: '13px',
          color: '#dc2626',
          fontWeight: '600',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '6px 12px',
          borderRadius: '6px',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#fef2f2';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
        >
          View All
        </button>
      </div>

      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '12px',
        maxHeight: '360px',
        overflowY: 'auto',
      }}>
        {alerts.map((alert, index) => {
          const styles = getAlertStyles(alert.severity);
          return (
            <div 
              key={index}
              style={{
                padding: '14px',
                borderRadius: '12px',
                backgroundColor: styles.bg,
                border: `1px solid ${styles.border}`,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              <div style={{
                color: styles.iconColor,
                marginTop: '2px',
                flexShrink: 0,
              }}>
                {getAlertIcon(alert.severity)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  justifyContent: 'space-between',
                  gap: '8px',
                  marginBottom: '6px',
                }}>
                  <p style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#1e293b',
                    margin: 0,
                    lineHeight: 1.4,
                  }}>
                    {alert.message}
                  </p>
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                    backgroundColor: styles.badgeBg,
                    color: styles.badgeText,
                    flexShrink: 0,
                  }}>
                    {getSeverityLabel(alert.severity)}
                  </span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  color: '#94a3b8',
                }}>
                  <Clock size={12} />
                  <span style={{ fontSize: '12px' }}>{alert.time}</span>
                  <span style={{ color: '#cbd5e1' }}>•</span>
                  <MapPin size={12} />
                  <span style={{ fontSize: '12px' }}>{alert.location}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AlertsPanel;
