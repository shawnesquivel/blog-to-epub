import { chapterize, type Chapter } from "../../lib/chapterize";
import { extractArticleFromHtml, type ExtractedArticle } from "../../lib/extract";

const titleEl = document.getElementById("page-title") as HTMLDivElement;
const hostEl = document.getElementById("page-host") as HTMLDivElement;
const convertBtn = document.getElementById("convert") as HTMLButtonElement;
const statusEl = document.getElementById("status") as HTMLDivElement;
const sandboxFrame = document.getElementById("epub-sandbox") as HTMLIFrameElement;

type PageCapture = { html: string; url: string; title: string };

function isHttpUrl(url: string | undefined): url is string {
  return !!url && (url.startsWith("http://") || url.startsWith("https://"));
}

function setStatus(state: "idle" | "working" | "done" | "error", message: string) {
  statusEl.dataset.state = state;
  statusEl.textContent = message;
  statusEl.className = state === "error" ? "error" : state === "done" ? "success" : "";
}

/**
 * Resolve the tab to convert. Normally the active tab; a `?tabId=` query
 * param overrides it (used by the e2e tests and when popup.html is opened
 * as a regular tab, where the "active tab" would be the popup itself).
 */
async function resolveTargetTab(): Promise<chrome.tabs.Tab | null> {
  const param = new URLSearchParams(location.search).get("tabId");
  if (param) {
    const tabId = Number(param);
    if (!Number.isNaN(tabId)) {
      try {
        return await chrome.tabs.get(tabId);
      } catch {
        return null;
      }
    }
  }

  const [active] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (active && isHttpUrl(active.url)) return active;

  // Popup opened as a full tab: fall back to the most recently used http(s) tab.
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const candidates = tabs
    .filter((tab) => isHttpUrl(tab.url) && tab.id !== undefined)
    .sort((a, b) => (b.lastAccessed ?? 0) - (a.lastAccessed ?? 0));
  return candidates[0] ?? null;
}

function capturePage(): PageCapture {
  return {
    html: document.documentElement.outerHTML,
    url: location.href,
    title: document.title,
  };
}

// --- EPUB build via the sandboxed page --------------------------------------
// epub-gen-memory needs `new Function` (ejs), which extension-page CSP blocks.
// The build runs inside sandbox.html instead, with postMessage plumbing here.

function sandboxWindow(): Window {
  const win = sandboxFrame.contentWindow;
  if (!win) throw new Error("EPUB builder frame is not available.");
  return win;
}

async function waitForSandboxReady(timeoutMs = 5_000): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const deadline = setTimeout(() => {
      cleanup();
      reject(new Error("EPUB builder did not start."));
    }, timeoutMs);

    const pinger = setInterval(() => {
      try {
        sandboxWindow().postMessage({ type: "ping" }, "*");
      } catch {}
    }, 100);

    function onMessage(event: MessageEvent) {
      if (event.source !== sandboxFrame.contentWindow) return;
      if ((event.data as { type?: string } | null)?.type !== "pong") return;
      cleanup();
      resolve();
    }

    function cleanup() {
      clearTimeout(deadline);
      clearInterval(pinger);
      window.removeEventListener("message", onMessage);
    }

    window.addEventListener("message", onMessage);
  });
}

let nextBuildId = 1;

type BuildReply = {
  type?: string;
  id?: number;
  ok?: boolean;
  buffer?: ArrayBuffer;
  filename?: string;
  error?: string;
};

function buildEpubInSandbox(
  article: ExtractedArticle,
  chapters: Chapter[],
  timeoutMs = 60_000
): Promise<{ bytes: Uint8Array; filename: string }> {
  const id = nextBuildId++;
  return new Promise((resolve, reject) => {
    const deadline = setTimeout(() => {
      cleanup();
      reject(new Error("EPUB build timed out."));
    }, timeoutMs);

    function onMessage(event: MessageEvent) {
      if (event.source !== sandboxFrame.contentWindow) return;
      const data = event.data as BuildReply | null;
      if (!data || data.type !== "epub-built" || data.id !== id) return;
      cleanup();
      if (data.ok && data.buffer && data.filename) {
        resolve({ bytes: new Uint8Array(data.buffer), filename: data.filename });
      } else {
        reject(new Error(data.error || "EPUB build failed."));
      }
    }

    function cleanup() {
      clearTimeout(deadline);
      window.removeEventListener("message", onMessage);
    }

    window.addEventListener("message", onMessage);
    sandboxWindow().postMessage({ type: "build-epub", id, article, chapters }, "*");
  });
}

// --- Image inlining ----------------------------------------------------------
// The sandbox has a null origin, so it can't fetch article images (CORS).
// The popup CAN (host_permissions) — so fetch them here and inline as data
// URLs before handing the content to the builder.

const extByMime: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/avif": "avif",
};

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function inlineImagesAsDataUrls(html: string): Promise<string> {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const images = Array.from(doc.querySelectorAll("img"));
  if (images.length === 0) return html;

  await Promise.all(
    images.map(async (img) => {
      const src = img.getAttribute("src");
      if (!src || src.startsWith("data:")) return;
      try {
        const response = await fetch(src);
        if (!response.ok) throw new Error(String(response.status));
        const blob = await response.blob();
        const ext = extByMime[blob.type] || "jpg";
        const dataUrl = await blobToDataUrl(blob);
        // The '#inline.<ext>' fragment lets the builder infer the media type;
        // fetch() ignores fragments when resolving data URLs.
        img.setAttribute("src", `${dataUrl}#inline.${ext}`);
        img.removeAttribute("srcset");
      } catch {
        // Keep the original src; the builder tolerates unfetchable images.
      }
    })
  );

  return doc.body.innerHTML;
}

async function waitForDownload(downloadId: number, timeoutMs: number): Promise<void> {
  const existing = await chrome.downloads.search({ id: downloadId });
  if (existing[0]?.state === "complete") return;

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      chrome.downloads.onChanged.removeListener(onChanged);
      reject(new Error("Download timed out."));
    }, timeoutMs);

    function onChanged(delta: chrome.downloads.DownloadDelta) {
      if (delta.id !== downloadId || !delta.state) return;
      if (delta.state.current === "complete") {
        clearTimeout(timer);
        chrome.downloads.onChanged.removeListener(onChanged);
        resolve();
      } else if (delta.state.current === "interrupted") {
        clearTimeout(timer);
        chrome.downloads.onChanged.removeListener(onChanged);
        reject(new Error("Download was interrupted."));
      }
    }

    chrome.downloads.onChanged.addListener(onChanged);
  });
}

async function convert(tab: chrome.tabs.Tab): Promise<void> {
  convertBtn.disabled = true;
  setStatus("working", "Reading page…");

  try {
    const [injection] = await chrome.scripting.executeScript({
      target: { tabId: tab.id! },
      func: capturePage,
    });
    const capture = injection?.result as PageCapture | undefined;
    if (!capture?.html) {
      throw new Error("Could not read the page. Try reloading the tab.");
    }

    setStatus("working", "Extracting article…");
    const article = await extractArticleFromHtml(capture.html, capture.url);

    setStatus("working", "Embedding images…");
    const contentHtml = await inlineImagesAsDataUrls(article.contentHtml);

    setStatus("working", "Building EPUB…");
    const chapters = chapterize(contentHtml);
    if (chapters.length === 0) {
      throw new Error("Could not create chapters from this page.");
    }

    await waitForSandboxReady();
    const epub = await buildEpubInSandbox({ ...article, contentHtml }, chapters);
    const blob = new Blob([epub.bytes as BlobPart], { type: "application/epub+zip" });
    const blobUrl = URL.createObjectURL(blob);

    const downloadId = await chrome.downloads.download({
      url: blobUrl,
      filename: epub.filename,
      saveAs: false,
      conflictAction: "uniquify",
    });

    setStatus("working", "Saving…");
    await waitForDownload(downloadId, 15_000);
    URL.revokeObjectURL(blobUrl);

    statusEl.dataset.filename = epub.filename;
    statusEl.dataset.chapters = String(chapters.length);
    statusEl.dataset.downloadId = String(downloadId);
    const kb = Math.max(1, Math.round(epub.bytes.byteLength / 1024));
    setStatus(
      "done",
      `${epub.filename} · ${chapters.length} chapter${chapters.length === 1 ? "" : "s"} · ${kb} KB — saved to Downloads.`
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Conversion failed.";
    setStatus("error", message);
  } finally {
    convertBtn.disabled = false;
  }
}

async function init(): Promise<void> {
  const tab = await resolveTargetTab();

  if (!tab || !isHttpUrl(tab.url)) {
    titleEl.textContent = "No article page found";
    hostEl.textContent = "";
    setStatus("error", "Open an article page (http/https) and try again.");
    return;
  }

  titleEl.textContent = tab.title || tab.url;
  hostEl.textContent = new URL(tab.url).hostname;
  convertBtn.disabled = false;
  setStatus("idle", "");

  convertBtn.addEventListener("click", () => void convert(tab));
}

void init();
