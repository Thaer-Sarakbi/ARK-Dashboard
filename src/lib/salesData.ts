import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { SalesDoc } from "@/lib/types";

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const n = Number(value.replace(/,/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export async function fetchHotelList(): Promise<string[]> {
  const usersSnap = await getDocs(collection(db, "users"));
  return Array.from(
    new Set(
      usersSnap.docs
        .map((d) => (d.data().placeName ?? "") as string)
        .filter(Boolean)
    )
  ).sort();
}

export async function fetchSalesForDate(dateKey: string, hotels: string[]): Promise<SalesDoc[]> {
  const results = await Promise.all(
    hotels.map(async (hotel) => {
      const snap = await getDoc(doc(db, "sales", dateKey, hotel, "today"));
      if (!snap.exists()) return null;
      const data = snap.data();
      return {
        hotel,
        totalSales: toNumber(data.totalSales),
        totalExpenses: toNumber(data.totalExpenses),
        banking: toNumber(data.banking),
        emptyRooms: toNumber(data.emptyRooms),
        onlineBooking: toNumber(data.onlineBooking),
        by: typeof data.by === "string" ? data.by : "",
      } satisfies SalesDoc;
    })
  );

  return results.filter((r): r is SalesDoc => r !== null);
}
