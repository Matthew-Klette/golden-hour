#!/bin/sh
# Exports the intro as an MP4 with its soundtrack and no on-screen controls.
# Usage: make-video.sh [W] [H] [FPS] [SECONDS]   (defaults 1920 1080 60 76)
set -eu
export LC_ALL=C
cd "$(dirname "$0")"
W="${1:-1920}"; H="${2:-1080}"; FPS="${3:-60}"; SECONDS_LONG="${4:-76}"
FRAMES=$(( FPS * SECONDS_LONG ))
mkdir -p frames out tmp
node extract-cues.mjs
node render-audio.mjs out/soundtrack.wav "$SECONDS_LONG"
ffmpeg -hide_banner -loglevel error -y -i out/soundtrack.wav -af "alimiter=limit=0.89:attack=1:release=60:level=false" -c:a pcm_f32le out/soundtrack-limited.wav
# Frames: skip any already rendered, so an interrupted export resumes.
i=0
while [ "$i" -lt "$FRAMES" ]; do
  f=$(printf "frames/f%05d.png" "$i")
  [ -s "$f" ] || echo "$(awk -v i="$i" -v fps="$FPS" 'BEGIN { printf "%.5f", i / fps }') $W $H $f"
  i=$(( i + 1 ))
done | xargs -P 8 -L 1 sh -c './shoot.sh "$0" "$1" "$2" "$3"'
n=$(ls frames | wc -l | tr -d ' ')
[ "$n" -ge "$FRAMES" ] || { echo "only $n of $FRAMES frames rendered" >&2; exit 1; }
ffmpeg -hide_banner -loglevel error -y -framerate "$FPS" -i frames/f%05d.png -i out/soundtrack-limited.wav \
  -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 320k -shortest \
  "out/golden-hour-${W}x${H}.mp4"
echo "out/golden-hour-${W}x${H}.mp4"
