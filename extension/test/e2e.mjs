// End-to-end test: loads the built extension (dist/) into Chromium, opens
// real article pages, drives the popup UI, and validates the EPUB that
// chrome.downloads wrote to disk.
//
// Run via: npm run test:e2e
import { copyFileSync, mkdirSync, readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import JSZip from "jszip";
import { chromium } from "playwright";

const here = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(here, "..", "dist");
const outDir = path.join(here, "..", "test-output");

const ARTICLES = [
  {
    url: "https://www.paulgraham.com/greatwork.html",
    expectFilename: "how-to-do-great-work.epub",
    expectTitle: "How to Do Great Work",
  },
  {
    url: "https://darioamodei.com/essay/machines-of-loving-grace",
    expectFilename: "dario-amodei-machines-of-loving-grace.epub",
    expectTitle: "Dario Amodei — Machines of Loving Grace",
  },
  {
    url: "https://blog.samaltman.com/how-to-be-successful",
    expectFilename: "how-to-be-successful.epub",
    expectTitle: "How To Be Successful",
  },
  {
    // Exercises the image pipeline: popup inlines article images as data
    // URLs (CORS-privileged fetch), sandbox embeds them into the EPUB.
    url: "https://blog.google/technology/ai/google-gemini-ai/",
    expectFilename: "introducing-gemini-our-largest-and-most-capable-ai-model.epub",
    expectTitle: "Introducing Gemini: our largest and most capable AI model",
    expectImages: true,
  },
];

let failures = 0;

function check(label, condition, detail = "") {
  if (condition) {
    console.log(`  ok    ${label}${detail ? ` (${detail})` : ""}`);
  } else {
    failures += 1;
    console.error(`  FAIL  ${label}${detail ? ` (${detail})` : ""}`);
  }
}

async function validateEpubFile(filePath, expectTitle, saveAs, expectImages) {
  const bytes = readFileSync(filePath);
  mkdirSync(outDir, { recursive: true });
  copyFileSync(filePath, path.join(outDir, saveAs));
  check("epub: size", bytes.byteLength > 10_000, `${Math.round(bytes.byteLength / 1024)} KB`);

  const zip = await JSZip.loadAsync(bytes);
  const mimetype = await zip.file("mimetype")?.async("string");
  check("epub: mimetype entry", mimetype === "application/epub+zip");
  check("epub: container.xml", !!zip.file("META-INF/container.xml"));

  const opf = await zip.file("OEBPS/content.opf")?.async("string");
  check("epub: content.opf", !!opf);
  const escapedTitle = expectTitle.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const dcTitle = opf?.match(/<dc:title[^>]*>([\s\S]*?)<\/dc:title>/)?.[1];
  check("epub: title in opf", !!opf && opf.includes(escapedTitle), `want "${expectTitle}", opf has "${dcTitle}"`);

  const chapterFiles = Object.keys(zip.files).filter(
    (name) => name.startsWith("OEBPS/") && name.endsWith(".xhtml") && !name.endsWith("toc.xhtml")
  );
  check("epub: has chapters", chapterFiles.length >= 1, `${chapterFiles.length} chapter files`);

  if (expectImages) {
    const imageFiles = Object.keys(zip.files).filter(
      (name) => name.startsWith("OEBPS/images/") && !zip.files[name].dir
    );
    check("epub: has embedded images", imageFiles.length >= 1, `${imageFiles.length} image files`);
    for (const name of imageFiles) {
      const data = await zip.file(name).async("uint8array");
      const ext = name.split(".").pop();
      check(`epub: image valid`, data.byteLength > 500 && !!ext && ext.length >= 3, `${name} (${data.byteLength} bytes)`);
    }
  }
}

async function run(headless) {
  const userDataDir = mkdtempSync(path.join(tmpdir(), "blog-to-epub-e2e-"));
  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: "chromium", // full Chromium build: required for extensions in headless mode
    headless,
    args: [`--disable-extensions-except=${distDir}`, `--load-extension=${distDir}`],
  });

  try {
    let [serviceWorker] = context.serviceWorkers();
    if (!serviceWorker) {
      serviceWorker = await context.waitForEvent("serviceworker", { timeout: 15_000 });
    }
    const extensionId = new URL(serviceWorker.url()).host;
    console.log(`extension loaded: ${extensionId} (headless=${headless})`);

    for (const { url, expectFilename, expectTitle, expectImages } of ARTICLES) {
      console.log(`\n=== ${url}`);

      const articlePage = await context.newPage();
      await articlePage.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });

      const popup = await context.newPage();
      popup.on("pageerror", (err) => console.error(`  popup pageerror: ${err.message}`));
      await popup.goto(`chrome-extension://${extensionId}/popup.html`);

      // Find the chrome tabId of the article tab, then re-open the popup
      // pinned to it (same hook a user-opened popup doesn't need).
      const tabId = await popup.evaluate(async (articleUrl) => {
        const tabs = await chrome.tabs.query({});
        const tab = tabs.find((t) => t.url === articleUrl);
        return tab?.id ?? null;
      }, articlePage.url());
      check("found article tab", tabId !== null, `tabId=${tabId}`);
      if (tabId === null) {
        await articlePage.close();
        await popup.close();
        continue;
      }

      await popup.goto(`chrome-extension://${extensionId}/popup.html?tabId=${tabId}`);
      const shownTitle = await popup.locator("#page-title").textContent();
      check("popup shows page title", !!shownTitle && shownTitle.length > 3, shownTitle ?? "");

      await popup.click("#convert"); // auto-waits for the button to be enabled
      await popup.waitForSelector('#status[data-state="done"]', { timeout: 90_000 });

      const status = await popup.locator("#status").evaluate((el) => ({
        text: el.textContent,
        filename: el.dataset.filename,
        chapters: Number(el.dataset.chapters),
        downloadId: Number(el.dataset.downloadId),
      }));
      check("popup filename", status.filename === expectFilename, status.filename);
      check("popup chapter count", status.chapters >= 1, `${status.chapters} chapters`);
      check("popup status text", !!status.text && status.text.includes("saved to Downloads"), status.text ?? "");

      // Ask the downloads API where the file actually landed on disk.
      const download = await popup.evaluate(async (id) => {
        const [item] = await chrome.downloads.search({ id });
        return item ? { filename: item.filename, state: item.state, exists: item.exists } : null;
      }, status.downloadId);
      check("download complete", download?.state === "complete", download?.filename ?? "no download item");

      if (download?.filename) {
        await validateEpubFile(download.filename, expectTitle, expectFilename, expectImages);
      } else {
        failures += 1;
      }

      await popup.close();
      await articlePage.close();
    }
  } finally {
    await context.close();
    rmSync(userDataDir, { recursive: true, force: true });
  }
}

try {
  await run(true);
} catch (error) {
  // New-headless extension support can vary by Chromium build; retry headed.
  console.warn(`headless run failed (${error.message}); retrying headed...`);
  failures = 0;
  await run(false);
}

console.log(failures === 0 ? "\nE2E PASS" : `\nE2E FAIL (${failures} failures)`);
process.exit(failures === 0 ? 0 : 1);
