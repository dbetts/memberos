import { NavLink } from "react-router-dom";
import clsx from "clsx";
import { Gauge, Users, CalendarCheck, Bot, Settings, LineChart, Target } from "lucide-react";
import BrandMark from "./BrandMark";

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
    <aside className="w-72 bg-gradient-to-b from-[#050b27] via-[#071038] to-[#091643] text-white flex flex-col border-r border-white/5">
      <div className="px-6 pt-8 pb-6">
        <BrandMark subtitle="Flow smarter with automation" />
      </div>
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto pb-6">
        {items.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 px-4 py-2 rounded-2xl text-sm font-medium transition",
                "hover:bg-white/10 hover:text-white",
                isActive
                  ? "bg-white text-[#0b1538] shadow-lg shadow-black/20"
                  : "text-white/70"
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-5 pb-8">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
          <p className="text-xs text-white/80">
            Demo workspace — FitFlow syncs with Mindbody, ABC, and custom data sources.
          </p>
        </div>
      </div>
    </aside>
  );
}
