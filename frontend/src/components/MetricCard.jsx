import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const MetricCard = ({ title = '', value = '0', unit = '', trend = 'up', trendValue = '', icon: Icon = null, iconBg = '#6366f1' }) => {
  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp size={14} />;
    if (trend === 'down') return <TrendingDown size={14} />;
    return <Minus size={14} />;
  };

  const getTrendColor = () => {
    if (trend === 'up') return '#16a34a';
    if (trend === 'down') return '#dc2626';
    return '#64748b';
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
      transition: 'all 0.25s ease',
      cursor: 'pointer',
      position: 'relative',
      overflow: 'hidden',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.08), 0 4px 10px rgba(0,0,0,0.04)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)';
    }}
    >
      {/* Decorative gradient line */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: `linear-gradient(90deg, ${iconBg} 0%, ${iconBg}40 100%)`,
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <p style={{
            fontSize: '13px',
            fontWeight: '500',
            color: '#64748b',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            {title}
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{
              fontSize: '36px',
              fontWeight: '700',
              color: '#1e293b',
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}>
              {value}
            </span>
            <span style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#94a3b8',
            }}>
              {unit}
            </span>
          </div>
          {trendValue && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: '12px',
              color: getTrendColor(),
            }}>
              {getTrendIcon()}
              <span style={{ fontSize: '13px', fontWeight: '500' }}>{trendValue}</span>
            </div>
          )}
        </div>
        <div style={{
          width: '52px',
          height: '52px',
          borderRadius: '14px',
          background: `linear-gradient(135deg, ${iconBg} 0%, ${iconBg}dd 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 8px 20px ${iconBg}30`,
        }}>
          <Icon size={24} color="white" />
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
