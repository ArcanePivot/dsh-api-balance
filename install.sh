#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
package_name="@arcanepivot/dsh-api-balance"
profile="web"
package_spec="${DSH_API_BALANCE_PACKAGE_SPEC:-}"
dry_run=0

usage() {
  cat <<'EOF'
Usage: ./install.sh [--profile NAME] [--package-spec SPEC] [--dry-run]

Install API $$ as a native DSH bundle. Existing v0.4.x core-file patches are
restored first; retained DSH sessions and usage history are never modified.
If --package-spec is omitted, exactly one release .tgz must sit beside this script.
EOF
}

die() {
  printf 'Error: %s\n' "$*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "required command not found: $1"
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --profile)
      [ "$#" -ge 2 ] || die "--profile requires a value"
      profile="$2"
      shift
      ;;
    --package-spec)
      [ "$#" -ge 2 ] || die "--package-spec requires a value"
      package_spec="$2"
      shift
      ;;
    --dry-run)
      dry_run=1
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      die "unknown option: $1"
      ;;
  esac
  shift
done

require_command dsh
require_command pnpm
require_command node

if [ -z "$package_spec" ]; then
  candidate_count=0
  for candidate in "$project_root"/arcanepivot-dsh-api-balance-*.tgz; do
    [ -f "$candidate" ] || continue
    package_spec="$candidate"
    candidate_count=$((candidate_count + 1))
  done
  [ "$candidate_count" -eq 1 ] || die "pass --package-spec <release.tgz>, or place exactly one arcanepivot-dsh-api-balance-*.tgz beside install.sh"
fi

legacy_root=""
if [ -d "$project_root/backup-macos" ]; then
  legacy_root="$project_root/backup-macos"
elif [ -d "$project_root/backup" ]; then
  legacy_root="$project_root/backup"
fi

if [ -n "$legacy_root" ]; then
  if [ "$dry_run" -eq 1 ]; then
    printf 'Legacy v0.4.x state found at %s; pristine DSH files would be restored first.\n' "$legacy_root"
  else
    printf 'Migrating from the v0.4.x core-file patch…\n'
    "$project_root/uninstall.sh" --legacy-only --profile "$profile"
  fi
fi

if [ "$dry_run" -eq 1 ]; then
  printf 'Dry run passed. Would install %s into DSH profile %s.\n' "$package_spec" "$profile"
  exit 0
fi

printf 'Installing native bundle %s into profile %s…\n' "$package_spec" "$profile"
dsh plugin --profile "$profile" add "$package_spec"

dsh_home="${DSH_HOME:-$HOME/.dsh}"
profile_manifest="$dsh_home/profiles/$profile/package.json"
[ -f "$profile_manifest" ] || die "DSH profile manifest was not created: $profile_manifest"
node -e '
  const fs = require("node:fs")
  const value = JSON.parse(fs.readFileSync(process.argv[1], "utf8"))
  const name = process.argv[2]
  if (typeof value.dependencies?.[name] !== "string") process.exit(1)
  if (!Array.isArray(value.dsh?.profile?.bundles) || !value.dsh.profile.bundles.includes(name)) process.exit(2)
' "$profile_manifest" "$package_name" || die "native bundle was not added to the profile manifest"

if ! dsh --profile "$profile" --dump-config | grep -Fq "name: '$package_name'"; then
  die "native plugin row is missing from the composed DSH config"
fi

printf '\nAPI $$ is installed as a native DSH plugin.\n'
printf 'No DSH package files were overwritten, and retained session history was left in place.\n'
printf 'Restart dsh web once, then refresh the browser.\n'
printf 'To remove it completely: ./uninstall.sh --profile %s\n' "$profile"
