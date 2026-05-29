import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateObject } from "ai";
import { analysisSchema, buildPrompt } from "@/lib/analyzeReports";
import type { AdminReport } from "@/lib/types";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY ?? "",
});

export async function POST(req: Request) {
  try {
    const { reports } = (await req.json()) as { reports: AdminReport[] };
    if (!reports || reports.length === 0) {
      return Response.json({ skipped: true, reason: "no_reports" });
    }

    const result = await generateObject({
      model: openrouter("anthropic/claude-sonnet-4-6"),
      schema: analysisSchema,
      prompt: buildPrompt(reports),
    });

    return Response.json({ success: true, hotels: result.object.hotels });
  } catch (err) {
    console.error("[daily/analyze-reports]", err);
    return Response.json({ error: "Analysis failed" }, { status: 500 });
  }
}
