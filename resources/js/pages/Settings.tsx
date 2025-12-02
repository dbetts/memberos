import { ChangeEvent, FormEvent, MouseEvent, useEffect, useState } from "react";
import Card from "../components/Card";
import Button from "../components/Button";
import Toggle from "../components/Toggle";
import Table from "../components/Table";
import Badge from "../components/Badge";
import TextInput from "../components/TextInput";
import SelectInput from "../components/SelectInput";
import { apiFetch, isAbortError } from "../api/client";
import type { BrandingSettings } from "../types/branding";
import { useBranding } from "../context/BrandingContext";

interface IntegrationRow {
  id: string;
  provider: string;
  status: string;
  last_synced_at: string | null;
}

interface CommunicationPolicy {
  quiet_hours_start: string;
  quiet_hours_end: string;
  default_daily_cap: number;
  default_weekly_cap: number;
  timezone_strategy: string;
  enforce_stop_keywords: boolean;
}

interface MfaPreferences {
  preference: "sms" | "totp";
  enabled: boolean;
  methods: { id: string; type: string; label: string | null; is_primary: boolean; verified_at: string | null }[];
}

type AdminLocation = {
  id: string;
  name: string;
  hours?: Record<string, string> | null;
  deposit_policy?: Record<string, unknown> | null;
  cancellation_window_minutes: number;
  hoursText?: string;
  depositText?: string;
};

type ClassType = {
  id: string;
  name: string;
  description?: string | null;
  default_capacity?: number | null;
};

type StaffProfile = {
  id: string;
  user_id: number;
  organization_id: string;
  title?: string | null;
  is_instructor: boolean;
  bio?: string | null;
  user?: { name: string };
  primary_location?: { name: string } | null;
};

type ObservabilityEvent = {
  id: string;
  event_type: string;
  severity: string;
  context?: Record<string, unknown> | null;
  created_at: string;
};

type ReleaseNote = {
  id: string;
  title: string;
  body: string;
  version?: string | null;
  published_at?: string | null;
};

type SloMetrics = {
  api_p95_ms: number | null;
  web_p95_ms: number | null;
  uptime_percent: number | null;
};

type CommunicationDomain = {
  id: string;
  domain: string;
  status: string;
  spf_record?: string | null;
  dkim_selector?: string | null;
  dkim_value?: string | null;
};

type SmsRegistration = {
  id: string;
  brand_name: string;
  campaign_name: string;
  status: string;
};

type SettingsOverview = {
  organization_id: string;
  integrations: IntegrationRow[];
  policy: CommunicationPolicy | null;
  mfa: MfaPreferences | null;
  locations: AdminLocation[];
  class_types: ClassType[];
  staff: StaffProfile[];
  events: ObservabilityEvent[];
  release_notes: ReleaseNote[];
  slo: SloMetrics | null;
  domains: CommunicationDomain[];
  sms_registrations: SmsRegistration[];
};

const sampleImportPayload = {
  locations: [
    {
      name: "Downtown Studio",
      timezone: "America/Los_Angeles",
      capacity: 30,
    },
  ],
  plans: [
    {
      name: "Unlimited",
      external_id: "UNLIMITED",
      price_cents: 18900,
      currency: "USD",
    },
  ],
  members: [
    {
      first_name: "Jordan",
      last_name: "Lee",
      email: "jordan@example.com",
      phone: "+14155550123",
      status: "active",
      joined_on: "2024-05-01",
      plan_external_id: "UNLIMITED",
      home_location: "Downtown Studio",
      tags: ["streak-break"],
    },
  ],
};

export default function Settings() {
  const { branding, setBranding } = useBranding();
  const [integrations, setIntegrations] = useState<IntegrationRow[]>([]);
  const [policy, setPolicy] = useState<CommunicationPolicy | null>(null);
  const [mfa, setMfa] = useState<MfaPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stopKeywords, setStopKeywords] = useState(true);
  const [quietStart, setQuietStart] = useState("21:00");
  const [quietEnd, setQuietEnd] = useState("08:00");
  const [dailyCap, setDailyCap] = useState(3);
  const [weeklyCap, setWeeklyCap] = useState(12);
  const [timezoneStrategy, setTimezoneStrategy] = useState("member_preference");
  const [policyError, setPolicyError] = useState<string | null>(null);
  const [policySaved, setPolicySaved] = useState(false);
  const [locationsAdmin, setLocationsAdmin] = useState<AdminLocation[]>([]);
  const [classTypes, setClassTypes] = useState<ClassType[]>([]);
  const [staffProfiles, setStaffProfiles] = useState<StaffProfile[]>([]);
  const [classTypeForm, setClassTypeForm] = useState({ name: "", description: "", default_capacity: "" });
  const [events, setEvents] = useState<ObservabilityEvent[]>([]);
  const [notes, setNotes] = useState<ReleaseNote[]>([]);
  const [noteForm, setNoteForm] = useState({ title: "", body: "" });
  const [slo, setSlo] = useState<SloMetrics | null>(null);
  const [domains, setDomains] = useState<CommunicationDomain[]>([]);
  const [domainForm, setDomainForm] = useState({ domain: "", spf_record: "", dkim_selector: "", dkim_value: "" });
  const [smsRegistrations, setSmsRegistrations] = useState<SmsRegistration[]>([]);
  const [smsForm, setSmsForm] = useState({ brand_name: "", campaign_name: "" });
  const [brandingForm, setBrandingForm] = useState({
    name: "",
    support_email: "",
    primary_color: "#4b79ff",
    accent_color: "#2f63ff",
  });
  const [domainSettings, setDomainSettings] = useState({ subdomain: "", custom_domain: "" });
  const [smtpForm, setSmtpForm] = useState({
    host: "",
    port: 587,
    username: "",
    password: "",
    encryption: "tls",
    from_email: "",
    from_name: "",
  });
  const [brandingNotice, setBrandingNotice] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [domainNotice, setDomainNotice] = useState<string | null>(null);
  const [smtpNotice, setSmtpNotice] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<{
    processed: number;
    created: number;
    credentials: { member: string; email: string; temp_password: string | null }[];
  } | null>(null);
  const [importUploading, setImportUploading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const response = await apiFetch<{ data: SettingsOverview }>("/settings/overview", {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        const data = response.data;
        if (data.organization_id) {
          localStorage.setItem("fitflow.orgId", data.organization_id);
        }
        setIntegrations(data.integrations ?? []);
        setPolicy(data.policy ?? null);
        setMfa(data.mfa ?? null);
        if (data.policy) {
          setStopKeywords(data.policy.enforce_stop_keywords ?? true);
          setQuietStart(data.policy.quiet_hours_start);
          setQuietEnd(data.policy.quiet_hours_end);
          setDailyCap(data.policy.default_daily_cap);
          setWeeklyCap(data.policy.default_weekly_cap);
          setTimezoneStrategy(data.policy.timezone_strategy);
        }
        const adminLocations = (data.locations ?? []).map((loc) => ({
          ...loc,
          hoursText: JSON.stringify(loc.hours ?? { mon: "06:00-20:00" }, null, 2),
          depositText: JSON.stringify(loc.deposit_policy ?? { amount: 0 }, null, 2),
        }));
        setLocationsAdmin(adminLocations);
        setClassTypes(data.class_types ?? []);
        setStaffProfiles(data.staff ?? []);
        setEvents(data.events ?? []);
        setNotes(data.release_notes ?? []);
        setSlo(data.slo ?? null);
        setDomains(data.domains ?? []);
        setSmsRegistrations(data.sms_registrations ?? []);
      } catch (err) {
        if (isAbortError(err) || controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Failed to load settings");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (branding) {
      setBrandingForm({
        name: branding.name ?? "",
        support_email: branding.support_email ?? "",
        primary_color: branding.primary_color ?? "#4b79ff",
        accent_color: branding.accent_color ?? "#2f63ff",
      });
      setDomainSettings({
        subdomain: branding.subdomain ?? "",
        custom_domain: branding.custom_domain ?? "",
      });
      setSmtpForm((prev) => ({
        ...prev,
        host: branding.smtp?.host ?? "",
        port: branding.smtp?.port ?? 587,
        username: branding.smtp?.username ?? "",
        encryption: branding.smtp?.encryption ?? "tls",
        from_email: branding.smtp?.from_email ?? branding.support_email ?? "",
        from_name: branding.smtp?.from_name ?? branding.name ?? "",
        password: "",
      }));
    }
  }, [branding]);

  async function saveBrandingSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBrandingNotice(null);
    try {
      const response = await apiFetch<{ data: BrandingSettings }>("/organizations/branding", {
        method: "PUT",
        body: JSON.stringify(brandingForm),
      });
      setBranding(response.data);
      setBrandingNotice("Branding updated.");
    } catch (err) {
      setBrandingNotice(err instanceof Error ? err.message : "Unable to update branding.");
    }
  }

  async function handleLogoChange(event: ChangeEvent<HTMLInputElement>) {
    if (!event.target.files?.length) return;
    setLogoUploading(true);
    const file = event.target.files[0];
    try {
      const formData = new FormData();
      formData.append("logo", file);
      const response = await apiFetch<{ data: BrandingSettings }>("/organizations/branding/logo", {
        method: "POST",
        body: formData,
      });
      setBranding(response.data);
    } catch (err) {
      setBrandingNotice(err instanceof Error ? err.message : "Logo upload failed.");
    } finally {
      setLogoUploading(false);
      event.target.value = "";
    }
  }

  async function saveDomainSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDomainNotice(null);
    try {
      const response = await apiFetch<{ data: BrandingSettings }>("/organizations/domain", {
        method: "PUT",
        body: JSON.stringify(domainSettings),
      });
      setBranding(response.data);
      setDomainNotice("Domain preferences saved.");
    } catch (err) {
      setDomainNotice(err instanceof Error ? err.message : "Unable to save domain preferences.");
    }
  }

  async function saveSmtpSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSmtpNotice(null);
    try {
      const response = await apiFetch<{ data: BrandingSettings }>("/organizations/smtp", {
        method: "PUT",
        body: JSON.stringify(smtpForm),
      });
      setBranding(response.data);
      setSmtpNotice("SMTP settings updated.");
      setSmtpForm((prev) => ({ ...prev, password: "" }));
    } catch (err) {
      setSmtpNotice(err instanceof Error ? err.message : "Unable to update SMTP settings.");
    }
  }

  async function handleImportUpload(event: ChangeEvent<HTMLInputElement>) {
    if (!event.target.files?.length) return;
    setImportUploading(true);
    setImportError(null);
    try {
      const formData = new FormData();
      formData.append("file", event.target.files[0]);
      const response = await apiFetch<{
        data: { processed: number; created: number; credentials: { member: string; email: string; temp_password: string | null }[] };
      }>("/imports/members", {
        method: "POST",
        body: formData,
      });
      setImportSummary(response.data);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setImportUploading(false);
      event.target.value = "";
    }
  }

  async function handleImport() {
    try {
      await apiFetch<{ data: unknown }>("/integrations/mindbody/import", {
        method: "POST",
        body: JSON.stringify(sampleImportPayload),
      });
      const integrationRes = await apiFetch<{ data: IntegrationRow[] }>("/integrations");
      setIntegrations(integrationRes.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    }
  }

  async function handlePolicySubmit(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (!policy) return;

    const normalizeTime = (value: string): string | null => {
      const trimmed = value.trim();
      const fullMatch = trimmed.match(/^(\d{1,2}):([0-5]\d)(?::([0-5]\d))?$/);
      if (fullMatch) {
        const hours = fullMatch[1].padStart(2, "0");
        const minutes = fullMatch[2];
        if (Number(hours) > 23) return null;
        return `${hours}:${minutes}`;
      }

      const meridianMatch = trimmed.match(/^(\d{1,2}):([0-5]\d)\s*(AM|PM)$/i);
      if (meridianMatch) {
        let hours = Number(meridianMatch[1]);
        const minutes = meridianMatch[2];
        const meridian = meridianMatch[3].toUpperCase();
        if (hours === 12) {
          hours = meridian === "AM" ? 0 : 12;
        } else if (meridian === "PM") {
          hours += 12;
        }
        if (hours > 23) return null;
        return `${hours.toString().padStart(2, "0")}:${minutes}`;
      }

      return null;
    };

    const normalizedStart = normalizeTime(quietStart);
    const normalizedEnd = normalizeTime(quietEnd);

    if (!normalizedStart || !normalizedEnd) {
      setPolicySaved(false);
      setPolicyError("Quiet hours must be in HH:MM (24-hour) or h:mm AM/PM format.");
      return;
    }

    setPolicyError(null);
    setPolicySaved(false);

    const payload = {
      quiet_hours_start: normalizedStart,
      quiet_hours_end: normalizedEnd,
      default_daily_cap: dailyCap,
      default_weekly_cap: weeklyCap,
      timezone_strategy: timezoneStrategy,
      enforce_stop_keywords: stopKeywords,
    };

    try {
      const response = await apiFetch<{ data: CommunicationPolicy }>("/communications/policy", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      const updated = response.data;
      setPolicy(updated);
      setQuietStart(updated.quiet_hours_start);
      setQuietEnd(updated.quiet_hours_end);
      setDailyCap(updated.default_daily_cap);
      setWeeklyCap(updated.default_weekly_cap);
      setTimezoneStrategy(updated.timezone_strategy);
      setStopKeywords(updated.enforce_stop_keywords);
      setPolicySaved(true);
    } catch (err) {
      setPolicySaved(false);
      if (err instanceof Error) {
        setPolicyError(err.message);
      } else {
        setPolicyError("Failed to update policy");
      }
    }
  }

  async function handleMfaPreference(preference: "sms" | "totp") {
    try {
      const response = await apiFetch<{ data: MfaPreferences }>("/security/mfa/preferences", {
        method: "PUT",
        body: JSON.stringify({ preference, enabled: true }),
      });
      setMfa(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update MFA preferences");
    }
  }

  async function saveLocation(location: AdminLocation) {
    setError(null);
    try {
      const payload = {
        hours: location.hoursText ? JSON.parse(location.hoursText) : undefined,
        deposit_policy: location.depositText ? JSON.parse(location.depositText) : undefined,
        cancellation_window_minutes: location.cancellation_window_minutes,
      };
      await apiFetch(`/admin/locations/${location.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update location");
    }
  }

  return (
    <div className="grid gap-6">
      <Card title="White-label branding" subtitle="Logo, contact info, and palette gym members will see">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={saveBrandingSettings}>
          <label className="text-sm">
            Brand name
            <TextInput
              className="mt-1"
              value={brandingForm.name}
              onChange={(event) => setBrandingForm((prev) => ({ ...prev, name: event.target.value }))}
            />
          </label>
          <label className="text-sm">
            Support email
            <TextInput
              className="mt-1"
              value={brandingForm.support_email}
              onChange={(event) => setBrandingForm((prev) => ({ ...prev, support_email: event.target.value }))}
            />
          </label>
          <label className="text-sm">
            Primary color
            <TextInput
              type="color"
              className="mt-1 h-11"
              value={brandingForm.primary_color}
              onChange={(event) => setBrandingForm((prev) => ({ ...prev, primary_color: event.target.value }))}
            />
          </label>
          <label className="text-sm">
            Accent color
            <TextInput
              type="color"
              className="mt-1 h-11"
              value={brandingForm.accent_color}
              onChange={(event) => setBrandingForm((prev) => ({ ...prev, accent_color: event.target.value }))}
            />
          </label>
          <div className="md:col-span-2 flex items-center gap-3">
            <Button type="submit">Save theme</Button>
            {brandingNotice && <span className="text-sm text-emerald-600">{brandingNotice}</span>}
          </div>
        </form>
        <div className="mt-6 border-t border-slate-100 pt-4">
          <p className="text-sm font-semibold text-slate-700">Logo</p>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            {branding?.logo_url && (
              <img src={branding.logo_url} alt="Brand logo" className="h-16 w-16 rounded-2xl border border-slate-200 bg-white object-contain" />
            )}
            <label className="text-sm font-medium text-brand-600 cursor-pointer">
              <TextInput
                type="file"
                className="hidden border-0 p-0"
                accept="image/*"
                onChange={handleLogoChange}
                disabled={logoUploading}
              />
              {logoUploading ? "Uploading…" : "Upload logo"}
            </label>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Domain & routing" subtitle="FitFlow subdomain or branded domain for your team">
          <form className="grid gap-4" onSubmit={saveDomainSettings}>
            <label className="text-sm">
              FitFlow subdomain
              <div className="mt-1 flex items-center gap-2">
                <TextInput
                  className="w-full"
                  value={domainSettings.subdomain}
                  onChange={(event) => setDomainSettings((prev) => ({ ...prev, subdomain: event.target.value }))}
                  placeholder="mygym"
                />
                <span className="text-xs text-slate-500">.fitflow.app</span>
              </div>
            </label>
            <label className="text-sm">
              Custom domain
              <TextInput
                className="mt-1"
                value={domainSettings.custom_domain}
                onChange={(event) => setDomainSettings((prev) => ({ ...prev, custom_domain: event.target.value }))}
                placeholder="members.yourclub.com"
              />
            </label>
            <div className="flex items-center gap-3">
              <Button type="submit">Save domain</Button>
              {domainNotice && <span className="text-sm text-emerald-600">{domainNotice}</span>}
            </div>
          </form>
        </Card>

        <Card title="SMTP & email identity" subtitle="Use your sending reputation and reply-to inbox">
          <form className="grid gap-4" onSubmit={saveSmtpSettings}>
            <label className="text-sm">
              Host
              <TextInput
                className="mt-1"
                value={smtpForm.host}
                onChange={(event) => setSmtpForm((prev) => ({ ...prev, host: event.target.value }))}
                required
              />
            </label>
            <label className="text-sm">
              Port
              <TextInput
                type="number"
                className="mt-1"
                value={smtpForm.port}
                onChange={(event) => setSmtpForm((prev) => ({ ...prev, port: Number(event.target.value) }))}
                required
              />
            </label>
            <label className="text-sm">
              Username
              <TextInput
                className="mt-1"
                value={smtpForm.username}
                onChange={(event) => setSmtpForm((prev) => ({ ...prev, username: event.target.value }))}
              />
            </label>
            <label className="text-sm">
              Password
              <TextInput
                type="password"
                className="mt-1"
                value={smtpForm.password}
                onChange={(event) => setSmtpForm((prev) => ({ ...prev, password: event.target.value }))}
                placeholder={branding?.smtp?.has_password ? "••••••••" : ""}
              />
            </label>
            <label className="text-sm">
              Encryption
              <SelectInput
                className="mt-1"
                value={smtpForm.encryption}
                onChange={(event) => setSmtpForm((prev) => ({ ...prev, encryption: event.target.value }))}
              >
                <option value="tls">TLS</option>
                <option value="ssl">SSL</option>
                <option value="starttls">STARTTLS</option>
                <option value="none">None</option>
              </SelectInput>
            </label>
            <label className="text-sm">
              From name
              <TextInput
                className="mt-1"
                value={smtpForm.from_name}
                onChange={(event) => setSmtpForm((prev) => ({ ...prev, from_name: event.target.value }))}
              />
            </label>
            <label className="text-sm">
              From email
              <TextInput
                className="mt-1"
                value={smtpForm.from_email}
                onChange={(event) => setSmtpForm((prev) => ({ ...prev, from_email: event.target.value }))}
              />
            </label>
            <div className="flex items-center gap-3">
              <Button type="submit">Save SMTP settings</Button>
              {smtpNotice && <span className="text-sm text-emerald-600">{smtpNotice}</span>}
            </div>
          </form>
        </Card>
      </div>

      <Card title="Customer import" subtitle="Upload a CSV of members, leads, or alumni">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            CSV headers supported: <code>first_name</code>, <code>last_name</code>, <code>email</code>, <code>phone</code>,{" "}
            <code>status</code>, <code>timezone</code>. We will provision member portal logins for any row containing an email.
          </p>
          <TextInput
            type="file"
            accept=".csv,text/csv"
            onChange={handleImportUpload}
            disabled={importUploading}
            className="rounded-xl border-dashed border-slate-300 px-4 py-6 text-sm text-slate-600"
          />
          {importError && <p className="text-sm text-rose-600">{importError}</p>}
          {importSummary && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                Processed {importSummary.processed} rows · created {importSummary.created} members.
              </p>
              {importSummary.credentials.length > 0 && (
                <Table
                  cols={[
                    { key: "member", header: "Member" },
                    { key: "email", header: "Email" },
                    { key: "temp_password", header: "Temp password" },
                  ]}
                  rows={importSummary.credentials}
                />
              )}
            </div>
          )}
        </div>
      </Card>

      <Card title="Integrations" subtitle="Connect your stack">
        {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
        <Table
          cols={[
            { key: "provider", header: "Provider" },
            {
              key: "status",
              header: "Status",
              render: (value: string) =>
                value === "connected" ? <Badge tone="good">Connected</Badge> : <Badge>{value}</Badge>,
            },
            { key: "last_synced_at", header: "Last synced" },
          ]}
          rows={integrations.map((integration) => ({
            ...integration,
            last_synced_at: integration.last_synced_at ?? "Never",
          }))}
          loading={loading}
        />
        <div className="mt-4 flex justify-end">
          <Button onClick={handleImport}>Run Mindbody mock import</Button>
        </div>
      </Card>

      {policy && (
        <Card title="Communication policy" subtitle="Quiet hours & send caps">
          <div className="grid md:grid-cols-2 gap-6">
            <label className="text-sm">
              Quiet hours start
              <TextInput
                name="quiet_hours_start"
                type="time"
                value={quietStart}
                className="mt-1"
                onChange={(event) => setQuietStart(event.target.value)}
              />
            </label>
            <label className="text-sm">
              Quiet hours end
              <TextInput
                name="quiet_hours_end"
                type="time"
                value={quietEnd}
                className="mt-1"
                onChange={(event) => setQuietEnd(event.target.value)}
              />
            </label>
            <label className="text-sm">
              Daily send cap
              <TextInput
                name="daily_cap"
                type="number"
                min={0}
                value={dailyCap}
                className="mt-1"
                onChange={(event) => setDailyCap(Number(event.target.value))}
              />
            </label>
            <label className="text-sm">
              Weekly send cap
              <TextInput
                name="weekly_cap"
                type="number"
                min={0}
                value={weeklyCap}
                className="mt-1"
                onChange={(event) => setWeeklyCap(Number(event.target.value))}
              />
            </label>
            <label className="text-sm">
              Timezone strategy
              <SelectInput
                name="timezone"
                value={timezoneStrategy}
                className="mt-1"
                onChange={(event) => setTimezoneStrategy(event.target.value)}
              >
                <option value="member_preference">Member timezone</option>
                <option value="organization">Organization timezone</option>
              </SelectInput>
            </label>
            <div className="text-sm flex items-center justify-between border rounded-lg px-4 py-3">
              <div>
                <div className="font-medium">Respect STOP keywords</div>
                <div className="text-xs text-slate-500">Required for SMS compliance (STOP, UNSUBSCRIBE, CANCEL)</div>
              </div>
              <Toggle checked={stopKeywords} onChange={setStopKeywords} />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button type="button" onClick={handlePolicySubmit}>
                Save policy
              </Button>
            </div>
            {policyError && (
              <div className="md:col-span-2 text-sm text-red-600">{policyError}</div>
            )}
            {policySaved && !policyError && (
              <div className="md:col-span-2 text-sm text-emerald-600">Policy updated.</div>
            )}
          </div>
        </Card>
      )}

      {mfa && (
        <Card title="Multi-factor authentication" subtitle="Encourage authenticator apps for staff">
          <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
            <div>
              <div className="font-medium">Preferred method</div>
              <div className="text-sm text-slate-500">
                Authenticator apps provide stronger security than SMS. SMS remains available for convenience.
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                tone={mfa.preference === "totp" ? "primary" : "neutral"}
                onClick={() => handleMfaPreference("totp")}
              >
                Authenticator app
              </Button>
              <Button
                tone={mfa.preference === "sms" ? "primary" : "neutral"}
                onClick={() => handleMfaPreference("sms")}
              >
                SMS backup
              </Button>
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-500">
            Registered methods: {mfa.methods.length === 0 ? "none" : mfa.methods.map((method) => method.type).join(", ")}
          </div>
        </Card>
      )}

      <Card title="Locations" subtitle="Hours, deposits, cancellation">
        <div className="space-y-4">
          {locationsAdmin.map((loc) => (
            <div key={loc.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{loc.name}</div>
                  <div className="text-xs text-slate-500">Cancellation window (minutes)</div>
                </div>
                <TextInput
                  type="number"
                  className="w-28 px-2 py-1 text-sm"
                  value={loc.cancellation_window_minutes}
                  onChange={(event) =>
                    setLocationsAdmin((prev) =>
                      prev.map((item) =>
                        item.id === loc.id
                          ? { ...item, cancellation_window_minutes: Number(event.target.value) }
                          : item
                      )
                    )
                  }
                />
              </div>
              <label className="text-xs text-slate-500">
                Hours JSON
                <textarea
                  className="mt-1 w-full border rounded-lg px-2 py-1 text-xs"
                  rows={3}
                  value={loc.hoursText ?? ""}
                  onChange={(event) =>
                    setLocationsAdmin((prev) =>
                      prev.map((item) => (item.id === loc.id ? { ...item, hoursText: event.target.value } : item))
                    )
                  }
                />
              </label>
              <label className="text-xs text-slate-500">
                Deposit policy JSON
                <textarea
                  className="mt-1 w-full border rounded-lg px-2 py-1 text-xs"
                  rows={2}
                  value={loc.depositText ?? ""}
                  onChange={(event) =>
                    setLocationsAdmin((prev) =>
                      prev.map((item) => (item.id === loc.id ? { ...item, depositText: event.target.value } : item))
                    )
                  }
                />
              </label>
              <div className="text-right">
                <Button type="button" onClick={() => saveLocation(loc)}>
                  Save
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Class types" subtitle="Programs & capacities">
        <form
          className="grid md:grid-cols-3 gap-3"
          onSubmit={async (event) => {
            event.preventDefault();
            try {
              const payload = {
                name: classTypeForm.name,
                description: classTypeForm.description || undefined,
                default_capacity: classTypeForm.default_capacity
                  ? Number(classTypeForm.default_capacity)
                  : undefined,
              };
              const response = await apiFetch<{ data: ClassType }>("/admin/class-types", {
                method: "POST",
                body: JSON.stringify(payload),
              });
              setClassTypes((prev) => [...prev, response.data]);
              setClassTypeForm({ name: "", description: "", default_capacity: "" });
            } catch (err) {
              setError(err instanceof Error ? err.message : "Failed to add class type");
            }
          }}
        >
          <TextInput
            className="border rounded-lg px-3 py-2"
            placeholder="Name"
            value={classTypeForm.name}
            onChange={(event) => setClassTypeForm((prev) => ({ ...prev, name: event.target.value }))}
            required
          />
          <TextInput
            className="border rounded-lg px-3 py-2"
            placeholder="Description"
            value={classTypeForm.description}
            onChange={(event) => setClassTypeForm((prev) => ({ ...prev, description: event.target.value }))}
          />
          <div className="flex gap-2">
            <TextInput
              className="flex-1 border rounded-lg px-3 py-2"
              placeholder="Capacity"
              value={classTypeForm.default_capacity}
              onChange={(event) => setClassTypeForm((prev) => ({ ...prev, default_capacity: event.target.value }))}
            />
            <Button type="submit">Add</Button>
          </div>
        </form>
        <Table
          cols={[
            { key: "name", header: "Name" },
            { key: "description", header: "Description" },
            { key: "default_capacity", header: "Cap" },
          ]}
          rows={classTypes}
          loading={loading}
        />
      </Card>

      <Card title="Staff & instructors" subtitle="Roles, bios, certifications">
        <Table
          cols={[
            { key: "name", header: "Name" },
            { key: "title", header: "Title" },
            { key: "location", header: "Home location" },
            { key: "instructor", header: "Instructor" },
          ]}
          rows={staffProfiles.map((staff) => ({
            id: staff.id,
            name: staff.user?.name ?? "Unknown",
            title: staff.title ?? "—",
            location: staff.primary_location?.name ?? "All",
            instructor: staff.is_instructor ? <Badge tone="good">Yes</Badge> : <Badge>No</Badge>,
          }))}
          loading={loading}
        />
      </Card>

      <Card title="Observability" subtitle="Events & release notes">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="font-medium text-slate-700 mb-2">Recent events</div>
            {slo && (
              <div className="grid grid-cols-3 gap-2 text-sm text-slate-800 mb-3">
                <div>
                  <div className="text-xs text-slate-500">API p95</div>
                  <div className="font-semibold">{slo.api_p95_ms ?? "–"} ms</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">UI p95</div>
                  <div className="font-semibold">{slo.web_p95_ms ?? "–"} ms</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Uptime</div>
                  <div className="font-semibold">{slo.uptime_percent ?? "–"}%</div>
                </div>
              </div>
            )}
            <Table
              cols={[
                { key: "event_type", header: "Type" },
                { key: "severity", header: "Severity" },
                { key: "created_at", header: "When" },
              ]}
              rows={events.map((event) => ({
                ...event,
                created_at: new Date(event.created_at).toLocaleString(),
              }))}
              loading={loading}
            />
          </div>
          <div>
            <div className="font-medium text-slate-700 mb-2">Release notes</div>
            <form
              className="grid gap-3"
              onSubmit={async (event) => {
                event.preventDefault();
                try {
                  const response = await apiFetch<{ data: ReleaseNote }>("/observability/release-notes", {
                    method: "POST",
                    body: JSON.stringify(noteForm),
                  });
                  setNotes((prev) => [response.data, ...prev]);
                  setNoteForm({ title: "", body: "" });
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Failed to publish note");
                }
              }}
            >
              <TextInput
                className="border rounded-lg px-3 py-2"
                placeholder="Title"
                value={noteForm.title}
                onChange={(event) => setNoteForm((prev) => ({ ...prev, title: event.target.value }))}
                required
              />
              <textarea
                className="border rounded-lg px-3 py-2"
                rows={3}
                placeholder="Body"
                value={noteForm.body}
                onChange={(event) => setNoteForm((prev) => ({ ...prev, body: event.target.value }))}
                required
              />
              <Button type="submit">Publish</Button>
            </form>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {notes.map((note) => (
                <li key={note.id} className="border rounded-lg px-3 py-2 bg-slate-50">
                  <div className="font-semibold">{note.title}</div>
                  <div className="text-xs text-slate-500">
                    {note.published_at ? new Date(note.published_at).toLocaleDateString() : "Draft"}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      <Card title="Compliance" subtitle="Domain auth & SMS registrations">
        <div className="grid gap-4">
          <form
            className="grid md:grid-cols-4 gap-3"
            onSubmit={async (event) => {
              event.preventDefault();
              try {
                const response = await apiFetch<{ data: CommunicationDomain }>("/compliance/domains", {
                  method: "POST",
                  body: JSON.stringify(domainForm),
                });
                setDomains((prev) => [...prev, response.data]);
                setDomainForm({ domain: "", spf_record: "", dkim_selector: "", dkim_value: "" });
              } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to add domain");
              }
            }}
          >
            <TextInput
              className="border rounded-lg px-3 py-2"
              placeholder="Domain"
              value={domainForm.domain}
              onChange={(event) => setDomainForm((prev) => ({ ...prev, domain: event.target.value }))}
              required
            />
            <TextInput
              className="border rounded-lg px-3 py-2"
              placeholder="SPF record"
              value={domainForm.spf_record}
              onChange={(event) => setDomainForm((prev) => ({ ...prev, spf_record: event.target.value }))}
            />
            <TextInput
              className="border rounded-lg px-3 py-2"
              placeholder="DKIM selector"
              value={domainForm.dkim_selector}
              onChange={(event) => setDomainForm((prev) => ({ ...prev, dkim_selector: event.target.value }))}
            />
            <TextInput
              className="border rounded-lg px-3 py-2"
              placeholder="DKIM value"
              value={domainForm.dkim_value}
              onChange={(event) => setDomainForm((prev) => ({ ...prev, dkim_value: event.target.value }))}
            />
            <div className="md:col-span-4 flex justify-end">
              <Button type="submit">Add domain</Button>
            </div>
          </form>

          <Table
            cols={[
              { key: "domain", header: "Domain" },
              { key: "status", header: "Status" },
              { key: "spf_record", header: "SPF" },
            ]}
            rows={domains}
            loading={loading}
          />

          <form
            className="grid md:grid-cols-3 gap-3"
            onSubmit={async (event) => {
              event.preventDefault();
              try {
                const response = await apiFetch<{ data: SmsRegistration }>("/compliance/sms", {
                  method: "POST",
                  body: JSON.stringify(smsForm),
                });
                setSmsRegistrations((prev) => [...prev, response.data]);
                setSmsForm({ brand_name: "", campaign_name: "" });
              } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to add registration");
              }
            }}
          >
            <TextInput
              className="border rounded-lg px-3 py-2"
              placeholder="Brand name"
              value={smsForm.brand_name}
              onChange={(event) => setSmsForm((prev) => ({ ...prev, brand_name: event.target.value }))}
              required
            />
            <TextInput
              className="border rounded-lg px-3 py-2"
              placeholder="Campaign name"
              value={smsForm.campaign_name}
              onChange={(event) => setSmsForm((prev) => ({ ...prev, campaign_name: event.target.value }))}
              required
            />
            <div className="flex justify-end items-center">
              <Button type="submit">Add campaign</Button>
            </div>
          </form>

          <Table
            cols={[
              { key: "brand_name", header: "Brand" },
              { key: "campaign_name", header: "Campaign" },
              { key: "status", header: "Status" },
            ]}
            rows={smsRegistrations}
            loading={loading}
          />
        </div>
      </Card>
    </div>
  );
}
