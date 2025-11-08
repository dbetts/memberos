import { useEffect, useState } from "react";
import Card from "../components/Card";
import Table from "../components/Table";
import Button from "../components/Button";
import { apiFetch } from "../api/client";

interface LeadRow {
  id: string;
  first_name: string;
  last_name: string;
  stage: string;
  source: string | null;
  updated_at: string;
}

type AnalyticsResponse = {
  overview: {
    total: number;
    trial: number;
    close: number;
    lead_to_trial: number;
    trial_to_join: number;
  };
  sources: Record<string, { total: number; trial: number; close: number; lead_to_trial: number; trial_to_join: number }>;
  locations: Record<string, { total: number; close: number; conversion: number }>;
};

export default function CRM() {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        const [leadRes, analyticsRes] = await Promise.all([
          apiFetch<{ data: LeadRow[] }>("/crm/leads"),
          apiFetch<{ data: AnalyticsResponse }>("/crm/analytics"),
        ]);
        if (!active) return;
        setLeads(leadRes.data ?? []);
        setAnalytics(analyticsRes.data ?? null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load leads");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  async function convertLead(id: string) {
    try {
      await apiFetch(`/crm/leads/${id}/convert`, { method: "POST" });
      setLeads((prev) => prev.filter((lead) => lead.id !== id));
      const analyticsRes = await apiFetch<{ data: AnalyticsResponse }>("/crm/analytics");
      setAnalytics(analyticsRes.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Conversion failed");
    }
  }

  return (
    <div className="grid gap-6">
      {analytics && (
        <Card title="Funnel" subtitle="Lead quality & throughput">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass p-4">
              <div className="text-xs text-slate-500">Total leads</div>
              <div className="text-2xl font-semibold">{analytics.overview.total}</div>
            </div>
            <div className="glass p-4">
              <div className="text-xs text-slate-500">Lead → Trial</div>
              <div className="text-2xl font-semibold">{analytics.overview.lead_to_trial}%</div>
            </div>
            <div className="glass p-4">
              <div className="text-xs text-slate-500">Trial → Join</div>
              <div className="text-2xl font-semibold">{analytics.overview.trial_to_join}%</div>
            </div>
            <div className="glass p-4">
              <div className="text-xs text-slate-500">Closed</div>
              <div className="text-2xl font-semibold">{analytics.overview.close}</div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-slate-700 mb-2">By source</div>
              <Table
                cols={[
                  { key: "source", header: "Source" },
                  { key: "total", header: "Leads" },
                  { key: "lead_to_trial", header: "Lead→Trial %" },
                  { key: "trial_to_join", header: "Trial→Join %" },
                ]}
                rows={Object.entries(analytics.sources).map(([source, data]) => ({
                  source,
                  total: data.total,
                  lead_to_trial: `${data.lead_to_trial}%`,
                  trial_to_join: `${data.trial_to_join}%`,
                }))}
              />
            </div>
            <div>
              <div className="text-sm font-medium text-slate-700 mb-2">By location</div>
              <Table
                cols={[
                  { key: "location", header: "Location" },
                  { key: "total", header: "Leads" },
                  { key: "conversion", header: "Conversion %" },
                ]}
                rows={Object.entries(analytics.locations).map(([location, data]) => ({
                  location,
                  total: data.total,
                  conversion: `${data.conversion}%`,
                }))}
              />
            </div>
          </div>
        </Card>
      )}
      <Card title="Pipeline" subtitle="Lead → Trial → Close">
        {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
        <Table
          cols={[
            { key: "name", header: "Lead" },
            { key: "stage", header: "Stage" },
            { key: "source", header: "Source" },
            { key: "updated_at", header: "Updated" },
            {
              key: "actions",
              header: "",
              render: (_: unknown, row: any) => (
                <Button type="button" onClick={() => convertLead(row.id)}>
                  Convert
                </Button>
              ),
            },
          ]}
          rows={leads.map((lead) => ({
            ...lead,
            name: `${lead.first_name} ${lead.last_name}`,
            updated_at: new Date(lead.updated_at).toLocaleString(),
          }))}
          loading={loading}
        />
      </Card>
    </div>
  );
}
