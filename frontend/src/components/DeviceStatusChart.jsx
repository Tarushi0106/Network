import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

const DeviceStatusChart = ({ online = 0, offline = 0 }) => {
  const data = [
    { name: 'Online', value: online, color: '#16a34a' },
    { name: 'Offline', value: offline, color: '#dc2626' },
  ];

  const total = online + offline;
  const percentage = total > 0 ? ((online / total) * 100).toFixed(1) : 0;

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
      height: '100%',
    }}>
      <h3 style={{
        fontSize: '18px',
        fontWeight: '700',
        color: '#1e293b',
        margin: '0 0 20px 0',
        letterSpacing: '-0.02em',
      }}>
        Device Status
      </h3>
      <div style={{ height: '240px', position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={90}
              paddingAngle={4}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Legend 
              verticalAlign="bottom" 
              height={36}
              iconType="circle"
              iconSize={8}
              formatter={(value) => <span style={{ color: '#64748b', fontSize: '13px', fontWeight: '500' }}>{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Center Text */}
        <div style={{
          position: 'absolute',
          top: '45%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
        }}>
          <p style={{
            fontSize: '36px',
            fontWeight: '700',
            color: '#1e293b',
            margin: 0,
            lineHeight: 1,
          }}>
            {percentage}%
          </p>
          <p style={{
            fontSize: '13px',
            color: '#94a3b8',
            margin: '4px 0 0 0',
          }}>
            Online
          </p>
        </div>
      </div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '24px',
        marginTop: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: '#16a34a',
          }} />
          <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>{online} Online</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: '#dc2626',
          }} />
          <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>{offline} Offline</span>
        </div>
      </div>
    </div>
  );
};

export default DeviceStatusChart;
