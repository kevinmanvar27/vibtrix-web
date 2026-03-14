# 🔔 Instagram-Style Notification Flow - Complete Guide

## Overview
Vibtrix app mein ab Instagram jaisa notification system hai with visual indicators and automatic read marking.

---

## 📱 Complete Flow

### 1️⃣ **New Notification Aaye** (Like, Follow, Comment, etc.)

#### Feed Page (Home Screen) - AppBar:
```
🔔 Bell Icon → Filled + Primary Color + Red Badge (3)
```
- Bell icon **filled** ho jata hai (solid)
- Icon ka color **blue/primary** ho jata hai
- **Red badge** with count dikhai deta hai (e.g., "3", "12", "99+")

#### What Happens in Backend:
- New notification create hoti hai with `isRead: false`
- Unread count increase hoti hai
- Provider automatically update hota hai (polling every 30 seconds)

---

### 2️⃣ **User Notification Screen Open Kare**

#### User Action:
```
User taps on 🔔 bell icon → Notification screen opens
```

#### Notification Screen Display (First 500ms):
```
🔵 [Avatar with blue ring + blue dot] @user1 liked your post  [Bold, blue background]
🔵 [Avatar with blue ring + blue dot] @user2 followed you     [Bold, blue background]  
🔵 [Avatar with blue ring + blue dot] @user3 commented        [Bold, blue background]
```

**Visual Indicators for UNREAD:**
- ✅ **Blue dot** at bottom-right of avatar
- ✅ **Blue ring** around avatar (2px border)
- ✅ **Light blue background** (8% alpha in light mode, 15% in dark mode)
- ✅ **Bold text** (font weight 600/500)
- ✅ **Darker time text** (more prominent)

#### After 500ms - Auto Mark as Read:
```javascript
Future.delayed(const Duration(milliseconds: 500), () {
  if (mounted && unreadCount > 0) {
    markAllAsRead(); // ← Instagram-style auto-read
  }
});
```

#### Notification Screen Display (After 500ms):
```
   [Normal avatar] @user1 liked your post  [Normal weight, transparent bg]
   [Normal avatar] @user2 followed you     [Normal weight, transparent bg]
   [Normal avatar] @user3 commented        [Normal weight, transparent bg]
```

**Visual Changes for READ:**
- ❌ Blue dot removed
- ❌ Blue ring removed  
- ❌ Background becomes transparent
- ❌ Text becomes normal weight
- ❌ Time text becomes lighter gray

#### Feed Page Bell Icon Updates:
```
🔔 Bell Icon → Outlined + Normal Color + No Badge
```
- Bell icon becomes **outlined** (hollow)
- Icon color becomes **normal/default**
- **Red badge disappears** (count = 0)

---

### 3️⃣ **User Screen Close Karke Reopen Kare**

#### Feed Page:
```
🔔 Bell Icon → Still outlined + No badge (0)
```

#### Notification Screen:
```
   [Normal avatar] @user1 liked your post  [Normal]
   [Normal avatar] @user2 followed you     [Normal]
   [Normal avatar] @user3 commented        [Normal]
```
- Sab notifications **already read** hain
- Koi blue indicator nahi dikhai deta
- Normal appearance

---

## 🎨 Visual Comparison

### Unread Notification:
```
┌─────────────────────────────────────────────────────┐
│ 🔵 [@user]  @username liked your post    [📷]      │ ← Blue background
│    ╰─ Blue ring                                     │
│    2m ago (bold, dark gray)                         │
└─────────────────────────────────────────────────────┘
```

### Read Notification:
```
┌─────────────────────────────────────────────────────┐
│    [@user]  @username liked your post    [📷]      │ ← Transparent bg
│    1h ago (normal, light gray)                      │
└─────────────────────────────────────────────────────┘
```

---

## 🔧 Technical Implementation

### Files Modified:

#### 1. **Feed Page** (`feed_page.dart`)
```dart
// Bell icon with badge
Consumer(
  builder: (context, ref, _) {
    final unreadCount = ref.watch(unreadNotificationsCountProvider);
    
    return Stack(
      children: [
        IconButton(
          icon: Icon(
            unreadCount > 0 
                ? Icons.notifications      // Filled when unread
                : Icons.notifications_outlined, // Outlined when read
            color: unreadCount > 0 ? AppColors.primary : null,
          ),
          onPressed: () => context.push(RouteNames.notifications),
        ),
        if (unreadCount > 0)
          Positioned(
            right: 8, top: 8,
            child: Container(/* Red badge with count */),
          ),
      ],
    );
  },
)
```

#### 2. **Notifications Page** (`notifications_page.dart`)
```dart
// Auto mark as read on screen open
@override
void initState() {
  super.initState();
  WidgetsBinding.instance.addPostFrameCallback((_) {
    ref.read(notificationsProvider.notifier).refresh();
    
    // Instagram-style: Mark all as read after 500ms
    Future.delayed(const Duration(milliseconds: 500), () {
      if (mounted) {
        final state = ref.read(notificationsProvider);
        if (state.unreadCount > 0) {
          ref.read(notificationsProvider.notifier).markAllAsRead();
        }
      }
    });
  });
}
```

```dart
// Notification item with visual indicators
Widget build(BuildContext context, WidgetRef ref) {
  return Container(
    color: notification.isRead
        ? Colors.transparent
        : AppColors.primary.withValues(alpha: 0.08), // Blue background
    child: Row(
      children: [
        Stack(
          children: [
            Container(
              decoration: notification.isRead ? null : BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.primary, width: 2), // Blue ring
              ),
              child: NetworkAvatar(...),
            ),
            if (!notification.isRead)
              Positioned(
                right: 0, bottom: 0,
                child: Container(/* Blue dot indicator */),
              ),
          ],
        ),
        // ... rest of notification content
      ],
    ),
  );
}
```

#### 3. **Notifications Provider** (`notifications_provider.dart`)
```dart
// Mark all as read
Future<void> markAllAsRead() async {
  // Optimistic update
  state = state.copyWith(
    notifications: state.notifications.map((n) => n.copyWith(isRead: true)).toList(),
    unreadCount: 0, // ← Badge count becomes 0
  );
  
  // API call
  await _repository.markAllAsRead();
}
```

---

## 🎯 Key Features

### ✅ Instagram-Style Indicators:
1. **Blue dot** on avatar (unread)
2. **Blue ring** around avatar (unread)
3. **Light blue background** (unread)
4. **Bold text** (unread)
5. **Filled bell icon** with red badge (unread)

### ✅ Automatic Read Marking:
- Screen open hote hi 500ms ke baad sab notifications read ho jati hain
- Manual tap ki zarurat nahi
- Badge count automatically 0 ho jata hai

### ✅ Real-time Updates:
- Provider polling every 30 seconds
- Badge count live update hota hai
- Bell icon appearance live change hota hai

---

## 🧪 Testing Flow

### Test Case 1: New Notification
1. Backend se new notification send karo (like, follow, etc.)
2. **Expected:** Feed page pe bell icon filled + primary color + red badge dikhe
3. **Expected:** Badge count increase ho (e.g., 1, 2, 3)

### Test Case 2: Open Notification Screen
1. Bell icon pe tap karo
2. **Expected (First 500ms):** Blue dots, rings, backgrounds dikhe
3. **Expected (After 500ms):** Sab indicators disappear ho jaye
4. **Expected:** Feed page pe bell icon outlined + no badge ho jaye

### Test Case 3: Reopen Notification Screen
1. Back press karke feed page pe jao
2. Bell icon pe dobara tap karo
3. **Expected:** Koi blue indicator nahi dikhe (sab read hai)
4. **Expected:** Bell icon still outlined + no badge

---

## 📝 Notes

- **500ms delay** isliye hai taaki user ko unread notifications dikhai de pehle
- **Optimistic updates** use kiye hain for better UX (instant feedback)
- **Polling** har 30 seconds mein hoti hai for real-time updates
- **Badge count** 99+ show karta hai agar 99 se zyada notifications hain

---

## ✅ Build Status

**All files compiled successfully!**
```bash
√ Built build\app\outputs\flutter-apk\app-debug.apk
```

---

**Last Updated:** March 14, 2026
**Status:** ✅ Fully Implemented & Working
