// Sandboxed page that runs the EPUB builder. epub-gen-memory's template
// engine (ejs) compiles templates with `new Function`, which MV3 CSP forbids
// in normal extension pages — but sandboxed pages explicitly allow it.
// See https://developer.chrome.com/docs/extensions/mv3/sandboxingEval/
import type { Chapter } from "../../lib/chapterize";
import { buildEpub } from "../../lib/epub";
import type { ExtractedArticle } from "../../lib/extract";

type BuildRequest = {
  type: "build-epub";
  id: number;
  article: ExtractedArticle;
  chapters: Chapter[];
};

async function handleBuild(request: BuildRequest, source: Window): Promise<void> {
  try {
    const { bytes, filename } = await buildEpub(request.article, request.chapters);
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    source.postMessage({ type: "epub-built", id: request.id, ok: true, buffer, filename }, "*", [buffer]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "EPUB build failed.";
    source.postMessage({ type: "epub-built", id: request.id, ok: false, error: message }, "*");
  }
}

window.addEventListener("message", (event: MessageEvent) => {
  const data = event.data as { type?: string } | null;
  const source = event.source as Window | null;
  if (!data || !source) return;

  if (data.type === "ping") {
    source.postMessage({ type: "pong" }, "*");
  } else if (data.type === "build-epub") {
    void handleBuild(data as BuildRequest, source);
  }
});
