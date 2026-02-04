import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import {
  storeFile,
  storeAvatar,
  storePostMedia,
  storeSticker,
  getFileType,
  createThumbnail
} from "@/lib/fileStorage";
import { processImageWithSticker } from "@/lib/imageProcessing";


import debug from "@/lib/debug";

// Maximum number of files per request
const MAX_FILES = 5;

/**
 * Custom file upload API endpoint
 * Replaces UploadThing functionality with local file storage
 */
export async function POST(request: NextRequest) {
  try {
    // Validate user authentication
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse the multipart form data
    const formData = await request.formData();

    // Get upload type from form data
    const uploadType = formData.get("uploadType") as string;
    if (!uploadType) {
      return NextResponse.json(
        { error: "Upload type is required" },
        { status: 400 }
      );
    }

    // Validate upload type
    if (!["avatar", "attachment", "sticker"].includes(uploadType)) {
      return NextResponse.json(
        { error: "Invalid upload type" },
        { status: 400 }
      );
    }

    // Check admin permission for sticker uploads
    if (uploadType === "sticker" && !user.isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    // Get files from form data
    const files: File[] = [];
    for (let i = 0; i < MAX_FILES; i++) {
      const file = formData.get(`file${i}`) as File;
      if (file) {
        files.push(file);
      }
    }

    // If no files were found, try getting a single file
    if (files.length === 0) {
      const file = formData.get("file") as File;
      if (file) {
        files.push(file);
      }
    }

    // Validate files
    if (files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    // Enforce file count limit for attachments
    if (uploadType === "attachment" && files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILES} files allowed` },
        { status: 400 }
      );
    }

    // Enforce single file for avatar and sticker
    if ((uploadType === "avatar" || uploadType === "sticker") && files.length > 1) {
      return NextResponse.json(
        { error: "Only one file allowed for this upload type" },
        { status: 400 }
      );
    }

    // Process each file
    const results = [];
    for (const file of files) {
      // Get file buffer
      const buffer = Buffer.from(await file.arrayBuffer());

      // Determine file type
      const mimeType = file.type;
      let fileType: 'IMAGE' | 'VIDEO';

      try {
        fileType = getFileType(mimeType);
      } catch (error) {
        return NextResponse.json(
          { error: "Unsupported file type" },
          { status: 400 }
        );
      }

      // Validate file type for avatar and sticker
      if (uploadType === "avatar" && fileType !== "IMAGE") {
        return NextResponse.json(
          { error: "Only images are allowed for avatars" },
          { status: 400 }
        );
      } else if (uploadType === "sticker" && fileType !== "IMAGE") {
        return NextResponse.json(
          { error: "Only images are allowed for stickers" },
          { status: 400 }
        );
      }

      // Process file based on upload type
      if (uploadType === "avatar") {
        // Store avatar and update user
        const avatarUrl = await storeAvatar(buffer, file.name);

        // Update user in database
        const oldAvatarUrl = user.avatarUrl;
        await prisma.user.update({
          where: { id: user.id },
          data: {
            avatarUrl: avatarUrl,
          },
        });

        // Delete old avatar if it exists
        if (oldAvatarUrl && oldAvatarUrl.startsWith('/uploads/')) {
          try {
            const { deleteFile } = await import('@/lib/fileStorage');
            await deleteFile(oldAvatarUrl);
          } catch (error) {
            debug.error('Error deleting old avatar:', error);
          }
        }

        results.push({ avatarUrl });
      } else if (uploadType === "sticker") {
        // Store sticker
        const stickerUrl = await storeSticker(buffer, file.name);
        results.push({ stickerUrl });
      } else {
        // Store attachment (post media)
        const url = await storePostMedia(buffer, file.name, fileType);

        // Create media record in database
        const media = await prisma.media.create({
          data: {
            url,
            type: fileType,
          },
        });

        // Create thumbnail for images
        if (fileType === "IMAGE") {
          try {
            const thumbnailBuffer = await createThumbnail(buffer);
            const thumbnailUrl = await storeFile(
              thumbnailBuffer,
              file.name.replace(/\.[^/.]+$/, '.webp'),
              'thumbnails'
            );

            // Update media with thumbnail URL
            await prisma.media.update({
              where: { id: media.id },
              data: {
                urlThumbnail: thumbnailUrl,
              },
            });
          } catch (error) {
            debug.error('Error creating thumbnail:', error);
          }
        }

        results.push({ mediaId: media.id, url: media.url });
      }
    }

    // Return success response with results
    return NextResponse.json({ success: true, files: results });
  } catch (error) {
    debug.error('Upload API error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
