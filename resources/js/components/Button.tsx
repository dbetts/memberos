import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type ButtonTone = "primary" | "neutral" | "danger" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: ButtonTone;
};

const gradientStyle = {
  backgroundImage: "linear-gradient(90deg, var(--brand-primary), var(--brand-accent))",
};

const toneClasses: Record<ButtonTone, string> = {
  primary: "text-white shadow-lg hover:-translate-y-0.5 focus:ring-brand-200",
  neutral: "bg-white text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50 focus:ring-slate-200",
  danger: "bg-rose-600 text-white shadow-lg hover:bg-rose-500 focus:ring-rose-200",
  ghost: "bg-transparent text-slate-600 border border-transparent hover:bg-slate-100 focus:ring-slate-200",
};

export default function Button({ className, children, tone = "primary", ...props }: ButtonProps) {
  const toneClass = toneClasses[tone] ?? toneClasses.primary;
  const style = tone === "primary" ? gradientStyle : undefined;

  return (
    <button
      className={clsx(
        "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed",
        toneClass,
        className
      )}
      style={style}
      {...props}
    >
      {children}
    </button>
  );
}
