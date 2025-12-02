import type { BrandingSettings } from "./types/branding";
import type { AuthenticatedUser, ImpersonationState } from "./types/auth";

export type BootstrapPayload = {
  user: AuthenticatedUser | null;
  branding: BrandingSettings | null;
  impersonation: ImpersonationState | null;
};

let cachedBootstrap: BootstrapPayload | null | undefined;

export function readBootstrapData(): BootstrapPayload | null {
  if (cachedBootstrap !== undefined) {
    return cachedBootstrap;
  }

  const script = document.getElementById("fitflow-bootstrap");
  const raw = script?.textContent?.trim();

  if (!raw || raw === "null") {
    cachedBootstrap = null;
    return cachedBootstrap;
  }

  try {
    cachedBootstrap = JSON.parse(raw) as BootstrapPayload;
  } catch (error) {
    console.warn("Unable to parse FitFlow bootstrap payload", error);
    cachedBootstrap = null;
  }

  return cachedBootstrap;
}
