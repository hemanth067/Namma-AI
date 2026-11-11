import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInAnonymously,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocFromServer,
  collection, 
  getDocs, 
  deleteDoc 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { ChatSession } from '../types';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Authentication
export const auth = getAuth(app);

// Initialize Cloud Firestore (using configured firestoreDatabaseId if provided)
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Verify connection on startup per Firebase skill guidelines
async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or network restricted.');
    }
  }
}
testFirestoreConnection();

/**
 * Sign in using Google OAuth Popup
 */
export async function signInWithGoogle(): Promise<FirebaseUser> {
  const result = await signInWithPopup(auth, googleProvider);
  await saveUserProfile(result.user);
  return result.user;
}

/**
 * Sign in using Email and Password
 */
export async function signInWithEmail(email: string, pass: string): Promise<FirebaseUser> {
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  await saveUserProfile(cred.user);
  return cred.user;
}

/**
 * Create new account using Email and Password
 */
export async function signUpWithEmail(email: string, pass: string, name?: string): Promise<FirebaseUser> {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  if (name && cred.user) {
    await updateProfile(cred.user, { displayName: name });
  }
  await saveUserProfile(cred.user);
  return cred.user;
}

/**
 * Continue as Guest (Anonymous Sign-In)
 */
export async function signInAsGuest(): Promise<FirebaseUser> {
  const cred = await signInAnonymously(auth);
  await saveUserProfile(cred.user);
  return cred.user;
}

/**
 * Sign Out
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Save / Update user profile in Firestore (Isolated PII)
 */
export async function saveUserProfile(user: FirebaseUser, preferredLanguage: string = 'english'): Promise<void> {
  if (!user) return;
  try {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || (user.isAnonymous ? 'Guest User' : 'Namma User'),
      photoURL: user.photoURL || '',
      createdAt: new Date().toISOString(),
      preferredLanguage: preferredLanguage
    }, { merge: true });
  } catch (err) {
    console.warn('Notice saving user profile to Firestore:', err);
  }
}

/**
 * Sync chat session to Firestore
 */
export async function syncSessionToFirestore(userId: string, session: ChatSession): Promise<void> {
  if (!userId || !session) return;
  try {
    const sessionRef = doc(db, 'users', userId, 'sessions', session.id);
    await setDoc(sessionRef, {
      id: session.id,
      userId: userId,
      title: session.title,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      messagesJson: JSON.stringify(session.messages)
    }, { merge: true });
  } catch (err) {
    console.warn('Could not sync session to Firestore:', err);
  }
}

/**
 * Fetch all chat sessions for a user from Firestore
 */
export async function fetchUserSessionsFromFirestore(userId: string): Promise<ChatSession[]> {
  if (!userId) return [];
  try {
    const colRef = collection(db, 'users', userId, 'sessions');
    const snap = await getDocs(colRef);
    const sessions: ChatSession[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      let messages = [];
      try {
        messages = data.messagesJson ? JSON.parse(data.messagesJson) : [];
      } catch {
        messages = [];
      }
      sessions.push({
        id: data.id || docSnap.id,
        title: data.title || 'Conversation',
        createdAt: data.createdAt || Date.now(),
        updatedAt: data.updatedAt || Date.now(),
        messages: messages
      });
    });
    return sessions.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (err) {
    console.warn('Could not fetch sessions from Firestore:', err);
    return [];
  }
}

/**
 * Delete a chat session from Firestore
 */
export async function deleteSessionFromFirestore(userId: string, sessionId: string): Promise<void> {
  if (!userId || !sessionId) return;
  try {
    const sessionRef = doc(db, 'users', userId, 'sessions', sessionId);
    await deleteDoc(sessionRef);
  } catch (err) {
    console.warn('Could not delete session from Firestore:', err);
  }
}
