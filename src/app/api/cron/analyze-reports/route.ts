import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateObject } from "ai";
import { z } from "zod";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { todayKey } from "@/lib/utils";
import type { AdminReport } from "@/lib/types";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY ?? "",
});

const analysisSchema = z.object({
  hotels: z.array(
    z.object({
      hotelName: z.string(),
      emptyRooms: z.number(),
      staffRooms: z.number(),
      occupiedRooms: z.number(),
      complaints: z.array(
        z.object({
          text: z.string(),
          severity: z.enum(["low", "medium", "high"]),
        })
      ),
    })
  ),
});

function buildPrompt(reports: AdminReport[]): string {
  const lines = reports
    .map((r) => `Hotel: ${r.hotelName}\nAdmin: ${r.workerName}\nDate: ${r.date}\nReport:\n${r.note}`)
    .join("\n\n---\n\n");

  return `You are an operations analyst for a hotel group. Analyze the following daily admin reports and extract structured data.

For each hotel mentioned, determine:
- emptyRooms: number of rooms currently unoccupied/vacant
- staffRooms: number of rooms reserved for staff use
- occupiedRooms: number of rooms occupied by guests
- complaints: list of issues/complaints mentioned, each with a severity (high = urgent/safety, medium = notable issue, low = minor)

If a number isn't mentioned for a category, infer 0.

Reports:
${lines}

Return the extracted data for all hotels mentioned in the reports.`;
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const dateKey = todayKey();

    // Fetch all admin users
    const adminsSnap = await getDocs(query(collection(db, "users"), where("admin", "==", true)));
    if (adminsSnap.empty) {
      return Response.json({ success: true, date: dateKey, message: "No admin users found" });
    }

    // Fetch today's report for each admin
    const reports: AdminReport[] = [];
    await Promise.all(
      adminsSnap.docs.map(async (adminDoc) => {
        const adminData = adminDoc.data();
        const reportSnap = await getDoc(
          doc(db, "users", adminDoc.id, "attendance", dateKey, "report", "today")
        );
        if (reportSnap.exists()) {
          const note = reportSnap.data().note as string | undefined;
          if (note) {
            reports.push({
              userId: adminDoc.id,
              workerName: (adminData.fullName ?? adminData.name ?? "") as string,
              hotelName: (adminData.placeName ?? "") as string,
              date: dateKey,
              note,
            });
          }
        }
      })
    );

    if (reports.length === 0) {
      return Response.json({ success: true, date: dateKey, message: "No reports found for today" });
    }

    // Run AI analysis
    const result = await generateObject({
      model: openrouter("anthropic/claude-sonnet-4-6"),
      schema: analysisSchema,
      prompt: buildPrompt(reports),
    });

    const analyzedAt = new Date();

    // Write room status and complaints to Firestore
    await Promise.all(
      result.object.hotels.map(async (hotel) => {
        // Room status document
        await addDoc(collection(db, "dates", dateKey, "roomStatus"), {
          hotel: hotel.hotelName,
          emptyRooms: hotel.emptyRooms,
          staffRooms: hotel.staffRooms,
          occupiedRooms: hotel.occupiedRooms,
          analyzedAt,
        });

        // Complaint documents
        const adminReport = reports.find((r) => r.hotelName === hotel.hotelName);
        await Promise.all(
          hotel.complaints.map((c) =>
            addDoc(collection(db, "dates", dateKey, "complaints"), {
              text: c.text,
              severity: c.severity,
              hotel: hotel.hotelName,
              submittedBy: adminReport?.workerName ?? "Admin",
              analyzedAt,
            })
          )
        );
      })
    );

    return Response.json({
      success: true,
      date: dateKey,
      hotelsAnalyzed: result.object.hotels.length,
      totalComplaints: result.object.hotels.reduce((s, h) => s + h.complaints.length, 0),
    });
  } catch (err) {
    console.error("[cron/analyze-reports]", err);
    return Response.json({ error: "Analysis failed" }, { status: 500 });
  }
}
