import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import {
  app as firebaseApp,
  db as firestore,
  isFirebaseConfigured,
} from './firebase/config.js';

export { firebaseApp, firestore, isFirebaseConfigured };
export const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null;
export const firebaseStorage = firebaseApp ? getStorage(firebaseApp) : null;
