import { FormEvent, useEffect, useState } from "react";
import Card from "../components/Card";
import Button from "../components/Button";
import TextInput from "../components/TextInput";
import { apiFetch, isAbortError } from "../api/client";

type ProfilePayload = {
  name: string;
  email: string;
  phone: string;
  address: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    postal: string;
    country: string;
  };
};

export default function Profile() {
  const [form, setForm] = useState<ProfilePayload>({
    name: "",
    email: "",
    phone: "",
    address: { line1: "", line2: "", city: "", state: "", postal: "", country: "" },
  });
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    apiFetch<{ data: ProfilePayload }>("/auth/me", { signal: controller.signal })
      .then((response) => {
        if (controller.signal.aborted) return;
        setForm(response.data);
      })
      .catch((err) => {
        if (isAbortError(err) || controller.signal.aborted) return;
        setError("Unable to load profile.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => {
      controller.abort();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        ...form,
        address: form.address,
      };
      if (password) {
        payload.password = password;
        payload.password_confirmation = passwordConfirmation;
      }
      const response = await apiFetch<{ data: ProfilePayload }>("/auth/me", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setForm(response.data);
      setPassword("");
      setPasswordConfirmation("");
      setMessage("Profile updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update profile.");
    }
  }

  function updateField<K extends keyof ProfilePayload>(key: K, value: ProfilePayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateAddressField(key: keyof ProfilePayload["address"], value: string) {
    setForm((prev) => ({
      ...prev,
      address: { ...prev.address, [key]: value },
    }));
  }

  return (
    <div className="grid gap-6">
      <Card title="Profile" subtitle="Update your contact info and login">
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : (
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <label className="text-sm">
              Full name
              <TextInput
                className="mt-1"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                required
              />
            </label>
            <label className="text-sm">
              Email
              <TextInput
                type="email"
                className="mt-1"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                required
              />
            </label>
            <label className="text-sm">
              Phone
              <TextInput
                className="mt-1"
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
              />
            </label>
            <label className="text-sm">
              Address line 1
              <TextInput
                className="mt-1"
                value={form.address.line1}
                onChange={(event) => updateAddressField("line1", event.target.value)}
              />
            </label>
            <label className="text-sm">
              Address line 2
              <TextInput
                className="mt-1"
                value={form.address.line2}
                onChange={(event) => updateAddressField("line2", event.target.value)}
              />
            </label>
            <label className="text-sm">
              City
              <TextInput
                className="mt-1"
                value={form.address.city}
                onChange={(event) => updateAddressField("city", event.target.value)}
              />
            </label>
            <label className="text-sm">
              State
              <TextInput
                className="mt-1"
                value={form.address.state}
                onChange={(event) => updateAddressField("state", event.target.value)}
              />
            </label>
            <label className="text-sm">
              Postal code
              <TextInput
                className="mt-1"
                value={form.address.postal}
                onChange={(event) => updateAddressField("postal", event.target.value)}
              />
            </label>
            <label className="text-sm">
              Country
              <TextInput
                className="mt-1"
                value={form.address.country}
                onChange={(event) => updateAddressField("country", event.target.value)}
              />
            </label>
            <label className="text-sm">
              New password
              <TextInput
                type="password"
                className="mt-1"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Leave blank to keep current"
                minLength={8}
              />
            </label>
            <label className="text-sm">
              Confirm password
              <TextInput
                type="password"
                className="mt-1"
                value={passwordConfirmation}
                onChange={(event) => setPasswordConfirmation(event.target.value)}
                placeholder="Repeat new password"
                minLength={8}
              />
            </label>
            <div className="md:col-span-2 flex flex-wrap items-center gap-3">
              <Button type="submit">Save profile</Button>
              {message && <p className="text-sm text-emerald-600">{message}</p>}
              {error && <p className="text-sm text-rose-600">{error}</p>}
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
