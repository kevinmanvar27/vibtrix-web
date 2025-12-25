"use client";

import { useEffect } from "react";
import configureDebugUtility from "@/lib/debug-config";
import debug from "@/lib/debug";

export default function DebugConfigInitializerFixed() {
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    // Configure debug utility
    configureDebugUtility();

    debug.log("Debug utility configured");
  }, []);

  return null;
}
