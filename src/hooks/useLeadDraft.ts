import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

export interface LeadDraft {
  step: number;
  formData: any;
  lastSaved: string;
  leadId: string | null;
  formStartTime: string | null;
}

const DRAFT_STORAGE_KEY = 'lead-draft';

export function useLeadDraft() {
  const { user } = useAuth();
  const [draft, setDraft] = useState<LeadDraft | null>(null);
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
          console.error('Error parsing saved draft:', error);
          clearDraft();
        }
      }
    }
  }, [user?.id]);

  // Save draft to localStorage
  const saveDraft = useCallback((step: number, formData: any, formStartTime?: string | null) => {
    if (!user?.id) return;

    const draftData: LeadDraft = {
      step,
      formData,
      lastSaved: new Date().toISOString(),
      leadId: null,
      formStartTime: formStartTime || draft?.formStartTime || null
    };

    localStorage.setItem(`${DRAFT_STORAGE_KEY}-${user.id}`, JSON.stringify(draftData));
    setDraft(draftData);
    setHasDraft(true);
  }, [user?.id, draft?.formStartTime]);

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
      saveDraft(step, draft.formData, draft.formStartTime);
    }
  }, [draft, saveDraft]);

  // Update draft form data
  const updateDraftData = useCallback((formData: any) => {
    if (draft) {
      saveDraft(draft.step, formData, draft.formStartTime);
    }
  }, [draft, saveDraft]);

  // Set form start time (when coordinates are first filled)
  const setFormStartTime = useCallback((timestamp: string) => {
    if (draft) {
      saveDraft(draft.step, draft.formData, timestamp);
    }
  }, [draft, saveDraft]);

  return {
    draft,
    hasDraft,
    saveDraft,
    clearDraft,
    updateDraftStep,
    updateDraftData,
    setFormStartTime
  };
}
