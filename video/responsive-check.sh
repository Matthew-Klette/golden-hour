#!/bin/sh
# Contact sheet per screen size: 24 moments of the intro, for a responsive review. Output: tmp/sheets/<W>x<H>.png
set -eu
export LC_ALL=C
cd "$(dirname "$0")"
SIZES="${SIZES:-280x653 320x568 360x740 375x667 390x844 430x932 568x320 844x390 768x1024 1024x768 1024x1366 1280x720 1366x768 1440x900 1920x1080 2560x1440 3440x1440 3840x2160}"
mkdir -p tmp/shots tmp/sheets
jobs=""
for size in $SIZES; do
  for k in $(seq 0 23); do
    t=$(printf "%.1f" "$(echo "0.6 + $k * 3.2" | bc)")
    echo "$t ${size%x*} ${size#*x} tmp/shots/${size}-$(printf %02d $k).png"
  done
done | xargs -P 8 -L 1 sh -c './shoot.sh "$0" "$1" "$2" "$3"'
for size in $SIZES; do
  w=${size%x*}; h=${size#*x}
  if [ "$w" -ge "$h" ]; then scale="320:-2"; else scale="-2:300"; fi
  ffmpeg -hide_banner -loglevel error -y -framerate 1 -i "tmp/shots/${size}-%02d.png" -vf "scale=$scale,pad=iw+6:ih+6:3:3:gray,tile=6x4" -frames:v 1 "tmp/sheets/${size}.png"
done
ls tmp/sheets
