export type BrandingBootstrap = {
  primary_color?: string | null;
  accent_color?: string | null;
  name?: string | null;
  logo_path?: string | null;
  support_email?: string | null;
};

export function initialBranding(): BrandingBootstrap | null {
  const meta = document.querySelector('meta[name="fitflow-branding"]') as HTMLMetaElement | null;
  if (!meta?.content || meta.content === "null") {
    return null;
  }

  try {
    return JSON.parse(meta.content) as BrandingBootstrap;
  } catch (error) {
    console.warn('Failed to parse branding bootstrap meta tag', error);
    return null;
  }
}
