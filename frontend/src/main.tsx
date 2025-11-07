// frontend/src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
      
      {/* Toast Notification Container */}
      <Toaster 
        position="top-right"
        reverseOrder={false}
        gutter={8}
        containerClassName="toast-container"
        toastOptions={{
          // Default options for all toasts
          duration: 4000,
          
          // Default styles
          style: {
            background: '#363636',
            color: '#fff',
            padding: '16px',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            maxWidth: '500px',
          },
          
          // Success toast styling
          success: {
            duration: 3000,
            style: {
              background: '#10b981',
              color: '#fff',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#10b981',
            },
          },
          
          // Error toast styling
          error: {
            duration: 5000,
            style: {
              background: '#ef4444',
              color: '#fff',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#ef4444',
            },
          },
          
          // Loading toast styling
          loading: {
            style: {
              background: '#3b82f6',
              color: '#fff',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#3b82f6',
            },
          },
          
          // Custom toast styling
          custom: {
            duration: 4000,
          },
        }}
      />
    </AuthProvider>
  </React.StrictMode>
);
