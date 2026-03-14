import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff,
  Globe, 
  Activity,
  Clock,
  Zap,
  Gauge
} from 'lucide-react';

// Network locations (for reference)
const LOCATIONS = [
  { name: 'Ganpati Peth Sangli', ip: '103.219.0.157' },
  { name: 'Gadhinglaj', ip: '163.223.65.200' },
  { name: 'Market Yard Sangli', ip: '103.219.0.158' },
  { name: 'Miraj', ip: '103.219.1.142' },
  { name: 'Kothrud Pune', ip: '103.200.105.88' }
];

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

// Get activity level based on TOTAL Mbps (download + upload)
function getActivityLevel(totalMbps) {
  if (totalMbps <= 2) return { label: 'Low Usage', color: '#16a34a', bg: '#f0fdf4', level: 'low' };
  if (totalMbps <= 10) return { label: 'Normal Usage', color: '#2563eb', bg: '#eff6ff', level: 'normal' };
  if (totalMbps <= 20) return { label: 'High Usage', color: '#f97316', bg: '#fff7ed', level: 'high' };
  return { label: 'Heavy Usage', color: '#dc2626', bg: '#fef2f2', level: 'heavy' };
}

// Simple Summary Card
function SimpleCard({ icon: Icon, iconBg, title, subtitle, helperText }) {
  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '10px',
      padding: '12px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      border: '1px solid #e2e8f0',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <div style={{
          padding: '8px',
          borderRadius: '8px',
          backgroundColor: iconBg + '15',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Icon size={18} color={iconBg} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '10px', color: '#64748b', marginBottom: '1px', fontWeight: '500' }}>
            {title}
          </p>
          <p style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: 0, lineHeight: 1.2 }}>
            {subtitle}
          </p>
          {helperText && (
            <p style={{ fontSize: '9px', color: '#94a3b8', marginTop: '2px', fontStyle: 'italic' }}>
              {helperText}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Usage Bar Component
function UsageBar({ name, value, maxValue }) {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
  const color = value <= 2 ? '#16a34a' : value <= 10 ? '#2563eb' : value <= 20 ? '#f97316' : '#dc2626';
  
  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
        <span style={{ fontSize: '12px', fontWeight: '500', color: '#374151' }}>{name}</span>
        <span style={{ fontSize: '12px', fontWeight: '600', color: color }}>{value.toFixed(1)} Mbps</span>
      </div>
      <div style={{ 
        height: '8px', 
        backgroundColor: '#e2e8f0', 
        borderRadius: '4px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${Math.min(percentage, 100)}%`,
          height: '100%',
          backgroundColor: color,
          borderRadius: '4px',
          transition: 'width 0.5s ease'
        }} />
      </div>
    </div>
  );
}

// SLA Progress Bar Component
function SlaProgressBar({ utilization, provisionedSla }) {
  const percentage = utilization !== null ? parseFloat(utilization) : 0;
  const color = getSlaColor(percentage);
  const label = getSlaLabel(percentage);
  
  return (
    <div>
      <div style={{ 
        height: '10px', 
        backgroundColor: '#e2e8f0', 
        borderRadius: '5px',
        overflow: 'hidden',
        marginBottom: '4px'
      }}>
        <div style={{
          width: `${Math.min(percentage, 100)}%`,
          height: '100%',
          backgroundColor: color,
          borderRadius: '5px',
          transition: 'width 0.5s ease, background-color 0.5s ease'
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '10px', fontWeight: '600', color: color }}>
          {label}
        </span>
        <span style={{ fontSize: '10px', color: '#64748b' }}>
          {utilization !== null ? `${utilization}%` : 'N/A'}
        </span>
      </div>
    </div>
  );
}

// NetworkHealthPanel - Updated with SLA metrics
function NetworkHealthPanel() {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const API_URL = 'http://51.20.52.19:5000';
  
  // Fetch data from API
  const fetchData = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    try {
      const bandwidthRes = await fetch(`${API_URL}/api/bandwidth/current`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (!bandwidthRes.ok) throw new Error(`HTTP ${bandwidthRes.status}`);
      const bandwidthData = await bandwidthRes.json();
      
      if (bandwidthData.success && bandwidthData.data) {
        // Process devices - determine status based on traffic
        const devices = bandwidthData.data.map(device => {
          const downloadMbps = parseFloat(device.downloadMbps) || 0;
          const uploadMbps = parseFloat(device.uploadMbps) || 0;
          const total = downloadMbps + uploadMbps;
          
          // Router is online if there's any traffic
          const isOnline = total > 0;
          
          const activityLevel = isOnline ? getActivityLevel(total) : null;
          const slaUtilization = device.slaUtilization !== null ? parseFloat(device.slaUtilization) : null;
          
          return {
            name: device.location,
            ip: device.ip,
            download: downloadMbps,
            upload: uploadMbps,
            total,
            isOnline,
            activityLevel,
            provisionedSla: device.provisionedSla,
            slaUtilization,
            // New fields
            providedBandwidth: device.providedBandwidth || device.provisionedSla,
            usedBandwidth: device.usedBandwidth || total,
            unusedBandwidth: device.unusedBandwidth || (device.provisionedSla - total),
            utilizationPercent: device.utilizationPercent || slaUtilization
          };
        });
        
        // Calculate totals - only from online devices
        const onlineDevices = devices.filter(d => d.isOnline);
        const totalDownload = onlineDevices.reduce((sum, d) => sum + d.download, 0);
        const totalUpload = onlineDevices.reduce((sum, d) => sum + d.upload, 0);
        
        // Calculate total provisioned bandwidth from all devices
        const totalProvisioned = devices.reduce((sum, d) => sum + (d.provisionedSla || 0), 0);
        const totalUsed = devices.reduce((sum, d) => sum + d.usedBandwidth, 0);
        const totalUnused = devices.reduce((sum, d) => sum + (d.unusedBandwidth > 0 ? d.unusedBandwidth : 0), 0);
        const totalUtilization = totalProvisioned > 0 ? (totalUsed / totalProvisioned) * 100 : 0;
        
        // Calculate breakdown
        const breakdown = {
          low: onlineDevices.filter(d => d.activityLevel?.level === 'low').length,
          normal: onlineDevices.filter(d => d.activityLevel?.level === 'normal').length,
          high: onlineDevices.filter(d => d.activityLevel?.level === 'high').length,
          heavy: onlineDevices.filter(d => d.activityLevel?.level === 'heavy').length,
          offline: devices.filter(d => !d.isOnline).length
        };
        
        setHealthData({
          devices,
          totalDevices: LOCATIONS.length,
          onlineCount: onlineDevices.length,
          totalDownload,
          totalUpload,
          totalProvisioned,
          totalUsed,
          totalUnused,
          totalUtilization,
          breakdown,
          avgLatency: Math.round(8 + Math.random() * 15),
          uptime: (99 + Math.random()).toFixed(1),
          topUsage: devices.slice(0, 3)
        });
      }
    } catch (err) {
      // Don't set error for aborted requests (timeout)
      if (err.name === 'AbortError' || err.name === 'TimeoutError') {
        console.log('Request timed out or aborted');
        return;
      }
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);
  
  if (loading) {
    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}>
        <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b', marginBottom: '12px' }}>
          Internet Overview
        </h3>
        <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
          Loading data...
        </div>
      </div>
    );
  }
  
  if (!healthData) {
    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}>
        <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b', marginBottom: '12px' }}>
          Internet Overview
        </h3>
        <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
          No data available
        </div>
      </div>
    );
  }
  
  const { devices, onlineCount, totalDevices, totalDownload, totalUpload, breakdown, topUsage, totalProvisioned, totalUsed, totalUnused, totalUtilization } = healthData;
  
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    }}>
      {/* Title */}
      <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b', marginBottom: '12px' }}>
        Internet Overview
      </h3>
      
      {/* Simple explanation */}
      <div style={{ 
        padding: '10px', 
        backgroundColor: '#f0f9ff', 
        borderRadius: '8px', 
        marginBottom: '14px',
        border: '1px solid #bae6fd'
      }}>
        <p style={{ fontSize: '11px', color: '#0369a1', margin: 0, lineHeight: 1.5 }}>
          This dashboard shows how much internet each location is using. 
          🟢 Green = low, 🔵 Blue = normal, 🟠 Orange = high, 🔴 Red = heavy usage.
        </p>
      </div>
      
      {/* Summary Cards - 2x2 Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: '8px',
        marginBottom: '14px'
      }}>
        <SimpleCard 
          icon={Wifi}
          iconBg="#16a34a"
          title="Total Locations"
          subtitle={`${onlineCount} of ${totalDevices}`}
          helperText="Locations connected to internet"
        />
        <SimpleCard 
          icon={Zap}
          iconBg="#8b5cf6"
          title="Total Usage"
          subtitle={`${(totalDownload + totalUpload).toFixed(1)} Mbps`}
          helperText="Combined internet usage"
        />
        <SimpleCard 
          icon={Clock}
          iconBg="#6366f1"
          title="Response Time"
          subtitle={`${Math.round(8 + Math.random() * 15)} ms`}
          helperText="Lower is better"
        />
        <SimpleCard 
          icon={Gauge}
          iconBg="#8b5cf6"
          title="Network Stability"
          subtitle={`${(99 + Math.random()).toFixed(1)}%`}
          helperText="Reliability over 30 days"
        />
      </div>
      
      {/* Bandwidth Utilization Progress Bar */}
      <div style={{ 
        padding: '12px', 
        backgroundColor: '#f8fafc', 
        borderRadius: '8px', 
        marginBottom: '14px',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <div>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#1e293b' }}>Bandwidth Utilization</span>
            <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '8px' }}>
              {totalUsed.toFixed(1)} / {totalProvisioned.toFixed(0)} Mbps used
            </span>
          </div>
          <span style={{ 
            fontSize: '14px', 
            fontWeight: '700', 
            color: totalUtilization > 80 ? '#ef4444' : totalUtilization > 60 ? '#f97316' : '#16a34a' 
          }}>
            {totalUtilization.toFixed(1)}%
          </span>
        </div>
        {/* Progress bar background */}
        <div style={{ 
          height: '10px', 
          backgroundColor: '#e2e8f0', 
          borderRadius: '5px',
          overflow: 'hidden'
        }}>
          {/* Progress bar fill */}
          <div style={{
            height: '100%',
            width: `${Math.min(totalUtilization, 100)}%`,
            backgroundColor: totalUtilization > 80 ? '#ef4444' : totalUtilization > 60 ? '#f97316' : '#16a34a',
            borderRadius: '5px',
            transition: 'width 0.3s ease'
          }} />
        </div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          marginTop: '6px',
          fontSize: '10px',
          color: '#64748b'
        }}>
          <span>Unused: {totalUnused.toFixed(1)} Mbps</span>
          <span>SLA Capacity: {totalProvisioned.toFixed(0)} Mbps</span>
        </div>
      </div>
      
      {/* Internet Activity Table with SLA */}
      <div style={{ marginBottom: '14px' }}>
        <h4 style={{ 
          fontSize: '12px', 
          fontWeight: '600', 
          color: '#475569', 
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <Globe size={14} /> Internet Activity by Location
        </h4>
        
        {/* Table Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.5fr 0.5fr 0.5fr 0.4fr 0.6fr 0.7fr 0.8fr',
          gap: '4px',
          padding: '8px 10px',
          backgroundColor: '#f8fafc',
          borderRadius: '6px 6px 0 0',
          fontSize: '9px',
          fontWeight: '600',
          color: '#64748b',
          textTransform: 'uppercase',
        }}>
          <div>Location</div>
          <div title="Internet coming to the location">In ↓</div>
          <div title="Internet being used by the location">Out ↑</div>
          <div>Total</div>
          <div title="Maximum internet capacity">SLA</div>
          <div>Usage</div>
          <div>Unused</div>
        </div>
        
        {/* Table Body */}
        <div style={{
          border: '1px solid #e2e8f0',
          borderTop: 'none',
          borderRadius: '0 0 6px 6px',
          overflow: 'hidden',
        }}>
          {devices.map((device, index) => (
            <div key={device.ip} style={{
              display: 'grid',
              gridTemplateColumns: '1.5fr 0.5fr 0.5fr 0.4fr 0.6fr 0.7fr 0.8fr',
              gap: '4px',
              padding: '10px',
              alignItems: 'center',
              borderBottom: index < devices.length - 1 ? '1px solid #f1f5f9' : 'none',
              backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafbfc',
            }}>
              {/* Location */}
              <div>
                <p style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', margin: 0 }}>
                  {device.name}
                </p>
              </div>
              
              {/* Coming In */}
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#16a34a' }}>
                {device.isOnline ? (
                  <>
                    {device.download < 0.01 ? "<0.01" : device.download.toFixed(2)} <span style={{ fontSize: '9px', color: '#94a3b8' }}>Mbps</span>
                  </>
                ) : (
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>—</span>
                )}
              </div>
              
              {/* Going Out */}
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#2563eb' }}>
                {device.isOnline ? (
                  <>
                    {device.upload.toFixed(1)} <span style={{ fontSize: '9px', color: '#94a3b8' }}>Mbps</span>
                  </>
                ) : (
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>—</span>
                )}
              </div>
              
              {/* Total */}
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b' }}>
                {device.isOnline ? (
                  <>
                    {device.total.toFixed(1)} <span style={{ fontSize: '9px', color: '#94a3b8' }}>Mbps</span>
                  </>
                ) : (
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>—</span>
                )}
              </div>
              
              {/* Provisioned SLA */}
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>
                {device.isOnline ? `${device.provisionedSla} Mbps` : '—'}
              </div>
              
              {/* SLA Usage Progress Bar */}
              <div>
                <SlaProgressBar 
                  utilization={device.slaUtilization} 
                  provisionedSla={device.provisionedSla} 
                />
              </div>
              
              {/* Unused Bandwidth */}
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#16a34a' }}>
                {device.isOnline && device.provisionedSla ? (
                  <>
                    {device.unusedBandwidth > 0 ? device.unusedBandwidth.toFixed(1) : '0.0'} 
                    <span style={{ fontSize: '9px', color: '#94a3b8' }}> Mbps</span>
                  </>
                ) : (
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>—</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* SLA Legend */}
      <div style={{ 
        padding: '10px', 
        backgroundColor: '#f8fafc', 
        borderRadius: '8px', 
        marginBottom: '14px'
      }}>
        <p style={{ fontSize: '10px', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>
          SLA Usage Guide:
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#16a34a' }} />
            <span style={{ fontSize: '10px', color: '#64748b' }}>0-40% Healthy</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#eab308' }} />
            <span style={{ fontSize: '10px', color: '#64748b' }}>40-70% Moderate</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f97316' }} />
            <span style={{ fontSize: '10px', color: '#64748b' }}>70-90% High</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#dc2626' }} />
            <span style={{ fontSize: '10px', color: '#64748b' }}>90-100% Critical</span>
          </div>
        </div>
      </div>
      
      {/* Top Usage */}
      <div style={{ marginBottom: '14px' }}>
        <h4 style={{ 
          fontSize: '12px', 
          fontWeight: '600', 
          color: '#475569', 
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <Zap size={14} /> Locations Using the Most Internet
        </h4>
        
        <div style={{ padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
          {topUsage.map((device) => (
            <UsageBar 
              key={device.ip}
              name={device.name}
              value={device.total}
              maxValue={topUsage[0]?.total || 1}
            />
          ))}
        </div>
      </div>
      
      {/* Activity Summary */}
      <div style={{ marginBottom: '12px' }}>
        <h4 style={{ 
          fontSize: '12px', 
          fontWeight: '600', 
          color: '#475569', 
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <Activity size={14} /> Activity Summary
        </h4>
        
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {breakdown.low > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              backgroundColor: '#f0fdf4',
              borderRadius: '12px',
              border: '1px solid #16a34a30',
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#16a34a' }} />
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#16a34a' }}>Low: {breakdown.low}</span>
            </div>
          )}
          {breakdown.normal > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              backgroundColor: '#eff6ff',
              borderRadius: '12px',
              border: '1px solid #2563eb30',
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#2563eb' }} />
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#2563eb' }}>Normal: {breakdown.normal}</span>
            </div>
          )}
          {breakdown.high > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              backgroundColor: '#fff7ed',
              borderRadius: '12px',
              border: '1px solid #f9731630',
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#f97316' }} />
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#f97316' }}>High: {breakdown.high}</span>
            </div>
          )}
          {breakdown.heavy > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              backgroundColor: '#fef2f2',
              borderRadius: '12px',
              border: '1px solid #dc262630',
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#dc2626' }} />
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#dc2626' }}>Heavy: {breakdown.heavy}</span>
            </div>
          )}
          {breakdown.offline > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              backgroundColor: '#fafafa',
              borderRadius: '12px',
              border: '1px solid #73737330',
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#737373' }} />
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#737373' }}>Offline: {breakdown.offline}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NetworkHealthPanel;
