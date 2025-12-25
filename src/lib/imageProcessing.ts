import { createCanvas, loadImage } from 'canvas';
import { StickerPosition } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { storeFile, storeStickeredFile } from './fileStorage';
import { spawn } from 'child_process';
import { Readable } from 'stream';
import prisma from './prisma';

import debug from "@/lib/debug";

// Base directory for file storage
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

/**
 * Get a sticker configuration for a competition
 * @param competitionId The ID of the competition
 * @returns Object with sticker URL and position, or null if no sticker is configured
 */
async function getCompetitionStickerConfig(competitionId: string): Promise<{ stickerUrl: string; position: StickerPosition; stickerId: string } | null> {
  debug.log('STICKER DEBUG: Starting getCompetitionStickerConfig function');
  debug.log(`STICKER DEBUG: Looking for stickers for competition ID: ${competitionId}`);
  try {
    if (!competitionId) {
      debug.error('STICKER DEBUG: No competition ID provided');
      return null;
    }

    // First, verify this is a valid competition
    const competitionExists = await prisma.competition.findUnique({
      where: { id: competitionId },
      select: { id: true }
    });

    if (!competitionExists) {
      debug.log(`STICKER DEBUG: Competition with ID ${competitionId} not found`);
      return null;
    }

    debug.log(`STICKER DEBUG: Competition with ID ${competitionId} found, looking for stickers`);

    // Skip the default sticker check and go directly to competition stickers
    debug.log(`STICKER DEBUG: Looking for promotional stickers for competition: ${competitionId}`);

    debug.log(`STICKER DEBUG: No default sticker found, looking for any active sticker`);

    // If no default sticker, try to find any active sticker for this competition

    // Get the competition with its promotion stickers
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      select: {
        promotionStickers: {
          where: { isActive: true },
          select: {
            id: true,
            imageUrl: true,
            position: true,
            limit: true,
            _count: {
              select: {
                usages: true
              }
            },
            usages: {
              select: {
                isDeleted: true
              }
            }
          },
        },
      },
    });

    debug.log('STICKER DEBUG: Competition stickers retrieved:');
    debug.log(JSON.stringify(competition?.promotionStickers, null, 2));

    // If no competition or no active stickers, try to use the default sticker
    if (!competition || !competition.promotionStickers.length) {
      debug.log('STICKER DEBUG: No competition stickers found, checking for default sticker');

      // Check if the default sticker file exists
      const defaultStickerPath = path.join(process.cwd(), 'public', '/uploads/sticker.png');
      debug.log(`STICKER DEBUG: Checking for default sticker at ${defaultStickerPath}`);

      if (fs.existsSync(defaultStickerPath)) {
        debug.log('STICKER DEBUG: Default sticker found, using it');
        return {
          stickerId: 'default-sticker',
          stickerUrl: '/uploads/sticker.png',
          position: 'BOTTOM_RIGHT',
        };
      } else {
        debug.log('STICKER DEBUG: No default sticker found, skipping sticker application');
        return null;
      }
    }

    // Filter out stickers that have reached their usage limit
    const availableStickers = competition.promotionStickers.filter(sticker => {
      // If no limit is set, sticker is available
      if (!sticker.limit) return true;

      // Calculate active usages (total minus deleted)
      const totalUsages = sticker._count.usages;
      const deletedUsages = sticker.usages.filter(usage => usage.isDeleted).length;
      const activeUsages = totalUsages - deletedUsages;

      debug.log(`STICKER DEBUG: Sticker ${sticker.id} has ${activeUsages}/${sticker.limit} active usages`);

      // Check if active usages are less than the limit
      return activeUsages < sticker.limit;
    });

    debug.log(`STICKER DEBUG: Available stickers after limit check: ${availableStickers.length}`);

    // If no available stickers, return null
    if (availableStickers.length === 0) {
      debug.log('STICKER DEBUG: No available stickers found (all have reached their usage limit);');
      return null;
    }

    // Select a sticker (take the first available one)
    const sticker = availableStickers[0];

    return {
      stickerId: sticker.id,
      stickerUrl: sticker.imageUrl,
      position: sticker.position,
    };
  } catch (error) {
    debug.error('Error getting competition sticker config:', error);
    return null;
  }
}

/**
 * Get video dimensions using FFmpeg
 * @param videoPath Path to the video file
 * @returns Object with width and height, or null if dimensions couldn't be determined
 */
async function getVideoDimensions(videoPath: string): Promise<{ width: number; height: number } | null> {
  try {
    return new Promise((resolve, reject) => {
      const ffprobe = spawn('ffprobe', [
        '-v', 'error',
        '-select_streams', 'v:0',
        '-show_entries', 'stream=width,height',
        '-of', 'csv=p=0',
        videoPath
      ]);

      let output = '';

      ffprobe.stdout.on('data', (data) => {
        output += data.toString();
      });

      ffprobe.on('close', (code) => {
        if (code === 0 && output) {
          const [width, height] = output.trim().split(',').map(Number);
          if (!isNaN(width) && !isNaN(height)) {
            resolve({ width, height });
          } else {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      });

      ffprobe.on('error', () => {
        resolve(null);
      });
    });
  } catch (error) {
    debug.error('Error getting video dimensions:', error);
    return null;
  }
}

/**
 * Check if FFmpeg is available on the system
 * @returns Promise<boolean> True if FFmpeg is available, false otherwise
 */
async function isFFmpegAvailable(): Promise<boolean> {
  try {
    return new Promise<boolean>((resolve) => {
      const ffmpeg = spawn('ffmpeg', ['-version']);

      let errorOutput = '';

      ffmpeg.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          debug.log('FFmpeg is available and working properly');
          resolve(true);
        } else {
          debug.error(`FFmpeg check failed with code ${code}. Error: ${errorOutput}`);
          resolve(false);
        }
      });

      ffmpeg.on('error', (err) => {
        debug.error('FFmpeg spawn error:', err);
        resolve(false);
      });

      // Set a timeout in case the process hangs
      setTimeout(() => {
        debug.error('FFmpeg check timed out');
        resolve(false);
      }, 2000);
    });
  } catch (error) {
    debug.error('Error checking for FFmpeg:', error);
    return false;
  }
}

/**
 * Applies a sticker to an image at the specified position
 * @param imageBuffer The original image as a buffer
 * @param stickerUrl The URL of the sticker to apply
 * @param position The position to place the sticker
 * @param stickerSize The size of the sticker as a percentage of the image width (default: 0.2 or 20%)
 * @returns A buffer containing the processed image with the sticker applied
 */
export async function applyImageSticker(
  imageBuffer: Buffer,
  stickerUrl: string,
  position: StickerPosition,
  stickerSize: number = 0.2
): Promise<Buffer> {
  debug.log('STICKER DEBUG: Starting applyImageSticker function');
  debug.log(`STICKER DEBUG: Image buffer size: ${imageBuffer.length} bytes`);
  debug.log(`STICKER DEBUG: Sticker URL: ${stickerUrl}`);
  debug.log(`STICKER DEBUG: Position: ${position}`);
  debug.log(`STICKER DEBUG: Sticker size: ${stickerSize}`);

  try {
    debug.log('ImageProcessing: Starting sticker application');

    if (!imageBuffer || imageBuffer.length === 0) {
      debug.error('ImageProcessing: Empty image buffer provided');
      throw new Error('Empty image buffer provided');
    }

    if (!stickerUrl) {
      debug.error('ImageProcessing: No sticker URL provided');
      throw new Error('No sticker URL provided');
    }

    debug.log(`ImageProcessing: Loading image from buffer (${imageBuffer.length} bytes);`);

    // Check if the image is very large and might cause memory issues
    const isVeryLargeImage = imageBuffer.length > 20 * 1024 * 1024; // Over 20MB
    if (isVeryLargeImage) {
      debug.log('ImageProcessing: Very large image detected, this might cause memory issues');
    }

    // Load the original image
    let image;
    try {
      image = await loadImage(imageBuffer);
      debug.log(`ImageProcessing: Image loaded successfully, dimensions: ${image.width}x${image.height}`);

      // Check if image dimensions are too large for canvas
      const maxDimension = 8000; // Most canvas implementations have limits around 8192px
      if (image.width > maxDimension || image.height > maxDimension) {
        debug.error(`ImageProcessing: Image dimensions (${image.width}x${image.height}); exceed maximum supported size`);
        throw new Error('Image dimensions too large for processing');
      }
    } catch (imageError) {
      debug.error('ImageProcessing: Failed to load image from buffer:', imageError);
      throw new Error(`Failed to load image from buffer: ${imageError instanceof Error ? imageError.message : 'Unknown error'}`);
    }

    // Create a canvas with the same dimensions as the image
    debug.log('ImageProcessing: Creating canvas');
    let canvas;
    let ctx;
    try {
      canvas = createCanvas(image.width, image.height);
      ctx = canvas.getContext('2d');

      // Draw the original image onto the canvas
      ctx.drawImage(image, 0, 0, image.width, image.height);
      debug.log('ImageProcessing: Original image drawn to canvas');
    } catch (canvasError) {
      debug.error('ImageProcessing: Failed to create canvas or draw image:', canvasError);
      throw new Error(`Failed to create canvas: ${canvasError instanceof Error ? canvasError.message : 'Unknown error'}`);
    }

    // Load the sticker image
    // If the sticker URL is a remote URL, use it directly
    // If it's a local path (starts with /uploads/), prepend the process.cwd()/public
    let stickerPath = stickerUrl;
    if (stickerUrl.startsWith('/uploads/')) {
      stickerPath = path.join(process.cwd(), 'public', stickerUrl);
      debug.log(`ImageProcessing: Using local sticker path: ${stickerPath}`);

      // Verify the sticker file exists
      if (!fs.existsSync(stickerPath)) {
        debug.error(`ImageProcessing: Sticker file not found at path: ${stickerPath}`);
        throw new Error(`Sticker file not found: ${stickerUrl}`);
      }

      // Check if the sticker is a WebP file and convert it to PNG
      if (stickerPath.toLowerCase().endsWith('.webp')) {
        try {
          debug.log(`ImageProcessing: Converting WebP sticker to PNG for compatibility`);
          debug.log(`ImageProcessing: WebP sticker path: ${stickerPath}`);

          // Verify the WebP file exists and is readable
          const stats = fs.statSync(stickerPath);
          debug.log(`ImageProcessing: WebP file size: ${stats.size} bytes`);

          const webpBuffer = fs.readFileSync(stickerPath);
          debug.log(`ImageProcessing: WebP buffer size: ${webpBuffer.length} bytes`);

          // Create a unique filename for the PNG version
          const pngPath = stickerPath.replace(/\.webp$/i, `-${Date.now()}.png`);
          debug.log(`ImageProcessing: Target PNG path: ${pngPath}`);

          // Convert WebP to PNG
          const pngBuffer = await sharp(webpBuffer).png().toBuffer();
          debug.log(`ImageProcessing: PNG buffer size: ${pngBuffer.length} bytes`);

          // Write the PNG file
          fs.writeFileSync(pngPath, pngBuffer);
          debug.log(`ImageProcessing: Converted WebP to PNG at ${pngPath}`);

          // Verify the PNG file exists and is readable
          const pngStats = fs.statSync(pngPath);
          debug.log(`ImageProcessing: PNG file size: ${pngStats.size} bytes`);

          stickerPath = pngPath;
        } catch (conversionError) {
          debug.error('ImageProcessing: Error converting WebP to PNG:', conversionError);
          throw new Error(`Failed to convert WebP sticker: ${conversionError instanceof Error ? conversionError.message : 'Unknown error'}`);
        }
      }
    } else if (stickerUrl.includes('utfs.io')) {
      // For UploadThing URLs, we need to download the sticker first
      debug.log(`ImageProcessing: Downloading sticker from UploadThing URL: ${stickerUrl}`);
      try {
        const response = await fetch(stickerUrl);
        if (!response.ok) {
          throw new Error(`Failed to download sticker: ${response.statusText}`);
        }
        const stickerBuffer = Buffer.from(await response.arrayBuffer());
        const tempStickerName = `temp_sticker_${Date.now()}.png`;
        stickerPath = path.join(UPLOAD_DIR, tempStickerName);
        fs.writeFileSync(stickerPath, stickerBuffer);
        debug.log(`ImageProcessing: Downloaded sticker stored at ${stickerPath}`);
      } catch (downloadError) {
        debug.error('ImageProcessing: Error downloading sticker:', downloadError);
        throw new Error(`Failed to download sticker: ${downloadError instanceof Error ? downloadError.message : 'Unknown error'}`);
      }
    } else {
      debug.log(`ImageProcessing: Using remote sticker URL: ${stickerUrl}`);
    }

    debug.log('ImageProcessing: Loading sticker image from path:', stickerPath);
    let sticker;
    try {
      // Verify the file exists and is readable before trying to load it
      if (fs.existsSync(stickerPath)) {
        const stats = fs.statSync(stickerPath);
        debug.log(`ImageProcessing: Sticker file exists, size: ${stats.size} bytes`);

        // Check file extension to ensure it's a supported format
        const ext = path.extname(stickerPath).toLowerCase();
        debug.log(`ImageProcessing: Sticker file extension: ${ext}`);

        if (ext === '.webp') {
          debug.error('ImageProcessing: WebP format detected, this should have been converted earlier');
          throw new Error('WebP format not supported by canvas library');
        }

        // Try to read the file content to verify it's not corrupted
        const fileBuffer = fs.readFileSync(stickerPath);
        debug.log(`ImageProcessing: Successfully read sticker file, buffer size: ${fileBuffer.length} bytes`);
      } else {
        debug.error(`ImageProcessing: Sticker file not found at path: ${stickerPath}`);
        throw new Error(`Sticker file not found: ${stickerPath}`);
      }

      // Now try to load the image
      debug.log('ImageProcessing: Attempting to load sticker with canvas loadImage');
      sticker = await loadImage(stickerPath);
      debug.log(`ImageProcessing: Sticker loaded successfully, dimensions: ${sticker.width}x${sticker.height}`);

      // Verify sticker dimensions are valid
      if (sticker.width <= 0 || sticker.height <= 0) {
        debug.error(`ImageProcessing: Invalid sticker dimensions: ${sticker.width}x${sticker.height}`);
        throw new Error('Invalid sticker dimensions');
      }
    } catch (stickerError) {
      debug.error('ImageProcessing: Failed to load sticker image:', stickerError);
      throw new Error(`Failed to load sticker image from ${stickerUrl}: ${stickerError instanceof Error ? stickerError.message : 'Unknown error'}`);
    }

    // Calculate sticker dimensions (as a percentage of the image width)
    const stickerWidth = image.width * stickerSize;
    const stickerHeight = (sticker.height / sticker.width) * stickerWidth;

    // Calculate position coordinates
    let x = 0;
    let y = 0;
    const padding = image.width * 0.02; // 2% padding

    switch (position) {
      case 'TOP_LEFT':
        x = padding;
        y = padding;
        break;
      case 'TOP_RIGHT':
        x = image.width - stickerWidth - padding;
        y = padding;
        break;
      case 'BOTTOM_LEFT':
        x = padding;
        y = image.height - stickerHeight - padding;
        break;
      case 'BOTTOM_RIGHT':
        x = image.width - stickerWidth - padding;
        y = image.height - stickerHeight - padding;
        break;
      case 'CENTER':
        x = (image.width - stickerWidth) / 2;
        y = (image.height - stickerHeight) / 2;
        break;
      default:
        x = padding;
        y = padding;
    }

    // Draw the sticker onto the canvas
    debug.log(`ImageProcessing: Drawing sticker at position (${x}, ${y}); with size ${stickerWidth}x${stickerHeight}`);
    try {
      ctx.drawImage(sticker, x, y, stickerWidth, stickerHeight);
      debug.log('ImageProcessing: Sticker drawn to canvas successfully');
    } catch (drawError) {
      debug.error('ImageProcessing: Failed to draw sticker onto canvas:', drawError);
      throw new Error(`Failed to draw sticker: ${drawError instanceof Error ? drawError.message : 'Unknown error'}`);
    }

    // Convert the canvas to a buffer
    debug.log('ImageProcessing: Converting canvas to buffer');
    try {
      const outputBuffer = canvas.toBuffer('image/jpeg', { quality: 0.9 });
      debug.log(`ImageProcessing: Canvas converted to buffer successfully (${outputBuffer.length} bytes);`);

      // Verify the output buffer is valid
      if (!outputBuffer || outputBuffer.length === 0) {
        debug.error('ImageProcessing: Empty buffer returned from canvas.toBuffer');
        throw new Error('Empty buffer returned from canvas');
      }

      // Clean up temporary sticker file if we created one
      if (stickerPath.includes('temp_sticker_')) {
        try {
          fs.unlinkSync(stickerPath);
          debug.log(`ImageProcessing: Cleaned up temporary sticker file: ${stickerPath}`);
        } catch (cleanupError) {
          debug.error('ImageProcessing: Error cleaning up temporary sticker file:', cleanupError);
          // Continue even if cleanup fails
        }
      }

      return outputBuffer;
    } catch (bufferError) {
      debug.error('ImageProcessing: Failed to convert canvas to buffer:', bufferError);

      // Clean up temporary sticker file if we created one
      if (stickerPath.includes('temp_sticker_')) {
        try {
          fs.unlinkSync(stickerPath);
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
      }

      throw new Error('Failed to convert processed image to buffer');
    }
  } catch (error) {
    debug.error('ImageProcessing: Error applying sticker to image:', error);
    throw new Error(`Failed to apply sticker to image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Processes an image with a promotion sticker
 * @param mediaBuffer The original media file buffer
 * @param fileName The original file name
 * @param stickerUrl The URL of the sticker to apply
 * @param position The position to place the sticker
 * @returns The buffer of the processed image
 */
export async function processImageWithSticker(
  mediaBuffer: Buffer,
  fileName: string,
  stickerUrl: string,
  position: StickerPosition
): Promise<Buffer> {
  debug.log('STICKER DEBUG: Starting processImageWithSticker function');
  debug.log(`STICKER DEBUG: Media buffer size: ${mediaBuffer.length} bytes`);
  debug.log(`STICKER DEBUG: File name: ${fileName}`);
  debug.log(`STICKER DEBUG: Sticker URL: ${stickerUrl}`);
  debug.log(`STICKER DEBUG: Position: ${position}`);

  try {
    debug.log(`ImageProcessing: Processing image with sticker, fileName=${fileName}, position=${position}`);

    if (!mediaBuffer || mediaBuffer.length === 0) {
      debug.error('ImageProcessing: Empty media buffer provided');
      throw new Error('Empty media buffer provided');
    }

    if (!fileName) {
      debug.error('ImageProcessing: No file name provided');
      throw new Error('No file name provided');
    }

    if (!stickerUrl) {
      debug.error('ImageProcessing: No sticker URL provided');
      throw new Error('No sticker URL provided');
    }

    // Verify the sticker file exists if it's a local path
    if (stickerUrl.startsWith('/uploads/')) {
      const stickerPath = path.join(process.cwd(), 'public', stickerUrl);
      if (!fs.existsSync(stickerPath)) {
        debug.error(`ImageProcessing: Sticker file not found at path: ${stickerPath}`);
        throw new Error(`Sticker file not found: ${stickerUrl}`);
      }
      debug.log(`ImageProcessing: Verified sticker file exists at ${stickerPath}`);
    }

    // Apply the sticker to the image
    debug.log('ImageProcessing: Applying sticker to image');
    let processedBuffer;
    try {
      // Check if the image is too large (over 10MP)
      const isLargeImage = mediaBuffer.length > 10 * 1024 * 1024;
      if (isLargeImage) {
        debug.log('ImageProcessing: Large image detected, using reduced quality for processing');
      }

      processedBuffer = await applyImageSticker(mediaBuffer, stickerUrl, position);

      if (!processedBuffer || processedBuffer.length === 0) {
        debug.error('ImageProcessing: Empty buffer returned from applyImageSticker');
        throw new Error('Empty buffer returned from sticker application');
      }

      debug.log(`ImageProcessing: Sticker applied successfully, buffer size: ${processedBuffer.length} bytes`);
    } catch (stickerError) {
      debug.error('ImageProcessing: Failed to apply sticker:', stickerError);
      // Instead of throwing, fall back to the original image
      debug.log('ImageProcessing: Falling back to original image');
      return mediaBuffer; // Return the original buffer
    }

    // Return the processed buffer
    debug.log(`ImageProcessing: Returning processed image buffer, size: ${processedBuffer.length} bytes`);
    return processedBuffer;
  } catch (error) {
    debug.error('ImageProcessing: Error processing image with sticker:', error);
    // Fall back to the original image as a last resort
    return mediaBuffer;
  }
}

/**
 * Determines if a media file is eligible for a promotion sticker
 * @param mediaType The type of media (IMAGE or VIDEO)
 * @param competitionMediaType The competition media type
 * @returns Boolean indicating if the media is eligible for a sticker
 */
export function isMediaEligibleForSticker(
  mediaType: string,
  competitionMediaType: string
): boolean {
  // Check media eligibility

  // Support stickers on both images and videos
  if (mediaType === 'IMAGE') {
    // Check if the competition allows images
    const isEligible = competitionMediaType === 'IMAGE_ONLY' || competitionMediaType === 'BOTH';
    debug.log(`Image eligibility check: ${isEligible} (competition type: ${competitionMediaType});`);
    return isEligible;
  } else if (mediaType === 'VIDEO') {
    // Check if the competition allows videos
    const isEligible = competitionMediaType === 'VIDEO_ONLY' || competitionMediaType === 'BOTH';
    debug.log(`Video eligibility check: ${isEligible} (competition type: ${competitionMediaType});`);
    return isEligible;
  }

  debug.log(`Unknown media type: ${mediaType}, not eligible for stickers`);
  return false;
}

/**
 * Processes a video with a promotion sticker
 * @param mediaBuffer The original video file buffer
 * @param fileName The original file name
 * @param stickerUrl The URL of the sticker to apply
 * @param position The position to place the sticker
 * @returns The URL of the processed video (for now, we'll keep returning a URL for videos due to complexity)
 */
export async function processVideoWithSticker(
  mediaBuffer: Buffer,
  fileName: string,
  stickerUrl: string,
  position: StickerPosition
): Promise<string> {
  // Process video with sticker
  try {
    debug.log(`VideoProcessing: Processing video with sticker, fileName=${fileName}, position=${position}`);

    if (!mediaBuffer || mediaBuffer.length === 0) {
      debug.error('VideoProcessing: Empty media buffer provided');
      throw new Error('Empty media buffer provided');
    }

    if (!fileName) {
      debug.error('VideoProcessing: No file name provided');
      throw new Error('No file name provided');
    }

    if (!stickerUrl) {
      debug.error('VideoProcessing: No sticker URL provided');
      throw new Error('No sticker URL provided');
    }

    // Always store the original video in the original folder first
    const originalUrl = await storeFile(mediaBuffer, fileName, 'original');
    debug.log(`VideoProcessing: Original video stored at ${originalUrl}`);

    // Check if FFmpeg is available
    const ffmpegAvailable = await isFFmpegAvailable();
    if (!ffmpegAvailable) {
      debug.error('VideoProcessing: FFmpeg is not available, using a simple copy approach');

      // Since we can't process the video with FFmpeg, we'll just copy the original video to the stickered folder
      // This ensures we have a file in the stickered folder that can be displayed
      const stickeredDir = path.join(UPLOAD_DIR, 'stickered');

      // Ensure the stickered directory exists
      if (!fs.existsSync(stickeredDir)) {
        fs.mkdirSync(stickeredDir, { recursive: true });
      }

      // Use the same filename for the stickered video
      const stickeredFileName = fileName;
      const stickeredFilePath = path.join(stickeredDir, stickeredFileName);

      // Copy the original video to the stickered folder
      fs.writeFileSync(stickeredFilePath, mediaBuffer);
      debug.log(`VideoProcessing: Copied original video to stickered folder at ${stickeredFilePath}`);

      // Return the URL to the stickered video
      const stickeredUrl = `/uploads/stickered/${stickeredFileName}`;
      debug.log(`VideoProcessing: Stickered video URL: ${stickeredUrl}`);
      return stickeredUrl;
    }

    debug.log('VideoProcessing: FFmpeg is available, processing video with sticker');

    // Create a temporary file for processing
    const tempOriginalName = `temp_original_${Date.now()}_${fileName}`;
    const tempOriginalPath = path.join(UPLOAD_DIR, tempOriginalName);
    fs.writeFileSync(tempOriginalPath, mediaBuffer);
    debug.log(`VideoProcessing: Temporary original video stored at ${tempOriginalPath}`);

    // Prepare sticker path
    let stickerPath = stickerUrl;
    if (stickerUrl.startsWith('/uploads/')) {
      stickerPath = path.join(process.cwd(), 'public', stickerUrl);
      debug.log(`VideoProcessing: Using local sticker path: ${stickerPath}`);

      // Verify the sticker file exists
      if (!fs.existsSync(stickerPath)) {
        debug.error(`VideoProcessing: Sticker file not found at path: ${stickerPath}`);
        throw new Error(`Sticker file not found: ${stickerUrl}`);
      }
    } else if (stickerUrl.includes('utfs.io')) {
      // For UploadThing URLs, we need to download the sticker first
      debug.log(`VideoProcessing: Downloading sticker from UploadThing URL: ${stickerUrl}`);
      try {
        const response = await fetch(stickerUrl);
        if (!response.ok) {
          throw new Error(`Failed to download sticker: ${response.statusText}`);
        }
        const stickerBuffer = Buffer.from(await response.arrayBuffer());
        const tempStickerName = `temp_sticker_${Date.now()}.png`;
        stickerPath = path.join(UPLOAD_DIR, tempStickerName);
        fs.writeFileSync(stickerPath, stickerBuffer);
        debug.log(`VideoProcessing: Downloaded sticker stored at ${stickerPath}`);
      } catch (downloadError) {
        debug.error('VideoProcessing: Error downloading sticker:', downloadError);
        throw new Error(`Failed to download sticker: ${downloadError instanceof Error ? downloadError.message : 'Unknown error'}`);
      }
    } else {
      debug.log(`VideoProcessing: Using remote sticker URL: ${stickerUrl}`);
      // For other remote URLs, we'll try to use them directly with FFmpeg
    }

    // Get video dimensions using FFmpeg
    let videoWidth = 1280; // Default width
    let videoHeight = 720; // Default height
    try {
      const dimensions = await getVideoDimensions(tempOriginalPath);
      if (dimensions) {
        videoWidth = dimensions.width;
        videoHeight = dimensions.height;
        debug.log(`VideoProcessing: Video dimensions: ${videoWidth}x${videoHeight}`);
      }
    } catch (dimensionsError) {
      debug.error('VideoProcessing: Error getting video dimensions:', dimensionsError);
      // Continue with default dimensions
    }

    // Calculate sticker position and size
    const stickerSize = 0.2; // 20% of video width
    const stickerWidth = Math.round(videoWidth * stickerSize);
    const padding = Math.round(videoWidth * 0.02); // 2% padding

    let overlayX = '';
    let overlayY = '';

    switch (position) {
      case 'TOP_LEFT':
        overlayX = `${padding}`;
        overlayY = `${padding}`;
        break;
      case 'TOP_RIGHT':
        overlayX = `main_w-overlay_w-${padding}`;
        overlayY = `${padding}`;
        break;
      case 'BOTTOM_LEFT':
        overlayX = `${padding}`;
        overlayY = `main_h-overlay_h-${padding}`;
        break;
      case 'BOTTOM_RIGHT':
        overlayX = `main_w-overlay_w-${padding}`;
        overlayY = `main_h-overlay_h-${padding}`;
        break;
      case 'CENTER':
        overlayX = '(main_w-overlay_w)/2';
        overlayY = '(main_h-overlay_h)/2';
        break;
      default:
        overlayX = `${padding}`;
        overlayY = `${padding}`;
    }

    // Use the original filename for the stickered video
    const outputFileName = fileName;
    const stickeredDir = path.join(UPLOAD_DIR, 'stickered');

    // Ensure the stickered directory exists
    if (!fs.existsSync(stickeredDir)) {
      fs.mkdirSync(stickeredDir, { recursive: true });
    }

    const outputFilePath = path.join(stickeredDir, outputFileName);

    // Use FFmpeg to overlay the sticker on the video
    try {
      await new Promise<void>((resolve, reject) => {
        const ffmpegArgs = [
          '-i', tempOriginalPath, // Input video
          '-i', stickerPath, // Input sticker
          '-filter_complex', `[1:v]scale=${stickerWidth}:-1[overlay];[0:v][overlay]overlay=${overlayX}:${overlayY}`, // Scale sticker and overlay
          '-c:a', 'copy', // Copy audio stream
          '-c:v', 'libx264', // Use H.264 codec for video
          '-preset', 'medium', // Encoding preset
          '-crf', '23', // Quality (lower is better)
          '-movflags', '+faststart', // Optimize for web streaming
          '-y', // Overwrite output file if it exists
          outputFilePath
        ];

        debug.log(`VideoProcessing: Running FFmpeg with args:`, ffmpegArgs);

        const ffmpeg = spawn('ffmpeg', ffmpegArgs);

        ffmpeg.stderr.on('data', (data) => {
          // FFmpeg logs to stderr by default
          debug.log(`FFmpeg: ${data.toString()}`);
        });

        ffmpeg.on('close', (code) => {
          if (code === 0) {
            debug.log(`VideoProcessing: Successfully added sticker to video`);
            resolve();
          } else {
            debug.error(`VideoProcessing: FFmpeg process exited with code ${code}`);
            reject(new Error(`FFmpeg process exited with code ${code}`));
          }
        });
      });

      // Clean up temporary files
      try {
        fs.unlinkSync(tempOriginalPath);
        // Only delete the temp sticker if we created it
        if (stickerPath.includes('temp_sticker_')) {
          fs.unlinkSync(stickerPath);
        }
      } catch (cleanupError) {
        debug.error('VideoProcessing: Error cleaning up temporary files:', cleanupError);
        // Continue even if cleanup fails
      }

      // Return the URL to the processed video
      const fileUrl = `/uploads/stickered/${outputFileName}`;
      debug.log(`VideoProcessing: Processed video stored at ${fileUrl}`);
      return fileUrl;
    } catch (ffmpegError) {
      debug.error('VideoProcessing: Error processing video with FFmpeg:', ffmpegError);

      // Clean up temporary files
      try {
        fs.unlinkSync(tempOriginalPath);
        if (stickerPath.includes('temp_sticker_')) {
          fs.unlinkSync(stickerPath);
        }
      } catch (cleanupError) {
        // Ignore cleanup errors
      }

      // Fall back to copying the original video to the stickered folder
      // Original video is already stored at this point
      debug.log('VideoProcessing: Falling back to copying original video to stickered folder');
      debug.log(`VideoProcessing: Original video already stored at ${originalUrl}`);

      // Copy to stickered folder with the same filename
      const stickeredFileName = fileName;
      const stickeredDir = path.join(UPLOAD_DIR, 'stickered');

      // Ensure the stickered directory exists
      if (!fs.existsSync(stickeredDir)) {
        fs.mkdirSync(stickeredDir, { recursive: true });
      }

      const stickeredFilePath = path.join(stickeredDir, stickeredFileName);
      fs.writeFileSync(stickeredFilePath, mediaBuffer);

      // Return the URL to the stickered video
      const stickeredUrl = `/uploads/stickered/${stickeredFileName}`;
      debug.log(`VideoProcessing: Stickered video URL (fallback);: ${stickeredUrl}`);
      return stickeredUrl;
    }
  } catch (error) {
    debug.error('VideoProcessing: Error processing video with sticker:', error);
    // Fall back to copying the original video to both folders
    try {
      // Check if we've already stored the original video
      let originalUrl;
      try {
        // Try to store the original video if it hasn't been stored yet
        originalUrl = await storeFile(mediaBuffer, fileName, 'original');
        debug.log(`VideoProcessing: Fallback - original video stored at ${originalUrl}`);
      } catch (storeError) {
        debug.error('VideoProcessing: Error storing original video in fallback:', storeError);
        // If there's an error, it might be because the file already exists
        // In that case, construct the URL manually
        originalUrl = `/uploads/original/${fileName}`;
        debug.log(`VideoProcessing: Using constructed original URL: ${originalUrl}`);
      }

      // Copy to stickered folder with the same filename
      const stickeredFileName = fileName;
      const stickeredDir = path.join(UPLOAD_DIR, 'stickered');

      // Ensure the stickered directory exists
      if (!fs.existsSync(stickeredDir)) {
        fs.mkdirSync(stickeredDir, { recursive: true });
      }

      const stickeredFilePath = path.join(stickeredDir, stickeredFileName);
      fs.writeFileSync(stickeredFilePath, mediaBuffer);

      // Return the URL to the stickered video
      const stickeredUrl = `/uploads/stickered/${stickeredFileName}`;
      debug.log(`VideoProcessing: Final fallback - stickered video URL: ${stickeredUrl}`);
      return stickeredUrl;
    } catch (storeError) {
      debug.error('VideoProcessing: Error in final fallback:', storeError);
      throw new Error(`Failed to process video with sticker and all fallbacks failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Check if media buffer is eligible for sticker application
 * @param mediaBuffer The media buffer to check
 * @returns True if the media is eligible for sticker application
 */
export async function isMediaBufferEligibleForSticker(mediaBuffer: Buffer): Promise<boolean> {
  try {
    // For now, we'll consider all media eligible for stickers
    return true;
  } catch (error) {
    debug.error('Error checking media eligibility for sticker:', error);
    return false;
  }
}

/**
 * Automatically apply a sticker to media (image or video) based on competition settings
 * @param mediaBuffer The original media buffer
 * @param fileName The original file name
 * @param mediaType The type of media ('IMAGE' or 'VIDEO')
 * @param competitionId The ID of the competition (optional)
 * @returns The URL of the processed media and sticker ID, or null if no sticker was applied
 */
export async function autoApplyStickerToMedia(
  mediaBuffer: Buffer,
  fileName: string,
  mediaType: 'IMAGE' | 'VIDEO',
  competitionId?: string,
  isCompetitionEntry: boolean = false
): Promise<{ url: string; stickerId: string; originalUrl: string } | null> {
  debug.log('STICKER DEBUG: Starting autoApplyStickerToMedia function');
  debug.log(`STICKER DEBUG: Media buffer size: ${mediaBuffer.length} bytes`);
  debug.log(`STICKER DEBUG: File name: ${fileName}`);
  debug.log(`STICKER DEBUG: Media type: ${mediaType}`);
  debug.log(`STICKER DEBUG: Competition ID: ${competitionId || 'none'}`);
  debug.log(`STICKER DEBUG: Is Competition Entry: ${isCompetitionEntry}`);

  try {
    debug.log(`AutoSticker: Checking if sticker should be applied to ${fileName}`);

    // For competition entries, we always want to apply stickers if possible
    if (isCompetitionEntry) {
      debug.log(`AutoSticker: This is a competition entry${competitionId ? ` for competition ${competitionId}` : ''}, proceeding with sticker application`);
    } else {
      debug.log('AutoSticker: Not a competition entry, skipping sticker application');
      return null;
    }

    // Get competition sticker configuration if we have a competition ID
    let stickerConfig = competitionId ? await getCompetitionStickerConfig(competitionId) : null;
    debug.log(`AutoSticker: Competition sticker config result: ${stickerConfig ? 'found' : 'not found'}`);

    // If no sticker is configured, don't apply any sticker
    if (!stickerConfig) {
      debug.log('AutoSticker: No competition sticker configured, skipping sticker application');
      return null;
    }

    // First, store the original file in the 'original' folder
    const originalUrl = await storeFile(mediaBuffer, fileName, 'original');
    debug.log(`AutoSticker: Original file stored at ${originalUrl}`);

    debug.log(`AutoSticker: Applying ${stickerConfig.position} sticker to ${mediaType}`);
    debug.log(`AutoSticker: Using sticker URL: ${stickerConfig.stickerUrl}`);

    // Apply sticker based on media type and store in 'stickered' folder
    if (mediaType === 'IMAGE') {
      debug.log('AutoSticker: Processing image with sticker');
      try {
        // Process the image with sticker
        const processedBuffer = await applyImageSticker(mediaBuffer, stickerConfig.stickerUrl, stickerConfig.position);

        if (!processedBuffer || processedBuffer.length === 0) {
          debug.error('AutoSticker: Failed to get processed buffer from applyImageSticker');
          throw new Error('Failed to get processed buffer');
        }

        // Store the stickered image in the 'stickered' folder with the same filename as the original
        const stickeredUrl = await storeStickeredFile(processedBuffer, originalUrl);
        debug.log(`AutoSticker: Stickered image stored at ${stickeredUrl}`);

        // Verify the stickered image file exists
        const stickeredFilePath = path.join(process.cwd(), 'public', stickeredUrl);
        if (!fs.existsSync(stickeredFilePath)) {
          debug.error(`AutoSticker: Stickered image file not found at ${stickeredFilePath}`);
          throw new Error('Stickered image file not found');
        }

        debug.log(`AutoSticker: Successfully applied sticker to image, returning stickered URL: ${stickeredUrl}`);
        return {
          url: stickeredUrl,
          stickerId: stickerConfig.stickerId,
          originalUrl
        };
      } catch (imageError) {
        debug.error('AutoSticker: Error processing image with sticker:', imageError);
        // Fall back to the original URL if there's an error
        debug.log(`AutoSticker: Falling back to original URL: ${originalUrl}`);
        return {
          url: originalUrl,
          stickerId: stickerConfig.stickerId,
          originalUrl
        };
      }
    } else if (mediaType === 'VIDEO') {
      debug.log('AutoSticker: Processing video with sticker');

      try {
        // Process the video with sticker - this now stores directly in the stickered folder
        const stickeredUrl = await processVideoWithSticker(
          mediaBuffer,
          fileName,
          stickerConfig.stickerUrl,
          stickerConfig.position
        );
        debug.log(`AutoSticker: Video processing result: ${stickeredUrl}`);

        // Verify the stickered video file exists
        const stickeredFilePath = path.join(process.cwd(), 'public', stickeredUrl);
        if (fs.existsSync(stickeredFilePath)) {
          debug.log(`AutoSticker: Verified stickered video exists at ${stickeredFilePath}`);
          return {
            url: stickeredUrl,
            stickerId: stickerConfig.stickerId,
            originalUrl
          };
        } else {
          debug.error(`AutoSticker: Stickered video file not found at ${stickeredFilePath}`);
          // Fall back to the original URL if the stickered file doesn't exist
          return {
            url: originalUrl,
            stickerId: stickerConfig.stickerId,
            originalUrl
          };
        }
      } catch (error) {
        debug.error('AutoSticker: Error processing video with sticker:', error);
        // Fall back to the original URL if there's an error
        return {
          url: originalUrl,
          stickerId: stickerConfig.stickerId,
          originalUrl
        };
      }
    }

    return null;
  } catch (error) {
    debug.error('Error auto-applying sticker to media:', error);
    debug.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    debug.error('Error stack:', error instanceof Error ? error.stack : 'No stack available');
    return null;
  }
}