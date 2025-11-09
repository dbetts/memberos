export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  organization_id?: string | null;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal?: string;
    country?: string;
  };
};
