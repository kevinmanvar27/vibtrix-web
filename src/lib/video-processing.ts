/**
 * Video Processing Library for HLS Streaming
 * Converts uploaded videos into HLS chunks for progressive streaming
 * Similar to Instagram's video streaming approach
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import debug from './debug';

// Use the installed FFmpeg binaries
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;

const execAsync = promisify(exec);

export interface VideoProcessingOptions {
  inputPath: string;
  outputDir: string;
  qualities?: VideoQuality[];
}

export interface VideoQuality {
  name: string;
  width: number;
  height: number;
  bitrate: string;
}

export interface ProcessedVideoResult {
  masterPlaylistUrl: string;
  qualities: {
    quality: string;
    playlistUrl: string;
    resolution: string;
  }[];
  thumbnailUrl: string;
  duration: number;
  width: number;
  height: number;
}

// Default video qualities (similar to Instagram)
const DEFAULT_QUALITIES: VideoQuality[] = [
  { name: 'low', width: 480, height: 854, bitrate: '500k' },      // 480p
  { name: 'medium', width: 720, height: 1280, bitrate: '1500k' }, // 720p
  { name: 'high', width: 1080, height: 1920, bitrate: '3000k' },  // 1080p
];

/**
 * Check if FFmpeg is installed
 */
export async function checkFFmpegInstalled(): Promise<boolean> {
  try {
    await execAsync(`"${ffmpegPath}" -version`);
    return true;
  } catch (error) {
    debug.error('FFmpeg is not installed or not in PATH');
    return false;
  }
}

/**
 * Get video metadata (duration, dimensions)
 */
export async function getVideoMetadata(videoPath: string): Promise<{
  duration: number;
  width: number;
  height: number;
}> {
  try {
    debug.log(`[Metadata] Getting metadata for: ${videoPath}`);
    
    // Escape quotes in path for Windows compatibility
    const escapedPath = videoPath.replace(/"/g, '\\"');
    
    const command = `"${ffprobePath}" -v error -select_streams v:0 -show_entries stream=width,height,duration -of json "${escapedPath}"`;
    debug.log(`[Metadata] Running command: ${command}`);
    
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr) {
      debug.log(`[Metadata] FFprobe stderr:`, stderr);
    }
    
    debug.log(`[Metadata] FFprobe output:`, stdout);
    
    const data = JSON.parse(stdout);
    
    if (!data.streams || data.streams.length === 0) {
      throw new Error('No video stream found in file');
    }
    
    const stream = data.streams[0];
    
    const result = {
      duration: parseFloat(stream.duration || 0),
      width: parseInt(stream.width || 0),
      height: parseInt(stream.height || 0),
    };
    
    debug.log(`[Metadata] Extracted metadata:`, result);
    
    return result;
  } catch (error) {
    debug.error('[Metadata] Error getting video metadata:', error);
    debug.error('[Metadata] Error details:', error instanceof Error ? error.message : String(error));
    throw new Error(`Failed to get video metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate video thumbnail
 */
export async function generateThumbnail(
  videoPath: string,
  outputPath: string,
  timeOffset: number = 1
): Promise<string> {
  try {
    // Create output directory if it doesn't exist
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    
    // Generate thumbnail at specified time offset
    await execAsync(
      `"${ffmpegPath}" -i "${videoPath}" -ss ${timeOffset} -vframes 1 -vf "scale=480:-1" "${outputPath}"`
    );
    
    debug.log(`Generated thumbnail: ${outputPath}`);
    return outputPath;
  } catch (error) {
    debug.error('Error generating thumbnail:', error);
    throw new Error('Failed to generate thumbnail');
  }
}

/**
 * Process video into HLS chunks with multiple quality levels
 * This is the main function that converts videos like Instagram does
 */
export async function processVideoToHLS(
  options: VideoProcessingOptions
): Promise<ProcessedVideoResult> {
  const { inputPath, outputDir, qualities = DEFAULT_QUALITIES } = options;
  
  try {
    debug.log(`[HLS] Starting video processing: ${inputPath}`);
    
    // Check if FFmpeg is installed
    const ffmpegInstalled = await checkFFmpegInstalled();
    if (!ffmpegInstalled) {
      throw new Error('FFmpeg is required for video processing. Please install FFmpeg.');
    }
    debug.log(`[HLS] FFmpeg check passed`);
    
    // Create output directory
    await fs.mkdir(outputDir, { recursive: true });
    debug.log(`[HLS] Output directory created: ${outputDir}`);
    
    // Get video metadata with timeout
    debug.log(`[HLS] Getting video metadata...`);
    const metadata = await Promise.race([
      getVideoMetadata(inputPath),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Metadata extraction timeout')), 30000)
      )
    ]);
    debug.log(`[HLS] Video metadata:`, metadata);
    
    // Generate thumbnail
    debug.log(`[HLS] Generating thumbnail...`);
    const thumbnailPath = path.join(outputDir, 'thumbnail.jpg');
    try {
      await Promise.race([
        generateThumbnail(inputPath, thumbnailPath),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Thumbnail generation timeout')), 30000)
        )
      ]);
      debug.log(`[HLS] Thumbnail generated successfully`);
    } catch (thumbError) {
      debug.error(`[HLS] Thumbnail generation failed:`, thumbError);
      // Continue without thumbnail
    }
    
    // Filter qualities based on source video resolution
    const applicableQualities = qualities.filter(q => 
      q.height <= metadata.height && q.width <= metadata.width
    );
    
    // Always include at least one quality (the lowest)
    if (applicableQualities.length === 0) {
      applicableQualities.push(qualities[0]);
    }
    
    debug.log(`Processing ${applicableQualities.length} quality levels`);
    
    // Process each quality level
    const processedQualities = [];
    
    for (const quality of applicableQualities) {
      const qualityDir = path.join(outputDir, quality.name);
      await fs.mkdir(qualityDir, { recursive: true });
      
      const playlistPath = path.join(qualityDir, 'playlist.m3u8');
      const segmentPattern = path.join(qualityDir, 'segment_%03d.ts');
      
      // FFmpeg command to create HLS chunks
      // -hls_time 4: Each chunk is 4 seconds (Instagram uses 2-6 seconds)
      // -hls_list_size 0: Include all segments in playlist
      // -hls_segment_type mpegts: Use MPEG-TS format
      const ffmpegCommand = `"${ffmpegPath}" -i "${inputPath}" \
        -vf "scale=${quality.width}:${quality.height}" \
        -c:v libx264 \
        -b:v ${quality.bitrate} \
        -c:a aac \
        -b:a 128k \
        -f hls \
        -hls_time 4 \
        -hls_list_size 0 \
        -hls_segment_type mpegts \
        -hls_segment_filename "${segmentPattern}" \
        "${playlistPath}"`;
      
      debug.log(`[HLS] Processing ${quality.name} quality (${quality.width}x${quality.height})`);
      
      try {
        // Add timeout for each quality processing (2 minutes per quality)
        await Promise.race([
          execAsync(ffmpegCommand),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error(`${quality.name} quality processing timeout`)), 120000)
          )
        ]);
        
        processedQualities.push({
          quality: quality.name,
          playlistUrl: `${quality.name}/playlist.m3u8`,
          resolution: `${quality.width}x${quality.height}`,
        });
        
        debug.log(`[HLS] ✓ Completed ${quality.name} quality`);
      } catch (qualityError) {
        debug.error(`[HLS] Failed to process ${quality.name} quality:`, qualityError);
        // Continue with other qualities even if one fails
      }
    }
    
    // Create master playlist that references all quality levels
    if (processedQualities.length === 0) {
      throw new Error('Failed to process any quality levels');
    }
    
    const masterPlaylistPath = path.join(outputDir, 'master.m3u8');
    await createMasterPlaylist(masterPlaylistPath, processedQualities, applicableQualities);
    
    debug.log(`[HLS] ✓ Video processing complete: ${outputDir}`);
    debug.log(`[HLS] Processed ${processedQualities.length} quality levels`);
    
    return {
      masterPlaylistUrl: 'master.m3u8',
      qualities: processedQualities,
      thumbnailUrl: 'thumbnail.jpg',
      duration: metadata.duration,
      width: metadata.width,
      height: metadata.height,
    };
  } catch (error) {
    debug.error('[HLS] Error processing video to HLS:', error);
    debug.error('[HLS] Error details:', error instanceof Error ? error.message : String(error));
    debug.error('[HLS] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    throw error;
  }
}

/**
 * Create master playlist that references all quality variants
 */
async function createMasterPlaylist(
  outputPath: string,
  qualities: { quality: string; playlistUrl: string; resolution: string }[],
  qualityConfigs: VideoQuality[]
): Promise<void> {
  let masterPlaylist = '#EXTM3U\n#EXT-X-VERSION:3\n\n';
  
  for (let i = 0; i < qualities.length; i++) {
    const quality = qualities[i];
    const config = qualityConfigs[i];
    
    // Calculate bandwidth (bitrate in bits per second)
    const bandwidth = parseInt(config.bitrate.replace('k', '')) * 1000;
    
    masterPlaylist += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${quality.resolution}\n`;
    masterPlaylist += `${quality.playlistUrl}\n\n`;
  }
  
  await fs.writeFile(outputPath, masterPlaylist);
  debug.log(`Created master playlist: ${outputPath}`);
}

/**
 * Clean up temporary video files
 */
export async function cleanupVideoFiles(directory: string): Promise<void> {
  try {
    await fs.rm(directory, { recursive: true, force: true });
    debug.log(`Cleaned up video files: ${directory}`);
  } catch (error) {
    debug.error('Error cleaning up video files:', error);
  }
}

/**
 * Get HLS video URL for streaming
 */
export function getHLSVideoUrl(baseUrl: string, videoId: string): string {
  return `${baseUrl}/videos/${videoId}/master.m3u8`;
}

/**
 * Validate video file
 */
export async function validateVideoFile(filePath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(filePath);
    
    // Check file size (max 500MB)
    const maxSize = 500 * 1024 * 1024;
    if (stats.size > maxSize) {
      throw new Error('Video file too large (max 500MB)');
    }
    
    // Check if file is a valid video
    const metadata = await getVideoMetadata(filePath);
    if (!metadata.duration || metadata.duration <= 0) {
      throw new Error('Invalid video file');
    }
    
    return true;
  } catch (error) {
    debug.error('Video validation failed:', error);
    return false;
  }
}
