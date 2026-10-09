# Golden Hour

Kinetic intro and catalog page for Matt Klette: measured type, an n8n run, a Claude chat, an Obsidian graph that becomes the night sky, and a sunset with the name.

- `index.html` — the whole page (GSAP timeline, Web Audio soundtrack synthesized live, canvas graph). Responsive from 280px phones to 4K and ultrawide.
- `build-variants.sh` — writes slow / regular / fast tempo cuts into `dist/`.

## Video export

`video/make-video.sh [W] [H] [FPS] [SECONDS]` renders the intro to `video/out/golden-hour-WxH.mp4` with no on-screen controls:

1. `extract-cues.mjs` runs the timeline once in jsdom and logs every sound cue with its exact time.
2. `render-audio.mjs` renders the page's own synth offline (node-web-audio-api) from those cues.
3. `shoot.sh` renders each frame with headless Chrome from a local capture copy of the page (`capture-page.mjs`: local GSAP and fonts, the timeline seeked to the exact frame time).
4. ffmpeg limits the audio and muxes everything into an H.264 MP4.

`responsive-check.sh` renders contact sheets of 24 moments at 18 screen sizes for review.

Setup: `cd video && npm install`.
