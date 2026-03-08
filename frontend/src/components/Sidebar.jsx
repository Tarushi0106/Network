import React from 'react';
import { 
  LayoutDashboard, 
  Monitor, 
  Map, 
  Radio, 
  Bell, 
  FileText, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Activity
} from 'lucide-react';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'devices', label: 'Devices', icon: Monitor },
  { id: 'geomap', label: 'Geo Map', icon: Map },
  { id: 'bandwidth', label: 'Bandwidth', icon: Radio },
  { id: 'alerts', label: 'Alerts', icon: Bell },
  { id: 'logs', label: 'Logs', icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const Sidebar = ({ activePage, onPageChange, isCollapsed, onToggle }) => {
  return (
    <div style={{
      backgroundColor: 'white',
      boxShadow: '2px 0 8px rgba(0,0,0,0.08)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.3s ease',
      width: isCollapsed ? '72px' : '260px',
      zIndex: 50,
    }}>
      {/* Logo Section */}
      <div style={{
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'space-between',
        padding: isCollapsed ? '0 16px' : '0 20px',
        borderBottom: '1px solid #f1f5f9',
      }}>
        {!isCollapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
            }}>
              <Activity size={20} color="white" />
            </div>
            <div>
              <span style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>NOC</span>
              <span style={{ fontSize: '16px', fontWeight: '500', color: '#dc2626', marginLeft: '2px' }}>Monitor</span>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div style={{
            width: '36px',
            height: '36px',
            background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
          }}>
            <Activity size={20} color="white" />
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <li key={item.id} style={{ marginBottom: '4px' }}>
                <button
                  onClick={() => onPageChange(item.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: isCollapsed ? '12px' : '12px 16px',
                    borderRadius: '10px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    backgroundColor: isActive ? '#fef2f2' : 'transparent',
                    color: isActive ? '#dc2626' : '#64748b',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                      e.currentTarget.style.color = '#1e293b';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#64748b';
                    }
                  }}
                  title={isCollapsed ? item.label : ''}
                >
                  <Icon size={20} style={{ flexShrink: 0 }} />
                  {!isCollapsed && (
                    <span style={{ fontSize: '14px', fontWeight: isActive ? '600' : '500' }}>{item.label}</span>
                  )}
                  {isActive && !isCollapsed && (
                    <div style={{
                      marginLeft: 'auto',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#dc2626',
                    }} />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse Toggle */}
      <div style={{ padding: '12px', borderTop: '1px solid #f1f5f9' }}>
        <button
          onClick={onToggle}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'center',
            gap: '8px',
            padding: '10px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: '#f8fafc',
            color: '#64748b',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f1f5f9';
            e.currentTarget.style.color = '#1e293b';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#f8fafc';
            e.currentTarget.style.color = '#64748b';
          }}
        >
          {isCollapsed ? (
            <ChevronRight size={18} />
          ) : (
            <>
              <ChevronLeft size={18} />
              <span style={{ fontSize: '13px', fontWeight: '500' }}>Collapse</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
