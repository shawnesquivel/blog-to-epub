"use client";

import { useRef, useState } from "react";
import { libraryItems, categories } from "@/lib/library-data";
import type { LibraryItem } from "@/lib/library-data";

function CarouselCard({ item }: { item: LibraryItem }) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  async function handleClick() {
    setStatus("loading");
    try {
      const res = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: item.url }),
      });
      if (!res.ok) {
        throw new Error("Failed");
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
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={status === "loading"}
      className="flex-none w-64 rounded-lg border border-neutral-200 bg-white p-4 text-left hover:border-neutral-300 hover:shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <p className="text-xs text-neutral-400 font-medium">{item.author}</p>
      <p className="mt-1 text-sm font-medium text-neutral-900 line-clamp-2 leading-snug">{item.title}</p>
      <p className="mt-2 text-xs text-neutral-400">{item.category}</p>
      <div className="mt-3 flex items-center gap-1.5">
        {status === "loading" ? (
          <span className="text-xs text-neutral-500">Converting...</span>
        ) : status === "error" ? (
          <span className="text-xs text-red-500">Unavailable</span>
        ) : (
          <span className="text-xs font-medium text-violet-600">→ EPUB</span>
        )}
      </div>
    </button>
  );
}

export default function LibraryCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 280;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  const featured = categories.slice(0, 3).map((cat) => ({
    category: cat,
    items: libraryItems.filter((i) => i.category === cat.name).slice(0, 6),
  }));

  return (
    <section className="border-t border-neutral-200 bg-neutral-50 px-6 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Popular Essays</h2>
            <p className="mt-0.5 text-sm text-neutral-500">One-click download to EPUB</p>
          </div>
          <a
            href="/library"
            className="text-sm font-medium text-violet-600 hover:text-violet-700 transition-colors"
          >
            View all →
          </a>
        </div>

        {featured.map(({ category, items }) => (
          <div key={category.slug} className="mt-8">
            <h3 className="text-sm font-medium text-neutral-700 mb-3">{category.name}</h3>
            <div className="relative">
              <div
                ref={scrollRef}
                className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {items.map((item) => (
                  <CarouselCard key={item.url} item={item} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
