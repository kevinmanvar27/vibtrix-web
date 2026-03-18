import { NextRequest, NextResponse } from 'next/server';
import debug from '@/lib/debug';

// Route segment config
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    debug.log('='.repeat(60));
    debug.log('TEST UPLOAD: Request received');
    debug.log('='.repeat(60));
    
    debug.log('Content-Type:', req.headers.get('content-type'));
    debug.log('Content-Length:', req.headers.get('content-length'));
    
    // Try to parse formData
    debug.log('Attempting to parse FormData...');
    const startTime = Date.now();
    
    const formData = await req.formData();
    
    const parseTime = Date.now() - startTime;
    debug.log(`FormData parsed in ${parseTime}ms`);
    
    const files = formData.getAll('files');
    debug.log(`Received ${files.length} files`);
    
    for (const file of files) {
      if (file instanceof File) {
        debug.log(`File: ${file.name}, Size: ${file.size} bytes, Type: ${file.type}`);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Test upload successful',
      fileCount: files.length,
      parseTime: `${parseTime}ms`,
    });
    
  } catch (error) {
    debug.error('TEST UPLOAD ERROR:', error);
    debug.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
    debug.error('Error message:', error instanceof Error ? error.message : String(error));
    debug.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    }, { status: 500 });
  }
}
