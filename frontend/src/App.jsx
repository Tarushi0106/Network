import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Wifi, 
  WifiOff, 
  Activity,
  Server,
  Clock,
  Network,
  Gauge
} from 'lucide-react';

// Import components
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import MetricCard from './components/MetricCard';
import RouterBandwidthPanel from './components/RouterBandwidthPanel';
import GeoMapPanel from './components/GeoMapPanel';
import DeviceStatusChart from './components/DeviceStatusChart';
import NetworkHealthSummary from './components/NetworkHealthSummary';
import TopBandwidthPanel from './components/TopBandwidthPanel';
import NetworkHealthPanel from './components/NetworkHealthPanel';
import AlertsPanel from './components/AlertsPanel';
import RecentAlertsPanel from './components/RecentAlertsPanel';
import WelcomeBanner from './components/WelcomeBanner';
import Login from './components/Login';
import Signup from './components/Signup';

// Import hooks for real-time data
import { useDevices, useNetworkHealth, useAlerts, useLocations, useTopBandwidth } from './hooks/useNetworkData';

// Styles
const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    backgroundColor: '#f1f5f9',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  scrollable: {
    flex: 1,
    overflow: 'auto',
    padding: '24px',
  },
  section: {
    marginBottom: '24px',
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px',
    marginBottom: '24px',
  },
  mapRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '20px',
    marginBottom: '24px',
  },
  bottomRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    marginBottom: '24px',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px',
  },
};

// Main App Component
function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [activeDashboardPage, setActiveDashboardPage] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString());

  // Use real-time data hooks
  const { devices, loading: devicesLoading, refetch: refetchDevices } = useDevices();
  const { healthData, loading: healthLoading, refetch: refetchHealth } = useNetworkHealth();
  const { topBandwidthData, loading: bandwidthLoading, refetch: refetchBandwidth } = useTopBandwidth();
  const { alerts, loading: alertsLoading, refetch: refetchAlerts } = useAlerts(10);
  const { locations, loading: locationsLoading } = useLocations();

  const handleRefresh = () => {
    const now = new Date().toLocaleTimeString();
    setLastUpdated(now);
    refetchDevices();
    refetchHealth();
    refetchBandwidth();
    refetchAlerts();
  };

  const handleLogin = () => {
    setCurrentPage('dashboard');
  };

  const handleSignup = () => {
    setCurrentPage('dashboard');
  };

  const handleSwitchToSignup = () => {
    setCurrentPage('signup');
  };

  const handleSwitchToLogin = () => {
    setCurrentPage('login');
  };

  const getPageTitle = () => {
    switch (activeDashboardPage) {
      case 'dashboard': return 'Network Operations Center';
      case 'devices': return 'Devices';
      case 'geomap': return 'Geo Map';
      case 'bandwidth': return 'Bandwidth';
      case 'alerts': return 'Alerts';
      case 'logs': return 'Logs';
      case 'settings': return 'Settings';
      default: return 'Network Operations Center';
    }
  };

  // Calculate totals from real data
  const totalRouters = devices?.total || 0;
  const onlineRouters = devices?.online || 0;
  const offlineRouters = devices?.offline || 0;
  const avgHealthScore = healthData?.averageScore || 0;

  // Get health categories
  const healthCategories = healthData?.categories || [];

  // Show Login page
  if (currentPage === 'login') {
    return (
      <Login 
        onSwitchToSignup={handleSwitchToSignup}
        onLogin={handleLogin}
      />
    );
  }

  // Show Signup page
  if (currentPage === 'signup') {
    return (
      <Signup 
        onSwitchToLogin={handleSwitchToLogin}
        onSignup={handleSignup}
      />
    );
  }

  // Show Dashboard
  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <Sidebar 
        activePage={activeDashboardPage}
        onPageChange={setActiveDashboardPage}
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Navbar */}
        <Navbar 
          title={getPageTitle()}
          onRefresh={handleRefresh}
          lastUpdated={lastUpdated}
        />

        {/* Dashboard Content */}
        <main style={styles.scrollable}>
          {/* Welcome Banner */}
          <div style={styles.section}>
            <WelcomeBanner />
          </div>

          {/* Metrics Summary Cards */}
          <div style={styles.cardGrid}>
            <MetricCard 
              title="Total Locations"
              value={totalRouters}
              unit="Active"
              trend="up"
              trendValue={locationsLoading ? 'Loading...' : `${locations.length} locations`}
              icon={MapPin}
              iconBg="#dc2626"
            />
            <MetricCard 
              title="Online Routers"
              value={onlineRouters}
              unit="Online"
              trend="up"
              trendValue={devicesLoading ? 'Loading...' : `${Math.round((onlineRouters / totalRouters) * 100) || 0}% of total`}
              icon={Wifi}
              iconBg="#16a34a"
            />
            <MetricCard 
              title="Offline Routers"
              value={offlineRouters}
              unit="Offline"
              trend={offlineRouters > 0 ? 'down' : 'up'}
              trendValue={offlineRouters > 0 ? 'Needs attention' : 'All systems operational'}
              icon={WifiOff}
              iconBg="#dc2626"
            />
            <MetricCard 
              title="Avg Health Score"
              value={avgHealthScore}
              unit="%"
              trend={avgHealthScore >= 80 ? 'up' : 'down'}
              trendValue={healthLoading ? 'Loading...' : `Health: ${avgHealthScore}%`}
              icon={Activity}
              iconBg="#2563eb"
            />
          </div>

          {/* Geo Map Panel - Location Wise */}
          <div style={styles.section}>
            <GeoMapPanel />
          </div>

          {/* Router Bandwidth Panel - Full Width */}
          <div style={styles.section}>
            <RouterBandwidthPanel />
          </div>

          {/* Second Row - Network Health and Alerts */}
          <div style={styles.bottomRow}>
            {/* Network Health */}
            <div>
              <NetworkHealthPanel />
            </div>

            {/* Alerts Panel - New Grafana Alerts */}
            <div>
              <RecentAlertsPanel />
            </div>
          </div>

          {/* Third Row - Additional Stats */}
          <div style={styles.statsRow}>
            <StatCard 
              icon={Server}
              iconBg="#dc2626"
              title="Total Interfaces"
              value={totalRouters * 4}
            />
            <StatCard 
              icon={Network}
              iconBg="#2563eb"
              title="Active VLANs"
              value={12}
            />
            <StatCard 
              icon={Gauge}
              iconBg="#16a34a"
              title="Avg Uptime"
              value="99.8%"
            />
            <StatCard 
              icon={Clock}
              iconBg="#9333ea"
              title="Avg Latency"
              value="12ms"
            />
          </div>
        </main>
      </div>
    </div>
  );
}

// Enhanced StatCard component
function StatCard({ icon: Icon, iconBg, title, value }) {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'pointer',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)';
    }}
    >
      <div style={{
        padding: '12px',
        borderRadius: '12px',
        backgroundColor: iconBg + '15',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Icon size={20} color={iconBg} />
      </div>
      <div>
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '2px' }}>{title}</p>
        <p style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', margin: 0 }}>{value}</p>
      </div>
    </div>
  );
}

export default App;
