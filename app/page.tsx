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
  const [adminSecret, setAdminSecret] = useState("");
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminMessage, setAdminMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);

  const total = useMemo(() => entries.length, [entries]);
  const groupedEntries = useMemo(() => {
    const groups = new Map<string, Entry[]>();
    for (const entry of entries) {
      if (!groups.has(entry.country)) {
        groups.set(entry.country, []);
      }
      groups.get(entry.country)?.push(entry);
    }
    return Array.from(groups.entries()).map(([countryName, items]) => ({
      countryName,
      items
    }));
  }, [entries]);

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

  async function onUnlockAdmin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!adminSecret.trim()) {
      setAdminMessage("Enter admin password.");
      return;
    }

    setAdminUnlocked(true);
    setAdminMessage("Admin mode enabled.");
  }

  function onLockAdmin() {
    setAdminUnlocked(false);
    setAdminSecret("");
    setAdminMessage("Admin mode disabled.");
  }

  async function onDeleteEntry(id: string) {
    if (!adminUnlocked) {
      setAdminMessage("Enable admin mode first.");
      return;
    }

    setDeletingId(id);
    setAdminMessage(null);

    try {
      const res = await fetch("/api/entries", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": adminSecret
        },
        body: JSON.stringify({ id })
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Could not delete entry.");
      }

      setAdminMessage("Entry deleted.");
      await loadEntries();
    } catch (err) {
      const text = err instanceof Error ? err.message : "Could not delete entry.";
      setAdminMessage(text);
    } finally {
      setDeletingId(null);
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
        <div className="row">
          <strong>All destinations</strong>
          <button type="button" className="adminToggleButton" onClick={() => setShowAdminPanel((v) => !v)}>
            {showAdminPanel ? "Hide admin" : "Admin"}
          </button>
        </div>
        {showAdminPanel ? (
          <div className="adminPanel stack">
            {!adminUnlocked ? (
              <form onSubmit={onUnlockAdmin}>
                <input
                  value={adminSecret}
                  onChange={(e) => setAdminSecret(e.target.value)}
                  placeholder="Admin password"
                  type="password"
                  autoComplete="current-password"
                  required
                />
                <button type="submit" className="secondaryButton">
                  Enable admin mode
                </button>
              </form>
            ) : (
              <div className="stack">
                <p className="muted">Admin mode is active. Delete buttons are visible in the list.</p>
                <button type="button" className="secondaryButton" onClick={onLockAdmin}>
                  Disable admin mode
                </button>
              </div>
            )}
            {adminMessage ? <p className="muted">{adminMessage}</p> : null}
          </div>
        ) : null}
        {loading ? <p className="muted">Loading...</p> : null}
        {!loading && entries.length === 0 ? (
          <p className="muted">No entries yet. Be the first one.</p>
        ) : null}
        {!loading && entries.length > 0
          ? groupedEntries.map((group) => (
              <div key={group.countryName} className="countryGroup stack">
                <div className="row">
                  <strong>{group.countryName}</strong>
                  <span className="pill">{group.items.length}</span>
                </div>
                <ul>
                  {group.items.map((entry) => (
                    <li key={entry.id}>
                      <div className="row">
                        <strong>{entry.name}</strong>
                        <span className="muted">{new Date(entry.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="row">
                        <div className="muted">{entry.university}</div>
                        {adminUnlocked ? (
                          <button
                            type="button"
                            className="dangerButton"
                            onClick={() => void onDeleteEntry(entry.id)}
                            disabled={deletingId === entry.id}
                          >
                            {deletingId === entry.id ? "Deleting..." : "Delete"}
                          </button>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          : null}
      </section>
    </main>
  );
}
