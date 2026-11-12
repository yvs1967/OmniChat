import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile } from '../types';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

export const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive',
];

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));
// Do NOT force consent select_account on every single login attempt as it causes loop & double popups
provider.setCustomParameters({
  prompt: 'select_account',
});

// Flag to indicate if we are in the middle of a sign-in flow.
let isSigningIn = false;

// Persist the access token across browser refreshes / back-and-forth navigation
const STORAGE_KEY_TOKEN = 'omnichat_drive_token';
const STORAGE_KEY_TOKEN_EXPIRY = 'omnichat_drive_token_expiry';

// Load stored token if not expired
const getStoredToken = (): string | null => {
  try {
    const token = localStorage.getItem(STORAGE_KEY_TOKEN);
    const expiry = localStorage.getItem(STORAGE_KEY_TOKEN_EXPIRY);
    if (token) {
      if (expiry) {
        const expTime = parseInt(expiry, 10);
        if (Date.now() < expTime - 60000) {
          return token;
        }
      } else {
        return token;
      }
    }
    return null;
  } catch {
    return null;
  }
};

let cachedAccessToken: string | null = getStoredToken();

export const saveToken = (token: string, expiresInSeconds: number = 3600) => {
  cachedAccessToken = token;
  try {
    localStorage.setItem(STORAGE_KEY_TOKEN, token);
    localStorage.setItem(STORAGE_KEY_TOKEN_EXPIRY, (Date.now() + expiresInSeconds * 1000).toString());
  } catch (err) {
    console.warn('Failed to persist token to localStorage:', err);
  }
};

export const clearStoredToken = () => {
  cachedAccessToken = null;
  try {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_TOKEN_EXPIRY);
  } catch {}
};

// Initialize auth state listener.
export const initAuth = (
  onAuthSuccess?: (user: UserProfile, token: string) => void,
  onAuthFailure?: () => void
) => {
  // Check if returning from redirect
  getRedirectResult(auth)
    .then((result) => {
      if (result) {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential?.accessToken || '';
        if (token) {
          saveToken(token, 3600);
        }
        if (onAuthSuccess) {
          onAuthSuccess(mapFirebaseUser(result.user), token);
        }
      }
    })
    .catch((err) => {
      console.warn('Redirect auth result check:', err);
    });

  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const token = cachedAccessToken || getStoredToken();
      if (token) {
        cachedAccessToken = token;
        if (onAuthSuccess) {
          onAuthSuccess(mapFirebaseUser(user), token);
        }
      } else {
        // If user is logged into Firebase but Drive token is not cached,
        // still authenticate the user profile and notify so we don't loop
        if (onAuthSuccess) {
          onAuthSuccess(mapFirebaseUser(user), '');
        }
      }
    } else {
      clearStoredToken();
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const mapFirebaseUser = (user: User): UserProfile => {
  return {
    uid: user.uid,
    displayName: user.displayName || user.email?.split('@')[0] || 'WhatsApp User',
    email: user.email || '',
    photoURL: user.photoURL || undefined,
  };
};

// Must be called from a button click or user interaction
export const googleSignIn = async (): Promise<{ user: UserProfile; accessToken: string } | null> => {
  if (isSigningIn) {
    return null;
  }

  try {
    isSigningIn = true;
    let result;
    try {
      result = await signInWithPopup(auth, provider);
    } catch (popupErr: any) {
      console.warn('signInWithPopup failed:', popupErr.code, popupErr.message);

      if (
        popupErr.code === 'auth/cancelled-popup-request' ||
        popupErr.code === 'auth/popup-closed-by-user' ||
        popupErr.code === 'auth/popup-blocked'
      ) {
        // Attempt redirect on mobile or if popups are blocked
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile) {
          await signInWithRedirect(auth, provider);
          return null;
        }
        throw new Error('Sign-in window was closed. Please try again and complete the Google login.');
      }
      throw popupErr;
    }

    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    if (!token) {
      throw new Error('Could not obtain Google Drive permissions. Please make sure to check all permission boxes.');
    }

    saveToken(token, 3600);
    const profile = mapFirebaseUser(result.user);
    return { user: profile, accessToken: token };
  } catch (error: any) {
    console.error('Sign in error:', error);
    if (error.code === 'auth/unauthorized-domain') {
      const currentHost = window.location.hostname;
      const projectId = firebaseConfig.projectId;
      throw new Error(
        `Firebase Error (auth/unauthorized-domain): The domain "${currentHost}" is not authorized in Firebase.\n\n` +
        `Add "${currentHost}" to Firebase Console > Authentication > Settings > Authorized domains.`
      );
    }
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  if (cachedAccessToken) return cachedAccessToken;
  const stored = getStoredToken();
  if (stored) {
    cachedAccessToken = stored;
    return stored;
  }
  return null;
};

export const setAccessTokenManually = (token: string | null) => {
  if (token) {
    saveToken(token);
  } else {
    clearStoredToken();
  }
};

export const logout = async () => {
  clearStoredToken();
  await signOut(auth);
};
