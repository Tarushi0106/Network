import React from 'react';
import { ArrowUp, ArrowDown, Wifi, WifiOff, Activity } from 'lucide-react';

// Helper function to get traffic color based on bandwidth
function getTrafficColor(download, upload) {
  const total = download + upload;
  if (total >= 100) return '#dc2626'; // Red - high
  if (total >= 50) return '#f59e0b';  // Yellow - moderate
  return '#16a34a'; // Green - low
}

// Helper function to get traffic level label
function getTrafficLevel(download, upload) {
  const total = download + upload;
  if (total >= 100) return 'High';
  if (total >= 50) return 'Moderate';
  return 'Low';
}

// Helper to get status color
function getStatusColor(status) {
  return status === 'online' ? '#16a34a' : '#dc2626';
}

// Summary Card Component
function SummaryCard({ icon: Icon, iconBg, title, value, unit }) {
  return (
    <div style={{
      backgroundColor: '#f8fafc',
      borderRadius: '8px',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      flex: 1,
      minWidth: '140px',
    }}>
      <div style={{
        padding: '8px',
        borderRadius: '8px',
        backgroundColor: iconBg + '20',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Icon size={18} color={iconBg} />
      </div>
      <div>
        <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>{title}</p>
        <p style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: 0 }}>
          {value} <span style={{ fontSize: '12px', fontWeight: '500', color: '#64748b' }}>{unit}</span>
        </p>
      </div>
    </div>
  );
}

// Traffic Bar Component
function TrafficBar({ download, upload, maxValue = 150 }) {
  const downloadPercent = Math.min((download / maxValue) * 100, 100);
  const uploadPercent = Math.min((upload / maxValue) * 100, 100);
  const downloadColor = getTrafficColor(download, upload);
  const uploadColor = getTrafficColor(upload, download);
  
  return (
    <div style={{ width: '80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
        <ArrowDown size={10} color="#16a34a" />
        <div style={{
          flex: 1,
          height: '6px',
          backgroundColor: '#e2e8f0',
          borderRadius: '3px',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${downloadPercent}%`,
            height: '100%',
            backgroundColor: '#16a34a',
            borderRadius: '3px',
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <ArrowUp size={10} color="#2563eb" />
        <div style={{
          flex: 1,
          height: '6px',
          backgroundColor: '#e2e8f0',
          borderRadius: '3px',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${uploadPercent}%`,
            height: '100%',
            backgroundColor: '#2563eb',
            borderRadius: '3px',
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>
    </div>
  );
}

// Main TopBandwidthPanel Component
function TopBandwidthPanel({ topBandwidthData, loading }) {
  const { topBandwidth, summary } = topBandwidthData || {};
  
  if (loading) {
    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '20px' }}>
          Top Network Bandwidth Usage
        </h3>
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          Loading bandwidth data...
        </div>
      </div>
    );
  }
  
  if (!topBandwidth || topBandwidth.length === 0) {
    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '20px' }}>
          Top Network Bandwidth Usage
        </h3>
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          No traffic data available
        </div>
      </div>
    );
  }
  
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
    }}>
      {/* Title */}
      <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '20px' }}>
        Top Network Bandwidth Usage
      </h3>
      
      {/* Summary Row */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        <SummaryCard 
          icon={ArrowDown}
          iconBg="#16a34a"
          title="Total Download"
          value={summary?.totalDownload || 0}
          unit="Mbps"
        />
        <SummaryCard 
          icon={ArrowUp}
          iconBg="#2563eb"
          title="Total Upload"
          value={summary?.totalUpload || 0}
          unit="Mbps"
        />
        <SummaryCard 
          icon={Wifi}
          iconBg="#9333ea"
          title="Active Devices"
          value={`${summary?.activeDevices || 0}/${summary?.totalDevices || 0}`}
          unit=""
        />
      </div>
      
      {/* Table Header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr 1fr 100px',
        gap: '16px',
        padding: '12px 16px',
        backgroundColor: '#f8fafc',
        borderRadius: '8px 8px 0 0',
        fontSize: '12px',
        fontWeight: '600',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}>
        <div>Device / Location</div>
        <div>Download</div>
        <div>Upload</div>
        <div>Status</div>
        <div>Traffic</div>
      </div>
      
      {/* Table Body */}
      <div style={{
        border: '1px solid #e2e8f0',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        overflow: 'hidden',
      }}>
        {topBandwidth.map((router, index) => {
          const trafficColor = getTrafficColor(router.download, router.upload);
          const trafficLevel = getTrafficLevel(router.download, router.upload);
          
          return (
            <div key={router.ip || index} style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr 100px',
              gap: '16px',
              padding: '14px 16px',
              alignItems: 'center',
              borderBottom: index < topBandwidth.length - 1 ? '1px solid #e2e8f0' : 'none',
              backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafbfc',
              transition: 'background-color 0.2s',
            }}>
              {/* Device Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: '#dc262615',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Activity size={16} color="#dc2626" />
                </div>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', margin: 0 }}>
                    {router.name}
                  </p>
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                    {router.ip}
                  </p>
                </div>
              </div>
              
              {/* Download */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ArrowDown size={14} color="#16a34a" />
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#16a34a' }}>
                  {router.download.toFixed(2)}
                </span>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Mbps</span>
              </div>
              
              {/* Upload */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ArrowUp size={14} color="#2563eb" />
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#2563eb' }}>
                  {router.upload.toFixed(2)}
                </span>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Mbps</span>
              </div>
              
              {/* Status */}
              <div>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600',
                  backgroundColor: router.status === 'online' ? '#16a34a15' : '#dc262615',
                  color: router.status === 'online' ? '#16a34a' : '#dc2626',
                }}>
                  {router.status === 'online' ? (
                    <>
                      <Wifi size={12} /> Online
                    </>
                  ) : (
                    <>
                      <WifiOff size={12} /> Offline
                    </>
                  )}
                </span>
              </div>
              
              {/* Traffic Bar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <TrafficBar download={router.download} upload={router.upload} />
                <span style={{
                  fontSize: '10px',
                  fontWeight: '600',
                  color: trafficColor,
                  textAlign: 'center'
                }}>
                  {trafficLevel}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TopBandwidthPanel;
