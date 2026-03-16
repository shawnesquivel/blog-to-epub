import Image from "next/image";

export default function OpenInBooks() {
  return (
    <div className="mt-5 rounded-md border border-neutral-200 bg-white p-4">
      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">How to open in Apple Books</p>
      <p className="mt-1 text-sm text-neutral-500">
        Right-click the downloaded file → <span className="text-neutral-700 font-medium">Open With</span> → <span className="text-neutral-700 font-medium">Books</span>
      </p>
      <Image
        src="/how-to-open.png"
        alt="Right-click the EPUB file, select Open With, then choose Books"
        width={1024}
        height={108}
        className="mt-3 rounded border border-neutral-200"
      />
    </div>
  );
}
