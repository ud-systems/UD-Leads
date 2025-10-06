import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

export interface VisitDraft {
  step: number;
  visitData: any;
  leadSearch: string;
  exteriorPhotos: string[];
  interiorPhotos: string[];
  locationValidated: boolean | null;
  locationError: string | null;
  visitStartTime: string | null;
  lastSaved: string;
  leadId: string | null;
}

const DRAFT_STORAGE_KEY = 'visit-draft';

export function useVisitDraft() {
  const { user } = useAuth();
  const [draft, setDraft] = useState<VisitDraft | null>(null);
  const [hasDraft, setHasDraft] = useState(false);

  // Load draft on mount
  useEffect(() => {
    if (user?.id) {
      const savedDraft = localStorage.getItem(`${DRAFT_STORAGE_KEY}-${user.id}`);
      if (savedDraft) {
        try {
          const parsedDraft = JSON.parse(savedDraft);
          setDraft(parsedDraft);
          setHasDraft(true);
        } catch (error) {
          console.error('Error parsing saved visit draft:', error);
          clearDraft();
        }
      }
    }
  }, [user?.id]);

  // Save draft to localStorage
  const saveDraft = useCallback((
    step: number, 
    visitData: any, 
    leadSearch: string,
    exteriorPhotos: string[],
    interiorPhotos: string[],
    locationValidated: boolean | null,
    locationError: string | null,
    visitStartTime: string | null
  ) => {
    if (!user?.id) return;

    const draftData: VisitDraft = {
      step,
      visitData,
      leadSearch,
      exteriorPhotos,
      interiorPhotos,
      locationValidated,
      locationError,
      visitStartTime,
      lastSaved: new Date().toISOString(),
      leadId: visitData.lead_id || null
    };

    localStorage.setItem(`${DRAFT_STORAGE_KEY}-${user.id}`, JSON.stringify(draftData));
    setDraft(draftData);
    setHasDraft(true);
  }, [user?.id]);

  // Clear draft
  const clearDraft = useCallback(() => {
    if (!user?.id) return;

    localStorage.removeItem(`${DRAFT_STORAGE_KEY}-${user.id}`);
    setDraft(null);
    setHasDraft(false);
  }, [user?.id]);

  // Update draft step
  const updateDraftStep = useCallback((step: number) => {
    if (draft) {
      saveDraft(
        step, 
        draft.visitData, 
        draft.leadSearch,
        draft.exteriorPhotos,
        draft.interiorPhotos,
        draft.locationValidated,
        draft.locationError,
        draft.visitStartTime
      );
    }
  }, [draft, saveDraft]);

  // Update draft form data
  const updateDraftData = useCallback((visitData: any) => {
    if (draft) {
      saveDraft(
        draft.step, 
        visitData, 
        draft.leadSearch,
        draft.exteriorPhotos,
        draft.interiorPhotos,
        draft.locationValidated,
        draft.locationError,
        draft.visitStartTime
      );
    }
  }, [draft, saveDraft]);

  return {
    draft,
    hasDraft,
    saveDraft,
    clearDraft,
    updateDraftStep,
    updateDraftData
  };
}
