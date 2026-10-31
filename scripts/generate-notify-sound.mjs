// Generate public/sounds/notify.wav — a short soft double "ding" (sine, with fade envelope).
// Pure Node, no deps. Output: 8 kHz, 16-bit mono PCM WAV (~6 KB).
import fs from "node:fs";
import path from "node:path";

const SAMPLE_RATE = 8000;

/** Render one ding: sine at freq with exponential decay */
function ding(freq, startSec, durSec, amp) {
  const out = [];
  const n = Math.floor(durSec * SAMPLE_RATE);
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const envelope = Math.exp(-t * 9) * amp;
    // slight harmonic for warmth
    const sample = Math.sin(2 * Math.PI * freq * t) * 0.85 + Math.sin(2 * Math.PI * freq * 2 * t) * 0.15;
    out.push({ t: startSec + t, v: sample * envelope });
  }
  return out;
}

const events = [
  ...ding(880, 0.0, 0.22, 0.55), // first ding (A5)
  ...ding(1174.66, 0.13, 0.3, 0.6), // second ding (D6)
];

const totalDur = Math.max(...events.map((e) => e.t)) + 0.05;
const totalSamples = Math.ceil(totalDur * SAMPLE_RATE);
const pcm = new Int16Array(totalSamples);
for (const e of events) {
  const idx = Math.floor(e.t * SAMPLE_RATE);
  if (idx < totalSamples) {
    const mixed = pcm[idx] / 32768 + e.v;
    pcm[idx] = Math.max(-1, Math.min(1, mixed)) * 32767;
  }
}

// WAV header (44 bytes) + data
const dataSize = totalSamples * 2;
const buf = Buffer.alloc(44 + dataSize);
buf.write("RIFF", 0);
buf.writeUInt32LE(36 + dataSize, 4);
buf.write("WAVE", 8);
buf.write("fmt ", 12);
buf.writeUInt32LE(16, 16); // fmt chunk size
buf.writeUInt16LE(1, 20); // PCM
buf.writeUInt16LE(1, 22); // mono
buf.writeUInt32LE(SAMPLE_RATE, 24);
buf.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate
buf.writeUInt16LE(2, 32); // block align
buf.writeUInt16LE(16, 34); // bits per sample
buf.write("data", 36);
buf.writeUInt32LE(dataSize, 40);
for (let i = 0; i < totalSamples; i++) buf.writeInt16LE(pcm[i], 44 + i * 2);

const outPath = path.join(process.cwd(), "public", "sounds", "notify.wav");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, buf);
console.log(`Wrote ${outPath} (${buf.length} bytes, ${totalDur.toFixed(2)}s)`);
