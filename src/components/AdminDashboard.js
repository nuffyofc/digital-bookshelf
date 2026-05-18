"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

function classNames(...items) {
  return items.filter(Boolean).join(" ");
}

function normalizeTags(value) {
  return String(value || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 50)
    .join(", ");
}

export default function AdminDashboard({ initialSummaries }) {
  const [token, setToken] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Business");
  const [tags, setTags] = useState("");
  const [coverColor, setCoverColor] = useState("bg-amber-700");
  const [youtubeUrl, setYoutubeUrl] = useState("");

  const [summaries, setSummaries] = useState(() =>
    Array.isArray(initialSummaries) ? initialSummaries : [],
  );
  const [isLoadingList, setIsLoadingList] = useState(false);

  const canUseAdmin = useMemo(() => token.trim().length > 0, [token]);
  

  async function refreshList() {
    setIsLoadingList(true);
    setError("");
    try {
      const res = await fetch("/api/summaries", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      setSummaries(Array.isArray(json?.summaries) ? json.summaries : []);
    } catch (err) {
      setError(err?.message || "Failed to load summaries");
    } finally {
      setIsLoadingList(false);
    }
  }

  async function onUpload(event) {
    event.preventDefault();
    setStatus("");
    setError("");

    if (!canUseAdmin) {
      setError("Missing admin token");
      return;
    }
    if (!file) {
      setError("Pick a .md file first");
      return;
    }

    const body = new FormData();
    body.set("file", file);
    body.set("title", title);
    body.set("description", description);
    body.set("category", category);
    body.set("tags", normalizeTags(tags));
    body.set("coverColor", coverColor);
    body.set("youtubeUrl", youtubeUrl);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Upload failed (${res.status})`);

      setStatus(`Uploaded: ${json?.record?.title || json?.record?.id || "OK"}`);
      setFile(null);
      setTitle("");
      setDescription("");
      setTags("");
      setYoutubeUrl("");
      await refreshList();
    } catch (err) {
      setError(err?.message || "Upload failed");
    }
  }

  async function onDelete(id) {
    setStatus("");
    setError("");
    if (!canUseAdmin) {
      setError("Missing admin token");
      return;
    }

    const ok = confirm(`Delete "${id}"?`);
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/summaries/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Delete failed (${res.status})`);
      setStatus("Deleted");
      await refreshList();
    } catch (err) {
      setError(err?.message || "Delete failed");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 via-stone-50 to-amber-50 text-stone-900">
      <div className="mx-auto max-w-5xl px-4 py-10 md:px-8">
        <header className="mb-8">
          <Link href="/" className="text-xs font-semibold text-amber-900 hover:underline">
            ← Back to library
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            Upload a Markdown file and tag it. In production, uploads are stored
            in Vercel Blob.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-stone-950">Auth</h2>
            <p className="mt-2 text-sm text-stone-600">
              Set `ADMIN_TOKEN` on Vercel and paste the same value here.
            </p>
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Admin token"
              className="mt-3 w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm shadow-sm outline-none ring-amber-900/20 transition focus:ring-4"
            />
            <button
              type="button"
              onClick={() => {
                setToken("");
              }}
              className="mt-3 text-xs font-semibold text-stone-600 hover:underline"
            >
              Clear token
            </button>
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-stone-950">Upload</h2>
            <form onSubmit={onUpload} className="mt-4 grid gap-3">
              <input
                type="file"
                accept=".md,.markdown,text/markdown"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm shadow-sm"
                required
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Title (optional)"
                  className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm shadow-sm outline-none ring-amber-900/20 transition focus:ring-4"
                />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm shadow-sm outline-none ring-amber-900/20 transition focus:ring-4"
                >
                  {[
                    "Business",
                    "AI",
                    "Money",
                    "Social Media",
                    "Mindset",
                    "Productivity",
                  ].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description (optional)"
                className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm shadow-sm outline-none ring-amber-900/20 transition focus:ring-4"
              />

              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Tags (comma separated)"
                className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm shadow-sm outline-none ring-amber-900/20 transition focus:ring-4"
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={coverColor}
                  onChange={(e) => setCoverColor(e.target.value)}
                  placeholder="Cover color class (e.g. bg-amber-700)"
                  className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm shadow-sm outline-none ring-amber-900/20 transition focus:ring-4"
                />
                <input
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="YouTube URL (optional)"
                  className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm shadow-sm outline-none ring-amber-900/20 transition focus:ring-4"
                />
              </div>

              <button
                disabled={!canUseAdmin}
                className={classNames(
                  "mt-1 rounded-xl px-4 py-3 text-sm font-semibold text-white transition",
                  canUseAdmin ? "bg-stone-900 hover:bg-stone-800" : "bg-stone-400",
                )}
              >
                Upload summary
              </button>

              {status ? (
                <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                  {status}
                </p>
              ) : null}
              {error ? (
                <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">
                  {error}
                </p>
              ) : null}
            </form>
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-sm font-semibold text-stone-950">Summaries</h2>
            <button
              type="button"
              onClick={refreshList}
              className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-50"
            >
              Refresh
            </button>
          </div>

          {isLoadingList ? (
            <p className="mt-4 text-sm text-stone-600">Loading…</p>
          ) : summaries.length === 0 ? (
            <p className="mt-4 text-sm text-stone-600">No summaries yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-stone-200">
              {summaries.map((s) => (
                <li key={s.id} className="flex items-start justify-between gap-4 py-4">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-stone-950">{s.title}</p>
                    <p className="mt-1 text-xs text-stone-600">
                      {s.category || "Uncategorized"}
                      {Array.isArray(s.tags) && s.tags.length > 0
                        ? ` · ${s.tags.join(", ")}`
                        : ""}
                    </p>
                    <div className="mt-2 flex gap-3 text-xs">
                      <a
                        className="font-semibold text-amber-900 hover:underline"
                        href={`/api/summaries/${encodeURIComponent(s.id)}/download`}
                      >
                        Download
                      </a>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={!canUseAdmin}
                    onClick={() => onDelete(s.id)}
                    className={classNames(
                      "rounded-xl px-3 py-2 text-xs font-semibold transition",
                      canUseAdmin
                        ? "border border-red-200 bg-red-50 text-red-900 hover:bg-red-100"
                        : "border border-stone-200 bg-stone-50 text-stone-400",
                    )}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
