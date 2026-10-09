// Runs the intro's timeline once in jsdom (no browser) and writes every sound cue with its exact time to cues.json.
import { writeFileSync } from 'node:fs';
import { JSDOM, VirtualConsole } from 'jsdom';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { capturePage } from './capture-page.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', (e) => { if (!/Not implemented/.test(e.message)) errors.push(e.message); });
const dom = new JSDOM(capturePage({ events: [] }), {
  url: pathToFileURL(join(here, 'cues.html')).href, runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc,
  beforeParse(window) {
    window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
    const proto = window.SVGElement.prototype;
    proto.getTotalLength = () => 100;
    proto.getPointAtLength = () => ({ x: 0, y: 0 });
  },
});
const deadline = Date.now() + 20000;
while (!dom.window.CAPTURE?.ready) {
  if (Date.now() > deadline) { console.error('timed out waiting for the timeline', errors); process.exit(1); }
  await new Promise((r) => setTimeout(r, 100));
}
const { events, duration } = dom.window.CAPTURE;
writeFileSync(join(here, 'cues.json'), JSON.stringify({ duration, events: events.map((e) => ({ ...e, args: e.args ? [...e.args] : undefined })) }, null, 0));
console.log(`cues: ${events.length} (${events.filter((e) => e.kind === 'section').length} section changes), timeline ${duration.toFixed(2)}s`);
if (errors.length) console.log('page errors:', errors.slice(0, 5));
dom.window.close();
