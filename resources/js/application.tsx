import { Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import { routes } from "./routes";

export default function App() {
  const location = useLocation();
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 overflow-auto px-6 py-6">
          <Suspense fallback={<div className="text-slate-500">Loading…</div>}>
            <Routes location={location}>
              {routes.map(({ path, element: El }) => (
                <Route key={path} path={path} element={<El />} />
              ))}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
}