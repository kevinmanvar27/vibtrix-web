import { validateRequest } from "@/auth";
import { verifyJwtAuth } from "@/lib/jwt-auth";
import prisma from "@/lib/prisma";
import { storeFile, getFileType } from "@/lib/fileStorage";
import { processImageWithSticker, processVideoWithSticker, isMediaEligibleForSticker, autoApplyStickerToMedia, isMediaBufferEligibleForSticker } from "@/lib/imageProcessing";
import { processMedia } from "@/lib/mediaProcessing";
import { NextRequest } from "next/server";
import { StickerPosition } from "@prisma/client";
import sharp from "sharp";
import fs from "fs";
import path from "path";


import debug from "@/lib/debug";

const MAX_FILES = 5;

/**
 * Helper function to get authenticated user from either JWT or session
 * Supports both mobile (JWT) and web (session) authentication
 */
async function getAuthenticatedUser(req: NextRequest) {
  // Try JWT authentication first (for mobile apps)
  const jwtUser = await verifyJwtAuth(req);
  if (jwtUser) {
    return jwtUser;
  }
  // Fall back to session authentication (for web)
  const { user } = await validateRequest();
  return user;
}

export async function POST(req: NextRequest) {
  try {
    debug.log('Upload API: Starting file upload process');

    // Validate user authentication (supports both JWT and session)
    const user = await getAuthenticatedUser(req);
    if (!user) {
      debug.log('Upload API: Unauthorized user');
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    debug.log(`Upload API: Authenticated user ${user.id}`);

    // Parse the form data
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    const isCompetitionEntry = formData.get('isCompetitionEntry') === 'true';
    const competitionId = formData.get('competitionId') as string | null;

    debug.log(`Upload API: Received ${files.length} files, isCompetitionEntry=${isCompetitionEntry}, competitionId=${competitionId || 'none'}`);

    // Check if files array is empty
    if (files.length === 0) {
      debug.log('Upload API: No files received');
      return Response.json({ error: "No files were uploaded" }, { status: 400 });
    }

    // Set max files based on whether this is a competition entry
    const maxFiles = isCompetitionEntry ? 1 : MAX_FILES;

    // Validate file count
    if (files.length > maxFiles) {
      return Response.json(
        {
          error: isCompetitionEntry
            ? "You can only upload 1 file for a competition entry"
            : `You can only upload up to ${MAX_FILES} files at once`
        },
        { status: 400 }
      );
    }

    const results = [];

    // Process each file
    for (const file of files) {
      // Get file type
      const fileType = file.type.startsWith('image/') ? 'image' : 'video';

      debug.log(`Upload API: Processing file ${file.name}, type=${file.type}, size=${file.size} bytes`);

      // Read file as buffer
      let buffer;
      try {
        buffer = Buffer.from(await file.arrayBuffer());
        debug.log(`Upload API: File buffer created, size=${buffer.length} bytes`);

        // Verify buffer is not empty
        if (!buffer || buffer.length === 0) {
          debug.error('Upload API: Empty buffer detected');
          return Response.json({ error: "Empty file provided" }, { status: 400 });
        }
      } catch (bufferError) {
        debug.error('Upload API: Error creating buffer:', bufferError);
        return Response.json({ error: "Failed to process file" }, { status: 500 });
      }

      let fileUrl = '';
      let appliedStickerId = null;
      let mediaType;

      try {
        mediaType = getFileType(file.type);
        debug.log(`Upload API: Media type determined as ${mediaType}`);
      } catch (typeError) {
        debug.error('Upload API: Error determining file type:', typeError);
        return Response.json({ error: "Unsupported file type" }, { status: 400 });
      }

      // Check if this is a competition entry and if we should apply a sticker
      if (isCompetitionEntry && competitionId) {
        debug.log(`Upload API: Processing competition entry for competition ${competitionId}`);
        try {
          // Try to auto-apply sticker based on competition settings
          debug.log(`Upload API: Trying to auto-apply sticker for competition ${competitionId}`);
          const processedResult = await autoApplyStickerToMedia(buffer, file.name, mediaType as 'IMAGE' | 'VIDEO', competitionId, isCompetitionEntry);

            if (processedResult) {
              debug.log(`Upload API: Auto-applied sticker successfully, file stored at ${processedResult.url}`);
              fileUrl = processedResult.url; // This is the stickered image URL
              appliedStickerId = processedResult.stickerId;

              // The original file is already stored in the 'original' folder
              debug.log(`Upload API: Original file stored at ${processedResult.originalUrl}`);

              // Verify the stickered file exists
              const stickeredFilePath = path.join(process.cwd(), 'public', processedResult.url);
              if (!fs.existsSync(stickeredFilePath)) {
                debug.error(`Upload API: Stickered file not found at ${stickeredFilePath}, falling back to original`);
                fileUrl = processedResult.originalUrl;
              } else {
                debug.log(`Upload API: Verified stickered file exists at ${stickeredFilePath}`);
              }

            // Create a record in the StickerUsage table if it's not a default sticker
            if (appliedStickerId !== 'default-sticker') {
              try {
                await prisma.stickerUsage.create({
                  data: {
                    stickerId: appliedStickerId,
                    mediaUrl: fileUrl
                    // postId field has been removed from the schema
                  }
                });
                debug.log(`Upload API: Created sticker usage record for sticker ${appliedStickerId} and media ${fileUrl}`);
              } catch (usageError) {
                debug.error('Upload API: Error creating sticker usage record:', usageError);
                // Continue even if sticker usage record creation fails
              }
            } else {
              debug.log(`Upload API: Skipping sticker usage record for default sticker`);
            }
            } else {
              // If auto-apply didn't work, store the file normally
              debug.log('Upload API: Auto-apply sticker returned null, storing file normally');
              fileUrl = await storeFile(buffer, file.name, 'original');
              debug.log(`Upload API: File stored normally at ${fileUrl}`);
            }
          } catch (error) {
            debug.error('Upload API: Error processing competition entry:', error);
            // If there's an error applying the sticker, fall back to storing the original file
            try {
              fileUrl = await storeFile(buffer, file.name, 'original');
              debug.log(`Upload API: Fallback - file stored normally at ${fileUrl}`);
            } catch (storeError) {
              debug.error('Upload API: Error storing file:', storeError);
              throw new Error(`Failed to store file: ${storeError instanceof Error ? storeError.message : 'Unknown error'}`);
            }
          }
      } else {
        // Not a competition entry, store the file in the 'original' folder
        debug.log('Upload API: Not a competition entry, storing file in original folder');
        try {
          fileUrl = await storeFile(buffer, file.name, 'original');
          debug.log(`Upload API: File stored in original folder at ${fileUrl}`);
        } catch (storeError) {
          debug.error('Upload API: Error storing file:', storeError);
          throw new Error(`Failed to store file: ${storeError instanceof Error ? storeError.message : 'Unknown error'}`);
        }
      }

      // Process media into multiple quality versions
      try {
        debug.log('Upload API: Processing media into multiple quality versions');

        // Get media dimensions and metadata
        let width = undefined;
        let height = undefined;
        let duration = undefined;
        let size = buffer.length;

        if (mediaType === 'IMAGE') {
          try {
            // Get image dimensions
            const metadata = await sharp(buffer).metadata();
            width = metadata.width;
            height = metadata.height;
            debug.log(`Upload API: Image dimensions: ${width}x${height}`);
          } catch (metadataError) {
            debug.error('Upload API: Error getting image metadata:', metadataError);
          }

          // Process the image into multiple qualities
          // If we have a stickered image, use that for processing
          // Otherwise, use the original image
          let imageUrl = fileUrl;
          if (!imageUrl) {
            imageUrl = await storeFile(buffer, file.name, 'original');
            debug.log(`Upload API: No URL set yet, storing file at ${imageUrl}`);
          }
          debug.log(`Upload API: Using ${appliedStickerId ? 'stickered' : 'original'} image URL: ${imageUrl}`);

          // Verify the file exists
          const filePath = path.join(process.cwd(), 'public', imageUrl);
          if (!fs.existsSync(filePath)) {
            debug.error(`Upload API: File not found at ${filePath}, this is a critical error`);
            throw new Error(`File not found at ${imageUrl}`);
          }

          // Create a media record in the database
          debug.log('Upload API: Creating media record in database');

          const media = await prisma.media.create({
            data: {
              url: imageUrl, // This will be the stickered image URL if available
              width,
              height,
              size,
              type: mediaType,
              appliedPromotionStickerId: appliedStickerId === 'default-sticker' ? null : appliedStickerId,
            },
          });
          debug.log(`Upload API: Media record created with ID ${media.id}`);

          results.push({
            name: file.name,
            url: imageUrl, // This will be the stickered image URL if available
            mediaId: media.id,
          });
        } else if (mediaType === 'VIDEO') {
          // Process the video into multiple qualities
          // If we have a stickered video, use that for processing
          // Otherwise, use the original video
          let videoUrl = fileUrl;
          if (!videoUrl) {
            videoUrl = await storeFile(buffer, file.name, 'original');
            debug.log(`Upload API: No URL set yet, storing file at ${videoUrl}`);
          }
          debug.log(`Upload API: Using ${appliedStickerId ? 'stickered' : 'original'} video URL: ${videoUrl}`);

          // Verify the file exists
          const filePath = path.join(process.cwd(), 'public', videoUrl);
          if (!fs.existsSync(filePath)) {
            debug.error(`Upload API: File not found at ${filePath}, this is a critical error`);
            throw new Error(`File not found at ${videoUrl}`);
          }

          // Extract video duration using FFmpeg
          try {
            const { spawn } = require('child_process');

            // Get video duration using ffprobe
            const durationPromise = new Promise<number>((resolve, reject) => {
              const ffprobe = spawn('ffprobe', [
                '-v', 'error',
                '-show_entries', 'format=duration',
                '-of', 'default=noprint_wrappers=1:nokey=1',
                filePath
              ]);

              let output = '';

              ffprobe.stdout.on('data', (data: Buffer) => {
                output += data.toString();
              });

              ffprobe.on('close', (code: number) => {
                if (code === 0 && output) {
                  const videoDuration = parseFloat(output.trim());
                  debug.log(`Upload API: Video duration: ${videoDuration} seconds`);
                  resolve(videoDuration);
                } else {
                  debug.error(`Upload API: FFprobe process exited with code ${code}`);
                  resolve(0); // Default to 0 if we can't determine duration
                }
              });

              ffprobe.on('error', (err: Error) => {
                debug.error(`Upload API: FFprobe error: ${err}`);
                resolve(0); // Default to 0 if we can't determine duration
              });
            });

            // Wait for duration to be extracted
            duration = await durationPromise;
          } catch (durationError) {
            debug.error('Upload API: Error extracting video duration:', durationError);
            // Continue without duration
          }

          // Create a media record in the database
          debug.log('Upload API: Creating media record in database');

          const media = await prisma.media.create({
            data: {
              url: videoUrl, // This will be the stickered video URL if available
              width,
              height,
              duration,
              size,
              type: mediaType,
              appliedPromotionStickerId: appliedStickerId === 'default-sticker' ? null : appliedStickerId,
            },
          });
          debug.log(`Upload API: Media record created with ID ${media.id}`);

          results.push({
            name: file.name,
            url: videoUrl, // This will be the stickered video URL if available
            mediaId: media.id,
          });
        }
      } catch (processingError) {
        debug.error('Upload API: Error processing media or creating record:', processingError);

        // Instead of throwing an error, store the original file and continue
        try {
          debug.log('Upload API: Falling back to storing original file without processing');

          // If we already have a file URL, use that
          // Otherwise, store the original file in the 'original' folder
          if (!fileUrl) {
            fileUrl = await storeFile(buffer, file.name, 'original');
            debug.log(`Upload API: Original file stored at ${fileUrl}`);
          } else {
            // Verify the file exists
            const filePath = path.join(process.cwd(), 'public', fileUrl);
            if (!fs.existsSync(filePath)) {
              debug.error(`Upload API: File not found at ${filePath}, storing original file`);
              fileUrl = await storeFile(buffer, file.name, 'original');
              debug.log(`Upload API: Original file stored at ${fileUrl}`);
            } else {
              debug.log(`Upload API: Using existing file at ${fileUrl}`);
            }
          }

          // Create a basic media record in the database
          const media = await prisma.media.create({
            data: {
              url: fileUrl, // This will be the stickered image URL if available
              type: mediaType,
              size: buffer.length,
              appliedPromotionStickerId: appliedStickerId === 'default-sticker' ? null : appliedStickerId,
            },
          });
          debug.log(`Upload API: Basic media record created with ID ${media.id}`);

          results.push({
            name: file.name,
            url: fileUrl,
            mediaId: media.id,
          });
        } catch (fallbackError) {
          debug.error('Upload API: Error in fallback processing:', fallbackError);
          throw new Error(`Failed to process media even with fallback: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
        }
      }
    }

    debug.log(`Upload API: Successfully processed ${results.length} files`);

    // Ensure we have valid results before returning
    if (!results || results.length === 0) {
      debug.error('Upload API: No valid results to return');
      return Response.json(
        { error: "Failed to process uploaded files" },
        { status: 500 }
      );
    }

    // Validate that each result has the required fields
    const validResults = results.filter(result => {
      const isValid = result && result.mediaId && result.url;
      if (!isValid) {
        debug.error('Upload API: Invalid result object:', result);
      }
      return isValid;
    });

    if (validResults.length === 0) {
      debug.error('Upload API: No valid results after filtering');
      return Response.json(
        { error: "Failed to process uploaded files properly" },
        { status: 500 }
      );
    }

    // Return the validated results
    debug.log(`Upload API: Returning ${validResults.length} valid results`);
    return Response.json({ files: validResults }, { status: 200 });
  } catch (error) {
    debug.error('Upload API: Error during upload process:', error);
    // Log detailed error information
    if (error instanceof Error) {
      debug.error(`Error name: ${error.name}`);
      debug.error(`Error message: ${error.message}`);
      debug.error(`Error stack: ${error.stack}`);
    }

    // Provide more detailed error message to help with debugging
    const errorMessage = error instanceof Error
      ? error.message
      : "Failed to upload file";

    // Ensure we return a valid JSON response
    try {
      return Response.json(
        { error: errorMessage },
        { status: 500 }
      );
    } catch (responseError) {
      debug.error('Upload API: Error creating JSON response:', responseError);
      // As a last resort, return a plain text response
      return new Response(
        `Error: ${errorMessage}`,
        { status: 500, headers: { 'Content-Type': 'text/plain' } }
      );
    }
  }
}
