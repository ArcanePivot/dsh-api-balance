#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$project_root/scripts/common.sh"

dry_run=0

usage() {
  cat <<'EOF'
Usage: ./install.sh [--dry-run]

Install API $$ into a supported global DeepSeek Harness installation on macOS.
The first run stores checksummed pristine files in backup-macos/.
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
  dsh_balance_die "install.sh supports macOS only; use install.ps1 on Windows"
fi

DSH_API_BALANCE_PROJECT_ROOT="$project_root"
DSH_API_BALANCE_BACKUP_ROOT="$project_root/backup-macos"

dsh_balance_find_install
dsh_balance_assert_supported_install
dsh_balance_assert_entry_files

printf 'DSH: %s\n' "$DSH_API_BALANCE_DSH_ROOT"
printf 'Version: %s (supported)\n' "$DSH_API_BALANCE_DSH_VERSION"

matching_targets=0
index=0
while [ "$index" -lt "${#DSH_API_BALANCE_PACKAGES[@]}" ]; do
  source_path="$(dsh_balance_source_path "$index")"
  target_path="$(dsh_balance_target_path "$index")"
  if [ "$(dsh_balance_sha256 "$source_path")" = "$(dsh_balance_sha256 "$target_path")" ]; then
    matching_targets=$((matching_targets + 1))
  fi
  index=$((index + 1))
done

entry_count="${#DSH_API_BALANCE_PACKAGES[@]}"
backup_exists=0
[ -d "$DSH_API_BALANCE_BACKUP_ROOT" ] && backup_exists=1
backup_created=0

if [ "$matching_targets" -eq "$entry_count" ]; then
  if [ "$backup_exists" -ne 1 ]; then
    dsh_balance_die "patched files are installed but backup-macos/ is missing; reinstall DSH $DSH_API_BALANCE_SUPPORTED_DSH_VERSION cleanly first"
  fi
  dsh_balance_validate_backup
  installed_patch_version="$(node -e 'const fs=require("fs"); const value=JSON.parse(fs.readFileSync(process.argv[1],"utf8")); process.stdout.write(String(value.patchVersion || ""))' "$DSH_API_BALANCE_BACKUP_ROOT/manifest.json")"
  if [ "$installed_patch_version" != "$DSH_API_BALANCE_VERSION" ]; then
    if [ "$dry_run" -eq 1 ]; then
      printf 'Dry run passed. Would promote backup metadata from API $$ %s to %s; installed files already match.\n' \
        "${installed_patch_version:-unknown}" "$DSH_API_BALANCE_VERSION"
      exit 0
    fi
    mark_arguments=(
      "mark-installed"
      "$DSH_API_BALANCE_BACKUP_ROOT/manifest.json"
      "$DSH_API_BALANCE_VERSION"
    )
    index=0
    while [ "$index" -lt "$entry_count" ]; do
      mark_arguments+=(
        "$(dsh_balance_relative_path "$index")"
        "$(dsh_balance_source_path "$index")"
      )
      index=$((index + 1))
    done
    node "$DSH_API_BALANCE_MANIFEST_TOOL" "${mark_arguments[@]}"
    printf 'Installed files already match; promoted backup metadata to API $$ %s.\n' "$DSH_API_BALANCE_VERSION"
    exit 0
  fi
  printf 'API $$ is already installed; no files changed.\n'
  exit 0
fi

if [ "$backup_exists" -ne 1 ] && [ "$matching_targets" -gt 0 ]; then
  dsh_balance_die "detected a partial or manually patched install without a pristine backup"
fi

if [ "$backup_exists" -eq 1 ]; then
  dsh_balance_validate_backup
  index=0
  while [ "$index" -lt "$entry_count" ]; do
    state="$(dsh_balance_target_state "$index")"
    if [ "$state" = "unknown" ]; then
      dsh_balance_die "refusing to overwrite an unrecognized file: $(dsh_balance_relative_path "$index")"
    fi
    index=$((index + 1))
  done
else
  dsh_balance_assert_official_targets
fi

if [ "$dry_run" -eq 1 ]; then
  printf 'Dry run passed. Would back up and install API $$ %s into %s.\n' \
    "$DSH_API_BALANCE_VERSION" "$DSH_API_BALANCE_DSH_ROOT"
  exit 0
fi

if [ "$backup_exists" -ne 1 ]; then
  staging_root="$DSH_API_BALANCE_BACKUP_ROOT.staging.$$"
  [ ! -e "$staging_root" ] || dsh_balance_die "backup staging path already exists: $staging_root"
  mkdir -p "$staging_root"

  staging_active=1
  cleanup_staging() {
    status=$?
    if [ "$staging_active" -eq 1 ]; then
      rm -rf "$staging_root"
    fi
    return "$status"
  }
  trap cleanup_staging EXIT
  trap 'exit 130' HUP INT TERM

  manifest_arguments=(
    "create"
    "$staging_root/manifest.json"
    "$DSH_API_BALANCE_VERSION"
    "$DSH_API_BALANCE_DSH_VERSION"
    "$DSH_API_BALANCE_PLATFORM"
  )
  index=0
  while [ "$index" -lt "$entry_count" ]; do
    relative="$(dsh_balance_relative_path "$index")"
    staged_backup="$staging_root/$relative"
    mkdir -p "$(dirname "$staged_backup")"
    cp -p "$(dsh_balance_target_path "$index")" "$staged_backup"
    manifest_arguments+=(
      "$relative"
      "$staged_backup"
      "$(dsh_balance_source_path "$index")"
    )
    index=$((index + 1))
  done

  if ! node "$DSH_API_BALANCE_MANIFEST_TOOL" "${manifest_arguments[@]}"; then
    rm -rf "$staging_root"
    dsh_balance_die "could not create the pristine backup manifest"
  fi
  mv "$staging_root" "$DSH_API_BALANCE_BACKUP_ROOT"
  backup_created=1
  staging_active=0
  trap - EXIT HUP INT TERM
  printf 'Created checksummed pristine backup: %s\n' "$DSH_API_BALANCE_BACKUP_ROOT"
fi

transaction_root="$(mktemp -d "${TMPDIR:-/tmp}/dsh-api-balance-install.XXXXXX")"
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
    printf 'Installation failed. Restoring the pre-install files.\n' >&2
    dsh_balance_restore_transaction "$transaction_root"
    if [ "$backup_created" -eq 1 ]; then
      rm -rf "$DSH_API_BALANCE_BACKUP_ROOT"
    fi
  fi
  rm -rf "$transaction_root"
  return "$status"
}
trap cleanup_transaction EXIT
trap 'exit 130' HUP INT TERM

mark_arguments=(
  "mark-installed"
  "$DSH_API_BALANCE_BACKUP_ROOT/manifest.json"
  "$DSH_API_BALANCE_VERSION"
)
index=0
while [ "$index" -lt "$entry_count" ]; do
  relative="$(dsh_balance_relative_path "$index")"
  source_path="$(dsh_balance_source_path "$index")"
  target_path="$(dsh_balance_target_path "$index")"
  dsh_balance_atomic_copy "$source_path" "$target_path"
  if [ "$(dsh_balance_sha256 "$source_path")" != "$(dsh_balance_sha256 "$target_path")" ]; then
    dsh_balance_die "post-install checksum mismatch: $relative"
  fi
  printf '  installed: %s\n' "$relative"
  mark_arguments+=("$relative" "$source_path")
  index=$((index + 1))
done

node "$DSH_API_BALANCE_MANIFEST_TOOL" "${mark_arguments[@]}"

transaction_active=0
trap - EXIT HUP INT TERM
rm -rf "$transaction_root"

printf '\nInstalled %s files successfully.\n' "$entry_count"
printf 'Restart DSH, then refresh the browser.\n'
printf 'Manual process: ./relaunch-dsh-web.sh\n'
printf 'launchd service: ./relaunch-dsh-web.sh --launchd-label <label>\n'
printf 'To restore pristine files: ./uninstall.sh\n'
