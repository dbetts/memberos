import { CSSProperties, ReactNode } from "react";

export default function Modal({
    open,
    onClose,
    title,
    subtitle,
    children,
    footer,
    headerClassName,
    headerStyle,
}: {
    open: boolean;
    onClose: () => void;
    title: ReactNode;
    subtitle?: ReactNode;
    children: ReactNode;
    footer?: ReactNode;
    headerClassName?: string;
    headerStyle?: CSSProperties;
}) {
    if (!open) return null;
    const headerClasses = ["border-b border-slate-100 px-6 pb-3 pt-5", headerClassName ?? ""].join(" ").trim();
    return (
        <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="absolute inset-0 grid place-items-center p-4">
                <div
                    className="w-[650px] min-h-[650px] overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl flex flex-col"
                    style={{ maxHeight: "80vh", maxWidth: "80vw" }}
                >
                    <div className={headerClasses} style={headerStyle}>
                        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                        {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
                    </div>
                    <div className="px-6 py-6 flex-1 overflow-y-auto">{children}</div>
                    {footer && (
                        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
