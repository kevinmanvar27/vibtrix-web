#!/bin/bash

# VidiBattle Flutter App - Code Generation Script
# Generates Retrofit API services and JSON serialization code

set -e

echo "⚙️  VidiBattle Code Generation"
echo "=============================="

# Navigate to project root
cd "$(dirname "$0")/.."

# Get dependencies first
echo ""
echo "📦 Getting dependencies..."
flutter pub get

# Generate code
echo ""
echo "🔨 Generating code..."
echo "This will generate:"
echo "  - Retrofit API service implementations"
echo "  - JSON serialization/deserialization code"
echo "  - Riverpod providers (if using riverpod_generator)"
echo ""

flutter pub run build_runner build --delete-conflicting-outputs

echo ""
echo "✅ Code generation complete!"
echo ""
echo "Generated files:"
find lib -name "*.g.dart" -type f | head -20
echo ""
echo "Total generated files: $(find lib -name "*.g.dart" -type f | wc -l)"
