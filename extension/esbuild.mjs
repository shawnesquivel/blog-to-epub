import { build } from "esbuild";
import { cpSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(root, "dist");

// --- Browser bundles (the actual extension) -------------------------------
const browserCommon = {
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["chrome120"],
  mainFields: ["browser", "module", "main"],
  conditions: ["browser"],
  alias: {
    // ejs has no browser field; use its prebuilt standalone browser build.
    ejs: "ejs/ejs.min.js",
  },
  define: {
    "process.env.NODE_ENV": '"production"',
    global: "globalThis",
  },
  minify: true,
  logLevel: "info",
};

await build({
  ...browserCommon,
  entryPoints: [path.join(root, "src/popup.ts")],
  outfile: path.join(dist, "popup.js"),
});

await build({
  ...browserCommon,
  entryPoints: [path.join(root, "src/background.ts")],
  outfile: path.join(dist, "background.js"),
});

// The EPUB builder runs in a sandboxed page (MV3 CSP forbids ejs's
// `new Function` in normal extension pages).
await build({
  ...browserCommon,
  entryPoints: [path.join(root, "src/sandbox.ts")],
  outfile: path.join(dist, "sandbox.js"),
});

// --- Static files ----------------------------------------------------------
mkdirSync(dist, { recursive: true });
cpSync(path.join(root, "manifest.json"), path.join(dist, "manifest.json"));
cpSync(path.join(root, "popup.html"), path.join(dist, "popup.html"));
cpSync(path.join(root, "sandbox.html"), path.join(dist, "sandbox.html"));
cpSync(path.join(root, "icons"), path.join(dist, "icons"), { recursive: true });

console.log("Extension built into extension/dist");
