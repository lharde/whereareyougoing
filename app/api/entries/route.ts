import { kv } from "@vercel/kv";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

type Entry = {
  id: string;
  name: string;
  country: string;
  university: string;
  createdAt: string;
};

const KEY = "semester_abroad_entries_v2";
const KV_MISSING_ERROR = "Storage is not configured. Connect Vercel KV to this project.";

function isKvConfigured() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

function byCountry(a: Entry, b: Entry) {
  return (
    a.country.localeCompare(b.country, undefined, { sensitivity: "base" }) ||
    a.university.localeCompare(b.university, undefined, { sensitivity: "base" }) ||
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );
}

export async function GET() {
  if (!isKvConfigured()) {
    return NextResponse.json({ error: KV_MISSING_ERROR }, { status: 500 });
  }

  try {
    const raw = await kv.lrange<(Entry & { city?: string })>(KEY, 0, -1);
    const entries = raw
      .map((entry) => ({
        ...entry,
        country: entry.country ?? entry.city ?? ""
      }))
      .filter((entry) => entry.country)
      .sort(byCountry);

    return NextResponse.json({ entries });
  } catch {
    return NextResponse.json({ error: KV_MISSING_ERROR }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isKvConfigured()) {
    return NextResponse.json({ error: KV_MISSING_ERROR }, { status: 500 });
  }

  try {
    const body = (await request.json()) as Partial<Entry>;
    const name = body.name?.trim() ?? "";
    const country = body.country?.trim() ?? "";
    const university = body.university?.trim() ?? "";

    if (!name || !country || !university) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    const entry: Entry = {
      id: randomUUID(),
      name: name.slice(0, 80),
      country: country.slice(0, 80),
      university: university.slice(0, 120),
      createdAt: new Date().toISOString()
    };

    await kv.lpush(KEY, entry);

    return NextResponse.json({ entry }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not save entry. Please try again." }, { status: 500 });
  }
}
