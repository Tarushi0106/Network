import React from 'react';
import { Bell, RefreshCw, User, Search, Calendar, Filter } from 'lucide-react';

const Navbar = ({ title, onRefresh, lastUpdated }) => {
  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
  
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div style={{
      height: '64px',
      backgroundColor: 'white',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      borderBottom: '1px solid #f1f5f9',
    }}>
      {/* Page Title */}
      <div>
        <h1 style={{ 
          fontSize: '20px', 
          fontWeight: '700', 
          color: '#1e293b', 
          margin: 0,
          letterSpacing: '-0.02em',
        }}>
          {title}
        </h1>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          marginTop: '2px',
        }}>
          <Calendar size={12} color="#94a3b8" />
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>{currentDate}</span>
          <span style={{ color: '#cbd5e1' }}>•</span>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>Last updated: {lastUpdated}</span>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ flex: 1, maxWidth: '400px', margin: '0 32px' }}>
        <div style={{ position: 'relative' }}>
          <Search 
            size={16} 
            style={{ 
              position: 'absolute', 
              left: '14px', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: '#94a3b8' 
            }} 
          />
          <input
            type="text"
            placeholder="Search devices, locations, alerts..."
            style={{
              width: '100%',
              padding: '10px 14px 10px 40px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              fontSize: '13px',
              color: '#1e293b',
              outline: 'none',
              transition: 'all 0.2s ease',
            }}
            onFocus={(e) => {
              e.target.style.backgroundColor = 'white';
              e.target.style.borderColor = '#dc2626';
              e.target.style.boxShadow = '0 0 0 3px rgba(220, 38, 38, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.backgroundColor = '#f8fafc';
              e.target.style.borderColor = '#e2e8f0';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>
      </div>

      {/* Right Section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Time Range Filter */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '6px 12px',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
        }}>
          <Filter size={14} color="#64748b" />
          <select defaultValue="24" style={{
            border: 'none',
            backgroundColor: 'transparent',
            fontSize: '13px',
            color: '#64748b',
            cursor: 'pointer',
            outline: 'none',
          }}>
            <option>Last 1 hour</option>
            <option>Last 6 hours</option>
            <option value="24">Last 24 hours</option>
            <option>Last 7 days</option>
            <option>Last 30 days</option>
          </select>
        </div>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(220, 38, 38, 0.25)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#b91c1c';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#dc2626';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>

        {/* Divider */}
        <div style={{ width: '1px', height: '32px', backgroundColor: '#e2e8f0' }} />

        {/* Notifications */}
        <button style={{
          position: 'relative',
          padding: '10px',
          backgroundColor: 'transparent',
          border: 'none',
          borderRadius: '10px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#fef2f2';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
        >
          <Bell size={20} color="#64748b" />
          <span style={{
            position: 'absolute',
            top: '6px',
            right: '6px',
            width: '8px',
            height: '8px',
            backgroundColor: '#dc2626',
            borderRadius: '50%',
            border: '2px solid white',
          }} />
        </button>

        {/* User Avatar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          paddingLeft: '16px',
          borderLeft: '1px solid #e2e8f0',
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(220, 38, 38, 0.25)',
          }}>
            <User size={18} color="white" />
          </div>
          <div>
            <p style={{ 
              fontSize: '14px', 
              fontWeight: '600', 
              color: '#1e293b',
              margin: 0,
            }}>
              Admin
            </p>
            <p style={{ 
              fontSize: '12px', 
              color: '#94a3b8',
              margin: 0,
            }}>
              Network Admin
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
