"use client";

import { FeatureSettings } from "@/lib/get-feature-settings";
import { FeatureSettingsContext } from "@/hooks/use-feature-settings";
import { ReactNode } from "react";

interface FeatureSettingsProviderProps {
  settings: FeatureSettings;
  children: ReactNode;
}

export function FeatureSettingsProvider({
  settings,
  children,
}: FeatureSettingsProviderProps) {
  return (
    <FeatureSettingsContext.Provider value={settings}>
      {children}
    </FeatureSettingsContext.Provider>
  );
}
