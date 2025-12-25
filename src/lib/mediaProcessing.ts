import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { storeFile } from './fileStorage';

import debug from "@/lib/debug";

// Base directory for file storage
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

// Quality levels for images
const IMAGE_QUALITY_LEVELS = {
  original: { quality: 100 }, // Original quality
  high: { quality: 85, maxWidth: 1920 }, // High quality, max width 1920px
  medium: { quality: 70, maxWidth: 1280 }, // Medium quality, max width 1280px
  low: { quality: 50, maxWidth: 640 }, // Low quality, max width 640px
  thumbnail: { quality: 60, maxWidth: 320 }, // Thumbnail, max width 320px
};

// Quality levels for videos
const VIDEO_QUALITY_LEVELS = {
  original: {}, // Original quality
  high: { resolution: '1080p', bitrate: '2M' }, // High quality (1080p)
  medium: { resolution: '720p', bitrate: '1M' }, // Medium quality (720p)
  low: { resolution: '480p', bitrate: '500k' }, // Low quality (480p)
  thumbnail: { resolution: '240p', bitrate: '250k' }, // Thumbnail quality (240p)
};

// Resolution mapping for videos
const RESOLUTION_MAPPING = {
  '1080p': { width: 1920, height: 1080 },
  '720p': { width: 1280, height: 720 },
  '480p': { width: 854, height: 480 },
  '240p': { width: 426, height: 240 },
};

/**
 * Process an image to create multiple quality versions
 * @param buffer The original image buffer
 * @param fileName The original file name
 * @returns Object with URLs for each quality level
 */
export async function processImage(buffer: Buffer, fileName: string): Promise<{
  original: string;
  high: string;
  medium: string;
  low: string;
  thumbnail: string;
}> {
  debug.log(`MediaProcessing: Processing image ${fileName} to multiple qualities`);

  try {
    // Store the original image
    const originalUrl = await storeFile(buffer, fileName);
    debug.log(`MediaProcessing: Original image stored at ${originalUrl}`);

    // Get file extension
    const ext = path.extname(fileName).toLowerCase();
    const baseName = path.basename(fileName, ext);

    // Initialize processed URLs with the original
    const processedUrls: any = {
      original: originalUrl,
      high: originalUrl,
      medium: originalUrl,
      low: originalUrl,
      thumbnail: originalUrl
    };

    try {
      // Check if Sharp is working properly
      await sharp(buffer).metadata();

      // Process each quality level
      for (const [quality, options] of Object.entries(IMAGE_QUALITY_LEVELS)) {
        if (quality === 'original') continue; // Skip original, already stored

        debug.log(`MediaProcessing: Processing ${quality} quality version`);

        try {
          // Create a Sharp instance for processing
          let sharpInstance = sharp(buffer);

          // Resize if maxWidth is specified
          if ('maxWidth' in options && options.maxWidth) {
            sharpInstance = sharpInstance.resize({
              width: options.maxWidth,
              withoutEnlargement: true,
            });
          }

          // Convert to WebP for better compression
          const processedBuffer = await sharpInstance
            .webp({ quality: options.quality })
            .toBuffer();

          // Store the processed image
          const qualityFileName = `${baseName}_${quality}.webp`;
          const qualityUrl = await storeFile(processedBuffer, qualityFileName);

          processedUrls[quality] = qualityUrl;
          debug.log(`MediaProcessing: ${quality} quality stored at ${qualityUrl}`);
        } catch (qualityError) {
          debug.error(`MediaProcessing: Error processing ${quality} quality:`, qualityError);
          // If there's an error, use the original URL as fallback
          processedUrls[quality] = originalUrl;
        }
      }
    } catch (sharpError) {
      debug.error('MediaProcessing: Error with Sharp library:', sharpError);
      debug.log('MediaProcessing: Using original image for all qualities');
      // If Sharp is not working, use the original URL for all qualities
    }

    return processedUrls as {
      original: string;
      high: string;
      medium: string;
      low: string;
      thumbnail: string;
    };
  } catch (error) {
    debug.error('MediaProcessing: Error processing image:', error);
    throw new Error(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

      ffmpeg.on('close', (code) => {
        resolve(code === 0);
      });

      // Set a timeout in case the process hangs
      setTimeout(() => {
        resolve(false);
      }, 2000);
    });
  } catch (error) {
    debug.error('Error checking for FFmpeg:', error);
    return false;
  }
}

/**
 * Process a video to create multiple quality versions
 * @param buffer The original video buffer
 * @param fileName The original file name
 * @returns Object with URLs for each quality level and a thumbnail
 */
export async function processVideo(buffer: Buffer, fileName: string): Promise<{
  original: string;
  high: string;
  medium: string;
  low: string;
  thumbnail: string;
  poster: string;
}> {
  debug.log(`MediaProcessing: Processing video ${fileName} to multiple qualities`);

  try {
    // Store the original video
    const originalUrl = await storeFile(buffer, fileName);
    debug.log(`MediaProcessing: Original video stored at ${originalUrl}`);

    // Get file extension
    const ext = path.extname(fileName).toLowerCase();
    const baseName = path.basename(fileName, ext);
    const originalFilePath = path.join(UPLOAD_DIR, path.basename(originalUrl));

    // Create a temporary file for the original video if it doesn't exist
    if (!fs.existsSync(originalFilePath)) {
      fs.writeFileSync(originalFilePath, buffer);
    }

    // Initialize processed URLs with the original
    const processedUrls: any = {
      original: originalUrl,
      high: originalUrl,
      medium: originalUrl,
      low: originalUrl,
      thumbnail: originalUrl
    };

    // Check if FFmpeg is available
    const ffmpegAvailable = await isFFmpegAvailable();

    if (ffmpegAvailable) {
      debug.log('MediaProcessing: FFmpeg is available, processing video into multiple qualities');

      // Process each quality level
      for (const [quality, options] of Object.entries(VIDEO_QUALITY_LEVELS)) {
        if (quality === 'original') continue; // Skip original, already stored

        if (!('resolution' in options)) continue;

        debug.log(`MediaProcessing: Processing ${quality} quality version`);

        const resolution = options.resolution as keyof typeof RESOLUTION_MAPPING;
        const { width, height } = RESOLUTION_MAPPING[resolution];
        const bitrate = options.bitrate;

        const outputFileName = `${baseName}_${quality}.mp4`;
        const outputFilePath = path.join(UPLOAD_DIR, outputFileName);

        try {
          // Use FFmpeg to transcode the video
          await new Promise<void>((resolve, reject) => {
            const ffmpeg = spawn('ffmpeg', [
              '-i', originalFilePath,
              '-c:v', 'libx264',
              '-preset', 'medium',
              '-b:v', bitrate,
              '-maxrate', bitrate,
              '-bufsize', bitrate,
              '-vf', `scale=${width}:${height}`,
              '-c:a', 'aac',
              '-b:a', '128k',
              '-movflags', '+faststart',
              '-y', // Overwrite output file if it exists
              outputFilePath
            ]);

            ffmpeg.on('close', (code) => {
              if (code === 0) {
                debug.log(`MediaProcessing: Successfully transcoded ${quality} version`);
                resolve();
              } else {
                debug.error(`MediaProcessing: FFmpeg process exited with code ${code}`);
                reject(new Error(`FFmpeg process exited with code ${code}`));
              }
            });

            ffmpeg.stderr.on('data', (data) => {
              // FFmpeg logs to stderr by default
              debug.log(`FFmpeg: ${data.toString()}`);
            });
          });

          // Add the URL to the processed URLs
          processedUrls[quality] = `/uploads/${outputFileName}`;
          debug.log(`MediaProcessing: ${quality} quality stored at ${processedUrls[quality]}`);
        } catch (error) {
          debug.error(`MediaProcessing: Error processing ${quality} version:`, error);
          // If there's an error, use the original URL as fallback
          processedUrls[quality] = originalUrl;
        }
      }

      // Generate a poster image (thumbnail) for the video
      try {
        const posterFileName = `${baseName}_poster.jpg`;
        const posterFilePath = path.join(UPLOAD_DIR, posterFileName);

        await new Promise<void>((resolve, reject) => {
          const ffmpeg = spawn('ffmpeg', [
            '-i', originalFilePath,
            '-ss', '00:00:01', // Take frame at 1 second
            '-frames:v', '1',
            '-q:v', '2',
            '-y',
            posterFilePath
          ]);

          ffmpeg.on('close', (code) => {
            if (code === 0) {
              debug.log(`MediaProcessing: Successfully generated poster image`);
              resolve();
            } else {
              debug.error(`MediaProcessing: FFmpeg process exited with code ${code}`);
              reject(new Error(`FFmpeg process exited with code ${code}`));
            }
          });
        });

        processedUrls.poster = `/uploads/${posterFileName}`;
        debug.log(`MediaProcessing: Poster image stored at ${processedUrls.poster}`);
      } catch (error) {
        debug.error('MediaProcessing: Error generating poster image:', error);
        // Use the original URL as the poster if there's an error
        processedUrls.poster = originalUrl;
      }
    } else {
      debug.log('MediaProcessing: FFmpeg is not available, using original video for all qualities');
      // If FFmpeg is not available, use the original URL for all qualities
      processedUrls.poster = originalUrl;
    }

    return processedUrls as {
      original: string;
      high: string;
      medium: string;
      low: string;
      thumbnail: string;
      poster: string;
    };
  } catch (error) {
    debug.error('MediaProcessing: Error processing video:', error);
    throw new Error(`Failed to process video: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Process media (image or video) to create multiple quality versions
 * @param buffer The original media buffer
 * @param fileName The original file name
 * @param fileType The media type ('image' or 'video')
 * @returns Object with URLs for each quality level
 */
export async function processMedia(
  buffer: Buffer,
  fileName: string,
  fileType: 'image' | 'video'
): Promise<{
  original: string;
  high: string;
  medium: string;
  low: string;
  thumbnail: string;
  poster?: string;
}> {
  if (fileType === 'image') {
    return processImage(buffer, fileName);
  } else {
    return processVideo(buffer, fileName);
  }
}
