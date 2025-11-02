import Card from "../components/Card";
import Table from "../components/Table";
import Badge from "../components/Badge";
import Modal from "../components/Modal";
import Button from "../components/Button";
import { useState } from "react";
import { atRiskMembers, playbooks } from "../data/mock";

export default function Retention() {
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<string | null>(null);

    return (
        <div className="grid gap-6">
            <Card title="Churn risk heatmap" subtitle="Auto-segmented by behavior">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {["Low", "Med", "High", "Critical"].map((seg, i) => (
                        <div key={seg} className="glass p-4">
                            <div className="text-sm text-slate-500">{seg}</div>
                            <div className="text-2xl font-semibold mt-1">
                                {i === 0 ? 874 : i === 1 ? 311 : i === 2 ? 119 : 24}
                            </div>
                            <div className="text-xs text-slate-500">members</div>
                        </div>
                    ))}
                </div>
            </Card>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card title="At‑risk roster" subtitle="Last 14 days">
                    <Table
                        cols={[
                            { key: "name", header: "Member" },
                            { key: "lastCheckIn", header: "Last check‑in" },
                            { key: "risk", header: "Risk", render: (v: string) => (
                                    v === "High" ? <Badge tone="bad">High</Badge> :
                                        v === "Med" ? <Badge tone="warn">Med</Badge> :
                                            <Badge tone="good">Low</Badge>
                                ) },
                            { key: "reason", header: "Reason" },
                        ]}
                        rows={atRiskMembers as any}
                    />
                </Card>

                <Card title="Playbooks" subtitle="Automated interventions">
                    <Table
                        cols={[
                            { key: "name", header: "Name" },
                            { key: "trigger", header: "Trigger" },
                            { key: "channel", header: "Channel" },
                            { key: "status", header: "Status", render: (v: string) => (
                                    v === "Active" ? <Badge tone="good">Active</Badge> : <Badge>Paused</Badge>
                                ) },
                        ]}
                        rows={playbooks as any}
                    />
                    <div className="mt-4 flex justify-end">
                        <Button onClick={() => setOpen(true)}>New playbook</Button>
                    </div>
                </Card>
            </div>

            <Modal open={open} onClose={() => setOpen(false)} title="Create playbook"
                   footer={
                       <>
                           <button className="px-4 py-2 rounded-lg text-sm" onClick={() => setOpen(false)}>Cancel</button>
                           <Button onClick={() => setOpen(false)}>Save</Button>
                       </>
                   }>
                <form className="grid gap-4">
                    <label className="text-sm">
                        Name
                        <input className="mt-1 w-full border rounded-lg px-3 py-2" placeholder="Streak Save"/>
                    </label>
                    <label className="text-sm">
                        Trigger
                        <select className="mt-1 w-full border rounded-lg px-3 py-2">
                            <option>7 days no check‑in</option>
                            <option>Missed 2 booked classes</option>
                            <option>Cancel within 30 days</option>
                        </select>
                    </label>
                    <label className="text-sm">
                        Channel
                        <select className="mt-1 w-full border rounded-lg px-3 py-2">
                            <option>SMS</option>
                            <option>Email</option>
                        </select>
                    </label>
                    <label className="text-sm">
                        Audience
                        <input className="mt-1 w-full border rounded-lg px-3 py-2" placeholder="At‑risk members"/>
                    </label>
                </form>
            </Modal>
        </div>
    );
}