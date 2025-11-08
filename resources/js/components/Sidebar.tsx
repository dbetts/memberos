import { NavLink } from "react-router-dom";
import { Gauge, Users, CalendarCheck, Bot, Settings, LineChart, Target } from "lucide-react";

const items = [
    { to: "/", icon: LineChart, label: "Dashboard" },
    { to: "/retention", icon: Users, label: "Retention" },
    { to: "/capacity", icon: CalendarCheck, label: "Capacity" },
    { to: "/crm", icon: Gauge, label: "CRM" },
    { to: "/coach", icon: Target, label: "Coach" },
    { to: "/playbooks", icon: Bot, label: "Playbooks" },
    { to: "/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar() {
    return (
        <aside className="w-64 border-r bg-white">
            <div className="px-4 py-4">
                <div className="text-xl font-bold tracking-tight">
                    <span className="text-brand-600">Member</span>OS
                </div>
                <p className="text-xs text-slate-500">Retention & Revenue Platform</p>
            </div>
            <nav className="px-2">
                {items.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2 rounded-lg my-1 text-sm ${
                                isActive ? "bg-brand-50 text-brand-700" : "text-slate-700 hover:bg-slate-50"
                            }`
                        }
                    >
                        <Icon size={18} />
                        {label}
                    </NavLink>
                ))}
            </nav>
            <div className="p-3 mt-auto">
                <div className="glass p-3">
                    <p className="text-xs text-slate-600">
                        Demo build — mock data only. API‑first, easy to integrate with club systems.
                    </p>
                </div>
            </div>
        </aside>
    );
}
