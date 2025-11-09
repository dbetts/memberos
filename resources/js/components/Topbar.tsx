import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Search, LogOut, User } from "lucide-react";
import Toggle from "./Toggle";
import { useBranding } from "../context/BrandingContext";
import type { AuthenticatedUser } from "../types/auth";

type TopbarProps = {
  user: AuthenticatedUser | null;
  userLoaded: boolean;
};

export default function Topbar({ user, userLoaded }: TopbarProps) {
  const { branding, brandingLoaded } = useBranding();
  const [dark, setDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const accent = branding?.accent_color ?? "var(--brand-accent)";
  const primary = branding?.primary_color ?? "var(--brand-primary)";
  const avatarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!avatarRef.current) return;
      if (!avatarRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const initials = (user?.name ?? "Studio Admin")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  async function handleLogout() {
    const token = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content;
    await fetch("/logout", {
      method: "POST",
      headers: {
        "X-CSRF-TOKEN": token ?? "",
        "X-Requested-With": "XMLHttpRequest",
        Accept: "application/json",
      },
    });
    window.location.href = "/login";
  }

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
            <span
              className="absolute -top-1 -right-1 inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] text-white"
              style={{ background: accent }}
            >
              3
            </span>
          </button>
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-900">{user?.name ?? "Studio Admin"}</p>
            {userLoaded && brandingLoaded ? (
              <p className="text-xs text-slate-500">{branding?.name ?? user?.email ?? "Owner"}</p>
            ) : (
              <div className="mt-1 h-3 w-24 animate-pulse rounded bg-slate-200" aria-hidden="true" />
            )}
          </div>
          <div className="relative" ref={avatarRef}>
            <button
              onClick={() => setMenuOpen((open) => !open)}
              className="grid h-11 w-11 place-items-center rounded-2xl text-sm font-semibold text-white shadow-lg outline-none"
              style={{ background: `linear-gradient(135deg, ${primary}, ${accent})`, boxShadow: `0 15px 25px ${primary}40` }}
            >
              {initials || "ME"}
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-3 w-64 rounded-2xl border border-slate-100 bg-white shadow-xl">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-900">{user?.name ?? "Studio Admin"}</p>
                  <p className="text-xs text-slate-500">{user?.email ?? "owner@example.com"}</p>
                </div>
                <div className="py-2">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    onClick={() => setMenuOpen(false)}
                  >
                    <User size={16} />
                    Profile
                  </Link>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
