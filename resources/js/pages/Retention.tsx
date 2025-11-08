import { FormEvent, useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import Table from "../components/Table";
import Badge from "../components/Badge";
import Modal from "../components/Modal";
import Button from "../components/Button";
import { apiFetch } from "../api/client";

type HeatmapResponse = { low: number; medium: number; high: number; critical: number };
type RosterRow = {
  member_id: string;
  score: number;
  reasons: { code: string; detail: string }[];
  member: {
    name: string;
    status: string;
    last_check_in_days: number | null;
  };
};

type PlaybookRow = {
  id: string;
  name: string;
  status: string;
  trigger_type: string;
  channel_strategy: Record<string, unknown> | null;
};

type FreezeRequest = {
  id: string;
  member: { id: string; first_name: string; last_name: string } | null;
  requested_on: string;
  status: string;
  reason?: string | null;
};

const defaultHeatmap: HeatmapResponse = { low: 0, medium: 0, high: 0, critical: 0 };

export default function Retention() {
  const [heatmap, setHeatmap] = useState<HeatmapResponse>(defaultHeatmap);
  const [roster, setRoster] = useState<RosterRow[]>([]);
  const [playbooks, setPlaybooks] = useState<PlaybookRow[]>([]);
  const [freezeRequests, setFreezeRequests] = useState<FreezeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("Streak Save");
  const [triggerType, setTriggerType] = useState("no_check_in");
  const [channel, setChannel] = useState("sms");

  const [freezeMemberId, setFreezeMemberId] = useState("");
  const [freezeReason, setFreezeReason] = useState("");
  const [winBackCount, setWinBackCount] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        const [heatmapRes, rosterRes, playbookRes, freezeRes] = await Promise.all([
          apiFetch<{ data: HeatmapResponse }>("/retention/heatmap"),
          apiFetch<{ data: RosterRow[] }>("/retention/at-risk?limit=10"),
          apiFetch<{ data: PlaybookRow[] }>("/playbooks"),
          apiFetch<{ data: FreezeRequest[] }>("/retention/freeze-requests"),
        ]);

        if (!active) return;
        setHeatmap(heatmapRes.data ?? defaultHeatmap);
        setRoster(rosterRes.data ?? []);
        setPlaybooks(playbookRes.data ?? []);
        setFreezeRequests(freezeRes.data ?? []);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load retention data");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  const riskBand = useMemo(
    () => (score: number) => {
      if (score >= 70) return "High" as const;
      if (score >= 40) return "Med" as const;
      return "Low" as const;
    },
    []
  );

  async function handleCreatePlaybook(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const payload = {
        name,
        trigger_type: triggerType,
        trigger_config: triggerType === "no_check_in" ? { days: 7 } : {},
        channel_strategy: {
          primary: channel,
        },
        throttle_rules: {
          max_per_week: 2,
        },
        quiet_hours: {
          start: "21:00",
          end: "08:00",
        },
        description: `${name} automation`,
      };

      const response = await apiFetch<{ data: PlaybookRow }>("/playbooks", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setPlaybooks((existing) => [response.data, ...existing]);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create playbook");
    }
  }

  async function logFreezeRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!freezeMemberId) {
      setError("Member ID is required for freeze rescue.");
      return;
    }

    try {
      await apiFetch(`/retention/members/${freezeMemberId}/freeze-requests`, {
        method: "POST",
        body: JSON.stringify({ reason: freezeReason || undefined }),
      });
      setFreezeMemberId("");
      setFreezeReason("");
      const freezeRes = await apiFetch<{ data: FreezeRequest[] }>("/retention/freeze-requests");
      setFreezeRequests(freezeRes.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log freeze request");
    }
  }

  async function triggerWinBack() {
    setError(null);
    try {
      const response = await apiFetch<{ data: { triggered: number } }>("/retention/win-back/run", {
        method: "POST",
        body: JSON.stringify({ days: 30 }),
      });
      setWinBackCount(response.data.triggered);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to trigger win-back");
    }
  }

  return (
    <div className="grid gap-6">
      <Card title="Churn risk heatmap" subtitle="Auto-segmented by behavior">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Low", count: heatmap.low, tone: "good" as const },
            { label: "Med", count: heatmap.medium, tone: "warn" as const },
            { label: "High", count: heatmap.high, tone: "bad" as const },
            { label: "Critical", count: heatmap.critical, tone: "bad" as const },
          ].map((segment) => (
            <div key={segment.label} className="glass p-4">
              <div className="text-sm text-slate-500">{segment.label}</div>
              <div className="text-2xl font-semibold mt-1">{segment.count}</div>
              <div className="text-xs text-slate-500">members</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card title="At‑risk roster" subtitle="Last 14 days">
          {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
          <Table
            cols={[
              { key: "name", header: "Member" },
              { key: "lastCheckIn", header: "Last check‑in" },
              {
                key: "risk",
                header: "Risk",
                render: (value: "Low" | "Med" | "High") =>
                  value === "High" ? (
                    <Badge tone="bad">High</Badge>
                  ) : value === "Med" ? (
                    <Badge tone="warn">Med</Badge>
                  ) : (
                    <Badge tone="good">Low</Badge>
                  ),
              },
              { key: "reason", header: "Reason" },
            ]}
            rows={roster.map((row) => ({
              id: row.member_id,
              name: row.member.name,
              lastCheckIn:
                row.member.last_check_in_days !== null
                  ? `${row.member.last_check_in_days} days`
                  : "No check-ins",
              risk: riskBand(row.score),
              reason: row.reasons?.[0]?.detail ?? "",
            }))}
            loading={loading}
          />
        </Card>

        <Card title="Playbooks" subtitle="Automated interventions">
          <Table
            cols={[
              { key: "name", header: "Name" },
              { key: "trigger_type", header: "Trigger" },
              {
                key: "channel_strategy",
                header: "Channel",
                render: (value: PlaybookRow["channel_strategy"]) => {
                  const primary = value && typeof value === "object" ? (value as Record<string, unknown>).primary : null;
                  return <span className="text-sm">{primary ?? "—"}</span>;
                },
              },
              {
                key: "status",
                header: "Status",
                render: (value: string) =>
                  value === "active" ? (
                    <Badge tone="good">Active</Badge>
                  ) : value === "paused" ? (
                    <Badge tone="warn">Paused</Badge>
                  ) : (
                    <Badge>Draft</Badge>
                  ),
              },
            ]}
            rows={playbooks.map((playbook) => ({
              ...playbook,
              channel_strategy: playbook.channel_strategy ?? {},
            }))}
            loading={loading}
          />
          <div className="mt-4 flex justify-end">
            <Button onClick={() => setOpen(true)}>New playbook</Button>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card title="Freeze rescue" subtitle="Intercept freeze intent">
          <form className="grid gap-4" onSubmit={logFreezeRequest}>
            <label className="text-sm">
              Member ID
              <input
                className="mt-1 w-full border rounded-lg px-3 py-2"
                value={freezeMemberId}
                onChange={(event) => setFreezeMemberId(event.target.value)}
                placeholder="MEM-123"
              />
            </label>
            <label className="text-sm">
              Reason
              <input
                className="mt-1 w-full border rounded-lg px-3 py-2"
                value={freezeReason}
                onChange={(event) => setFreezeReason(event.target.value)}
                placeholder="Travel, recovery, etc."
              />
            </label>
            <div className="flex justify-end">
              <Button type="submit">Log freeze intent</Button>
            </div>
          </form>
          <Table
            cols={[
              { key: "member", header: "Member" },
              { key: "requested_on", header: "Requested" },
              { key: "status", header: "Status" },
              { key: "reason", header: "Reason" },
            ]}
            rows={freezeRequests.map((req) => ({
              id: req.id,
              member: req.member ? `${req.member.first_name} ${req.member.last_name}` : "—",
              requested_on: req.requested_on,
              status: req.status,
              reason: req.reason ?? "—",
            }))}
            loading={loading}
          />
        </Card>

        <Card title="Win-back <30d" subtitle="Closed members in the last month">
          <div className="flex flex-col gap-3">
            <p className="text-sm text-slate-600">
              Trigger the Win-back playbook for members who canceled within the past 30 days.
            </p>
            <div className="flex items-center gap-3">
              <Button type="button" onClick={triggerWinBack}>
                Run win-back now
              </Button>
              {winBackCount !== null && (
                <span className="text-sm text-slate-600">{winBackCount} members queued.</span>
              )}
            </div>
          </div>
        </Card>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create playbook"
        footer={
          <>
            <button className="px-4 py-2 rounded-lg text-sm" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <Button type="submit" form="playbook-form">
              Save
            </Button>
          </>
        }
      >
        <form id="playbook-form" className="grid gap-4" onSubmit={handleCreatePlaybook}>
          <label className="text-sm">
            Name
            <input
              className="mt-1 w-full border rounded-lg px-3 py-2"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>
          <label className="text-sm">
            Trigger
            <select
              className="mt-1 w-full border rounded-lg px-3 py-2"
              value={triggerType}
              onChange={(event) => setTriggerType(event.target.value)}
            >
              <option value="no_check_in">7 days no check‑in</option>
              <option value="missed_classes">Missed 2 booked classes</option>
              <option value="cancel_recent">Cancel within 30 days</option>
            </select>
          </label>
          <label className="text-sm">
            Channel
            <select
              className="mt-1 w-full border rounded-lg px-3 py-2"
              value={channel}
              onChange={(event) => setChannel(event.target.value)}
            >
              <option value="sms">SMS</option>
              <option value="email">Email</option>
            </select>
          </label>
          <p className="text-xs text-slate-500">
            SMS is convenient but less secure than authenticator apps. Encourage staff to opt into authenticator MFA for
            higher security when sending sensitive offers.
          </p>
        </form>
      </Modal>
    </div>
  );
}
