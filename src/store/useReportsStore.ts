import { create } from "zustand";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { AdminReport, AnalysisResult } from "@/lib/types";
import { todayKey, yesterdayKey } from "@/lib/utils";

interface ReportsState {
  reports: AdminReport[];
  analysis: AnalysisResult | null;
  loading: boolean;
  analysisLoading: boolean;
  error: string | null;
  lastNotesHash: string;
  subscribeReports: (adminWorkers: { id: string; name: string; placeName: string }[]) => () => void;
  fetchAnalysis: () => Promise<void>;
  clear: () => void;
}

function hashNotes(reports: AdminReport[]): string {
  return reports.map((r) => `${r.userId}:${r.note}`).join("|");
}

// Module-level listener state — lives outside Zustand so it isn't serialized
const activeListeners = new Map<string, () => void>(); // uid → onSnapshot unsub
const yesterdayCache  = new Map<string, AdminReport | null>(); // uid → yesterday report
const reportMap       = new Map<string, AdminReport>(); // uid → active report
let   subscriberCount = 0;

function flushReports(
  get: () => ReportsState,
  set: (s: Partial<ReportsState>) => void
) {
  const reports = Array.from(reportMap.values());
  const hash = hashNotes(reports);
  set({ reports, loading: false });
  if (hash !== get().lastNotesHash) {
    set({ lastNotesHash: hash });
    void get().fetchAnalysis();
  }
}

function teardown() {
  subscriberCount = 0;
  activeListeners.forEach((u) => u());
  activeListeners.clear();
  yesterdayCache.clear();
  reportMap.clear();
}

export const useReportsStore = create<ReportsState>((set, get) => ({
  reports: [],
  analysis: null,
  loading: false,
  analysisLoading: false,
  error: null,
  lastNotesHash: "",

  subscribeReports: (adminWorkers) => {
    if (adminWorkers.length === 0) return () => {};

    subscriberCount++;
    set({ loading: true, error: null });

    for (const worker of adminWorkers) {
      if (activeListeners.has(worker.id)) continue;

      // Register onSnapshot synchronously so it fires immediately on mount.
      // Yesterday is loaded lazily on first no-today-doc snapshot and cached.
      const unsub = onSnapshot(
        doc(db, "users", worker.id, "attendance", todayKey(), "report", "today"),
        async (snap) => {
          if (snap.exists()) {
            const data = snap.data() as { note?: string };
            reportMap.set(worker.id, {
              userId: worker.id,
              workerName: worker.name,
              hotelName: worker.placeName,
              date: todayKey(),
              note: data.note ?? "",
            });
            flushReports(get, set);
          } else {
            // Today's doc doesn't exist — fall back to yesterday (loaded once)
            if (!yesterdayCache.has(worker.id)) {
              try {
                const ySnap = await getDoc(
                  doc(db, "users", worker.id, "attendance", yesterdayKey(), "report", "today")
                );
                yesterdayCache.set(
                  worker.id,
                  ySnap.exists()
                    ? {
                        userId: worker.id,
                        workerName: worker.name,
                        hotelName: worker.placeName,
                        date: yesterdayKey(),
                        note: (ySnap.data() as { note?: string }).note ?? "",
                      }
                    : null
                );
              } catch {
                yesterdayCache.set(worker.id, null);
              }
            }
            const fallback = yesterdayCache.get(worker.id) ?? null;
            if (fallback) reportMap.set(worker.id, fallback);
            else reportMap.delete(worker.id);
            flushReports(get, set);
          }
        },
        (err) => set({ error: err.message, loading: false })
      );

      activeListeners.set(worker.id, unsub);
    }

    return () => {
      subscriberCount--;
      if (subscriberCount <= 0) teardown();
    };
  },

  fetchAnalysis: async () => {
    const { reports } = get();
    if (reports.length === 0) return;

    set({ analysisLoading: true });
    try {
      const res = await fetch("/api/analyze-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reports }),
      });
      if (!res.ok) throw new Error(`Analysis failed: ${res.status}`);
      const data = (await res.json()) as AnalysisResult;
      set({ analysis: data, analysisLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, analysisLoading: false });
    }
  },

  clear: () => {
    teardown();
    set({
      reports: [],
      analysis: null,
      loading: false,
      analysisLoading: false,
      error: null,
      lastNotesHash: "",
    });
  },
}));
