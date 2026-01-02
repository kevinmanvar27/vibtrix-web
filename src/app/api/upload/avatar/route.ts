import prisma from "@/lib/prisma";
import { storeAvatar, deleteFile } from "@/lib/fileStorage";
import { NextRequest } from "next/server";
import debug from "@/lib/debug";
import { getAuthenticatedUser } from "@/lib/api-auth";

/**
 * POST /api/upload/avatar
 * Upload a new avatar image for the authenticated user
 * Supports both JWT (mobile) and session (web) authentication
 * 
 * Request: multipart/form-data with 'file' field
 * Returns: { avatarUrl: string }
 */
export async function POST(req: NextRequest) {
  try {
    // Validate user authentication
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse the form data
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof Blob)) {
      return Response.json({ error: "No valid file provided" }, { status: 400 });
    }

    // File details are processed below

    // Get file type from blob
    let fileType = file.type || 'image/jpeg';

    // Handle application/octet-stream by checking file name
    if (fileType === 'application/octet-stream' && 'name' in file) {
      const fileName = file.name as string;
      if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) {
        fileType = 'image/jpeg';
      } else if (fileName.endsWith('.png')) {
        fileType = 'image/png';
      } else if (fileName.endsWith('.webp')) {
        fileType = 'image/webp';
      } else if (fileName.endsWith('.gif')) {
        fileType = 'image/gif';
      }
      debug.log('Detected file type from name:', fileType);
    }

    // Validate file type
    if (!fileType.startsWith('image/') && fileType !== 'application/octet-stream') {
      return Response.json({ error: "Only image files are allowed for avatars" }, { status: 400 });
    }

    // Create a filename - storeAvatar will handle the WebP conversion
    const originalExtension = (() => {
      if ('name' in file && file.name) {
        const fileName = file.name as string;
        const lastDotIndex = fileName.lastIndexOf('.');
        if (lastDotIndex > 0) {
          return fileName.substring(lastDotIndex + 1).toLowerCase();
        }
      }
      // Fallback based on mime type
      if (fileType === 'image/jpeg' || fileType === 'image/jpg') return 'jpg';
      if (fileType === 'image/png') return 'png';
      if (fileType === 'image/gif') return 'gif';
      return 'jpg'; // default
    })();

    const filename = `avatar_${user.id}_${Date.now()}.${originalExtension}`;

    // Read file as buffer
    debug.log('Reading file as buffer...');
    let buffer;
    try {
      buffer = Buffer.from(await file.arrayBuffer());
      debug.log('Buffer created, size:', buffer.length, 'bytes');
    } catch (error) {
      debug.error('Error creating buffer:', error);
      return Response.json({ error: "Failed to read file data" }, { status: 400 });
    }

    // Ensure buffer is not empty
    if (buffer.length === 0) {
      debug.error('Empty buffer detected');
      return Response.json({ error: "Empty file provided" }, { status: 400 });
    }

    // Store the avatar (this will optimize and convert to WebP)
    debug.log('Storing avatar with name:', filename);
    let fileUrl;
    try {
      fileUrl = await storeAvatar(buffer, filename);
      debug.log('Avatar stored successfully at:', fileUrl);
    } catch (error) {
      debug.error('Error storing avatar:', error);
      return Response.json({ error: "Failed to store file" }, { status: 500 });
    }

    // Delete old avatar if exists
    if (user.avatarUrl && user.avatarUrl.startsWith('/uploads/')) {
      try {
        await deleteFile(user.avatarUrl);
      } catch (error) {
        debug.error('Failed to delete old avatar:', error);
        // Continue even if deletion fails
      }
    }

    // Update user record with new avatar URL
    await prisma.user.update({
      where: { id: user.id },
      data: {
        avatarUrl: fileUrl,
      },
    });

    return Response.json({
      avatarUrl: fileUrl
    });
  } catch (error) {
    debug.error('Avatar upload error:', error);
    return Response.json(
      { error: "Failed to upload avatar" },
      { status: 500 }
    );
  }
}
