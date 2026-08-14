import { initializeApp, getApps, getApp } from "firebase/app";
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
// Safely load firebase-applet-config.json if present (e.g., local AI Studio environment)
// without breaking builds when the file is gitignored or missing in CI / GitHub Actions
const rawConfigFiles = import.meta.glob<Record<string, any>>(
  "/firebase-applet-config.json",
  { eager: true }
);

const appletConfig: Record<string, string> =
  rawConfigFiles["/firebase-applet-config.json"]?.default ||
  rawConfigFiles["/firebase-applet-config.json"] ||
  {};

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

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.apiKey.trim() !== ""
);

let app: any = null;
let dbInstance: any = null;
let authInstance: any = null;
let googleProviderInstance: any = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    const dbId = firebaseConfig.firestoreDatabaseId;
    dbInstance = dbId && dbId !== "(default)" ? getFirestore(app, dbId) : getFirestore(app);
    authInstance = getAuth(app);
    googleProviderInstance = new GoogleAuthProvider();
    googleProviderInstance.setCustomParameters({ prompt: "select_account" });
  } catch (err) {
    console.warn("Falha ao inicializar Firebase:", err);
  }
} else {
  console.info("Firebase não configurado ou chave ausente. Aplicação rodando em modo local.");
}

export const db = dbInstance;
export const auth = authInstance;
export const googleProvider = googleProviderInstance;

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
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo:
        auth?.currentUser?.providerData?.map((provider: any) => ({
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
  if (!isFirebaseConfigured || !db) return;
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
  if (!isFirebaseConfigured || !auth || !googleProvider) {
    throw new Error("O Firebase de autenticação não está configurado neste ambiente.");
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err: any) {
    console.error("Erro ao fazer login com Google:", err);
    if (err?.code === "auth/popup-blocked") {
      throw new Error("O popup de login foi bloqueado pelo navegador. Permita popups para este site ou abra em uma nova aba.");
    } else if (err?.code === "auth/popup-closed-by-user" || err?.code === "auth/cancelled-popup-request") {
      throw new Error("A janela de login foi fechada antes de concluir a autenticação.");
    } else if (err?.code === "auth/unauthorized-domain") {
      throw new Error("Domínio não autorizado no Firebase Auth. Abra a aplicação em uma nova aba do navegador.");
    } else if (err?.code === "auth/network-request-failed") {
      throw new Error("Falha na conexão de rede com o Firebase.");
    }
    throw err;
  }
}

export async function logoutFirebase(): Promise<void> {
  if (!isFirebaseConfigured || !auth) return;
  try {
    await signOut(auth);
  } catch (err) {
    console.error("Erro ao fazer logout:", err);
    throw err;
  }
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  if (!isFirebaseConfigured || !auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export async function saveUserDataToFirestore(
  userId: string,
  data: AppData
): Promise<void> {
  if (!isFirebaseConfigured || !db || !userId) return;
  const path = `user_data/${userId}`;
  try {
    const userDocRef = doc(db, "user_data", userId);
    // Sanitize data: remove any undefined values and prevent oversized base64 file payloads from breaking Firestore limit
    const sanitized = JSON.parse(
      JSON.stringify(data, (key, value) => {
        if (value === undefined) return null;
        // If an inline file string exceeds 800KB, omit raw dataURL from Firestore document
        if (typeof value === "string" && value.startsWith("data:") && value.length > 500000) {
          return null;
        }
        return value;
      })
    );

    await setDoc(
      userDocRef,
      {
        userId,
        disciplinas: sanitized.disciplinas || [],
        aulas: sanitized.aulas || [],
        trabalhos: sanitized.trabalhos || [],
        provas: sanitized.provas || [],
        ementas: sanitized.ementas || [],
        horariosAulas: sanitized.horariosAulas || [],
        reposicoes: sanitized.reposicoes || [],
        eventos: sanitized.eventos || [],
        arquivos: sanitized.arquivos || { horarios: null, calendario: null },
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    console.info("⚡ Firestore: dados salvos automaticamente na nuvem.");
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    throw err;
  }
}

export async function fetchFreshUserDataFromFirestore(
  userId: string
): Promise<AppData | null> {
  if (!isFirebaseConfigured || !db || !userId) return null;
  const path = `user_data/${userId}`;
  try {
    const userDocRef = doc(db, "user_data", userId);
    let snap;
    try {
      snap = await getDocFromServer(userDocRef);
    } catch {
      snap = await getDoc(userDocRef);
    }
    if (snap && snap.exists()) {
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
  onUpdate: (data: AppData, hasPendingWrites: boolean) => void,
  onNotFound?: () => void,
  onError?: (err: any) => void
) {
  if (!isFirebaseConfigured || !db || !userId) return () => {};
  const path = `user_data/${userId}`;
  const userDocRef = doc(db, "user_data", userId);
  return onSnapshot(
    userDocRef,
    { includeMetadataChanges: true },
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const hasPendingWrites = snap.metadata.hasPendingWrites;
        onUpdate(
          {
            disciplinas: data.disciplinas || [],
            aulas: data.aulas || [],
            trabalhos: data.trabalhos || [],
            provas: data.provas || [],
            ementas: data.ementas || [],
            horariosAulas: data.horariosAulas || [],
            reposicoes: data.reposicoes || [],
            eventos: data.eventos || [],
            arquivos: data.arquivos || { horarios: null, calendario: null },
          },
          hasPendingWrites
        );
      } else {
        if (onNotFound) {
          onNotFound();
        }
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, path);
      if (onError) onError(err);
    }
  );
}
