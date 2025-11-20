import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Card from "../components/Card";
import Button from "../components/Button";
import Modal from "../components/Modal";
import { apiFetch, isAbortError } from "../api/client";
import { Copy, Trash2, Eye, Pencil, Plus, GripVertical, Settings, Search, Minus } from "lucide-react";

type WorkoutProgram = {
  id: string;
  name: string;
  color?: string | null;
  description?: string | null;
};

type Weekday = "Sun" | "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat";

type WorkoutCard = {
  id: string;
  title: string;
  block: string;
  description?: string | null;
  color?: string | null;
  instructions?: string | null;
  exerciseId?: string | null;
  exerciseType?: string | null;
  measurementType?: string | null;
  measurement?: Record<string, unknown> | null;
  restSeconds?: number | null;
  isScored?: boolean;
  coachNotes?: string | null;
  athleteNotes?: string | null;
};

type WorkoutDay = {
  sessionId: string;
  date: string;
  label?: string | null;
  cards: WorkoutCard[];
};

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfWeek(date = new Date(), firstDay: Weekday = "Mon"): string {
  const target = new Date(date);
  const dayIndex = target.getDay();
  const startIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(firstDay);
  const diff = (dayIndex - startIndex + 7) % 7;
  target.setDate(target.getDate() - diff);
  target.setHours(0, 0, 0, 0);
  return formatLocalDate(target);
}

export default function WorkoutBuilder() {
  const configRef = useRef<HTMLDivElement | null>(null);
  const weekdays: Weekday[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const exerciseTypeColors: Record<string, string> = {
    warmup: "#e2e8f0",
    strength: "#dbeafe",
    metcon: "#fef9c3",
    skill: "#f1f5f9",
    cooldown: "#ecfeff",
    other: "#f8fafc",
  };
  const exerciseTypes = [
    { value: "warmup", label: "Warm-up" },
    { value: "strength", label: "Strength" },
    { value: "metcon", label: "Metcon" },
    { value: "skill", label: "Skill Work" },
    { value: "cooldown", label: "Cool-down" },
    { value: "other", label: "Other" },
  ];
  const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [config, setConfig] = useState<{ startOfWeek: Weekday }>({ startOfWeek: "Mon" });
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), "Mon"));
  const [days, setDays] = useState<WorkoutDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [previewCard, setPreviewCard] = useState<WorkoutCard | null>(null);
  const [editingCard, setEditingCard] = useState<WorkoutCard | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState({
    title: "",
    block: "Workout",
    instructions: "",
    coachNotes: "",
    athleteNotes: "",
    exerciseId: "",
    exerciseType: "strength",
    measurementType: "",
    measurement: {} as Record<string, unknown>,
    restSeconds: "",
    isScored: false,
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [programModalOpen, setProgramModalOpen] = useState(false);
  const [newProgram, setNewProgram] = useState({ name: "", description: "" });
  const [calendarNonce, setCalendarNonce] = useState(0);
  const [configOpen, setConfigOpen] = useState(false);
  const [exercises, setExercises] = useState<
    { id: string; name: string; type?: string | null; category?: string | null; modality?: string | null; is_public?: boolean }[]
  >([]);
  const [exerciseResults, setExerciseResults] = useState<
    { id: string; name: string; type?: string | null; category?: string | null; modality?: string | null; is_public?: boolean }[]
  >([]);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [expandedTypes, setExpandedTypes] = useState<Record<string, boolean>>({});
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [expandedModalities, setExpandedModalities] = useState<Record<string, boolean>>({});
  const [exerciseLoading, setExerciseLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function loadPrograms() {
      try {
        const response = await apiFetch<{ data: WorkoutProgram[] }>("/workouts/programs", {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        setPrograms(response.data);
        if (!selectedProgramId && response.data.length > 0) {
          setSelectedProgramId(response.data[0].id);
        }
      } catch (err) {
        if (isAbortError(err)) return;
        setError(err instanceof Error ? err.message : "Failed to load programs");
      }
    }
    loadPrograms();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    async function loadExercises() {
      try {
        const response = await apiFetch<{ data: typeof exercises }>("/workouts/exercises", {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        setExercises(response.data);
        setExerciseResults(response.data);
      } catch (err) {
        if (isAbortError(err)) return;
        setError(err instanceof Error ? err.message : "Failed to load exercises");
      }
    }
    loadExercises();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const query = exerciseSearch.trim();
    if (query.length < 2) {
      setExerciseResults(exercises);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        setExerciseLoading(true);
        const response = await apiFetch<{ data: typeof exercises }>(
          `/workouts/exercises?search=${encodeURIComponent(query)}`,
          { signal: controller.signal }
        );
        if (controller.signal.aborted) return;
        setExerciseResults(response.data);
      } catch (err) {
        if (isAbortError(err) || controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Failed to search exercises");
      } finally {
        if (!controller.signal.aborted) setExerciseLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [exerciseSearch, exercises]);

  useEffect(() => {
    if (!selectedProgramId) return;
    const controller = new AbortController();
    async function loadCalendar() {
      try {
        setLoading(true);
        const response = await apiFetch<{ data: { program: WorkoutProgram; days: any[] } }>(
          `/workouts/programs/${selectedProgramId}/calendar?start_date=${weekStart}`,
          { signal: controller.signal }
        );
        if (controller.signal.aborted) return;
        const normalized: WorkoutDay[] = response.data.days.map((day) => ({
          sessionId: day.session_id ?? day.sessionId,
          date: day.date,
          label: day.label,
          cards: (day.cards ?? []).map((card: WorkoutCard) => ({
            id: card.id,
            title: card.title,
            block: card.block,
            description: card.description ?? (card as any).instructions ?? "",
            instructions: (card as any).instructions ?? card.description ?? "",
            exerciseId: (card as any).exercise_id ?? card.exerciseId ?? null,
            exerciseType: (card as any).exercise_type ?? card.exerciseType ?? null,
            measurementType: (card as any).measurement_type ?? card.measurementType ?? null,
            measurement: (card as any).measurement ?? card.measurement ?? null,
            restSeconds: (card as any).rest_seconds ?? card.restSeconds ?? null,
            isScored: Boolean((card as any).is_scored ?? card.isScored ?? false),
            coachNotes: (card as any).coach_notes ?? card.coachNotes ?? "",
            athleteNotes: (card as any).athlete_notes ?? card.athleteNotes ?? "",
            color: card.color,
          })),
        }));
        setDays(normalized);
        setError(null);
      } catch (err) {
        if (isAbortError(err) || controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Failed to load workouts");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    loadCalendar();
    return () => controller.abort();
  }, [selectedProgramId, weekStart, calendarNonce]);

  const cardIndexMap = useMemo(() => {
    const map = new Map<string, { dayIndex: number; cardIndex: number }>();
    days.forEach((day, dayIndex) => {
      day.cards.forEach((card, cardIndex) => map.set(card.id, { dayIndex, cardIndex }));
    });
    return map;
  }, [days]);

  async function handleCreateProgram(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const response = await apiFetch<{ data: WorkoutProgram }>("/workouts/programs", {
        method: "POST",
        body: JSON.stringify(newProgram),
      });
      setPrograms((prev) => [...prev, response.data]);
      setSelectedProgramId(response.data.id);
      setProgramModalOpen(false);
      setNewProgram({ name: "", description: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create program");
    }
  }

  async function handleAddCard(sessionId: string) {
    try {
      const response = await apiFetch<{ data: WorkoutCard }>(`/workouts/sessions/${sessionId}/items`, {
        method: "POST",
        body: JSON.stringify({
          title: "New workout",
          block: "Accessory",
          exercise_type: "strength",
          instructions: "Describe goals, load, and cues.",
        }),
      });
      const created = response.data;
      const normalized: WorkoutCard = {
        id: created.id,
        title: created.title,
        block: created.block,
        description: (created as any).instructions ?? created.description ?? "",
        instructions: (created as any).instructions ?? created.description ?? "",
        exerciseId: (created as any).exercise_id ?? null,
        exerciseType: (created as any).exercise_type ?? "strength",
        measurementType: (created as any).measurement_type ?? "",
        measurement: (created as any).measurement ?? {},
        restSeconds: (created as any).rest_seconds ?? null,
        isScored: Boolean((created as any).is_scored ?? false),
        coachNotes: (created as any).coach_notes ?? "",
        athleteNotes: (created as any).athlete_notes ?? "",
        color: created.color ?? null,
      };
      setDays((prev) =>
        prev.map((day) =>
          day.sessionId === sessionId ? { ...day, cards: [...day.cards, normalized] } : day
        )
      );
      setEditingCard(normalized);
      setEditingSessionId(sessionId);
      setEditingForm({
        title: normalized.title,
        block: normalized.block,
        instructions: normalized.instructions ?? "",
        coachNotes: normalized.coachNotes ?? "",
        athleteNotes: normalized.athleteNotes ?? "",
        exerciseId: normalized.exerciseId ?? "",
        exerciseType: normalized.exerciseType ?? "strength",
        measurementType: normalized.measurementType ?? "",
        measurement: (normalized.measurement as Record<string, unknown>) ?? {},
        restSeconds: normalized.restSeconds?.toString() ?? "",
        isScored: normalized.isScored ?? false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create workout");
    }
  }

  function refreshCalendar() {
    setCalendarNonce((prev) => prev + 1);
  }

  async function handleDelete(cardId: string) {
    setDays((prev) =>
      prev.map((day) => ({ ...day, cards: day.cards.filter((card) => card.id !== cardId) }))
    );
    try {
      await apiFetch(`/workouts/items/${cardId}`, { method: "DELETE" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete card");
      refreshCalendar();
    }
  }

  async function handleDuplicate(cardId: string) {
    try {
      await apiFetch(`/workouts/items/${cardId}/duplicate`, { method: "POST" });
      refreshCalendar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to duplicate" );
    }
  }

  async function handleMove(cardId: string, targetSessionId: string, targetIndex?: number) {
    const sourceInfo = cardIndexMap.get(cardId);
    if (!sourceInfo) return;

    setDays((prev) => {
      const next = prev.map((day) => ({ ...day, cards: [...day.cards] }));
      const { dayIndex, cardIndex } = sourceInfo;
      const [card] = next[dayIndex].cards.splice(cardIndex, 1);
      const destination = next.find((day) => day.sessionId === targetSessionId);
      if (!destination) return prev;
      const insertAt = targetIndex ?? destination.cards.length;
      destination.cards.splice(insertAt, 0, card);
      return next;
    });

    try {
      await apiFetch(`/workouts/items/${cardId}/move`, {
        method: "POST",
        body: JSON.stringify({ session_id: targetSessionId, position: targetIndex ?? null }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to move card");
      refreshCalendar();
    }
  }

  function handleDrop(sessionId: string, beforeCardId?: string) {
    if (!draggedCardId) return;
    const targetDay = days.find((day) => day.sessionId === sessionId);
    if (!targetDay) return;
    const index = beforeCardId ? targetDay.cards.findIndex((card) => card.id === beforeCardId) : targetDay.cards.length;
    handleMove(draggedCardId, sessionId, index < 0 ? undefined : index);
    setDraggedCardId(null);
  }

  async function handleSaveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingCard) return;
    try {
      setSavingEdit(true);
      const response = await apiFetch<{ data: WorkoutCard }>(`/workouts/items/${editingCard.id}`, {
        method: "PUT",
        body: JSON.stringify({
          title: editingForm.title,
          block: editingForm.block,
          instructions: editingForm.instructions,
          coach_notes: editingForm.coachNotes,
          athlete_notes: editingForm.athleteNotes,
          exercise_id: editingForm.exerciseId || null,
          exercise_type: editingForm.exerciseType,
          measurement_type: editingForm.measurementType,
          measurement: editingForm.measurement,
          rest_seconds: editingForm.restSeconds ? Number(editingForm.restSeconds) : null,
          is_scored: editingForm.isScored,
        }),
      });
      const updated = response.data;
      setDays((prev) =>
        prev.map((day) => ({
          ...day,
          cards: day.cards.map((card) =>
            card.id === editingCard.id
              ? {
                  ...card,
                  title: updated.title,
                  block: updated.block,
                  description: (updated as any).instructions ?? updated.description ?? "",
                  instructions: (updated as any).instructions ?? updated.description ?? "",
                  exerciseId: (updated as any).exercise_id ?? card.exerciseId ?? null,
                  exerciseType: (updated as any).exercise_type ?? card.exerciseType ?? null,
                  measurementType: (updated as any).measurement_type ?? card.measurementType ?? null,
                  measurement: (updated as any).measurement ?? card.measurement ?? null,
                  restSeconds: (updated as any).rest_seconds ?? card.restSeconds ?? null,
                  isScored: Boolean((updated as any).is_scored ?? card.isScored ?? false),
                  coachNotes: (updated as any).coach_notes ?? card.coachNotes ?? "",
                  athleteNotes: (updated as any).athlete_notes ?? card.athleteNotes ?? "",
                }
              : card
          ),
        }))
      );
      setEditingCard(null);
      setEditingSessionId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save workout");
    } finally {
      setSavingEdit(false);
    }
  }

  function formattedRange(): string {
    const startDate = new Date(`${weekStart}T00:00:00`);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    return `${startDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${endDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
  }

  useEffect(() => {
    if (!configOpen) return;
    function handleClick(event: MouseEvent) {
      if (!configRef.current) return;
      if (!configRef.current.contains(event.target as Node)) {
        setConfigOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [configOpen]);

  useEffect(() => {
    setWeekStart((prev) => startOfWeek(new Date(`${prev}T00:00:00`), config.startOfWeek));
  }, [config.startOfWeek]);

  function shiftWeek(direction: 1 | -1) {
    const date = new Date(`${weekStart}T00:00:00`);
    date.setDate(date.getDate() + direction * 7);
    setWeekStart(startOfWeek(date, config.startOfWeek));
  }

  function cloneWeek() {
    console.info("Clone week triggered for", weekStart);
  }

  function deleteWeek() {
    console.info("Delete week triggered for", weekStart);
  }

  const normalizeType = (value?: string | null): string => {
    const cleaned = (value ?? "")
      .normalize("NFKC")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
    if (cleaned === "" || cleaned === "n/a") return "other";
    if (["warmup", "warm-up", "warm up"].includes(cleaned)) return "warmup";
    if (["cooldown", "cool-down", "cool down"].includes(cleaned)) return "cooldown";
    if (["metcon", "met-con", "conditioning"].includes(cleaned)) return "metcon";
    if (["skill", "skill work", "skills"].includes(cleaned)) return "skill";
    if (["strength", "lift"].includes(cleaned)) return "strength";
    return cleaned;
  };

  const groupedExercises = useMemo(() => {
    const groups: Record<
      string,
      {
        label: string;
        categories: Record<
          string,
          {
            label: string;
            modalities: Record<string, { label: string; items: typeof exercises }>;
          }
        >;
      }
    > = {};
    (exerciseResults ?? []).forEach((ex) => {
      const typeKey = normalizeType(ex.type);
      if (!groups[typeKey]) {
        groups[typeKey] = {
          label: exerciseTypes.find((t) => t.value === typeKey)?.label ?? "Other",
          categories: {},
        };
      }
      const catKey = ex.category ?? "General";
      if (!groups[typeKey].categories[catKey]) {
        groups[typeKey].categories[catKey] = { label: catKey, modalities: {} };
      }
      const modKey = ex.modality ?? "General";
      if (!groups[typeKey].categories[catKey].modalities[modKey]) {
        groups[typeKey].categories[catKey].modalities[modKey] = { label: modKey, items: [] };
      }
      groups[typeKey].categories[catKey].modalities[modKey].items.push(ex);
    });
    return groups;
  }, [exerciseResults, exerciseTypes]);

  function deriveMeasurementForExercise(exercise: {
    name: string;
    type?: string | null;
    modality?: string | null;
    category?: string | null;
  }): { measurementType: string; measurement: Record<string, unknown> } {
    const type = normalizeType(exercise.type);
    const modality = (exercise.modality ?? "").toLowerCase();
    const name = exercise.name.toLowerCase();

    if (type === "cooldown" || type === "warmup") {
      return { measurementType: "time", measurement: { seconds: 60 } };
    }

    if (type === "metcon") {
      if (modality.includes("erg") || modality.includes("bike") || modality.includes("run") || name.includes("row")) {
        return { measurementType: "meters", measurement: { meters: 400 } };
      }
      if (name.includes("calorie") || modality.includes("bike")) {
        return { measurementType: "calories", measurement: { calories: 20 } };
      }
      return { measurementType: "reps", measurement: { reps: 15 } };
    }

    if (type === "skill") {
      return { measurementType: "reps", measurement: { reps: 5 } };
    }

    // default strength path
    if (modality.includes("barbell") || modality.includes("dumbbell") || modality.includes("kettlebell")) {
      return { measurementType: "weight", measurement: { weight: 95, unit: "lb" } };
    }

    return { measurementType: "reps", measurement: { reps: 8 } };
  }

  const headerActions = (
    <div className="flex items-center gap-3" ref={configRef}>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <div className="relative">
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
          title="Preferences"
          onClick={() => setConfigOpen((prev) => !prev)}
        >
          <Settings size={18} />
        </button>
        {configOpen && (
          <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-100 bg-white p-4 text-sm shadow-lg">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Start week on</p>
              <select
                value={config.startOfWeek}
                onChange={(event) => setConfig((prev) => ({ ...prev, startOfWeek: event.target.value as Weekday }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              >
                {weekdays.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
            <div className="my-3 border-t border-slate-100"></div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                className="rounded-xl border border-slate-200 px-3 py-2 text-left font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  setConfigOpen(false);
                  cloneWeek();
                }}
              >
                Clone this week
              </button>
              <button
                type="button"
                className="rounded-xl border border-rose-200 px-3 py-2 text-left font-semibold text-rose-600 hover:bg-rose-50"
                onClick={() => {
                  setConfigOpen(false);
                  deleteWeek();
                }}
              >
                Delete this week
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card
        title="Workout builder"
        subtitle="Drag workouts between days and manage programs"
        right={headerActions}
      >
        <div className="flex flex-wrap justify-between items-center gap-4 text-sm">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-slate-500">Program</p>
            <div className="flex items-center gap-2">
              <select
                value={selectedProgramId ?? ""}
                onChange={(event) => setSelectedProgramId(event.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2"
              >
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setProgramModalOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600"
                title="Create program"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-slate-500">Week</p>
            <div className="flex items-center gap-2">
              <Button type="button" onClick={() => shiftWeek(-1)}>
                Prev
              </Button>
              <span className="font-semibold text-slate-700">{formattedRange()}</span>
              <Button type="button" onClick={() => shiftWeek(1)}>
                Next
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {loading ? (
        <Card title="Loading week">
          <p className="text-sm text-slate-500">Fetching workouts…</p>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-7">
          {days.map((day) => (
            <div key={day.sessionId} className="rounded-3xl border border-slate-100 bg-slate-50 shadow-inner">
              <div className="flex items-center justify-between border-b border-white/70 bg-white/60 px-4 py-3">
                <div>
                  {(() => {
                    const displayDate = new Date(`${day.date}T00:00:00`);
                    return (
                      <p className="text-sm font-semibold text-slate-900">
                        {displayDate.toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    );
                  })()}
                  <p className="text-xs text-slate-500">{day.label || "—"}</p>
                </div>
                <button type="button"
                      className="rounded-full border border-slate-200 p-2 text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-200 hover:-translate-y-0.5"
                      style={{ backgroundImage: 'linear-gradient(90deg, var(--brand-primary), var(--brand-accent))' }}
                      onClick={() => handleAddCard(day.sessionId)}>
                    <Plus size={16} />
                </button>
              </div>
              <div
                className="flex min-h-[420px] flex-col gap-3 overflow-y-auto px-3 py-4"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  handleDrop(day.sessionId);
                }}
              >
                {day.cards.map((card) => (
                  <article
                    key={card.id}
                    draggable
                    onDragStart={() => setDraggedCardId(card.id)}
                    onDragEnd={() => setDraggedCardId(null)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      handleDrop(day.sessionId, card.id);
                    }}
                    className={`rounded-2xl border border-slate-200 bg-white p-3 shadow-sm ${draggedCardId === card.id ? "opacity-50" : ""}`}
                  >
                    <div
                      className="mb-2 -mt-1 rounded-xl px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700"
                      style={{
                        background: exerciseTypeColors[card.exerciseType ?? ""] ?? "var(--brand-primary, #eef2ff)",
                      }}
                    >
                      {exerciseTypes.find((t) => t.value === card.exerciseType)?.label ?? "Workout"}
                    </div>
                    <div className="mb-2 flex items-start gap-2">
                      <GripVertical className="h-4 w-4 text-slate-300" />
                      <div>
                        <p className="font-semibold text-slate-900">{card.title}</p>
                        <p className="text-xs uppercase tracking-wide text-slate-400">{card.block}</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600">{card.description}</p>
                    {card.isScored && (
                      <p className="mt-2 inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                        Scored
                      </p>
                    )}
                    <div className="mt-3 flex items-center gap-2 text-slate-400">
                      <button type="button" onClick={() => handleDelete(card.id)} title="Delete" className="hover:text-rose-500">
                        <Trash2 size={16} />
                      </button>
                      <button type="button" onClick={() => handleDuplicate(card.id)} title="Duplicate" className="hover:text-slate-700">
                        <Copy size={16} />
                      </button>
                      <button type="button" onClick={() => setPreviewCard(card)} title="Preview" className="hover:text-slate-700">
                        <Eye size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCard(card);
                          setEditingSessionId(day.sessionId);
                          setEditingForm({
                            title: card.title,
                            block: card.block,
                            instructions: card.instructions ?? card.description ?? "",
                            coachNotes: card.coachNotes ?? "",
                            athleteNotes: card.athleteNotes ?? "",
                            exerciseId: card.exerciseId ?? "",
                            exerciseType: card.exerciseType ?? "strength",
                            measurementType: card.measurementType ?? "",
                            measurement: (card.measurement as Record<string, unknown>) ?? {},
                            restSeconds: card.restSeconds?.toString() ?? "",
                            isScored: card.isScored ?? false,
                          });
                        }}
                        title="Edit"
                        className="hover:text-slate-700"
                      >
                        <Pencil size={16} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {previewCard && (
        <Modal open={true} onClose={() => setPreviewCard(null)} title={previewCard.title}>
          <div className="space-y-4 text-sm text-slate-700">
            <section>
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Workout Definition</p>
              <p className="mt-1 text-slate-800">{previewCard.description}</p>
            </section>
            <section>
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">Athlete Notes</p>
              <p className="mt-1 text-slate-800">Focus on tempo and bracing. Keep ribs stacked and drive vertically.</p>
            </section>
            <section>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Coach Notes</p>
              <p className="mt-1 text-slate-500">Use RPE 8.5 cap; scale to DB presses if shoulder issues appear.</p>
            </section>
            <div className="flex justify-end">
              <Button type="button" onClick={() => setPreviewCard(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {editingCard && (
        <Modal
          open={true}
          onClose={() => !savingEdit && setEditingCard(null)}
          title="Edit workout"
          subtitle={exerciseTypes.find((t) => t.value === editingForm.exerciseType)?.label ?? "Workout"}
        >
          <form className="space-y-6" onSubmit={handleSaveEdit}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Title
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                  value={editingForm.title}
                  onChange={(event) => setEditingForm((prev) => ({ ...prev, title: event.target.value }))}
                  required
                />
              </label>
              <div className="flex flex-col justify-end">
                <p className="text-sm font-medium text-slate-700">Scoring</p>
                <div className="mt-1 flex items-center gap-3">
                  <button
                    type="button"
                    className={`rounded-full px-3 py-2 text-sm font-semibold ${
                      editingForm.isScored ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                    onClick={() => setEditingForm((prev) => ({ ...prev, isScored: !prev.isScored }))}
                  >
                    {editingForm.isScored ? "Scored" : "Unscored"}
                  </button>
                  <span className="text-xs text-slate-500">Scored workouts can be shared to leaderboards.</span>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Exercise type
                <select
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                  value={editingForm.exerciseType}
                  onChange={(event) => setEditingForm((prev) => ({ ...prev, exerciseType: event.target.value }))}
                >
                  {exerciseTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Measurement
                <select
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                  value={editingForm.measurementType}
                  onChange={(event) =>
                    setEditingForm((prev) => ({ ...prev, measurementType: event.target.value, measurement: {} }))
                  }
                >
                  <option value="">Select</option>
                  <option value="amrap">AMRAP</option>
                  <option value="time">Time</option>
                  <option value="emom">EMOM / on-the-minute</option>
                  <option value="calories">Calories</option>
                  <option value="meters">Meters / distance</option>
                  <option value="reps">Reps</option>
                  <option value="weight">Weight / load</option>
                  <option value="intervals">Intervals</option>
                </select>
              </label>
            </div>

            {editingForm.measurementType === "amrap" && (
              <label className="block text-sm font-medium text-slate-700">
                Target reps
                <input
                  type="number"
                  min={0}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                  value={(editingForm.measurement as any).reps ?? ""}
                  onChange={(event) =>
                    setEditingForm((prev) => ({
                      ...prev,
                      measurement: { ...(prev.measurement ?? {}), reps: Number(event.target.value) },
                    }))
                  }
                />
              </label>
            )}
            {editingForm.measurementType === "time" && (
              <div className="grid gap-4 md:grid-cols-2">
                <div></div>
                <label className="block text-sm font-medium text-slate-700 text-right">
                  Time (seconds)
                  <input
                    type="number"
                    min={0}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-right"
                    value={(editingForm.measurement as any).seconds ?? ""}
                    onChange={(event) =>
                      setEditingForm((prev) => ({
                        ...prev,
                        measurement: { ...(prev.measurement ?? {}), seconds: Number(event.target.value) },
                      }))
                    }
                  />
                </label>
              </div>
            )}
            {editingForm.measurementType === "emom" && (
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  Interval (seconds)
                  <input
                    type="number"
                    min={0}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                    value={(editingForm.measurement as any).interval ?? ""}
                    onChange={(event) =>
                      setEditingForm((prev) => ({
                        ...prev,
                        measurement: { ...(prev.measurement ?? {}), interval: Number(event.target.value) },
                      }))
                    }
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Reps per interval
                  <input
                    type="number"
                    min={0}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                    value={(editingForm.measurement as any).reps ?? ""}
                    onChange={(event) =>
                      setEditingForm((prev) => ({
                        ...prev,
                        measurement: { ...(prev.measurement ?? {}), reps: Number(event.target.value) },
                      }))
                    }
                  />
                </label>
              </div>
            )}
            {editingForm.measurementType === "calories" && (
              <label className="block text-sm font-medium text-slate-700">
                Calories
                <input
                  type="number"
                  min={0}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                  value={(editingForm.measurement as any).calories ?? ""}
                  onChange={(event) =>
                    setEditingForm((prev) => ({
                      ...prev,
                      measurement: { ...(prev.measurement ?? {}), calories: Number(event.target.value) },
                    }))
                  }
                />
              </label>
            )}
            {editingForm.measurementType === "meters" && (
              <label className="block text-sm font-medium text-slate-700">
                Distance (meters)
                <input
                  type="number"
                  min={0}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                  value={(editingForm.measurement as any).meters ?? ""}
                  onChange={(event) =>
                    setEditingForm((prev) => ({
                      ...prev,
                      measurement: { ...(prev.measurement ?? {}), meters: Number(event.target.value) },
                    }))
                  }
                />
              </label>
            )}
            {editingForm.measurementType === "reps" && (
              <div className="grid gap-4 md:grid-cols-3">
                <label className="block text-sm font-medium text-slate-700">
                  Set #
                  <input
                    type="number"
                    min={1}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                    value={(editingForm.measurement as any).set ?? 1}
                    onChange={(event) =>
                      setEditingForm((prev) => ({
                        ...prev,
                        measurement: { ...(prev.measurement ?? {}), set: Number(event.target.value) },
                      }))
                    }
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Reps
                  <input
                    type="number"
                    min={0}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                    value={(editingForm.measurement as any).reps ?? ""}
                    onChange={(event) =>
                      setEditingForm((prev) => ({
                        ...prev,
                        measurement: { ...(prev.measurement ?? {}), reps: Number(event.target.value) },
                      }))
                    }
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Weight / % 1RM
                  <input
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                    placeholder="e.g. 95 or 75%"
                    value={(editingForm.measurement as any).load ?? ""}
                    onChange={(event) =>
                      setEditingForm((prev) => ({
                        ...prev,
                        measurement: { ...(prev.measurement ?? {}), load: event.target.value },
                      }))
                    }
                  />
                </label>
              </div>
            )}
            {editingForm.measurementType === "weight" && (
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  Weight
                  <input
                    type="number"
                    min={0}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                    value={(editingForm.measurement as any).weight ?? ""}
                    onChange={(event) =>
                      setEditingForm((prev) => ({
                        ...prev,
                        measurement: { ...(prev.measurement ?? {}), weight: Number(event.target.value) },
                      }))
                    }
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Unit
                  <input
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                    value={(editingForm.measurement as any).unit ?? "lb"}
                    onChange={(event) =>
                      setEditingForm((prev) => ({
                        ...prev,
                        measurement: { ...(prev.measurement ?? {}), unit: event.target.value },
                      }))
                    }
                  />
                </label>
              </div>
            )}
            {editingForm.measurementType === "intervals" && (
              <div className="grid gap-4 md:grid-cols-3">
                <label className="block text-sm font-medium text-slate-700">
                  Sets
                  <input
                    type="number"
                    min={0}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                    value={(editingForm.measurement as any).sets ?? ""}
                    onChange={(event) =>
                      setEditingForm((prev) => ({
                        ...prev,
                        measurement: { ...(prev.measurement ?? {}), sets: Number(event.target.value) },
                      }))
                    }
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Reps
                  <input
                    type="number"
                    min={0}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                    value={(editingForm.measurement as any).reps ?? ""}
                    onChange={(event) =>
                      setEditingForm((prev) => ({
                        ...prev,
                        measurement: { ...(prev.measurement ?? {}), reps: Number(event.target.value) },
                      }))
                    }
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  % of 1RM / load
                  <input
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                    value={(editingForm.measurement as any).percent ?? ""}
                    onChange={(event) =>
                      setEditingForm((prev) => ({
                        ...prev,
                        measurement: { ...(prev.measurement ?? {}), percent: event.target.value },
                      }))
                    }
                  />
                </label>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Rest between sets (seconds)
                <input
                  type="number"
                  min={0}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                  value={editingForm.restSeconds}
                  onChange={(event) => setEditingForm((prev) => ({ ...prev, restSeconds: event.target.value }))}
                />
              </label>
              <div></div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Athlete notes
                <textarea
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                  rows={3}
                  value={editingForm.athleteNotes}
                  onChange={(event) => setEditingForm((prev) => ({ ...prev, athleteNotes: event.target.value }))}
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Coach notes
                <textarea
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                  rows={3}
                  value={editingForm.coachNotes}
                  onChange={(event) => setEditingForm((prev) => ({ ...prev, coachNotes: event.target.value }))}
                />
              </label>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-white p-2 text-slate-500">
                  <Search size={16} />
                </div>
                <input
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Search exercises (Bench Press, Back Squat, custom…) "
                  value={exerciseSearch}
                  onChange={(event) => setExerciseSearch(event.target.value)}
                />
              </div>
              <div className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white">
                {Object.entries(groupedExercises).map(([typeKey, group], typeIdx, arr) => (
                  <div key={typeKey} className={typeIdx < arr.length - 1 ? "border-b border-slate-100" : ""}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-semibold text-slate-800"
                      onClick={() =>
                        setExpandedTypes((prev) => ({
                          ...prev,
                          [typeKey]: prev[typeKey] === false,
                        }))
                      }
                    >
                      <span className="flex items-center gap-2">
                        {expandedTypes[typeKey] !== false ? <Minus size={14} /> : <Plus size={14} />}
                        {group.label}
                      </span>
                      <span className="text-xs text-slate-400">{Object.keys(group.categories).length} categories</span>
                    </button>
                    {expandedTypes[typeKey] !== false && (
                      <div className="border-t border-slate-100 pl-4">
                        {Object.entries(group.categories).map(([catKey, cat]) => (
                          <div key={catKey} className="border-b border-slate-50 last:border-b-0">
                            <button
                              type="button"
                              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-semibold text-slate-700"
                              onClick={() =>
                                setExpandedCategories((prev) => ({
                                  ...prev,
                                  [`${typeKey}::${catKey}`]: prev[`${typeKey}::${catKey}`] === false,
                                }))
                              }
                            >
                              <span className="flex items-center gap-2">
                                {expandedCategories[`${typeKey}::${catKey}`] !== false ? <Minus size={12} /> : <Plus size={12} />}
                                <span className="text-xs uppercase tracking-wide text-slate-500">{cat.label}</span>
                              </span>
                              <span className="text-[10px] text-slate-400">{Object.keys(cat.modalities).length} modalities</span>
                            </button>
                            {expandedCategories[`${typeKey}::${catKey}`] !== false && (
                              <div className="border-t border-slate-100 pl-4">
                                {Object.entries(cat.modalities).map(([modKey, mod]) => (
                                  <div key={modKey} className="border-b border-slate-50 last:border-b-0">
                                    <button
                                      type="button"
                                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-semibold text-slate-600"
                                      onClick={() =>
                                        setExpandedModalities((prev) => ({
                                          ...prev,
                                          [`${typeKey}::${catKey}::${modKey}`]: prev[`${typeKey}::${catKey}::${modKey}`] === false,
                                        }))
                                      }
                                    >
                                      <span className="flex items-center gap-2">
                                        {expandedModalities[`${typeKey}::${catKey}::${modKey}`] !== false ? <Minus size={12} /> : <Plus size={12} />}
                                        <span className="text-[11px] uppercase tracking-wide text-slate-500">{mod.label}</span>
                                      </span>
                                      <span className="text-[10px] text-slate-400">{mod.items.length} exercises</span>
                                    </button>
                                    {expandedModalities[`${typeKey}::${catKey}::${modKey}`] !== false && (
                                      <div className="grid gap-1 px-3 pb-3 pl-4">
                                        {mod.items.map((exercise) => (
                                          <button
                                            type="button"
                                            key={exercise.id}
                                            className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                                              editingForm.exerciseId === exercise.id
                                                ? "border-brand-300 bg-brand-50 text-brand-700"
                                                : "border-slate-200 text-slate-700 hover:bg-slate-50"
                                            }`}
                                            onClick={() =>
                                              setEditingForm((prev) => ({
                                                ...prev,
                                                exerciseId: exercise.id,
                                                title: exercise.name,
                                                exerciseType: (exercise.type as string | undefined) ?? prev.exerciseType,
                                                ...deriveMeasurementForExercise(exercise),
                                              }))
                                            }
                                          >
                                            <span>{exercise.name}</span>
                                            <span className="text-[10px] uppercase text-slate-400">
                                              {exercise.modality || (exercise.is_public ? "Std" : "Custom")}
                                            </span>
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" onClick={() => setEditingCard(null)} disabled={savingEdit}>
                Cancel
              </Button>
              <Button type="submit" disabled={savingEdit} className="bg-slate-900 text-white hover:bg-slate-800">
                {savingEdit ? "Saving…" : "Save workout"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {programModalOpen && (
        <Modal open={programModalOpen} onClose={() => setProgramModalOpen(false)} title="Create program">
          <form className="space-y-4" onSubmit={handleCreateProgram}>
            <label className="block text-sm font-medium text-slate-700">
              Name
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                value={newProgram.name}
                onChange={(event) => setNewProgram((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Description
              <textarea
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                rows={3}
                value={newProgram.description}
                onChange={(event) => setNewProgram((prev) => ({ ...prev, description: event.target.value }))}
              />
            </label>
            <div className="flex justify-end gap-2">
              <Button type="button" onClick={() => setProgramModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-slate-900 text-white hover:bg-slate-800">
                Create program
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
