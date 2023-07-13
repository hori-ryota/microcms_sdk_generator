#!/usr/bin/env bash

# pick version from .tool-versions same as asdf.

TOOL_NAME="$1"
TARGET_DIR_PATH="$2"

# TARGET_DIR_PATH to abs path
CURRENT_PATH="$(cd "$TARGET_DIR_PATH" && pwd)"

while true; do
  if [ -f "$CURRENT_PATH/.tool-versions" ]; then
    if grep "$TOOL_NAME " "$CURRENT_PATH/.tool-versions" >/dev/null; then
      # expected line format: `{tool_name} {version}`
      grep "$TOOL_NAME " "$CURRENT_PATH/.tool-versions" | cut -d ' ' -f 2
      break
    fi
  fi

  if [ "$CURRENT_PATH" = "/" ]; then
    echo "version configuration for $TOOL_NAME is not found"
    exit 1
  fi
  CURRENT_PATH="$(dirname "$CURRENT_PATH")"
done
