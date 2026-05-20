"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const DEFAULT_CATEGORIES = [
  "Business",
  "AI",
  "Money",
  "Social Media",
  "Mindset",
  "Productivity",
];

function uniqSorted(values) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  );
}

function classNames(...items) {
  return items.filter(Boolean).join(" ");
}

function InfoButton() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-8 w-8 items-center justify-center rounded-xl border border-stone-200 bg-white text-xs font-semibold text-stone-500 transition hover:bg-stone-50"
        title="Info"
      >
        ?
      </button>
      {open && (
        <div className="absolute bottom-full right-0 z-10 mb-2 w-72 rounded-xl border border-stone-200 bg-white p-3 text-xs leading-5 text-stone-600 shadow-lg">
          <p className="font-semibold text-stone-800">How to use &amp; URL notes</p>
          <p className="mt-1">
            If a summary has a YouTube video attached, paste the link into the{" "}
            <code className="rounded bg-stone-100 px-1">youtubeUrl</code> field.
          </p>
          <p className="mt-1">
            <span className="font-semibold text-amber-800">Important:</span>{" "}
            Playlist URLs (containing <code className="rounded bg-stone-100 px-1">list</code> in the link){" "}
            <span className="font-semibold">will not work</span>. Only clean video
            URLs work (e.g. <code className="rounded bg-stone-100 px-1">youtube.com/watch?v=XXXXX</code>).
          </p>
        </div>
      )}
    </div>
  );
}

export default function Bookshelf({ initialSummaries }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [view, setView] = useState("grid"); // grid | list

  const [selected, setSelected] = useState(null);
  const [selectedContent, setSelectedContent] = useState("");
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [contentError, setContentError] = useState("");
  const openRequestRef = useRef(0);

  const categories = useMemo(() => {
    const fromData = uniqSorted(
      initialSummaries.map((s) => String(s.category || "").trim()),
    );
    const combined = uniqSorted([...DEFAULT_CATEGORIES, ...fromData]);
    return ["All", ...combined.filter((c) => c !== "All")];
  }, [initialSummaries]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return initialSummaries.filter((s) => {
      const matchesCategory =
        category === "All" ||
        String(s.category || "").toLowerCase() === category.toLowerCase();

      if (!matchesCategory) return false;
      if (!q) return true;

      const haystack = [
        s.title,
        s.description,
        s.category,
        ...(Array.isArray(s.tags) ? s.tags : []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [initialSummaries, query, category]);

  async function openSummary(summary) {
    const requestId = (openRequestRef.current += 1);
    setSelected(summary);
    setIsLoadingContent(true);
    setContentError("");
    setSelectedContent("");

    try {
      const res = await fetch(`/api/summaries/${encodeURIComponent(summary.id)}`);
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(payload?.error || `Failed to load (${res.status})`);
      }

      if (openRequestRef.current !== requestId) return;
      setSelectedContent(payload?.content || "");
    } catch (err) {
      if (openRequestRef.current !== requestId) return;
      setContentError(err?.message || "Failed to load summary");
    } finally {
      if (openRequestRef.current !== requestId) return;
      setIsLoadingContent(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 via-stone-50 to-amber-50 text-stone-900">
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-8">
        <header className="mb-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-900/70">
                Digital Bookshelf
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950 md:text-4xl">
                Your Markdown Summary Library
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
                Search, filter by topic, then open and download summaries as
                clean Markdown files.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search titles, tags, topics…"
                  className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm shadow-sm outline-none ring-amber-900/20 transition focus:ring-4 sm:w-[320px]"
                />
              </div>

              <div className="flex gap-2">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="rounded-xl border border-stone-200 bg-white px-3 py-3 text-sm shadow-sm outline-none ring-amber-900/20 transition focus:ring-4"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <div className="flex overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() => setView("grid")}
                    className={classNames(
                      "px-3 py-3 text-sm transition",
                      view === "grid"
                        ? "bg-stone-900 text-white"
                        : "text-stone-700 hover:bg-stone-50",
                    )}
                    aria-pressed={view === "grid"}
                  >
                    Grid
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("list")}
                    className={classNames(
                      "px-3 py-3 text-sm transition",
                      view === "list"
                        ? "bg-stone-900 text-white"
                        : "text-stone-700 hover:bg-stone-50",
                    )}
                    aria-pressed={view === "list"}
                  >
                    List
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <p className="text-xs text-stone-600">
              Showing <span className="font-semibold">{filtered.length}</span>{" "}
              of <span className="font-semibold">{initialSummaries.length}</span>
            </p>
            <Link href="/admin" className="text-xs font-semibold text-amber-900 hover:underline">
              Admin →
            </Link>
          </div>
        </header>

        <main>
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-stone-600">
              No summaries match your search.
            </div>
          ) : view === "grid" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => openSummary(s)}
                  className="group relative overflow-hidden rounded-2xl border border-stone-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-amber-200/40 blur-2xl transition group-hover:bg-amber-300/50" />

                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                        {s.category || "Uncategorized"}
                      </p>
                      <h2 className="mt-2 line-clamp-2 text-lg font-semibold leading-6 text-stone-950">
                        {s.title}
                      </h2>
                    </div>
                    <div
                      className={classNames(
                        "h-12 w-3 shrink-0 rounded-full border border-black/10 shadow-inner",
                        s.coverColor || "bg-amber-700",
                      )}
                      aria-hidden="true"
                      title={s.coverColor || "bg-amber-700"}
                    />
                  </div>

                  {s.description ? (
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-stone-600">
                      {s.description}
                    </p>
                  ) : (
                    <p className="mt-3 text-sm leading-6 text-stone-500">
                      Open summary →
                    </p>
                  )}

                  {Array.isArray(s.tags) && s.tags.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {s.tags.slice(0, 5).map((t) => (
                        <span
                          key={`${s.id}:${t}`}
                          className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-semibold text-stone-700"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </button>
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
              <ul className="divide-y divide-stone-200">
                {filtered.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => openSummary(s)}
                      className="flex w-full items-start gap-4 p-4 text-left transition hover:bg-stone-50"
                    >
                      <div
                        className={classNames(
                          "mt-1 h-10 w-2 rounded-full",
                          s.coverColor || "bg-amber-700",
                        )}
                        aria-hidden="true"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-4">
                          <p className="truncate font-semibold text-stone-950">
                            {s.title}
                          </p>
                          <p className="shrink-0 text-xs font-semibold text-stone-500">
                            {s.category || "Uncategorized"}
                          </p>
                        </div>
                        {s.description ? (
                          <p className="mt-1 line-clamp-1 text-sm text-stone-600">
                            {s.description}
                          </p>
                        ) : null}
                        {Array.isArray(s.tags) && s.tags.length > 0 ? (
                          <p className="mt-2 line-clamp-1 text-xs text-stone-500">
                            {s.tags.slice(0, 8).join(" · ")}
                          </p>
                        ) : null}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </main>
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-sm">
          <div className="animate-fadeIn relative w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-stone-200 p-5">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  {selected.category || "Uncategorized"}
                </p>
                <h3 className="mt-1 truncate text-xl font-semibold text-stone-950">
                  {selected.title}
                </h3>
                {Array.isArray(selected.tags) && selected.tags.length > 0 ? (
                  <p className="mt-2 text-xs text-stone-600">
                    {selected.tags.join(" · ")}
                  </p>
                ) : null}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <a
                  href={`/api/summaries/${encodeURIComponent(selected.id)}/download`}
                  className="rounded-xl bg-stone-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-stone-800"
                >
                  Download .md
                </a>
                <InfoButton />
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-50"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="max-h-[75vh] overflow-y-auto p-5">
              {isLoadingContent ? (
                <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">
                  Loading…
                </div>
              ) : contentError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                  {contentError}
                </div>
              ) : (
                <article className="prose prose-stone max-w-none prose-headings:scroll-mt-24 prose-headings:font-semibold prose-headings:text-stone-950 prose-a:text-amber-900 prose-a:no-underline hover:prose-a:underline prose-code:rounded prose-code:bg-stone-100 prose-code:px-1 prose-code:py-0.5">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {selectedContent}
                  </ReactMarkdown>
                </article>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
