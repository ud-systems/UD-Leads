import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Bell, X } from 'lucide-react';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { useToast } from '../../hooks/use-toast';

interface NotificationPromptProps {
  onDismiss?: () => void;
}

export const NotificationPrompt: React.FC<NotificationPromptProps> = ({ onDismiss }) => {
  // Push notifications are disabled, so don't show the prompt
  return null;
}; 