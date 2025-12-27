'use client';

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './auth/use-user';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';

import { useMemo } from 'react';
import { initializeFirebase as initializeFirebaseClient } from './client';

export function useFirebase() {
  const firebaseServices = useMemo(() => {
    return initializeFirebaseClient();
  }, []);

  return firebaseServices;
}
