import React from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { SQLResult, DashboardConfig } from '../../types';

interface Props {
  data: SQLResult;
  config: DashboardConfig;
}

const COLORS = ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#AF52DE', '#5856D6'];

const DashboardVisualization: React.FC<Props> = ({ data, config }) => {
  if (!data || data.row_count === 0) {
    return (
      <div className="text-center py-12 text-apple-gray-500">
        Нет данных для отображения
      </div>
    );
  }

  // Таблица
  if (config.visualizationType === 'table') {
    return (
      <div className="overflow-x-auto border border-apple-gray-200 rounded-xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-apple-gray-200 bg-apple-gray-50">
              {data.columns.map((col) => (
                <th key={col} className="text-left py-3 px-4 font-semibold text-apple-gray-700">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.data.map((row, idx) => (
              <tr key={idx} className="border-b border-apple-gray-100 hover:bg-apple-gray-50">
                {data.columns.map((col) => (
                  <td key={col} className="py-3 px-4">
                    {String(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Карточка со значением
  if (config.visualizationType === 'card') {
    const value = config.cardValue ? data.data[0]?.[config.cardValue] : data.data[0]?.[data.columns[0]];
    const label = config.cardLabel || data.columns[0];
    
    return (
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-8 text-white shadow-lg">
        <p className="text-lg opacity-90 mb-2">{label}</p>
        <p className="text-5xl font-bold">{value}</p>
      </div>
    );
  }

  // Линейный график
  if (config.visualizationType === 'line') {
    return (
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data.data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8E8ED" />
          <XAxis 
            dataKey={config.xAxis || data.columns[0]} 
            stroke="#86868B" 
            style={{ fontSize: '12px' }} 
          />
          <YAxis stroke="#86868B" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E8E8ED',
              borderRadius: '12px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
            }}
          />
          <Legend />
          {(config.yAxis || [data.columns[1]]).map((col, idx) => (
            <Line
              key={col}
              type="monotone"
              dataKey={col}
              stroke={COLORS[idx % COLORS.length]}
              strokeWidth={3}
              dot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  // Столбчатый график
  if (config.visualizationType === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data.data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8E8ED" />
          <XAxis 
            dataKey={config.xAxis || data.columns[0]} 
            stroke="#86868B" 
            style={{ fontSize: '12px' }} 
          />
          <YAxis stroke="#86868B" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E8E8ED',
              borderRadius: '12px'
            }}
          />
          <Legend />
          {(config.yAxis || [data.columns[1]]).map((col, idx) => (
            <Bar
              key={col}
              dataKey={col}
              fill={COLORS[idx % COLORS.length]}
              radius={[8, 8, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // Круговая диаграмма
  if (config.visualizationType === 'pie') {
    const nameKey = config.xAxis || data.columns[0];
    const valueKey = config.yAxis?.[0] || data.columns[1];
    
    return (
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={data.data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={120}
            fill="#8884d8"
            dataKey={valueKey}
            nameKey={nameKey}
          >
            {data.data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  // Area график
  if (config.visualizationType === 'area') {
    return (
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={data.data}>
          <defs>
            {(config.yAxis || [data.columns[1]]).map((col, idx) => (
              <linearGradient key={col} id={`color${idx}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS[idx % COLORS.length]} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={COLORS[idx % COLORS.length]} stopOpacity={0}/>
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8E8ED" />
          <XAxis 
            dataKey={config.xAxis || data.columns[0]} 
            stroke="#86868B" 
            style={{ fontSize: '12px' }} 
          />
          <YAxis stroke="#86868B" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E8E8ED',
              borderRadius: '12px'
            }}
          />
          <Legend />
          {(config.yAxis || [data.columns[1]]).map((col, idx) => (
            <Area
              key={col}
              type="monotone"
              dataKey={col}
              stroke={COLORS[idx % COLORS.length]}
              fillOpacity={1}
              fill={`url(#color${idx})`}
              strokeWidth={3}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  return null;
};

export default DashboardVisualization;
