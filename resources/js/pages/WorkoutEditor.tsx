import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Card from "../components/Card";
import Button from "../components/Button";
import TextInput from "../components/TextInput";
import { apiFetch, isAbortError } from "../api/client";

type WorkoutForm = {
  title: string;
  block: string;
  instructions: string;
  coach_notes?: string | null;
  athlete_notes?: string | null;
};

export default function WorkoutEditor() {
  const { workoutId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<WorkoutForm>({
    title: "",
    block: "Workout",
    instructions: "",
    coach_notes: "",
    athlete_notes: "",
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workoutId) return;
    const controller = new AbortController();
    async function loadItem() {
      try {
        setLoading(true);
        const response = await apiFetch<{ data: WorkoutForm & { block: string } }>(`/workouts/items/${workoutId}`, {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        setForm({
          title: response.data.title,
          block: response.data.block,
          instructions: response.data.instructions ?? "",
          coach_notes: response.data.coach_notes ?? "",
          athlete_notes: response.data.athlete_notes ?? "",
        });
        setError(null);
      } catch (err) {
        if (isAbortError(err) || controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Unable to load workout");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    loadItem();
    return () => controller.abort();
  }, [workoutId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workoutId) return;
    try {
      await apiFetch(`/workouts/items/${workoutId}`, {
        method: "PUT",
        body: JSON.stringify(form),
      });
      setMessage("Workout saved");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save workout");
    }
  }

  const headerTitle = form.title || "Workout";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">Builder · {workoutId}</p>
          <h1 className="text-2xl font-bold text-slate-900">Edit workout · {headerTitle}</h1>
        </div>
        <div className="flex gap-3">
          <Button type="button" onClick={() => navigate(-1)}>
            Back to builder
          </Button>
          <Button type="submit" form="workout-editor-form" className="bg-emerald-600 text-white hover:bg-emerald-500">
            Save workout
          </Button>
        </div>
      </div>

      {message && <p className="text-sm text-emerald-600">{message}</p>}
      {error && <p className="text-sm text-rose-600">{error}</p>}

      <Card title="Workout definition" subtitle="Update load prescriptions, scoring, and notes">
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : (
          <form id="workout-editor-form" className="grid gap-6 lg:grid-cols-2" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Name
                <TextInput
                  className="mt-1"
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Block
                <TextInput
                  className="mt-1"
                  value={form.block}
                  onChange={(event) => setForm((prev) => ({ ...prev, block: event.target.value }))}
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Description
                <textarea
                  value={form.instructions}
                  onChange={(event) => setForm((prev) => ({ ...prev, instructions: event.target.value }))}
                  rows={6}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Coach notes
                <textarea
                  value={form.coach_notes ?? ""}
                  onChange={(event) => setForm((prev) => ({ ...prev, coach_notes: event.target.value }))}
                  rows={5}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </label>
            </div>
            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Athlete notes
                <textarea
                  value={form.athlete_notes ?? ""}
                  onChange={(event) => setForm((prev) => ({ ...prev, athlete_notes: event.target.value }))}
                  rows={8}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </label>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-sm text-slate-500">
                Publishing and analytics will surface here once a real workout service is connected.
              </div>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
