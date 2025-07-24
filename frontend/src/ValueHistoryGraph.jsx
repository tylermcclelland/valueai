import React, { useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Area, CartesianGrid } from 'recharts';

const formatCurrency = (value) => `$${Math.round(value / 1000)}k`;
const formatTooltipCurrency = (value) => `$${new Intl.NumberFormat('en-US').format(value)}`;

const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
  });
};

const formatYearlyDate = (timestamp) => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: '2-digit',
  });
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dateLabel = new Date(label).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
    return (
      <div className="custom-tooltip">
        <p className="tooltip-label">{dateLabel}</p>
        <p className="tooltip-value">{`Value: ${formatTooltipCurrency(payload[0].value)}`}</p>
      </div>
    );
  }
  return null;
};

function ValueHistoryGraph({ monthlyData, yearlyData }) {
  // --- MODIFIED: Logic to handle potentially empty data ---
  const hasMonthlyData = monthlyData && monthlyData.length > 0;
  const hasYearlyData = yearlyData && yearlyData.length > 0;

  // Set the default timeframe based on which data is available
  const [timeframe, setTimeframe] = useState(hasYearlyData ? 'yearly' : 'monthly'); 
  
  const sortedYearlyData = hasYearlyData ? [...yearlyData].sort((a, b) => a.date - b.date) : [];
  const data = timeframe === 'monthly' ? monthlyData : sortedYearlyData;
  const chartColor = "#a18cd1"; 
  
  // --- ADDED: Check if any data exists at all. If not, show a message. ---
  if (!hasMonthlyData && !hasYearlyData) {
    return (
      <div className="value-graph-container">
        <div className="graph-header">
          <h3 className="section-title">Value History</h3>
        </div>
        <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255, 255, 255, 0.5)' }}>
          <p>Price history data is not available for this model.</p>
        </div>
      </div>
    );
  }
  
  // If data exists, return the chart as before.
  return (
    <div className="value-graph-container">
      <div className="graph-header">
        <h3 className="section-title">Value History</h3>
        <div className="timeframe-controls">
          {/* Only show the button if its data exists */}
          {hasMonthlyData && (
            <button 
              className={`timeframe-btn ${timeframe === 'monthly' ? 'active' : ''}`}
              onClick={() => setTimeframe('monthly')}
            >
              Monthly
            </button>
          )}
          {hasYearlyData && (
            <button 
              className={`timeframe-btn ${timeframe === 'yearly' ? 'active' : ''}`}
              onClick={() => setTimeframe('yearly')}
            >
              Yearly
            </button>
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColor} stopOpacity={0.4}/>
              <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3"
            stroke="rgba(255, 255, 255, 0.2)"
            vertical={false}
          />
          <XAxis 
            dataKey="date" 
            tickFormatter={timeframe === 'monthly' ? formatDate : formatYearlyDate}
            stroke="rgba(255, 255, 255, 0.7)"
            tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            tickFormatter={formatCurrency}
            stroke="rgba(255, 255, 255, 0.7)"
            tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }}
            domain={['dataMin - 1000', 'dataMax + 1000']}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: chartColor, strokeWidth: 1, strokeDasharray: "3 3" }} />
          <Area type="monotone" dataKey="value" stroke={false} fill="url(#colorGradient)" />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={chartColor}
            strokeWidth={2.5} 
            dot={false}
            activeDot={{ r: 6, stroke: '#fff', fill: chartColor, strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ValueHistoryGraph;