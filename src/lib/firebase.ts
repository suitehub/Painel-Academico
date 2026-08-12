import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  getDocFromServer,
} from "firebase/firestore";
// Safely load firebase-applet-config.json if available without breaking Vite build if missing
const rawConfigFiles = import.meta.glob<{ default: Record<string, string> }>(
  "../../firebase-applet-config.json",
  { eager: true }
);

const appletConfig = Object.values(rawConfigFiles)[0]?.default || {};

export const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || appletConfig.projectId || "confirma-ebfc3",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || appletConfig.appId || "1:261676539561:web:b9416709976629f613d3b8",
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || appletConfig.apiKey || "AIzaSyBPtNVslidmNWtzgupihOgFk8a5AgAwhA8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || appletConfig.authDomain || "confirma-ebfc3.firebaseapp.com",
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || appletConfig.firestoreDatabaseId || "ai-studio-painelacadmico-1fef0d27-e056-4053-af54-b7e3dee6aee6",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || appletConfig.storageBucket || "confirma-ebfc3.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || appletConfig.messagingSenderId || "261676539561",
};

import { AppData } from "../types";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("the client is offline")
    ) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

// Call testConnection on load
testConnection();

export async function loginWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err) {
    console.error("Erro ao fazer login com Google:", err);
    throw err;
  }
}

export async function logoutFirebase(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.error("Erro ao fazer logout:", err);
    throw err;
  }
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function saveUserDataToFirestore(
  userId: string,
  data: AppData
): Promise<void> {
  const path = `user_data/${userId}`;
  try {
    const userDocRef = doc(db, "user_data", userId);
    await setDoc(userDocRef, {
      userId,
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function loadUserDataFromFirestore(
  userId: string
): Promise<AppData | null> {
  const path = `user_data/${userId}`;
  try {
    const userDocRef = doc(db, "user_data", userId);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        disciplinas: data.disciplinas || [],
        aulas: data.aulas || [],
        trabalhos: data.trabalhos || [],
        provas: data.provas || [],
        ementas: data.ementas || [],
        horariosAulas: data.horariosAulas || [],
        reposicoes: data.reposicoes || [],
        eventos: data.eventos || [],
        arquivos: data.arquivos || { horarios: null, calendario: null },
      };
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return null;
  }
}

export function subscribeUserDataFromFirestore(
  userId: string,
  onUpdate: (data: AppData) => void,
  onError?: (err: any) => void
) {
  const path = `user_data/${userId}`;
  const userDocRef = doc(db, "user_data", userId);
  return onSnapshot(
    userDocRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        onUpdate({
          disciplinas: data.disciplinas || [],
          aulas: data.aulas || [],
          trabalhos: data.trabalhos || [],
          provas: data.provas || [],
          ementas: data.ementas || [],
          horariosAulas: data.horariosAulas || [],
          reposicoes: data.reposicoes || [],
          eventos: data.eventos || [],
          arquivos: data.arquivos || { horarios: null, calendario: null },
        });
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, path);
      if (onError) onError(err);
    }
  );
}
