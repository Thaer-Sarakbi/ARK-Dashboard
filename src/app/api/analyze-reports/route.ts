import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateObject } from "ai";
import { z } from "zod";
import type { AdminReport } from "@/lib/types";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY ?? "",
});

const analysisSchema = z.object({
  hotels: z.array(
    z.object({
      hotelName: z.string(),
      emptyRooms: z.number().int().min(0),
      staffRooms: z.number().int().min(0),
      occupiedRooms: z.number().int().min(0),
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

If a number isn't mentioned for a category, infer 0. If a hotel name isn't in the report, derive it from the admin's hotel field.

Reports:
${lines}

Return the extracted data for all hotels mentioned in the reports.`;
}

export async function POST(req: Request) {
  try {
    const { reports } = (await req.json()) as { reports: AdminReport[] };

    if (!reports || reports.length === 0) {
      return Response.json({ hotels: [], analysedAt: Date.now() });
    }

    const result = await generateObject({
      model: openrouter("anthropic/claude-sonnet-4-6"),
      schema: analysisSchema,
      prompt: buildPrompt(reports),
    });

    return Response.json({ ...result.object, analysedAt: Date.now() });
  } catch (err) {
    console.error("[analyze-reports]", err);
    return Response.json({ error: "Analysis failed" }, { status: 500 });
  }
}
