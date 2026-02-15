import { useEffect, useCallback } from 'react';

/**
 * Warns the user when they try to close/refresh with unsaved changes.
 * Uses the beforeunload event to show a browser-native confirmation dialog.
 */
export function useUnsavedChanges(isDirty: boolean) {
  const handleBeforeUnload = useCallback(
    (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
      }
    },
    [isDirty]
  );

  useEffect(() => {
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [handleBeforeUnload]);
}
