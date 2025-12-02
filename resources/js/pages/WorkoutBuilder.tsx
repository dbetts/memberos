import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Card from "../components/Card";
import Button from "../components/Button";
import Modal from "../components/Modal";
import TextInput from "../components/TextInput";
import SelectInput from "../components/SelectInput";
import { apiFetch, isAbortError } from "../api/client";
import { Copy, Trash2, Eye, Pencil, Plus, GripVertical, Settings, Search, Minus } from "lucide-react";
import Tooltip from "../components/Tooltip";

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
  measurements?: MeasurementEntry[] | null;
  restSeconds?: number | null;
  isScored?: boolean;
  coachNotes?: string | null;
  athleteNotes?: string | null;
};

type MeasurementEntry = {
  type: string;
  data: Record<string, unknown>;
};

type MeasurementRow = MeasurementEntry & {
  id: string;
};

type WeightSetRow = {
  set: number;
  reps: number | null;
  load: string;
};

type WorkoutDay = {
  sessionId: string;
  date: string;
  label?: string | null;
  cards: WorkoutCard[];
};

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

function createMeasurementRow(type = "", data: Record<string, unknown> = {}): MeasurementRow {
  return { id: uid(), type, data };
}

function coerceMeasurementData(type: string, value: unknown): Record<string, unknown> {
  if (type === "reps") return { reps: value };
  if (type === "calories") return { calories: value };
  if (type === "meters") return { meters: value };
  if (type === "weight" && Array.isArray(value)) return { setRows: value };
  return { value };
}

function normalizeMeasurementsArray(
  raw: unknown[],
  card: Partial<WorkoutCard> | Record<string, any>
): MeasurementEntry[] {
  const fallbackType = (card as any).measurementType ?? (card as any).measurement_type ?? "";
  return raw
    .map((entry) => {
      if (entry && typeof entry === "object" && "type" in (entry as any)) {
        return {
          type: (entry as any).type ?? fallbackType ?? "",
          data: ((entry as any).data as Record<string, unknown>) ?? {},
        };
      }
      if (entry && typeof entry === "object") {
        return {
          type: fallbackType ?? "",
          data: entry as Record<string, unknown>,
        };
      }
      return {
        type: fallbackType ?? "",
        data: coerceMeasurementData(fallbackType ?? "", entry),
      };
    })
    .filter((entry) => entry.type || Object.keys(entry.data).length > 0);
}

function measurementEntriesFromCard(card: Partial<WorkoutCard> | Record<string, any>): MeasurementEntry[] {
  const raw = card.measurements ?? card.measurement ?? null;
  let entries: MeasurementEntry[] = [];
  const fallbackType = (card as any).measurementType ?? (card as any).measurement_type ?? "";
  if (Array.isArray(raw)) {
    entries = normalizeMeasurementsArray(raw, card);
  } else if (fallbackType || raw) {
    entries = [
      {
        type: fallbackType ?? "",
        data:
          raw && typeof raw === "object"
            ? ((raw as Record<string, unknown>) ?? {})
            : coerceMeasurementData(fallbackType ?? "", raw),
      },
    ];
  }

  return entries;
}

function rowsFromCard(card: Partial<WorkoutCard>): MeasurementRow[] {
  const entries = measurementEntriesFromCard(card as any);
  if (entries.length === 0) {
    return [createMeasurementRow()];
  }

  return entries.map((entry) => createMeasurementRow(entry.type, entry.data));
}

function resolveMeasurements(card: Partial<WorkoutCard> | Record<string, any>): MeasurementEntry[] {
  const raw = (card as any).measurements;
  if (Array.isArray(raw)) {
    return normalizeMeasurementsArray(raw, card);
  }
  return measurementEntriesFromCard(card);
}

function serializeMeasurements(rows: MeasurementRow[]): MeasurementEntry[] {
  return rows
    .map((row) => ({
      type: row.type.trim(),
      data: normalizeMeasurementData(row),
    }))
    .filter((entry) => entry.type.length > 0);
}

function normalizeMeasurementData(row: MeasurementRow): Record<string, unknown> {
  if (row.type === "weight") {
    return { setRows: formatWeightRowsForSaving(row.data) };
  }

  return row.data ?? {};
}

function getWeightRows(data: Record<string, unknown>): WeightSetRow[] {
  const raw = Array.isArray((data as any)?.setRows)
    ? ((data as any).setRows as Array<{ set?: number; reps?: number | null; load?: string }>)
    : [
        {
          set: (data as any)?.set,
          reps: (data as any)?.reps,
          load: (data as any)?.load,
        },
      ];

  const rows = raw.length ? raw : [{ set: 1, reps: null, load: "" }];

  return rows.map((entry, idx) => ({
    set: Number(entry?.set ?? idx + 1),
    reps:
      entry?.reps === null || entry?.reps === undefined
        ? null
        : Number(entry?.reps),
    load: typeof entry?.load === "string" ? entry.load : entry?.load ? String(entry.load) : "",
  }));
}

function formatWeightRowsForSaving(data: Record<string, unknown>): WeightSetRow[] {
  const rows = getWeightRows(data);
  return rows.map((row, idx) => ({
    set: idx + 1,
    reps: typeof row.reps === "number" ? row.reps : row.reps ?? null,
    load: row.load ?? "",
  }));
}

function summarizeMeasurementEntry(entry: MeasurementEntry): string[] {
  const type = entry.type;
  const data = entry.data ?? {};
  if (type === "weight") {
    const rows = getWeightRows(data);
    const lines = rows.slice(0, 2).map(
      (row) =>
        `Set ${row.set}: ${row.reps ?? "—"} reps @ ${row.load && row.load !== "" ? row.load : "—"}`
    );
    if (rows.length > 2) {
      lines.push(`+${rows.length - 2} more set${rows.length - 2 === 1 ? "" : "s"}`);
    }
    return lines;
  }
  if (type === "calories") {
    const calories = (data.calories as number | undefined) ?? null;
    return [`Calories: ${calories ?? "—"}`];
  }
  if (type === "meters") {
    const meters = (data.meters as number | undefined) ?? null;
    return [`Distance: ${meters ?? "—"} m`];
  }
  if (type === "reps") {
    const reps = (data.reps as number | undefined) ?? null;
    return [`Reps: ${reps ?? "—"}`];
  }
  if (type === "weight_load" && (data as any)?.summary) {
    return [String((data as any).summary)];
  }
  return Object.keys(data || {}).length
    ? [Object.entries(data)
        .map(([key, value]) => `${key}: ${value as string | number}`)
        .join(" · ")]
    : [];
}

function summarizeCardMeasurements(card: WorkoutCard): string[] {
  const entries = measurementEntriesFromCard(card);
  if (!entries.length) return [];
  return entries.flatMap((entry, index) => {
    const lines = summarizeMeasurementEntry(entry);
    if (entries.length > 1) {
      return [`Phase ${index + 1}: ${entry.type || "—"}`, ...lines];
    }
    return lines;
  });
}

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
    warmup: "linear-gradient(90deg,#fef3c7,#fde68a)",
    strength: "linear-gradient(90deg,#4b8ff7,#74b2fb)",
    metcon: "linear-gradient(90deg,#a5f3fc,#67e8f9)",
    skill: "linear-gradient(90deg,#22c55e,#16a34a)",
    cooldown: "linear-gradient(90deg,#ede9fe,#ddd6fe)",
    other: "linear-gradient(90deg,#e2e8f0,#f1f5f9)",
  };
  const exerciseTypes = [
    { value: "warmup", label: "Warm-up" },
    { value: "strength", label: "Strength" },
    { value: "metcon", label: "Metcon" },
    { value: "skill", label: "Skill Work" },
    { value: "cooldown", label: "Cool-down" },
    { value: "other", label: "Other" },
  ];
  const measurementOptions = [
    { value: "calories", label: "Calories" },
    { value: "meters", label: "Meters / distance" },
    { value: "reps", label: "Reps" },
    { value: "weight", label: "Weight / load" },
  ];
  const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [config, setConfig] = useState<{ startOfWeek: Weekday }>({ startOfWeek: "Mon" });
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), "Mon"));
  const [days, setDays] = useState<WorkoutDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [dragHandleCardId, setDragHandleCardId] = useState<string | null>(null);
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
    measurements: [createMeasurementRow()],
    restSeconds: "",
    isScored: false,
  });
  const [editingErrors, setEditingErrors] = useState<Record<string, string[]>>({});
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

  const editingModalTitle = editingForm.title || "Workout";
  const editingHeaderColor =
    exerciseTypeColors[(editingForm.exerciseType ?? "other") as keyof typeof exerciseTypeColors] ??
    exerciseTypeColors.other ??
    "var(--brand-accent)";
  const editingHeaderSubtitle = exerciseTypes.find((t) => t.value === editingForm.exerciseType)?.label ?? "Workout";

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
          cards: (day.cards ?? []).map((card: WorkoutCard) => {
            const measurements = resolveMeasurements(card as any);
            const primaryMeasurement = measurements[0] ?? null;
            return {
              id: card.id,
              title: card.title,
              block: card.block,
              description: card.description ?? (card as any).instructions ?? "",
              instructions: (card as any).instructions ?? card.description ?? "",
              exerciseId: (card as any).exercise_id ?? card.exerciseId ?? null,
              exerciseType: (card as any).exercise_type ?? card.exerciseType ?? null,
              measurementType:
                (card as any).measurement_type ??
                primaryMeasurement?.type ??
                card.measurementType ??
                null,
              measurement:
                primaryMeasurement?.data ?? (card as any).measurement ?? card.measurement ?? null,
              measurements,
              restSeconds: (card as any).rest_seconds ?? card.restSeconds ?? null,
              isScored: Boolean((card as any).is_scored ?? card.isScored ?? false),
              coachNotes: (card as any).coach_notes ?? card.coachNotes ?? "",
              athleteNotes: (card as any).athlete_notes ?? card.athleteNotes ?? "",
              color: card.color,
            };
          }),
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
      const measurementEntries = resolveMeasurements(created as any);
      const primaryMeasurement = measurementEntries[0] ?? null;
      const normalized: WorkoutCard = {
        id: created.id,
        title: created.title,
        block: created.block,
        description: (created as any).instructions ?? created.description ?? "",
        instructions: (created as any).instructions ?? created.description ?? "",
        exerciseId: (created as any).exercise_id ?? null,
        exerciseType: (created as any).exercise_type ?? "strength",
        measurementType: (created as any).measurement_type ?? primaryMeasurement?.type ?? "",
        measurement: primaryMeasurement?.data ?? (created as any).measurement ?? {},
        measurements: measurementEntries,
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
        measurements: rowsFromCard(normalized),
        restSeconds: normalized.restSeconds?.toString() ?? "",
        isScored: normalized.isScored ?? false,
      });
      setEditingErrors({});
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
      const measurementsPayload = serializeMeasurements(editingForm.measurements);
      const primaryMeasurement = measurementsPayload[0] ?? null;
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
          measurement_type: primaryMeasurement?.type ?? null,
          measurement: primaryMeasurement?.data ?? null,
          measurements: measurementsPayload,
          rest_seconds: editingForm.restSeconds ? Number(editingForm.restSeconds) : null,
          is_scored: editingForm.isScored,
        }),
      });
      const updated = response.data;
      const updatedMeasurements = resolveMeasurements(updated as any);
      const updatedPrimaryType =
        (updated as any).measurement_type ??
        updatedMeasurements?.[0]?.type ??
        null;
      const updatedPrimaryMeasurement =
        (updated as any).measurement ??
        updatedMeasurements?.[0]?.data ??
        null;
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
                  measurementType: updatedPrimaryType ?? card.measurementType ?? null,
                  measurement: updatedPrimaryMeasurement ?? card.measurement ?? null,
                  measurements: updatedMeasurements,
                  restSeconds: (updated as any).rest_seconds ?? card.restSeconds ?? null,
                  isScored: Boolean((updated as any).is_scored ?? card.isScored ?? false),
                  coachNotes: (updated as any).coach_notes ?? card.coachNotes ?? "",
                  athleteNotes: (updated as any).athlete_notes ?? card.athleteNotes ?? "",
                }
              : card
          ),
        }))
      );
      refreshCalendar();
      setEditingErrors({});
      setEditingCard(null);
      setEditingSessionId(null);
    } catch (err) {
      if (err instanceof Error) {
        try {
          const payload = JSON.parse(err.message);
          if (payload?.errors) {
            setEditingErrors(payload.errors as Record<string, string[]>);
            return;
          }
        } catch (_) {
          // not JSON
        }
        setError(err.message || "Unable to save workout");
      } else {
        setError("Unable to save workout");
      }
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

  function clearFieldError(field: string) {
    setEditingErrors((prev) => {
      if (!prev[field]) return prev;
      const { [field]: _removed, ...rest } = prev;
      return rest;
    });
  }

function addMeasurementRow(position?: number) {
    setEditingForm((prev) => {
      const next = [...prev.measurements];
      const row = createMeasurementRow();
      if (typeof position === "number") {
        next.splice(position, 0, row);
      } else {
        next.push(row);
      }
      return { ...prev, measurements: next };
    });
  }

  function removeMeasurementRow(index: number) {
    setEditingForm((prev) => {
      if (prev.measurements.length <= 1) {
        return prev;
      }
      const next = prev.measurements.filter((_, idx) => idx !== index);
      return { ...prev, measurements: next };
    });
  }

  function updateMeasurementRowType(index: number, type: string) {
    setEditingForm((prev) => {
      const next = prev.measurements.map((row, idx) =>
        idx === index
          ? {
              ...row,
              type,
              data: type === "weight" ? { setRows: formatWeightRowsForSaving({}) } : {},
            }
          : row
      );
      return { ...prev, measurements: next };
    });
    clearFieldError(`measurements.${index}.type`);
  }

  function updateMeasurementRowData(index: number, field: string, value: unknown) {
    setEditingForm((prev) => {
      const next = prev.measurements.map((row, idx) => {
        if (idx !== index) return row;
        const data = { ...row.data };
        setNestedValue(data, field, value);
        return { ...row, data };
      });
      return { ...prev, measurements: next };
    });
    clearFieldError(`measurements.${index}.${field}`);
  }

function updateWeightRows(rowIndex: number, mutator: (rows: WeightSetRow[]) => WeightSetRow[]) {
  setEditingForm((prev) => {
    const next = prev.measurements.map((row, idx) => {
      if (idx !== rowIndex) return row;
      const rows = mutator(getWeightRows(row.data));
      return { ...row, data: { ...row.data, setRows: rows } };
    });
    return { ...prev, measurements: next };
  });
}

function addWeightSet(rowIndex: number, position?: number) {
  updateWeightRows(rowIndex, (rows) => {
    const next = [...rows];
    const insertAt = typeof position === "number" ? position : rows.length;
    next.splice(insertAt, 0, { set: insertAt + 1, reps: null, load: "" });
    return next.map((entry, idx) => ({ ...entry, set: idx + 1 }));
  });
}

function setNestedValue(target: Record<string, unknown>, path: string, value: unknown) {
  const segments = path.split('.');
  const last = segments.pop();
  let cursor: any = target;

  for (const segment of segments) {
    const isIndex = /^\d+$/.test(segment);
    if (isIndex) {
      const idx = Number(segment);
      if (!Array.isArray(cursor)) {
        return;
      }
      if (!cursor[idx]) {
        cursor[idx] = {};
      }
      cursor = cursor[idx];
    } else {
      if (!(segment in cursor) || cursor[segment] === null) {
        cursor[segment] = {};
      }
      cursor = cursor[segment];
    }
  }

  if (last === undefined) return;
  const isIndex = /^\d+$/.test(last);
  if (isIndex) {
    const idx = Number(last);
    if (!Array.isArray(cursor)) return;
    cursor[idx] = value;
  } else {
    cursor[last] = value;
  }
}

function removeWeightSet(rowIndex: number, setIndex: number) {
  updateWeightRows(rowIndex, (rows) => {
    if (rows.length <= 1) return rows;
    const next = rows.filter((_, idx) => idx !== setIndex);
    return next.map((entry, idx) => ({ ...entry, set: idx + 1 }));
  });
}

function updateWeightSet(rowIndex: number, setIndex: number, field: keyof WeightSetRow, value: unknown) {
  updateWeightRows(rowIndex, (rows) =>
    rows.map((entry, idx) =>
      idx === setIndex
        ? {
            ...entry,
            [field]: field === "load"
              ? String(value ?? "")
              : field === "reps"
                ? value === null || value === ""
                  ? null
                  : Number(value)
                : Number(value ?? entry.set),
          }
        : entry
    )
  );
  clearFieldError(`measurements.${rowIndex}.setRows.${setIndex}.${field}`);
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
}): MeasurementEntry {
  const type = normalizeType(exercise.type);
  const modality = (exercise.modality ?? "").toLowerCase();
  const name = exercise.name.toLowerCase();

  if (type === "cooldown" || type === "warmup") {
    return { type: "meters", data: { meters: 100 } };
  }

  if (type === "metcon") {
    if (modality.includes("erg") || modality.includes("bike") || modality.includes("run") || name.includes("row")) {
      return { type: "meters", data: { meters: 400 } };
    }
    if (name.includes("calorie") || modality.includes("bike")) {
      return { type: "calories", data: { calories: 20 } };
    }
    return { type: "reps", data: { reps: 15 } };
  }

  if (type === "skill") {
    return { type: "reps", data: { reps: 5 } };
  }

  // default strength path
  if (modality.includes("barbell") || modality.includes("dumbbell") || modality.includes("kettlebell")) {
    return { type: "weight", data: { weight: 95, unit: "lb" } };
  }

  return { type: "reps", data: { reps: 8 } };
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
              <SelectInput
                className="mt-1"
                value={config.startOfWeek}
                onChange={(event) => setConfig((prev) => ({ ...prev, startOfWeek: event.target.value as Weekday }))}
              >
                {weekdays.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </SelectInput>
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
              <SelectInput
                value={selectedProgramId ?? ""}
                onChange={(event) => setSelectedProgramId(event.target.value)}
                className="w-auto rounded-lg"
              >
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.name}
                  </option>
                ))}
              </SelectInput>
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
                {day.cards.map((card) => {
                  const cardTypeKey = normalizeType(card.exerciseType);
                  const headerBackground =
                    exerciseTypeColors[cardTypeKey as keyof typeof exerciseTypeColors] ?? exerciseTypeColors.other;
                  const measurementSummaries = summarizeCardMeasurements(card);
                  const chips: Array<{
                    label: string;
                    tone: "primary" | "neutral" | "note" | "warn";
                    note?: string | null;
                  }> = [];
                  if (card.isScored) {
                    chips.push({ label: "Scored", tone: "primary" });
                  }
                  if (card.restSeconds) {
                    chips.push({ label: `Rest ${card.restSeconds}s`, tone: "neutral" });
                  }
                  if (card.athleteNotes) {
                    chips.push({ label: "Athlete note", tone: "note", note: card.athleteNotes });
                  }
                  if (card.coachNotes) {
                    chips.push({ label: "Coach note", tone: "warn", note: card.coachNotes });
                  }
                  const instructionText = card.instructions ?? card.description ?? "";
                  return (
                    <article
                      key={card.id}
                      draggable
                      onDragStart={(event) => {
                        if (dragHandleCardId !== card.id) {
                          event.preventDefault();
                          return;
                        }
                        setDraggedCardId(card.id);
                      }}
                      onDragEnd={() => {
                        setDraggedCardId(null);
                        setDragHandleCardId(null);
                      }}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault();
                        handleDrop(day.sessionId, card.id);
                      }}
                      className={`rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden ${
                        draggedCardId === card.id ? "opacity-50" : ""
                      }`}
                    >
                    <div
                      className="flex items-center gap-2 pl-2 pr-4 py-1.5 text-white cursor-grab active:cursor-grabbing select-none"
                      style={{ background: headerBackground }}
                      role="button"
                      tabIndex={0}
                      onMouseDown={() => setDragHandleCardId(card.id)}
                      onMouseUp={() => {
                        if (!draggedCardId) setDragHandleCardId(null);
                      }}
                      onMouseLeave={() => {
                        if (!draggedCardId) setDragHandleCardId(null);
                      }}
                      onTouchStart={() => setDragHandleCardId(card.id)}
                    >
                      <GripVertical className="h-4 w-4 -ml-1 text-white/80" />
                      <p className="text-base font-semibold leading-tight">{card.title}</p>
                    </div>
                    <div className="p-3 space-y-2">
                      {instructionText && (
                        <p className="text-sm text-slate-600">{instructionText}</p>
                      )}
                      {measurementSummaries.length > 0 && (
                        <ul className="space-y-1 text-xs text-slate-500">
                          {measurementSummaries.map((line, idx) => (
                            <li key={`${card.id}-summary-${idx}`} className="flex items-start gap-2">
                              <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-slate-300"></span>
                              <span>{line}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {chips.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {chips.map((chip, idx) => (
                            <Tooltip key={`${card.id}-chip-${idx}`} content={chip.note}>
                              <span
                                className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                                  chip.tone === "primary"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : chip.tone === "note"
                                      ? "bg-sky-50 text-sky-700"
                                      : chip.tone === "warn"
                                        ? "bg-amber-50 text-amber-700"
                                        : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {chip.label}
                              </span>
                            </Tooltip>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-slate-400 pt-1">
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
                              measurements:
                                card.measurements && card.measurements.length
                                  ? card.measurements.map((entry) =>
                                      createMeasurementRow(entry.type ?? "", (entry.data as Record<string, unknown>) ?? {})
                                    )
                                  : rowsFromCard(card),
                              restSeconds: card.restSeconds?.toString() ?? "",
                              isScored: card.isScored ?? false,
                            });
                            setEditingErrors({});
                          }}
                          title="Edit"
                          className="hover:text-slate-700"
                        >
                          <Pencil size={16} />
                        </button>
                      </div>
                    </div>
                    </article>
                  );
                })}
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
          title={editingModalTitle}
          subtitle={editingHeaderSubtitle}
          headerStyle={{ background: editingHeaderColor }}
          headerClassName="border-transparent"
        >
          <form className="space-y-6" onSubmit={handleSaveEdit}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Title
                <TextInput
                  className="mt-1"
                  value={editingForm.title}
                  onChange={(event) => {
                    setEditingForm((prev) => ({ ...prev, title: event.target.value }));
                    clearFieldError("title");
                  }}
                  required
                />
                {editingErrors.title && (
                  <p className="mt-1 text-xs text-rose-600">{editingErrors.title[0]}</p>
                )}
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


            <div>
              <label className="block text-sm font-medium text-slate-700">
                Exercise type
                <SelectInput
                  className="mt-1"
                  value={editingForm.exerciseType}
                  onChange={(event) => {
                    setEditingForm((prev) => ({ ...prev, exerciseType: event.target.value }));
                    clearFieldError("exercise_type");
                  }}
                >
                  {exerciseTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </SelectInput>
                {editingErrors.exercise_type && (
                  <p className="mt-1 text-xs text-rose-600">{editingErrors.exercise_type[0]}</p>
                )}
              </label>
            </div>

            <label className="block text-sm font-medium text-slate-700">
              Workout instructions
              <textarea
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                rows={3}
                placeholder="Describe goals, pacing, and coaching cues"
                value={editingForm.instructions}
                onChange={(event) => setEditingForm((prev) => ({ ...prev, instructions: event.target.value }))}
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Rest between sets (seconds)
                <TextInput
                  type="number"
                  min={0}
                  className="mt-1"
                  value={editingForm.restSeconds}
                  onChange={(event) => setEditingForm((prev) => ({ ...prev, restSeconds: event.target.value }))}
                  placeholder="e.g. 60"
                />
              </label>
              <div className="text-xs text-slate-500 self-end">
                Leave blank if the workout block doesn’t have prescribed rest.
              </div>
            </div>

            <div className="space-y-4">
              {editingForm.measurements.map((row, index) => (
                <div key={row.id} className="rounded-2xl border border-slate-200 bg-white/60 p-4 space-y-4">
                  <div className="flex items-end gap-2">
                    <label className="flex-1 text-sm font-medium text-slate-700">
                      Measurement type
                      <SelectInput
                        className="mt-1"
                        value={row.type}
                        onChange={(event) => updateMeasurementRowType(index, event.target.value)}
                      >
                        <option value="">Select</option>
                        {measurementOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </SelectInput>
                      {editingErrors[`measurements.${index}.type`] && (
                        <p className="mt-1 text-xs text-rose-600">
                          {editingErrors[`measurements.${index}.type`]![0]}
                        </p>
                      )}
                    </label>
                    <div className="flex gap-1 pb-1">
                      <button
                        type="button"
                        onClick={() => addMeasurementRow(index + 1)}
                        className="rounded-full border border-slate-200 p-2 text-slate-500 hover:bg-slate-100"
                        title="Add measurement"
                      >
                        <Plus size={14} />
                      </button>
                      {editingForm.measurements.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMeasurementRow(index)}
                          className="rounded-full border border-slate-200 p-2 text-slate-500 hover:bg-rose-50"
                          title="Remove measurement"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {row.type === "calories" && (
                    <label className="block text-sm font-medium text-slate-700">
                      Calories
                      <TextInput
                        type="number"
                        min={0}
                        className="mt-1"
                        value={(row.data.calories as number | undefined) ?? ""}
                        onChange={(event) => updateMeasurementRowData(index, "calories", Number(event.target.value))}
                      />
                    </label>
                  )}

                  {row.type === "meters" && (
                    <label className="block text-sm font-medium text-slate-700">
                      Distance (meters)
                      <TextInput
                        type="number"
                        min={0}
                        className="mt-1"
                        value={(row.data.meters as number | undefined) ?? ""}
                        onChange={(event) => updateMeasurementRowData(index, "meters", Number(event.target.value))}
                      />
                    </label>
                  )}

                  {row.type === "reps" && (
                    <label className="block text-sm font-medium text-slate-700">
                      Reps
                      <TextInput
                        type="number"
                        min={0}
                        className="mt-1"
                        value={(row.data.reps as number | undefined) ?? ""}
                        onChange={(event) => updateMeasurementRowData(index, "reps", Number(event.target.value))}
                      />
                    </label>
                  )}

                  {row.type === "weight" && (() => {
                    const weightRows = getWeightRows(row.data);
                    return (
                    <div className="space-y-3">
                      <div className="grid grid-cols-[60px_110px_minmax(0,_1fr)_70px] gap-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <span>Set #</span>
                        <span>Reps</span>
                        <span>Weight / % 1RM</span>
                        <span className="text-right">Actions</span>
                      </div>
                      {weightRows.map((setRow, setIndex) => (
                        <div
                          key={`${row.id}-set-${setIndex}`}
                          className="grid grid-cols-[60px_110px_minmax(0,_1fr)_70px] items-center gap-3"
                        >
                          <div className="px-3 py-2 text-center font-semibold text-slate-600">
                            {setRow.set}
                          </div>
                          <TextInput
                            type="number"
                            min={0}
                            value={setRow.reps ?? ""}
                            onChange={(event) => updateWeightSet(index, setIndex, "reps", event.target.value)}
                          />
                          <TextInput
                            placeholder="e.g. 95 or 75%"
                            value={setRow.load ?? ""}
                            onChange={(event) => updateWeightSet(index, setIndex, "load", event.target.value)}
                          />
                          <div className="flex items-center justify-end gap-1">
                            {setIndex === weightRows.length - 1 && (
                              <button
                                type="button"
                                onClick={() => addWeightSet(index, setIndex + 1)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100"
                                title="Add set"
                              >
                                <Plus size={14} />
                              </button>
                            )}
                            {weightRows.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeWeightSet(index, setIndex)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-rose-50"
                                title="Remove set"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    );
                  })()}
                </div>
              ))}
              {editingErrors.measurement_type && (
                <p className="text-xs text-rose-600">{editingErrors.measurement_type[0]}</p>
              )}
              {editingErrors.measurement && (
                <p className="text-xs text-rose-600">{editingErrors.measurement[0]}</p>
              )}
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
                <TextInput
                  className="flex-1"
                  placeholder="Search exercises (Bench Press, Back Squat, custom…) "
                  value={exerciseSearch}
                  onChange={(event) => setExerciseSearch(event.target.value)}
                />
              </div>
              {editingErrors.exercise_id && (
                <p className="mt-2 text-xs text-rose-600">{editingErrors.exercise_id[0]}</p>
              )}
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
                                            onClick={() => {
                                              const suggestion = deriveMeasurementForExercise(exercise);
                                              setEditingForm((prev) => {
                                                const rows = prev.measurements.length
                                                  ? [...prev.measurements]
                                                  : [createMeasurementRow()];
                                                rows[0] = { ...rows[0], type: suggestion.type, data: suggestion.data };
                                                return {
                                                  ...prev,
                                                  exerciseId: exercise.id,
                                                  title: exercise.name,
                                                  exerciseType:
                                                    (exercise.type as string | undefined) ?? prev.exerciseType,
                                                  measurements: rows,
                                                };
                                              });
                                              clearFieldError("exercise_id");
                                            }}
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
              <Button
                type="button"
                onClick={() => {
                  setEditingCard(null);
                  setEditingErrors({});
                }}
                disabled={savingEdit}
              >
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
              <TextInput
                className="mt-1"
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
