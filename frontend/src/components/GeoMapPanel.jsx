import React, { useState, useEffect } from 'react';
import { MapPin, Wifi, WifiOff, Activity, RefreshCw, Gauge } from 'lucide-react';

// Location coordinates
const LOCATIONS = [
  { name: 'Ganpati Peth Sangli', ip: '103.219.0.157', lat: 16.862013, lng: 74.560903 },
  { name: 'Gadhinglaj', ip: '163.223.65.200', lat: 16.22582, lng: 74.35093 },
  { name: 'Market Yard Sangli', ip: '103.219.0.158', lat: 16.850162, lng: 74.584864 },
  { name: 'Miraj', ip: '103.219.1.142', lat: 16.828588, lng: 74.646139 },
  { name: 'Kothrud Pune', ip: '103.200.105.88', lat: 18.507197, lng: 73.792366 }
];

// Add IDs to locations for React keys
const locationsWithIds = LOCATIONS.map((loc, idx) => ({ ...loc, id: idx + 1 }));

// Get activity level based on TOTAL Mbps
function getActivityLevel(totalMbps) {
  if (totalMbps <= 2) return { label: 'Low Usage', color: '#16a34a', bg: '#f0fdf4', level: 'low' };
  if (totalMbps <= 10) return { label: 'Normal Usage', color: '#2563eb', bg: '#eff6ff', level: 'normal' };
  if (totalMbps <= 20) return { label: 'High Usage', color: '#f97316', bg: '#fff7ed', level: 'high' };
  return { label: 'Heavy Usage', color: '#dc2626', bg: '#fef2f2', level: 'heavy' };
}

// Get SLA utilization color based on percentage
function getSlaColor(percentage) {
  if (percentage === null) return '#94a3b8'; // Offline - gray
  if (percentage <= 40) return '#16a34a';      // Green - Healthy
  if (percentage <= 70) return '#eab308';      // Yellow - Moderate Load
  if (percentage <= 90) return '#f97316';       // Orange - High Load
  return '#dc2626';                            // Red - Near Capacity
}

// Get SLA status label
function getSlaLabel(percentage) {
  if (percentage === null) return 'N/A';
  if (percentage <= 40) return 'Healthy';
  if (percentage <= 70) return 'Moderate';
  if (percentage <= 90) return 'High';
  return 'Critical';
}

// SLA Progress Bar Component
function SlaProgressBar({ utilization, provisionedSla }) {
  const percentage = utilization !== null ? parseFloat(utilization) : 0;
  const color = getSlaColor(percentage);
  const label = getSlaLabel(percentage);
  
  return (
    <div>
      <div style={{ 
        height: '12px', 
        backgroundColor: '#e2e8f0', 
        borderRadius: '6px',
        overflow: 'hidden',
        marginBottom: '6px'
      }}>
        <div style={{
          width: `${Math.min(percentage, 100)}%`,
          height: '100%',
          backgroundColor: color,
          borderRadius: '6px',
          transition: 'width 0.5s ease, background-color 0.5s ease'
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', fontWeight: '700', color: color }}>
          {label}
        </span>
        <span style={{ fontSize: '12px', color: '#64748b' }}>
          {utilization !== null ? `${utilization}%` : 'N/A'}
        </span>
      </div>
    </div>
  );
}

const GeoMapPanel = ({ timeRange = '1h' }) => {
  const [locationsData, setLocationsData] = useState(locationsWithIds);
  const [selectedLocation, setSelectedLocation] = useState(locationsWithIds[0]);
  const [loading, setLoading] = useState(true);
  
  const API_URL = '';
  
  // Fetch real data from API
  const fetchData = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    try {
      const bandwidthRes = await fetch(`${API_URL}/api/bandwidth/current`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (!bandwidthRes.ok) {
        throw new Error(`HTTP error! status: ${bandwidthRes.status}`);
      }
      
      const bandwidthData = await bandwidthRes.json();
      
      if (bandwidthData.success && bandwidthData.data) {
        const updatedLocations = locationsWithIds.map(loc => {
          const bwDevice = bandwidthData.data.find(d => d.ip === loc.ip);
          
          if (bwDevice) {
            const downloadMbps = parseFloat(bwDevice.downloadMbps) || 0;
            const uploadMbps = parseFloat(bwDevice.uploadMbps) || 0;
            const total = downloadMbps + uploadMbps;
            const isOnline = total > 0;
            const activityLevel = isOnline ? getActivityLevel(total) : null;
            const slaUtilization = bwDevice.slaUtilization !== null ? parseFloat(bwDevice.slaUtilization) : null;
            const provisionedSla = bwDevice.provisionedSla;
            
            return {
              ...loc,
              download: downloadMbps,
              upload: uploadMbps,
              total,
              isOnline,
              activityLevel,
              provisionedSla,
              slaUtilization,
              status: isOnline ? 'online' : 'offline'
            };
          }
          
          return {
            ...loc,
            download: 0,
            upload: 0,
            total: 0,
            isOnline: false,
            activityLevel: null,
            provisionedSla: 100,
            slaUtilization: null,
            status: 'offline'
          };
        });
        
        setLocationsData(updatedLocations);
        
        // Update selected location if it exists in new data
        const updatedSelected = updatedLocations.find(l => l.ip === selectedLocation?.ip);
        if (updatedSelected) {
          setSelectedLocation(updatedSelected);
        }
      }
    } catch (err) {
      // Don't log error for aborted requests (timeout)
      if (err.name !== 'AbortError') {
        console.error('Failed to fetch map data:', err);
      }
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);
  
  const getStatusColor = (status) => {
    return status === 'online' ? '#16a34a' : '#dc2626';
  };
  
  // Simple map simulation using CSS positioning (India centered)
  const mapWidth = 100;
  const mapHeight = 100;
  
  // Convert lat/lng to map coordinates (India approximate bounds)
  const getMapPosition = (lat, lng) => {
    const minLat = 6, maxLat = 37;
    const minLng = 68, maxLng = 98;
    
    const x = ((lng - minLng) / (maxLng - minLng)) * mapWidth;
    const y = ((maxLat - lat) / (maxLat - minLat)) * mapHeight;
    
    return { x, y };
  };
  
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #f1f5f9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fafafa',
      }}>
        <div>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '700',
            color: '#1e293b',
            margin: 0,
          }}>
            Network Locations Map
          </h3>
          <p style={{
            fontSize: '12px',
            color: '#94a3b8',
            margin: '4px 0 0 0',
          }}>
            Click on a location to view details
          </p>
        </div>
        <button 
          onClick={fetchData}
          style={{
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <RefreshCw size={16} color="#64748b" />
        </button>
      </div>
      
      {/* Loading State */}
      {loading && (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
          Loading map data...
        </div>
      )}
      
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', minHeight: '400px' }}>
          {/* Map Area */}
          <div style={{
            position: 'relative',
            backgroundColor: '#f0fdf4',
            padding: '20px',
          }}>
            {/* India Map Background (simplified) */}
            <div style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              borderRadius: '12px',
              overflow: 'hidden',
            }}>
              {/* Map grid lines */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: `
                  linear-gradient(rgba(34, 197, 94, 0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px',
              }} />
              
              {/* Location Markers */}
              {locationsData.map((location) => {
                const pos = getMapPosition(location.lat, location.lng);
                const isOnline = location.isOnline;
                
                return (
                  <div
                    key={location.id}
                    style={{
                      position: 'absolute',
                      left: `${pos.x}%`,
                      top: `${pos.y}%`,
                      transform: 'translate(-50%, -50%)',
                      cursor: 'pointer',
                      zIndex: 10,
                    }}
                    onClick={() => setSelectedLocation(location)}
                  >
                    {/* Marker */}
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: getStatusColor(location.status),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 4px 12px ${isOnline ? 'rgba(22, 163, 74, 0.4)' : 'rgba(220, 38, 38, 0.4)'}`,
                      border: '3px solid white',
                      transition: 'transform 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                    >
                      {isOnline ? (
                        <Wifi size={18} color="white" />
                      ) : (
                        <WifiOff size={18} color="white" />
                      )}
                    </div>
                    
                    {/* Tooltip */}
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      marginTop: '8px',
                      whiteSpace: 'nowrap',
                      backgroundColor: '#1e293b',
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '500',
                      opacity: selectedLocation?.id === location.id ? 1 : 0,
                      visibility: selectedLocation?.id === location.id ? 'visible' : 'hidden',
                      transition: 'all 0.2s',
                      pointerEvents: 'none',
                    }}>
                      {location.name} - {isOnline ? `${location.total.toFixed(1)} Mbps` : 'Offline'}
                    </div>
                  </div>
                );
              })}
              
              {/* Legend */}
              <div style={{
                position: 'absolute',
                bottom: '12px',
                left: '12px',
                backgroundColor: 'white',
                padding: '10px 14px',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#16a34a' }} />
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Online</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#dc2626' }} />
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Offline</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Location Details Panel */}
          <div style={{
            borderLeft: '1px solid #f1f5f9',
            padding: '16px',
            backgroundColor: '#fafafa',
            overflowY: 'auto',
            maxHeight: '400px',
          }}>
            <h4 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#1e293b',
              margin: '0 0 16px 0',
            }}>
              Location Details
            </h4>
            
            {selectedLocation && (
              <div>
                {/* Selected Location Card with SLA */}
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  border: `2px solid ${getStatusColor(selectedLocation.status)}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: getStatusColor(selectedLocation.status),
                    }} />
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '700',
                      color: '#1e293b',
                    }}>
                      {selectedLocation.name}
                    </span>
                  </div>
                  
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px 0' }}>
                    IP: {selectedLocation.ip}
                  </p>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 12px 0' }}>
                    Status: <span style={{ 
                      color: getStatusColor(selectedLocation.status),
                      fontWeight: '600'
                    }}>
                      {selectedLocation.isOnline ? 'Online' : 'Router Offline'}
                    </span>
                  </p>
                  
                  {/* Bandwidth Stats - Simple Language */}
                  {selectedLocation.isOnline ? (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                        <div style={{
                          backgroundColor: '#fef2f2',
                          borderRadius: '8px',
                          padding: '10px',
                          textAlign: 'center',
                        }}>
                          <Activity size={14} color="#dc2626" style={{ marginBottom: '4px' }} />
                          <p style={{ fontSize: '16px', fontWeight: '700', color: '#dc2626', margin: 0 }}>
                            {selectedLocation.download.toFixed(1)}
                          </p>
                          <p style={{ fontSize: '10px', color: '#94a3b8', margin: 0 }}>Coming In</p>
                        </div>
                        <div style={{
                          backgroundColor: '#eff6ff',
                          borderRadius: '8px',
                          padding: '10px',
                          textAlign: 'center',
                        }}>
                          <Activity size={14} color="#2563eb" style={{ marginBottom: '4px' }} />
                          <p style={{ fontSize: '16px', fontWeight: '700', color: '#2563eb', margin: 0 }}>
                            {selectedLocation.upload.toFixed(1)}
                          </p>
                          <p style={{ fontSize: '10px', color: '#94a3b8', margin: 0 }}>Going Out</p>
                        </div>
                      </div>
                      
                      {/* SLA Section */}
                      <div style={{
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        padding: '12px',
                        border: '1px solid #e2e8f0',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                          <Gauge size={14} color="#64748b" />
                          <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>
                            SLA Information
                          </span>
                        </div>
                        <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 4px 0' }}>
                          Provisioned Internet Capacity: <strong>{selectedLocation.isOnline ? `${selectedLocation.provisionedSla} Mbps` : '—'}</strong>
                        </p>
                        <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 8px 0' }}>
                          Current Usage: <strong>{selectedLocation.total.toFixed(1)} Mbps</strong>
                        </p>
                        <SlaProgressBar 
                          utilization={selectedLocation.slaUtilization} 
                          provisionedSla={selectedLocation.provisionedSla} 
                        />
                      </div>
                    </>
                  ) : (
                    <div style={{
                      backgroundColor: '#fef2f2',
                      borderRadius: '8px',
                      padding: '16px',
                      textAlign: 'center',
                    }}>
                      <WifiOff size={24} color="#dc2626" style={{ marginBottom: '8px' }} />
                      <p style={{ fontSize: '13px', fontWeight: '600', color: '#dc2626', margin: 0 }}>
                        Router Offline
                      </p>
                      <p style={{ fontSize: '11px', color: '#94a3b8', margin: '4px 0 0 0' }}>
                        No internet activity detected
                      </p>
                      
                      {/* SLA shows N/A when offline */}
                      <div style={{
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        padding: '12px',
                        marginTop: '12px',
                        border: '1px solid #e2e8f0',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                          <Gauge size={14} color="#64748b" />
                          <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>
                            SLA Information
                          </span>
                        </div>
                        <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 8px 0' }}>
                          Provisioned Internet Capacity: <strong>{selectedLocation.isOnline ? `${selectedLocation.provisionedSla} Mbps` : '—'}</strong>
                        </p>
                        <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                          SLA Utilization: <strong>N/A</strong>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* All Locations List */}
            <h4 style={{
              fontSize: '13px',
              fontWeight: '600',
              color: '#1e293b',
              margin: '16px 0 12px 0',
            }}>
              All Locations
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {locationsData.map((location) => {
                const isOnline = location.isOnline;
                const slaPercentage = location.slaUtilization;
                
                return (
                  <div
                    key={location.id}
                    onClick={() => setSelectedLocation(location)}
                    style={{
                      backgroundColor: selectedLocation?.id === location.id ? '#fef2f2' : 'white',
                      borderRadius: '10px',
                      padding: '12px',
                      cursor: 'pointer',
                      border: selectedLocation?.id === location.id ? '1px solid #fecaca' : '1px solid #e2e8f0',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin size={14} color={getStatusColor(location.status)} />
                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#1e293b' }}>
                          {location.name}
                        </span>
                      </div>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: getStatusColor(location.status),
                      }} />
                    </div>
                    <p style={{ fontSize: '11px', color: '#94a3b8', margin: '6px 0 0 22px' }}>
                      {isOnline ? (
                        <span style={{ color: '#16a34a' }}>
                          {location.total.toFixed(1)} Mbps | SLA: {slaPercentage !== null ? `${slaPercentage}%` : 'N/A'}
                        </span>
                      ) : (
                        <span style={{ color: '#dc2626' }}>Router Offline</span>
                      )}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeoMapPanel;
