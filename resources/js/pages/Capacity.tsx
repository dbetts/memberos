import { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import Table from "../components/Table";
import Badge from "../components/Badge";
import { BarStat } from "../components/ChartCard";
import { apiFetch } from "../api/client";

type SessionRow = {
  id: string;
  class_type: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  booked: number;
  waitlist: number;
  fill_percent: number;
  predicted_no_show_percent: number;
  deposit_required: boolean;
  deposit_amount_cents: number;
};

export default function Capacity() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        const response = await apiFetch<{ data: SessionRow[] }>("/capacity/schedule?range=7d");
        if (!active) return;
        setSessions(response.data ?? []);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load schedule");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  const fillData = useMemo(
    () =>
      sessions.slice(0, 6).map((session) => ({
        cls: session.class_type,
        fill: session.fill_percent,
      })),
    [sessions]
  );

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <BarStat data={fillData} title="Class fill %" xKey="cls" yKey="fill" />
        <Card title="Waitlist & no‑shows" subtitle="Predicted vs actual">
          <div className="grid grid-cols-2 gap-3">
            <div className="glass p-4">
              <div className="text-slate-500 text-sm">Avg waitlist</div>
              <div className="text-3xl font-semibold mt-1">
                {sessions.length ? (sessions.reduce((sum, s) => sum + s.waitlist, 0) / sessions.length).toFixed(1) : "0.0"}
              </div>
            </div>
            <div className="glass p-4">
              <div className="text-slate-500 text-sm">Avg no‑show risk</div>
              <div className="text-3xl font-semibold mt-1">
                {sessions.length
                  ? `${(
                      sessions.reduce((sum, s) => sum + s.predicted_no_show_percent, 0) / sessions.length
                    ).toFixed(1)}%`
                  : "0%"}
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">Auto‑backfill is available for sessions with waitlists.</p>
        </Card>
      </div>

      <Card title="Upcoming schedule" subtitle="Live fill & waitlist">
        {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
        <Table
          cols={[
            { key: "class_type", header: "Class" },
            { key: "starts_at", header: "Start" },
            { key: "capacity", header: "Cap" },
            { key: "booked", header: "Booked" },
            { key: "waitlist", header: "Waitlist" },
            { key: "fill_percent", header: "Fill %" },
            { key: "deposit_amount_cents", header: "Deposit",
              render: (_: unknown, row: SessionRow) =>
                row.deposit_required ? (
                  <Badge tone="warn">${(row.deposit_amount_cents / 100).toFixed(0)}</Badge>
                ) : (
                  <span className="text-slate-400">—</span>
                ),
            },
          ]}
          rows={sessions.map((session) => ({
            ...session,
            starts_at: new Date(session.starts_at).toLocaleString(),
          }))}
          loading={loading}
        />
      </Card>
    </div>
  );
}
