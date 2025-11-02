import Card from "../components/Card";
import Table from "../components/Table";
import { classes } from "../data/mock";
import { BarStat } from "../components/ChartCard";

export default function Capacity() {
    const fill = classes.map(c => ({ cls: c.name, fill: Math.round((c.booked / c.capacity) * 100) }));
    return (
        <div className="grid gap-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <BarStat data={fill} title="Class fill %" xKey="cls" yKey="fill" />
                <Card title="Waitlist & no‑shows" subtitle="Predicted vs actual">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="glass p-4">
                            <div className="text-slate-500 text-sm">Avg waitlist</div>
                            <div className="text-3xl font-semibold mt-1">1.3</div>
                        </div>
                        <div className="glass p-4">
                            <div className="text-slate-500 text-sm">No‑show rate</div>
                            <div className="text-3xl font-semibold mt-1">7.8%</div>
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-3">Auto‑backfill is on for overbooked classes.</p>
                </Card>
            </div>

            <Card title="Today’s schedule">
                <Table
                    cols={[
                        { key: "name", header: "Class" },
                        { key: "start", header: "Start" },
                        { key: "capacity", header: "Cap" },
                        { key: "booked", header: "Booked" },
                        { key: "waitlist", header: "Waitlist" },
                    ]}
                    rows={classes as any}
                />
            </Card>
        </div>
    );
}