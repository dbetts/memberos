export default function Table<T>({ cols, rows }: {
    cols: { key: keyof T; header: string; render?: (value: any, row: T) => React.ReactNode }[];
    rows: T[];
}) {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2">
                <thead>
                    <tr>
                        {cols.map(c => (
                            <th key={String(c.key)} className="text-left text-xs font-semibold text-slate-500 px-3 py-2">
                                {c.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r, idx) => (
                        <tr key={idx} className="bg-white shadow-sm">
                            {cols.map(c => (
                                <td key={String(c.key)} className="px-3 py-3 text-sm text-slate-700">
                                    {c.render ? c.render((r as any)[c.key], r) : String((r as any)[c.key])}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}