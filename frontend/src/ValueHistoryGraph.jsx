// frontend/src/ValueHistoryGraph.jsx

import React, { useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const formatCurrency = (value) => `$${new Intl.NumberFormat('en-US').format(value)}`;

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="label">{`${label}`}</p>
        <p className="intro">{`Value: ${formatCurrency(payload[0].value)}`}</p>
      </div>
    );
  }
  return null;
};

function ValueHistoryGraph({ monthlyData, yearlyData }) {
  const [timeframe, setTimeframe] = useState('monthly'); 
  const data = timeframe === 'monthly' ? monthlyData : yearlyData;
  const chartColor = "#a18cd1"; 
  
  return (
    <div className="graph-container">
      <div className="graph-header">
        <h3 className="section-title">Value History</h3>
        <div className="timeframe-controls">
          <button 
            className={`timeframe-btn ${timeframe === 'monthly' ? 'active' : ''}`}
            onClick={() => setTimeframe('monthly')}
          >
            Monthly
          </button>
          <button 
            className={`timeframe-btn ${timeframe === 'yearly' ? 'active' : ''}`}
            onClick={() => setTimeframe('yearly')}
          >
            Yearly
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
          <XAxis 
            dataKey="name" 
            stroke="rgba(255, 255, 255, 0.7)"
            tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
          />
          <YAxis 
            stroke="rgba(255, 255, 255, 0.7)"
            tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
            tickFormatter={(value) => `$${Math.round(value/1000)}k`}
            domain={['dataMin - 1000', 'dataMax + 1000']}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={chartColor}
            strokeWidth={2} 
            dot={{ r: 4, fill: chartColor }}
            activeDot={{ r: 8, stroke: chartColor, fill: '#fff' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ValueHistoryGraph;