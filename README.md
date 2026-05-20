**🔗 Live:** [https://digital-bookshelf-opal.vercel.app/](https://digital-bookshelf-opal.vercel.app/)

## Digital Bookshelf

A visually clean, searchable library of Markdown summaries with:

- Public library with search + category filter + grid/list view
- Summary reader modal (Markdown rendered with `react-markdown`)
- Downloads (`.md`)
- Admin upload + delete (Vercel Blob)

## How to use

- Browse summaries, click a card to open the reader modal.
- Click **Download .md** to save the raw Markdown file.
- Each summary can link to a YouTube video via the `youtubeUrl` field.

> **⚠️ Important:** Only clean YouTube video URLs work.  
> Playlist URLs (containing `list` in the link) are **not supported**.  
> ✅ Use: `https://youtube.com/watch?v=XXXXXXXXXXX`  
> ❌ Do NOT use: `https://youtube.com/watch?v=XXX&list=PLxxx...`

## Getting Started

Install deps and start the dev server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Content (local)

Drop `.md` files into `src/content/summaries/`.

Frontmatter example:

```md
---
title: My Summary
description: 1-2 sentence description.
youtubeUrl: https://youtube.com/watch?v=XXXXXXXXXXX
videoId: XXXXXXXXXXX
duration: 18:32
publishedAt: 2026-05-15
author: Speaker Name
authorUrl: https://youtube.com/@channel
category: Business
tags:
  - entrepreneurship
  - marketing
topics:
  - Business Strategy
  - Personal Development
coverColor: bg-amber-700
updatedAt: 2026-05-18
---
```

## Admin uploads (Vercel Blob)

The admin UI lives at `/admin`. Uploads require:

- `ADMIN_TOKEN` (set in Vercel env vars; keep it secret)
- `BLOB_READ_WRITE_TOKEN` (created automatically when you connect a Vercel Blob store)
- Optional: `BLOB_ACCESS=public` (default) or `private`

Local dev with the same env vars:

```bash
vercel env pull .env.local
```

## Deploy

1. Push this repo to GitHub.
2. Import the GitHub repo into Vercel.
3. In Vercel -> Project -> Storage, create a Blob store and connect it.
4. Add `ADMIN_TOKEN` in Vercel -> Project -> Environment Variables.

After that, uploads from `/admin` will be stored in Blob and show up in the public library.

---

Built with Next.js + Tailwind.
