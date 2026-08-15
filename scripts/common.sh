#!/usr/bin/env bash

# Shared macOS lifecycle helpers. Keep this compatible with Apple's Bash 3.2.

DSH_API_BALANCE_VERSION="0.4.0"
DSH_API_BALANCE_SUPPORTED_DSH_VERSION="0.1.0-rc.6"
DSH_API_BALANCE_PLATFORM="darwin"

DSH_API_BALANCE_PACKAGES=(
  "dsh-host-apiproxy"
  "dsh-client-ui-sidebar"
)
DSH_API_BALANCE_RELATIVE_FILES=(
  "lib/index.js"
  "lib/client.js"
)
DSH_API_BALANCE_ORIGINAL_SHA256=(
  "c0c506a6a22c02e07db3a1ced277c5fd4435119c1d97b83fec524da3e66711a9"
  "b8f03724988d75954b88d1fbaecf7e0cd1bf5dd17b722f7cfeb65220f9de915b"
)

DSH_API_BALANCE_COMMON_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DSH_API_BALANCE_MANIFEST_TOOL="$DSH_API_BALANCE_COMMON_DIR/manifest.mjs"

dsh_balance_die() {
  printf 'Error: %s\n' "$*" >&2
  exit 1
}

dsh_balance_require_command() {
  command -v "$1" >/dev/null 2>&1 || dsh_balance_die "required command not found: $1"
}

dsh_balance_sha256() {
  if command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$1" | awk '{print $1}'
  elif command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1}'
  else
    dsh_balance_die "neither shasum nor sha256sum is available"
  fi
}

dsh_balance_package_version() {
  node -e 'const fs=require("fs"); const p=JSON.parse(fs.readFileSync(process.argv[1],"utf8")); if(typeof p.version!=="string") process.exit(2); console.log(p.version)' "$1"
}

dsh_balance_candidate_roots=()

dsh_balance_add_candidate_root() {
  local candidate="$1"
  local existing
  [ -n "$candidate" ] || return 0
  if [ "${dsh_balance_candidate_roots+x}" != "x" ]; then
    dsh_balance_candidate_roots=("$candidate")
    return 0
  fi
  for existing in "${dsh_balance_candidate_roots[@]}"; do
    [ "$existing" = "$candidate" ] && return 0
  done
  dsh_balance_candidate_roots+=("$candidate")
}

dsh_balance_find_install() {
  local npm_root npm_prefix executable_prefix root dsh_root package_root
  local package all_present

  dsh_balance_require_command node
  dsh_balance_require_command npm

  dsh_balance_candidate_roots=()
  npm_root="$(npm root -g 2>/dev/null || true)"
  dsh_balance_add_candidate_root "$npm_root"

  npm_prefix="$(npm prefix -g 2>/dev/null || true)"
  if [ -n "$npm_prefix" ]; then
    dsh_balance_add_candidate_root "$npm_prefix/lib/node_modules"
    dsh_balance_add_candidate_root "$npm_prefix/node_modules"
  fi

  if command -v dsh >/dev/null 2>&1; then
    executable_prefix="$(cd "$(dirname "$(command -v dsh)")/.." 2>/dev/null && pwd || true)"
    if [ -n "$executable_prefix" ]; then
      dsh_balance_add_candidate_root "$executable_prefix/lib/node_modules"
      dsh_balance_add_candidate_root "$executable_prefix/node_modules"
    fi
  fi

  if [ "${dsh_balance_candidate_roots+x}" != "x" ]; then
    dsh_balance_die "npm did not report a global package root"
  fi

  for root in "${dsh_balance_candidate_roots[@]}"; do
    dsh_root="$root/@deepseek-ai/dsh"
    [ -f "$dsh_root/package.json" ] || continue

    for package_root in "$dsh_root/node_modules/@deepseek-ai" "$root/@deepseek-ai"; do
      all_present=1
      for package in "${DSH_API_BALANCE_PACKAGES[@]}"; do
        if [ ! -f "$package_root/$package/package.json" ]; then
          all_present=0
          break
        fi
      done
      if [ "$all_present" -eq 1 ]; then
        DSH_API_BALANCE_DSH_ROOT="$dsh_root"
        DSH_API_BALANCE_PACKAGE_ROOT="$package_root"
        DSH_API_BALANCE_DSH_VERSION="$(dsh_balance_package_version "$dsh_root/package.json")"
        return 0
      fi
    done
  done

  dsh_balance_die "could not locate a global @deepseek-ai/dsh installation with the required packages"
}

dsh_balance_assert_supported_install() {
  local index package version
  if [ "$DSH_API_BALANCE_DSH_VERSION" != "$DSH_API_BALANCE_SUPPORTED_DSH_VERSION" ]; then
    dsh_balance_die "unsupported @deepseek-ai/dsh version '$DSH_API_BALANCE_DSH_VERSION'; expected $DSH_API_BALANCE_SUPPORTED_DSH_VERSION"
  fi

  index=0
  while [ "$index" -lt "${#DSH_API_BALANCE_PACKAGES[@]}" ]; do
    package="${DSH_API_BALANCE_PACKAGES[$index]}"
    version="$(dsh_balance_package_version "$DSH_API_BALANCE_PACKAGE_ROOT/$package/package.json")"
    if [ "$version" != "$DSH_API_BALANCE_SUPPORTED_DSH_VERSION" ]; then
      dsh_balance_die "unsupported @deepseek-ai/$package version '$version'; expected $DSH_API_BALANCE_SUPPORTED_DSH_VERSION"
    fi
    index=$((index + 1))
  done
}

dsh_balance_relative_path() {
  printf '%s/%s\n' "${DSH_API_BALANCE_PACKAGES[$1]}" "${DSH_API_BALANCE_RELATIVE_FILES[$1]}"
}

dsh_balance_source_path() {
  printf '%s/files/%s\n' "$DSH_API_BALANCE_PROJECT_ROOT" "$(dsh_balance_relative_path "$1")"
}

dsh_balance_target_path() {
  printf '%s/%s\n' "$DSH_API_BALANCE_PACKAGE_ROOT" "$(dsh_balance_relative_path "$1")"
}

dsh_balance_backup_path() {
  printf '%s/%s\n' "$DSH_API_BALANCE_BACKUP_ROOT" "$(dsh_balance_relative_path "$1")"
}

dsh_balance_assert_entry_files() {
  local index source target
  index=0
  while [ "$index" -lt "${#DSH_API_BALANCE_PACKAGES[@]}" ]; do
    source="$(dsh_balance_source_path "$index")"
    target="$(dsh_balance_target_path "$index")"
    [ -f "$source" ] || dsh_balance_die "missing project file: $source"
    [ -f "$target" ] || dsh_balance_die "missing DSH target file: $target"
    index=$((index + 1))
  done
}

dsh_balance_assert_official_targets() {
  local index target expected actual relative
  index=0
  while [ "$index" -lt "${#DSH_API_BALANCE_PACKAGES[@]}" ]; do
    target="$(dsh_balance_target_path "$index")"
    expected="${DSH_API_BALANCE_ORIGINAL_SHA256[$index]}"
    actual="$(dsh_balance_sha256 "$target")"
    relative="$(dsh_balance_relative_path "$index")"
    if [ "$actual" != "$expected" ]; then
      dsh_balance_die "refusing first install because $relative is not the official $DSH_API_BALANCE_SUPPORTED_DSH_VERSION file"
    fi
    index=$((index + 1))
  done
}

dsh_balance_validate_backup() {
  local arguments index relative backup
  arguments=(
    "validate"
    "$DSH_API_BALANCE_BACKUP_ROOT/manifest.json"
    "$DSH_API_BALANCE_DSH_VERSION"
    "$DSH_API_BALANCE_PLATFORM"
  )
  index=0
  while [ "$index" -lt "${#DSH_API_BALANCE_PACKAGES[@]}" ]; do
    relative="$(dsh_balance_relative_path "$index")"
    backup="$(dsh_balance_backup_path "$index")"
    [ -f "$backup" ] || dsh_balance_die "missing pristine backup: $backup"
    arguments+=("$relative" "$backup")
    index=$((index + 1))
  done
  node "$DSH_API_BALANCE_MANIFEST_TOOL" "${arguments[@]}"
}

dsh_balance_target_state() {
  node "$DSH_API_BALANCE_MANIFEST_TOOL" classify \
    "$DSH_API_BALANCE_BACKUP_ROOT/manifest.json" \
    "$(dsh_balance_relative_path "$1")" \
    "$(dsh_balance_target_path "$1")"
}

dsh_balance_atomic_copy() {
  local source="$1"
  local target="$2"
  local temporary="$(dirname "$target")/.dsh-api-balance.$$.${RANDOM}.tmp"
  if ! cp -p "$source" "$temporary"; then
    rm -f "$temporary"
    return 1
  fi
  if ! mv -f "$temporary" "$target"; then
    rm -f "$temporary"
    return 1
  fi
}

dsh_balance_restore_transaction() {
  local transaction_root="$1"
  local index relative source target
  index=0
  while [ "$index" -lt "${#DSH_API_BALANCE_PACKAGES[@]}" ]; do
    relative="$(dsh_balance_relative_path "$index")"
    source="$transaction_root/$relative"
    target="$(dsh_balance_target_path "$index")"
    if [ -f "$source" ]; then
      dsh_balance_atomic_copy "$source" "$target" || true
    fi
    index=$((index + 1))
  done
}
