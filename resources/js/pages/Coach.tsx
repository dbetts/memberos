import { useEffect, useState } from "react";
import Card from "../components/Card";
import Table from "../components/Table";
import Badge from "../components/Badge";
import Button from "../components/Button";
import { apiFetch } from "../api/client";

interface RosterResponse {
  heatmap: Record<string, number>;
  members: Array<{
    member_id: string;
    name: string;
    class_type?: string;
    starts_at?: string;
    risk_score: number;
    risk_band: string;
  }>;
}

interface ClassTypeOption {
  id: string;
  name: string;
}

export default function Coach() {
  const [classTypes, setClassTypes] = useState<ClassTypeOption[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [roster, setRoster] = useState<RosterResponse | null>(null);
  const [nudgeBody, setNudgeBody] = useState("We opened a spot for tonight—want it?");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [outcomeTitle, setOutcomeTitle] = useState("Logged RPE 7/10");
  const [outcomeNotes, setOutcomeNotes] = useState("");
  const [outcomeType, setOutcomeType] = useState("outcome");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [types, rosterRes] = await Promise.all([
          apiFetch<{ data: ClassTypeOption[] }>("/admin/class-types"),
          apiFetch<{ data: RosterResponse }>("/coach/roster"),
        ]);
        setClassTypes(types.data ?? []);
        setRoster(rosterRes.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load coach console");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function applyFilter(classType: string) {
    setSelectedClass(classType);
    setLoading(true);
    try {
      const rosterRes = await apiFetch<{ data: RosterResponse }>(
        classType ? `/coach/roster?class_type=${classType}` : "/coach/roster"
      );
      setRoster(rosterRes.data);
      setSelectedMembers([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load roster");
    } finally {
      setLoading(false);
    }
  }

  async function sendNudges() {
    if (selectedMembers.length === 0) return;
    try {
      await apiFetch("/coach/nudges", {
        method: "POST",
        body: JSON.stringify({ member_ids: selectedMembers, channel: "sms", body: nudgeBody }),
      });
      setSelectedMembers([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send nudge");
    }
  }

  return (
    <div className="grid gap-6">
      <Card title="Roster heatmap" subtitle="Sort by program/class">
        <div className="flex flex-wrap gap-3 mb-4">
          <select
            className="border rounded-lg px-3 py-2"
            value={selectedClass}
            onChange={(event) => applyFilter(event.target.value)}
          >
            <option value="">All classes</option>
            {classTypes.map((type) => (
              <option key={type.id} value={type.name}>
                {type.name}
              </option>
            ))}
          </select>
          <div className="flex gap-2 text-sm text-slate-500">
            {Object.entries(roster?.heatmap ?? {}).map(([band, count]) => (
              <span key={band}>
                {band}: {count}
              </span>
            ))}
          </div>
        </div>
        <Table
          cols={[
            {
              key: "select",
              header: "",
              render: (_: unknown, row: any) => (
                <input
                  type="checkbox"
                  checked={selectedMembers.includes(row.member_id)}
                  onChange={(event) =>
                    setSelectedMembers((prev) =>
                      event.target.checked ? [...prev, row.member_id] : prev.filter((id) => id !== row.member_id)
                    )
                  }
                />
              ),
            },
            { key: "name", header: "Member" },
            { key: "class_type", header: "Class" },
            {
              key: "risk_band",
              header: "Risk",
              render: (value: string) =>
                value === "High" ? (
                  <Badge tone="bad">High</Badge>
                ) : value === "Med" ? (
                  <Badge tone="warn">Med</Badge>
                ) : (
                  <Badge tone="good">Low</Badge>
                ),
            },
            { key: "starts_at", header: "Next session" },
          ]}
          rows={(roster?.members ?? []).map((member) => ({
            ...member,
            starts_at: member.starts_at ? new Date(member.starts_at).toLocaleString() : "—",
          }))}
          loading={loading}
        />
      </Card>

      <Card title="Quick nudge" subtitle="Send a personal note">
        <div className="grid gap-3">
          <textarea
            className="border rounded-lg px-3 py-2"
            rows={3}
            value={nudgeBody}
            onChange={(event) => setNudgeBody(event.target.value)}
          />
          <div className="flex justify-between items-center text-sm text-slate-500">
            <span>{selectedMembers.length} members selected</span>
            <Button type="button" onClick={sendNudges} disabled={selectedMembers.length === 0}>
              Send SMS
            </Button>
          </div>
        </div>
      </Card>

      <Card title="Log outcome" subtitle="Track PRs, adherence, RPE">
        <form
          className="grid md:grid-cols-3 gap-3"
          onSubmit={async (event) => {
            event.preventDefault();
            if (selectedMembers.length === 0) {
              setError("Select at least one member to log an outcome.");
              return;
            }
            try {
              await apiFetch(`/coach/members/${selectedMembers[0]}/outcomes`, {
                method: "POST",
                body: JSON.stringify({ title: outcomeTitle, description: outcomeNotes, type: outcomeType }),
              });
              setOutcomeNotes("");
            } catch (err) {
              setError(err instanceof Error ? err.message : "Failed to log outcome");
            }
          }}
        >
          <input
            className="border rounded-lg px-3 py-2"
            placeholder="Outcome title"
            value={outcomeTitle}
            onChange={(event) => setOutcomeTitle(event.target.value)}
            required
          />
          <input
            className="border rounded-lg px-3 py-2"
            placeholder="Notes"
            value={outcomeNotes}
            onChange={(event) => setOutcomeNotes(event.target.value)}
          />
          <select
            className="border rounded-lg px-3 py-2"
            value={outcomeType}
            onChange={(event) => setOutcomeType(event.target.value)}
          >
            <option value="outcome">Outcome</option>
            <option value="goal">Goal</option>
          </select>
          <div className="md:col-span-3 flex justify-between items-center text-sm text-slate-500">
            <span>{selectedMembers[0] ? `Logging for ${selectedMembers[0]}` : "Select a member above"}</span>
            <Button type="submit" disabled={selectedMembers.length === 0}>
              Log entry
            </Button>
          </div>
        </form>
      </Card>

      {error && <div className="text-sm text-red-600">{error}</div>}
    </div>
  );
}
