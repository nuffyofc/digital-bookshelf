import { getSummaryContentById } from "@/lib/summaries";
import matter from "gray-matter";

export const runtime = "nodejs";

export async function GET(_request, { params }) {
  const { id } = await params;
  const summary = await getSummaryContentById(id);
  if (!summary) {
    return new Response("Not found", { status: 404 });
  }

  const filename = `${summary.id}.md`;
  const body = matter
    .stringify(summary.content, summary.meta)
    .replace(/\r\n/g, "\n");

  return new Response(body, {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
    },
  });
}
