# Blog to EPUB

Turns articles into EPUBs for Apple Books. Two surfaces, one core:

- **Web app** (Next.js, repo root): paste a URL, get an EPUB.
- **Chrome extension** (`extension/`): converts the tab you're reading —
  including pages that need login or client-side rendering, since it captures
  the live DOM. See [`extension/README.md`](extension/README.md).

## Current Scope
- URL input in web UI / one-click convert in the extension
- article extraction (static blogs/articles; live DOM in the extension)
- chapter splitting
- EPUB generation in memory (images embedded)
- direct download in browser
- no persistent generated files

## Repo Structure
- `lib/` - **shared core used by both surfaces**
  - `lib/extract.ts` - article extraction (`extractArticle(url)` for the
    server, `extractArticleFromHtml(html, url)` for the extension)
  - `lib/chapterize.ts` - chapter logic
  - `lib/epub.ts` - EPUB builder
- `app/page.tsx` - web UI and download flow
- `app/api/convert/route.ts` - conversion API endpoint
- `extension/` - Chrome MV3 extension (popup + sandboxed EPUB builder + tests)

The previous Python prototype is kept under `python_backend/` for reference.

## Local Development

Web app:
```bash
npm install
npm run dev
```

Open:
- http://localhost:3000

Chrome extension:
```bash
cd extension
npm install
npm run build        # -> extension/dist (load unpacked in chrome://extensions)
npm test             # core smoke test + headless-Chromium e2e on real articles
```

## Production Build
```bash
npm run build
npm run start
```

## API
- `POST /api/convert`
  - body: `{ "url": "https://..." }`
  - returns: EPUB binary (`application/epub+zip`)

## File Lifetime Behavior
- The frontend uses an object URL for the generated Blob.
- On each new conversion, the previous object URL is revoked.
- Net effect: generated file disappears when user converts another article.

## Timeout Notes (Measured)
Benchmark against:
- `https://darioamodei.com/essay/machines-of-loving-grace`

Measured in production mode:
- first run: ~0.32s
- warm runs: ~0.13s to ~0.15s

This is well below typical serverless timeout limits for static article inputs.
