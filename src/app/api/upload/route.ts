import prisma from "@/lib/prisma";
import { storeFile, getFileType } from "@/lib/fileStorage";
import { processImageWithSticker, processVideoWithSticker, isMediaEligibleForSticker, autoApplyStickerToMedia, isMediaBufferEligibleForSticker } from "@/lib/imageProcessing";
import { processMedia } from "@/lib/mediaProcessing";
import { processVideoToHLS, generateThumbnail, checkFFmpegInstalled } from "@/lib/video-processing";
import { NextRequest } from "next/server";
import { StickerPosition } from "@prisma/client";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { getAuthenticatedUser } from "@/lib/api-auth";
import debug from "@/lib/debug";

// Helper function to check FFmpeg availability
async function checkFFmpegAvailable(): Promise<boolean> {
  try {
    return await checkFFmpegInstalled();
  } catch (error) {
    debug.error('Upload API: Error checking FFmpeg:', error);
    return false;
  }
}

const MAX_FILES = 5;

// Next.js Route Segment Config for large file uploads
// CRITICAL: These settings are required for file uploads to work
export const dynamic = 'force-dynamic'; // Disable static optimization
export const maxDuration = 300; // 5 minutes for video processing
export const runtime = 'nodejs'; // Use Node.js runtime (not Edge)

// IMPORTANT: Next.js API routes automatically handle FormData
// No need to set bodyParser: false (that's for Pages Router, not App Router)

export async function POST(req: NextRequest) {
  // Wrap EVERYTHING in try-catch to prevent server crashes
  try {
    debug.log('='.repeat(60));
    debug.log('Upload API: NEW UPLOAD REQUEST STARTED');
    debug.log('='.repeat(60));
    debug.log('Upload API: Request URL:', req.url);
    debug.log('Upload API: Request method:', req.method);
    debug.log('Upload API: Content-Type:', req.headers.get('content-type'));
    debug.log('Upload API: Content-Length:', req.headers.get('content-length'));

    // Validate user authentication (supports both JWT and session)
    let user;
    try {
      user = await getAuthenticatedUser(req);
      if (!user) {
        debug.log('Upload API: Unauthorized user');
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      debug.log(`Upload API: ✅ Authenticated user ${user.id}`);
    } catch (authError) {
      debug.error('Upload API: Authentication error:', authError);
      return Response.json({ 
        error: "Authentication failed", 
        details: authError instanceof Error ? authError.message : 'Unknown error'
      }, { status: 401 });
    }

    // Parse the form data with timeout
    debug.log('Upload API: Starting FormData parsing...');
    let formData;
    try {
      const startTime = Date.now();
      formData = await Promise.race([
        req.formData(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('FormData parsing timeout after 60 seconds')), 60000)
        )
      ]);
      const parseTime = Date.now() - startTime;
      debug.log(`Upload API: ✅ FormData parsed successfully in ${parseTime}ms`);
    } catch (formDataError) {
      debug.error('Upload API: ❌ Error parsing form data:', formDataError);
      debug.error('Upload API: Error type:', formDataError instanceof Error ? formDataError.constructor.name : typeof formDataError);
      debug.error('Upload API: Error message:', formDataError instanceof Error ? formDataError.message : String(formDataError));
      return Response.json({ 
        error: "Failed to parse upload data", 
        details: formDataError instanceof Error ? formDataError.message : 'File might be too large or corrupted',
        hint: 'Try uploading a smaller file or check your internet connection'
      }, { status: 400 });
    }
    
    const files = formData.getAll('files') as File[];
    const thumbnail = formData.get('thumbnail') as File | null;
    const isCompetitionEntry = formData.get('isCompetitionEntry') === 'true';
    const competitionId = formData.get('competitionId') as string | null;

    debug.log(`Upload API: Received ${files.length} files`);
    debug.log(`Upload API: Thumbnail: ${thumbnail ? 'yes' : 'no'}`);
    debug.log(`Upload API: Competition entry: ${isCompetitionEntry}`);
    debug.log(`Upload API: Competition ID: ${competitionId || 'none'}`);

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
          // Process the video into HLS chunks for progressive streaming (Instagram-style)
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

          // Generate unique ID for this video
          const { v4: uuidv4 } = require('uuid');
          const videoId = uuidv4();
          
          // Create output directory for HLS files
          const outputDir = path.join(process.cwd(), 'public', 'videos', videoId);
          await fs.promises.mkdir(outputDir, { recursive: true });

          debug.log(`Upload API: Processing video to HLS chunks at ${outputDir}`);

          // Process video into HLS chunks
          let hlsResult;
          try {
            debug.log('Upload API: Starting HLS processing...');
            
            // Check if FFmpeg is available first
            const ffmpegAvailable = await checkFFmpegAvailable();
            if (!ffmpegAvailable) {
              debug.error('Upload API: FFmpeg not available, skipping HLS processing');
              hlsResult = null;
            } else {
              hlsResult = await processVideoToHLS({
                inputPath: filePath,
                outputDir: outputDir,
              });
              debug.log(`Upload API: HLS processing complete:`, hlsResult);
            }
          } catch (hlsError) {
            debug.error('Upload API: Error processing video to HLS:', hlsError);
            debug.error('Upload API: HLS Error details:', hlsError instanceof Error ? hlsError.message : String(hlsError));
            // Fall back to direct video URL if HLS processing fails
            hlsResult = null;
          }

          // Process thumbnail if provided, otherwise generate from video
          let thumbnailUrl: string | null = null;
          if (thumbnail) {
            try {
              debug.log('Upload API: Processing provided video thumbnail');
              const thumbnailBuffer = Buffer.from(await thumbnail.arrayBuffer());
              thumbnailUrl = await storeFile(thumbnailBuffer, `thumb_${file.name}.jpg`, 'thumbnails');
              debug.log(`Upload API: Thumbnail stored at ${thumbnailUrl}`);
            } catch (thumbError) {
              debug.error('Upload API: Error processing thumbnail:', thumbError);
            }
          }
          
          // If no thumbnail provided and HLS processing succeeded, use generated thumbnail
          if (!thumbnailUrl && hlsResult?.thumbnailUrl) {
            thumbnailUrl = `/videos/${videoId}/${hlsResult.thumbnailUrl}`;
            debug.log(`Upload API: Using HLS-generated thumbnail at ${thumbnailUrl}`);
          }

          // Use HLS data if available
          let finalVideoUrl = videoUrl;
          let urlHigh = null;
          let urlMedium = null;
          let urlLow = null;
          
          if (hlsResult) {
            // Construct URLs for HLS playlists
            const baseUrl = `/videos/${videoId}`;
            finalVideoUrl = `${baseUrl}/${hlsResult.masterPlaylistUrl}`; // Master HLS playlist
            
            // Set quality-specific URLs
            const highQuality = hlsResult.qualities.find(q => q.quality === 'high');
            const mediumQuality = hlsResult.qualities.find(q => q.quality === 'medium');
            const lowQuality = hlsResult.qualities.find(q => q.quality === 'low');
            
            if (highQuality) urlHigh = `${baseUrl}/${highQuality.playlistUrl}`;
            if (mediumQuality) urlMedium = `${baseUrl}/${mediumQuality.playlistUrl}`;
            if (lowQuality) urlLow = `${baseUrl}/${lowQuality.playlistUrl}`;
            
            debug.log(`Upload API: HLS URLs - Master: ${finalVideoUrl}, High: ${urlHigh}, Medium: ${urlMedium}, Low: ${urlLow}`);
            
            // Update width, height, duration from HLS processing
            if (hlsResult.width) width = hlsResult.width;
            if (hlsResult.height) height = hlsResult.height;
            if (hlsResult.duration) duration = hlsResult.duration;
          } else {
            // Fallback: Extract video duration using FFmpeg if HLS processing failed
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
          }

          // Create a media record in the database
          debug.log('Upload API: Creating media record in database');

          const media = await prisma.media.create({
            data: {
              url: finalVideoUrl, // HLS master playlist or original video URL
              urlHigh: urlHigh,
              urlMedium: urlMedium,
              urlLow: urlLow,
              urlThumbnail: thumbnailUrl,
              posterUrl: thumbnailUrl,
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
            url: finalVideoUrl, // HLS master playlist or original video URL
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
