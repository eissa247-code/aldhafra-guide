#!/bin/sh
cd "$(dirname "$0")"
(sleep 1; (open http://localhost:8000/ || xdg-open http://localhost:8000/) >/dev/null 2>&1) &
echo "http://localhost:8000/  (Ctrl+C to stop)"
python3 -m http.server 8000
