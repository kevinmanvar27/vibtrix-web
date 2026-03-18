import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api-auth';
import prisma from '@/lib/prisma';
import debug from '@/lib/debug';
import { processVideoToHLS, validateVideoFile } from '@/lib/video-processing';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST /api/media/upload-video
 * Upload and process video into HLS chunks for progressive streaming
 * 
 * This endpoint:
 * 1. Accepts video file upload
 * 2. Processes video into HLS chunks (like Instagram)
 * 3. Generates multiple quality levels (480p, 720p, 1080p)
 * 4. Creates thumbnail
 * 5. Stores all files and creates Media record
 * 
 * Request: multipart/form-data with 'video' field
 * Returns: Media object with HLS URLs
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    debug.log(`Video upload request from user: ${user.id}`);

    // Parse form data
    const formData = await req.formData();
    const videoFile = formData.get('video') as File;

    if (!videoFile) {
      return NextResponse.json(
        { error: 'No video file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!videoFile.type.startsWith('video/')) {
      return NextResponse.json(
        { error: 'File must be a video' },
        { status: 400 }
      );
    }

    debug.log(`Processing video: ${videoFile.name} (${videoFile.size} bytes)`);

    // Generate unique video ID
    const videoId = uuidv4();
    
    // Create temporary directory for processing
    const tempDir = path.join(process.cwd(), 'temp', videoId);
    await mkdir(tempDir, { recursive: true });
    
    // Save uploaded file temporarily
    const tempVideoPath = path.join(tempDir, 'original.mp4');
    const videoBuffer = Buffer.from(await videoFile.arrayBuffer());
    await writeFile(tempVideoPath, videoBuffer);

    debug.log(`Saved temporary file: ${tempVideoPath}`);

    // Validate video file
    const isValid = await validateVideoFile(tempVideoPath);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid video file' },
        { status: 400 }
      );
    }

    // Create output directory for HLS files
    const outputDir = path.join(process.cwd(), 'public', 'videos', videoId);
    await mkdir(outputDir, { recursive: true });

    debug.log(`Processing video to HLS chunks...`);

    // Process video into HLS chunks
    const result = await processVideoToHLS({
      inputPath: tempVideoPath,
      outputDir: outputDir,
    });

    debug.log(`Video processing complete:`, result);

    // Construct URLs for the processed video
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const videoBaseUrl = `${baseUrl}/videos/${videoId}`;

    // Create Media record in database
    const media = await prisma.media.create({
      data: {
        type: 'VIDEO',
        url: `${videoBaseUrl}/${result.masterPlaylistUrl}`, // Master HLS playlist
        urlHigh: result.qualities.find(q => q.quality === 'high')
          ? `${videoBaseUrl}/${result.qualities.find(q => q.quality === 'high')?.playlistUrl}`
          : null,
        urlMedium: result.qualities.find(q => q.quality === 'medium')
          ? `${videoBaseUrl}/${result.qualities.find(q => q.quality === 'medium')?.playlistUrl}`
          : null,
        urlLow: result.qualities.find(q => q.quality === 'low')
          ? `${videoBaseUrl}/${result.qualities.find(q => q.quality === 'low')?.playlistUrl}`
          : null,
        urlThumbnail: `${videoBaseUrl}/${result.thumbnailUrl}`,
        width: result.width,
        height: result.height,
        duration: result.duration,
        size: videoFile.size,
      },
    });

    debug.log(`Created media record: ${media.id}`);

    // Clean up temporary files
    // Note: Keep the processed HLS files in public/videos
    const fs = require('fs/promises');
    await fs.rm(tempDir, { recursive: true, force: true });

    debug.log(`✓ Video upload complete: ${media.id}`);

    return NextResponse.json({
      success: true,
      media: {
        id: media.id,
        type: media.type,
        url: media.url,
        urlHigh: media.urlHigh,
        urlMedium: media.urlMedium,
        urlLow: media.urlLow,
        urlThumbnail: media.urlThumbnail,
        width: media.width,
        height: media.height,
        duration: media.duration,
        qualities: result.qualities,
      },
    }, { status: 201 });

  } catch (error) {
    debug.error('Error uploading video:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload video',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/media/upload-video
 * Check if video upload endpoint is available
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/media/upload-video',
    method: 'POST',
    description: 'Upload video and process into HLS chunks for progressive streaming',
    contentType: 'multipart/form-data',
    field: 'video',
    maxSize: '500MB',
  });
}
