import clsx from "clsx";

export default function Badge({
    children,
    tone = "default",
}: {
    children: React.ReactNode;
    tone?: "default" | "good" | "warn" | "bad";
}) {
    const base = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold";
    const map = {
        default: "bg-brand-50 text-brand-700",
        good: "bg-emerald-50 text-emerald-700",
        warn: "bg-amber-50 text-amber-700",
        bad: "bg-rose-50 text-rose-700",
    };
    return <span className={clsx(base, map[tone])}>{children}</span>;
}
