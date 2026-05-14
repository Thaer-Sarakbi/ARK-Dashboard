import { create } from "zustand";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Extend this interface to match your Firestore `users/{uid}` document shape
export interface UserProfile {
  name?: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
  role?: string;
  placeName?: string;
  admin?: boolean;
  createdAt?: number;
  [key: string]: unknown;
}

interface UserState {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  subscribe: (uid: string) => () => void;
  clear: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  loading: false,
  error: null,

  subscribe: (uid) => {
    set({ loading: true, error: null });
    const unsubscribe = onSnapshot(
      doc(db, "users", uid),
      (snapshot) => {
        set({
          profile: snapshot.exists() ? (snapshot.data() as UserProfile) : null,
          loading: false,
        });
      },
      (err) => {
        set({ error: err.message, loading: false });
      }
    );
    return unsubscribe;
  },

  clear: () => set({ profile: null, loading: false, error: null }),
}));
