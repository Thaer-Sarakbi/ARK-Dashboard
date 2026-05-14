import { create } from "zustand";
import {
  collection,
  onSnapshot,
  query,
  type DocumentData,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface CollectionState<T> {
  docs: (T & { id: string })[];
  loading: boolean;
  error: string | null;
  // Pass Firestore query constraints: where(), orderBy(), limit(), etc.
  subscribe: (...constraints: QueryConstraint[]) => () => void;
  clear: () => void;
}

/**
 * Factory that creates a typed Zustand store for a Firestore collection.
 *
 * Usage:
 *   const useProjectsStore = createCollectionStore<Project>("projects");
 *
 *   // In a component or FirebaseProvider:
 *   const unsub = useProjectsStore.getState().subscribe(
 *     where("ownerId", "==", uid),
 *     orderBy("createdAt", "desc"),
 *   );
 */
export function createCollectionStore<T extends DocumentData>(collectionPath: string) {
  return create<CollectionState<T>>((set) => ({
    docs: [],
    loading: false,
    error: null,

    subscribe: (...constraints) => {
      set({ loading: true, error: null });
      const ref = collection(db, collectionPath);
      const q = constraints.length ? query(ref, ...constraints) : query(ref);
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const docs = snapshot.docs.map(
            (d) => ({ id: d.id, ...d.data() } as T & { id: string })
          );
          set({ docs, loading: false });
        },
        (err) => {
          set({ error: err.message, loading: false });
        }
      );
      return unsubscribe;
    },

    clear: () => set({ docs: [], loading: false, error: null }),
  }));
}
