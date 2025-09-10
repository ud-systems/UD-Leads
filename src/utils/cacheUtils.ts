// Cache management utilities for production optimization

/**
 * Clear all caches and force reload
 * Useful for development and when users need to see latest changes
 */
export const clearAllCaches = async () => {
  try {
    // Clear service worker caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('All caches cleared');
    }

    // Clear localStorage (optional - be careful with this)
    // localStorage.clear();

    // Clear sessionStorage
    sessionStorage.clear();

    // Force reload
    window.location.reload();
  } catch (error) {
    console.error('Error clearing caches:', error);
  }
};

/**
 * Check if service worker is available and update it
 */
export const updateServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
        console.log('Service worker updated');
      }
    } catch (error) {
      console.error('Error updating service worker:', error);
    }
  }
};

/**
 * Add cache busting parameter to URLs
 */
export const addCacheBuster = (url: string): string => {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_cb=${Date.now()}`;
};

/**
 * Check if we're in development mode
 */
export const isDevelopment = (): boolean => {
  return import.meta.env.DEV;
};

/**
 * Get cache version for debugging
 */
export const getCacheVersion = (): string => {
  return import.meta.env.VITE_CACHE_VERSION || '1.0.0';
};
