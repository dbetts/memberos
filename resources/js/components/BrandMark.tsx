import clsx from "clsx";
import logo from "../../img/logoB_1.png";

type Props = {
  orientation?: "row" | "column";
  size?: "sm" | "md" | "lg";
  subtitle?: string | null;
  className?: string;
};

export default function BrandMark({
  orientation = "row",
  size = "md",
  subtitle = "Retention & revenue intelligence",
  className,
}: Props) {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  return (
    <div
      className={clsx(
        "flex",
        orientation === "row" ? "items-center gap-3" : "flex-col gap-1",
        className
      )}
    >
      <div className={clsx("", sizes[size])}>
        <img src={logo} alt="FitFlow" className="w-full h-full object-contain" />
      </div>
      <div>
        <p className="text-lg font-semibold tracking-tight text-white">FitFlow</p>
        {subtitle && <p className="text-xs text-white/70">{subtitle}</p>}
      </div>
    </div>
  );
}
