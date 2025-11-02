import { lazy } from "react";

export const routes = [
    { path: "/", element: lazy(() => import("./pages/Dashboard")) },
    { path: "/retention", element: lazy(() => import("./pages/Retention")) },
    { path: "/capacity", element: lazy(() => import("./pages/Capacity")) },
    { path: "/crm", element: lazy(() => import("./pages/CRM")) },
    { path: "/playbooks", element: lazy(() => import("./pages/Playbooks")) },
    { path: "/settings", element: lazy(() => import("./pages/Settings")) },
];