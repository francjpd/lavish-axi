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

# Ensure wire-axi WebSocket transport is active
unset LAVISH_AXI_DISABLE_WIRE

# Default to local task data directory if present
TASK_DATA_DIR="/home/francjpd/Projects/firstmate/data/lavish-wire-axi-local"
if [ -d "$TASK_DATA_DIR" ] && [ -z "$LAVISH_AXI_BENCHMARK_DIR" ]; then
  export LAVISH_AXI_BENCHMARK_DIR="$TASK_DATA_DIR"
fi

exec node "$REPO_ROOT/dist/cli.mjs" "$@"
