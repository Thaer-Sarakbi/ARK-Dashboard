import { todayKey } from "@/lib/utils";
import { fetchAdminReports, runAnalysisAndPersist } from "@/lib/analyzeReports";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const dateKey = todayKey();

    const reports = await fetchAdminReports(dateKey);
    if (reports.length === 0) {
      return Response.json({ success: true, date: dateKey, message: "No reports found for today" });
    }

    const counts = await runAnalysisAndPersist(dateKey, reports);
    return Response.json({ success: true, date: dateKey, ...counts });
  } catch (err) {
    console.error("[cron/analyze-reports]", err);
    return Response.json({ error: "Analysis failed" }, { status: 500 });
  }
}
