#!/usr/bin/env bash
set -euo pipefail

host_address="127.0.0.1"
port="3080"
launchd_label=""
launchd_domain="gui/$(id -u)"
log_file="$HOME/Library/Logs/API-Dollar/dsh-web.log"

usage() {
  cat <<'EOF'
Usage:
  ./relaunch-dsh-web.sh [--host ADDRESS] [--port PORT] [--log-file PATH]
  ./relaunch-dsh-web.sh --launchd-label LABEL [--launchd-domain DOMAIN]

Use --launchd-label for a managed DSH service so its existing environment is
preserved. The default launchd domain is gui/<current uid>.
EOF
}

die() {
  printf 'Error: %s\n' "$*" >&2
  exit 1
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --host)
      [ "$#" -ge 2 ] || die "--host requires a value"
      host_address="$2"
      shift
      ;;
    --port)
      [ "$#" -ge 2 ] || die "--port requires a value"
      port="$2"
      shift
      ;;
    --launchd-label)
      [ "$#" -ge 2 ] || die "--launchd-label requires a value"
      launchd_label="$2"
      shift
      ;;
    --launchd-domain)
      [ "$#" -ge 2 ] || die "--launchd-domain requires a value"
      launchd_domain="$2"
      shift
      ;;
    --log-file)
      [ "$#" -ge 2 ] || die "--log-file requires a value"
      log_file="$2"
      shift
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

case "$port" in
  ''|*[!0-9]*) die "port must be an integer from 1 to 65535" ;;
esac
if [ "$port" -lt 1 ] || [ "$port" -gt 65535 ]; then
  die "port must be an integer from 1 to 65535"
fi

if [ -n "$launchd_label" ]; then
  command -v launchctl >/dev/null 2>&1 || die "launchctl is not available"
  service="$launchd_domain/$launchd_label"
  launchctl kickstart -k "$service"
  printf 'Restarted launchd service: %s\n' "$service"
  exit 0
fi

command -v dsh >/dev/null 2>&1 || die "dsh is not on PATH; restart the existing service manually or use --launchd-label"

pids=()
while read -r pid command_line; do
  [ -n "$pid" ] || continue
  if [[ "$command_line" == *"dsh"* ]] &&
     [[ "$command_line" =~ [[:space:]]web([[:space:]]|$) ]] &&
     [[ "$command_line" =~ --port[[:space:]]+$port([[:space:]]|$) ]]; then
    pids+=("$pid")
  fi
done < <(ps -axo pid=,command=)

pid_count=0
if [ "${pids+x}" = "x" ]; then
  pid_count="${#pids[@]}"
fi

if [ "$pid_count" -gt 1 ]; then
  die "found multiple dsh web processes on port $port; stop the intended process manually or use --launchd-label"
fi

if [ "$pid_count" -eq 1 ]; then
  old_pid="${pids[0]}"
  printf 'Stopping dsh web (PID %s)\n' "$old_pid"
  kill -TERM "$old_pid"
  attempts=0
  while kill -0 "$old_pid" >/dev/null 2>&1 && [ "$attempts" -lt 50 ]; do
    sleep 0.1
    attempts=$((attempts + 1))
  done
  if kill -0 "$old_pid" >/dev/null 2>&1; then
    die "dsh web did not stop after 5 seconds"
  fi
fi

mkdir -p "$(dirname "$log_file")"
printf 'Starting dsh web on http://%s:%s\n' "$host_address" "$port"
nohup "$(command -v dsh)" web --host "$host_address" --port "$port" \
  >>"$log_file" 2>&1 </dev/null &
new_pid=$!

attempts=0
while [ "$attempts" -lt 20 ]; do
  if command -v curl >/dev/null 2>&1 && curl -fsS --max-time 1 \
    "http://$host_address:$port/" >/dev/null 2>&1; then
    printf 'Started dsh web (PID %s); log: %s\n' "$new_pid" "$log_file"
    exit 0
  fi
  if ! kill -0 "$new_pid" >/dev/null 2>&1; then
    die "dsh web exited during startup; inspect $log_file"
  fi
  sleep 0.5
  attempts=$((attempts + 1))
done

printf 'dsh web is still starting (PID %s); inspect %s if it does not become ready.\n' \
  "$new_pid" "$log_file"
