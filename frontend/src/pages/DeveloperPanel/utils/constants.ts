// frontend/src/pages/DeveloperPanel/utils/constants.ts

export const SANDPACK_TEMPLATE = `import React from 'react';

export default function App({ data }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#666'
      }}>
        <h2>⚠️ No Data Available</h2>
        <p>Please execute SQL query first</p>
      </div>
    );
  }

  return (
    <div style={{
      padding: '30px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h1>📊 Dashboard</h1>
      <p>Total rows: <strong>{data.length}</strong></p>
      
      <div style={{
        marginTop: '20px',
        overflowX: 'auto'
      }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <thead>
            <tr style={{ background: '#f3f4f6' }}>
              {Object.keys(data[0]).map((key, idx) => (
                <th key={idx} style={{ 
                  padding: '12px', 
                  textAlign: 'left',
                  borderBottom: '2px solid #e5e7eb',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  {key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx} style={{ 
                borderBottom: '1px solid #e5e7eb',
                background: idx % 2 === 0 ? '#fff' : '#f9fafb'
              }}>
                {Object.values(row).map((value, i) => (
                  <td key={i} style={{ 
                    padding: '12px',
                    fontSize: '14px'
                  }}>
                    {value !== null && value !== undefined ? String(value) : 'null'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}`;
