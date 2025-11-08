import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

export default function Button({
                                   className, children, ...props
                               }: ButtonHTMLAttributes<HTMLButtonElement>) {
    const gradientStyle = {
        backgroundImage: 'linear-gradient(90deg, var(--brand-primary), var(--brand-accent))',
    };
    return (
        <button
            className={clsx(
                "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition",
                "text-white shadow-lg",
                "focus:outline-none focus:ring-2 focus:ring-brand-200 hover:-translate-y-0.5",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                className
            )}
            style={gradientStyle}
            {...props}
        >
            {children}
        </button>
    );
}
