import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, FileText, Trash2, Play } from 'lucide-react';
import { LeadDraft } from '@/hooks/useLeadDraft';

interface DraftRecoveryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  draft: LeadDraft;
  onContinueDraft: () => void;
  onDiscardDraft: () => void;
}

export function DraftRecoveryDialog({
  isOpen,
  onClose,
  draft,
  onContinueDraft,
  onDiscardDraft
}: DraftRecoveryDialogProps) {
  const formatLastSaved = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  const getStepDescription = (step: number) => {
    switch (step) {
      case 1:
        return 'Location & Basic Information';
      case 2:
        return 'Contact & Business Details';
      case 3:
        return 'Status & Notes';
      default:
        return 'Unknown Step';
    }
  };

  const getProgressPercentage = (step: number) => {
    return Math.round((step / 3) * 100);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Incomplete Lead Found
          </DialogTitle>
          <DialogDescription>
            You have an incomplete lead form that was saved. Would you like to continue where you left off?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Draft Info Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Draft Details</CardTitle>
              <CardDescription>
                Progress: {getStepDescription(draft.step)} ({getProgressPercentage(draft.step)}% complete)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getProgressPercentage(draft.step)}%` }}
                />
              </div>

              {/* Draft Info */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Last saved: {formatLastSaved(draft.lastSaved)}</span>
              </div>

              {/* Form Data Preview */}
              {draft.formData && (
                <div className="text-sm space-y-1">
                  {draft.formData.store_name && (
                    <p><strong>Store:</strong> {draft.formData.store_name}</p>
                  )}
                  {draft.formData.contact_person && (
                    <p><strong>Contact:</strong> {draft.formData.contact_person}</p>
                  )}
                  {draft.formData.territory && (
                    <p><strong>Territory:</strong> {draft.formData.territory}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              onClick={onContinueDraft}
              className="flex-1"
            >
              <Play className="h-4 w-4 mr-2" />
              Continue Draft
            </Button>
            <Button 
              variant="outline" 
              onClick={onDiscardDraft}
              className="flex-1"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Discard Draft
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Your draft will be automatically saved as you progress through the form.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
