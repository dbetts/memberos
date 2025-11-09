import { createContext, useContext } from "react";
import type { BrandingSettings } from "../types/branding";

type BrandingContextValue = {
  branding: BrandingSettings | null;
  setBranding: (value: BrandingSettings | null) => void;
  brandingLoaded: boolean;
};

const BrandingContext = createContext<BrandingContextValue | undefined>(undefined);

export function useBranding(): BrandingContextValue {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error("useBranding must be used within BrandingContext.Provider");
  }
  return context;
}

export const BrandingProvider = BrandingContext.Provider;
