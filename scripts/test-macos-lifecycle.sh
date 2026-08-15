#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ "$#" -ne 2 ]; then
  printf 'Usage: %s <official-host-package-dir> <official-sidebar-package-dir>\n' "$0" >&2
  exit 2
fi

official_host="$1"
official_sidebar="$2"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

fixture="$tmp/fixture with spaces"
project="$fixture/project"
npm_root="$fixture/npm root"
package_root="$npm_root/@deepseek-ai/dsh/node_modules/@deepseek-ai"
fake_bin="$fixture/fake bin"

mkdir -p "$project" "$package_root" "$fake_bin"
cp "$root/install.sh" "$root/uninstall.sh" "$root/relaunch-dsh-web.sh" "$project/"
cp -R "$root/scripts" "$root/files" "$project/"

mkdir -p "$npm_root/@deepseek-ai/dsh"
printf '{"name":"@deepseek-ai/dsh","version":"0.1.0-rc.6"}\n' \
  >"$npm_root/@deepseek-ai/dsh/package.json"

mkdir -p "$package_root/dsh-host-apiproxy/lib"
mkdir -p "$package_root/dsh-client-ui-sidebar/lib"
cp "$official_host/package.json" "$package_root/dsh-host-apiproxy/package.json"
cp "$official_sidebar/package.json" "$package_root/dsh-client-ui-sidebar/package.json"
cp "$official_host/lib/index.js" "$package_root/dsh-host-apiproxy/lib/index.js"
cp "$official_sidebar/lib/client.js" "$package_root/dsh-client-ui-sidebar/lib/client.js"

cat >"$fake_bin/npm" <<'EOF'
#!/bin/sh
case "$1:$2" in
  root:-g) printf '%s\n' "$FAKE_NPM_ROOT" ;;
  prefix:-g) printf '%s\n' "$FAKE_NPM_ROOT" ;;
  *) exit 2 ;;
esac
EOF
chmod +x "$fake_bin/npm"

run_project() {
  PATH="$fake_bin:$PATH" \
  FAKE_NPM_ROOT="$npm_root" \
  DSH_API_BALANCE_TEST_MODE=1 \
  /bin/bash "$@"
}

host_target="$package_root/dsh-host-apiproxy/lib/index.js"
sidebar_target="$package_root/dsh-client-ui-sidebar/lib/client.js"

run_project "$project/install.sh" --dry-run >/dev/null
run_project "$project/install.sh" >/dev/null
cmp "$host_target" "$project/files/dsh-host-apiproxy/lib/index.js"
cmp "$sidebar_target" "$project/files/dsh-client-ui-sidebar/lib/client.js"

node "$project/scripts/manifest.mjs" mark-installed \
  "$project/backup-macos/manifest.json" \
  "0.4.0-rc.1" \
  "dsh-host-apiproxy/lib/index.js" "$project/files/dsh-host-apiproxy/lib/index.js" \
  "dsh-client-ui-sidebar/lib/client.js" "$project/files/dsh-client-ui-sidebar/lib/client.js"
run_project "$project/install.sh" --dry-run >/dev/null
node -e 'const fs=require("fs"); const value=JSON.parse(fs.readFileSync(process.argv[1],"utf8")); if(value.patchVersion!=="0.4.0-rc.1") process.exit(1)' \
  "$project/backup-macos/manifest.json"
run_project "$project/install.sh" >/dev/null
node -e 'const fs=require("fs"); const value=JSON.parse(fs.readFileSync(process.argv[1],"utf8")); if(value.patchVersion!=="0.4.1") process.exit(1)' \
  "$project/backup-macos/manifest.json"

old_root="$tmp/simulated-v0.2"
old_host="$old_root/dsh-host-apiproxy/lib/index.js"
old_sidebar="$old_root/dsh-client-ui-sidebar/lib/client.js"
mkdir -p "$(dirname "$old_host")" "$(dirname "$old_sidebar")"
cp "$host_target" "$old_host"
cp "$sidebar_target" "$old_sidebar"
printf '\n/* simulated v0.2 host */\n' >>"$old_host"
printf '\n/* simulated v0.2 sidebar */\n' >>"$old_sidebar"
cp "$old_host" "$host_target"
cp "$old_sidebar" "$sidebar_target"
node "$project/scripts/manifest.mjs" mark-installed \
  "$project/backup-macos/manifest.json" \
  "0.2.0" \
  "dsh-host-apiproxy/lib/index.js" "$old_host" \
  "dsh-client-ui-sidebar/lib/client.js" "$old_sidebar"
run_project "$project/install.sh" --dry-run >/dev/null
cmp "$host_target" "$old_host"
cmp "$sidebar_target" "$old_sidebar"
run_project "$project/install.sh" >/dev/null
cmp "$host_target" "$project/files/dsh-host-apiproxy/lib/index.js"
cmp "$sidebar_target" "$project/files/dsh-client-ui-sidebar/lib/client.js"
node -e 'const fs=require("fs"); const value=JSON.parse(fs.readFileSync(process.argv[1],"utf8")); if(value.patchVersion!=="0.4.1") process.exit(1)' \
  "$project/backup-macos/manifest.json"

run_project "$project/uninstall.sh" --dry-run >/dev/null
[ -d "$project/backup-macos" ]
run_project "$project/uninstall.sh" >/dev/null
cmp "$host_target" "$official_host/lib/index.js"
cmp "$sidebar_target" "$official_sidebar/lib/client.js"
[ ! -e "$project/backup-macos" ]
run_project "$project/uninstall.sh" >/dev/null
[ ! -e "$project/backup-macos" ]

run_project "$project/install.sh" >/dev/null
printf '\nintentional-test-tamper\n' >>"$sidebar_target"
if run_project "$project/uninstall.sh" >"$tmp/tamper.log" 2>&1; then
  printf 'Expected uninstall.sh to reject an unrecognized target.\n' >&2
  exit 1
fi
grep -q 'refusing to overwrite an unrecognized file' "$tmp/tamper.log"
[ -d "$project/backup-macos" ]
cp "$project/files/dsh-client-ui-sidebar/lib/client.js" "$sidebar_target"
run_project "$project/uninstall.sh" >/dev/null
[ ! -e "$project/backup-macos" ]

sidebar_directory="$(dirname "$sidebar_target")"
chmod 555 "$sidebar_directory"
if run_project "$project/install.sh" >"$tmp/rollback.log" 2>&1; then
  chmod 755 "$sidebar_directory"
  printf 'Expected install.sh to roll back after a mid-install write failure.\n' >&2
  exit 1
fi
chmod 755 "$sidebar_directory"
grep -q 'Installation failed. Restoring the pre-install files.' "$tmp/rollback.log"
cmp "$host_target" "$official_host/lib/index.js"
cmp "$sidebar_target" "$official_sidebar/lib/client.js"
[ ! -e "$project/backup-macos" ]

cp "$project/files/dsh-host-apiproxy/lib/index.js" "$host_target"
if run_project "$project/install.sh" >"$tmp/partial.log" 2>&1; then
  printf 'Expected install.sh to reject a partial install without a backup.\n' >&2
  exit 1
fi
grep -q 'partial or manually patched install' "$tmp/partial.log"
cp "$official_host/lib/index.js" "$host_target"

printf '\nintentional-test-tamper\n' >>"$sidebar_target"
if run_project "$project/install.sh" >"$tmp/first-install.log" 2>&1; then
  printf 'Expected install.sh to reject a modified first-install target.\n' >&2
  exit 1
fi
grep -q 'is not the official 0.1.0-rc.6 file' "$tmp/first-install.log"

printf 'macOS lifecycle fixture tests passed.\n'
