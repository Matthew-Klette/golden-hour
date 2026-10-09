// Builds a self-contained capture copy of ../index.html: local GSAP and fonts (no network), no Lenis,
// and window.CAPTURE set before any script runs. Usage: node capture-page.mjs <out.html> '<CAPTURE json>'
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
export const capturePage = (capture) => {
  let html = readFileSync(join(here, '..', 'index.html'), 'utf8');
  const swaps = [
    [/<link rel="preconnect"[^>]*>\n?/g, ''],
    [/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^"]*">/, '<link rel="stylesheet" href="vendor/fonts.css">'],
    [/<script src="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/gsap\/3\.12\.5\/gsap\.min\.js"><\/script>/, `<script>window.CAPTURE = ${JSON.stringify(capture)};</script>\n<script src="vendor/gsap.min.js"></script>`],
    [/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/lenis[^"]*"><\/script>\n?/, ''],
  ];
  swaps.forEach(([pattern, replacement]) => {
    if (!pattern.test(html)) throw new Error(`capture-page: pattern not found: ${pattern}`);
    html = html.replace(pattern, replacement);
  });
  if (/https:\/\/(cdn|fonts)/.test(html.replace(/https:\/\/www\.linkedin\.com[^"]*/g, ''))) throw new Error('capture-page: a remote asset is still referenced');
  return html;
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [out, json] = process.argv.slice(2);
  if (!out || !json) { console.error("usage: node capture-page.mjs <out.html> '<CAPTURE json>'"); process.exit(64); }
  writeFileSync(out, capturePage(JSON.parse(json)));
}
