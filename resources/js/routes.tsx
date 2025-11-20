import { lazy } from "react";

export const routes = [
    { path: "/", element: lazy(() => import("./pages/Dashboard")) },
    { path: "/retention", element: lazy(() => import("./pages/Retention")) },
    { path: "/capacity", element: lazy(() => import("./pages/Capacity")) },
    { path: "/crm", element: lazy(() => import("./pages/CRM")) },
    { path: "/members", element: lazy(() => import("./pages/Members")) },
    { path: "/workouts/builder", element: lazy(() => import("./pages/WorkoutBuilder")) },
    { path: "/workouts/:workoutId/edit", element: lazy(() => import("./pages/WorkoutEditor")) },
    { path: "/team", element: lazy(() => import("./pages/Team")) },
    { path: "/coach", element: lazy(() => import("./pages/Coach")) },
    { path: "/playbooks", element: lazy(() => import("./pages/Playbooks")) },
    { path: "/settings", element: lazy(() => import("./pages/Settings")) },
    { path: "/profile", element: lazy(() => import("./pages/Profile")) },
];
