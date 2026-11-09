#!/usr/bin/env bash
# Usage: convert.sh <input> [output.md]
set -euo pipefail
in="${1:?usage: convert.sh <input> [output.md]}"
[ -f "$in" ] || { echo "not a file: $in" >&2; exit 1; }
out="${2:-${in%.*}.md}"
venv="${TO_MARKDOWN_VENV:-$HOME/.cache/to-markdown}"
if [ ! -x "$venv/bin/markitdown" ]; then
  python3 -m venv "$venv"
  "$venv/bin/pip" install -q 'markitdown[all]'
fi
"$venv/bin/markitdown" "$in" -o "$out"
echo "$out ($(wc -c < "$out") bytes)"
