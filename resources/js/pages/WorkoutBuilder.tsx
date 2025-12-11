import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Card from "../components/Card";
import Button from "../components/Button";
import Modal from "../components/Modal";
import TextInput from "../components/TextInput";
import SelectInput from "../components/SelectInput";
import { apiFetch, isAbortError } from "../api/client";
import {
  Copy,
  Trash2,
  Eye,
  Pencil,
  Plus,
  GripVertical,
  Settings,
  Search,
  Minus,
  ChevronDown,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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
  description?: string | null;
  color?: string | null;
  instructions?: string | null;
  exerciseId?: string | null;
  exerciseType?: string | null;
  metric?: string | null;
  visibleTo?: string | null;
  reps?: StrengthSetPayload[] | null;
  measurementType?: string | null;
  measurement?: Record<string, unknown> | null;
  measurements?: MeasurementEntry[] | null;
  restSeconds?: number | null;
  isScored?: boolean;
  coachNotes?: string | null;
  athleteNotes?: string | null;
  metconStructure?: string | null;
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

type StrengthSetRow = {
  id: string;
  set: number;
  reps: number | null;
  prescription: string;
};

type StrengthSetPayload = {
  set: number;
  reps: number | null;
  prescription: string | null;
};

const measurementOptions = [
  { value: "calories", label: "Calories" },
  { value: "meters", label: "Meters / distance" },
  { value: "reps", label: "Reps" },
  { value: "weight", label: "Weight / load" },
];

const strengthMetricOptions = [
  { value: "load", label: "Load" },
  { value: "rpe", label: "RPE" },
  { value: "one_rm_percent", label: "1RM %" },
  { value: "rir", label: "RIR" },
];

const metconStructureOptions = [
  { value: "", label: "Select format" },
  { value: "for_time", label: "For time" },
  { value: "amrap", label: "AMRAP" },
  { value: "emom", label: "EMOM" },
  { value: "chipper", label: "Chipper" },
  { value: "ladder", label: "Ladder" },
];

const metconMetricOptions = [
  { value: "time", label: "Time" },
  { value: "rounds_reps", label: "Rounds + Reps" },
  { value: "reps", label: "Reps" },
  { value: "load", label: "Load" },
  { value: "calories", label: "Calories" },
  { value: "meters", label: "Meters" },
];

const metricLabelOptions = [...strengthMetricOptions, ...metconMetricOptions];

const visibilityOptions = [
  { value: "everyone", label: "Everyone" },
  { value: "coaches", label: "Coaches" },
  { value: "programmers", label: "Programmers" },
];

const strengthRepOptions = Array.from({ length: 30 }, (_, index) => index + 1);

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

function createStrengthSetRow(set = 1, reps: number | null = null, prescription = ""): StrengthSetRow {
  return {
    id: uid(),
    set,
    reps,
    prescription,
  };
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

function strengthSetsFromCard(card: Partial<WorkoutCard>): StrengthSetRow[] {
  const raw = Array.isArray(card.reps) ? card.reps : [];
  if (!raw.length) {
    return [createStrengthSetRow()];
  }
  return raw.map((entry, index) => {
    const prescription =
      typeof entry?.prescription === "string"
        ? entry.prescription
        : entry?.prescription != null
          ? String(entry.prescription)
          : "";
    return createStrengthSetRow(entry?.set ?? index + 1, entry?.reps ?? null, prescription);
  });
}

function serializeStrengthSets(rows: StrengthSetRow[]): StrengthSetPayload[] {
  return rows
    .map((row, index) => ({
      set: row.set ?? index + 1,
      reps: row.reps ?? null,
      prescription: row.prescription.trim() !== "" ? row.prescription.trim() : null,
    }))
    .filter((entry) => entry.reps !== null || (entry.prescription && entry.prescription.length > 0));
}

function formatMetricLabel(value?: string | null): string {
  if (!value) return "";
  const entry = metricLabelOptions.find((option) => option.value === value);
  return entry?.label ?? value;
}

function formatVisibleLabel(value?: string | null): string {
  if (!value) return "";
  const entry = visibilityOptions.find((option) => option.value === value);
  return entry?.label ?? value;
}

function strengthMetricPlaceholder(metric: string): string {
  switch (metric) {
    case "rpe":
      return "e.g. 8.5 RPE";
    case "one_rm_percent":
      return "e.g. 75%";
    case "rir":
      return "e.g. 2 reps in reserve";
    default:
      return "e.g. 225 lb or 100 kg";
  }
}

function isRichTextEmpty(value?: string | null): boolean {
  if (!value) return true;
  const stripped = value
    .replace(/<br\s*\/?>/gi, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/<[^>]+>/g, "")
    .trim();
  return stripped.length === 0;
}

function isHtmlLike(value?: string | null): boolean {
  if (!value) return false;
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

type RichTextEditorProps = {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
};

function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!editorRef.current) return;
    const current = editorRef.current.innerHTML;
    if ((value ?? "") === current) return;
    editorRef.current.innerHTML = value || "";
  }, [value]);

  function emitChange() {
    if (!editorRef.current) return;
    onChange(editorRef.current.innerHTML);
  }

  function handleCommand(command: string) {
    editorRef.current?.focus();
    document.execCommand(command, false);
    emitChange();
  }

  const empty = isRichTextEmpty(value);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600">
        <button
          type="button"
          className="rounded-xl px-3 py-1 text-xs font-semibold uppercase tracking-wide hover:bg-white"
          onClick={() => handleCommand("bold")}
        >
          Bold
        </button>
        <button
          type="button"
          className="rounded-xl px-3 py-1 text-xs font-semibold uppercase tracking-wide hover:bg-white"
          onClick={() => handleCommand("italic")}
        >
          Italic
        </button>
        <button
          type="button"
          className="rounded-xl px-3 py-1 text-xs font-semibold uppercase tracking-wide hover:bg-white"
          onClick={() => handleCommand("insertUnorderedList")}
        >
          Bullets
        </button>
      </div>
      <div className="relative">
        <div
          ref={editorRef}
          className="min-h-[180px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm focus-within:border-slate-300 focus-within:ring-2 focus-within:ring-brand-100"
          contentEditable
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            emitChange();
          }}
          onInput={emitChange}
          suppressContentEditableWarning
        />
        {empty && !isFocused && (
          <span className="pointer-events-none absolute left-4 top-3 text-sm text-slate-400">{placeholder}</span>
        )}
      </div>
    </div>
  );
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

function summarizeStrengthSets(card: WorkoutCard): string[] {
  if (!Array.isArray(card.reps) || card.reps.length === 0) return [];
  const metric = formatMetricLabel(card.metric);
  return card.reps.map((entry, index) => {
    const setNumber = entry.set ?? index + 1;
    const reps = entry.reps ?? "—";
    const target = entry.prescription ? ` @ ${entry.prescription}` : "";
    const metricText = metric ? ` (${metric})` : "";
    return `Set ${setNumber}: ${reps} reps${target}${metricText}`;
  });
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const DEFAULT_WORKOUT_TITLE = "New Workout";

function normalizeWorkoutTitle(title?: string | null): string {
  const trimmed = title?.trim();
  if (!trimmed) return DEFAULT_WORKOUT_TITLE;
  return trimmed.toLowerCase() === DEFAULT_WORKOUT_TITLE.toLowerCase() ? DEFAULT_WORKOUT_TITLE : trimmed;
}

function isDefaultWorkoutTitle(title?: string | null): boolean {
  return normalizeWorkoutTitle(title) === DEFAULT_WORKOUT_TITLE;
}

const CALENDAR_WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

type CalendarCell = {
  date: Date;
  inCurrentMonth: boolean;
};

function buildCalendarGrid(monthDate: Date): CalendarCell[] {
  const firstOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const startDayIndex = firstOfMonth.getDay();
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - startDayIndex);
  const cells: CalendarCell[] = [];
  for (let idx = 0; idx < 42; idx += 1) {
    const cellDate = new Date(gridStart);
    cellDate.setDate(gridStart.getDate() + idx);
    cells.push({
      date: cellDate,
      inCurrentMonth: cellDate.getMonth() === monthDate.getMonth(),
    });
  }
  return cells;
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
    endurance: "linear-gradient(90deg,#06b6d4,#0ea5e9)",
    benchmarks: "linear-gradient(90deg,#fb923c,#f97316)",
    custom: "linear-gradient(90deg,#a855f7,#c084fc)",
    unscored: "linear-gradient(90deg,#cbd5f5,#94a3b8)",
    media: "linear-gradient(90deg,#f472b6,#fb7185)",
    other: "linear-gradient(90deg,#e2e8f0,#f1f5f9)",
  };
  const exerciseTypes = [
    { value: "warmup", label: "Warm-up" },
    { value: "strength", label: "Strength" },
    { value: "metcon", label: "Metcon" },
    { value: "skill", label: "Skill Work" },
    { value: "cooldown", label: "Cool-down" },
    { value: "endurance", label: "Endurance" },
    { value: "benchmarks", label: "Benchmarks" },
    { value: "custom", label: "Custom Workout" },
    { value: "unscored", label: "Unscored Component" },
    { value: "media", label: "Media Component" },
    { value: "other", label: "Other" },
  ];
  const workoutTypeChoices = [
    { value: "strength", label: "Strength" },
    { value: "metcon", label: "Metcon" },
    { value: "warmup", label: "Warmup" },
    { value: "cooldown", label: "Cooldown" },
    { value: "endurance", label: "Endurance" },
    { value: "benchmarks", label: "Benchmarks" },
    { value: "custom", label: "Custom Workout" },
    { value: "skill", label: "Skill" },
    { value: "unscored", label: "Unscored Component" },
    { value: "media", label: "Media Component" },
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
    title: "New Workout",
    instructions: "",
    coachNotes: "",
    athleteNotes: "",
    exerciseId: "",
    exerciseType: "strength",
    measurements: [createMeasurementRow()],
    strengthSets: [createStrengthSetRow()],
    metric: "load",
    visibleTo: "everyone",
    restSeconds: "",
    isScored: false,
    metconStructure: "",
  });
  const [editingErrors, setEditingErrors] = useState<Record<string, string[]>>({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [newWorkoutMeta, setNewWorkoutMeta] = useState({ type: "", date: "" });
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [exercisePickerOpen, setExercisePickerOpen] = useState(false);
  const [exercisePickerVisible, setExercisePickerVisible] = useState(false);
  const [exercisePickerSearch, setExercisePickerSearch] = useState("");
  const [metconMetricPickerOpen, setMetconMetricPickerOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [datePickerMonth, setDatePickerMonth] = useState(() => {
    const today = new Date();
    today.setDate(1);
    return today;
  });
  const typePickerButtonRef = useRef<HTMLButtonElement | null>(null);
  const headerTitleInputRef = useRef<HTMLInputElement | null>(null);
  const typePickerPopoverRef = useRef<HTMLDivElement | null>(null);
  const datePickerButtonRef = useRef<HTMLButtonElement | null>(null);
  const datePickerPopoverRef = useRef<HTMLDivElement | null>(null);
  const metconMetricButtonRef = useRef<HTMLButtonElement | null>(null);
  const metconMetricPopoverRef = useRef<HTMLDivElement | null>(null);
  const [headerTitleEditing, setHeaderTitleEditing] = useState(false);
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

  const editingModalTitle = normalizeWorkoutTitle(editingForm.title);
  const editingHeaderColor =
    exerciseTypeColors[(newWorkoutMeta.type || editingForm.exerciseType || "other") as keyof typeof exerciseTypeColors] ??
    exerciseTypeColors.other ??
    "var(--brand-accent)";
  const editingHeaderSubtitle =
    exerciseTypes.find((t) => t.value === (newWorkoutMeta.type || editingForm.exerciseType))?.label ?? "Workout";

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
            const repsPayload = Array.isArray((card as any).reps)
              ? ((card as any).reps as StrengthSetPayload[])
              : card.reps ?? null;
            return {
              id: card.id,
              title: card.title,
              description: card.description ?? (card as any).instructions ?? "",
              instructions: (card as any).instructions ?? card.description ?? "",
              exerciseId: (card as any).exercise_id ?? card.exerciseId ?? null,
              exerciseType: (card as any).exercise_type ?? card.exerciseType ?? null,
              metric: (card as any).metric ?? card.metric ?? null,
              visibleTo: (card as any).visible_to ?? (card as any).visibleTo ?? card.visibleTo ?? null,
              reps: repsPayload,
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
  const availableDates = useMemo(() => new Set(days.map((day) => day.date)), [days]);
  const metaDateOptions = useMemo(
    () =>
      days.map((day) => ({
        value: day.date,
        label: new Date(`${day.date}T00:00:00`).toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
        }),
      })),
    [days]
  );
  const calendarCells = useMemo(() => buildCalendarGrid(datePickerMonth), [datePickerMonth]);
  const selectedMetaDateLabel =
    metaDateOptions.find((option) => option.value === newWorkoutMeta.date)?.label ?? "";
  const selectedTypeLabel =
    workoutTypeChoices.find((option) => option.value === newWorkoutMeta.type)?.label ?? "Select type";
  const selectedExerciseName = useMemo(() => {
    const source = exercises.length ? exercises : exerciseResults;
    return source.find((exercise) => exercise.id === editingForm.exerciseId)?.name ?? "";
  }, [editingForm.exerciseId, exercises, exerciseResults]);
  const normalizedWorkoutType = normalizeType(newWorkoutMeta.type || editingForm.exerciseType);
  const isStrengthBuilder = normalizedWorkoutType === "strength";
  const isMetconBuilder = normalizedWorkoutType === "metcon";
  const showGeneralBuilder = !isStrengthBuilder && !isMetconBuilder;
  const requiresExerciseSelection = !isMetconBuilder;
  const metconMetricLabel =
    metconMetricOptions.find((option) => option.value === editingForm.metric)?.label ?? "Select metric";
  const filteredExerciseOptions = useMemo(() => {
    if (!newWorkoutMeta.type) return [];
    const normalizedType = normalizeType(newWorkoutMeta.type);
    const search = exercisePickerSearch.trim().toLowerCase();
    const source = exercises.length ? exercises : exerciseResults;
    return source
      .filter((exercise) => normalizeType(exercise.type) === normalizedType)
      .filter((exercise) => (search ? exercise.name.toLowerCase().includes(search) : true))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [newWorkoutMeta.type, exercisePickerSearch, exercises, exerciseResults]);
  const metaSelectionsReady = requiresExerciseSelection
    ? Boolean((newWorkoutMeta.type || editingForm.exerciseType) && editingForm.exerciseId)
    : Boolean(newWorkoutMeta.type || editingForm.exerciseType);
  const headerTitleNode = headerTitleEditing ? (
    <input
      ref={headerTitleInputRef}
      className="w-full rounded-lg border border-white/60 bg-white/90 px-3 py-1 text-lg font-semibold text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
      value={editingForm.title}
      onChange={(event) => handleHeaderTitleChange(event.target.value)}
      onBlur={commitHeaderTitle}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          commitHeaderTitle();
        } else if (event.key === "Escape") {
          event.preventDefault();
          setEditingForm((prev) => ({ ...prev, title: normalizeWorkoutTitle(prev.title) }));
          setHeaderTitleEditing(false);
        }
      }}
    />
  ) : (
    <button
      type="button"
      className="w-full rounded-lg bg-transparent py-1 text-left text-lg font-semibold text-slate-900 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/60"
      onClick={() => setHeaderTitleEditing(true)}
    >
      {editingModalTitle}
    </button>
  );

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

  async function handleAddCard(targetDay: WorkoutDay) {
    const sessionId = targetDay.sessionId;
    try {
      const response = await apiFetch<{ data: WorkoutCard }>(`/workouts/${sessionId}/items`, {
        method: "POST",
        body: JSON.stringify({
          title: DEFAULT_WORKOUT_TITLE,
          exercise_type: "strength",
          instructions: "Describe goals, load, and cues.",
          metric: "load",
          visible_to: "everyone",
          reps: [],
        }),
      });
      const created = response.data;
      const measurementEntries = resolveMeasurements(created as any);
      const primaryMeasurement = measurementEntries[0] ?? null;
      const normalizedTitle = normalizeWorkoutTitle(created.title);
      const normalized: WorkoutCard = {
        id: created.id,
        title: normalizedTitle,
        description: (created as any).instructions ?? created.description ?? "",
        instructions: (created as any).instructions ?? created.description ?? "",
        exerciseId: (created as any).exercise_id ?? null,
        exerciseType: (created as any).exercise_type ?? "strength",
        metric: (created as any).metric ?? null,
        visibleTo: (created as any).visible_to ?? null,
        reps: Array.isArray((created as any).reps) ? ((created as any).reps as StrengthSetPayload[]) : null,
        measurementType: (created as any).measurement_type ?? primaryMeasurement?.type ?? "",
        measurement: primaryMeasurement?.data ?? (created as any).measurement ?? {},
        measurements: measurementEntries,
        restSeconds: (created as any).rest_seconds ?? null,
        isScored: Boolean((created as any).is_scored ?? false),
        coachNotes: (created as any).coach_notes ?? "",
        athleteNotes: (created as any).athlete_notes ?? "",
        color: created.color ?? null,
        metconStructure: (created as any).metcon_structure ?? null,
      };
      setDays((prev) =>
        prev.map((day) =>
          day.sessionId === sessionId ? { ...day, cards: [...day.cards, normalized] } : day
        )
      );
      setEditingCard(normalized);
      setEditingSessionId(sessionId);
      setEditingForm({
        title: normalizeWorkoutTitle(normalized.title),
        instructions: normalized.instructions ?? "",
        coachNotes: normalized.coachNotes ?? "",
        athleteNotes: normalized.athleteNotes ?? "",
        exerciseId: normalized.exerciseId ?? "",
        exerciseType: normalized.exerciseType ?? "strength",
        strengthSets: strengthSetsFromCard(normalized),
        metric: normalized.metric ?? "load",
        visibleTo: normalized.visibleTo ?? "everyone",
        measurements: rowsFromCard(normalized),
        restSeconds: normalized.restSeconds?.toString() ?? "",
        isScored: normalized.isScored ?? false,
        metconStructure: (normalized as any).metcon_structure ?? normalized.metconStructure ?? "",
      });
      setEditingErrors({});
      setNewWorkoutMeta({
        type: "",
        date: "",
      });
      setHeaderTitleEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create workout");
    }
  }

  function handleSelectWorkoutType(type: string) {
    setNewWorkoutMeta((prev) => ({ ...prev, type }));
    setEditingForm((prev) => {
      const metricForType =
        type === "strength"
          ? "load"
          : type === "metcon"
            ? metconMetricOptions.some((option) => option.value === prev.metric)
              ? prev.metric
              : metconMetricOptions[0].value
            : prev.metric;
      return {
        ...prev,
        exerciseType: type,
        exerciseId: "",
        strengthSets: type === "strength" ? [createStrengthSetRow()] : prev.strengthSets,
        metric: metricForType,
        visibleTo: type === "strength" ? "everyone" : prev.visibleTo,
        metconStructure: type === "metcon" ? "" : prev.metconStructure,
        title: isDefaultWorkoutTitle(prev.title) ? DEFAULT_WORKOUT_TITLE : prev.title,
      };
    });
    clearFieldError("exercise_type");
    setTypePickerOpen(false);
    setExercisePickerOpen(false);
    setExercisePickerVisible(type !== "metcon");
    setExercisePickerSearch("");
    if (type === "metcon") {
      setExercisePickerOpen(false);
    }
    setMetconMetricPickerOpen(false);
  }

  function handleSelectWorkoutDate(date: string) {
    setNewWorkoutMeta((prev) => ({ ...prev, date }));
    if (!date || !editingCard || !editingSessionId) return;
    const targetDay = days.find((day) => day.date === date);
    if (targetDay && targetDay.sessionId !== editingSessionId) {
      handleMove(editingCard.id, targetDay.sessionId);
      setEditingSessionId(targetDay.sessionId);
    }
    setDatePickerOpen(false);
  }

  function handleSelectMetaExercise(exercise: {
    id: string;
    name: string;
    type?: string | null;
    modality?: string | null;
  }) {
    const suggestion = deriveMeasurementForExercise(exercise);
    setEditingForm((prev) => {
      const rows = prev.measurements.length ? [...prev.measurements] : [createMeasurementRow()];
      rows[0] = { ...rows[0], type: suggestion.type, data: suggestion.data };
      const normalizedType = normalizeType(exercise.type ?? prev.exerciseType);
      const measurementData = suggestion.data as Record<string, unknown>;
      const defaultStrengthReps =
        typeof measurementData?.reps === "number" ? Number(measurementData.reps) : 8;
      const nextStrengthSets =
        normalizedType === "strength"
          ? [createStrengthSetRow(1, defaultStrengthReps, "")]
          : prev.strengthSets;
      return {
        ...prev,
        exerciseId: exercise.id,
        exerciseType: (exercise.type as string | undefined) ?? prev.exerciseType,
        strengthSets: nextStrengthSets,
        metric:
          normalizedType === "strength"
            ? "load"
            : normalizedType === "metcon"
              ? metconMetricOptions.some((option) => option.value === prev.metric)
                ? prev.metric
                : metconMetricOptions[0].value
              : prev.metric,
        visibleTo: normalizedType === "strength" ? "everyone" : prev.visibleTo,
        title: isDefaultWorkoutTitle(prev.title) ? exercise.name : prev.title,
        measurements: rows,
      };
    });
    clearFieldError("exercise_id");
    setExercisePickerSearch("");
    setExercisePickerOpen(false);
    setExercisePickerVisible(false);
  }

  function shiftDatePickerMonth(direction: 1 | -1) {
    setDatePickerMonth((prev) => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() + direction, 1);
      return next;
    });
  }

  function handleHeaderTitleChange(value: string) {
    setEditingForm((prev) => ({ ...prev, title: value }));
    clearFieldError("title");
  }

  function commitHeaderTitle() {
    setEditingForm((prev) => ({ ...prev, title: normalizeWorkoutTitle(prev.title) }));
    setHeaderTitleEditing(false);
  }

  function closeEditingModal() {
    setEditingCard(null);
    setEditingErrors({});
    setNewWorkoutMeta({ type: "", date: "" });
    setEditingSessionId(null);
    setTypePickerOpen(false);
    setExercisePickerOpen(false);
    setExercisePickerSearch("");
    setDatePickerOpen(false);
    setHeaderTitleEditing(false);
    setMetconMetricPickerOpen(false);
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
        body: JSON.stringify({ workout_id: targetSessionId, position: targetIndex ?? null }),
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
      const strengthPayload = serializeStrengthSets(editingForm.strengthSets);
      const response = await apiFetch<{ data: WorkoutCard }>(`/workouts/items/${editingCard.id}`, {
        method: "PUT",
        body: JSON.stringify({
          title: editingForm.title,
          instructions: editingForm.instructions,
          coach_notes: editingForm.coachNotes,
          athlete_notes: editingForm.athleteNotes,
          exercise_id: editingForm.exerciseId || null,
          exercise_type: editingForm.exerciseType,
          metric: editingForm.metric || null,
          visible_to: editingForm.visibleTo || null,
          reps: strengthPayload,
          measurement_type: primaryMeasurement?.type ?? null,
          measurement: primaryMeasurement?.data ?? null,
          measurements: measurementsPayload,
          rest_seconds: editingForm.restSeconds ? Number(editingForm.restSeconds) : null,
          is_scored: editingForm.isScored,
          metcon_structure: editingForm.metconStructure || null,
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
                  description: (updated as any).instructions ?? updated.description ?? "",
                  instructions: (updated as any).instructions ?? updated.description ?? "",
                  exerciseId: (updated as any).exercise_id ?? card.exerciseId ?? null,
                  exerciseType: (updated as any).exercise_type ?? card.exerciseType ?? null,
                  metric: (updated as any).metric ?? card.metric ?? null,
                  visibleTo: (updated as any).visible_to ?? (updated as any).visibleTo ?? card.visibleTo ?? null,
                  reps: Array.isArray((updated as any).reps)
                    ? ((updated as any).reps as StrengthSetPayload[])
                    : card.reps ?? null,
                  measurementType: updatedPrimaryType ?? card.measurementType ?? null,
                  measurement: updatedPrimaryMeasurement ?? card.measurement ?? null,
                  measurements: updatedMeasurements,
                  restSeconds: (updated as any).rest_seconds ?? card.restSeconds ?? null,
                  isScored: Boolean((updated as any).is_scored ?? card.isScored ?? false),
                  coachNotes: (updated as any).coach_notes ?? card.coachNotes ?? "",
                  athleteNotes: (updated as any).athlete_notes ?? card.athleteNotes ?? "",
                  metconStructure: (updated as any).metcon_structure ?? card.metconStructure ?? null,
                }
              : card
          ),
        }))
      );
      refreshCalendar();
      closeEditingModal();
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

  useEffect(() => {
    if (!newWorkoutMeta.date) return;
    const next = new Date(`${newWorkoutMeta.date}T00:00:00`);
    next.setDate(1);
    setDatePickerMonth(next);
  }, [newWorkoutMeta.date]);

  useEffect(() => {
    if (!datePickerOpen) return;
    function handleClick(event: MouseEvent) {
      if (datePickerPopoverRef.current?.contains(event.target as Node)) return;
      if (datePickerButtonRef.current?.contains(event.target as Node)) return;
      setDatePickerOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [datePickerOpen]);

  useEffect(() => {
    if (!typePickerOpen) return;
    function handleClick(event: MouseEvent) {
      if (typePickerPopoverRef.current?.contains(event.target as Node)) return;
      if (typePickerButtonRef.current?.contains(event.target as Node)) return;
      setTypePickerOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [typePickerOpen]);

  useEffect(() => {
    if (!metconMetricPickerOpen) return;
    function handleClick(event: MouseEvent) {
      if (metconMetricPopoverRef.current?.contains(event.target as Node)) return;
      if (metconMetricButtonRef.current?.contains(event.target as Node)) return;
      setMetconMetricPickerOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [metconMetricPickerOpen]);

  useEffect(() => {
    if (!headerTitleEditing) return;
    const id = window.requestAnimationFrame(() => {
      headerTitleInputRef.current?.focus();
      headerTitleInputRef.current?.select();
    });
    return () => window.cancelAnimationFrame(id);
  }, [headerTitleEditing]);

  useEffect(() => {
    if (!newWorkoutMeta.date) return;
    if (!availableDates.has(newWorkoutMeta.date)) {
      setNewWorkoutMeta((prev) => ({ ...prev, date: "" }));
    }
  }, [availableDates, newWorkoutMeta.date]);

  useEffect(() => {
    if (metaDateOptions.length === 0) {
      setDatePickerOpen(false);
    }
  }, [metaDateOptions.length]);

  useEffect(() => {
    setHeaderTitleEditing(false);
  }, [editingCard]);

  useEffect(() => {
    if (!editingForm.exerciseId) {
      setExercisePickerVisible(true);
    }
  }, [editingForm.exerciseId]);

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

  function addStrengthSet(position?: number) {
    setEditingForm((prev) => {
      const current =
        prev.strengthSets && prev.strengthSets.length > 0 ? [...prev.strengthSets] : [createStrengthSetRow()];
      const insertAt = typeof position === "number" ? position : current.length;
      current.splice(insertAt, 0, createStrengthSetRow(insertAt + 1));
      const resequenced = current.map((row, idx) => ({ ...row, set: idx + 1 }));
      return { ...prev, strengthSets: resequenced };
    });
  }

  function removeStrengthSet(index: number) {
    setEditingForm((prev) => {
      const current =
        prev.strengthSets && prev.strengthSets.length > 1 ? prev.strengthSets : [createStrengthSetRow()];
      if (current.length <= 1) {
        return prev;
      }
      const next = current.filter((_, idx) => idx !== index).map((row, idx) => ({ ...row, set: idx + 1 }));
      return { ...prev, strengthSets: next };
    });
  }

  function updateStrengthSet(index: number, field: "reps" | "prescription", value: string) {
    setEditingForm((prev) => {
      const current =
        prev.strengthSets && prev.strengthSets.length > 0 ? [...prev.strengthSets] : [createStrengthSetRow()];
      const next = current.map((row, idx) => {
        if (idx !== index) return row;
        if (field === "reps") {
          if (value === "") {
            return { ...row, reps: null };
          }
          const parsed = Number(value);
          return { ...row, reps: Number.isNaN(parsed) ? null : parsed };
        }
        return { ...row, prescription: value };
      });
      return { ...prev, strengthSets: next };
    });
  }

  function normalizeType(value?: string | null): string {
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
    if (["endurance"].includes(cleaned)) return "endurance";
    if (["benchmark", "benchmarks"].includes(cleaned)) return "benchmarks";
    if (["custom workout", "custom"].includes(cleaned)) return "custom";
    if (cleaned.includes("unscored")) return "unscored";
    if (cleaned.includes("media")) return "media";
    return cleaned;
  }

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
                      onClick={() => handleAddCard(day)}>
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
                  const strengthSummaries = summarizeStrengthSets(card);
                  const detailSummaries = [...strengthSummaries, ...measurementSummaries];
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
                  if (card.metric) {
                    chips.push({ label: `Metric · ${formatMetricLabel(card.metric)}`, tone: "neutral" });
                  }
                  if (card.visibleTo) {
                    chips.push({ label: `Visible · ${formatVisibleLabel(card.visibleTo)}`, tone: "note" });
                  }
                  if (card.athleteNotes) {
                    chips.push({ label: "Athlete note", tone: "note", note: card.athleteNotes });
                  }
                  if (card.coachNotes) {
                    chips.push({ label: "Coach note", tone: "warn", note: card.coachNotes });
                  }
                  const instructionText = card.instructions ?? card.description ?? "";
                  const instructionIsRich = isHtmlLike(instructionText);
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
                        instructionIsRich ? (
                          <div
                            className="text-sm text-slate-600 [&>*]:mb-1 [&>*:last-child]:mb-0"
                            dangerouslySetInnerHTML={{ __html: instructionText }}
                          />
                        ) : (
                          <p className="text-sm text-slate-600">{instructionText}</p>
                        )
                      )}
                      {detailSummaries.length > 0 && (
                        <ul className="space-y-1 text-xs text-slate-500">
                          {detailSummaries.map((line, idx) => (
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
                              title: normalizeWorkoutTitle(card.title),
                              instructions: card.instructions ?? card.description ?? "",
                              coachNotes: card.coachNotes ?? "",
                              athleteNotes: card.athleteNotes ?? "",
                              exerciseId: card.exerciseId ?? "",
                              exerciseType: card.exerciseType ?? "strength",
                              strengthSets: strengthSetsFromCard(card),
                              metric: card.metric ?? "load",
                              visibleTo: card.visibleTo ?? "everyone",
                              measurements:
                                card.measurements && card.measurements.length
                                  ? card.measurements.map((entry) =>
                                      createMeasurementRow(entry.type ?? "", (entry.data as Record<string, unknown>) ?? {})
                                    )
                                  : rowsFromCard(card),
                              restSeconds: card.restSeconds?.toString() ?? "",
                              isScored: card.isScored ?? false,
                              metconStructure: (card as any).metcon_structure ?? card.metconStructure ?? "",
                            });
                            setEditingErrors({});
                            setNewWorkoutMeta({
                              type: card.exerciseType ?? "strength",
                              date: day.date,
                            });
                            setHeaderTitleEditing(false);
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
          onClose={() => {
            if (savingEdit) return;
            closeEditingModal();
          }}
          title={headerTitleNode}
          subtitle={editingHeaderSubtitle}
          headerStyle={{ background: editingHeaderColor }}
          headerClassName="border-transparent"
        >
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="block text-sm font-semibold text-slate-700">
                Workout Type
                <div className="relative mt-2">
                  <button
                    ref={typePickerButtonRef}
                    type="button"
                    onClick={() => setTypePickerOpen((prev) => !prev)}
                    className="flex w-full items-center justify-between rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-left text-base font-semibold text-slate-800"
                  >
                    <span>{selectedTypeLabel}</span>
                    <ChevronDown size={18} className={`text-slate-500 transition ${typePickerOpen ? "rotate-180" : ""}`} />
                  </button>
                  {typePickerOpen && (
                    <div
                      ref={typePickerPopoverRef}
                      className="absolute z-20 mt-2 w-full rounded-2xl border border-slate-200 bg-white shadow-2xl"
                    >
                      <div className="max-h-64 overflow-y-auto py-2">
                        {workoutTypeChoices.map((option) => {
                          const selected = newWorkoutMeta.type === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => handleSelectWorkoutType(option.value)}
                              className={`flex w-full items-center justify-between px-4 py-2 text-sm font-semibold ${
                                selected
                                  ? "bg-slate-900 text-white"
                                  : "text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              <span>{option.label}</span>
                              {selected && <span className="text-xs uppercase tracking-wide">Selected</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="block text-sm font-semibold text-slate-700">
                Workout Date
                <div className="relative mt-2">
                  <button
                    ref={datePickerButtonRef}
                    type="button"
                    disabled={metaDateOptions.length === 0}
                    onClick={() => {
                      if (metaDateOptions.length === 0) return;
                      setDatePickerOpen((prev) => !prev);
                    }}
                    className="flex w-full items-center justify-between rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-left text-base font-semibold text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span>{selectedMetaDateLabel || "Select date"}</span>
                    <CalendarIcon size={18} className="text-slate-500" />
                  </button>
                  {datePickerOpen && (
                    <div
                      ref={datePickerPopoverRef}
                      className="absolute z-20 mt-2 w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl"
                    >
                      <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                        <button
                          type="button"
                          className="rounded-full border border-slate-200 p-1 text-slate-500 hover:bg-slate-50"
                          onClick={() => shiftDatePickerMonth(-1)}
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <span>
                          {datePickerMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                        </span>
                        <button
                          type="button"
                          className="rounded-full border border-slate-200 p-1 text-slate-500 hover:bg-slate-50"
                          onClick={() => shiftDatePickerMonth(1)}
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                      <div className="mt-3 grid grid-cols-7 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
                        {CALENDAR_WEEKDAYS.map((label) => (
                          <span key={label}>{label}</span>
                        ))}
                      </div>
                      <div className="mt-2 grid grid-cols-7 gap-1">
                        {calendarCells.map((cell) => {
                          const iso = formatLocalDate(cell.date);
                          const isAvailable = availableDates.has(iso);
                          const isSelected = newWorkoutMeta.date === iso;
                          const classes = [
                            "h-10 rounded-xl text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200",
                            isSelected ? "bg-slate-900 text-white" : "text-slate-700",
                            !cell.inCurrentMonth ? "opacity-50" : "",
                            isAvailable ? "hover:bg-slate-100" : "cursor-not-allowed opacity-25",
                          ]
                            .filter(Boolean)
                            .join(" ");
                          return (
                            <button
                              type="button"
                              key={`${iso}-${cell.date.getDate()}`}
                              disabled={!isAvailable}
                              onClick={() => handleSelectWorkoutDate(iso)}
                              className={classes}
                            >
                              {cell.date.getDate()}
                            </button>
                          );
                        })}
                      </div>
                      <p className="mt-3 text-xs text-slate-500">Pick a date inside the currently visible week.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {newWorkoutMeta.type && !isMetconBuilder && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="block text-sm font-semibold text-slate-700 md:col-span-2">
                  {exercisePickerVisible ? (
                    <>
                      <span>Exercise</span>
                      <div className="relative mt-2">
                        <button
                          type="button"
                          className="flex w-full items-center justify-between rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-left text-base font-semibold text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                          onClick={() => setExercisePickerOpen((prev) => !prev)}
                          disabled={!newWorkoutMeta.type}
                        >
                          <span>{selectedExerciseName || "Exercise"}</span>
                          <ChevronDown
                            size={18}
                            className={`text-slate-500 transition ${exercisePickerOpen ? "rotate-180" : ""}`}
                          />
                        </button>
                        {exercisePickerOpen && (
                          <div className="mt-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-inner">
                            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                              <Search size={16} />
                              <input
                                type="text"
                                className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none"
                                placeholder="Search exercises..."
                                value={exercisePickerSearch}
                                onChange={(event) => setExercisePickerSearch(event.target.value)}
                              />
                            </div>
                            <div className="mt-3 max-h-64 overflow-y-auto rounded-2xl border border-slate-100">
                              {filteredExerciseOptions.length === 0 ? (
                                <p className="px-4 py-6 text-center text-sm text-slate-500">
                                  No exercises match this search.
                                </p>
                              ) : (
                                <div className="flex flex-col">
                                  {filteredExerciseOptions.map((exercise) => (
                                    <button
                                      key={exercise.id}
                                      type="button"
                                      className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm font-semibold ${
                                        editingForm.exerciseId === exercise.id
                                          ? "bg-slate-900 text-white"
                                          : "text-slate-700 hover:bg-slate-50"
                                      }`}
                                      onClick={() => handleSelectMetaExercise(exercise)}
                                    >
                                      <span>{exercise.name}</span>
                                      <span className="text-[11px] uppercase tracking-wide text-slate-400">
                                        {exercise.modality || (exercise.is_public ? "Std" : "Custom")}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="mt-[30px] flex flex-wrap items-center justify-between gap-4">
                      <div
                        className="cursor-pointer select-none text-base font-semibold text-slate-900"
                        onDoubleClick={() => {
                          setExercisePickerVisible(true);
                          setExercisePickerOpen(true);
                        }}
                        title="Double-click to change exercise"
                      >
                        {selectedExerciseName || editingForm.title}
                      </div>
                      {isStrengthBuilder && (
                        <button
                          type="button"
                          className={`rounded-full px-4 py-2 text-sm font-semibold ${
                            editingForm.isScored ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
                          }`}
                          onClick={() => setEditingForm((prev) => ({ ...prev, isScored: !prev.isScored }))}
                        >
                          {editingForm.isScored ? "Scored" : "Unscored"}
                        </button>
                      )}
                    </div>
                  )}
                  {editingErrors.exercise_id && (
                    <p className="mt-2 text-xs text-rose-600">{editingErrors.exercise_id[0]}</p>
                  )}
                </div>
              </div>
            )}
            {!metaSelectionsReady && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                Select a workout type and exercise to begin configuring the workout details.
              </div>
            )}
            {metaSelectionsReady && (
              <form className="space-y-6" onSubmit={handleSaveEdit}>
                {showGeneralBuilder && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="md:col-span-2 flex flex-wrap items-end justify-between gap-4">
                      <label className="flex-1 min-w-[220px] block text-sm font-medium text-slate-700">
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
                      <div className="flex flex-col items-end gap-1 text-right">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">Scoring</span>
                        <button
                          type="button"
                          className={`rounded-full px-4 py-2 text-sm font-semibold ${
                            editingForm.isScored ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
                          }`}
                          onClick={() => setEditingForm((prev) => ({ ...prev, isScored: !prev.isScored }))}
                        >
                          {editingForm.isScored ? "Scored" : "Unscored"}
                        </button>
                        <span className="text-[11px] text-slate-500">Scored workouts surface on leaderboards.</span>
                      </div>
                    </div>
                  </div>
                )}

                {showGeneralBuilder && (
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
                )}

                {isMetconBuilder && (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="block text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                        <span className="block text-[11px] text-slate-500">Name</span>
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
                      <div className="flex flex-col">
                        {/*<span className="text-xs font-semibold uppercase tracking-wide text-slate-600">Scoring</span>*/}
                        <div className="flex flex-wrap items-end justify-between gap-3">
                          <label className="block text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                            <span className="block text-[11px] text-slate-500">Visible to</span>
                            <SelectInput
                              className="mt-1 min-w-[150px]"
                              value={editingForm.visibleTo}
                              onChange={(event) => setEditingForm((prev) => ({ ...prev, visibleTo: event.target.value }))}
                            >
                              {visibilityOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </SelectInput>
                          </label>
                          <button
                            type="button"
                            className={`rounded-full px-4 py-2 text-sm font-semibold ${
                              editingForm.isScored ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
                            }`}
                            onClick={() => setEditingForm((prev) => ({ ...prev, isScored: !prev.isScored }))}
                          >
                            {editingForm.isScored ? "Scored" : "Unscored"}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">Metcon overview</p>
                      <div className="mt-2">
                        <RichTextEditor
                          value={editingForm.instructions}
                          onChange={(value) => setEditingForm((prev) => ({ ...prev, instructions: value }))}
                          placeholder="Describe pacing, loading, and coaching cues"
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="block text-sm font-medium text-slate-700">
                        Format
                        <SelectInput
                          className="mt-1"
                          value={editingForm.metconStructure}
                          onChange={(event) =>
                            setEditingForm((prev) => ({ ...prev, metconStructure: event.target.value }))
                          }
                        >
                          {metconStructureOptions.map((option) => (
                            <option key={option.value || "metcon-format-placeholder"} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </SelectInput>
                      </label>
                      <div className="block text-sm font-medium text-slate-700">
                        Metric
                        <div className="relative mt-2">
                          <button
                            ref={metconMetricButtonRef}
                            type="button"
                            className="flex w-full items-center justify-between rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-left text-base font-semibold text-slate-800"
                            onClick={() => setMetconMetricPickerOpen((prev) => !prev)}
                          >
                            <span>{metconMetricLabel}</span>
                            <ChevronDown
                              size={18}
                              className={`text-slate-500 transition ${metconMetricPickerOpen ? "rotate-180" : ""}`}
                            />
                          </button>
                          {metconMetricPickerOpen && (
                            <div
                              ref={metconMetricPopoverRef}
                              className="absolute right-0 z-20 mt-2 w-full rounded-2xl border border-slate-200 bg-white shadow-2xl"
                            >
                              <div className="max-h-64 overflow-y-auto py-2">
                                {metconMetricOptions.map((option) => {
                                  const selected = editingForm.metric === option.value;
                                  return (
                                    <button
                                      key={option.value}
                                      type="button"
                                      className={`flex w-full items-center justify-between px-4 py-2 text-sm font-semibold ${
                                        selected ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50"
                                      }`}
                                      onClick={() => {
                                        setEditingForm((prev) => ({ ...prev, metric: option.value }));
                                        setMetconMetricPickerOpen(false);
                                      }}
                                    >
                                      <span>{option.label}</span>
                                      {selected && (
                                        <span className="text-xs uppercase tracking-wide text-white/80">Selected</span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {showGeneralBuilder && (
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
                )}

                {showGeneralBuilder && (
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
                )}

                {isStrengthBuilder ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-[50px_100px_minmax(0,1fr)_140px_80px]">
                        <div className="contents">
                      <div />
                      <div />
                      <label className="block text-sm font-medium text-slate-700">
                        Metric
                        <SelectInput
                          className="mt-1"
                          value={editingForm.metric}
                          onChange={(event) => setEditingForm((prev) => ({ ...prev, metric: event.target.value }))}
                        >
                          {strengthMetricOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </SelectInput>
                      </label>
                      <label className="block text-sm font-medium text-slate-700">
                        Visible to
                        <SelectInput
                          className="mt-1"
                          value={editingForm.visibleTo}
                          onChange={(event) => setEditingForm((prev) => ({ ...prev, visibleTo: event.target.value }))}
                        >
                          {visibilityOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </SelectInput>
                      </label>
                      <div />
                    </div>


                  {editingForm.strengthSets.map((setRow, index) => (
                      <div className="contents">
                        <div className="text-sm font-semibold text-slate-700">Set {index + 1}</div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reps</p>
                            <SelectInput
                                className="mt-1"
                                value={setRow.reps ?? ""}
                                onChange={(event) => updateStrengthSet(index, "reps", event.target.value)}
                            >
                                <option value="">Select</option>
                                {strengthRepOptions.map((option) => (
                                    <option key={`strength-reps-${option}`} value={option}>
                                       {option}
                                    </option>
                                ))}
                            </SelectInput>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Metric value</p>
                            <div className="mt-1 flex items-center gap-2">
                              <TextInput
                                className="flex-1"
                                value={setRow.prescription}
                                placeholder={strengthMetricPlaceholder(editingForm.metric)}
                                onChange={(event) => updateStrengthSet(index, "prescription", event.target.value)}
                              />
                              {editingForm.metric === "one_rm_percent" && (
                                <span className="text-sm font-semibold text-slate-500">%</span>
                              )}
                            </div>
                        </div>
                        <div />
                      <div className="flex items-center justify-end gap-1 pb-1">
                        {editingForm.strengthSets.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeStrengthSet(index)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-rose-50"
                            title="Remove set"
                          >
                            <Minus size={14} />
                          </button>
                        )}
                        {index === editingForm.strengthSets.length - 1 && (
                          <button
                            type="button"
                            onClick={() => addStrengthSet(index + 1)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100"
                            title="Add set"
                          >
                            <Plus size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
                ) : showGeneralBuilder ? (
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
                              <div className="px-3 py-2 text-center font-semibold text-slate-600">{setRow.set}</div>
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
                ) : null}

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

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                onClick={closeEditingModal}
                disabled={savingEdit}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={savingEdit} className="bg-slate-900 text-white hover:bg-slate-800">
                {savingEdit ? "Saving…" : "Save workout"}
              </Button>
            </div>
              </form>
            )}
          </div>
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
