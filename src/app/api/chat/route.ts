import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText, convertToModelMessages } from "ai";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY ?? "",
});

interface DashboardContext {
  presentCount?: number;
  absentCount?: number;
  lateCount?: number;
  openComplaints?: number;
  totalEmptyRooms?: number;
  activeTasks?: number;
  overdueTasks?: number;
}

function buildSystemPrompt(ctx: DashboardContext): string {
  return `You are an AI operations assistant for a hotel group operations manager in Malaysia. You help the manager understand their team's daily performance and operational status.

Current operational data (live):
- Workers present today: ${ctx.presentCount ?? 0}
- Workers absent today: ${ctx.absentCount ?? 0}
- Workers late today: ${ctx.lateCount ?? 0}
- Open complaints: ${ctx.openComplaints ?? 0}
- Empty rooms across all hotels: ${ctx.totalEmptyRooms ?? 0}
- Active tasks: ${ctx.activeTasks ?? 0}
- Overdue tasks: ${ctx.overdueTasks ?? 0}

Answer questions concisely and professionally. If asked about something not in your data, say you don't have that information available right now. Keep responses under 3 sentences unless more detail is specifically requested.`;
}

export async function POST(req: Request) {
  try {
    const { messages, context } = await req.json();

    const result = streamText({
      model: openrouter("anthropic/claude-sonnet-4-6"),
      system: buildSystemPrompt(context ?? {}),
      messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  } catch (err) {
    console.error("[chat]", err);
    return Response.json({ error: "Chat failed" }, { status: 500 });
  }
}
