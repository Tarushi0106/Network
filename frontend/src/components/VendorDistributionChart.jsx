import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

const VendorDistributionChart = ({ data = [] }) => {
  const colors = ['#dc2626', '#3b82f6', '#16a34a', '#f59e0b', '#8b5cf6'];

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
        Vendor Distribution
      </h3>
      <div style={{ height: '200px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Legend 
              verticalAlign="bottom" 
              height={36}
              iconType="circle"
              iconSize={8}
              formatter={(value) => <span style={{ color: '#64748b', fontSize: '12px', fontWeight: '500' }}>{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {data.map((item, index) => (
          <div key={item.name} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            padding: '8px 12px',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: colors[index],
              }} />
              <span style={{ fontSize: '13px', fontWeight: '500', color: '#64748b' }}>{item.name}</span>
            </div>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VendorDistributionChart;
