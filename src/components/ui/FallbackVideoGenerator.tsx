'use client';

import { useEffect, useRef } from 'react';

import debug from "@/lib/debug";

/**
 * This component generates a fallback video file using Canvas and saves it to the public directory.
 * It should be used during development to create a fallback video file.
 */
export function FallbackVideoGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = 1280;
    canvas.height = 720;

    // Fill background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add text
    ctx.fillStyle = '#ffffff';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Video Unavailable', canvas.width / 2, canvas.height / 2 - 30);

    ctx.fillStyle = '#cccccc';
    ctx.font = '24px Arial';
    ctx.fillText('This video could not be loaded.', canvas.width / 2, canvas.height / 2 + 30);

    // Create a data URL for the canvas
    const dataURL = canvas.toDataURL('image/png');

    // Log the data URL so it can be saved
    debug.log('Fallback image data URL:', dataURL);

    // Create a download link
    const link = document.createElement('a');
    link.download = 'video-unavailable.png';
    link.href = dataURL;
    link.textContent = 'Download Fallback Image';
    link.className = 'px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors mt-4 inline-block';
    
    // Add the link to the document
    const container = document.getElementById('fallback-container');
    if (container) {
      container.appendChild(link);
    }
  }, []);

  return (
    <div className="p-4" id="fallback-container">
      <h2 className="text-xl font-bold mb-4">Fallback Video Generator</h2>
      <p className="mb-4">This tool generates a fallback image that can be used as a poster for unavailable videos.</p>
      <canvas 
        ref={canvasRef} 
        className="border border-gray-300 mb-4"
        style={{ width: '640px', height: '360px' }}
      />
      <p className="text-sm text-gray-500 mt-2">
        Note: This is just a static image. For a proper fallback video, you should create an MP4 file and place it at 
        <code className="bg-gray-100 px-2 py-1 rounded mx-1">/public/assets/fallback/video-unavailable.mp4</code>
      </p>
    </div>
  );
}

export default FallbackVideoGenerator;
