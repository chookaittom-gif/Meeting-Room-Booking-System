// Generate public/favicon.ico from app/icon.svg geometry (pure Node, no deps).
// Renders the same calendar glyph into 16x16 and 32x32 BMP-in-ICO frames.
import fs from "node:fs";
import path from "node:path";

// Simple 2D drawing onto RGBA pixel buffer
function makeCanvas(size) {
  return { size, px: new Float32Array(size * size * 4) };
}
function blend(cv, x, y, r, g, b, a) {
  if (x < 0 || y < 0 || x >= cv.size || y >= cv.size) return;
  const i = (y * cv.size + x) * 4;
  const prevA = cv.px[i + 3];
  const outA = a + prevA * (1 - a);
  if (outA <= 0) return;
  cv.px[i] = (r * a + cv.px[i] * prevA * (1 - a)) / outA;
  cv.px[i + 1] = (g * a + cv.px[i + 1] * prevA * (1 - a)) / outA;
  cv.px[i + 2] = (b * a + cv.px[i + 2] * prevA * (1 - a)) / outA;
  cv.px[i + 3] = outA;
}
function rect(cv, x0, y0, x1, y1, rad, col, alpha = 1) {
  const [r, g, b] = col;
  for (let y = Math.floor(y0); y < Math.ceil(y1); y++) {
    for (let x = Math.floor(x0); x < Math.ceil(x1); x++) {
      // coverage via supersampling
      let cov = 0;
      const S = 4;
      for (let sy = 0; sy < S; sy++) {
        for (let sx = 0; sx < S; sx++) {
          const px = x + (sx + 0.5) / S;
          const py = y + (sy + 0.5) / S;
          if (px < x0 || px >= x1 || py < y0 || py >= y1) continue;
          // rounded corners
          if (rad > 0) {
            const rx = Math.min(px - x0, x1 - px);
            const ry = Math.min(py - y0, y1 - py);
            if (rx < rad && ry < rad) {
              const dx = rad - rx;
              const dy = rad - ry;
              if (dx * dx + dy * dy > rad * rad) continue;
            }
          }
          cov++;
        }
      }
      if (cov > 0) blend(cv, x, y, r, g, b, (cov / (S * S)) * alpha);
    }
  }
}
function circle(cv, cx, cy, rad, col, alpha = 1) {
  const [r, g, b] = col;
  for (let y = Math.floor(cy - rad) - 1; y <= Math.ceil(cy + rad) + 1; y++) {
    for (let x = Math.floor(cx - rad) - 1; x <= Math.ceil(cx + rad) + 1; x++) {
      let cov = 0;
      const S = 4;
      for (let sy = 0; sy < S; sy++) {
        for (let sx = 0; sx < S; sx++) {
          const px = x + (sx + 0.5) / S;
          const py = y + (sy + 0.5) / S;
          const d = Math.hypot(px - cx, py - cy);
          if (d <= rad) cov++;
        }
      }
      if (cov > 0) blend(cv, x, y, r, g, b, (cov / (S * S)) * alpha);
    }
  }
}

const PURPLE_DARK = [72, 35, 107];
const PURPLE = [122, 69, 176];
const WHITE = [255, 255, 255];

// mirror of app/icon.svg (viewBox 64)
function drawIcon(cv) {
  const s = cv.size / 64;
  // background rounded square with vertical gradient feel (flat blend of the two stops)
  rect(cv, 2 * s, 2 * s, 62 * s, 62 * s, 14 * s, [
    (PURPLE_DARK[0] + PURPLE[0]) / 2,
    (PURPLE_DARK[1] + PURPLE[1]) / 2,
    (PURPLE_DARK[2] + PURPLE[2]) / 2,
  ]);
  // top bar
  rect(cv, 12 * s, 16 * s, 52 * s, 26 * s, 3 * s, WHITE, 0.94);
  // body
  rect(cv, 12 * s, 29 * s, 52 * s, 50 * s, 3 * s, WHITE, 0.94);
  // rings
  rect(cv, 20 * s, 10 * s, 24 * s, 19 * s, 2 * s, WHITE, 1);
  rect(cv, 40 * s, 10 * s, 44 * s, 19 * s, 2 * s, WHITE, 1);
  // dots
  circle(cv, 22 * s, 39.5 * s, 3.2 * s, PURPLE, 1);
  circle(cv, 32 * s, 39.5 * s, 3.2 * s, PURPLE, 0.6);
  circle(cv, 42 * s, 39.5 * s, 3.2 * s, PURPLE, 0.6);
}

// BMP (BITMAPINFOHEADER, bottom-up BGRA) for one ICO frame
function bmpFor(cv) {
  const { size, px } = cv;
  const rowBytes = size * 4;
  const pixelBytes = rowBytes * size;
  const maskRow = Math.ceil(size / 32) * 4;
  const maskBytes = maskRow * size;
  const buf = Buffer.alloc(40 + pixelBytes + maskBytes);
  buf.writeUInt32LE(40, 0); // header size
  buf.writeInt32LE(size, 4);
  buf.writeInt32LE(size * 2, 8); // height = image + mask
  buf.writeUInt16LE(1, 12);
  buf.writeUInt16LE(32, 14);
  buf.writeUInt32LE(0, 16);
  buf.writeUInt32LE(pixelBytes + maskBytes, 20);
  let off = 40;
  for (let y = size - 1; y >= 0; y--) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      buf.writeUInt8(Math.round(px[i + 2]), off++);
      buf.writeUInt8(Math.round(px[i + 1]), off++);
      buf.writeUInt8(Math.round(px[i]), off++);
      buf.writeUInt8(Math.round(px[i + 3] * 255), off++);
    }
  }
  off = 40 + pixelBytes; // AND mask all zeros (alpha channel used)
  return buf;
}

function icoEntry(size, bmpLength, offset) {
  const e = Buffer.alloc(16);
  e.writeUInt8(size >= 256 ? 0 : size, 0); // width
  e.writeUInt8(size >= 256 ? 0 : size, 1); // height
  e.writeUInt8(0, 2); // palette colors
  e.writeUInt8(0, 3); // reserved
  e.writeUInt16LE(1, 4); // planes
  e.writeUInt16LE(32, 6); // bpp
  e.writeUInt32LE(bmpLength, 8); // bytes in resource
  e.writeUInt32LE(offset, 12); // image offset
  return e;
}

const c32 = makeCanvas(32);
drawIcon(c32);
const c16 = makeCanvas(16);
drawIcon(c16);

// ICO with 2 frames: 16 + 32
const bmp32 = bmpFor(c32);
const bmp16 = bmpFor(c16);
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(2, 4);
const offset16 = 6 + 2 * 16;
const offset32 = offset16 + bmp16.length;
const e1 = icoEntry(16, bmp16.length, offset16);
const e2 = icoEntry(32, bmp32.length, offset32);

const outPath = path.join(process.cwd(), "public", "favicon.ico");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, Buffer.concat([header, e1, e2, bmp16, bmp32]));
console.log(`Wrote ${outPath} (${6 + 32 + bmp16.length + bmp32.length} bytes)`);
