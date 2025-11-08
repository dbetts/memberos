import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

export default function Button({
                                   className, children, ...props
                               }: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            className={clsx(
                "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition",
                "bg-gradient-to-r from-brand-500 via-brand-600 to-brand-700 text-white shadow-lg shadow-brand-700/30",
                "focus:outline-none focus:ring-2 focus:ring-brand-200 hover:-translate-y-0.5",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
}
