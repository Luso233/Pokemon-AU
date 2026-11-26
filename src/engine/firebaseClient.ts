import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type Auth,
  type User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  getFirestore,
  setDoc,
  type Firestore,
} from 'firebase/firestore';
import type { PlayerSaveProfile } from '../types/game';

export interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
}

const RUNTIME_FB_CONFIG_KEY = 'galar-crown-firebase-config-v1';

export function loadRuntimeFirebaseConfig(): FirebaseWebConfig | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(RUNTIME_FB_CONFIG_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<FirebaseWebConfig>;
    if (parsed.apiKey && parsed.authDomain && parsed.projectId && parsed.appId) {
      return {
        apiKey: parsed.apiKey.trim(),
        authDomain: parsed.authDomain.trim(),
        projectId: parsed.projectId.trim(),
        storageBucket: parsed.storageBucket?.trim() || '',
        messagingSenderId: parsed.messagingSenderId?.trim() || '',
        appId: parsed.appId.trim(),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function saveRuntimeFirebaseConfig(config: FirebaseWebConfig | null): void {
  try {
    if (typeof window === 'undefined') return;
    if (!config) {
      window.localStorage.removeItem(RUNTIME_FB_CONFIG_KEY);
    } else {
      window.localStorage.setItem(RUNTIME_FB_CONFIG_KEY, JSON.stringify(config));
    }
  } catch {
    // ignore storage errors
  }
}

export function getEffectiveFirebaseConfig(): FirebaseWebConfig | null {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> })
    .env;
  if (
    env?.VITE_FIREBASE_API_KEY &&
    env?.VITE_FIREBASE_AUTH_DOMAIN &&
    env?.VITE_FIREBASE_PROJECT_ID &&
    env?.VITE_FIREBASE_APP_ID
  ) {
    return {
      apiKey: env.VITE_FIREBASE_API_KEY,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: env.VITE_FIREBASE_APP_ID,
    };
  }
  return loadRuntimeFirebaseConfig();
}

export function isFirebaseConfigured(): boolean {
  return getEffectiveFirebaseConfig() !== null;
}

let cachedServices: { app: FirebaseApp; auth: Auth; db: Firestore } | null = null;

export function getFirebaseServices(): {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
} | null {
  if (cachedServices) return cachedServices;
  const cfg = getEffectiveFirebaseConfig();
  if (!cfg) return null;
  try {
    const app = getApps().length > 0 ? getApps()[0] : initializeApp(cfg);
    const auth = getAuth(app);
    const db = getFirestore(app);
    cachedServices = { app, auth, db };
    return cachedServices;
  } catch {
    return null;
  }
}

export function resetFirebaseClientCache(): void {
  cachedServices = null;
}

export function subscribeAuthState(
  callback: (user: User | null) => void
): () => void {
  const svc = getFirebaseServices();
  if (!svc) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(svc.auth, callback);
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<User> {
  const svc = getFirebaseServices();
  if (!svc) {
    throw new Error('Firebase no está configurado todavía.');
  }
  const cred = await signInWithEmailAndPassword(svc.auth, email.trim(), password);
  return cred.user;
}

export async function registerWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<User> {
  const svc = getFirebaseServices();
  if (!svc) {
    throw new Error('Firebase no está configurado todavía.');
  }
  const cred = await createUserWithEmailAndPassword(
    svc.auth,
    email.trim(),
    password
  );
  if (displayName.trim()) {
    await updateProfile(cred.user, { displayName: displayName.trim() });
  }
  return cred.user;
}

export async function signInWithGoogle(): Promise<User> {
  const svc = getFirebaseServices();
  if (!svc) {
    throw new Error('Firebase no está configurado todavía.');
  }
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(svc.auth, provider);
  return cred.user;
}

export async function signOutFirebase(): Promise<void> {
  const svc = getFirebaseServices();
  if (!svc) return;
  await signOut(svc.auth);
}

export async function loadCloudProfile(
  uid: string
): Promise<Partial<PlayerSaveProfile> | null> {
  const svc = getFirebaseServices();
  if (!svc) return null;
  const snap = await getDoc(doc(svc.db, 'users', uid));
  if (!snap.exists()) return null;
  return snap.data() as Partial<PlayerSaveProfile>;
}

export async function saveCloudProfile(
  uid: string,
  profile: PlayerSaveProfile
): Promise<void> {
  const svc = getFirebaseServices();
  if (!svc) return;
  let remainingShinies = Math.max(
    0,
    Math.min(6, Math.floor(profile.inventory.shinyCharms))
  );
  const sanitizedTeam = profile.customTeam.slice(0, 6).map((m) => {
    const canBeShiny = Boolean(m.shiny) && remainingShinies > 0;
    if (canBeShiny) remainingShinies -= 1;
    return {
      species: m.species.slice(0, 60),
      item: (m.item || '').slice(0, 60),
      ability: (m.ability || '').slice(0, 60),
      nature: (m.nature || 'Serious').slice(0, 30),
      teraType: (m.teraType || 'Normal').slice(0, 30),
      moves: m.moves.slice(0, 4).map((mv) => mv.slice(0, 40)),
      shiny: canBeShiny,
    };
  });

  const payload = {
    displayName: (profile.displayName || 'Entrenador').slice(0, 80),
    email: (profile.email || '').slice(0, 160),
    coins: Math.max(0, Math.min(10000000, Math.floor(profile.coins))),
    unlockedChapters: Array.from(new Set(profile.unlockedChapters)).slice(0, 60),
    completedChapters: Object.fromEntries(
      Object.entries(profile.completedChapters)
        .slice(0, 60)
        .map(([k, v]) => [
          k,
          {
            completed: Boolean(v.completed),
            victories: Math.max(0, Math.floor(v.victories ?? 0)),
            attempts: Math.max(0, Math.floor(v.attempts ?? 0)),
            bestTurns: typeof v.bestTurns === 'number' ? v.bestTurns : null,
            lastOutcome: v.lastOutcome === 'win' ? 'win' : 'loss',
          },
        ])
    ),
    inventory: {
      pokemon: Array.from(new Set(profile.inventory.pokemon)).slice(0, 200),
      items: Array.from(new Set(profile.inventory.items)).slice(0, 200),
      tms: Array.from(new Set(profile.inventory.tms)).slice(0, 200),
      shinyCharms: Math.max(0, Math.min(6, Math.floor(profile.inventory.shinyCharms))),
    },
    customTeam: sanitizedTeam,
    useCustomTeamInStory: Boolean(profile.useCustomTeamInStory),
    updatedAt: new Date().toISOString().slice(0, 40),
  };

  await setDoc(doc(svc.db, 'users', uid), payload);
}
