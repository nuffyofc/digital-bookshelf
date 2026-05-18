import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

import { del, get, put } from "@vercel/blob";

import { slugify } from "@/lib/slugify";

const LOCAL_SUMMARIES_DIR = path.join(
  process.cwd(),
  "src",
  "content",
  "summaries",
);

const BLOB_ACCESS = process.env.BLOB_ACCESS === "private" ? "private" : "public";
const INDEX_PATHNAME = "summaries/_index.json";

function hasBlobToken() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) {
    return tags
      .map((t) => String(t).trim())
      .filter(Boolean)
      .slice(0, 50);
  }
  if (typeof tags === "string") {
    return tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 50);
  }
  return [];
}

export function getLocalSummariesDir() {
  return LOCAL_SUMMARIES_DIR;
}

export async function getAllSummaries() {
  if (hasBlobToken()) {
    const index = await readBlobIndex();
    if (index) return index;
  }
  return readLocalIndex();
}

export async function getSummaryContentById(id) {
  const safeId = slugify(id);
  if (!safeId) return null;

  if (hasBlobToken()) {
    const pathname = `summaries/${safeId}.md`;
    try {
      const result = await get(pathname, { access: BLOB_ACCESS });
      if (result && result.statusCode === 200 && result.stream) {
        const raw = await new Response(result.stream).text();
        const parsed = matter(raw);
        return {
          id: safeId,
          meta: normalizeFrontmatter(parsed.data, safeId),
          content: parsed.content,
        };
      }
    } catch {
      // Fall through to local files
    }
  }

  const fullPath = path.join(LOCAL_SUMMARIES_DIR, `${safeId}.md`);
  if (!fs.existsSync(fullPath)) return null;
  const raw = fs.readFileSync(fullPath, "utf8");
  const parsed = matter(raw);
  return {
    id: safeId,
    meta: normalizeFrontmatter(parsed.data, safeId),
    content: parsed.content,
  };
}

export async function upsertSummaryFromMarkdownUpload({
  originalFilename,
  rawMarkdown,
  overrides,
}) {
  if (!hasBlobToken()) {
    throw new Error("Missing BLOB_READ_WRITE_TOKEN");
  }

  const parsed = matter(rawMarkdown);
  const baseId = slugify(
    overrides?.id || parsed.data?.id || originalFilename || "summary",
  );
  if (!baseId) {
    throw new Error("Invalid id/filename");
  }

  const meta = normalizeFrontmatter(
    {
      ...parsed.data,
      ...overrides,
      id: baseId,
      tags: normalizeTags(overrides?.tags ?? parsed.data?.tags),
      updatedAt: new Date().toISOString(),
    },
    baseId,
  );

  const markdownToStore = matter.stringify(parsed.content, meta);
  const blob = await put(`summaries/${baseId}.md`, markdownToStore, {
    access: BLOB_ACCESS,
    contentType: "text/markdown; charset=utf-8",
    allowOverwrite: true,
  });

  const record = {
    id: baseId,
    title: meta.title,
    description: meta.description ?? "",
    category: meta.category ?? "",
    tags: meta.tags ?? [],
    coverColor: meta.coverColor ?? "",
    youtubeUrl: meta.youtubeUrl ?? "",
    updatedAt: meta.updatedAt,
    pathname: blob.pathname,
    url: blob.url,
    downloadUrl: blob.downloadUrl,
  };

  const nextIndex = await writeBlobIndexUpsert(record);
  return { record, index: nextIndex };
}

export async function deleteSummaryById(id) {
  const safeId = slugify(id);
  if (!safeId) return { deleted: false };

  if (!hasBlobToken()) {
    throw new Error("Missing BLOB_READ_WRITE_TOKEN");
  }

  await del(`summaries/${safeId}.md`);
  const nextIndex = await writeBlobIndexDelete(safeId);
  return { deleted: true, index: nextIndex };
}

function normalizeFrontmatter(data, id) {
  const meta = isRecord(data) ? { ...data } : {};

  meta.id = slugify(meta.id || id);
  meta.title = String(meta.title || titleFromId(meta.id) || "Untitled");
  meta.description = meta.description ? String(meta.description) : "";
  meta.category = meta.category ? String(meta.category) : "";
  meta.tags = normalizeTags(meta.tags);
  meta.coverColor = meta.coverColor ? String(meta.coverColor) : "";
  meta.youtubeUrl = meta.youtubeUrl ? String(meta.youtubeUrl) : "";
  meta.updatedAt = meta.updatedAt
    ? String(meta.updatedAt)
    : new Date().toISOString();

  return meta;
}

function titleFromId(id) {
  return String(id || "")
    .split("-")
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

function readLocalIndex() {
  if (!fs.existsSync(LOCAL_SUMMARIES_DIR)) return [];

  const fileNames = fs
    .readdirSync(LOCAL_SUMMARIES_DIR)
    .filter((name) => name.toLowerCase().endsWith(".md"));

  const summaries = fileNames
    .map((fileName) => {
      const id = slugify(fileName);
      const fullPath = path.join(LOCAL_SUMMARIES_DIR, fileName);
      const raw = fs.readFileSync(fullPath, "utf8");
      const parsed = matter(raw);
      const meta = normalizeFrontmatter(parsed.data, id);
      return {
        id: meta.id,
        title: meta.title,
        description: meta.description ?? "",
        category: meta.category ?? "",
        tags: meta.tags ?? [],
        coverColor: meta.coverColor ?? "",
        youtubeUrl: meta.youtubeUrl ?? "",
        updatedAt: meta.updatedAt,
        pathname: `local:${fileName}`,
        url: null,
        downloadUrl: `/api/summaries/${encodeURIComponent(meta.id)}/download`,
      };
    })
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));

  return summaries;
}

async function readBlobIndex() {
  try {
    const result = await get(INDEX_PATHNAME, { access: BLOB_ACCESS });
    if (!result || result.statusCode !== 200 || !result.stream) return null;

    const text = await new Response(result.stream).text();
    const json = JSON.parse(text);
    const summaries = Array.isArray(json?.summaries) ? json.summaries : [];

    return summaries
      .map((record) => normalizeIndexRecord(record))
      .filter(Boolean)
      .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  } catch {
    return null;
  }
}

function normalizeIndexRecord(record) {
  if (!isRecord(record)) return null;
  const id = slugify(record.id);
  if (!id) return null;

  return {
    id,
    title: String(record.title || titleFromId(id)),
    description: record.description ? String(record.description) : "",
    category: record.category ? String(record.category) : "",
    tags: normalizeTags(record.tags),
    coverColor: record.coverColor ? String(record.coverColor) : "",
    youtubeUrl: record.youtubeUrl ? String(record.youtubeUrl) : "",
    updatedAt: record.updatedAt ? String(record.updatedAt) : "",
    pathname: record.pathname ? String(record.pathname) : `summaries/${id}.md`,
    url: record.url ? String(record.url) : null,
    downloadUrl: record.downloadUrl
      ? String(record.downloadUrl)
      : `/api/summaries/${encodeURIComponent(id)}/download`,
  };
}

async function writeBlobIndexUpsert(record) {
  const existing = (await readBlobIndex()) ?? [];
  const next = existing.filter((r) => r.id !== record.id);
  next.unshift(record);
  await put(INDEX_PATHNAME, JSON.stringify({ version: 1, summaries: next }), {
    access: BLOB_ACCESS,
    contentType: "application/json; charset=utf-8",
    allowOverwrite: true,
  });
  return next;
}

async function writeBlobIndexDelete(id) {
  const existing = (await readBlobIndex()) ?? [];
  const next = existing.filter((r) => r.id !== id);
  await put(INDEX_PATHNAME, JSON.stringify({ version: 1, summaries: next }), {
    access: BLOB_ACCESS,
    contentType: "application/json; charset=utf-8",
    allowOverwrite: true,
  });
  return next;
}

