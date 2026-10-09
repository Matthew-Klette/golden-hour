#!/bin/sh
# Renders one moment of the intro at one screen size, via the approved headless renderer.
# The page sits in an iframe of exactly W x H (headless windows can't go below 500px wide), then the shot is cropped to it.
# Usage: shoot.sh <seconds> <W> <H> <out.png>
set -eu
export LC_ALL=C
cd "$(dirname "$0")"
t="$1"; w="$2"; h="$3"; out="$4"
id="$$-$(date +%s)-$(od -An -N4 -tu4 /dev/urandom | tr -d ' ')"
page=".cap-$id.html"; frame=".frame-$id.html"; raw="tmp/raw-$id.png"
node capture-page.mjs "$page" "{\"t\":$t,\"h\":$h}"
printf '<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:#000;overflow:hidden}iframe{position:absolute;left:0;top:0;border:0;width:%spx;height:%spx}</style><iframe src="%s"></iframe>' "$w" "$h" "$page" > "$frame"
win_w=$(( w < 500 ? 500 : w ))
ok=0
~/.claude/skills/image-studio/scripts/render.sh "$frame" "$raw" "${win_w}x${h}" 1 >/dev/null && ok=1
rm -f "$page" "$frame"
[ "$ok" = 1 ] || { echo "failed: $t ${w}x${h}" >&2; exit 1; }
ffmpeg -hide_banner -loglevel error -y -i "$raw" -vf "crop=$w:$h:0:0" -frames:v 1 -update 1 "$out"
rm -f "$raw"
