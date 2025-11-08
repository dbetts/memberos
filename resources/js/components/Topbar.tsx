import { useEffect, useState } from "react";
import { Bell, Search } from "lucide-react";
import Toggle from "./Toggle";

export default function Topbar() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200">
      <div className="flex items-center justify-between px-8 h-20">
        <div className="flex items-center gap-4 w-full max-w-xl">
          <div className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
            <Search size={18} className="text-slate-400" />
            <input
              aria-label="Search"
              className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none"
              placeholder="Search members, classes, or automations"
            />
          </div>
          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500">
            Dark mode
            <Toggle checked={dark} onChange={setDark} />
          </div>
        </div>
        <div className="flex items-center gap-5">
          <button
            className="relative rounded-2xl border border-slate-200 bg-white p-3 text-slate-500 transition hover:text-slate-900"
            aria-label="Notifications"
          >
            <Bell size={18} />
            <span className="absolute -top-1 -right-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[10px] text-white">
              3
            </span>
          </button>
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-900">Jordan Lane</p>
            <p className="text-xs text-slate-500">Studio Admin</p>
          </div>
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-semibold text-white shadow-lg shadow-brand-700/40">
            JL
          </div>
        </div>
      </div>
    </header>
  );
}
