import clsx from "clsx";

export default function Badge({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "good" | "warn" | "bad" }) {
    const base = "inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium";
    const map = {
        default: "bg-slate-100 text-slate-700",
        good:    "bg-green-100 text-green-700",
        warn:    "bg-amber-100 text-amber-800",
        bad:     "bg-rose-100 text-rose-700",
    };
    return <span className={clsx(base, map[tone])}>{children}</span>;
}