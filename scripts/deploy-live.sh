#!/usr/bin/env bash
# Build the app and put it on the live site (the site your pidash backend serves from /opt/pidash/static).
# The old site is backed up first; the old 3D page stays reachable at /3d/ as an extra fallback.
# Roll back: move /opt/pidash/static aside and move a static.bak-<stamp> back to /opt/pidash/static
set -euo pipefail
cd "$(dirname "$0")/.."
npx vite build
stamp=$(date +%Y%m%d-%H%M%S)
sudo cp -a /opt/pidash/static "/opt/pidash/static.bak-$stamp"   # sudo: one old file is root-only
cp -a dist/. /opt/pidash/static/
echo "deployed; backup at /opt/pidash/static.bak-$stamp"
