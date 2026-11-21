#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "Użycie: $0 <obraz-zrodlowy> <nazwa-bez-rozszerzenia>" >&2
  exit 2
fi

SOURCE="$1"
NAME="$2"
OUT_DIR="assets/cases"
command -v cwebp >/dev/null 2>&1 || { echo "Brak cwebp. Zainstaluj narzędzie WebP przed kompresją." >&2; exit 127; }
[[ -f "$SOURCE" ]] || { echo "Nie znaleziono pliku: $SOURCE" >&2; exit 1; }
[[ "$NAME" =~ ^[a-z0-9][a-z0-9-]{2,63}$ ]] || { echo "Nazwa musi zawierać małe litery, cyfry i myślniki." >&2; exit 2; }
mkdir -p "$OUT_DIR"

encode_variant() {
  local width="$1" limit="$2" output="$OUT_DIR/$NAME-$width.webp" quality
  for quality in 78 72 66 60; do
    cwebp -quiet -metadata none -q "$quality" -resize "$width" 0 "$SOURCE" -o "$output"
    local bytes
    bytes=$(wc -c < "$output")
    if (( bytes <= limit )); then
      printf '%s: %s B (q=%s)\n' "$output" "$bytes" "$quality"
      return 0
    fi
  done
  echo "Nie udało się zmieścić $output w limicie $limit B bez dalszego pogorszenia jakości." >&2
  return 1
}

encode_variant 640 90000
encode_variant 1280 220000
