"use client";

import { useEffect, useState } from "react";
import { format, toZonedTime } from "date-fns-tz";

interface CurrentTimeProps {
  timezone: string;
}

export default function CurrentTime({ timezone }: CurrentTimeProps) {
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    // Function to update time
    const updateTime = () => {
      const now = new Date();
      const zonedDate = toZonedTime(now, timezone);
      const formattedTime = format(zonedDate, "yyyy-MM-dd HH:mm:ss", { timeZone: timezone });
      setCurrentTime(formattedTime);
    };

    // Update time immediately
    updateTime();

    // Update time every second
    const interval = setInterval(updateTime, 1000);

    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, [timezone]);

  return (
    <div className="text-sm text-muted-foreground">
      Current time ({timezone}): {currentTime}
    </div>
  );
}
