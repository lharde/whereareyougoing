"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Entry = {
  id: string;
  name: string;
  country: string;
  university: string;
  createdAt: string;
};

export default function HomePage() {
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [university, setUniversity] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);

  const total = useMemo(() => entries.length, [entries]);

  async function loadEntries() {
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/entries", { cache: "no-store" });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Could not load entries.");
      }
      const data = (await res.json()) as { entries: Entry[] };
      setEntries(data.entries);
    } catch (err) {
      const text = err instanceof Error ? err.message : "Could not load data. Please refresh.";
      setMessage({ text, type: "error" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadEntries();
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim() || !country.trim() || !university.trim()) {
      setMessage({ text: "Please fill in all fields.", type: "error" });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          country: country.trim(),
          university: university.trim()
        })
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Could not save entry.");
      }

      setName("");
      setCountry("");
      setUniversity("");
      setMessage({ text: "Entry saved.", type: "success" });
      await loadEntries();
    } catch (err) {
      const text = err instanceof Error ? err.message : "Could not save entry.";
      setMessage({ text, type: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="stack">
      <section className="stack">
        <h1>Where Are You Going?</h1>
        <p className="muted">Add your semester abroad destination and see where everyone ends up.</p>
      </section>

      <section className="card stack">
        <div className="row">
          <strong>Add your destination</strong>
          <span className="pill">{total} total</span>
        </div>

        <form onSubmit={onSubmit}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={80}
            required
          />
          <input
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="Country"
            maxLength={80}
            required
          />
          <input
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            placeholder="University"
            maxLength={120}
            required
          />
          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Submit"}
          </button>
        </form>

        {message ? <p className={message.type}>{message.text}</p> : null}
      </section>

      <section className="card stack">
        <strong>All destinations</strong>
        {loading ? <p className="muted">Loading...</p> : null}
        {!loading && entries.length === 0 ? (
          <p className="muted">No entries yet. Be the first one.</p>
        ) : null}
        {!loading && entries.length > 0 ? (
          <ul>
            {entries.map((entry) => (
              <li key={entry.id}>
                <div className="row">
                  <strong>{entry.name}</strong>
                  <span className="muted">{new Date(entry.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="muted">
                  {entry.country} - {entry.university}
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </main>
  );
}
