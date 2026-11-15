#!/bin/bash
# Builds the unsigned pidash iPhone app on a Mac. Output: pidash-unsigned.ipa (sign and install it with iLoader).
# The app is a thin native shell that loads your pidash server (the URL in capacitor.config.json, set by CI from the PIDASH_URL variable), so it only needs rebuilding when ios/ or the Capacitor config change.
set -euo pipefail
cd "$(dirname "$0")"

command -v xcodebuild >/dev/null || { echo "Xcode command-line tools not found."; exit 1; }
echo "Using $(xcodebuild -version | tr '\n' ' ')"

rm -rf build Payload pidash-unsigned.ipa
xcodebuild \
  -project ios/App/App.xcodeproj -scheme App -configuration Release \
  -sdk iphoneos -destination 'generic/platform=iOS' \
  -archivePath build/pidash.xcarchive \
  -derivedDataPath build/DerivedData \
  CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO CODE_SIGN_IDENTITY="" \
  archive > build-log.txt 2>&1 || { echo "Build failed. Last lines of build-log.txt:"; tail -40 build-log.txt; exit 1; }

APP="build/pidash.xcarchive/Products/Applications/App.app"
[ -d "$APP" ] || { echo "Build finished but $APP is missing. See build-log.txt"; exit 1; }
mkdir Payload
cp -R "$APP" Payload/
zip -qry pidash-unsigned.ipa Payload
rm -rf Payload
echo "Done: $(pwd)/pidash-unsigned.ipa ($(du -h pidash-unsigned.ipa | cut -f1))"
