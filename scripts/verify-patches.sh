#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

pack_and_extract() {
  local package="$1"
  local directory="$2"
  local archive
  archive="$(npm pack "@deepseek-ai/${package}@0.1.0-rc.6" --silent --pack-destination "$tmp")"
  mkdir -p "$tmp/$directory"
  tar -xzf "$tmp/$archive" -C "$tmp/$directory" --strip-components=1
}

pack_and_extract dsh-host-apiproxy host
pack_and_extract dsh-client-ui-sidebar sidebar

cp -R "$tmp/host" "$tmp/host-patched"
cp -R "$tmp/sidebar" "$tmp/sidebar-patched"

git -C "$tmp/host-patched" apply --check "$root/patches/01-dsh-host-apiproxy-index.js.patch"
git -C "$tmp/host-patched" apply "$root/patches/01-dsh-host-apiproxy-index.js.patch"

git -C "$tmp/sidebar-patched" apply --check "$root/patches/05-dsh-client-ui-sidebar-client.js.patch"
git -C "$tmp/sidebar-patched" apply "$root/patches/05-dsh-client-ui-sidebar-client.js.patch"

cmp "$tmp/host-patched/lib/index.js" "$root/files/dsh-host-apiproxy/lib/index.js"
cmp "$tmp/sidebar-patched/lib/client.js" "$root/files/dsh-client-ui-sidebar/lib/client.js"

for script in \
  "$root/install.sh" \
  "$root/uninstall.sh" \
  "$root/relaunch-dsh-web.sh" \
  "$root/scripts/common.sh" \
  "$root/scripts/test-macos-lifecycle.sh" \
  "$root/scripts/verify-patches.sh"; do
  /bin/bash -n "$script"
done

node --check "$root/scripts/manifest.mjs"
node "$root/scripts/test-usage-analytics.mjs"
if command -v pwsh >/dev/null 2>&1; then
  pwsh -NoProfile -File "$root/scripts/test-powershell-whatif.ps1"
fi
"$root/scripts/test-macos-lifecycle.sh" "$tmp/host" "$tmp/sidebar"

while IFS= read -r -d '' file; do
  node --check "$file"
done < <(find "$root/files" -type f -name '*.js' -print0)

private_pattern='C:\\Users\\[0-9]+|BEGIN [A-Z ]*PRIVATE KEY|sk-[A-Za-z0-9]{16,}'
private_match=0

if git -C "$root" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  if git -C "$root" grep -n -E "$private_pattern"; then
    private_match=1
  fi
elif grep -R -n -E \
  --exclude='*.png' \
  --exclude='*.jpg' \
  --exclude='*.jpeg' \
  --exclude-dir='.git' \
  --exclude-dir='backup' \
  --exclude-dir='backup-macos' \
  "$private_pattern" "$root"; then
  private_match=1
fi

if [ "$private_match" -eq 1 ]; then
  echo "Potential private path or secret found in tracked files." >&2
  exit 1
fi

echo "Patch, Windows/macOS lifecycle, syntax, and basic secret checks passed."
