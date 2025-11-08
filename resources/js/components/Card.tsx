export default function Card({
    title,
    subtitle,
    right,
    children,
}: {
    title?: string;
    subtitle?: string;
    right?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <section className="card relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-400 via-brand-600 to-brand-500" />
            <div className="flex flex-wrap items-center justify-between gap-4 px-6 pt-6">
                <div>
                    {title && <h3 className="text-slate-900 text-lg font-semibold">{title}</h3>}
                    {subtitle && <p className="text-slate-500 text-sm">{subtitle}</p>}
                </div>
                {right}
            </div>
            <div className="px-6 pb-6 pt-4">{children}</div>
        </section>
    );
}
