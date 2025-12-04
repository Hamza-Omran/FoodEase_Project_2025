console.log('🚀 [main.jsx] Starting application...');

import React, { StrictMode } from "react";
import { createRoot } from 'react-dom/client';
import App from "./App.jsx";
import "./index.css";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";

console.log('✅ [main.jsx] Imports successful');
console.log('🔍 [main.jsx] Looking for root element...');

const rootElement = document.getElementById('root');
console.log('🔍 [main.jsx] Root element:', rootElement);

if (!rootElement) {
  console.error('❌ [main.jsx] Root element not found!');
} else {
  console.log('✅ [main.jsx] Root element found, rendering app...');
  
  createRoot(rootElement).render(
    <StrictMode>
      <AuthProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </AuthProvider>
    </StrictMode>
  );
  
  console.log('✅ [main.jsx] App rendered successfully');
}
