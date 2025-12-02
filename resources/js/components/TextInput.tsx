import clsx from "clsx";
import { forwardRef, InputHTMLAttributes } from "react";

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

const baseClasses =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { className, invalid, type = "text", ...props },
  ref
) {
  return (
    <input
      ref={ref}
      type={type}
      className={clsx(baseClasses, invalid && "border-rose-400 focus:border-rose-500 focus:ring-rose-100", className)}
      {...props}
    />
  );
});

export default TextInput;
