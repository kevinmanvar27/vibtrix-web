import { Toaster } from "@/components/ui/toaster";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "./media-protection.css";
import { getSiteSettings } from "./(main)/getSiteSettings";
import PerformanceMonitor from "@/components/PerformanceMonitor";
import configureDebugUtility from "@/lib/debug-config";
import ClientProviders from "@/components/ClientProviders";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { ensureAdminUser } from "@/lib/ensure-admin-user";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  display: "swap", // Prevent font from blocking rendering
  preload: false, // Disable preloading to prevent unused preload warning
  fallback: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'sans-serif'],
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  display: "swap", // Prevent font from blocking rendering
  preload: false, // Disable preloading to prevent unused preload warning
  fallback: ['Menlo', 'Monaco', 'Courier New', 'monospace'],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
    title: {
      template: "%s | Vibetrix",
      default: "Vibetrix - Social Media Platform for Video Competitions",
    },
    description: "Vibetrix is a social media platform where users can participate in video competitions, share content, and connect with others.",
    keywords: ["video competitions", "social media", "content creation", "video sharing", "Vibetrix"],
    authors: [{ name: "Vibetrix Team" }],
    creator: "Vibetrix",
    publisher: "Vibetrix",
    openGraph: {
      type: "website",
      locale: "en_US",
      url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      title: "Vibetrix - Social Media Platform for Video Competitions",
      description: "Vibetrix is a social media platform where users can participate in video competitions, share content, and connect with others.",
      siteName: "Vibetrix",
    },
    twitter: {
      card: "summary_large_image",
      title: "Vibetrix - Social Media Platform for Video Competitions",
      description: "Vibetrix is a social media platform where users can participate in video competitions, share content, and connect with others.",
      creator: "@Vibetrix",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    // Don't set icons in metadata, we'll add them directly in the head
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Configure debug utility to reduce console logs
  configureDebugUtility();

  // Ensure admin user exists
  await ensureAdminUser();

  const settings = await getSiteSettings();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <meta name="description" content="Vibetrix is a social media platform where users can participate in video competitions, share content, and connect with others." />
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'} />
        <link rel="preconnect" href="https://api.dicebear.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.dicebear.com" />

        {/* Preload Razorpay script for faster payment processing */}
        <link rel="preconnect" href="https://checkout.razorpay.com" />
        <link rel="dns-prefetch" href="https://checkout.razorpay.com" />
        <link rel="preload" href="https://checkout.razorpay.com/v1/checkout.js" as="script" />
        <meta name="theme-color" content="#000000" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="apple-mobile-web-app-title" content="Vibetrix" />

        {/* Favicons */}
        {settings.faviconUrl ? (
          <link rel="icon" href={settings.faviconUrl} />
        ) : (
          <>
            <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192x192.png" />
            <link rel="icon" type="image/png" sizes="512x512" href="/icons/icon-512x512.png" />
            <link rel="shortcut icon" href="/favicon.png" />
            <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
          </>
        )}
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
        {/* Add Google Analytics if enabled */}
        {settings.googleAnalyticsEnabled && settings.googleAnalyticsId && (
          <GoogleAnalytics googleAnalyticsId={settings.googleAnalyticsId} />
        )}
        <ClientProviders>
          <PerformanceMonitor />
          {children}
        </ClientProviders>
        <Toaster />
      </body>
    </html>
  );
}
