# Blog to EPUB — Chrome Extension

Converts the article in the current tab into an EPUB, entirely on-device.
Reuses the exact same core pipeline as the web app (`../lib`): extract →
chapterize → build EPUB.

Because it captures the **live DOM** of the tab (not a server-side fetch), it
also works on pages that need login or client-side rendering — the web app
can't do that.

## How it works

| Piece | Where it runs | Why |
| --- | --- | --- |
| `popup.js` | Extension popup | Captures the tab DOM (`chrome.scripting`), runs `lib/extract` + `lib/chapterize`, inlines article images as data URLs (popup fetch is CORS-exempt via host permissions) |
| `sandbox.js` | Sandboxed page (`sandbox.html`, hidden iframe) | Runs `lib/epub` (epub-gen-memory). Its template engine needs `new Function`, which MV3 CSP forbids in normal extension pages — sandboxed pages allow it |
| `background.js` | Service worker | No-op; gives tests a discoverable extension ID |

The popup and sandbox talk over `postMessage`; the finished EPUB is saved via
`chrome.downloads`.

## Build

```bash
cd extension
npm install
npm run build        # bundles src/ + copies static files into dist/
```

## Install in Chrome

1. Open `chrome://extensions`
2. Enable "Developer mode"
3. "Load unpacked" → select `extension/dist`
4. Open any article, click the extension icon, "Create EPUB"

## Tests

```bash
npm run test:smoke   # core pipeline (both extraction paths) against real articles
npm run test:e2e     # loads dist/ into headless Chromium, drives the popup,
                     # validates the downloaded EPUBs (incl. embedded images)
npm test             # both
```

The e2e run leaves the generated `.epub` files in `test-output/` if you want
to open them in Apple Books.

## Regenerate icons

```bash
npm run icons
```
