export type BrandingSettings = {
  id: string;
  name: string;
  subdomain?: string | null;
  custom_domain?: string | null;
  support_email?: string | null;
  primary_color?: string | null;
  accent_color?: string | null;
  logo_url?: string | null;
  branding_overrides?: Record<string, unknown> | null;
  smtp?: {
    host?: string | null;
    port?: number | null;
    username?: string | null;
    encryption?: string | null;
    from_email?: string | null;
    from_name?: string | null;
    has_password?: boolean;
  } | null;
};
