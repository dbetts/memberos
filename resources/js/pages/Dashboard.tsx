import Card from "../components/Card";
import Badge from "../components/Badge";
import Table from "../components/Table";
import { LineStat } from "../components/ChartCard";
import { kpis, retentionSeries, classes, atRiskMembers } from "../data/mock";
import { Info } from "lucide-react";

export default function Dashboard() {
    return (
        <div className="grid gap-6">
            {/* KPI cards */}
            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {kpis.map((k) => (
                    <div key={k.label} className="card p-5">
                        <div className="flex items-center justify-between">
                            <p className="text-slate-500 text-sm">{k.label}</p>
                            <span title={k.help}>
                                <Info size={14} className="text-slate-400" />
                            </span>
                        </div>
                        <div className="mt-2 flex items-end justify-between">
                            <div className="text-2xl font-semibold">{k.value}</div>
                            {k.delta && (
                                <Badge tone={k.good ? "good" : "bad"}>
                                    {k.delta} {k.good ? "vs last mo" : "worse"}
                                </Badge>
                            )}
                        </div>
                    </div>
                ))}
            </section>

            {/* Charts & tables */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2">
                    <LineStat data={retentionSeries} />
                </div>
                <Card title="Today's classes" subtitle="Capacity & waitlist">
                    <Table
                        cols={[
                            { key: "name", header: "Class" },
                            { key: "start", header: "Start" },
                            { key: "capacity", header: "Capacity" },
                            { key: "booked", header: "Booked", render: (v: number, r: any) => (
                                    <span>{v} / {r.capacity}</span>
                                ) },
                            { key: "waitlist", header: "Waitlist", render: (v: number) => (
                                    v > 0 ? <Badge tone="warn">{v}</Badge> : <span className="text-slate-500">—</span>
                                ) }
                        ]}
                        rows={classes}
                    />
                </Card>
            </div>

            <Card title="At‑risk members" subtitle="Churn risk & reasons">
                <Table
                    cols={[
                        { key: "name", header: "Name" },
                        { key: "lastCheckIn", header: "Last check‑in" },
                        { key: "risk", header: "Risk", render: (v: "Low"|"Med"|"High") =>
                                v === "High" ? <Badge tone="bad">High</Badge>
                                    : v === "Med" ? <Badge tone="warn">Med</Badge>
                                        : <Badge tone="good">Low</Badge>
                        },
                        { key: "reason", header: "Why" },
                    ]}
                    rows={atRiskMembers as any}
                />
            </Card>
        </div>
    );
}