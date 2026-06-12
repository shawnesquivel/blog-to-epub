import { extract, extractFromHtml } from "@extractus/article-extractor";

export type ExtractedArticle = {
  title: string;
  author: string;
  url: string;
  contentHtml: string;
};

const domainAuthors: Record<string, string> = {
  "paulgraham.com": "Paul Graham",
  "www.paulgraham.com": "Paul Graham",
  "darioamodei.com": "Dario Amodei",
  "blog.samaltman.com": "Sam Altman",
  "nav.al": "Naval Ravikant",
};

function guessAuthorFromUrl(url: string): string | null {
  try {
    const hostname = new URL(url).hostname;
    if (domainAuthors[hostname]) return domainAuthors[hostname];
    const bare = hostname.replace(/^www\./, "");
    if (domainAuthors[bare]) return domainAuthors[bare];
  } catch {}
  return null;
}

type RawArticle = {
  title?: string;
  author?: string;
  url?: string;
  content?: string;
} | null;

/** Collapse all whitespace (incl. non-breaking spaces from live DOMs) to single spaces. */
function cleanText(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

function normalizeArticle(raw: RawArticle, sourceUrl: string): ExtractedArticle {
  if (!raw?.content) {
    throw new Error("Could not extract article content.");
  }

  const url = raw.url || sourceUrl;
  const extractedAuthor = cleanText(raw.author || "");
  const author = extractedAuthor || guessAuthorFromUrl(url) || "Unknown";

  return {
    title: cleanText(raw.title || "") || "Untitled Article",
    author,
    url,
    contentHtml: raw.content.trim(),
  };
}

/** Fetch a URL and extract the article (server-side path, used by the web app). */
export async function extractArticle(url: string): Promise<ExtractedArticle> {
  const article = await extract(url, { contentLengthThreshold: 200 }, { signal: AbortSignal.timeout(20_000) });
  return normalizeArticle(article, url);
}

/**
 * Extract the article from already-captured HTML (used by the Chrome
 * extension, which serializes the live DOM of the current tab — so it also
 * works on pages that need login or client-side rendering).
 */
export async function extractArticleFromHtml(html: string, url: string): Promise<ExtractedArticle> {
  const article = await extractFromHtml(html, url, { contentLengthThreshold: 200 });
  return normalizeArticle(article, url);
}
