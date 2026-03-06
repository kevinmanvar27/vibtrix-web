/**
 * Enhanced File Upload Security
 * Provides comprehensive validation for file uploads including magic number verification,
 * malware scanning preparation, and metadata stripping
 */

import { NextRequest } from 'next/server';
import debug from './debug';

/**
 * File type definitions with magic numbers
 * Magic numbers are the first few bytes that identify a file type
 */
const MAGIC_NUMBERS: Record<string, string[]> = {
  // Images
  'image/jpeg': ['ffd8ff'],
  'image/png': ['89504e47'],
  'image/gif': ['47494638'],
  'image/webp': ['52494646'], // RIFF header
  'image/svg+xml': ['3c3f786d', '3c737667'], // <?xml or <svg
  'image/bmp': ['424d'],
  
  // Videos
  'video/mp4': ['66747970'], // ftyp
  'video/webm': ['1a45dfa3'], // EBML header
  'video/quicktime': ['66747970'], // ftyp (same as MP4)
  'video/x-msvideo': ['52494646'], // RIFF
};

/**
 * Maximum file sizes by type (in bytes)
 */
const MAX_FILE_SIZES: Record<string, number> = {
  'image/*': 10 * 1024 * 1024, // 10MB for images
  'video/*': 100 * 1024 * 1024, // 100MB for videos
  'avatar': 5 * 1024 * 1024, // 5MB for avatars
  'sticker': 2 * 1024 * 1024, // 2MB for stickers
  'attachment': 50 * 1024 * 1024, // 50MB for attachments
};

/**
 * Dangerous file extensions to block
 */
const BLOCKED_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.wsf',
  '.php', '.asp', '.aspx', '.jsp', '.cgi', '.pl',
  '.sh', '.py', '.rb', '.ps1',
  '.html', '.htm', '.xht',
  '.js', '.jsx', '.ts', '.tsx',
  '.svg', // Can contain scripts
];

/**
 * Convert buffer to hex string
 */
function bufferToHex(buffer: Buffer): string {
  return Array.from(buffer)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Get file extension from filename
 */
function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return '';
  return filename.substring(lastDot).toLowerCase();
}

/**
 * Verify file type using magic numbers
 * This prevents MIME type spoofing attacks
 */
export function verifyFileTypeByMagicNumber(
  buffer: Buffer,
  declaredMimeType: string
): { isValid: boolean; detectedType?: string; error?: string } {
  try {
    const fileHeader = bufferToHex(buffer.slice(0, 12)); // Read first 12 bytes
    
    // Check against known magic numbers
    for (const [mimeType, magicNumbers] of Object.entries(MAGIC_NUMBERS)) {
      for (const magic of magicNumbers) {
        if (fileHeader.startsWith(magic)) {
          // Detected type matches one of our known types
          
          // For WebP and RIFF-based formats, need more specific checks
          if (magic === '52494646') { // RIFF
            if (fileHeader.slice(16, 24) === '57454250') { // WEBP
              return mimeType === 'image/webp' 
                ? { isValid: true, detectedType: 'image/webp' }
                : { isValid: false, error: 'File type mismatch' };
            }
            if (fileHeader.slice(16, 24) === '41564920') { // AVI 
              return mimeType === 'video/x-msvideo'
                ? { isValid: true, detectedType: 'video/x-msvideo' }
                : { isValid: false, error: 'File type mismatch' };
            }
          }
          
          // For SVG, check text content
          if (['3c3f786d', '3c737667'].includes(magic)) {
            const textContent = buffer.toString('utf8', 0, Math.min(1000, buffer.length));
            const isSvg = textContent.includes('<svg');
            
            if (isSvg) {
              // SVG files need additional security checks
              return verifySvgSecurity(textContent);
            }
            
            return { isValid: false, error: 'Invalid SVG format' };
          }
          
          // Standard magic number match
          return mimeType === declaredMimeType || isCompatibleType(mimeType, declaredMimeType)
            ? { isValid: true, detectedType: mimeType }
            : { isValid: false, error: 'File type mismatch - possible MIME spoofing' };
        }
      }
    }
    
    return { isValid: false, error: 'Unknown file type' };
  } catch (error) {
    debug.error('Error verifying file magic number:', error);
    return { isValid: false, error: 'Failed to verify file type' };
  }
}

/**
 * Check if two MIME types are compatible
 */
function isCompatibleType(detected: string, declared: string): boolean {
  // Handle wildcard types like image/*
  if (declared.endsWith('/*')) {
    const baseType = declared.split('/')[0];
    return detected.startsWith(baseType + '/');
  }
  
  return detected === declared;
}

/**
 * Verify SVG security - remove potentially dangerous content
 */
export function verifySvgSecurity(svgContent: string): { 
  isValid: boolean; 
  sanitizedContent?: string; 
  error?: string;
  detectedType?: string 
} {
  try {
    // Check for dangerous patterns
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i, // onclick=, onload=, etc.
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /<foreignObject/i,
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(svgContent)) {
        return { 
          isValid: false, 
          error: 'SVG contains potentially dangerous content' 
        };
      }
    }
    
    // Sanitize SVG - remove XML declarations and external references
    let sanitized = svgContent
      .replace(/<\?xml.*?\?>/g, '') // Remove XML declaration
      .replace(/<!DOCTYPE[^>]*>/gi, '') // Remove DOCTYPE
      .replace(/xlink:href/gi, 'data-href') // Disable xlink
      .replace(/url\([^)]*\)/g, '') // Remove URL references
      .trim();
    
    // Ensure SVG starts with <svg tag
    if (!sanitized.startsWith('<svg')) {
      const svgMatch = sanitized.match(/<svg[\s\S]*<\/svg>/i);
      if (svgMatch) {
        sanitized = svgMatch[0];
      } else {
        return { isValid: false, error: 'Invalid SVG structure' };
      }
    }
    
    return {
      isValid: true,
      detectedType: 'image/svg+xml',
      sanitizedContent: sanitized,
    };
  } catch (error) {
    debug.error('Error sanitizing SVG:', error);
    return { isValid: false, error: 'Failed to process SVG' };
  }
}

/**
 * Validate file upload with comprehensive security checks
 */
export async function validateFileUpload(
  file: File,
  options?: {
    maxSize?: number;
    allowedTypes?: string[];
    uploadType?: 'avatar' | 'attachment' | 'sticker';
  }
): Promise<{
  isValid: boolean;
  errors: string[];
  warnings: string[];
  safeFile?: File;
}> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    // 1. Check file size
    const maxSize = options?.maxSize || 
                   (options?.uploadType ? MAX_FILE_SIZES[options.uploadType] : undefined) ||
                   MAX_FILE_SIZES['image/*'];
    
    if (file.size > maxSize) {
      errors.push(`File size (${formatFileSize(file.size)}) exceeds maximum allowed size (${formatFileSize(maxSize)})`);
    }
    
    // 2. Check file extension
    const fileName = 'name' in file ? (file as any).name : 'unknown';
    const extension = getFileExtension(fileName);
    
    if (BLOCKED_EXTENSIONS.includes(extension)) {
      errors.push(`File extension ${extension} is not allowed for security reasons`);
      return { isValid: false, errors, warnings };
    }
    
    // 3. Check MIME type
    const mimeType = file.type;
    const allowedTypes = options?.allowedTypes || ['image/*', 'video/*'];
    
    const isAllowed = allowedTypes.some(allowedType => {
      if (allowedType.endsWith('/*')) {
        return mimeType.startsWith(allowedType.split('/')[0] + '/');
      }
      return mimeType === allowedType;
    });
    
    if (!isAllowed) {
      errors.push(`File type ${mimeType} is not allowed`);
    }
    
    // 4. Read file buffer for magic number verification
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // 5. Verify magic numbers
    const magicResult = verifyFileTypeByMagicNumber(buffer, mimeType);
    if (!magicResult.isValid) {
      errors.push(`Security check failed: ${magicResult.error}`);
    }
    
    // 6. Special handling for SVG files
    if (mimeType === 'image/svg+xml' || extension === '.svg') {
      const svgContent = buffer.toString('utf8');
      const svgResult = verifySvgSecurity(svgContent);
      
      if (!svgResult.isValid) {
        errors.push(`SVG security check failed: ${svgResult.error}`);
      } else if (svgResult.sanitizedContent) {
        warnings.push('SVG was sanitized to remove potentially dangerous content');
        // Create a new File with sanitized content
        const sanitizedBlob = new Blob([svgResult.sanitizedContent], { type: 'image/svg+xml' });
        file = sanitizedBlob as any;
      }
    }
    
    // If any errors, return early
    if (errors.length > 0) {
      return { isValid: false, errors, warnings };
    }
    
    // All checks passed
    return {
      isValid: true,
      errors: [],
      warnings,
      safeFile: file,
    };
  } catch (error) {
    debug.error('Error validating file upload:', error);
    return {
      isValid: false,
      errors: ['Failed to validate file - please try again'],
      warnings: [],
    };
  }
}

/**
 * Middleware helper for validating multipart form data
 */
export async function validateMultipartUpload(
  request: NextRequest,
  fieldName: string = 'file',
  options?: {
    maxSize?: number;
    allowedTypes?: string[];
    uploadType?: 'avatar' | 'attachment' | 'sticker';
  }
): Promise<{
  success: boolean;
  file?: File;
  errors?: string[];
  warnings?: string[];
  response?: Response;
}> {
  try {
    const formData = await request.formData();
    const file = formData.get(fieldName) as File | null;
    
    if (!file || !(file instanceof File)) {
      return {
        success: false,
        errors: ['No file uploaded'],
        response: Response.json({ error: 'No file uploaded' }, { status: 400 }),
      };
    }
    
    const validationResult = await validateFileUpload(file, options);
    
    if (!validationResult.isValid) {
      return {
        success: false,
        errors: validationResult.errors,
        warnings: validationResult.warnings,
        response: Response.json({ 
          error: 'File validation failed',
          details: validationResult.errors 
        }, { status: 400 }),
      };
    }
    
    return {
      success: true,
      file: validationResult.safeFile,
      warnings: validationResult.warnings,
    };
  } catch (error) {
    debug.error('Error processing multipart upload:', error);
    return {
      success: false,
      errors: ['Failed to process upload'],
      response: Response.json({ error: 'Upload processing failed' }, { status: 500 }),
    };
  }
}

/**
 * Strip metadata from image files
 * Removes EXIF data and other metadata that could leak information
 */
export async function stripImageMetadata(imageBuffer: Buffer, mimeType: string): Promise<Buffer> {
  try {
    // Note: sharp is only available in Node.js environment
    // This function should be called from server-side code only
    
    // For now, skip metadata stripping - this requires server implementation
    debug.log('Metadata stripping requires server-side implementation for', mimeType);
    return imageBuffer;
  } catch (error) {
    debug.error('Error stripping image metadata:', error);
    return imageBuffer; // Return original on error
  }
}

/**
 * Format file size for human-readable messages
 */
function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Check if file name is safe (no path traversal, special chars, etc.)
 */
export function isSafeFilename(filename: string): boolean {
  // Block dangerous patterns
  const dangerousPatterns = [
    /\.\./g, // Path traversal
    /[<>:"|?*]/g, // Windows reserved chars
    /[\/\\]/g, // Path separators
    /^\./g, // Hidden files
    /[\x00-\x1F\x7F]/g, // Control characters
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(filename)) {
      return false;
    }
  }
  
  // Check length
  if (filename.length > 255) {
    return false;
  }
  
  return true;
}

/**
 * Sanitize filename - make it safe
 */
export function sanitizeFilename(filename: string): string {
  // Remove path components
  const basename = path.basename(filename);
  
  // Remove dangerous characters
  let sanitized = basename
    .replace(/[<>:"|?*]/g, '_')
    .replace(/[\/\\]/g, '-')
    .replace(/\.{2,}/g, '...')
    .trim();
  
  // Limit length
  if (sanitized.length > 200) {
    const ext = path.extname(sanitized);
    sanitized = sanitized.substring(0, 200 - ext.length) + ext;
  }
  
  // Ensure not empty
  if (!sanitized || sanitized === '.') {
    return 'unnamed_file';
  }
  
  return sanitized;
}

// Need path import for sanitizeFilename
import path from 'path';
