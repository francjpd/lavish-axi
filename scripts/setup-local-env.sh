#!/usr/bin/env bash
# Local configuration helper for lavish-axi with wire-axi WebSocket transport
# Usage:
#   source scripts/setup-local-env.sh   (activates in current shell session)
#   bash scripts/setup-local-env.sh     (installs launcher and activation script)
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

DATA_DIR="${LAVISH_AXI_BENCHMARK_DIR:-$REPO_ROOT/data/lavish-wire-axi-local}"
mkdir -p "$DATA_DIR/bin"

echo "[setup-local-env] Building lavish-axi..."
(cd "$REPO_ROOT" && node scripts/build.js)

# Install launcher binary in DATA_DIR/bin/lavish-axi
LAUNCHER="$DATA_DIR/bin/lavish-axi"
cat > "$LAUNCHER" << EOF
#!/usr/bin/env bash
REPO_ROOT="$REPO_ROOT"
unset LAVISH_AXI_DISABLE_WIRE
export LAVISH_AXI_BENCHMARK_DIR="$DATA_DIR"
if [ -z "\$LAVISH_AXI_DUAL_TRANSPORT" ] && [ "\$LAVISH_AXI_BENCHMARK" != "0" ]; then
  export LAVISH_AXI_DUAL_TRANSPORT="1"
fi
exec node "\$REPO_ROOT/dist/cli.mjs" "\$@"
EOF
chmod +x "$LAUNCHER"

# Create activation helper script
ACTIVATE="$DATA_DIR/activate.sh"
cat > "$ACTIVATE" << EOF
export PATH="$DATA_DIR/bin:\$PATH"
export LAVISH_AXI_BENCHMARK_DIR="$DATA_DIR"
export LAVISH_AXI_DUAL_TRANSPORT="1"
unset LAVISH_AXI_DISABLE_WIRE
echo "[lavish-wire-axi-local] Environment activated: lavish-axi -> $LAUNCHER"
EOF
chmod +x "$ACTIVATE"

echo "[setup-local-env] Installed launcher at: $LAUNCHER"
echo "[setup-local-env] Created activation script at: $ACTIVATE"

# If sourced, apply immediately to current shell
if [ "${BASH_SOURCE[0]}" != "${0}" ]; then
  export PATH="$DATA_DIR/bin:$PATH"
  export LAVISH_AXI_BENCHMARK_DIR="$DATA_DIR"
  export LAVISH_AXI_DUAL_TRANSPORT="1"
  unset LAVISH_AXI_DISABLE_WIRE
  echo "[setup-local-env] Activated in current shell: \$(which lavish-axi)"
fi
