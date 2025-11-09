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
            <Line type="monotone" dataKey="retained" stroke="#4b79ff" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

type BarStatProps = {
  data: any[];
  title: string;
  xKey: string;
  yKey: string;
  emptyMessage?: string;
};

export function BarStat({ data, title, xKey, yKey, emptyMessage = "No data yet." }: BarStatProps) {
  const hasData = data.length > 0;

  return (
    <Card title={title}>
      <div className="h-64">
        {hasData ? (
          <ResponsiveContainer>
            <BarChart data={data}>
              <XAxis dataKey={xKey} />
              <YAxis />
              <Tooltip />
              <Bar dataKey={yKey} fill="#4b79ff" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-2xl bg-slate-50 text-sm text-slate-400">
            {emptyMessage}
          </div>
        )}
      </div>
    </Card>
  );
}

export function PieStat({
  data,
  title,
  nameKey,
  valueKey,
}: {
  data: any[];
  title: string;
  nameKey: string;
  valueKey: string;
}) {
  const palette = ["#4b79ff", "#6d92ff", "#93adff", "#b8c9ff", "#dbe4ff"];
  return (
    <Card title={title}>
      <div className="h-64">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey={valueKey} nameKey={nameKey} outerRadius={100} label>
              {data.map((_, i) => (
                <Cell key={i} fill={palette[i % palette.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
