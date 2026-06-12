// Generates the extension icons (violet rounded square with a white "page")
// without any image dependencies — writes PNGs by hand via zlib.
import { deflateSync, crc32 } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const VIOLET = [124, 58, 237, 255];
const WHITE = [255, 255, 255, 255];

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])) >>> 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePng(size, pixels) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 4 + 1);
    raw[rowStart] = 0; // filter: none
    pixels.copy(raw, rowStart + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function drawIcon(size) {
  const px = Buffer.alloc(size * size * 4); // transparent
  const radius = Math.max(2, Math.round(size * 0.22));

  const insideRoundedSquare = (x, y) => {
    const corners = [
      [radius, radius],
      [size - 1 - radius, radius],
      [radius, size - 1 - radius],
      [size - 1 - radius, size - 1 - radius],
    ];
    const inCornerZone =
      (x < radius || x > size - 1 - radius) && (y < radius || y > size - 1 - radius);
    if (!inCornerZone) return true;
    return corners.some(([cx, cy]) => (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2);
  };

  const set = (x, y, [r, g, b, a]) => {
    const i = (y * size + x) * 4;
    px[i] = r;
    px[i + 1] = g;
    px[i + 2] = b;
    px[i + 3] = a;
  };

  const pageX0 = Math.round(size * 0.28);
  const pageX1 = Math.round(size * 0.72);
  const pageY0 = Math.round(size * 0.22);
  const pageY1 = Math.round(size * 0.78);
  const lineH = Math.max(1, Math.round(size * 0.05));
  const lineX0 = Math.round(size * 0.35);
  const lineX1 = Math.round(size * 0.65);
  const lineYs = [0.36, 0.48, 0.6].map((f) => Math.round(size * f));

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!insideRoundedSquare(x, y)) continue;
      let color = VIOLET;
      if (x >= pageX0 && x <= pageX1 && y >= pageY0 && y <= pageY1) {
        color = WHITE;
        const onLine =
          x >= lineX0 && x <= lineX1 && lineYs.some((ly) => y >= ly && y < ly + lineH);
        if (onLine) color = VIOLET;
      }
      set(x, y, color);
    }
  }
  return encodePng(size, px);
}

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(here, "..", "icons");
mkdirSync(outDir, { recursive: true });
for (const size of [16, 32, 48, 128]) {
  writeFileSync(path.join(outDir, `icon${size}.png`), drawIcon(size));
  console.log(`icons/icon${size}.png`);
}
