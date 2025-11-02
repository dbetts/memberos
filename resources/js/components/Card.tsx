export default function Card({ title, subtitle, right, children }: {
    title?: string; subtitle?: string; right?: React.ReactNode; children: React.ReactNode;
}) {
    return (
        <section className="card">
            <div className="flex items-center justify-between px-5 pt-4">
                <div>
                    {title && <h3 className="text-slate-900 font-semibold">{title}</h3>}
                    {subtitle && <p className="text-slate-500 text-sm">{subtitle}</p>}
                </div>
                {right}
            </div>
            <div className="p-5">{children}</div>
        </section>
    );
}