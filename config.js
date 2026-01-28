// config.js - Auto-detect API Base URL
const API_BASE = (() => {
  const hostname = window.location.hostname;
  
  // Development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3000';
  }
  
  // Production - Railway backend
  // If frontend is at my-book-stationary.up.railway.app, backend is at the same origin
  // or you can specify the exact backend URL
  if (hostname.includes('railway.app')) {
    // Same origin - backend is served from the same domain
    return window.location.origin;
  }
  
  // Fallback
  return window.location.origin;
})();

console.log('API_BASE:', API_BASE);
