import 'package:equatable/equatable.dart';

import 'package:equatable/equatable.dart';

/// User entity representing an authenticated user
/// 
/// Contains all user profile information
class User extends Equatable {
  final String id;
  final String username;
  final String email;
  final String displayName;
  final String? bio;
  final String? profileImageUrl;
  final String? coverImageUrl;
  final bool isVerified;
  final bool isPrivate;
  final int followersCount;
  final int followingCount;
  final int postsCount;
  final int winsCount;
  final double walletBalance;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  
  // Social status (for other users)
  final bool? isFollowing;
  final bool? isFollowedBy;
  final bool? isBlocked;
  final bool? hasBlockedMe;
  
  const User({
    required this.id,
    required this.username,
    required this.email,
    required this.displayName,
    this.bio,
    this.profileImageUrl,
    this.coverImageUrl,
    this.isVerified = false,
    this.isPrivate = false,
    this.followersCount = 0,
    this.followingCount = 0,
    this.postsCount = 0,
    this.winsCount = 0,
    this.walletBalance = 0.0,
    this.createdAt,
    this.updatedAt,
    this.isFollowing,
    this.isFollowedBy,
    this.isBlocked,
    this.hasBlockedMe,
  });
  
  /// Create a copy with updated values
  User copyWith({
    String? id,
    String? username,
    String? email,
    String? displayName,
    String? bio,
    String? profileImageUrl,
    String? coverImageUrl,
    bool? isVerified,
    bool? isPrivate,
    int? followersCount,
    int? followingCount,
    int? postsCount,
    int? winsCount,
    double? walletBalance,
    DateTime? createdAt,
    DateTime? updatedAt,
    bool? isFollowing,
    bool? isFollowedBy,
    bool? isBlocked,
    bool? hasBlockedMe,
  }) {
    return User(
      id: id ?? this.id,
      username: username ?? this.username,
      email: email ?? this.email,
      displayName: displayName ?? this.displayName,
      bio: bio ?? this.bio,
      profileImageUrl: profileImageUrl ?? this.profileImageUrl,
      coverImageUrl: coverImageUrl ?? this.coverImageUrl,
      isVerified: isVerified ?? this.isVerified,
      isPrivate: isPrivate ?? this.isPrivate,
      followersCount: followersCount ?? this.followersCount,
      followingCount: followingCount ?? this.followingCount,
      postsCount: postsCount ?? this.postsCount,
      winsCount: winsCount ?? this.winsCount,
      walletBalance: walletBalance ?? this.walletBalance,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      isFollowing: isFollowing ?? this.isFollowing,
      isFollowedBy: isFollowedBy ?? this.isFollowedBy,
      isBlocked: isBlocked ?? this.isBlocked,
      hasBlockedMe: hasBlockedMe ?? this.hasBlockedMe,
    );
  }
  
  /// Get user's initials for avatar placeholder
  String get initials {
    if (displayName.isEmpty) {
      return username.isNotEmpty ? username[0].toUpperCase() : '?';
    }
    
    final parts = displayName.trim().split(' ');
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return displayName[0].toUpperCase();
  }
  
  /// Check if user has a profile image
  bool get hasProfileImage => 
      profileImageUrl != null && profileImageUrl!.isNotEmpty;
  
  /// Check if user has a cover image
  bool get hasCoverImage => 
      coverImageUrl != null && coverImageUrl!.isNotEmpty;
  
  /// Check if this is the current user's own profile
  /// (determined by comparing with auth state)
  bool isOwnProfile(String? currentUserId) => id == currentUserId;
  
  @override
  List<Object?> get props => [
    id,
    username,
    email,
    displayName,
    bio,
    profileImageUrl,
    coverImageUrl,
    isVerified,
    isPrivate,
    followersCount,
    followingCount,
    postsCount,
    winsCount,
    walletBalance,
    createdAt,
    updatedAt,
    isFollowing,
    isFollowedBy,
    isBlocked,
    hasBlockedMe,
  ];
  
  @override
  String toString() => 'User(id: $id, username: $username, displayName: $displayName)';
}
