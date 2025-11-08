import { Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import { routes } from "./routes";

export default function App() {
  const location = useLocation();
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-auto px-8 py-8">
          <div className="mx-auto max-w-7xl space-y-6">
            <Suspense fallback={<div className="text-slate-500">Loading…</div>}>
              <Routes location={location}>
                {routes.map(({ path, element: El }) => (
                  <Route key={path} path={path} element={<El />} />
                ))}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
