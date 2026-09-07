import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "icons");

const PINE = [31, 58, 46, 255];
const FOX = [212, 106, 44, 255];
const BARK = [42, 33, 24, 255];
const LANTERN = [232, 162, 58, 255];
const SNOW = [255, 248, 238, 255];
const EMBER = [196, 92, 38, 255];

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function encodePng(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (width * 4 + 1);
    raw[rowStart] = 0;
    rgba.copy(raw, rowStart + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function setPixel(pixels, width, x, y, color) {
  if (x < 0 || y < 0 || x >= width || y >= width) return;
  const i = (y * width + x) * 4;
  pixels[i] = color[0];
  pixels[i + 1] = color[1];
  pixels[i + 2] = color[2];
  pixels[i + 3] = color[3];
}

function fillCircle(pixels, width, cx, cy, r, color) {
  const r2 = r * r;
  const minX = Math.floor(cx - r);
  const maxX = Math.ceil(cx + r);
  const minY = Math.floor(cy - r);
  const maxY = Math.ceil(cy + r);
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r2) setPixel(pixels, width, x, y, color);
    }
  }
}

function fillEllipse(pixels, width, cx, cy, rx, ry, color) {
  const minX = Math.floor(cx - rx);
  const maxX = Math.ceil(cx + rx);
  const minY = Math.floor(cy - ry);
  const maxY = Math.ceil(cy + ry);
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const nx = (x - cx) / rx;
      const ny = (y - cy) / ry;
      if (nx * nx + ny * ny <= 1) setPixel(pixels, width, x, y, color);
    }
  }
}

function paint(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const c = size / 2;
  fillCircle(pixels, size, c, c, size * 0.48, PINE);
  fillEllipse(pixels, size, c, size * 0.5, size * 0.28, size * 0.32, FOX);
  fillEllipse(
    pixels,
    size,
    size * 0.3,
    size * 0.28,
    size * 0.1,
    size * 0.16,
    FOX,
  );
  fillEllipse(
    pixels,
    size,
    size * 0.7,
    size * 0.28,
    size * 0.1,
    size * 0.16,
    FOX,
  );
  fillCircle(pixels, size, size * 0.4, size * 0.46, size * 0.035, BARK);
  fillCircle(pixels, size, size * 0.6, size * 0.46, size * 0.035, BARK);
  fillEllipse(pixels, size, c, size * 0.62, size * 0.07, size * 0.045, EMBER);
  fillEllipse(
    pixels,
    size,
    size * 0.74,
    size * 0.66,
    size * 0.09,
    size * 0.11,
    LANTERN,
  );
  fillCircle(pixels, size, size * 0.74, size * 0.66, size * 0.035, SNOW);
  return pixels;
}

async function writePng(name, size) {
  const file = join(outDir, name);
  await mkdir(dirname(file), { recursive: true });
  await new Promise((resolve, reject) => {
    const stream = createWriteStream(file);
    stream.on("finish", resolve);
    stream.on("error", reject);
    stream.end(encodePng(size, size, paint(size)));
  });
}

await writePng("icon-192.png", 192);
await writePng("icon-512.png", 512);
await writePng("apple-touch-icon.png", 180);
console.log("Wrote PNG icons to public/icons");
