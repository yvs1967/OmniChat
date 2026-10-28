import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
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
// Cache the access token strictly in memory as required by Workspace integration guidelines.
let cachedAccessToken: string | null = null;

// Initialize auth state listener.
export const initAuth = (
  onAuthSuccess?: (user: UserProfile, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) {
          onAuthSuccess(mapFirebaseUser(user), cachedAccessToken);
        }
      } else if (!isSigningIn) {
        // If user is logged in to Firebase but token expired/lost from memory,
        // we prompt re-sign in or attempt silent re-auth
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
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
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get Google Drive access token from authentication.');
    }

    cachedAccessToken = credential.accessToken;
    const profile = mapFirebaseUser(result.user);
    return { user: profile, accessToken: cachedAccessToken };
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
  return cachedAccessToken;
};

export const setAccessTokenManually = (token: string | null) => {
  cachedAccessToken = token;
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};
