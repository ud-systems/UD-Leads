import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, FileText, Camera, MapPin } from 'lucide-react';
import { formatUKDate } from '@/utils/timeUtils';

interface VisitDraftRecoveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecover: () => void;
  onDiscard: () => void;
  draft: any;
}

export function VisitDraftRecoveryDialog({ 
  open, 
  onOpenChange, 
  onRecover, 
  onDiscard, 
  draft 
}: VisitDraftRecoveryDialogProps) {
  const [isRecovering, setIsRecovering] = useState(false);

  const handleRecover = async () => {
    setIsRecovering(true);
    try {
      await onRecover();
      onOpenChange(false);
    } finally {
      setIsRecovering(false);
    }
  };

  const handleDiscard = () => {
    onDiscard();
    onOpenChange(false);
  };

  if (!draft) return null;

  const getStepDescription = (step: number) => {
    switch (step) {
      case 1:
        return 'Lead Selection & Location Validation';
      case 2:
        return 'Photo Uploads';
      case 3:
        return 'Status & Notes';
      default:
        return 'Unknown Step';
    }
  };

  const formatLastSaved = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown time';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <span>Recover Visit Draft</span>
          </DialogTitle>
          <DialogDescription>
            You have an unsaved visit draft. Would you like to continue where you left off?
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-medium">Draft Details:</div>
                <div className="text-sm space-y-1">
                  <div>• <strong>Step:</strong> {getStepDescription(draft.step)}</div>
                  <div>• <strong>Lead:</strong> {draft.leadSearch || 'Not selected'}</div>
                  <div>• <strong>Date:</strong> {draft.visitData?.date ? formatUKDate(draft.visitData.date) : 'Not set'}</div>
                  <div>• <strong>Type:</strong> {draft.draftType === 'manual-save' ? 'Save & Exit' : 'Auto-save'}</div>
                  <div>• <strong>Last Saved:</strong> {formatLastSaved(draft.lastSaved)}</div>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {/* Progress Summary */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="text-sm font-medium">Progress Summary:</div>
            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <MapPin className="h-3 w-3" />
                <span>Location: {draft.locationValidated === true ? '✓' : draft.locationValidated === false ? '✗' : '?'}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Camera className="h-3 w-3" />
                <span>Photos: {draft.exteriorPhotos?.length || 0}E, {draft.interiorPhotos?.length || 0}I</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            Recovering will restore your form data and continue from step {draft.step}. 
            Discarding will permanently delete this draft.
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={handleDiscard}
            disabled={isRecovering}
          >
            Discard Draft
          </Button>
          <Button
            onClick={handleRecover}
            disabled={isRecovering}
          >
            {isRecovering ? 'Recovering...' : 'Continue Draft'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
