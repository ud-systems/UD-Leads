// Service Worker Utilities for Development Testing

export const enableDevServiceWorker = () => {
  localStorage.setItem('enable-dev-sw', 'true');
  window.location.reload();
};

export const disableDevServiceWorker = () => {
  localStorage.removeItem('enable-dev-sw');
  
  // Unregister existing service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister();
      });
    });
  }
  
  window.location.reload();
};

export const isDevServiceWorkerEnabled = () => {
  return localStorage.getItem('enable-dev-sw') === 'true';
};

export const getServiceWorkerStatus = async () => {
  if (!('serviceWorker' in navigator)) {
    return { available: false, registered: false };
  }

  const registrations = await navigator.serviceWorker.getRegistrations();
  return {
    available: true,
    registered: registrations.length > 0,
    count: registrations.length
  };
};
