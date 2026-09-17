#!/bin/sh
# Re-extract header CSS from the live Squarespace site.
# Run this when the Squarespace theme changes and header.css goes stale.
set -e
cd "$(dirname "$0")"
command -v node >/dev/null || { echo "node not found — run: . ~/.nvm/nvm.sh"; exit 1; }

echo "1/4  fetching live page..."
curl -sL --max-time 60 -A "Mozilla/5.0" https://landuselabs.com/ -o /tmp/lul-live.html

echo "2/4  resolving stylesheet URLs..."
mkdir -p /tmp/lul-css
grep -oE 'https://static1\.squarespace\.com/[^"]+\.css[^"]*' /tmp/lul-live.html \
  | sort -u | while read -r url; do
      name=$(echo "$url" | sed 's/.*\///; s/?.*//')
      curl -sL --max-time 60 -A "Mozilla/5.0" "$url" -o "/tmp/lul-css/$name"
      echo "     $name"
    done

echo "3/4  installing deps (first run only)..."
[ -d node_modules ] || npm install --silent postcss cheerio

echo "4/4  extracting..."
node extract-header-css.mjs ../lul_header.html ../header.css /tmp/lul-css/*.css
echo "done -> header.css"
