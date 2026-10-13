import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { PrecostingProvider } from './context/PrecostingContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PrecostingProvider>
      <App />
    </PrecostingProvider>
  </StrictMode>,
);
