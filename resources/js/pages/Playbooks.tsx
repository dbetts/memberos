import Card from "../components/Card";
import Table from "../components/Table";
import Badge from "../components/Badge";
import Button from "../components/Button";
import { playbooks } from "../data/mock";

export default function Playbooks() {
    return (
        <div className="grid gap-6">
            <Card title="Automation Playbooks" subtitle="Always‑on nudges & offers" right={<Button>New playbook</Button>}>
                <Table
                    cols={[
                        { key: "name", header: "Name" },
                        { key: "trigger", header: "Trigger" },
                        { key: "channel", header: "Channel" },
                        { key: "audience", header: "Audience" },
                        { key: "status", header: "Status", render: (v: string) => v === "Active" ? <Badge tone="good">Active</Badge> : <Badge>Paused</Badge> },
                    ]}
                    rows={playbooks as any}
                />
            </Card>
            <Card title="Templates" subtitle="SMS & Email">
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="card p-4">
                        <div className="text-sm text-slate-500">SMS: Streak Save</div>
                        <p className="mt-2 text-slate-700">We miss you at the club! Book a class this week and get a free guest pass 🎟️</p>
                    </div>
                    <div className="card p-4">
                        <div className="text-sm text-slate-500">Email: Freeze Rescue</div>
                        <p className="mt-2 text-slate-700">Before you freeze, try our 21‑day plan with 2 PT sessions included.</p>
                    </div>
                </div>
            </Card>
        </div>
    );
}