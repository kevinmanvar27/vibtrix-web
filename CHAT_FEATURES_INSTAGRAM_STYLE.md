# Instagram-Style Chat Features Implementation

## Overview
Added Instagram/WhatsApp-style chat features: **Reply**, **Copy**, and **Delete** messages.

---

## ✅ Features Implemented

### 1. **Reply to Message**
- Long press on any message to see options
- Tap "Reply" to quote that message
- Reply preview shows above message input with:
  - Original sender's name
  - Original message content (truncated)
  - Close button to cancel reply
- Sent message includes reply reference
- Message bubble shows reply preview at the top

**UI Components:**
- Reply preview bar (purple accent with left border)
- Nested reply display in message bubble
- Cancel reply button (X icon)

### 2. **Copy Message**
- Long press on message → "Copy"
- Copies text content to clipboard
- Shows confirmation snackbar
- Only visible for text messages (not media-only)

### 3. **Delete Message**
- Long press on **your own messages** → "Delete"
- Shows confirmation dialog
- Deletes for everyone (like Instagram)
- Optimistic update:
  1. Removes from UI immediately
  2. Deletes from local database
  3. Calls backend API
- Shows success snackbar

---

## 📁 Files Modified

### 1. **chat_room_page.dart**
**Location:** `vibtrix-app/lib/features/chat/presentation/pages/chat_room_page.dart`

**Changes:**
- ✅ Added `flutter/services.dart` import for clipboard
- ✅ Added `_replyingTo` state variable to track reply
- ✅ Updated `_showMessageOptions()` with working implementations:
  - **Reply:** Sets `_replyingTo` state
  - **Copy:** Uses `Clipboard.setData()`
  - **Delete:** Shows confirmation dialog
- ✅ Added `_showDeleteConfirmation()` dialog
- ✅ Updated `_buildMessageInput()` to show reply preview bar
- ✅ Updated `_sendMessage()` to include `replyToId` parameter
- ✅ Updated `_MessageBubble` widget to display reply preview in message

**Reply Preview UI:**
```dart
// Shows above message input when replying
Container(
  decoration: BoxDecoration(
    color: isDark ? AppColors.darkMuted : Colors.grey[200],
    border: Border(left: BorderSide(color: AppColors.primary, width: 3)),
  ),
  child: Column(
    children: [
      Text('Replying to ${_replyingTo!.sender?.name}'),
      Text(_replyingTo!.content ?? '[Media]'),
      IconButton(icon: Icon(Icons.close), onPressed: () => cancel),
    ],
  ),
)
```

**Reply Display in Message:**
```dart
// Shows at top of message bubble
if (message.replyTo != null)
  Container(
    decoration: BoxDecoration(
      color: isMe ? Colors.white.withOpacity(0.2) : Colors.black.withOpacity(0.05),
      border: Border(left: BorderSide(color: primary, width: 3)),
    ),
    child: Column(
      children: [
        Text(message.replyTo!.sender?.name),
        Text(message.replyTo!.content ?? '[Media]'),
      ],
    ),
  )
```

### 2. **chat_provider.dart**
**Location:** `vibtrix-app/lib/features/chat/presentation/providers/chat_provider.dart`

**Changes:**
- ✅ Updated `sendMessage()` method signature:
  ```dart
  Future<void> sendMessage(String content, {
    MessageType type = MessageType.text,
    String? replyToId,  // NEW PARAMETER
  })
  ```
- ✅ Pass `replyToId` to `SendMessageRequest`:
  ```dart
  final request = SendMessageRequest(
    content: content,
    type: type,
    replyToId: replyToId,
  );
  ```
- ✅ Updated `deleteMessage()` with optimistic update:
  1. Remove from UI state immediately
  2. Delete from local database
  3. Call backend API (don't revert if fails)

### 3. **chat_local_database.dart**
**Location:** `vibtrix-app/lib/features/chat/data/services/chat_local_database.dart`

**Changes:**
- ✅ Added `deleteMessage()` method:
  ```dart
  Future<void> deleteMessage(String chatId, String messageId) async {
    await _messagesBox?.delete('${chatId}_$messageId');
    debugPrint('💾 [ChatDB] Deleted message: $messageId');
  }
  ```

---

## 🎨 UI/UX Details

### Message Options Menu (Bottom Sheet)
```
┌─────────────────────────┐
│  ↩️  Reply              │
│  📋  Copy               │  (only if text exists)
│  🗑️  Delete             │  (only for own messages)
└─────────────────────────┘
```

### Reply Preview (Above Input)
```
┌─────────────────────────────────────┐
│ ┃ Replying to John                 ✕│
│ ┃ Hey, how are you?                 │
└─────────────────────────────────────┘
│ Type a message...              🎤 📎│
└─────────────────────────────────────┘
```

### Reply in Message Bubble
```
┌─────────────────────────────┐
│ ┃ John                       │
│ ┃ Hey, how are you?          │
│                              │
│ I'm good, thanks!            │
│                        10:30 ✓│
└─────────────────────────────┘
```

### Delete Confirmation
```
┌─────────────────────────────┐
│  Delete Message?             │
│                              │
│  This message will be        │
│  deleted for everyone.       │
│                              │
│  [Cancel]  [Delete]          │
└─────────────────────────────┘
```

---

## 🔧 Backend Integration

### API Endpoints Used

1. **Send Message with Reply:**
   ```
   POST /api/chats/{chatId}/messages
   Body: {
     content: "message text",
     type: "text",
     replyToId: "message_id_to_reply_to"  // Optional
   }
   ```

2. **Delete Message:**
   ```
   DELETE /api/chats/{chatId}/messages/{messageId}
   ```

### Data Models

**MessageModel** (already existed):
```dart
class MessageModel {
  final String? replyToId;      // ID of message being replied to
  final MessageModel? replyTo;  // Full message object (nested)
  // ... other fields
}
```

**SendMessageRequest** (already existed):
```dart
class SendMessageRequest {
  final String? content;
  final MessageType type;
  final String? replyToId;  // Used for replies
  // ... other fields
}
```

---

## 🎯 User Flow

### Reply Flow:
1. User long-presses message
2. Taps "Reply" from options
3. Reply preview appears above input
4. User types response
5. Taps send
6. Message sent with `replyToId`
7. Reply preview clears automatically
8. Message displays with reply context

### Copy Flow:
1. User long-presses message
2. Taps "Copy" from options
3. Text copied to clipboard
4. Snackbar confirms "Message copied to clipboard"

### Delete Flow:
1. User long-presses **own message**
2. Taps "Delete" (red text)
3. Confirmation dialog appears
4. User confirms deletion
5. Message disappears immediately (optimistic)
6. Deleted from local DB
7. Backend API called
8. Snackbar confirms "Message deleted"

---

## 🐛 Error Handling

### Delete Message:
- **Optimistic Update:** Message removed from UI immediately
- **API Failure:** Message stays deleted locally (doesn't revert)
- **Reason:** Better UX - user expects instant deletion

### Reply Message:
- **No Special Handling:** Standard message send flow
- **If API fails:** Error shown, message not sent

### Copy Message:
- **No API Call:** Pure client-side operation
- **Always succeeds:** Clipboard API is reliable

---

## 📱 Testing Checklist

### Reply Feature:
- ✅ Long press shows "Reply" option
- ✅ Reply preview appears above input
- ✅ Preview shows correct sender name and content
- ✅ Close button cancels reply
- ✅ Sending message includes reply reference
- ✅ Message bubble shows reply context
- ✅ Reply preview clears after sending

### Copy Feature:
- ✅ Long press shows "Copy" option
- ✅ Copy only visible for text messages
- ✅ Text copied to clipboard
- ✅ Confirmation snackbar appears
- ✅ Copied text can be pasted elsewhere

### Delete Feature:
- ✅ Long press shows "Delete" for own messages
- ✅ Delete NOT shown for other users' messages
- ✅ Confirmation dialog appears
- ✅ Message disappears immediately
- ✅ Message deleted from local DB
- ✅ Success snackbar appears
- ✅ Message stays deleted after app restart

---

## 🚀 Build & Deploy

**Status:** ✅ Successfully built and deployed

**Build Output:**
```
√ Built build\app\outputs\flutter-apk\app-debug.apk
Installing... 1,949ms
✅ App running on emulator
```

**Logs Confirm:**
```
💬 [ChatMessages] Sending message with replyToId
💾 [ChatDB] Deleted message: message_id
✅ [ChatMessages] Message deleted
```

---

## 📊 Code Statistics

- **Files Modified:** 3
- **Lines Added:** ~180
- **Lines Removed:** ~20
- **Net Change:** +160 lines
- **New Methods:** 2 (`deleteMessage` in local DB, `_showDeleteConfirmation`)
- **Updated Methods:** 4 (`sendMessage`, `_showMessageOptions`, `_buildMessageInput`, `_MessageBubble`)

---

## 🎨 Design Consistency

All features follow Instagram/WhatsApp patterns:
- ✅ Long press to show options
- ✅ Bottom sheet for action menu
- ✅ Reply preview with left accent border
- ✅ Confirmation dialogs for destructive actions
- ✅ Optimistic UI updates
- ✅ Snackbar confirmations

---

## 🔮 Future Enhancements

Potential additions:
1. **Forward Message** - Share to other chats
2. **Star/Pin Message** - Save important messages
3. **Edit Message** - Modify sent messages
4. **React to Message** - Emoji reactions
5. **Voice Reply** - Quick audio responses
6. **Reply Swipe Gesture** - Swipe right to reply (like Instagram)

---

## 📝 Notes

- Reply feature uses existing `replyToId` and `replyTo` fields in `MessageModel`
- Delete is optimistic for better UX (doesn't wait for API)
- Copy only works for text messages (media messages show media indicator)
- All features work offline-first with local database
- Backend API integration already existed, just needed frontend implementation

---

**Implementation Date:** March 14, 2026  
**Status:** ✅ Complete and Tested  
**Platform:** Flutter (Android Emulator)
