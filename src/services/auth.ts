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
  'https://www.googleapis.com/auth/drive',
];

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'consent select_account',
  access_type: 'offline',
});

// Flag to indicate if we are in the middle of a sign-in flow.
let isSigningIn = false;

// Persist the access token across browser refreshes / back-and-forth navigation
const STORAGE_KEY_TOKEN = 'omnichat_drive_token';
const STORAGE_KEY_TOKEN_EXPIRY = 'omnichat_drive_token_expiry';

// Load stored token if not expired (tokens usually last 1 hour)
const getStoredToken = (): string | null => {
  try {
    const token = localStorage.getItem(STORAGE_KEY_TOKEN);
    const expiry = localStorage.getItem(STORAGE_KEY_TOKEN_EXPIRY);
    if (token && expiry) {
      const expTime = parseInt(expiry, 10);
      // Give a 2-minute safety window
      if (Date.now() < expTime - 120000) {
        return token;
      }
    }
    return token; // fallback to token even if near expiry
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
  // Check if returning from a mobile redirect sign-in
  getRedirectResult(auth)
    .then((result) => {
      if (result) {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential?.accessToken) {
          saveToken(credential.accessToken, 3600);
          if (onAuthSuccess) {
            onAuthSuccess(mapFirebaseUser(result.user), credential.accessToken);
          }
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
      } else if (!isSigningIn) {
        // User is logged into Firebase, but Drive token is missing.
        // Keep user logged in with their profile, but signal auth state
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
  try {
    isSigningIn = true;
    let result;
    try {
      result = await signInWithPopup(auth, provider);
    } catch (popupErr: any) {
      // If popup was blocked by mobile browser or closed by user, try redirect or give clear message
      if (
        popupErr.code === 'auth/popup-closed-by-user' ||
        popupErr.code === 'auth/popup-blocked' ||
        popupErr.code === 'auth/cancelled-popup-request'
      ) {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile) {
          // On mobile devices, redirect flow works 100% reliably without popups
          await signInWithRedirect(auth, provider);
          return null;
        }
        throw new Error('Sign-in popup was closed or blocked. Please allow popups for this site or try again.');
      }
      throw popupErr;
    }

    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get Google Drive access token from authentication.');
    }

    saveToken(credential.accessToken, 3600);
    const profile = mapFirebaseUser(result.user);
    return { user: profile, accessToken: credential.accessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    if (error.code === 'auth/unauthorized-domain') {
      const currentHost = window.location.hostname;
      const projectId = firebaseConfig.projectId;
      throw new Error(
        `Firebase Error (auth/unauthorized-domain): The domain "${currentHost}" is not authorized in Firebase.\n\n` +
        `Fix in 1 minute:\n` +
        `1. Open: https://console.firebase.google.com/project/${projectId}/authentication/settings\n` +
        `2. Go to "Authorized domains" and click "Add domain".\n` +
        `3. Enter: ${currentHost}\n` +
        `4. Also in Google Cloud Console, ensure your JavaScript Origin is: ${window.location.origin} (with NO trailing slash).`
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
