#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
package_name="@arcanepivot/dsh-api-balance"
profile="web"
dry_run=0
legacy_only=0

usage() {
  cat <<'EOF'
Usage: ./uninstall.sh [--profile NAME] [--legacy-only] [--dry-run]

Remove the native API $$ bundle from a DSH profile. If v0.4.x patch state is
present, restore its checksummed pristine files first. DSH sessions are never
removed.
EOF
}

die() {
  printf 'Error: %s\n' "$*" >&2
  exit 1
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --profile)
      [ "$#" -ge 2 ] || die "--profile requires a value"
      profile="$2"
      shift
      ;;
    --legacy-only)
      legacy_only=1
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

restore_legacy_patch() {
  local backup_root="$1"
  local entry_count index state original_count transaction_root relative backup_path target_path

  . "$project_root/scripts/common.sh"
  DSH_API_BALANCE_PROJECT_ROOT="$project_root"
  DSH_API_BALANCE_BACKUP_ROOT="$backup_root"
  dsh_balance_find_install
  dsh_balance_assert_supported_install
  dsh_balance_assert_entry_files
  dsh_balance_validate_backup

  entry_count="${#DSH_API_BALANCE_PACKAGES[@]}"
  original_count=0
  index=0
  while [ "$index" -lt "$entry_count" ]; do
    state="$(dsh_balance_target_state "$index")"
    case "$state" in
      original) original_count=$((original_count + 1)) ;;
      patched) ;;
      *) die "refusing to overwrite an unrecognized legacy file: $(dsh_balance_relative_path "$index")" ;;
    esac
    index=$((index + 1))
  done

  if [ "$dry_run" -eq 1 ]; then
    printf 'Dry run passed. Would restore legacy v0.4.x files and remove %s.\n' "$backup_root"
    return 0
  fi

  if [ "$original_count" -eq "$entry_count" ]; then
    rm -rf "$backup_root"
    printf 'Legacy DSH files were already pristine; removed stale patch state.\n'
    return 0
  fi

  transaction_root="$(mktemp -d "${TMPDIR:-/tmp}/dsh-api-balance-migrate.XXXXXX")"
  index=0
  while [ "$index" -lt "$entry_count" ]; do
    relative="$(dsh_balance_relative_path "$index")"
    mkdir -p "$transaction_root/$(dirname "$relative")"
    cp -p "$(dsh_balance_target_path "$index")" "$transaction_root/$relative"
    index=$((index + 1))
  done

  if ! (
    index=0
    while [ "$index" -lt "$entry_count" ]; do
      relative="$(dsh_balance_relative_path "$index")"
      backup_path="$(dsh_balance_backup_path "$index")"
      target_path="$(dsh_balance_target_path "$index")"
      dsh_balance_atomic_copy "$backup_path" "$target_path"
      [ "$(dsh_balance_sha256 "$backup_path")" = "$(dsh_balance_sha256 "$target_path")" ] || exit 1
      printf '  restored legacy file: %s\n' "$relative"
      index=$((index + 1))
    done
  ); then
    dsh_balance_restore_transaction "$transaction_root"
    rm -rf "$transaction_root"
    die "legacy restore failed; pre-migration files were put back"
  fi

  rm -rf "$transaction_root" "$backup_root"
  printf 'Legacy v0.4.x core-file patch removed without touching DSH sessions.\n'
}

legacy_root=""
if [ -d "$project_root/backup-macos" ]; then
  legacy_root="$project_root/backup-macos"
elif [ -d "$project_root/backup" ]; then
  legacy_root="$project_root/backup"
fi
[ -z "$legacy_root" ] || restore_legacy_patch "$legacy_root"

if [ "$legacy_only" -eq 1 ]; then
  [ -n "$legacy_root" ] || printf 'No legacy v0.4.x patch state found.\n'
  exit 0
fi

command -v dsh >/dev/null 2>&1 || die "required command not found: dsh"
command -v node >/dev/null 2>&1 || die "required command not found: node"

dsh_home="${DSH_HOME:-$HOME/.dsh}"
profile_manifest="$dsh_home/profiles/$profile/package.json"
installed=0
if [ -f "$profile_manifest" ]; then
  if node -e '
    const fs = require("node:fs")
    const value = JSON.parse(fs.readFileSync(process.argv[1], "utf8"))
    process.exit(typeof value.dependencies?.[process.argv[2]] === "string" ? 0 : 1)
  ' "$profile_manifest" "$package_name"; then
    installed=1
  fi
fi

if [ "$installed" -eq 0 ]; then
  printf 'API $$ is not installed in profile %s; nothing to remove.\n' "$profile"
  exit 0
fi
if [ "$dry_run" -eq 1 ]; then
  printf 'Dry run passed. Would remove %s from profile %s.\n' "$package_name" "$profile"
  exit 0
fi

dsh plugin --profile "$profile" remove "$package_name"
if node -e '
  const fs = require("node:fs")
  const value = JSON.parse(fs.readFileSync(process.argv[1], "utf8"))
  process.exit(value.dependencies?.[process.argv[2]] === undefined ? 0 : 1)
' "$profile_manifest" "$package_name"; then
  printf '\nAPI $$ was removed completely from profile %s. DSH sessions remain intact.\n' "$profile"
  printf 'Restart dsh web once, then refresh the browser.\n'
else
  die "package still appears in the DSH profile after removal"
fi
