export default function Modal({
    open,
    onClose,
    title,
    children,
    footer,
}: {
    open: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="absolute inset-0 grid place-items-center p-4">
                <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl">
                    <div className="border-b border-slate-100 px-6 pb-3 pt-5">
                        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                    </div>
                    <div className="px-6 py-6">{children}</div>
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
