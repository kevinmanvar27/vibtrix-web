import { PrismaClient } from '@prisma/client';
import { debug } from '../src/lib/debug';

const prisma = new PrismaClient();

async function cleanDatabase() {
  debug.log('Starting database cleanup...');

  try {
    // Delete all data in reverse order of dependencies
    // This ensures we don't violate foreign key constraints

    // Delete messages
    debug.log('Deleting messages...');
    await prisma.message.deleteMany();

    // Delete chat participants
    debug.log('Deleting chat participants...');
    await prisma.chatParticipant.deleteMany();

    // Delete chats
    debug.log('Deleting chats...');
    await prisma.chat.deleteMany();

    // Delete notifications
    debug.log('Deleting notifications...');
    await prisma.notification.deleteMany();

    // Delete bookmarks
    debug.log('Deleting bookmarks...');
    await prisma.bookmark.deleteMany();

    // Delete likes
    debug.log('Deleting likes...');
    await prisma.like.deleteMany();

    // Delete comments
    debug.log('Deleting comments...');
    await prisma.comment.deleteMany();

    // Delete post views
    debug.log('Deleting post views...');
    await prisma.postView.deleteMany();

    // Delete post reports
    debug.log('Deleting post reports...');
    await prisma.post_reports.deleteMany();

    // Delete advertisements first (they reference media)
    debug.log('Deleting advertisements...');
    await prisma.advertisement.deleteMany();

    // Delete media
    debug.log('Deleting media...');
    await prisma.media.deleteMany();

    // Delete competition round entries
    debug.log('Deleting competition round entries...');
    await prisma.competitionRoundEntry.deleteMany();

    // Delete posts
    debug.log('Deleting posts...');
    await prisma.post.deleteMany();

    // Delete prize payments
    debug.log('Deleting prize payments...');
    await prisma.prizePayment.deleteMany();

    // Delete payments
    debug.log('Deleting payments...');
    await prisma.payment.deleteMany();

    // Delete competition participants
    debug.log('Deleting competition participants...');
    await prisma.competitionParticipant.deleteMany();

    // Delete competition rounds
    debug.log('Deleting competition rounds...');
    await prisma.competitionRound.deleteMany();

    // Delete competition prizes
    debug.log('Deleting competition prizes...');
    await prisma.competitionPrize.deleteMany();

    // Delete default stickers
    debug.log('Deleting default stickers...');
    await prisma.defaultStickers.deleteMany();

    // Delete optional stickers
    debug.log('Deleting optional stickers...');
    await prisma.optionalStickers.deleteMany();

    // Delete promotion stickers
    debug.log('Deleting promotion stickers...');
    await prisma.promotionSticker.deleteMany();

    // Delete competitions
    debug.log('Deleting competitions...');
    await prisma.competition.deleteMany();

    // Delete competition stickers
    debug.log('Deleting competition stickers...');
    await prisma.competitionSticker.deleteMany();

    // Delete user blocks
    debug.log('Deleting user blocks...');
    await prisma.userBlock.deleteMany();

    // Delete follow requests
    debug.log('Deleting follow requests...');
    await prisma.followRequest.deleteMany();

    // Delete follows
    debug.log('Deleting follows...');
    await prisma.follow.deleteMany();

    // Delete user notification preferences
    debug.log('Deleting user notification preferences...');
    await prisma.userNotificationPreferences.deleteMany();

    // Delete user login activities
    debug.log('Deleting user login activities...');
    await prisma.userLoginActivity.deleteMany();

    // Delete user permissions
    debug.log('Deleting user permissions...');
    await prisma.userPermission.deleteMany();

    // Delete sessions
    debug.log('Deleting sessions...');
    await prisma.session.deleteMany();

    // Delete users (except admin)
    debug.log('Deleting non-admin users...');
    await prisma.user.deleteMany({
      where: {
        email: {
          not: 'admin@rektech.uk'
        }
      }
    });

    // Reset site settings to defaults
    debug.log('Resetting site settings...');
    await prisma.siteSettings.update({
      where: { id: 'settings' },
      data: {
        maxImageSize: 5242880,
        minVideoDuration: 3,
        maxVideoDuration: 60,
        googleLoginEnabled: true,
        manualSignupEnabled: true,
        paytmEnabled: false,
        phonePeEnabled: false,
        gPayEnabled: false,
        razorpayEnabled: false,
        commentsEnabled: true,
        likesEnabled: true,
        loginActivityTrackingEnabled: true,
        messagingEnabled: true,
        sharingEnabled: true,
        userBlockingEnabled: true,
        viewsEnabled: true,
        bookmarksEnabled: true,
        advertisementsEnabled: true,
        reportingEnabled: true,
        timezone: 'Asia/Kolkata'
      }
    });

    debug.log('Database cleanup completed successfully!');
  } catch (error) {
    debug.error('Error during database cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanDatabase()
  .catch((e) => {
    console.error('Error during database cleanup:', e);
    process.exit(1);
  });
