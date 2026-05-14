import { create } from "zustand";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;

  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  subscribe: () => () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  error: null,

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  signOut: async () => {
    try {
      await signOut(auth);
      set({ user: null });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  // Call once at app root — returns unsubscribe
  subscribe: () => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      set({ user, loading: false });
    });
    return unsubscribe;
  },
}));
