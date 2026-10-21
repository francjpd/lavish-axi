#!/usr/bin/env bash
# Local lavish-axi launcher with wire-axi WebSocket transport active
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Ensure build exists
if [ ! -f "$REPO_ROOT/dist/cli.mjs" ]; then
  echo "[lavish-axi-local] Building dist/cli.mjs..." >&2
  node "$REPO_ROOT/scripts/build.js"
fi

# Ensure wire-axi WebSocket transport is active.
# LAVISH_AXI_LOCAL_WIRE=0 opts out so the HTTP-poll fallback can be exercised locally.
if [ "${LAVISH_AXI_LOCAL_WIRE:-1}" != "0" ]; then
  unset LAVISH_AXI_DISABLE_WIRE
fi

# Default to local task data directory if present
TASK_DATA_DIR="$REPO_ROOT/data/lavish-wire-axi-local"
if [ -d "$TASK_DATA_DIR" ] && [ -z "$LAVISH_AXI_BENCHMARK_DIR" ]; then
  export LAVISH_AXI_BENCHMARK_DIR="$TASK_DATA_DIR"
fi

exec node "$REPO_ROOT/dist/cli.mjs" "$@"
