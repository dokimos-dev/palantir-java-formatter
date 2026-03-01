#!/bin/bash

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( dirname "$SCRIPT_DIR" )"
DAEMON_DIR="$PROJECT_ROOT/daemon"
LIB_DIR="$PROJECT_ROOT/lib"

echo "Building Palantir Java Format daemon..."

# Create lib directory if it doesn't exist
mkdir -p "$LIB_DIR"

# Build the daemon
cd "$DAEMON_DIR"
./gradlew shadowJar

# Copy the JAR to lib directory
cp "$DAEMON_DIR/build/libs/formatter-daemon.jar" "$LIB_DIR/formatter-daemon.jar"

echo "Daemon build complete: $LIB_DIR/formatter-daemon.jar"
