import { getSummaryContentById } from "@/lib/summaries";

export const runtime = "nodejs";

export async function GET(_request, { params }) {
  const { id } = await params;
  const summary = await getSummaryContentById(id);
  if (!summary) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json(summary);
}

