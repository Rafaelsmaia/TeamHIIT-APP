import { createContext, useContext, useEffect, useMemo } from 'react';
import firebaseSyncService from '../services/FirebaseSync.js';

const FirebaseSyncContext = createContext({
  userId: null,
  isReady: false
});

export function FirebaseSyncProvider({ currentUser, loading, children }) {
  const userId = currentUser?.uid ?? null;

  useEffect(() => {
    if (loading) {
      return;
    }

    if (userId) {
      firebaseSyncService.setUser(userId);
    } else {
      firebaseSyncService.cleanup();
    }
  }, [loading, userId]);

  const contextValue = useMemo(() => ({
    userId,
    isReady: !loading
  }), [userId, loading]);

  return (
    <FirebaseSyncContext.Provider value={contextValue}>
      {children}
    </FirebaseSyncContext.Provider>
  );
}

export function useFirebaseSync() {
  return useContext(FirebaseSyncContext);
}

export default FirebaseSyncContext;

