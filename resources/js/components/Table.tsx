export default function Table<T>({
    cols,
    rows,
    loading,
}: {
    cols: { key: keyof T; header: string; render?: (value: any, row: T) => React.ReactNode }[];
    rows: T[];
    loading?: boolean;
}) {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2">
                <thead>
                    <tr>
                        {cols.map((c) => (
                            <th
                                key={String(c.key)}
                                className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500"
                            >
                                {c.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan={cols.length} className="px-3 py-6 text-center text-sm text-slate-500">
                                Loading…
                            </td>
                        </tr>
                    ) : rows.length === 0 ? (
                        <tr>
                            <td colSpan={cols.length} className="px-3 py-6 text-center text-sm text-slate-500">
                                No records yet.
                            </td>
                        </tr>
                    ) : (
                        rows.map((r, idx) => (
                            <tr
                                key={idx}
                                className="rounded-2xl border border-slate-100 bg-white/90 text-sm text-slate-700 shadow-sm backdrop-blur"
                            >
                                {cols.map((c) => (
                                    <td key={String(c.key)} className="px-3 py-3">
                                        {c.render ? c.render((r as any)[c.key], r) : String((r as any)[c.key])}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
