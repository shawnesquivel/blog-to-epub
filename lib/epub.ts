import epub from "epub-gen-memory";
import slugify from "slugify";

import type { Chapter } from "./chapterize";
import type { ExtractedArticle } from "./extract";

type BuildResult = {
  bytes: Uint8Array;
  filename: string;
};

function sanitizeChapterHtml(chapterHtml: string): string {
  return chapterHtml.replace(/<script[\s\S]*?<\/script>/gi, "");
}

export async function buildEpub(article: ExtractedArticle, chapters: Chapter[]): Promise<BuildResult> {
  const css = `
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.6; }
h1, h2, h3 { line-height: 1.3; margin-top: 1.1em; }
p { margin: 0.75em 0; }
a { color: #0b65d8; text-decoration: none; }
`.trim();

  const content = chapters.map((chapter) => ({
    title: chapter.title,
    content: `${sanitizeChapterHtml(chapter.html)}<p><em>Source:</em> <a href="${article.url}">${article.url}</a></p>`,
  }));

  // Returns a Buffer in Node and a Blob in the browser (Chrome extension).
  const result: unknown = await epub(
    {
      title: article.title,
      author: article.author,
      description: `Generated from ${article.url}`,
      lang: "en",
      css,
      version: 3,
      prependChapterTitles: true,
      ignoreFailedDownloads: true,
    },
    content
  );

  const bytes =
    result instanceof Uint8Array
      ? new Uint8Array(result)
      : new Uint8Array(await (result as Blob).arrayBuffer());

  const safeBase = slugify(article.title, { lower: true, strict: true }) || "article";
  const filename = `${safeBase}.epub`;
  return { bytes, filename };
}
