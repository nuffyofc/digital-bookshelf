import { upsertSummaryFromMarkdownUpload } from "@/lib/summaries";

export const runtime = "nodejs";

function isAuthorized(request) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return false;
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : header;
  return token === expected;
}

export async function POST(request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const file = form.get("file");

    if (!file || typeof file.text !== "function") {
      return Response.json({ error: "Missing file" }, { status: 400 });
    }

    const rawMarkdown = await file.text();
    const overrides = {
      title: String(form.get("title") || "").trim() || undefined,
      description: String(form.get("description") || "").trim() || undefined,
      category: String(form.get("category") || "").trim() || undefined,
      tags: String(form.get("tags") || "").trim() || undefined,
      coverColor: String(form.get("coverColor") || "").trim() || undefined,
      youtubeUrl: String(form.get("youtubeUrl") || "").trim() || undefined,
    };

    const result = await upsertSummaryFromMarkdownUpload({
      originalFilename: file.name || "summary.md",
      rawMarkdown,
      overrides,
    });

    return Response.json({ ok: true, record: result.record });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 },
    );
  }
}

