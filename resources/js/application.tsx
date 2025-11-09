import { Suspense, useEffect, useMemo, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import { routes } from "./routes";
import type { BrandingSettings } from "./types/branding";
import { apiFetch, isAbortError } from "./api/client";
import { BrandingProvider } from "./context/BrandingContext";
import type { AuthenticatedUser, ImpersonationState } from "./types/auth";

export default function App() {
  const location = useLocation();
  const publicPrefixes: string[] = [];
  const isPublicRoute = useMemo(
    () => publicPrefixes.some((prefix) => location.pathname.startsWith(prefix)),
    [location.pathname]
  );
  const [branding, setBranding] = useState<BrandingSettings | null>(null);
  const [brandingLoaded, setBrandingLoaded] = useState(false);
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [userLoaded, setUserLoaded] = useState(false);
  const [impersonation, setImpersonation] = useState<ImpersonationState | null>(null);

  useEffect(() => {
    if (isPublicRoute) return;

    const controller = new AbortController();

    async function loadBootstrap() {
      try {
        const response = await apiFetch<{
          data: {
            user: AuthenticatedUser;
            branding: BrandingSettings | null;
            impersonation: ImpersonationState | null;
          };
        }>(
          "/auth/bootstrap",
          {
            signal: controller.signal,
          }
        );
        if (controller.signal.aborted) return;
        setUser(response.data.user);
        setBranding(response.data.branding ?? null);
        setImpersonation(response.data.impersonation ?? null);
        if (response.data.user?.organization_id) {
          localStorage.setItem("fitflow.orgId", response.data.user.organization_id);
        } else {
          localStorage.removeItem("fitflow.orgId");
        }
      } catch (error) {
        if (isAbortError(error) || controller.signal.aborted) return;
      } finally {
        if (!controller.signal.aborted) {
          setBrandingLoaded(true);
          setUserLoaded(true);
        }
      }
    }

    loadBootstrap();

    return () => controller.abort();
  }, [isPublicRoute]);

  useEffect(() => {
    if (branding?.primary_color) {
      document.documentElement.style.setProperty("--brand-primary", branding.primary_color);
    }
    if (branding?.accent_color) {
      document.documentElement.style.setProperty("--brand-accent", branding.accent_color);
    }
  }, [branding]);

  const renderedRoutes = (
    <Routes location={location}>
      {routes.map(({ path, element: El }) => (
        <Route key={path} path={path} element={<El />} />
      ))}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );

  if (isPublicRoute) {
    return (
      <Suspense fallback={<div className="p-8 text-slate-500">Loading…</div>}>
        {renderedRoutes}
      </Suspense>
    );
  }

  return (
    <BrandingProvider value={{ branding, setBranding, brandingLoaded }}>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <Topbar user={user} userLoaded={userLoaded} impersonation={impersonation} />
          <main className="flex-1 overflow-auto px-8 py-8">
            <div className="mx-auto max-w-7xl space-y-6">
              <Suspense fallback={<div className="text-slate-500">Loading…</div>}>
                {renderedRoutes}
              </Suspense>
            </div>
          </main>
        </div>
      </div>
    </BrandingProvider>
  );
}
