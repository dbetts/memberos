import { useEffect, useState } from "react";
import Card from "../components/Card";
import Table from "../components/Table";
import Badge from "../components/Badge";
import Button from "../components/Button";
import { apiFetch } from "../api/client";

interface PlaybookRow {
  id: string;
  name: string;
  trigger_type: string;
  status: string;
  audience_filter?: Record<string, unknown> | null;
  channel_strategy?: Record<string, unknown> | null;
}

interface TemplateRow {
  id: string;
  name: string;
  channel: "sms" | "email";
  content_text?: string | null;
  content_html?: string | null;
}

export default function Playbooks() {
  const [playbooks, setPlaybooks] = useState<PlaybookRow[]>([]);
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        const [playbookRes, templateRes] = await Promise.all([
          apiFetch<{ data: PlaybookRow[] }>("/playbooks"),
          apiFetch<{ data: TemplateRow[] }>("/templates"),
        ]);

        if (!active) return;
        setPlaybooks(playbookRes.data ?? []);
        setTemplates(templateRes.data ?? []);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load playbooks");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="grid gap-6">
      <Card
        title="Automation Playbooks"
        subtitle="Always‑on nudges & offers"
        right={<Button onClick={() => setError("Builder coming soon")}>
          New playbook
        </Button>}
      >
        {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
        <Table
          cols={[
            { key: "name", header: "Name" },
            { key: "trigger_type", header: "Trigger" },
            {
              key: "channel_strategy",
              header: "Channel",
              render: (value: PlaybookRow["channel_strategy"]) => {
                if (!value || typeof value !== "object") return "—";
                const strategy = value as Record<string, unknown>;
                return (strategy.primary as string) ?? "—";
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
      </Card>

      <Card title="Templates" subtitle="SMS & Email">
        <div className="grid md:grid-cols-2 gap-4">
          {templates.map((template) => (
            <div key={template.id} className="card p-4">
              <div className="text-sm text-slate-500">
                {template.channel.toUpperCase()}: {template.name}
              </div>
              <p className="mt-2 text-slate-700 text-sm">
                {template.channel === "email" && template.content_html
                  ? template.content_html.replace(/<[^>]+>/g, "")
                  : template.content_text ?? "No preview available"}
              </p>
            </div>
          ))}
          {templates.length === 0 && !loading && (
            <div className="text-sm text-slate-500">No templates yet. Create one in communications settings.</div>
          )}
        </div>
      </Card>
    </div>
  );
}
