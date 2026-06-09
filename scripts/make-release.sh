#!/usr/bin/env bash
set -euo pipefail

VERSION="${1:-$(node -p "require('./package.json').version")}"
OUT_DIR="dist"
OUT_FILE="$OUT_DIR/endless-$VERSION.zip"

if ! command -v zip >/dev/null 2>&1; then
  echo "zip is required to create the release package."
  exit 1
fi

mkdir -p "$OUT_DIR"
rm -f "$OUT_FILE"
zip -r "$OUT_FILE" . \
  -x '.git/*' \
  -x 'node_modules/*' \
  -x '*/node_modules/*' \
  -x '.next/*' \
  -x '*/.next/*' \
  -x '.turbo/*' \
  -x 'dist/*' \
  -x 'output/*' \
  -x '.env' \
  -x '.env.*' \
  -x '*.tsbuildinfo' \
  -x '.DS_Store' \
  -x '.tmp-sketch/*' \
  -x 'storage/media/*'

echo "$OUT_FILE"
