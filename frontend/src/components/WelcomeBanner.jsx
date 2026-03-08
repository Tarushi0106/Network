import React from 'react';
import { Sun, Activity, CheckCircle, Clock, Zap, Globe } from 'lucide-react';

const WelcomeBanner = () => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div style={{
      background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%)',
      borderRadius: '20px',
      padding: '32px',
      boxShadow: '0 20px 40px rgba(220, 38, 38, 0.3)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute',
        top: '-50px',
        right: '-50px',
        width: '200px',
        height: '200px',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.05)',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-30px',
        left: '30%',
        width: '150px',
        height: '150px',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.03)',
      }} />

      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(10px)',
          }}>
            <Sun size={32} color="white" />
          </div>
          <div>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: 'white',
              margin: 0,
              letterSpacing: '-0.02em',
            }}>
              {getGreeting()}, Admin
            </h2>
            <p style={{
              fontSize: '15px',
              color: 'rgba(255,255,255,0.8)',
              margin: '6px 0 0 0',
            }}>
              Network Monitoring System Active
            </p>
            <p style={{
              fontSize: '13px',
              color: 'rgba(255,255,255,0.6)',
              margin: '4px 0 0 0',
            }}>
              {currentDate}
            </p>
          </div>
        </div>

        {/* Status Indicators */}
        <div style={{ display: 'flex', gap: '16px' }}>
          <StatusBadge 
            icon={<CheckCircle size={16} />}
            label="All Systems"
            value="Operational"
            color="#22c55e"
          />
          <StatusBadge 
            icon={<Zap size={16} />}
            label="Response Time"
            value="12ms"
            color="#fbbf24"
          />
          <StatusBadge 
            icon={<Globe size={16} />}
            label="Uptime"
            value="99.9%"
            color="#22c55e"
          />
        </div>
      </div>
    </div>
  );
};

function StatusBadge({ icon, label, value, color }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '12px 18px',
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderRadius: '12px',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.1)',
    }}>
      <div style={{ color: color }}>
        {icon}
      </div>
      <div>
        <p style={{
          fontSize: '11px',
          color: 'rgba(255,255,255,0.7)',
          margin: 0,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          {label}
        </p>
        <p style={{
          fontSize: '15px',
          fontWeight: '700',
          color: 'white',
          margin: 0,
        }}>
          {value}
        </p>
      </div>
    </div>
  );
}

export default WelcomeBanner;
