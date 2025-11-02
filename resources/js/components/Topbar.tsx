import { Search } from "lucide-react";
import Toggle from "./Toggle";
import { useState } from "react";

export default function Topbar() {
    const [dark, setDark] = useState(false);
    return (
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
            <div className="flex items-center justify-between px-6 h-14">
                <div className="flex items-center gap-2 text-slate-500">
                    <Search size={18}/>
                    <input
                        aria-label="Search"
                        className="outline-none bg-transparent placeholder:text-slate-400 text-sm w-64"
                        placeholder="Search members, classes, playbooks…"
                    />
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-500">Dark</span>
                    <Toggle checked={dark} onChange={setDark}/>
                    <div className="w-8 h-8 rounded-full bg-brand-600 text-white grid place-items-center text-sm">JL</div>
                </div>
            </div>
        </header>
    );
}