import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import sharp from 'sharp';

import debug from "@/lib/debug";

/**
 * Base directory for file storage
 * Files are stored in the public/uploads directory relative to the project root
 */
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const ORIGINAL_DIR = path.join(UPLOAD_DIR, 'original');
const STICKERED_DIR = path.join(UPLOAD_DIR, 'stickered');
const AVATAR_DIR = path.join(UPLOAD_DIR, 'avatars');
const POST_DIR = path.join(UPLOAD_DIR, 'posts');
const STICKER_DIR = path.join(UPLOAD_DIR, 'stickers');
const THUMBNAIL_DIR = path.join(UPLOAD_DIR, 'thumbnails');

/**
 * Function to ensure upload directory exists
 * Creates the directory if it doesn't exist
 */
export function ensureUploadDirectories() {
  try {
    // List of directories to create
    const directories = [
      UPLOAD_DIR,
      ORIGINAL_DIR,
      STICKERED_DIR,
      AVATAR_DIR,
      POST_DIR,
      STICKER_DIR,
      THUMBNAIL_DIR
    ];

    // Create all directories
    for (const dir of directories) {
      debug.log(`FileStorage: Checking if directory exists at ${dir}`);
      if (!fs.existsSync(dir)) {
        debug.log(`FileStorage: Directory does not exist, creating it: ${dir}`);
        try {
          fs.mkdirSync(dir, { recursive: true });
          debug.log(`FileStorage: Directory created successfully: ${dir}`);

          // Verify the directory was actually created
          if (!fs.existsSync(dir)) {
            debug.error(`FileStorage: Directory was not created despite no error: ${dir}`);
            throw new Error(`Failed to create directory: ${dir}`);
          }
        } catch (mkdirError) {
          debug.error(`FileStorage: Error creating directory ${dir}:`, mkdirError);
          throw new Error(`Failed to create directory ${dir}: ${mkdirError instanceof Error ? mkdirError.message : 'Unknown error'}`);
        }
      } else {
        debug.log(`FileStorage: Directory already exists: ${dir}`);

        // Check if the directory is actually a directory and not a file
        try {
          const stats = fs.statSync(dir);
          if (!stats.isDirectory()) {
            debug.error(`FileStorage: Path exists but is not a directory: ${dir}`);
            throw new Error(`Path exists but is not a directory: ${dir}`);
          }
        } catch (statError) {
          debug.error(`FileStorage: Error checking directory status for ${dir}:`, statError);
          throw new Error(`Error checking directory status: ${statError instanceof Error ? statError.message : 'Unknown error'}`);
        }
      }
    }

    // Verify each directory is writable
    for (const dir of directories) {
      try {
        const testFile = path.join(dir, '.write-test');
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        debug.log(`FileStorage: Directory is writable: ${dir}`);
      } catch (writeError) {
        debug.error(`FileStorage: Directory is not writable: ${dir}`, writeError);
        throw new Error(`Directory is not writable: ${dir}`);
      }
    }
  } catch (error) {
    debug.error('FileStorage: Failed to create or verify upload directory:', error);
    throw new Error(`Failed to create upload directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Ensure directory exists on module load
ensureUploadDirectories();

/**
 * Generate a unique filename to prevent collisions
 * Uses UUID to ensure uniqueness while preserving the original file extension
 * @param originalFilename The original filename
 * @returns A unique filename with the same extension
 */
export function generateFilename(originalFilename: string): string {
  const extension = path.extname(originalFilename);
  const uuid = randomUUID();
  return `${uuid}${extension}`;
}

/**
 * Validate file signature matches the expected file type
 * @param signature The first 16 bytes of the file
 * @param extension The file extension
 * @returns True if the signature matches the extension
 */
function isValidFileSignature(signature: Buffer, extension: string): boolean {
  const ext = extension.toLowerCase();

  debug.log(`FileStorage: Validating signature for extension: ${ext}`);
  debug.log(`FileStorage: First 16 bytes: ${Array.from(signature.slice(0, 16)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(', ')}`);

  // Special handling for WebP files
  if (ext === '.webp') {
    // WebP files start with "RIFF" (0x52494646) followed by file size, then "WEBP" (0x57454250)
    const riffHeader = [0x52, 0x49, 0x46, 0x46]; // "RIFF"
    const webpHeader = [0x57, 0x45, 0x42, 0x50]; // "WEBP" at offset 8

    // Check RIFF header
    for (let i = 0; i < riffHeader.length; i++) {
      if (signature[i] !== riffHeader[i]) {
        debug.error(`FileStorage: WebP RIFF header mismatch at byte ${i}. Expected: 0x${riffHeader[i].toString(16)}, Got: 0x${signature[i].toString(16)}`);
        return false;
      }
    }

    // Check WEBP header at offset 8 (if we have enough bytes)
    if (signature.length >= 12) {
      for (let i = 0; i < webpHeader.length; i++) {
        if (signature[8 + i] !== webpHeader[i]) {
          debug.error(`FileStorage: WebP format header mismatch at byte ${8 + i}. Expected: 0x${webpHeader[i].toString(16)}, Got: 0x${signature[8 + i].toString(16)}`);
          return false;
        }
      }
    }

    debug.log(`FileStorage: WebP signature validation passed`);
    return true;
  }

  // Common file signatures (magic numbers) for other formats
  const signatures = {
    '.jpg': [0xFF, 0xD8, 0xFF],
    '.jpeg': [0xFF, 0xD8, 0xFF],
    '.png': [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
    '.gif': [0x47, 0x49, 0x46, 0x38],
    '.mp4': [0x00, 0x00, 0x00], // ftyp box (partial)
    '.webm': [0x1A, 0x45, 0xDF, 0xA3], // EBML header
    '.mov': [0x00, 0x00, 0x00], // QuickTime (partial)
  };

  const expectedSignature = signatures[ext as keyof typeof signatures];
  if (!expectedSignature) {
    debug.warn(`FileStorage: Unknown file extension for signature validation: ${ext}`);
    return true; // Allow unknown extensions to pass through for now
  }

  // Check if the file signature matches
  for (let i = 0; i < expectedSignature.length; i++) {
    if (signature[i] !== expectedSignature[i]) {
      debug.error(`FileStorage: File signature mismatch for ${ext}. Expected: ${expectedSignature}, Got: ${Array.from(signature.slice(0, expectedSignature.length))}`);
      return false;
    }
  }

  debug.log(`FileStorage: File signature validation passed for ${ext}`);
  return true;
}

/**
 * Securely store a file in the uploads directory with comprehensive validation
 * @param buffer The file content as a Buffer
 * @param filename The original filename
 * @param folder The folder to store the file in ('original', 'stickered', or undefined for the root uploads directory)
 * @returns The public URL path to the stored file
 */
export async function storeFile(
  buffer: Buffer,
  filename: string,
  folder?: 'original' | 'stickered' | 'avatars' | 'posts' | 'stickers' | 'thumbnails'
): Promise<string> {
  debug.log(`FileStorage: Storing file with name: ${filename}${folder ? ` in ${folder} folder` : ''}`);

  // Enhanced security validation
  if (!buffer || buffer.length === 0) {
    debug.error('FileStorage: Empty buffer provided');
    throw new Error('Empty buffer provided');
  }

  // Check file size limits
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  if (buffer.length > MAX_FILE_SIZE) {
    debug.error(`FileStorage: File too large: ${buffer.length} bytes`);
    throw new Error('File size exceeds maximum allowed size');
  }

  debug.log(`FileStorage: Buffer size: ${buffer.length} bytes`);

  // Sanitize filename
  if (!filename || filename.trim() === '') {
    filename = `file_${Date.now()}`;
    debug.log(`FileStorage: No filename provided, using generated name: ${filename}`);
  }

  // Remove dangerous characters from filename
  filename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Prevent path traversal attacks
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    debug.error(`FileStorage: Dangerous filename detected: ${filename}`);
    throw new Error('Invalid filename');
  }

  // Validate file extension
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.webm', '.mov'];
  const extension = path.extname(filename).toLowerCase();
  if (!allowedExtensions.includes(extension)) {
    debug.error(`FileStorage: Invalid file extension: ${extension}`);
    throw new Error('Invalid file type');
  }

  // Validate file content matches extension (basic MIME type check)
  const fileSignature = buffer.slice(0, 16);
  debug.log(`FileStorage: Validating file signature for extension: ${extension}`);
  debug.log(`FileStorage: File signature bytes: ${Array.from(fileSignature.slice(0, 8)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(', ')}`);

  if (!isValidFileSignature(fileSignature, extension)) {
    debug.error(`FileStorage: File signature doesn't match extension ${extension}`);
    debug.error(`FileStorage: Expected signature validation failed`);
    throw new Error(`File content does not match file extension ${extension}`);
  }

  const uniqueFilename = generateFilename(filename);

  // Determine the directory to store the file in
  let storageDir = UPLOAD_DIR;
  let urlPrefix = '/uploads';

  if (folder === 'original') {
    storageDir = ORIGINAL_DIR;
    urlPrefix = '/uploads/original';
  } else if (folder === 'stickered') {
    storageDir = STICKERED_DIR;
    urlPrefix = '/uploads/stickered';
  } else if (folder === 'avatars') {
    storageDir = AVATAR_DIR;
    urlPrefix = '/uploads/avatars';
  } else if (folder === 'posts') {
    storageDir = POST_DIR;
    urlPrefix = '/uploads/posts';
  } else if (folder === 'stickers') {
    storageDir = STICKER_DIR;
    urlPrefix = '/uploads/stickers';
  } else if (folder === 'thumbnails') {
    storageDir = THUMBNAIL_DIR;
    urlPrefix = '/uploads/thumbnails';
  }

  const filePath = path.join(storageDir, uniqueFilename);
  debug.log(`FileStorage: Generated unique filename: ${uniqueFilename}`);
  debug.log(`FileStorage: Full file path: ${filePath}`);

  try {
    // Ensure the directory exists
    debug.log(`FileStorage: Ensuring directory exists for ${storageDir}`);
    ensureUploadDirectories();

    // Double-check that the specific directory exists
    if (!fs.existsSync(storageDir)) {
      debug.log(`FileStorage: Directory still doesn't exist after ensureUploadDirectories, creating it directly: ${storageDir}`);
      try {
        fs.mkdirSync(storageDir, { recursive: true });
        debug.log(`FileStorage: Successfully created directory: ${storageDir}`);
      } catch (mkdirError) {
        debug.error(`FileStorage: Failed to create directory ${storageDir}:`, mkdirError);
        throw new Error(`Failed to create upload directory: ${mkdirError instanceof Error ? mkdirError.message : 'Unknown error'}`);
      }
    }

    // Verify directory permissions
    try {
      fs.accessSync(storageDir, fs.constants.W_OK);
      debug.log(`FileStorage: Directory ${storageDir} is writable`);
    } catch (accessError) {
      debug.error(`FileStorage: Directory ${storageDir} is not writable:`, accessError);
      throw new Error(`Upload directory is not writable: ${storageDir}`);
    }

    // Write the file
    debug.log(`FileStorage: Writing file to disk at ${filePath}`);
    try {
      await fs.promises.writeFile(filePath, buffer);
      debug.log(`FileStorage: File written successfully to ${filePath}`);
    } catch (writeError) {
      debug.error(`FileStorage: Error writing file to ${filePath}:`, writeError);
      throw new Error(`Failed to write file: ${writeError instanceof Error ? writeError.message : 'Unknown error'}`);
    }

    // Verify the file was written
    debug.log(`FileStorage: Verifying file was written correctly to ${filePath}`);
    let stats;
    try {
      stats = await fs.promises.stat(filePath);
      debug.log(`FileStorage: File stats for ${filePath} - size: ${stats.size} bytes`);
    } catch (statError) {
      debug.error(`FileStorage: Error getting file stats for ${filePath}:`, statError);
      throw new Error(`Failed to verify file was written to ${filePath}`);
    }

    if (stats.size === 0) {
      debug.error(`FileStorage: File was written to ${filePath} but is empty`);
      throw new Error(`File was written to ${filePath} but is empty`);
    }

    // Try to read the file to make sure it's accessible
    try {
      const testRead = await fs.promises.readFile(filePath);
      debug.log(`FileStorage: Successfully read file from ${filePath}, size: ${testRead.length} bytes`);
    } catch (readError) {
      debug.error(`FileStorage: Error reading back file from ${filePath}:`, readError);
      // Don't throw here, just log the error as a warning
    }

    // Return the public URL for the file
    const fileUrl = `${urlPrefix}/${uniqueFilename}`;
    debug.log(`FileStorage: File stored successfully, public URL: ${fileUrl}`);
    return fileUrl;
  } catch (error) {
    // Handle file storage errors
    debug.error('FileStorage: Error storing file:', error);
    throw new Error(`Failed to store file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Store a stickered file with the same filename as the original
 * @param buffer The file content as a Buffer
 * @param originalUrl The original file URL (from /uploads/original/)
 * @returns The public URL path to the stored stickered file
 */
export async function storeStickeredFile(
  buffer: Buffer,
  originalUrl: string
): Promise<string> {
  debug.log(`FileStorage: Storing stickered file for original URL: ${originalUrl}`);

  // Validate inputs
  if (!buffer || buffer.length === 0) {
    debug.error('FileStorage: Empty buffer provided');
    throw new Error('Empty buffer provided');
  }
  debug.log(`FileStorage: Buffer size: ${buffer.length} bytes`);

  if (!originalUrl || !originalUrl.startsWith('/uploads/original/')) {
    debug.error(`FileStorage: Invalid original URL: ${originalUrl}`);
    throw new Error('Invalid original URL');
  }

  // Extract the filename from the original URL
  const filename = path.basename(originalUrl);
  debug.log(`FileStorage: Extracted filename from original URL: ${filename}`);

  // Determine the directory to store the file in
  const storageDir = STICKERED_DIR;
  const urlPrefix = '/uploads/stickered';

  const filePath = path.join(storageDir, filename);
  debug.log(`FileStorage: Using same filename for stickered file: ${filename}`);
  debug.log(`FileStorage: Full file path: ${filePath}`);

  try {
    // Ensure the directory exists
    debug.log(`FileStorage: Ensuring directory exists for ${storageDir}`);
    ensureUploadDirectories();

    // Double-check that the specific directory exists
    if (!fs.existsSync(storageDir)) {
      debug.log(`FileStorage: Directory still doesn't exist after ensureUploadDirectories, creating it directly: ${storageDir}`);
      fs.mkdirSync(storageDir, { recursive: true });
    }

    // Write the file
    debug.log(`FileStorage: Writing stickered file to disk at ${filePath}`);
    try {
      await fs.promises.writeFile(filePath, buffer);
      debug.log(`FileStorage: Stickered file written successfully to ${filePath}`);
    } catch (writeError) {
      debug.error(`FileStorage: Error writing stickered file to ${filePath}:`, writeError);
      throw new Error(`Failed to write stickered file: ${writeError instanceof Error ? writeError.message : 'Unknown error'}`);
    }

    // Verify the file was written
    debug.log(`FileStorage: Verifying stickered file was written correctly to ${filePath}`);
    let stats;
    try {
      stats = await fs.promises.stat(filePath);
      debug.log(`FileStorage: Stickered file stats for ${filePath} - size: ${stats.size} bytes`);
    } catch (statError) {
      debug.error(`FileStorage: Error getting stickered file stats for ${filePath}:`, statError);
      throw new Error(`Failed to verify stickered file was written to ${filePath}`);
    }

    if (stats.size === 0) {
      debug.error(`FileStorage: Stickered file was written to ${filePath} but is empty`);
      throw new Error(`Stickered file was written to ${filePath} but is empty`);
    }

    // Return the public URL for the stickered file
    const fileUrl = `${urlPrefix}/${filename}`;
    debug.log(`FileStorage: Stickered file stored successfully, public URL: ${fileUrl}`);
    return fileUrl;
  } catch (error) {
    // Handle file storage errors
    debug.error('FileStorage: Error storing stickered file:', error);
    throw new Error(`Failed to store stickered file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete a file from the uploads directory
 * @param fileUrl The public URL path of the file to delete
 */
export async function deleteFile(fileUrl: string): Promise<void> {
  if (!fileUrl.startsWith('/uploads/')) {
    throw new Error('Invalid file URL');
  }

  let storageDir = UPLOAD_DIR;
  let fileName = '';

  if (fileUrl.startsWith('/uploads/original/')) {
    storageDir = ORIGINAL_DIR;
    fileName = fileUrl.replace('/uploads/original/', '');
  } else if (fileUrl.startsWith('/uploads/stickered/')) {
    storageDir = STICKERED_DIR;
    fileName = fileUrl.replace('/uploads/stickered/', '');
  } else if (fileUrl.startsWith('/uploads/avatars/')) {
    storageDir = AVATAR_DIR;
    fileName = fileUrl.replace('/uploads/avatars/', '');
  } else if (fileUrl.startsWith('/uploads/posts/')) {
    storageDir = POST_DIR;
    fileName = fileUrl.replace('/uploads/posts/', '');
  } else if (fileUrl.startsWith('/uploads/stickers/')) {
    storageDir = STICKER_DIR;
    fileName = fileUrl.replace('/uploads/stickers/', '');
  } else if (fileUrl.startsWith('/uploads/thumbnails/')) {
    storageDir = THUMBNAIL_DIR;
    fileName = fileUrl.replace('/uploads/thumbnails/', '');
  } else {
    fileName = fileUrl.replace('/uploads/', '');
  }

  const filePath = path.join(storageDir, fileName);
  debug.log(`FileStorage: Attempting to delete file at ${filePath}`);

  if (fs.existsSync(filePath)) {
    await fs.promises.unlink(filePath);
    debug.log(`FileStorage: Successfully deleted file at ${filePath}`);
  } else {
    debug.log(`FileStorage: File not found at ${filePath}, nothing to delete`);
  }
}

/**
 * Get file type (image or video) based on mimetype
 * @param mimetype The MIME type of the file
 * @returns 'IMAGE' or 'VIDEO' based on the mimetype
 * @throws Error if the file type is not supported
 */
export function getFileType(mimetype: string): 'IMAGE' | 'VIDEO' {
  if (mimetype.startsWith('image/')) {
    return 'IMAGE';
  } else if (mimetype.startsWith('video/')) {
    return 'VIDEO';
  }
  throw new Error('Unsupported file type');
}

/**
 * Optimize an image for storage
 * @param buffer The original image buffer
 * @param options Options for optimization
 * @returns A buffer containing the optimized image
 */
export async function optimizeImage(
  buffer: Buffer,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'jpeg' | 'png' | 'webp';
  } = {}
): Promise<Buffer> {
  debug.log(`FileStorage: Starting image optimization with options:`, options);
  debug.log(`FileStorage: Input buffer size: ${buffer.length} bytes`);

  try {
    let image = sharp(buffer);

    // Resize if dimensions are provided
    if (options.width || options.height) {
      debug.log(`FileStorage: Resizing image to ${options.width}x${options.height}`);
      image = image.resize({
        width: options.width,
        height: options.height,
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Set format and quality
    const format = options.format || 'webp';
    const quality = options.quality || 80;
    debug.log(`FileStorage: Converting to format: ${format}, quality: ${quality}`);

    if (format === 'jpeg') {
      image = image.jpeg({ quality });
    } else if (format === 'png') {
      image = image.png({ quality });
    } else {
      image = image.webp({ quality });
    }

    const result = await image.toBuffer();
    debug.log(`FileStorage: Image optimization completed, output size: ${result.length} bytes`);
    return result;
  } catch (error) {
    debug.error('FileStorage: Error optimizing image:', error);
    debug.error('FileStorage: Falling back to original buffer');
    // Return the original buffer if optimization fails
    return buffer;
  }
}

/**
 * Create a thumbnail for an image
 * @param buffer The original image buffer
 * @param maxWidth The maximum width of the thumbnail
 * @returns A buffer containing the thumbnail image
 */
export async function createThumbnail(
  buffer: Buffer,
  maxWidth: number = 300
): Promise<Buffer> {
  return optimizeImage(buffer, {
    width: maxWidth,
    format: 'webp',
    quality: 70,
  });
}

/**
 * Store an avatar image
 * @param buffer The image buffer
 * @param filename The original filename
 * @returns The public URL path to the stored avatar
 */
export async function storeAvatar(buffer: Buffer, filename: string): Promise<string> {
  debug.log(`FileStorage: Starting avatar optimization for file: ${filename}`);
  debug.log(`FileStorage: Original buffer size: ${buffer.length} bytes`);

  // Optimize the avatar image
  const optimized = await optimizeImage(buffer, {
    width: 300,
    height: 300,
    format: 'webp',
    quality: 85,
  });

  debug.log(`FileStorage: Avatar optimized, new size: ${optimized.length} bytes`);
  debug.log(`FileStorage: Optimized WebP signature: ${Array.from(optimized.slice(0, 16)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(', ')}`);

  // Store the optimized image
  const webpFilename = filename.replace(/\.[^/.]+$/, '.webp');
  debug.log(`FileStorage: Storing avatar as: ${webpFilename}`);

  return storeFile(optimized, webpFilename, 'avatars');
}

/**
 * Store a post image or video
 * @param buffer The file buffer
 * @param filename The original filename
 * @param fileType The type of file ('IMAGE' or 'VIDEO')
 * @returns The public URL path to the stored file
 */
export async function storePostMedia(
  buffer: Buffer,
  filename: string,
  fileType: 'IMAGE' | 'VIDEO'
): Promise<string> {
  if (fileType === 'IMAGE') {
    // Optimize the image
    const optimized = await optimizeImage(buffer, {
      width: 1920, // Max width for post images
      format: 'webp',
      quality: 85,
    });

    // Store the optimized image
    return storeFile(optimized, filename.replace(/\.[^/.]+$/, '.webp'), 'posts');
  } else {
    // For videos, store as-is
    return storeFile(buffer, filename, 'posts');
  }
}

/**
 * Store a sticker image
 * @param buffer The image buffer
 * @param filename The original filename
 * @returns The public URL path to the stored sticker
 */
export async function storeSticker(buffer: Buffer, filename: string): Promise<string> {
  debug.log(`FileStorage: storeSticker called with filename: ${filename}, buffer size: ${buffer.length} bytes`);

  try {
    // Ensure the stickers directory exists
    if (!fs.existsSync(STICKER_DIR)) {
      debug.log(`FileStorage: Creating stickers directory at ${STICKER_DIR}`);
      fs.mkdirSync(STICKER_DIR, { recursive: true });
    }

    // Optimize the sticker image
    debug.log('FileStorage: Optimizing sticker image');
    const optimized = await optimizeImage(buffer, {
      width: 500, // Max width for stickers
      format: 'png', // Using PNG instead of WebP for compatibility with canvas
      quality: 90,
    });
    debug.log(`FileStorage: Sticker optimized, new size: ${optimized.length} bytes`);

    // Store the optimized image
    debug.log('FileStorage: Storing optimized sticker');
    const fileUrl = await storeFile(optimized, filename.replace(/\.[^/.]+$/, '.png'), 'stickers');
    debug.log(`FileStorage: Sticker stored successfully at ${fileUrl}`);

    return fileUrl;
  } catch (error) {
    debug.error('FileStorage: Error in storeSticker:', error);
    throw error;
  }
}
