# Vibtrix App - Real Device Deployment Guide

This document explains how to deploy the Vibtrix app to real devices for both Android and iOS platforms.

## Prerequisites

Before deploying to real devices, ensure you have:

- Flutter SDK installed and configured
- Android Studio and/or Xcode with proper device configurations
- Valid Apple Developer Account (for iOS)
- Valid Google Services configuration (for Firebase and Google Sign-In)

## Android Deployment

### 1. Configure Firebase Credentials

Update `lib/firebase_options.dart` with your actual Firebase project credentials:

```dart
static const FirebaseOptions android = FirebaseOptions(
  apiKey: 'YOUR_ACTUAL_ANDROID_API_KEY',
  appId: 'YOUR_ACTUAL_ANDROID_APP_ID',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  projectId: 'your-actual-project-id',
  storageBucket: 'your-project-id.appspot.com',
);
```

### 2. Configure Google Services

Replace the placeholder Google Services configuration in `android/app/google-services.json` with your actual configuration file from Firebase Console.

### 3. Build the APK

```bash
flutter build apk --release
```

The APK will be located at:
`build/app/outputs/flutter-apk/app-release.apk`

### 4. Install on Device

You can install the APK on your Android device using:

- Direct installation by transferring the file to your device
- Using ADB: `adb install build/app/outputs/flutter-apk/app-release.apk`

## iOS Deployment

### 1. Configure Firebase Credentials

Update `lib/firebase_options.dart` with your actual Firebase project credentials:

```dart
static const FirebaseOptions ios = FirebaseOptions(
  apiKey: 'YOUR_ACTUAL_IOS_API_KEY',
  appId: 'YOUR_ACTUAL_IOS_APP_ID',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  projectId: 'your-actual-project-id',
  storageBucket: 'your-project-id.appspot.com',
  iosBundleId: 'com.rektech.vibtrix', // Make sure this matches your bundle ID
);
```

### 2. Configure Google Services

1. Update the Google Services URL scheme in `ios/Runner/Info.plist`:

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleTypeRole</key>
    <string>Editor</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>com.googleusercontent.apps.YOUR_IOS_CLIENT_ID</string>
    </array>
  </dict>
</array>
```

2. Update the Google Sign-In client ID:

```xml
<key>GIDClientID</key>
<string>YOUR_IOS_CLIENT_ID.apps.googleusercontent.com</string>
```

### 3. Update Bundle Identifier

1. Open `ios/Runner.xcodeproj` in Xcode
2. Select the project in the navigator
3. Go to the "General" tab
4. Update the Bundle Identifier to match your registered app in Apple Developer Portal

### 4. Configure Code Signing

1. In Xcode, go to the "Signing & Capabilities" tab
2. Select your Team from the dropdown
3. Xcode should automatically manage signing profiles

### 5. Build for iOS

```bash
flutter build ios --release
```

### 6. Deploy to Device

1. Connect your iOS device to your Mac
2. Open the project in Xcode: `open ios/Runner.xcworkspace`
3. Select your device as the target
4. Press the Run button

## Alternative: Automated Build Script

The project includes a script to automate the build process:

```bash
./scripts/build_for_device.sh
```

## Important Notes

1. **Security**: Remove any development domains from the network security configuration before production deployment
2. **Firebase**: Ensure your actual Firebase project has the correct SHA-1/SHA-256 fingerprints registered for Android and the correct bundle ID for iOS
3. **Google Sign-In**: Make sure your OAuth consent screen is properly configured in Google Cloud Console
4. **App Store Distribution**: For App Store submission, additional configurations and review processes are required

## Troubleshooting

### iOS Device Connection Issues

If your iOS device doesn't appear in Xcode:
1. Ensure your device is unlocked and connected via USB
2. Trust the computer on your device
3. Make sure your device is enrolled in Developer Mode (iOS 16+)

### Android Installation Issues

If installation fails:
1. Enable "USB Debugging" on your Android device
2. Enable "Install via USB" if prompted
3. Check that you have the latest USB drivers installed

## Ready for Production?

Before publishing to app stores:
- Replace all placeholder credentials with actual values
- Test thoroughly on various device models
- Review and optimize app size
- Ensure all privacy policies and terms are in place
- Test all app functionalities on real devices