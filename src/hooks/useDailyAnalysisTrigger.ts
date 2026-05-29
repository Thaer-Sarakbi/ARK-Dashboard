"use client";

import { useEffect } from "react";
import { collection, getDocs, getDoc, doc, addDoc, query, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthStore } from "@/store/useAuthStore";
import { todayKey } from "@/lib/utils";
import type { AdminReport } from "@/lib/types";

export function useDailyAnalysisTrigger() {
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) return;

    const hour = new Date().getHours();
    if (hour >= 12) return; // only 12:00 AM – 12:00 PM

    const key = `ark_daily_analysis_${todayKey()}`;
    if (localStorage.getItem(key)) return;

    // Set before async work to prevent double-trigger on React StrictMode remount
    localStorage.setItem(key, "1");

    (async () => {
      try {
        const dateKey = todayKey();

        // Skip if already analyzed today
        const existingSnap = await getDocs(
          query(collection(db, "dates", dateKey, "roomStatus"), limit(1))
        );
        if (!existingSnap.empty) return;

        // Fetch all users and filter admins (client is authenticated)
        const usersSnap = await getDocs(collection(db, "users"));
        const adminDocs = usersSnap.docs.filter((d) => !!d.data().admin);
        if (adminDocs.length === 0) return;

        // Fetch today's report for each admin
        const reports: AdminReport[] = [];
        await Promise.all(
          adminDocs.map(async (adminDoc) => {
            const data = adminDoc.data();
            const reportSnap = await getDoc(
              doc(db, "users", adminDoc.id, "attendance", dateKey, "report", "today")
            );
            if (reportSnap.exists()) {
              const note = reportSnap.data().note as string | undefined;
              if (note) {
                reports.push({
                  userId: adminDoc.id,
                  workerName: (data.fullName ?? data.name ?? "") as string,
                  hotelName: (data.placeName ?? "") as string,
                  date: dateKey,
                  note,
                });
              }
            }
          })
        );

        if (reports.length === 0) return;

        // Call API for AI analysis only
        const res = await fetch("/api/daily/analyze-reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reports }),
        });
        if (!res.ok) return;
        const { hotels } = await res.json() as { hotels?: { hotelName: string; emptyRooms: number; staffRooms: number; occupiedRooms: number; complaints: { text: string; severity: string }[] }[] };
        if (!hotels) return;

        // Write results to Firebase (client is authenticated)
        const analyzedAt = new Date();
        await Promise.all(
          hotels.map(async (hotel) => {
            await addDoc(collection(db, "dates", dateKey, "roomStatus"), {
              hotel: hotel.hotelName,
              emptyRooms: hotel.emptyRooms,
              staffRooms: hotel.staffRooms,
              occupiedRooms: hotel.occupiedRooms,
              analyzedAt,
            });

            const report = reports.find((r) => r.hotelName === hotel.hotelName);
            await Promise.all(
              hotel.complaints.map((c) =>
                addDoc(collection(db, "dates", dateKey, "complaints"), {
                  text: c.text,
                  severity: c.severity,
                  hotel: hotel.hotelName,
                  submittedBy: report?.workerName ?? "Admin",
                  analyzedAt,
                })
              )
            );
          })
        );
      } catch (err) {
        console.error("[DailyAnalysis]", err);
      }
    })();
  }, [user]);
}
