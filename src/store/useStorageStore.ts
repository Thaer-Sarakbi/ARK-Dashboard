import { create } from "zustand";
import {
  ref,
  getDownloadURL,
  listAll,
  list,
  type ListResult,
  type StorageReference,
} from "firebase/storage";
import { storage } from "@/lib/firebase";

export interface StorageItem {
  name: string;
  fullPath: string;
  url: string | null; // populated after fetchUrl is called
}

interface StorageState {
  // Cached download URLs keyed by storage path
  urls: Record<string, string>;
  // Cached folder listings keyed by storage path
  folders: Record<string, StorageItem[]>;
  loading: boolean;
  error: string | null;

  // Fetch and cache a single file's download URL
  fetchUrl: (path: string) => Promise<string | null>;

  // List all items directly inside a folder path, optionally fetching their URLs
  listFolder: (path: string, options?: { fetchUrls?: boolean }) => Promise<StorageItem[]>;

  // Paginated listing — returns the raw ListResult so callers can handle page tokens
  listFolderPaged: (
    path: string,
    options?: { maxResults?: number; pageToken?: string }
  ) => Promise<ListResult>;

  clear: () => void;
}

export const useStorageStore = create<StorageState>((set, get) => ({
  urls: {},
  folders: {},
  loading: false,
  error: null,

  fetchUrl: async (path) => {
    const cached = get().urls[path];
    if (cached) return cached;

    set({ loading: true, error: null });
    try {
      const url = await getDownloadURL(ref(storage, path));
      set((s) => ({ urls: { ...s.urls, [path]: url }, loading: false }));
      return url;
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      return null;
    }
  },

  listFolder: async (path, options = {}) => {
    set({ loading: true, error: null });
    try {
      const folderRef: StorageReference = ref(storage, path);
      const result = await listAll(folderRef);

      const items: StorageItem[] = result.items.map((item) => ({
        name: item.name,
        fullPath: item.fullPath,
        url: null,
      }));

      if (options.fetchUrls) {
        const urls = await Promise.all(
          result.items.map((item) => getDownloadURL(item).catch(() => null))
        );
        urls.forEach((url, i) => {
          items[i].url = url;
        });
        // Merge resolved URLs into the url cache
        set((s) => {
          const merged = { ...s.urls };
          items.forEach((item) => {
            if (item.url) merged[item.fullPath] = item.url;
          });
          return { urls: merged };
        });
      }

      set((s) => ({
        folders: { ...s.folders, [path]: items },
        loading: false,
      }));
      return items;
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      return [];
    }
  },

  listFolderPaged: async (path, options = {}) => {
    set({ loading: true, error: null });
    try {
      const result = await list(ref(storage, path), {
        maxResults: options.maxResults ?? 20,
        pageToken: options.pageToken,
      });
      set({ loading: false });
      return result;
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  clear: () => set({ urls: {}, folders: {}, loading: false, error: null }),
}));
