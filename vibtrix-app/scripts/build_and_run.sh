#!/bin/bash

# VidiBattle Flutter App - Build and Run Script
# This script handles code generation and app launch

set -e

echo "🚀 VidiBattle Build Script"
echo "=========================="

# Navigate to project root
cd "$(dirname "$0")/.."

# Step 1: Get dependencies
echo ""
echo "📦 Step 1: Getting dependencies..."
flutter pub get

# Step 2: Generate code
echo ""
echo "⚙️  Step 2: Generating code (Retrofit, JSON serialization)..."
flutter pub run build_runner build --delete-conflicting-outputs

# Step 3: Verify build
echo ""
echo "🔍 Step 3: Verifying build..."
flutter analyze --no-fatal-infos

# Step 4: Run the app
echo ""
echo "📱 Step 4: Running the app..."
echo "Choose a device:"
flutter devices

read -p "Enter device ID (or press Enter for default): " device_id

if [ -z "$device_id" ]; then
    flutter run
else
    flutter run -d "$device_id"
fi
