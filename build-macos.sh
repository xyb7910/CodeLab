#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
if [[ "$(uname -s)" != Darwin ]]; then echo "macOS build requires a Mac or GitHub macOS runner" >&2; exit 1; fi
ARCH="${1:-$(uname -m)}"
if [[ "$ARCH" == 'x86_64' ]]; then ARCH=x64; fi
if [[ "$ARCH" == 'aarch64' ]]; then ARCH=arm64; fi
if [[ "$ARCH" != x64 && "$ARCH" != arm64 ]]; then echo 'Pass arm64 or x64' >&2; exit 1; fi
command -v node >/dev/null || { echo 'Node.js 22+ required on build machine'; exit 1; }
node build/verify-macos.cjs
if [[ ! -d node_modules ]]; then npm install --no-audit --no-fund; fi
npm test
export CSC_IDENTITY_AUTO_DISCOVERY="${CSC_IDENTITY_AUTO_DISCOVERY:-false}"
./node_modules/.bin/electron-builder --config build/mac.builder.cjs --mac dmg zip --"$ARCH" --publish never
printf '\nCreated macOS packages in dist-macos (unsigned unless signing configured)\n'
find dist-macos -maxdepth 1 \( -name '*.dmg' -o -name '*.zip' \) -print
