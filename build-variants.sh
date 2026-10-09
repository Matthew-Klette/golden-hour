#!/bin/sh
# Writes the three tempo/key cuts of index.html into dist/. index.html stays the regular cut.
set -eu
cd "$(dirname "$0")"
mkdir -p dist
make_cut() { # name bpm pitch title
  sed -e "s/const VARIANT = { name: 'regular', bpm: 120, pitch: 0 };/const VARIANT = { name: '$1', bpm: $2, pitch: $3 };/" \
      -e "s|<title>Matt Klette</title>|<title>$4</title>|" index.html > "dist/$1.html"
  grep -q "name: '$1', bpm: $2, pitch: $3" "dist/$1.html" || { echo "variant line not found for $1" >&2; exit 1; }
}
make_cut slow    110 -3 "Matt Klette (slow, deep)"
make_cut regular 120  0 "Matt Klette (regular)"
make_cut fast    130  3 "Matt Klette (fast, high)"
ls -l dist
