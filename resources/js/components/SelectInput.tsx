import clsx from "clsx";
import { forwardRef, SelectHTMLAttributes } from "react";

type SelectInputProps = SelectHTMLAttributes<HTMLSelectElement> & {
  invalid?: boolean;
};

const baseClasses =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

const SelectInput = forwardRef<HTMLSelectElement, SelectInputProps>(function SelectInput(
  { className, invalid, children, ...props },
  ref
) {
  return (
    <select
      ref={ref}
      className={clsx(baseClasses, invalid && "border-rose-400 focus:border-rose-500 focus:ring-rose-100", className)}
      {...props}
    >
      {children}
    </select>
  );
});

export default SelectInput;
