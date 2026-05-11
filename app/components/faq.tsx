"use client";

import { useState } from "react";
import Image from "next/image";

type FaqItem = {
  question: string;
  answer: React.ReactNode;
};

const faqs: FaqItem[] = [
  {
    question: "How do I open the EPUB in Apple Books?",
    answer: (
      <div>
        <p className="text-sm text-neutral-600">
          Right-click the downloaded file → <span className="font-medium text-neutral-800">Open With</span> → <span className="font-medium text-neutral-800">Books</span>
        </p>
        <Image
          src="/how-to-open.png"
          alt="Right-click the EPUB file, select Open With, then choose Books"
          width={1024}
          height={108}
          className="mt-3 rounded border border-neutral-200"
        />
      </div>
    ),
  },
  {
    question: "How can I support or suggest new features?",
    answer: (
      <p className="text-sm text-neutral-600">
        Send me a DM on{" "}
        <a href="https://x.com/shawnbuilds" target="_blank" rel="noopener noreferrer" className="font-medium text-violet-600 hover:text-violet-700">
          X (@shawnbuilds)
        </a>
        , open an issue on{" "}
        <a href="https://github.com/shawnesquivel/blog-to-epub/issues" target="_blank" rel="noopener noreferrer" className="font-medium text-violet-600 hover:text-violet-700">
          GitHub
        </a>
        , or email me at{" "}
        <a href="mailto:shawn@amihanventures.ca" className="font-medium text-violet-600 hover:text-violet-700">
          shawn@amihanventures.ca
        </a>
        {" "}and I&apos;ll get on it ASAP for you.
      </p>
    ),
  },
];

function FaqAccordion({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-neutral-200 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-4 text-left"
      >
        <span className="text-sm font-medium text-neutral-900">{item.question}</span>
        <svg
          className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && <div className="pb-4">{item.answer}</div>}
    </div>
  );
}

export default function Faq() {
  return (
    <div className="mt-8 rounded-lg border border-neutral-200 bg-white px-5">
      <h3 className="pt-4 pb-1 text-xs font-medium text-neutral-500 uppercase tracking-wide">FAQ</h3>
      {faqs.map((item, i) => (
        <FaqAccordion key={i} item={item} />
      ))}
    </div>
  );
}
