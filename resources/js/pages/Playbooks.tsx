import { useEffect, useState } from "react";
import Card from "../components/Card";
import Table from "../components/Table";
import Badge from "../components/Badge";
import Button from "../components/Button";
import { apiFetch, isAbortError } from "../api/client";

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

interface PlaybooksOverview {
  playbooks: PlaybookRow[];
  templates: TemplateRow[];
}

export default function Playbooks() {
  const [playbooks, setPlaybooks] = useState<PlaybookRow[]>([]);
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        const response = await apiFetch<{ data: PlaybooksOverview }>("/playbooks/overview", {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        setPlaybooks(response.data.playbooks ?? []);
        setTemplates(response.data.templates ?? []);
        setError(null);
      } catch (err) {
        if (isAbortError(err) || controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Failed to load playbooks");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => controller.abort();
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
