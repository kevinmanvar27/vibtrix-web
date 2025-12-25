# Fallback Video Instructions

This directory should contain a fallback video file named `video-unavailable.mp4` that will be displayed when the original video is not found.

## Creating a Fallback Video

1. Create a simple MP4 video file (5-10 seconds long) with a message like "Video Unavailable" or "This video could not be loaded"
2. Save it as `video-unavailable.mp4` in this directory
3. Make sure the video is small in size (less than 1MB) to ensure fast loading

## Example Using FFmpeg

If you have FFmpeg installed, you can create a simple video with text using the following command:

```bash
ffmpeg -f lavfi -i color=c=black:s=1280x720:d=5 -vf "drawtext=fontfile=/path/to/font.ttf:text='Video Unavailable':fontcolor=white:fontsize=72:x=(w-text_w)/2:y=(h-text_h)/2" -c:v libx264 -pix_fmt yuv420p video-unavailable.mp4
```

## Alternative Solution

If you don't have a fallback video, the application will display a static fallback UI with a message indicating that the video is unavailable.
