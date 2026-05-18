import { getAllSummaries } from "@/lib/summaries";

export const runtime = "nodejs";

export async function GET() {
  const summaries = await getAllSummaries();
  return Response.json({ summaries });
}

