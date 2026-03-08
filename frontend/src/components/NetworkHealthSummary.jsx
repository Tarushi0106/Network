import React from 'react';
import { Activity, Shield, ShieldCheck, ShieldAlert, ShieldX, ShieldQuestion } from 'lucide-react';

const NetworkHealthSummary = ({ healthData = [] }) => {
  const getHealthColor = (category) => {
    switch (category) {
      case 'Excellent': return '#16a34a';
      case 'Good': return '#3b82f6';
      case 'Fair': return '#f59e0b';
      case 'Poor': return '#f97316';
      case 'Critical': return '#dc2626';
      default: return '#64748b';
    }
  };

  const getHealthIcon = (category) => {
    switch (category) {
      case 'Excellent': return <ShieldCheck size={14} />;
      case 'Good': return <Shield size={14} />;
      case 'Fair': return <ShieldAlert size={14} />;
      case 'Poor': return <ShieldAlert size={14} />;
      case 'Critical': return <ShieldX size={14} />;
      default: return <ShieldQuestion size={14} />;
    }
  };

  const totalDevices = healthData.reduce((sum, item) => sum + item.count, 0);
  const averageScore = healthData.length > 0 
    ? Math.round(healthData.reduce((sum, item) => sum + (item.score * item.count), 0) / totalDevices)
    : 0;

  const getScoreLabel = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Fair';
    if (score >= 40) return 'Poor';
    return 'Critical';
  };

  const getScoreBadgeColor = (score) => {
    if (score >= 90) return { bg: '#dcfce7', text: '#16a34a' };
    if (score >= 75) return { bg: '#dbeafe', text: '#3b82f6' };
    if (score >= 60) return { bg: '#fef9c3', text: '#d97706' };
    if (score >= 40) return { bg: '#ffedd5', text: '#ea580c' };
    return { bg: '#fee2e2', text: '#dc2626' };
  };

  const badgeColor = getScoreBadgeColor(averageScore);

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
            Network Health
          </h3>
          <p style={{
            fontSize: '13px',
            color: '#94a3b8',
            margin: '4px 0 0 0',
          }}>
            Device health overview
          </p>
        </div>
        <Activity size={20} color="#dc2626" />
      </div>

      {/* Summary Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '12px',
        marginBottom: '20px',
      }}>
        <div style={{
          backgroundColor: '#f8fafc',
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center',
        }}>
          <p style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#1e293b',
            margin: 0,
          }}>
            {totalDevices}
          </p>
          <p style={{
            fontSize: '12px',
            color: '#94a3b8',
            margin: '4px 0 0 0',
          }}>
            Total Devices
          </p>
        </div>
        <div style={{
          backgroundColor: '#f8fafc',
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center',
        }}>
          <p style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#dc2626',
            margin: 0,
          }}>
            {averageScore}%
          </p>
          <p style={{
            fontSize: '12px',
            color: '#94a3b8',
            margin: '4px 0 0 0',
          }}>
            Avg Health Score
          </p>
        </div>
      </div>

      {/* Health Categories */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {healthData.map((item) => (
          <div key={item.category} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              backgroundColor: getHealthColor(item.category) + '15',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: getHealthColor(item.category),
            }}>
              {getHealthIcon(item.category)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: '6px',
              }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{item.category}</span>
                <span style={{ fontSize: '13px', color: '#64748b' }}>{item.count} devices</span>
              </div>
              <div style={{ 
                width: '100%', 
                height: '6px', 
                backgroundColor: '#f1f5f9', 
                borderRadius: '3px',
                overflow: 'hidden',
              }}>
                <div 
                  style={{
                    height: '100%',
                    width: `${(item.count / totalDevices) * 100}%`,
                    backgroundColor: getHealthColor(item.category),
                    borderRadius: '3px',
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Score Indicator */}
      <div style={{ 
        marginTop: '20px',
        paddingTop: '16px',
        borderTop: '1px solid #f1f5f9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Overall Status</span>
        <span style={{
          padding: '6px 14px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '600',
          backgroundColor: badgeColor.bg,
          color: badgeColor.text,
        }}>
          {getScoreLabel(averageScore)}
        </span>
      </div>
    </div>
  );
};

export default NetworkHealthSummary;
