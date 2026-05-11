"use client";

import { useState } from "react";
import { libraryItems, categories } from "@/lib/library-data";
import type { LibraryItem } from "@/lib/library-data";

function EpubButton({ item }: { item: LibraryItem }) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleClick() {
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: item.url }),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(json.error || "Conversion failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const cd = res.headers.get("Content-Disposition") || "";
      const match = cd.match(/filename="([^"]+)"/);
      const filename = match?.[1] || "article.epub";
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setStatus("idle");
    } catch (e) {
      setStatus("error");
      setErrorMsg(e instanceof Error ? e.message : "This essay is no longer available.");
    }
  }

  return (
    <div className="flex flex-col">
      <button
        onClick={handleClick}
        disabled={status === "loading"}
        className="shrink-0 rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {status === "loading" ? "Converting..." : "Get EPUB"}
      </button>
      {status === "error" && (
        <p className="mt-1 text-xs text-red-600">{errorMsg}</p>
      )}
    </div>
  );
}

export default function LibraryPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = activeCategory
    ? libraryItems.filter((item) => item.category === activeCategory)
    : libraryItems;

  return (
    <div className="min-h-svh flex flex-col">
      <header className="border-b border-neutral-200 px-6 h-14 flex items-center shrink-0">
        <a href="/" className="text-[15px] font-semibold tracking-tight text-neutral-900 hover:text-neutral-600 transition-colors">Blog to EPUB</a>
        <nav className="ml-8 flex items-center gap-6">
          <a href="/" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">Convert</a>
          <a href="/library" className="text-sm font-medium text-neutral-900">Library</a>
        </nav>
      </header>

      <main className="flex-1 px-6 pt-10 pb-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Library</h1>
          <p className="mt-1 text-sm text-neutral-500">Curated essays from top thinkers. One click to EPUB.</p>

          {/* Category filter pills */}
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory(null)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                activeCategory === null
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => setActiveCategory(cat.name)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  activeCategory === cat.name
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Essays grid */}
          <div className="mt-8 grid gap-3">
            {filtered.map((item) => (
              <div
                key={item.url}
                className="flex items-center justify-between gap-4 rounded-lg border border-neutral-200 bg-white px-5 py-4 hover:border-neutral-300 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">{item.title}</p>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {item.author}
                    <span className="mx-1.5 text-neutral-300">&middot;</span>
                    <span className="text-neutral-400">{item.category}</span>
                  </p>
                </div>
                <EpubButton item={item} />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
