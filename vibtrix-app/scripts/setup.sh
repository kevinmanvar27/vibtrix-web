#!/bin/bash

# VidiBattle Flutter App Setup Script
# Run this script to set up the development environment

set -e

echo "🚀 VidiBattle Setup Script"
echo "=========================="
echo ""

# Check if Flutter is installed
if ! command -v flutter &> /dev/null; then
    echo "❌ Flutter is not installed or not in PATH"
    echo "Please install Flutter from https://flutter.dev/docs/get-started/install"
    exit 1
fi

echo "✓ Flutter found: $(flutter --version | head -1)"
echo ""

# Navigate to project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/.."

echo "📦 Installing dependencies..."
flutter pub get

echo ""
echo "🔧 Running code generation..."
flutter pub run build_runner build --delete-conflicting-outputs

echo ""
echo "🔍 Running Flutter analyze..."
flutter analyze || true

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure Firebase: flutterfire configure"
echo "2. Update API URL in lib/core/constants/api_constants.dart"
echo "3. Run the app: flutter run"
echo ""
