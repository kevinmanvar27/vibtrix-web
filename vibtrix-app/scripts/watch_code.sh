#!/bin/bash

# VidiBattle Flutter App - Code Watch Script
# Watches for changes and regenerates code automatically

set -e

echo "👀 VidiBattle Code Watch Mode"
echo "=============================="

# Navigate to project root
cd "$(dirname "$0")/.."

echo ""
echo "Watching for changes in:"
echo "  - lib/**/*.dart"
echo ""
echo "Press Ctrl+C to stop watching"
echo ""

flutter pub run build_runner watch --delete-conflicting-outputs
