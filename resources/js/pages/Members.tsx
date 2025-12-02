import { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import Button from "../components/Button";
import Badge from "../components/Badge";
import TextInput from "../components/TextInput";
import SelectInput from "../components/SelectInput";
import { apiFetch, isAbortError, type PaginatedResponse } from "../api/client";

type MemberSortKey = "name" | "status" | "plan" | "joined_on" | "risk";

type MemberRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  status: string;
  joined_on: string | null;
  membership_plan?: { name?: string | null } | null;
  risk_score?: { score?: number | null } | null;
};

type PaymentRow = {
  id: string;
  amount_cents: number;
  currency: string;
  cycle?: string | null;
  status: string;
  due_on: string | null;
  paid_on: string | null;
  membership_plan?: { name?: string | null } | null;
};

type BookingRow = {
  id: string;
  status: string;
  session?: {
    id: string;
    class_type: string;
    starts_at: string;
    ends_at: string | null;
    location?: { name?: string | null } | null;
  } | null;
};

type CheckInRow = {
  id: string;
  checked_in_at: string;
  location?: { name?: string | null } | null;
  method?: string | null;
};

type MemberDetail = {
  member: MemberRow & {
    consents?: Record<string, boolean> | null;
    timezone?: string | null;
    preferred_contact_channel?: string | null;
    home_location?: { name?: string | null } | null;
    metadata?: Record<string, unknown> | null;
  };
  payments: PaymentRow[];
  billing: {
    plan_name?: string | null;
    amount_cents?: number | null;
    currency?: string | null;
    interval?: string | null;
    status?: string | null;
    next_due_on?: string | null;
  };
  metrics: {
    lifetime_value_cents: number;
    avg_classes_per_week: number;
    total_check_ins: number;
    last_check_in?: string | null;
    streak_days?: number | null;
  };
  upcoming_sessions: BookingRow[];
  recent_sessions: BookingRow[];
  check_ins: CheckInRow[];
  insights: { label: string; value: string; detail: string }[];
};

function formatCurrency(amountCents?: number | null, currency = "USD"): string {
  if (amountCents === null || amountCents === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amountCents / 100);
}

export default function Members() {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [memberMeta, setMemberMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [membersLoading, setMembersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [memberSearchDraft, setMemberSearchDraft] = useState("");
  const [memberQuery, setMemberQuery] = useState({
    page: 1,
    perPage: 25,
    search: "",
    sort: "name" as MemberSortKey,
    direction: "asc" as "asc" | "desc",
  });

  const [selectedMember, setSelectedMember] = useState<MemberDetail | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function loadMembers() {
      try {
        setMembersLoading(true);
        const params = new URLSearchParams({
          page: String(memberQuery.page),
          per_page: String(memberQuery.perPage),
          sort: memberQuery.sort,
          direction: memberQuery.direction,
        });
        if (memberQuery.search) {
          params.append("search", memberQuery.search);
        }
        const response = await apiFetch<PaginatedResponse<MemberRow>>(`/members?${params.toString()}`, {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        setMembers(response.data ?? []);
        setMemberMeta({
          current_page: response.current_page,
          last_page: response.last_page,
          total: response.total,
        });
        setError(null);
      } catch (err) {
        if (isAbortError(err) || controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Failed to load members");
      } finally {
        if (!controller.signal.aborted) setMembersLoading(false);
      }
    }
    loadMembers();
    return () => controller.abort();
  }, [memberQuery]);

  useEffect(() => {
    if (!selectedMemberId) return;
    const controller = new AbortController();
    async function loadDetail() {
      try {
        setDetailLoading(true);
        const response = await apiFetch<{ data: MemberDetail }>(`/members/${selectedMemberId}`, {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        setSelectedMember(response.data);
      } catch (err) {
        if (isAbortError(err) || controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Unable to load member detail");
      } finally {
        if (!controller.signal.aborted) setDetailLoading(false);
      }
    }
    loadDetail();
    return () => controller.abort();
  }, [selectedMemberId]);

  const memberSortIndicator = useMemo(
    () => (column: MemberSortKey) =>
      memberQuery.sort === column ? (memberQuery.direction === "asc" ? "▲" : "▼") : undefined,
    [memberQuery.sort, memberQuery.direction]
  );

  function applyMemberSearch() {
    setMemberQuery((prev) => ({
      ...prev,
      page: 1,
      search: memberSearchDraft.trim(),
    }));
  }

  function handleSort(column: MemberSortKey) {
    setMemberQuery((prev) => ({
      ...prev,
      page: 1,
      sort: column,
      direction: prev.sort === column && prev.direction === "asc" ? "desc" : "asc",
    }));
  }

  function changePage(offset: number) {
    setMemberQuery((prev) => {
      const next = prev.page + offset;
      if (next < 1 || next > memberMeta.last_page) {
        return prev;
      }
      return { ...prev, page: next };
    });
  }

  return (
    <div className="grid gap-6">
      <Card title="Members" subtitle="Full roster">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <TextInput
              type="search"
              value={memberSearchDraft}
              onChange={(event) => setMemberSearchDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  applyMemberSearch();
                }
              }}
              placeholder="Search name, email, or phone"
              className="w-full text-sm"
            />
            <Button type="button" onClick={applyMemberSearch}>
              Search
            </Button>
          </div>
          <div className="flex items-center gap-2 text-sm">
            Rows
            <SelectInput
              value={memberQuery.perPage}
              onChange={(event) =>
                setMemberQuery((prev) => ({ ...prev, perPage: Number(event.target.value), page: 1 }))
              }
              className="w-auto rounded-lg px-2 py-1 text-sm"
            >
              {[15, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </SelectInput>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr>
                {[
                  { key: "name", label: "Member" },
                  { key: "contact", label: "Contact" },
                  { key: "status", label: "Status" },
                  { key: "plan", label: "Plan" },
                  { key: "joined_on", label: "Joined" },
                  { key: "risk", label: "Risk" },
                  { key: "actions", label: "" },
                ].map((column) => (
                  <th
                    key={column.key}
                    className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    {["contact", "actions"].includes(column.key) ? (
                      column.label
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSort(column.key as MemberSortKey)}
                        className="inline-flex items-center gap-1 text-slate-600"
                      >
                        {column.label}
                        {memberSortIndicator(column.key as MemberSortKey) && (
                          <span className="text-[10px] text-slate-400">
                            {memberSortIndicator(column.key as MemberSortKey)}
                          </span>
                        )}
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {membersLoading ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-sm text-slate-500">
                    Loading members…
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-sm text-slate-500">
                    No members match your filters.
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr
                    key={member.id}
                    className="rounded-2xl border border-slate-100 bg-white/90 text-sm text-slate-700 shadow-sm backdrop-blur"
                  >
                    <td className="px-3 py-3">
                      <div className="font-semibold text-slate-900">{`${member.first_name} ${member.last_name}`}</div>
                      <div className="text-xs text-slate-500">ID: {member.id}</div>
                    </td>
                    <td className="px-3 py-3 text-sm text-slate-600">
                      <div>{member.email ?? "—"}</div>
                      <div className="text-xs text-slate-500">{member.phone ?? ""}</div>
                    </td>
                    <td className="px-3 py-3">
                      <Badge>{member.status}</Badge>
                    </td>
                    <td className="px-3 py-3">{member.membership_plan?.name ?? "—"}</td>
                    <td className="px-3 py-3">
                      {member.joined_on ? new Date(member.joined_on).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-3 py-3">
                      {typeof member.risk_score?.score === "number" ? (
                        <Badge tone={member.risk_score.score >= 70 ? "bad" : member.risk_score.score >= 40 ? "warn" : "good"}>
                          {member.risk_score.score}
                        </Badge>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Button
                        type="button"
                        onClick={() => {
                          setSelectedMember(null);
                          setSelectedMemberId(member.id);
                        }}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
          <div>
            Page {memberMeta.current_page} of {memberMeta.last_page} · {memberMeta.total} total
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" onClick={() => changePage(-1)} disabled={memberMeta.current_page <= 1}>
              Previous
            </Button>
            <Button
              type="button"
              onClick={() => changePage(1)}
              disabled={memberMeta.current_page >= memberMeta.last_page}
            >
              Next
            </Button>
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
      </Card>

      {detailLoading && (
        <Card title="Loading member profile">
          <p className="text-sm text-slate-500">Fetching latest activity…</p>
        </Card>
      )}

      {selectedMember && !detailLoading && (
        <Card
          title={`${selectedMember.member.first_name} ${selectedMember.member.last_name}`}
          subtitle="Member profile and history"
        >
          <div className="mb-4 flex justify-end">
            <Button
              type="button"
              onClick={() => {
                setSelectedMember(null);
                setSelectedMemberId(null);
              }}
            >
              Close
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 text-sm text-slate-600">
              <p className="text-slate-900 font-semibold">Contact</p>
              <p>Email: {selectedMember.member.email ?? "—"}</p>
              <p>Phone: {selectedMember.member.phone ?? "—"}</p>
              <p>Timezone: {selectedMember.member.timezone ?? "Org default"}</p>
              <p>Preferred channel: {selectedMember.member.preferred_contact_channel ?? "Not set"}</p>
              <p>Home location: {selectedMember.member.home_location?.name ?? "—"}</p>
            </div>
            <div className="space-y-2 text-sm text-slate-600">
              <p className="text-slate-900 font-semibold">Membership</p>
              <p>Plan: {selectedMember.billing.plan_name ?? "—"}</p>
              <p>
                Amount:{" "}
                {selectedMember.billing.amount_cents
                  ? formatCurrency(selectedMember.billing.amount_cents, selectedMember.billing.currency ?? "USD")
                  : "—"}
                {selectedMember.billing.interval ? ` / ${selectedMember.billing.interval}` : ""}
              </p>
              <p>Status: {selectedMember.billing.status ?? "—"}</p>
              <p>
                Next bill:{" "}
                {selectedMember.billing.next_due_on
                  ? new Date(selectedMember.billing.next_due_on).toLocaleDateString()
                  : "—"}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <div className="glass p-4">
              <div className="text-xs text-slate-500">Lifetime value</div>
              <div className="text-xl font-semibold text-slate-900">
                {formatCurrency(selectedMember.metrics.lifetime_value_cents)}
              </div>
            </div>
            <div className="glass p-4">
              <div className="text-xs text-slate-500">Avg classes / week</div>
              <div className="text-xl font-semibold text-slate-900">{selectedMember.metrics.avg_classes_per_week}</div>
            </div>
            <div className="glass p-4">
              <div className="text-xs text-slate-500">Check-ins</div>
              <div className="text-xl font-semibold text-slate-900">{selectedMember.metrics.total_check_ins}</div>
            </div>
            <div className="glass p-4">
              <div className="text-xs text-slate-500">Last visit</div>
              <div className="text-xl font-semibold text-slate-900">
                {selectedMember.metrics.last_check_in
                  ? new Date(selectedMember.metrics.last_check_in).toLocaleDateString()
                  : "—"}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-2">Payment history</h4>
              <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-2 py-1">Due</th>
                    <th className="px-2 py-1">Amount</th>
                    <th className="px-2 py-1">Status</th>
                    <th className="px-2 py-1">Plan</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedMember.payments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-2 py-3 text-slate-500">
                        No payments yet.
                      </td>
                    </tr>
                  ) : (
                    selectedMember.payments.map((payment) => (
                      <tr key={payment.id} className="rounded-lg border border-slate-100 bg-white shadow-sm">
                        <td className="px-2 py-2">
                          {payment.due_on ? new Date(payment.due_on).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-2 py-2">
                          {formatCurrency(payment.amount_cents, payment.currency ?? "USD")}
                        </td>
                        <td className="px-2 py-2 capitalize">{payment.status}</td>
                        <td className="px-2 py-2">{payment.membership_plan?.name ?? "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-2">Insights</h4>
              <div className="space-y-3 text-sm text-slate-600">
                {selectedMember.insights.map((insight) => (
                  <div key={insight.label} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                    <div className="text-xs uppercase tracking-wide text-slate-500">{insight.label}</div>
                    <div className="font-semibold text-slate-900">{insight.value}</div>
                    <div className="text-xs text-slate-500">{insight.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-2">Upcoming classes</h4>
              {selectedMember.upcoming_sessions.length === 0 ? (
                <p className="text-sm text-slate-500">No future bookings.</p>
              ) : (
                <ul className="space-y-2 text-sm text-slate-600">
                  {selectedMember.upcoming_sessions.map((booking) => (
                    <li key={booking.id} className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                      <div className="font-semibold text-slate-900">
                        {booking.session?.class_type ?? "Session"}
                      </div>
                      <div>{booking.session?.starts_at ? new Date(booking.session.starts_at).toLocaleString() : "—"}</div>
                      <div className="text-xs text-slate-500">{booking.session?.location?.name ?? "—"}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-2">Recent classes</h4>
              {selectedMember.recent_sessions.length === 0 ? (
                <p className="text-sm text-slate-500">No recent attendance.</p>
              ) : (
                <ul className="space-y-2 text-sm text-slate-600">
                  {selectedMember.recent_sessions.map((booking) => (
                    <li key={booking.id} className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                      <div className="font-semibold text-slate-900">
                        {booking.session?.class_type ?? "Session"}
                      </div>
                      <div>{booking.session?.starts_at ? new Date(booking.session.starts_at).toLocaleString() : "—"}</div>
                      <div className="text-xs text-slate-500">{booking.session?.location?.name ?? "—"}</div>
                      <div className="text-xs text-slate-500">Status: {booking.status}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-sm font-semibold text-slate-900 mb-2">Check-ins</h4>
            {selectedMember.check_ins.length === 0 ? (
              <p className="text-sm text-slate-500">No check-ins recorded.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-2 py-1">Date</th>
                      <th className="px-2 py-1">Location</th>
                      <th className="px-2 py-1">Method</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedMember.check_ins.map((checkIn) => (
                      <tr key={checkIn.id} className="rounded-lg border border-slate-100 bg-white shadow-sm">
                        <td className="px-2 py-2">
                          {checkIn.checked_in_at ? new Date(checkIn.checked_in_at).toLocaleString() : "—"}
                        </td>
                        <td className="px-2 py-2">{checkIn.location?.name ?? "—"}</td>
                        <td className="px-2 py-2">{checkIn.method ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
