import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Suppress browser extension errors that don't affect our application
window.addEventListener('unhandledrejection', (event) => {
  // Check if the error is from a browser extension
  if (event.reason?.message?.includes('message channel closed') || 
      event.reason?.stack?.includes('videoStreamBlocker') ||
      event.reason?.stack?.includes('extension')) {
    console.warn('Suppressed browser extension error:', event.reason);
    event.preventDefault(); // Prevent the error from showing in console
  }
});

// Validate critical environment variables
const validateEnvironment = () => {
  const requiredVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']
  const missing = requiredVars.filter(varName => !import.meta.env[varName])
  
  if (missing.length > 0) {
    console.error('Missing environment variables:', missing)
    // Show error in console but don't block the app - use fallback values
    console.warn('Using fallback environment values')
  }
  return true
}

// Run validation
validateEnvironment()

// Register service worker for offline functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Use production service worker in production, development service worker in development
    const swPath = import.meta.env.PROD ? '/sw.js' : '/sw-dev.js';
    
    // Only register in production or if explicitly enabled for development testing
    if (import.meta.env.PROD || localStorage.getItem('enable-dev-sw') === 'true') {
      navigator.serviceWorker.register(swPath)
        .then((registration) => {
          console.log('SW registered: ', registration);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content is available, prompt user to refresh
                  if (confirm('New version available! Refresh to update?')) {
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
