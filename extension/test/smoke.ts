// Smoke test for the shared core pipeline (extract -> chapterize -> buildEpub)
// against real articles, exercising BOTH extraction paths:
//   - extractArticle(url)            (web app / server path)
//   - extractArticleFromHtml(html)   (chrome extension path)
// Run via: npm run test:smoke
import JSZip from "jszip";

import { chapterize, type Chapter } from "../../lib/chapterize";
import { buildEpub } from "../../lib/epub";
import { extractArticle, extractArticleFromHtml, type ExtractedArticle } from "../../lib/extract";

const ARTICLES = [
  { url: "https://www.paulgraham.com/greatwork.html", expectAuthor: "Paul Graham" },
  { url: "https://darioamodei.com/essay/machines-of-loving-grace", expectAuthor: "Dario Amodei" },
  { url: "https://blog.samaltman.com/how-to-be-successful", expectAuthor: "Sam Altman" },
];

let failures = 0;

function check(label: string, condition: boolean, detail = "") {
  if (condition) {
    console.log(`  ok    ${label}${detail ? ` (${detail})` : ""}`);
  } else {
    failures += 1;
    console.error(`  FAIL  ${label}${detail ? ` (${detail})` : ""}`);
  }
}

async function validateEpub(label: string, article: ExtractedArticle, chapters: Chapter[]) {
  const { bytes, filename } = await buildEpub(article, chapters);
  check(`${label}: filename`, filename.endsWith(".epub"), filename);
  check(`${label}: size`, bytes.byteLength > 10_000, `${Math.round(bytes.byteLength / 1024)} KB`);

  const zip = await JSZip.loadAsync(bytes);
  const mimetype = await zip.file("mimetype")?.async("string");
  check(`${label}: mimetype entry`, mimetype === "application/epub+zip");
  check(`${label}: container.xml`, !!zip.file("META-INF/container.xml"));

  const opf = await zip.file("OEBPS/content.opf")?.async("string");
  check(`${label}: content.opf`, !!opf);
  const escapedTitle = article.title.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  check(`${label}: title in opf`, !!opf && opf.includes(escapedTitle), article.title);

  const chapterFiles = Object.keys(zip.files).filter(
    (name) => name.startsWith("OEBPS/") && name.endsWith(".xhtml") && !name.endsWith("toc.xhtml")
  );
  check(
    `${label}: chapter files match`,
    chapterFiles.length === chapters.length,
    `${chapterFiles.length} files / ${chapters.length} chapters`
  );
}

for (const { url, expectAuthor } of ARTICLES) {
  console.log(`\n=== ${url}`);

  // Path 1: server-side extraction from URL (what the web app does).
  const fromUrl = await extractArticle(url);
  check("extractArticle: title", fromUrl.title.length > 3, fromUrl.title);
  check("extractArticle: author", fromUrl.author === expectAuthor, fromUrl.author);
  const chaptersFromUrl = chapterize(fromUrl.contentHtml);
  check("chapterize", chaptersFromUrl.length >= 1, `${chaptersFromUrl.length} chapters`);
  await validateEpub("epub(url path)", fromUrl, chaptersFromUrl);

  // Path 2: extraction from raw HTML (what the extension does with the live DOM).
  const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  const html = await response.text();
  const fromHtml = await extractArticleFromHtml(html, url);
  check("extractFromHtml: title", fromHtml.title.length > 3, fromHtml.title);
  check("extractFromHtml: author", fromHtml.author === expectAuthor, fromHtml.author);
  const chaptersFromHtml = chapterize(fromHtml.contentHtml);
  check("chapterize (html path)", chaptersFromHtml.length >= 1, `${chaptersFromHtml.length} chapters`);
  await validateEpub("epub(html path)", fromHtml, chaptersFromHtml);
}

console.log(failures === 0 ? "\nSMOKE PASS" : `\nSMOKE FAIL (${failures} failures)`);
process.exit(failures === 0 ? 0 : 1);
