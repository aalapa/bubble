import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from 'react';
import {AppState, AppStateStatus} from 'react-native';
import syncService, {SyncStatus} from './sync';

interface SyncContextType {
  syncStatus: SyncStatus;
  syncNow: () => Promise<void>;
  scheduleSyncAfterWrite: () => void;
}

const SyncContext = createContext<SyncContextType>({
  syncStatus: 'idle',
  syncNow: async () => {},
  scheduleSyncAfterWrite: () => {},
});

export const useSyncContext = () => useContext(SyncContext);

export const SyncProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const writeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appState = useRef(AppState.currentState);

  // Subscribe to sync status updates
  useEffect(() => {
    const unsub = syncService.subscribe(status => {
      setSyncStatus(status);
    });
    return unsub;
  }, []);

  // Sync on app foreground
  useEffect(() => {
    const sub = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextState === 'active'
        ) {
          syncService.performSync();
        }
        appState.current = nextState;
      },
    );
    return () => sub.remove();
  }, []);

  // Initial sync on mount
  useEffect(() => {
    // Small delay to let database init finish first
    const timer = setTimeout(() => {
      syncService.performSync();
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const syncNow = useCallback(async () => {
    await syncService.performSync();
  }, []);

  const scheduleSyncAfterWrite = useCallback(() => {
    if (writeDebounceRef.current) {
      clearTimeout(writeDebounceRef.current);
    }
    writeDebounceRef.current = setTimeout(() => {
      syncService.performSync();
    }, 3000); // 3-second debounce after writes
  }, []);

  return (
    <SyncContext.Provider value={{syncStatus, syncNow, scheduleSyncAfterWrite}}>
      {children}
    </SyncContext.Provider>
  );
};
