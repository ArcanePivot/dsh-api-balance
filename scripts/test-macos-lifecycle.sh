#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

official_host="${1:-}"
official_sidebar="${2:-}"
if [ -z "$official_host" ] || [ -z "$official_sidebar" ]; then
  downloads="$tmp/downloads"
  mkdir -p "$downloads/host" "$downloads/sidebar"
  host_archive="$(cd "$downloads" && npm pack '@deepseek-ai/dsh-host-apiproxy@0.1.0-rc.6' --silent | tail -1)"
  sidebar_archive="$(cd "$downloads" && npm pack '@deepseek-ai/dsh-client-ui-sidebar@0.1.0-rc.6' --silent | tail -1)"
  tar -xzf "$downloads/$host_archive" -C "$downloads/host"
  tar -xzf "$downloads/$sidebar_archive" -C "$downloads/sidebar"
  official_host="$downloads/host/package"
  official_sidebar="$downloads/sidebar/package"
fi

fixture="$tmp/fixture with spaces"
project="$fixture/project"
fake_bin="$fixture/fake bin"
dsh_home="$fixture/dsh home"
mkdir -p "$project" "$fake_bin" "$dsh_home/sessions"
cp "$root/install.sh" "$root/uninstall.sh" "$project/"
cp -R "$root/scripts" "$project/"
chmod +x "$project/install.sh" "$project/uninstall.sh"
printf 'retained-session-sentinel\n' >"$dsh_home/sessions/retained.jsonl"

cat >"$fake_bin/dsh" <<'EOF'
#!/usr/bin/env node
const fs = require('node:fs')
const path = require('node:path')
const args = process.argv.slice(2)
const packageName = '@arcanepivot/dsh-api-balance'

if (args[0] === 'plugin') {
  const profileIndex = args.indexOf('--profile')
  if (profileIndex < 0 || args.length <= profileIndex + 2) process.exit(2)
  const profile = args[profileIndex + 1]
  const action = args[profileIndex + 2]
  const manifestPath = path.join(process.env.DSH_HOME, 'profiles', profile, 'package.json')
  const manifest = fs.existsSync(manifestPath)
    ? JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    : { dependencies: {}, dsh: { profile: { bundles: [] } } }
  if (action === 'add') {
    const spec = args[profileIndex + 3]
    if (!spec) process.exit(2)
    manifest.dependencies[packageName] = spec
    if (!manifest.dsh.profile.bundles.includes(packageName)) manifest.dsh.profile.bundles.push(packageName)
  } else if (action === 'remove') {
    delete manifest.dependencies[packageName]
    manifest.dsh.profile.bundles = manifest.dsh.profile.bundles.filter(name => name !== packageName)
  } else {
    process.exit(2)
  }
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true })
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
  process.exit(0)
}
if (args.includes('--dump-config')) {
  process.stdout.write(`- id: api-balance\n  name: '${packageName}'\n`)
  process.exit(0)
}
process.exit(2)
EOF
cat >"$fake_bin/pnpm" <<'EOF'
#!/bin/sh
exit 0
EOF
chmod +x "$fake_bin/dsh" "$fake_bin/pnpm"

run_native() {
  PATH="$fake_bin:$PATH" DSH_HOME="$dsh_home" "$@"
}

package_spec="$fixture/api-balance candidate.tgz"
printf 'fixture package\n' >"$package_spec"
profile_manifest="$dsh_home/profiles/web/package.json"

run_native "$project/install.sh" --package-spec "$package_spec" --dry-run >/dev/null
[ ! -e "$profile_manifest" ]
run_native "$project/install.sh" --package-spec "$package_spec" >/dev/null
node -e '
  const value = require(process.argv[1])
  const name = process.argv[2]
  if (typeof value.dependencies[name] !== "string") process.exit(1)
  if (value.dsh.profile.bundles.filter(item => item === name).length !== 1) process.exit(2)
' "$profile_manifest" '@arcanepivot/dsh-api-balance'
run_native "$project/install.sh" --package-spec "$package_spec" >/dev/null
node -e '
  const value = require(process.argv[1])
  if (value.dsh.profile.bundles.filter(item => item === process.argv[2]).length !== 1) process.exit(1)
' "$profile_manifest" '@arcanepivot/dsh-api-balance'

run_native "$project/uninstall.sh" --dry-run >/dev/null
node -e 'const value=require(process.argv[1]); process.exit(value.dependencies[process.argv[2]] ? 0 : 1)' \
  "$profile_manifest" '@arcanepivot/dsh-api-balance'
run_native "$project/uninstall.sh" >/dev/null
node -e 'const value=require(process.argv[1]); process.exit(value.dependencies[process.argv[2]] === undefined ? 0 : 1)' \
  "$profile_manifest" '@arcanepivot/dsh-api-balance'
run_native "$project/uninstall.sh" >/dev/null
grep -q retained-session-sentinel "$dsh_home/sessions/retained.jsonl"

legacy_project="$fixture/legacy project"
npm_root="$fixture/npm root"
package_root="$npm_root/@deepseek-ai/dsh/node_modules/@deepseek-ai"
mkdir -p "$legacy_project" "$package_root" "$npm_root/@deepseek-ai/dsh"
cp "$root/uninstall.sh" "$legacy_project/"
cp -R "$root/scripts" "$root/files" "$legacy_project/"
chmod +x "$legacy_project/uninstall.sh"
printf '{"name":"@deepseek-ai/dsh","version":"0.1.0-rc.6"}\n' >"$npm_root/@deepseek-ai/dsh/package.json"

mkdir -p "$package_root/dsh-host-apiproxy/lib" "$package_root/dsh-client-ui-sidebar/lib"
cp "$official_host/package.json" "$package_root/dsh-host-apiproxy/package.json"
cp "$official_sidebar/package.json" "$package_root/dsh-client-ui-sidebar/package.json"

cat >"$fake_bin/npm" <<'EOF'
#!/bin/sh
case "$1:$2" in
  root:-g|prefix:-g) printf '%s\n' "$FAKE_NPM_ROOT" ;;
  *) exit 2 ;;
esac
EOF
chmod +x "$fake_bin/npm"

initialize_legacy_state() {
  local backup="$legacy_project/backup-macos"
  cp "$legacy_project/files/dsh-host-apiproxy/lib/index.js" "$package_root/dsh-host-apiproxy/lib/index.js"
  cp "$legacy_project/files/dsh-client-ui-sidebar/lib/client.js" "$package_root/dsh-client-ui-sidebar/lib/client.js"
  mkdir -p "$backup/dsh-host-apiproxy/lib" "$backup/dsh-client-ui-sidebar/lib"
  cp "$official_host/lib/index.js" "$backup/dsh-host-apiproxy/lib/index.js"
  cp "$official_sidebar/lib/client.js" "$backup/dsh-client-ui-sidebar/lib/client.js"
  node "$legacy_project/scripts/manifest.mjs" create \
    "$backup/manifest.json" 0.4.2 0.1.0-rc.6 darwin \
    dsh-host-apiproxy/lib/index.js "$backup/dsh-host-apiproxy/lib/index.js" "$legacy_project/files/dsh-host-apiproxy/lib/index.js" \
    dsh-client-ui-sidebar/lib/client.js "$backup/dsh-client-ui-sidebar/lib/client.js" "$legacy_project/files/dsh-client-ui-sidebar/lib/client.js"
}

run_legacy() {
  PATH="$fake_bin:$PATH" FAKE_NPM_ROOT="$npm_root" DSH_HOME="$dsh_home" /bin/bash "$@"
}

backup="$legacy_project/backup-macos"
initialize_legacy_state
run_legacy "$legacy_project/uninstall.sh" --legacy-only --dry-run >/dev/null
[ -d "$backup" ]
run_legacy "$legacy_project/uninstall.sh" --legacy-only >/dev/null
cmp "$package_root/dsh-host-apiproxy/lib/index.js" "$official_host/lib/index.js"
cmp "$package_root/dsh-client-ui-sidebar/lib/client.js" "$official_sidebar/lib/client.js"
[ ! -e "$backup" ]
run_legacy "$legacy_project/uninstall.sh" --legacy-only >/dev/null

initialize_legacy_state
printf '\nintentional-tamper\n' >>"$package_root/dsh-client-ui-sidebar/lib/client.js"
if run_legacy "$legacy_project/uninstall.sh" --legacy-only >"$tmp/tamper.log" 2>&1; then
  printf 'Expected legacy migration to reject an unrecognized target.\n' >&2
  exit 1
fi
grep -q 'unrecognized legacy file' "$tmp/tamper.log"
[ -d "$backup" ]
grep -q retained-session-sentinel "$dsh_home/sessions/retained.jsonl"

printf 'macOS native and legacy-migration lifecycle tests passed.\n'
