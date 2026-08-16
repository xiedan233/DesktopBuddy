import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Root element #root not found in index.html');
  throw new Error('Root element #root not found in index.html');
}

try {
  ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
  );
  console.log('[main.tsx] React 应用已挂载');
} catch (err) {
  console.error('[main.tsx] React 挂载失败:', err);
}
