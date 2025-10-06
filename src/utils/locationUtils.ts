/**
 * Location validation utilities for visit recording
 */

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}

/**
 * Get user's current location using browser geolocation API
 * @returns Promise with coordinates or null if failed
 */
export function getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser');
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        console.warn('Error getting location:', error);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0 // Always get fresh location data
      }
    );
  });
}

/**
 * Validate if user is within allowed distance from lead location
 * @param leadLat Lead's latitude
 * @param leadLng Lead's longitude
 * @param maxDistanceMeters Maximum allowed distance in meters
 * @returns Promise with validation result
 */
export async function validateLocationProximity(
  leadLat: number,
  leadLng: number,
  maxDistanceMeters: number
): Promise<{ isValid: boolean; distance?: number; error?: string }> {
  try {
    // Check if coordinates are valid
    if (!leadLat || !leadLng || isNaN(leadLat) || isNaN(leadLng)) {
      return {
        isValid: false,
        error: 'Lead location coordinates are invalid'
      };
    }

    // Get user's current location
    const userLocation = await getCurrentLocation();
    
    if (!userLocation) {
      return {
        isValid: false,
        error: 'Unable to get your current location. Please enable location services and try again.'
      };
    }

    // Calculate distance
    const distance = calculateDistance(
      leadLat,
      leadLng,
      userLocation.latitude,
      userLocation.longitude
    );

    // Check if within allowed distance
    const isValid = distance <= maxDistanceMeters;

    return {
      isValid,
      distance: Math.round(distance),
      error: isValid ? undefined : `You are ${Math.round(distance)}m away from the lead location. Maximum allowed distance is ${maxDistanceMeters}m.`
    };
  } catch (error) {
    console.error('Error validating location proximity:', error);
    return {
      isValid: false,
      error: 'Location validation failed. Please try again.'
    };
  }
}
