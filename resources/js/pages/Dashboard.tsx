import { useCallback, useEffect, useMemo, useState } from "react";
import { Info } from "lucide-react";
import Card from "../components/Card";
import Badge from "../components/Badge";
import Table from "../components/Table";
import Button from "../components/Button";
import { LineStat } from "../components/ChartCard";
import { apiFetch } from "../api/client";
import { retentionSeries, classes } from "../data/mock";

export type DashboardMetric = { key: string; label: string; value: string; delta?: string; good?: boolean };
export type AtRiskRow = {
  member_id: string;
  score: number;
  reasons: { code: string; detail: string }[];
  member: {
    name: string;
    status: string;
    last_check_in_days: number | null;
  };
};

type FilterOptions = {
  locations: { id: string; name: string }[];
  class_types: string[];
  instructors: { id: string; name: string }[];
  plans: { id: string; name: string }[];
  sources: string[];
  join_months: string[];
};

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetric[]>([]);
  const [atRisk, setAtRisk] = useState<AtRiskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [filters, setFilters] = useState({
    location_id: "",
    class_type: "",
    instructor_id: "",
    plan_id: "",
    source: "",
    join_month: "",
  });

  const loadMetrics = useCallback(async () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });

    const query = params.toString() ? `?${params.toString()}` : "";
    const [kpiResponse, riskResponse] = await Promise.all([
      apiFetch<{ data: DashboardMetric[] }>(`/dashboard/kpis${query}`),
      apiFetch<{ data: AtRiskRow[] }>("/retention/at-risk?limit=8"),
    ]);
    setMetrics(kpiResponse.data);
    setAtRisk(riskResponse.data);
  }, [filters]);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const filterRes = await apiFetch<{ data: FilterOptions }>("/dashboard/filters");
        if (active) setFilterOptions(filterRes.data);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function run() {
      try {
        setLoading(true);
        await loadMetrics();
        if (active) setError(null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        if (active) setLoading(false);
      }
    }

    run();
    return () => {
      active = false;
    };
  }, [loadMetrics]);

  const resolveRiskBand = useMemo(
    () => (score: number) => {
      if (score >= 70) return "High" as const;
      if (score >= 40) return "Med" as const;
      return "Low" as const;
    },
    []
  );

  function handleFilterChange(key: keyof typeof filters, value: string) {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function clearFilters() {
    setFilters({
      location_id: "",
      class_type: "",
      instructor_id: "",
      plan_id: "",
      source: "",
      join_month: "",
    });
  }

  return (
    <div className="grid gap-6">
      <Card title="Segments" subtitle="Filter KPIs by cohort">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="text-xs text-slate-500">
            Location
            <select
              className="mt-1 w-full border rounded-lg px-3 py-2"
              value={filters.location_id}
              onChange={(event) => handleFilterChange("location_id", event.target.value)}
            >
              <option value="">All</option>
              {filterOptions?.locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-500">
            Class type
            <select
              className="mt-1 w-full border rounded-lg px-3 py-2"
              value={filters.class_type}
              onChange={(event) => handleFilterChange("class_type", event.target.value)}
            >
              <option value="">All</option>
              {filterOptions?.class_types.map((classType) => (
                <option key={classType} value={classType}>
                  {classType}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-500">
            Plan
            <select
              className="mt-1 w-full border rounded-lg px-3 py-2"
              value={filters.plan_id}
              onChange={(event) => handleFilterChange("plan_id", event.target.value)}
            >
              <option value="">All</option>
              {filterOptions?.plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-500">
            Instructor
            <select
              className="mt-1 w-full border rounded-lg px-3 py-2"
              value={filters.instructor_id}
              onChange={(event) => handleFilterChange("instructor_id", event.target.value)}
            >
              <option value="">All</option>
              {filterOptions?.instructors.map((instructor) => (
                <option key={instructor.id} value={instructor.id}>
                  {instructor.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-500">
            Lead source
            <select
              className="mt-1 w-full border rounded-lg px-3 py-2"
              value={filters.source}
              onChange={(event) => handleFilterChange("source", event.target.value)}
            >
              <option value="">All</option>
              {filterOptions?.sources.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-500">
            Join month
            <select
              className="mt-1 w-full border rounded-lg px-3 py-2"
              value={filters.join_month}
              onChange={(event) => handleFilterChange("join_month", event.target.value)}
            >
              <option value="">All</option>
              {filterOptions?.join_months.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-4 flex justify-end">
          <Button type="button" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>
      </Card>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <div key={metric.key} className="card p-5">
            <div className="flex items-center justify-between">
              <p className="text-slate-500 text-sm">{metric.label}</p>
              <span title={metric.delta ? `${metric.delta} ${metric.good ? "improvement" : "decline"}` : ""}>
                <Info size={14} className="text-slate-400" />
              </span>
            </div>
            <div className="mt-2 flex items-end justify-between">
              <div className="text-2xl font-semibold">{metric.value}</div>
              {metric.delta && (
                <Badge tone={metric.good ? "good" : "bad"}>
                  {metric.delta} {metric.good ? "vs last mo" : "worse"}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <LineStat data={retentionSeries} />
        </div>
        <Card title="Today's classes" subtitle="Capacity & waitlist">
          <Table
            cols={[
              { key: "name", header: "Class" },
              { key: "start", header: "Start" },
              { key: "capacity", header: "Capacity" },
              {
                key: "booked",
                header: "Booked",
                render: (value: number, row: (typeof classes)[number]) => (
                  <span>
                    {value} / {row.capacity}
                  </span>
                ),
              },
              {
                key: "waitlist",
                header: "Waitlist",
                render: (value: number) =>
                  value > 0 ? <Badge tone="warn">{value}</Badge> : <span className="text-slate-500">—</span>,
              },
            ]}
            rows={classes}
          />
        </Card>
      </div>

      <Card title="At‑risk members" subtitle="Churn risk & reasons">
        {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
        <Table
          cols={[
            { key: "name", header: "Name" },
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
            { key: "reason", header: "Why" },
          ]}
          rows={atRisk.map((entry) => ({
            id: entry.member_id,
            name: entry.member.name,
            lastCheckIn:
              entry.member.last_check_in_days !== null
                ? `${entry.member.last_check_in_days} days`
                : "No check-ins",
            risk: resolveRiskBand(entry.score),
            reason: entry.reasons?.[0]?.detail ?? "",
          }))}
          loading={loading}
        />
      </Card>
    </div>
  );
}
