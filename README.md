# Where Are You Going?

A tiny web app for students to share their semester-abroad destination (country + university).

## Stack

- Next.js (App Router)
- Vercel KV for shared persistence

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env.local` and fill your Vercel KV env vars:

```bash
cp .env.example .env.local

KV_URL=...
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
KV_REST_API_READ_ONLY_TOKEN=...
```

3. Start dev server:

```bash
npm run dev
```

4. Open http://localhost:3000

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import the repo in Vercel.
3. In Vercel, add a **KV** database (Storage -> KV).
4. Connect the KV database to your project (this injects env vars automatically).
5. Deploy.

## Notes

- Data is stored in KV under `semester_abroad_entries_v2`.
- Writes are atomic (`LPUSH`) to avoid lost updates on concurrent submissions.
- Entries are shown sorted by country.
