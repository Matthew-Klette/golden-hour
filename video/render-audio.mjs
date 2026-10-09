// Renders the intro's soundtrack offline from cues.json with the page's own synth, to a 48 kHz stereo WAV.
// Usage: node render-audio.mjs <out.wav> <seconds>
import { readFileSync, writeFileSync } from 'node:fs';
import { OfflineAudioContext } from 'node-web-audio-api';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const [out, secondsArg] = process.argv.slice(2);
const seconds = Number(secondsArg);
if (!out || !(seconds > 0)) { console.error('usage: node render-audio.mjs <out.wav> <seconds>'); process.exit(64); }

// The synth is the page's first inline script; it only needs `window`.
const html = readFileSync(join(here, '..', 'index.html'), 'utf8');
const synth = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).find((code) => code.includes('window.Techno ='));
if (!synth) throw new Error('synth script not found in index.html');
globalThis.window = {};
new Function(synth)();
const { events } = JSON.parse(readFileSync(join(here, 'cues.json'), 'utf8'));
const buffer = await window.Techno.renderOffline(OfflineAudioContext, events, seconds);

// 32-bit float WAV (no clipping here; the video step limits peaks), with a short fade at the very end.
const rate = buffer.sampleRate, frames = buffer.length, channels = [buffer.getChannelData(0), buffer.getChannelData(1)];
const FADE_S = 2;
const data = Buffer.alloc(44 + frames * 8);
const head = [['RIFF', 0], [36 + frames * 8, 4], ['WAVEfmt ', 8], [16, 16], [3, 20, 2], [2, 22, 2], [rate, 24], [rate * 8, 28], [8, 32, 2], [32, 34, 2], ['data', 36], [frames * 8, 40]];
head.forEach(([v, at, size = 4]) => (typeof v === 'string' ? data.write(v, at, 'ascii') : size === 2 ? data.writeUInt16LE(v, at) : data.writeUInt32LE(v, at)));
let peak = 0, bad = 0;
for (let i = 0; i < frames; i++) {
  const fade = Math.min(1, (frames - i) / (FADE_S * rate));
  channels.forEach((ch, c) => {
    let v = ch[i] * fade;
    if (!Number.isFinite(v)) { v = 0; bad++; }
    peak = Math.max(peak, Math.abs(v));
    data.writeFloatLE(v, 44 + i * 8 + c * 4);
  });
}
writeFileSync(out, data);
console.log(`${out}: ${(frames / rate).toFixed(2)}s, peak ${(20 * Math.log10(peak || 1e-9)).toFixed(1)} dBFS${bad ? `, ${bad} bad samples zeroed` : ''}`);
