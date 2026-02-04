# VidiBattle API Documentation

## Overview

This document provides comprehensive API documentation for the VidiBattle mobile application (Flutter).

**Base URL:** `http://localhost:3001/`

**API Version:** v1

---

## Authentication

VidiBattle supports two authentication methods:

### 1. JWT Authentication (Recommended for Mobile)

All protected endpoints support JWT authentication via the `Authorization` header.

```
Authorization: Bearer <access_token>
```

**Token Lifecycle:**
- **Access Token:** Short-lived (15 minutes), used for API requests
- **Refresh Token:** Long-lived (7 days), used to obtain new access tokens

### 2. Session Authentication (Web Only)

Cookie-based session authentication is used by the web application. Mobile apps should use JWT.

---

## Authentication Endpoints

### POST /api/auth/token

Authenticate user and obtain JWT tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "cuid_xxx",
    "username": "johndoe",
    "displayName": "John Doe",
    "email": "user@example.com",
    "avatarUrl": "/uploads/avatars/xxx.webp",
    "bio": "Hello world",
    "isProfilePublic": true
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `400` - Invalid input
- `401` - Invalid credentials
- `403` - Account disabled

---

### POST /api/auth/signup

Register a new user account.

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "cuid_xxx",
    "username": "johndoe",
    "displayName": "johndoe",
    "email": "user@example.com"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Validation Rules:**
- Username: 3-20 characters, alphanumeric and underscores only
- Email: Valid email format
- Password: Minimum 8 characters, must include uppercase, lowercase, and number

---

### POST /api/auth/refresh

Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### POST /api/auth/revoke

Revoke refresh token (logout).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "message": "Token revoked successfully"
}
```

---

### POST /api/auth/revoke-all

Logout from all devices by revoking all tokens and sessions.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:** None required

**Response (200):**
```json
{
  "message": "Successfully logged out from all devices",
  "details": {
    "sessionsDeleted": 3,
    "tokensRevoked": 5,
    "deviceTokensDeactivated": 2
  }
}
```

**Notes:**
- Revokes ALL refresh tokens for the user
- Deletes ALL web sessions
- Deactivates ALL device tokens (FCM push notifications)
- Sets user online status to OFFLINE
- The current token used to make this request will also be invalidated

---

### POST /api/auth/forgot-password

Request password reset email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "If an account exists with this email, a password reset link has been sent."
}
```

---

### POST /api/auth/reset-password

Reset password using token from email.

**Request Body:**
```json
{
  "token": "reset_token_from_email",
  "password": "NewPassword123!"
}
```

**Response (200):**
```json
{
  "message": "Password reset successfully"
}
```

---

### POST /api/auth/apple

Authenticate with Apple Sign-In (iOS). Accepts Apple identity token and returns JWT tokens.

**Request Body:**
```json
{
  "identityToken": "eyJraWQiOiJXNldjT0tCIiwiYWxnIjoiUlMyNTYifQ...",
  "authorizationCode": "c1234567890abcdef...",
  "fullName": {
    "givenName": "John",
    "familyName": "Doe"
  },
  "email": "user@privaterelay.appleid.com"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "cuid_xxx",
    "username": "johndoe",
    "displayName": "John Doe",
    "email": "user@privaterelay.appleid.com",
    "avatarUrl": null,
    "bio": null,
    "isProfilePublic": true
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "isNewUser": true
}
```

**Error Responses:**
- `400` - Invalid request body or identity token
- `401` - Token verification failed
- `403` - Account disabled or non-USER role
- `409` - Email already linked to another account

**Notes:**
- `fullName` is only provided by Apple on first sign-in
- `email` may be a private relay address
- Creates new account if Apple ID not found
- Links Apple ID to existing account if email matches

---

### POST /api/auth/google/mobile

Authenticate with Google Sign-In (Mobile). Accepts Google ID token directly (not OAuth redirect flow).

**Request Body:**
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "user": {
    "id": "cuid_xxx",
    "username": "johndoe",
    "displayName": "John Doe",
    "email": "user@gmail.com",
    "avatarUrl": "https://lh3.googleusercontent.com/...",
    "bio": null,
    "isProfilePublic": true
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "isNewUser": false
}
```

**Error Responses:**
- `400` - Invalid request body or ID token
- `401` - Token verification failed
- `403` - Account disabled or non-USER role
- `409` - Email already linked to another Google account

**Notes:**
- Different from web OAuth flow (no redirects)
- Updates avatar from Google profile picture
- Creates new account if Google ID not found
- Links Google ID to existing account if email matches

---

## App Configuration Endpoints

### GET /api/app/config

Get app configuration for mobile clients. Public endpoint - no authentication required.

**Response (200):**
```json
{
  "maintenance": {
    "enabled": false,
    "message": null
  },
  "version": {
    "minIOS": "1.0.0",
    "minAndroid": "1.0.0"
  },
  "stores": {
    "appStore": "https://apps.apple.com/app/vidibattle/id123456789",
    "playStore": "https://play.google.com/store/apps/details?id=com.vidibattle.app"
  },
  "deepLinking": {
    "scheme": "vidibattle",
    "universalLinkDomain": "vidibattle.com"
  },
  "features": {
    "likes": true,
    "comments": true,
    "sharing": true,
    "messaging": true,
    "blocking": true,
    "views": true,
    "bookmarks": true,
    "reporting": true,
    "pushNotifications": true,
    "googleLogin": true,
    "manualSignup": true,
    "brandAmbassadorship": false,
    "modeling": false
  },
  "media": {
    "maxImageSize": 5242880,
    "minVideoDuration": 3,
    "maxVideoDuration": 60
  }
}
```

**Use Cases:**
- **Force Update:** Compare `version.minIOS` / `version.minAndroid` with installed app version
- **Maintenance Mode:** Check `maintenance.enabled` on app startup
- **Feature Flags:** Enable/disable features based on `features` object
- **Deep Linking:** Configure app links using `deepLinking` settings

---

## User Endpoints

### GET /api/users/me

Get current authenticated user's profile.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "id": "cuid_xxx",
  "username": "johndoe",
  "displayName": "John Doe",
  "email": "user@example.com",
  "avatarUrl": "/uploads/avatars/xxx.webp",
  "bio": "Hello world",
  "isProfilePublic": true,
  "showOnlineStatus": true,
  "showWhatsappNumber": false,
  "showDob": true,
  "hideYear": false,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "_count": {
    "followers": 150,
    "following": 75,
    "posts": 42
  }
}
```

---

### GET /api/users/username/{username}

Get user profile by username.

**Headers (Optional):**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "id": "cuid_xxx",
  "username": "johndoe",
  "displayName": "John Doe",
  "avatarUrl": "/uploads/avatars/xxx.webp",
  "bio": "Hello world",
  "isProfilePublic": true,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "isFollowedByUser": true,
  "isFollowingUser": false,
  "_count": {
    "followers": 150,
    "following": 75,
    "posts": 42
  }
}
```

---

### GET /api/users/search

Search users by username or display name.

**Query Parameters:**
- `q` (required): Search query
- `cursor` (optional): Pagination cursor

**Response (200):**
```json
{
  "users": [
    {
      "id": "cuid_xxx",
      "username": "johndoe",
      "displayName": "John Doe",
      "avatarUrl": "/uploads/avatars/xxx.webp"
    }
  ],
  "nextCursor": "cuid_yyy"
}
```

---

### GET /api/users/{userId}/followers

Get follower info for a user.

**Response (200):**
```json
{
  "followers": 150,
  "isFollowedByUser": true
}
```

---

### POST /api/users/{userId}/followers

Follow a user.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "User followed successfully"
}
```

---

### DELETE /api/users/{userId}/followers

Unfollow a user.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "User unfollowed successfully"
}
```

---

### GET /api/users/{userId}/followers/list

Get list of followers for a user.

**Query Parameters:**
- `cursor` (optional): Pagination cursor

**Response (200):**
```json
{
  "followers": [
    {
      "id": "cuid_xxx",
      "username": "janedoe",
      "displayName": "Jane Doe",
      "avatarUrl": "/uploads/avatars/xxx.webp"
    }
  ],
  "nextCursor": "cuid_yyy"
}
```

---

### GET /api/users/{userId}/following/list

Get list of users that a user is following.

**Query Parameters:**
- `cursor` (optional): Pagination cursor

**Response (200):**
```json
{
  "following": [
    {
      "id": "cuid_xxx",
      "username": "janedoe",
      "displayName": "Jane Doe",
      "avatarUrl": "/uploads/avatars/xxx.webp"
    }
  ],
  "nextCursor": "cuid_yyy"
}
```

---

### POST /api/users/{userId}/block

Block a user.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (204):** No content

---

### DELETE /api/users/{userId}/block

Unblock a user.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (204):** No content

---

### GET /api/users/blocked

Get list of blocked users.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "blockedUsers": [
    {
      "id": "cuid_xxx",
      "username": "blockeduser",
      "displayName": "Blocked User",
      "avatarUrl": "/uploads/avatars/xxx.webp",
      "blockedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### POST /api/users/{userId}/report

Report a user for violating community guidelines.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "reason": "HARASSMENT",
  "description": "This user has been sending threatening messages."
}
```

**Reason Values:**
- `SPAM` - Spam or misleading content
- `HARASSMENT` - Harassment or bullying
- `HATE_SPEECH` - Hate speech or symbols
- `IMPERSONATION` - Impersonating someone else
- `INAPPROPRIATE_CONTENT` - Inappropriate content
- `SCAM` - Scam or fraud
- `UNDERAGE` - User appears to be underage
- `OTHER` - Other violation (requires description)

**Response (201):**
```json
{
  "id": "report_xxx",
  "userId": "cuid_xxx",
  "reporterId": "cuid_yyy",
  "reason": "HARASSMENT",
  "description": "This user has been sending threatening messages.",
  "status": "PENDING",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**
- `400` - Invalid reason or missing description for OTHER
- `401` - Unauthorized
- `404` - User not found
- `409` - Already reported this user

---

### GET /api/users/{userId}/report

Check if current user has reported a specific user.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "hasReported": true,
  "report": {
    "id": "report_xxx",
    "reason": "HARASSMENT",
    "status": "PENDING",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### GET /api/users/{userId}/mutual-followers

Get users who have mutual follow relationships with both the current user and the target user.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `cursor` (optional): Pagination cursor (user ID)
- `limit` (optional): Number of results (default: 20, max: 50)

**Response (200):**
```json
{
  "mutualFollowers": [
    {
      "id": "cuid_xxx",
      "username": "janedoe",
      "displayName": "Jane Doe",
      "avatarUrl": "/uploads/avatars/xxx.webp"
    }
  ],
  "count": 15,
  "cursor": "cuid_yyy"
}
```

**Notes:**
- Returns empty array when viewing own profile
- A mutual follower is someone who both users follow AND who follows both users

---

### GET /api/users/privacy-settings

Get user privacy settings.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "showOnlineStatus": true,
  "isProfilePublic": true,
  "showWhatsappNumber": false,
  "showDob": true,
  "hideYear": false,
  "showUpiId": false
}
```

---

### POST /api/users/privacy-settings

Update user privacy settings.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "showOnlineStatus": true,
  "isProfilePublic": true,
  "showWhatsappNumber": false,
  "showDob": true,
  "hideYear": false,
  "showUpiId": false
}
```

**Response (200):** Updated settings object

---

### GET /api/users/notification-preferences

Get notification preferences.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "likeNotifications": true,
  "followNotifications": true,
  "commentNotifications": true,
  "pushNotifications": true,
  "competitionUpdates": true,
  "messageNotifications": true
}
```

---

### POST /api/users/notification-preferences

Update notification preferences.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "likeNotifications": true,
  "followNotifications": true,
  "commentNotifications": true,
  "push_notifications": true,
  "competition_updates": true,
  "message_notifications": true
}
```

**Response (200):** Updated preferences object

---

### POST /api/users/change-password

Change user password.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!"
}
```

**Response (200):**
```json
{
  "message": "Password changed successfully"
}
```

---

## Post Endpoints

### POST /api/posts

Create a new post.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "content": "Check out my new video! #trending",
  "mediaIds": ["media_id_1", "media_id_2"]
}
```

**Response (201):**
```json
{
  "id": "post_xxx",
  "content": "Check out my new video! #trending",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "user": {
    "id": "cuid_xxx",
    "username": "johndoe",
    "displayName": "John Doe",
    "avatarUrl": "/uploads/avatars/xxx.webp"
  },
  "attachments": [
    {
      "id": "media_id_1",
      "type": "VIDEO",
      "url": "/uploads/videos/xxx.mp4",
      "thumbnailUrl": "/uploads/thumbnails/xxx.webp"
    }
  ],
  "_count": {
    "likes": 0,
    "comments": 0
  },
  "isLikedByUser": false,
  "isBookmarkedByUser": false
}
```

---

### GET /api/posts/for-you

Get "For You" feed posts.

**Query Parameters:**
- `cursor` (optional): Pagination cursor

**Response (200):**
```json
{
  "posts": [
    {
      "id": "post_xxx",
      "content": "Amazing content!",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "user": {
        "id": "cuid_xxx",
        "username": "johndoe",
        "displayName": "John Doe",
        "avatarUrl": "/uploads/avatars/xxx.webp"
      },
      "attachments": [],
      "_count": {
        "likes": 42,
        "comments": 5
      },
      "isLikedByUser": false,
      "isBookmarkedByUser": false
    }
  ],
  "nextCursor": "post_yyy"
}
```

---

### GET /api/posts/following

Get posts from followed users.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `cursor` (optional): Pagination cursor

**Response (200):** Same format as `/api/posts/for-you`

---

### GET /api/posts/bookmarked

Get user's bookmarked posts.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `cursor` (optional): Pagination cursor

**Response (200):** Same format as `/api/posts/for-you`

---

### GET /api/users/{userId}/posts

Get posts by a specific user.

**Query Parameters:**
- `cursor` (optional): Pagination cursor

**Response (200):** Same format as `/api/posts/for-you`

---

### GET /api/posts/{postId}

Get a single post by ID.

**Response (200):** Single post object

---

### PUT /api/posts/{postId}/edit

Edit an existing post.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "content": "Updated content!",
  "mediaIds": ["media_id_1"]
}
```

**Response (200):** Updated post object

---

### DELETE /api/posts/{postId}

Delete a post.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (204):** No content

---

### POST /api/posts/{postId}/likes

Like a post.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "likes": 43
}
```

---

### DELETE /api/posts/{postId}/likes

Unlike a post.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "likes": 42
}
```

---

### POST /api/posts/{postId}/bookmark

Bookmark a post.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "isBookmarkedByUser": true
}
```

---

### DELETE /api/posts/{postId}/bookmark

Remove bookmark from a post.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "isBookmarkedByUser": false
}
```

---

### GET /api/posts/{postId}/comments

Get comments for a post.

**Query Parameters:**
- `cursor` (optional): Pagination cursor

**Response (200):**
```json
{
  "comments": [
    {
      "id": "comment_xxx",
      "content": "Great post!",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "user": {
        "id": "cuid_xxx",
        "username": "johndoe",
        "displayName": "John Doe",
        "avatarUrl": "/uploads/avatars/xxx.webp"
      }
    }
  ],
  "previousCursor": "comment_yyy"
}
```

---

### POST /api/posts/{postId}/comments

Add a comment to a post.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "content": "Great post!"
}
```

**Response (201):** Created comment object

---

### DELETE /api/comments/{commentId}

Delete a comment.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (204):** No content

---

### POST /api/comments/{commentId}/report

Report a comment for violating community guidelines.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "reason": "HARASSMENT",
  "description": "This comment contains threatening language."
}
```

**Reason Values:**
- `SPAM` - Spam or misleading content
- `HARASSMENT` - Harassment or bullying
- `HATE_SPEECH` - Hate speech or symbols
- `VIOLENCE` - Violence or dangerous content
- `NUDITY` - Nudity or sexual content
- `FALSE_INFORMATION` - False information
- `OTHER` - Other violation (requires description)

**Response (201):**
```json
{
  "id": "report_xxx",
  "commentId": "comment_xxx",
  "reporterId": "cuid_yyy",
  "reason": "HARASSMENT",
  "description": "This comment contains threatening language.",
  "status": "PENDING",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**
- `400` - Invalid reason or missing description for OTHER
- `401` - Unauthorized
- `404` - Comment not found
- `409` - Already reported this comment

---

### GET /api/comments/{commentId}/report

Check if current user has reported a specific comment.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "hasReported": true,
  "report": {
    "id": "report_xxx",
    "reason": "HARASSMENT",
    "status": "PENDING",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### GET /api/posts/{postId}/comments/{commentId}/replies

Get replies to a specific comment.

**Query Parameters:**
- `cursor` (optional): Pagination cursor (reply ID)
- `limit` (optional): Number of results (default: 10, max: 50)

**Response (200):**
```json
{
  "replies": [
    {
      "id": "reply_xxx",
      "content": "I agree with this!",
      "createdAt": "2024-01-15T10:35:00.000Z",
      "user": {
        "id": "cuid_xxx",
        "username": "janedoe",
        "displayName": "Jane Doe",
        "avatarUrl": "/uploads/avatars/xxx.webp"
      }
    }
  ],
  "nextCursor": "reply_yyy",
  "totalCount": 25
}
```

---

### POST /api/posts/{postId}/comments/{commentId}/replies

Create a reply to a specific comment.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "content": "I agree with this!"
}
```

**Response (201):**
```json
{
  "id": "reply_xxx",
  "content": "I agree with this!",
  "createdAt": "2024-01-15T10:35:00.000Z",
  "user": {
    "id": "cuid_xxx",
    "username": "johndoe",
    "displayName": "John Doe",
    "avatarUrl": "/uploads/avatars/xxx.webp"
  }
}
```

**Error Responses:**
- `400` - Invalid content (empty or too long)
- `401` - Unauthorized
- `403` - Comments feature disabled
- `404` - Post or comment not found

---

### POST /api/posts/{postId}/report

Report a post.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "reason": "SPAM",
  "description": "This is spam content"
}
```

**Valid Reasons:**
- `SPAM`
- `HARASSMENT`
- `HATE_SPEECH`
- `VIOLENCE`
- `NUDITY`
- `FALSE_INFORMATION`
- `INTELLECTUAL_PROPERTY`
- `OTHER`

**Response (201):**
```json
{
  "message": "Report submitted successfully",
  "reportId": "report_xxx"
}
```

---

### GET /api/posts/{postId}/report

Check if current user has reported a post.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "hasReported": true,
  "report": {
    "id": "report_xxx",
    "reason": "SPAM",
    "status": "PENDING",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### POST /api/posts/{postId}/view

Record a view for a post.

**Response (200):**
```json
{
  "success": true
}
```

---

### GET /api/posts/{postId}/view

Get view count for a post.

**Response (200):**
```json
{
  "viewCount": 1234
}
```

---

### GET /api/posts/{postId}/share-link

Generate shareable links and metadata for a post. This endpoint is **public** (no authentication required) to support sharing flows.

**Path Parameters:**
- `postId` (required): The unique identifier of the post

**Response (200):**
```json
{
  "postId": "post_abc123",
  "links": {
    "webUrl": "https://vidibattle.com/posts/post_abc123",
    "deepLink": "vidibattle://post/post_abc123",
    "universalLink": "https://link.vidibattle.com/posts/post_abc123"
  },
  "metadata": {
    "title": "Check out this video!",
    "description": "Amazing content on VidiBattle...",
    "image": "https://vidibattle.com/uploads/thumbnails/abc123.webp",
    "imageWidth": 1080,
    "imageHeight": 1920
  },
  "author": {
    "username": "creator123",
    "displayName": "Creative Creator",
    "avatarUrl": "https://vidibattle.com/uploads/avatars/user123.webp"
  },
  "shareText": {
    "default": "Check out this video by @creator123 on VidiBattle! https://vidibattle.com/posts/post_abc123",
    "twitter": "Check out this video by @creator123 on @VidiBattle! https://vidibattle.com/posts/post_abc123",
    "whatsapp": "Check out this video by @creator123 on VidiBattle!\nhttps://vidibattle.com/posts/post_abc123"
  },
  "stats": {
    "likes": 1234,
    "comments": 56,
    "shares": 78
  },
  "appStoreLinks": {
    "ios": "https://apps.apple.com/app/vidibattle/id123456789",
    "android": "https://play.google.com/store/apps/details?id=com.vidibattle.app"
  }
}
```

**Response (404):**
```json
{
  "error": "Post not found"
}
```

**Notes:**
- The `deepLink` uses the app's custom URL scheme (configurable in SiteSettings)
- The `universalLink` uses Apple Universal Links / Android App Links domain
- `shareText` provides pre-formatted text optimized for different platforms
- `metadata` is suitable for Open Graph / social media previews
- Image selection priority: thumbnail > posterUrl > mediaUrl > author avatar

---

## Search Endpoint

### GET /api/search

Search posts by content, username, or display name.

**Query Parameters:**
- `q` (required): Search query
- `cursor` (optional): Pagination cursor

**Response (200):** Same format as `/api/posts/for-you`

---

## Media Upload Endpoints

### POST /api/upload

Upload media files (images/videos).

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Form Data:**
- `file`: The media file to upload

**Response (200):**
```json
{
  "mediaId": "media_xxx",
  "url": "/uploads/media/xxx.mp4",
  "type": "VIDEO",
  "thumbnailUrl": "/uploads/thumbnails/xxx.webp"
}
```

---

### POST /api/upload/avatar

Upload user avatar.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Form Data:**
- `file`: The image file (JPEG, PNG, WebP, GIF)

**Response (200):**
```json
{
  "avatarUrl": "/uploads/avatars/xxx.webp"
}
```

---

## Chat & Messaging Endpoints

### GET /api/chats

Get list of user's chats.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "chats": [
    {
      "id": "chat_xxx",
      "participants": [
        {
          "id": "cuid_xxx",
          "username": "johndoe",
          "displayName": "John Doe",
          "avatarUrl": "/uploads/avatars/xxx.webp"
        }
      ],
      "lastMessage": {
        "id": "msg_xxx",
        "content": "Hello!",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "senderId": "cuid_xxx"
      },
      "unreadCount": 2
    }
  ]
}
```

---

### POST /api/chats

Create a new chat.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "participantId": "cuid_xxx"
}
```

**Response (201):**
```json
{
  "id": "chat_xxx",
  "participants": [...]
}
```

---

### GET /api/chats/{chatId}

Get chat details.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):** Chat object with participants

---

### DELETE /api/chats/{chatId}

Delete a chat.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "message": "Chat deleted successfully"
}
```

---

### GET /api/chats/{chatId}/messages

Get messages in a chat.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `cursor` (optional): Pagination cursor

**Response (200):**
```json
{
  "messages": [
    {
      "id": "msg_xxx",
      "content": "Hello!",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "senderId": "cuid_xxx",
      "read": true
    }
  ],
  "nextCursor": "msg_yyy"
}
```

---

### POST /api/chats/{chatId}/messages

Send a message in a chat.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "content": "Hello!"
}
```

**Response (201):** Created message object

---

### POST /api/messages

Send a direct message (creates chat if needed).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "recipientId": "cuid_xxx",
  "content": "Hello!"
}
```

**Response (201):**
```json
{
  "message": {...},
  "chatId": "chat_xxx"
}
```

---

### GET /api/messages/unread-count

Get total unread message count.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "unreadCount": 5
}
```

---

## Hashtag Endpoints

### GET /api/hashtags/trending

Get trending hashtags based on post usage.

**Query Parameters:**
- `limit` (optional): Number of hashtags to return (default: 10, max: 50)
- `period` (optional): Time period for trending calculation
  - `24h` - Last 24 hours
  - `7d` - Last 7 days (default)
  - `30d` - Last 30 days
  - `all` - All time

**Response (200):**
```json
{
  "hashtags": [
    {
      "hashtag": "#trending",
      "count": 1250,
      "recentPosts": 45
    },
    {
      "hashtag": "#viral",
      "count": 980,
      "recentPosts": 32
    }
  ],
  "period": "7d"
}
```

**Notes:**
- `count` is total posts with this hashtag in the period
- `recentPosts` is posts in the last 24 hours
- Hashtags are normalized to lowercase
- Only includes posts from active users

---

## Feedback Endpoints

### POST /api/feedback

Submit feedback from the mobile app.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "type": "BUG_REPORT",
  "message": "The app crashes when I try to upload a video longer than 2 minutes.",
  "screenshotUrl": "https://storage.example.com/screenshots/xxx.png"
}
```

**Feedback Types:**
- `BUG_REPORT` - Report a bug or issue
- `FEATURE_REQUEST` - Request a new feature
- `GENERAL_FEEDBACK` - General feedback
- `COMPLAINT` - Complaint about the service
- `QUESTION` - Question about the app
- `OTHER` - Other feedback

**Response (201):**
```json
{
  "id": "feedback_xxx",
  "type": "BUG_REPORT",
  "message": "The app crashes when I try to upload a video longer than 2 minutes.",
  "screenshotUrl": "https://storage.example.com/screenshots/xxx.png",
  "status": "PENDING",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

**Validation:**
- Message must be 10-5000 characters
- Screenshot URL must be a valid URL (optional)

---

### GET /api/feedback

Get user's own feedback submissions.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `cursor` (optional): Pagination cursor (feedback ID)
- `limit` (optional): Number of results (default: 20, max: 50)
- `status` (optional): Filter by status (PENDING, REVIEWED, RESOLVED, CLOSED)

**Response (200):**
```json
{
  "feedback": [
    {
      "id": "feedback_xxx",
      "type": "BUG_REPORT",
      "message": "The app crashes when...",
      "screenshotUrl": "https://storage.example.com/screenshots/xxx.png",
      "status": "REVIEWED",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-16T14:00:00.000Z"
    }
  ],
  "nextCursor": "feedback_yyy"
}
```

---

## Notification Endpoints

### GET /api/notifications

Get user notifications.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `cursor` (optional): Pagination cursor

**Response (200):**
```json
{
  "notifications": [
    {
      "id": "notif_xxx",
      "type": "LIKE",
      "read": false,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "issuer": {
        "id": "cuid_xxx",
        "username": "johndoe",
        "displayName": "John Doe",
        "avatarUrl": "/uploads/avatars/xxx.webp"
      },
      "post": {
        "id": "post_xxx",
        "content": "My post..."
      }
    }
  ],
  "nextCursor": "notif_yyy"
}
```

**Notification Types:**
- `LIKE` - Someone liked your post
- `FOLLOW` - Someone followed you
- `MUTUAL_FOLLOW` - Mutual follow
- `COMMENT` - Someone commented on your post
- `MENTION` - Someone mentioned you
- `MESSAGE` - New message
- `COMPETITION_UPDATE` - Competition update

---

### PATCH /api/notifications/mark-as-read

Mark notifications as read.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "notificationIds": ["notif_xxx", "notif_yyy"]
}
```

**Response (200):**
```json
{
  "message": "Notifications marked as read"
}
```

---

### GET /api/notifications/unread-count

Get unread notification count.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "unreadCount": 12
}
```

---

### POST /api/notifications/devices

Register device for push notifications.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "token": "fcm_device_token_xxx",
  "deviceType": "ANDROID"
}
```

**Valid Device Types:**
- `IOS`
- `ANDROID`
- `WEB`

**Response (200):**
```json
{
  "message": "Device token registered successfully",
  "deviceToken": {
    "id": "token_xxx",
    "token": "fcm_device_token_xxx",
    "deviceType": "ANDROID"
  }
}
```

---

### DELETE /api/notifications/devices

Remove device token.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `token`: The device token to remove

**Response (200):**
```json
{
  "message": "Device token removed successfully"
}
```

---

## Competition Endpoints

### GET /api/competitions

Get list of competitions.

**Query Parameters:**
- `status` (optional): Filter by status (UPCOMING, ACTIVE, COMPLETED)
- `cursor` (optional): Pagination cursor

**Response (200):**
```json
{
  "competitions": [
    {
      "id": "comp_xxx",
      "title": "Dance Challenge",
      "description": "Show us your best moves!",
      "startDate": "2024-01-20T00:00:00.000Z",
      "endDate": "2024-01-27T00:00:00.000Z",
      "status": "ACTIVE",
      "entryFee": 100,
      "prizePool": 10000,
      "thumbnailUrl": "/uploads/competitions/xxx.webp",
      "_count": {
        "participants": 150
      }
    }
  ],
  "nextCursor": "comp_yyy"
}
```

---

### GET /api/competitions/{competitionId}

Get competition details.

**Response (200):**
```json
{
  "id": "comp_xxx",
  "title": "Dance Challenge",
  "description": "Show us your best moves!",
  "rules": "1. Original content only...",
  "startDate": "2024-01-20T00:00:00.000Z",
  "endDate": "2024-01-27T00:00:00.000Z",
  "status": "ACTIVE",
  "entryFee": 100,
  "prizePool": 10000,
  "defaultHashtag": "#DanceChallenge",
  "rounds": [
    {
      "id": "round_xxx",
      "name": "Round 1",
      "startDate": "2024-01-20T00:00:00.000Z",
      "endDate": "2024-01-23T00:00:00.000Z"
    }
  ],
  "isParticipating": true
}
```

---

### POST /api/competitions/{competitionId}/participate

Join a competition.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body (if entry fee required):**
```json
{
  "paymentId": "payment_xxx"
}
```

**Response (200):**
```json
{
  "message": "Successfully joined competition",
  "participantId": "participant_xxx"
}
```

---

### GET /api/competitions/{competitionId}/leaderboard

Get competition leaderboard.

**Query Parameters:**
- `roundId` (optional): Filter by round
- `cursor` (optional): Pagination cursor

**Response (200):**
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "user": {
        "id": "cuid_xxx",
        "username": "johndoe",
        "displayName": "John Doe",
        "avatarUrl": "/uploads/avatars/xxx.webp"
      },
      "score": 1500,
      "post": {
        "id": "post_xxx",
        "thumbnailUrl": "/uploads/thumbnails/xxx.webp"
      }
    }
  ],
  "nextCursor": "entry_yyy"
}
```

---

### GET /api/posts/competition-feed

Get posts from competitions.

**Query Parameters:**
- `competitionId` (optional): Filter by competition
- `cursor` (optional): Pagination cursor

**Response (200):** Same format as `/api/posts/for-you`

---

## Payment Endpoints

### POST /api/payments/create-order

Create a payment order (Razorpay).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "amount": 100,
  "competitionId": "comp_xxx",
  "type": "COMPETITION_ENTRY"
}
```

**Response (200):**
```json
{
  "orderId": "order_xxx",
  "amount": 100,
  "currency": "INR",
  "key": "rzp_xxx"
}
```

---

### POST /api/payments/verify

Verify payment after completion.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "signature_xxx"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Payment verified successfully"
}
```

---

## Settings Endpoints

### GET /api/settings

Get app settings (public).

**Response (200):**
```json
{
  "appName": "VidiBattle",
  "maintenanceMode": false,
  "registrationEnabled": true,
  "maxVideoLength": 60,
  "maxFileSize": 50000000,
  "supportedVideoFormats": ["mp4", "mov", "webm"],
  "supportedImageFormats": ["jpg", "jpeg", "png", "webp", "gif"]
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Invalid input",
  "details": {
    "field": ["Error message"]
  }
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "error": "Access denied"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 409 Conflict
```json
{
  "error": "Resource already exists"
}
```

### 429 Too Many Requests
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 60
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Rate Limiting

API requests are rate limited:
- **Authentication endpoints:** 5 requests per minute
- **General endpoints:** 100 requests per minute
- **Upload endpoints:** 10 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705320000
```

---

## Pagination

All list endpoints support cursor-based pagination:

**Request:**
```
GET /api/posts/for-you?cursor=post_xxx
```

**Response:**
```json
{
  "posts": [...],
  "nextCursor": "post_yyy"
}
```

- If `nextCursor` is `null`, there are no more results
- Use the `nextCursor` value as the `cursor` parameter for the next request

---

## WebSocket Events (Future)

Real-time events will be delivered via WebSocket connection:

**Connection:**
```
wss://your-domain.com/ws?token=<access_token>
```

**Events:**
- `new_message` - New chat message
- `notification` - New notification
- `typing` - User typing indicator
- `online_status` - User online/offline status

---

## Changelog

### v1.0.0 (Current)
- Initial API release
- JWT authentication support
- All core endpoints for posts, users, chats, notifications
- Competition and payment endpoints
- Media upload support

---

## Support

For API support, contact: api-support@vidibattle.com
