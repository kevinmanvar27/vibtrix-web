import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { processImageWithSticker, processVideoWithSticker, isMediaEligibleForSticker } from "@/lib/imageProcessing";
import { storeStickeredFile } from "@/lib/fileStorage";
import path from "path";
import fs from "fs";
import debug from "@/lib/debug";

export async function POST(
  request: Request,
  { params }: { params: { competitionId: string; postId: string } }
) {
  try {
    const { user } = await validateRequest();
    
    if (!user) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { competitionId, postId } = params;
    const { stickerId } = await request.json();

    // Verify the competition exists and is active
    const competition = await prisma.competition.findFirst({
      where: {
        id: competitionId,
        isActive: true,
      },
    });

    if (!competition) {
      return Response.json(
        { error: "Competition not found or inactive" },
        { status: 404 }
      );
    }

    // Verify the post belongs to the user and is part of the competition
    const post = await prisma.post.findFirst({
      where: {
        id: postId,
        userId: user.id,
        competitionEntries: {
          some: {
            participant: {
              competitionId,
            },
          },
        },
      },
      include: {
        attachments: true,
      },
    });

    if (!post) {
      return Response.json(
        { error: "Post not found or you don't have permission to modify it" },
        { status: 404 }
      );
    }

    // Verify the sticker exists and is available for this competition
    const sticker = await prisma.promotionSticker.findFirst({
      where: {
        id: stickerId,
        isActive: true,
        competitionId: competitionId,
      },
      include: {
        _count: {
          select: {
            usages: {
              where: {
                isDeleted: false,
              },
            },
          },
        },
      },
    });

    if (!sticker) {
      return Response.json(
        { error: "Sticker not found or not available for this competition" },
        { status: 404 }
      );
    }

    // Check if sticker has reached its limit
    if (sticker.limit) {
      const activeUsages = sticker._count.usages;
      if (activeUsages >= sticker.limit) {
        return Response.json(
          { error: "This sticker has reached its usage limit" },
          { status: 400 }
        );
      }
    }

    // Get the first attachment (assuming one attachment per competition post)
    const attachment = post.attachments[0];
    if (!attachment) {
      return Response.json(
        { error: "No media found in this post" },
        { status: 400 }
      );
    }

    // Get the file path from the URL
    const mediaUrl = attachment.url;
    const isLocalFile = mediaUrl.startsWith('/uploads/');
    
    if (!isLocalFile) {
      return Response.json(
        { error: "Cannot apply sticker to external media" },
        { status: 400 }
      );
    }

    // Get the file path
    const filePath = path.join(process.cwd(), 'public', mediaUrl);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return Response.json(
        { error: "Media file not found" },
        { status: 404 }
      );
    }

    // Read the file
    const buffer = fs.readFileSync(filePath);
    
    // Check if media is eligible for sticker
    const isEligible = isMediaEligibleForSticker(attachment.type, competition.mediaType);
    if (!isEligible) {
      return Response.json(
        { error: "This media is not eligible for stickers" },
        { status: 400 }
      );
    }

    // Process the media with the sticker
    let processedBuffer: Buffer | string;
    if (attachment.type === 'IMAGE') {
      processedBuffer = await processImageWithSticker(
        buffer,
        path.basename(filePath),
        sticker.imageUrl,
        sticker.position
      );
    } else if (attachment.type === 'VIDEO') {
      // For videos, processVideoWithSticker returns a URL directly
      const processedUrl = await processVideoWithSticker(
        buffer,
        path.basename(filePath),
        sticker.imageUrl,
        sticker.position
      );
      
      // Create a sticker usage record
      await prisma.stickerUsage.create({
        data: {
          stickerId: sticker.id,
          mediaUrl: processedUrl,
        },
      });

      // Update the media record with the sticker ID
      await prisma.media.update({
        where: {
          id: attachment.id,
        },
        data: {
          appliedPromotionStickerId: sticker.id,
          url: processedUrl, // Update the URL to the stickered version
        },
      });

      return Response.json({
        success: true,
        message: "Sticker applied successfully",
        mediaUrl: processedUrl,
      });
    } else {
      return Response.json(
        { error: "Unsupported media type" },
        { status: 400 }
      );
    }

    // For images, we need to store the processed buffer
    if (attachment.type === 'IMAGE' && Buffer.isBuffer(processedBuffer)) {
      // Store the stickered image
      const processedUrl = await storeStickeredFile(processedBuffer, mediaUrl);
      
      // Create a sticker usage record
      await prisma.stickerUsage.create({
        data: {
          stickerId: sticker.id,
          mediaUrl: processedUrl,
        },
      });

      // Update the media record with the sticker ID
      await prisma.media.update({
        where: {
          id: attachment.id,
        },
        data: {
          appliedPromotionStickerId: sticker.id,
          url: processedUrl, // Update the URL to the stickered version
        },
      });

      return Response.json({
        success: true,
        message: "Sticker applied successfully",
        mediaUrl: processedUrl,
      });
    } else {
      return Response.json(
        { error: "Failed to process media" },
        { status: 500 }
      );
    }
  } catch (error) {
    debug.error("Error applying sticker to post:", error);
    return Response.json(
      { error: "Failed to apply sticker" },
      { status: 500 }
    );
  }
}
