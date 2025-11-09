import { FormEvent, useEffect, useState } from "react";
import Card from "../components/Card";
import Table from "../components/Table";
import Button from "../components/Button";
import { apiFetch, isAbortError } from "../api/client";

interface LeadRow {
  id: string;
  first_name: string;
  last_name: string;
  stage: string;
  source: string | null;
  updated_at: string;
  actions: string;
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
  const [copied, setCopied] = useState(false);
  const [memberForm, setMemberForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    timezone: "",
    portal_email: "",
    portal_password: "",
  });
  const [memberSuccess, setMemberSuccess] = useState<string | null>(null);
  const leadFormUrl =
    typeof window !== "undefined" && window.location
      ? `${window.location.origin}/public/leads`
      : "/public/leads";

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        setLoading(true);
        const response = await apiFetch<{ data: { leads: LeadRow[]; analytics: AnalyticsResponse } }>("/crm/overview", {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        setLeads(response.data.leads ?? []);
        setAnalytics(response.data.analytics ?? null);
        setError(null);
      } catch (err) {
        if (isAbortError(err) || controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Failed to load leads");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
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

  async function handleMemberCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMemberSuccess(null);
    try {
      const response = await apiFetch<{
        data: { member: LeadRow; credentials: { email: string; temp_password: string | null } | null };
      }>("/members", {
        method: "POST",
        body: JSON.stringify(memberForm),
      });
      setMemberSuccess(
        response.data.credentials?.temp_password
          ? `Member created. Temporary password: ${response.data.credentials.temp_password}`
          : "Member created."
      );
      setMemberForm({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        timezone: "",
        portal_email: "",
        portal_password: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create member");
    }
  }

  function openLeadForm() {
    window.open("/public/leads", "_blank", "noopener,noreferrer");
  }

  function copyLeadForm() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(leadFormUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }

  return (
    <div className="grid gap-6">
      <Card title="Lead capture form" subtitle="Share this public link with prospects">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-600">Submissions go straight into the pipeline below.</p>
            <code className="mt-2 inline-flex rounded-2xl bg-slate-100 px-3 py-1 text-sm text-slate-700">
              {leadFormUrl}
            </code>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={openLeadForm}>
              Open form
            </Button>
            <button
              type="button"
              onClick={copyLeadForm}
              className="inline-flex items-center rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Copy link
            </button>
          </div>
        </div>
        {copied && <p className="mt-2 text-xs text-emerald-600">Copied! Paste it into your marketing pages.</p>}
      </Card>
      <Card title="Add member" subtitle="One-off enrollments with optional portal login">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleMemberCreate}>
          <label className="text-sm">
            First name
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={memberForm.first_name}
              onChange={(event) => setMemberForm((prev) => ({ ...prev, first_name: event.target.value }))}
              required
            />
          </label>
          <label className="text-sm">
            Last name
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={memberForm.last_name}
              onChange={(event) => setMemberForm((prev) => ({ ...prev, last_name: event.target.value }))}
              required
            />
          </label>
          <label className="text-sm">
            Email
            <input
              type="email"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={memberForm.email}
              onChange={(event) => setMemberForm((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="Optional"
            />
          </label>
          <label className="text-sm">
            Phone
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={memberForm.phone}
              onChange={(event) => setMemberForm((prev) => ({ ...prev, phone: event.target.value }))}
              placeholder="+1 (555) 555-0123"
            />
          </label>
          <label className="text-sm">
            Timezone
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={memberForm.timezone}
              onChange={(event) => setMemberForm((prev) => ({ ...prev, timezone: event.target.value }))}
              placeholder="Defaults to org timezone"
            />
          </label>
          <label className="text-sm">
            Portal email
            <input
              type="email"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={memberForm.portal_email}
              onChange={(event) => setMemberForm((prev) => ({ ...prev, portal_email: event.target.value }))}
              placeholder="Creates login if provided"
            />
          </label>
          <label className="text-sm">
            Portal password
            <input
              type="password"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={memberForm.portal_password}
              onChange={(event) => setMemberForm((prev) => ({ ...prev, portal_password: event.target.value }))}
              placeholder="Leave blank to auto-generate"
            />
          </label>
          <div className="md:col-span-2 flex items-center gap-3">
            <Button type="submit">Create member</Button>
            {memberSuccess && <span className="text-sm text-emerald-600">{memberSuccess}</span>}
          </div>
      </form>
    </Card>
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
