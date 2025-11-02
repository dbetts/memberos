import Card from "./Card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

export function LineStat({ data }: { data: any[] }) {
    return (
        <Card title="Retention trend" subtitle="Last 6 months">
            <div className="h-64">
                <ResponsiveContainer>
                    <LineChart data={data}>
                        <XAxis dataKey="month" />
                        <YAxis domain={[80, 100]} unit="%" />
                        <Tooltip />
                        <Line type="monotone" dataKey="retained" stroke="#1ea2ff" strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}

export function BarStat({ data, title, xKey, yKey }: { data: any[]; title: string; xKey: string; yKey: string }) {
    return (
        <Card title={title}>
            <div className="h-64">
                <ResponsiveContainer>
                    <BarChart data={data}>
                        <XAxis dataKey={xKey} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey={yKey} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}

export function PieStat({ data, title, nameKey, valueKey }: {
    data: any[]; title: string; nameKey: string; valueKey: string;
}) {
    const palette = ["#1ea2ff", "#4ec0ff", "#99dcff", "#bfeaff", "#e6f7ff"];
    return (
        <Card title={title}>
            <div className="h-64">
                <ResponsiveContainer>
                    <PieChart>
                        <Pie data={data} dataKey={valueKey} nameKey={nameKey} outerRadius={100} label>
                            {data.map((_, i) => <Cell key={i} fill={palette[i % palette.length]} />)}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}