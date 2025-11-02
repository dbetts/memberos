export default function Modal({ open, onClose, title, children, footer }: {
    open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode;
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
            <div className="absolute inset-0 grid place-items-center p-4">
                <div className="w-full max-w-lg bg-white rounded-xl shadow-card">
                    <div className="px-5 pt-4 pb-2 border-b">
                        <h3 className="font-semibold">{title}</h3>
                    </div>
                    <div className="p-5">{children}</div>
                    <div className="px-5 py-4 border-t flex justify-end gap-2">
                        {footer}
                    </div>
                </div>
            </div>
        </div>
    );
}