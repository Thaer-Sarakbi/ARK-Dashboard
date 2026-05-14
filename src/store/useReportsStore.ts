import { create } from "zustand";
import { doc, getDoc } from "firebase/firestore";
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
  fetchReports: (adminWorkers: { id: string; name: string; placeName: string }[]) => Promise<void>;
  fetchAnalysis: () => Promise<void>;
  clear: () => void;
}

function hashNotes(reports: AdminReport[]): string {
  return reports.map((r) => `${r.userId}:${r.note}`).join("|");
}

async function getLatestReport(
  uid: string,
  name: string,
  placeName: string
): Promise<AdminReport | null> {
  for (const dateKey of [todayKey(), yesterdayKey()]) {
    const snap = await getDoc(doc(db, "users", uid, "attendance", dateKey, "report", "today"));
    if (snap.exists()) {
      const data = snap.data() as { note?: string };
      return {
        userId: uid,
        workerName: name,
        hotelName: placeName,
        date: dateKey,
        note: data.note ?? "",
      };
    }
  }
  return null;
}

export const useReportsStore = create<ReportsState>((set, get) => ({
  reports: [],
  analysis: null,
  loading: false,
  analysisLoading: false,
  error: null,
  lastNotesHash: "",

  fetchReports: async (adminWorkers) => {
    set({ loading: true, error: null });
    try {
      const results = await Promise.all(
        adminWorkers.map((w) => getLatestReport(w.id, w.name, w.placeName))
      );
      const reports = results.filter(Boolean) as AdminReport[];
      const hash = hashNotes(reports);

      set({ reports, loading: false });

      if (hash !== get().lastNotesHash) {
        set({ lastNotesHash: hash });
        await get().fetchAnalysis();
      }
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
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

  clear: () =>
    set({
      reports: [],
      analysis: null,
      loading: false,
      analysisLoading: false,
      error: null,
      lastNotesHash: "",
    }),
}));
