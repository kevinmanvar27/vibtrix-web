"use client";

import Script from "next/script";
import { useEffect } from "react";
import debug from "@/lib/debug";
import DOMPurify from "isomorphic-dompurify";

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

  // Sanitize the GA ID to prevent injection attacks
  const sanitizedGaId = DOMPurify.sanitize(googleAnalyticsId);
  
  // Create safe inline script for Google Analytics
  // Note: This is a trusted script template, not user-generated content
  const gaScript = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${sanitizedGaId}');
  `.trim();

  return (
    <>
      {/* Google Analytics GA4 tag */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${sanitizedGaId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive" dangerouslySetInnerHTML={{
        __html: gaScript
      }} />
    </>
  );
}
