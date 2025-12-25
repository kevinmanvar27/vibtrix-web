'use client';

import { useEffect, useState } from 'react';

import debug from "@/lib/debug";

interface MediaWatermarkProps {
  className?: string;
  opacity?: number;
}

export default function MediaWatermark({
  className = '',
  opacity = 0.3
}: MediaWatermarkProps) {
  const [username, setUsername] = useState<string>('');
  const [timestamp, setTimestamp] = useState<string>('');

  // Get current user info
  useEffect(() => {
    // Get current timestamp
    const now = new Date();
    setTimestamp(now.toISOString().split('T')[0]);

    // Try to get username from localStorage or session
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    } else {
      // Get from cookie or other source if available
      const cookies = document.cookie.split(';');
      const userCookie = cookies.find(cookie => cookie.trim().startsWith('user='));
      if (userCookie) {
        try {
          const userData = JSON.parse(decodeURIComponent(userCookie.split('=')[1]));
          if (userData.username) {
            setUsername(userData.username);
          }
        } catch (e) {
          debug.error('Error parsing user cookie:', e);
        }
      }
    }
  }, []);

  if (!username && !timestamp) return null;

  return (
    <div
      className={`media-watermark ${className}`}
      style={{ opacity }}
    >
      {username ? `${username} • ${timestamp}` : timestamp}
    </div>
  );
}
