#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$project_root/scripts/common.sh"

dry_run=0

usage() {
  cat <<'EOF'
Usage: ./uninstall.sh [--dry-run]

Restore the checksummed pristine DSH files saved by install.sh on macOS.
EOF
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --dry-run)
      dry_run=1
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      dsh_balance_die "unknown option: $1"
      ;;
  esac
  shift
done

if [ "$(uname -s)" != "Darwin" ] && [ "${DSH_API_BALANCE_TEST_MODE:-0}" != "1" ]; then
  dsh_balance_die "uninstall.sh supports macOS only; use uninstall.ps1 on Windows"
fi

DSH_API_BALANCE_PROJECT_ROOT="$project_root"
DSH_API_BALANCE_BACKUP_ROOT="$project_root/backup-macos"

if [ ! -d "$DSH_API_BALANCE_BACKUP_ROOT" ]; then
  printf 'No backup-macos/ directory found; nothing to restore.\n'
  exit 0
fi

dsh_balance_find_install
dsh_balance_assert_supported_install
dsh_balance_assert_entry_files
dsh_balance_validate_backup

printf 'DSH: %s\n' "$DSH_API_BALANCE_DSH_ROOT"
printf 'Version: %s (supported)\n' "$DSH_API_BALANCE_DSH_VERSION"

entry_count="${#DSH_API_BALANCE_PACKAGES[@]}"
original_count=0
index=0
while [ "$index" -lt "$entry_count" ]; do
  state="$(dsh_balance_target_state "$index")"
  case "$state" in
    original)
      original_count=$((original_count + 1))
      ;;
    patched)
      ;;
    *)
      dsh_balance_die "refusing to overwrite an unrecognized file: $(dsh_balance_relative_path "$index")"
      ;;
  esac
  index=$((index + 1))
done

if [ "$original_count" -eq "$entry_count" ]; then
  printf 'The pristine DSH files are already restored; no files changed.\n'
  exit 0
fi

if [ "$dry_run" -eq 1 ]; then
  printf 'Dry run passed. Would restore %s pristine DSH files.\n' "$entry_count"
  exit 0
fi

transaction_root="$(mktemp -d "${TMPDIR:-/tmp}/dsh-api-balance-uninstall.XXXXXX")"
index=0
while [ "$index" -lt "$entry_count" ]; do
  relative="$(dsh_balance_relative_path "$index")"
  transaction_path="$transaction_root/$relative"
  mkdir -p "$(dirname "$transaction_path")"
  cp -p "$(dsh_balance_target_path "$index")" "$transaction_path"
  index=$((index + 1))
done

transaction_active=1
cleanup_transaction() {
  status=$?
  if [ "$transaction_active" -eq 1 ]; then
    printf 'Restore failed. Putting the pre-uninstall files back.\n' >&2
    dsh_balance_restore_transaction "$transaction_root"
  fi
  rm -rf "$transaction_root"
  return "$status"
}
trap cleanup_transaction EXIT
trap 'exit 130' HUP INT TERM

index=0
while [ "$index" -lt "$entry_count" ]; do
  relative="$(dsh_balance_relative_path "$index")"
  backup_path="$(dsh_balance_backup_path "$index")"
  target_path="$(dsh_balance_target_path "$index")"
  dsh_balance_atomic_copy "$backup_path" "$target_path"
  if [ "$(dsh_balance_sha256 "$backup_path")" != "$(dsh_balance_sha256 "$target_path")" ]; then
    dsh_balance_die "post-restore checksum mismatch: $relative"
  fi
  printf '  restored: %s\n' "$relative"
  index=$((index + 1))
done

node "$DSH_API_BALANCE_MANIFEST_TOOL" mark-uninstalled \
  "$DSH_API_BALANCE_BACKUP_ROOT/manifest.json"

transaction_active=0
trap - EXIT HUP INT TERM
rm -rf "$transaction_root"

printf '\nRestored %s pristine files successfully.\n' "$entry_count"
printf 'Restart DSH, then refresh the browser.\n'
