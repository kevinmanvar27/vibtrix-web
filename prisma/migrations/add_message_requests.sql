-- Migration: Add message_requests table
-- Run this SQL manually in your MySQL database

CREATE TABLE IF NOT EXISTS `message_requests` (
  `id` VARCHAR(191) NOT NULL,
  `senderId` VARCHAR(191) NOT NULL,
  `recipientId` VARCHAR(191) NOT NULL,
  `status` ENUM('PENDING', 'ACCEPTED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  `chatId` VARCHAR(191) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `message_requests_senderId_recipientId_key` (`senderId`, `recipientId`),
  KEY `message_requests_recipientId_idx` (`recipientId`),
  KEY `message_requests_chatId_idx` (`chatId`),
  CONSTRAINT `message_requests_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `message_requests_recipientId_fkey` FOREIGN KEY (`recipientId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `message_requests_chatId_fkey` FOREIGN KEY (`chatId`) REFERENCES `chats` (`id`) ON DELETE SET NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Add MESSAGE_REQUEST and MESSAGE_REQUEST_ACCEPTED to notification_type enum if needed
-- ALTER TABLE `notifications` MODIFY COLUMN `type` ENUM('LIKE','FOLLOW','COMMENT','SHARE','FOLLOW_REQUEST','FOLLOW_REQUEST_ACCEPTED','MUTUAL_FOLLOW','MESSAGE_REQUEST','MESSAGE_REQUEST_ACCEPTED') NOT NULL;
