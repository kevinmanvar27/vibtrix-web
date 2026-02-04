#!/bin/bash

# Script to prepare and build the Vibtrix app for real device deployment

echo "🚀 Preparing Vibtrix app for real device deployment..."

# Check if flutter is installed
if ! command -v flutter &> /dev/null; then
    echo "❌ Flutter is not installed or not in PATH"
    exit 1
fi

echo "✅ Flutter is installed"

# Get the current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "📂 Project directory: $PROJECT_DIR"

# Navigate to project directory
cd "$PROJECT_DIR"

# Clean previous builds
echo "🧹 Cleaning previous builds..."
flutter clean

# Get dependencies
echo "📦 Getting dependencies..."
flutter pub get

# Run build runner if available
echo "⚙️ Running build runner..."
flutter packages pub run build_runner build --delete-conflicting-outputs

# Generate code (if needed)
echo "📝 Generating code..."
flutter gen-l10n

# Build for Android
echo "📱 Building for Android..."
flutter build apk --release

# Build for iOS
echo "🍎 Building for iOS..."
flutter build ios --release --no-codesign

echo "✅ Build process completed!"
echo ""
echo "📁 APK location: $PROJECT_DIR/build/app/outputs/flutter-apk/app-release.apk"
echo "📁 iOS build location: $PROJECT_DIR/build/ios/archive/Runner.xcarchive"
echo ""
echo "📝 NOTES:"
echo "   - For Android: Install the APK on your device using ADB or direct installation"
echo "   - For iOS: You need to sign the app in Xcode before installing on a real device"
echo "   - Make sure to replace placeholder Firebase credentials with your actual project credentials"
echo "   - Update Google Services configuration in both Android and iOS with your actual project details"
echo "   - For production, make sure to properly configure code signing for both platforms"