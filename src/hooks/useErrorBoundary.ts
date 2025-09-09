import { useCallback } from 'react';

interface ErrorContext {
  route?: string;
  component?: string;
  action?: string;
  userId?: string;
  timestamp: string;
}

export const useErrorBoundary = () => {
  const logError = useCallback((error: Error, context: ErrorContext) => {
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      ...context,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    console.group('🚨 Application Error');
    console.error('Error:', error);
    console.error('Context:', context);
    console.error('Details:', errorDetails);
    console.groupEnd();

    // TODO: Send to error tracking service
    // if (process.env.NODE_ENV === 'production') {
    //   Sentry.captureException(error, { extra: errorDetails });
    // }
  }, []);

  const handleError = useCallback((error: Error, errorInfo: any, context: Partial<ErrorContext> = {}) => {
    const fullContext: ErrorContext = {
      timestamp: new Date().toISOString(),
      ...context,
    };

    logError(error, fullContext);
  }, [logError]);

  return {
    logError,
    handleError,
  };
};
