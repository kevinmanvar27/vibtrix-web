"use client";

import Script from "next/script";
import { useEffect } from "react";
import debug from "@/lib/debug";

interface GoogleAnalyticsProps {
  googleAnalyticsId: string;
}

export default function GoogleAnalytics({ googleAnalyticsId }: GoogleAnalyticsProps) {
  useEffect(() => {
    if (googleAnalyticsId) {
      debug.log("Google Analytics initialized with ID:", googleAnalyticsId);
    }
  }, [googleAnalyticsId]);

  if (!googleAnalyticsId) {
    return null;
  }

  return (
    <>
      {/* Google Analytics GA4 tag */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive" dangerouslySetInnerHTML={{
        __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${googleAnalyticsId}');
        `
      }} />
    </>
  );
}
