import { extract } from "@extractus/article-extractor";

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

export async function extractArticle(url: string): Promise<ExtractedArticle> {
  const article = await extract(url, { contentLengthThreshold: 200 }, { signal: AbortSignal.timeout(20_000) });
  if (!article?.content) {
    throw new Error("Could not extract article content from URL.");
  }

  const extractedAuthor = article.author?.trim();
  const author = extractedAuthor || guessAuthorFromUrl(url) || "Unknown";

  return {
    title: (article.title || "Untitled Article").trim(),
    author,
    url: article.url || url,
    contentHtml: article.content.trim(),
  };
}
