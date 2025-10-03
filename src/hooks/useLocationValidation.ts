import { useState } from 'react';
import { useVisitDistanceValidation } from './useSystemSettings';
import { validateLocationProximity, getCurrentLocation } from '@/utils/locationUtils';

export interface LocationValidationResult {
  isValid: boolean;
  distance?: number;
  error?: string;
  isLoading: boolean;
}

export function useLocationValidation() {
  const [isValidating, setIsValidating] = useState(false);
  const { data: maxDistanceMeters = 25 } = useVisitDistanceValidation();

  const validateProximity = async (
    leadLat: number,
    leadLng: number
  ): Promise<LocationValidationResult> => {
    setIsValidating(true);
    
    try {
      const result = await validateLocationProximity(
        leadLat,
        leadLng,
        maxDistanceMeters
      );
      
      return {
        ...result,
        isLoading: false
      };
    } catch (error) {
      console.error('Error in location validation:', error);
      return {
        isValid: false,
        error: 'Location validation failed. Please try again.',
        isLoading: false
      };
    } finally {
      setIsValidating(false);
    }
  };

  const getCurrentUserLocation = async () => {
    setIsValidating(true);
    
    try {
      const location = await getCurrentLocation();
      return location;
    } finally {
      setIsValidating(false);
    }
  };

  return {
    validateProximity,
    getCurrentUserLocation,
    maxDistanceMeters,
    isLoading: isValidating
  };
}
