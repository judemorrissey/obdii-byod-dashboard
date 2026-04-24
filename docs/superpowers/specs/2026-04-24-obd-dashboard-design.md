# OBD-II Dashboard — Design Spec

**Date:** 2026-04-24
**Status:** Approved

---

## Overview

A self-contained, locally-hosted web dashboard for visualizing OBD-II drive session data exported from the Car Scanner ELM OBD2 iOS app. BYOD (Bring Your Own Data) architecture — generic by design, no vehicle-specific logic hardcoded. Clone the repo, ingest your CSVs, run the app.

---

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript (strict) |
| Package manager | pnpm |
| ORM | Drizzle ORM |
| Database | SQLite via `better-sqlite3` |
| UI components | shadcn/ui + Tailwind CSS |
| Charts | Recharts (via shadcn chart) |
| Maps | Leaflet + CartoDB `dark_nolabels` tiles |

---

## Architecture

### Layers

**Ingestion Layer** — CSV parsing and DB population. Two entry points (CLI, browser upload) share the same pipeline logic in `lib/ingest/`.

**Data Layer** — SQLite file (`data.db`, gitignored). Drizzle ORM for schema, migrations, and typed queries.

**Server Layer** — Next.js App Router. Server Components query SQLite directly via `lib/queries/`. File upload uses a Route Handler (`POST /api/upload`) for direct multipart control. Session rename and delete use Server Actions (`lib/actions.ts`) — simpler, no URL needed.

**UI Layer** — Server Components for page shells and initial data. Client Components for Recharts charts, Leaflet map, and upload modal. Leaflet loaded via `next/dynamic(() => import('./MapView'), { ssr: false })` to avoid the `window` SSR issue.

### File Structure

```
obd-dashboard/
├── app/
│   ├── page.tsx                    # session list (Server Component)
│   ├── sessions/[id]/page.tsx      # session detail (Server Component shell)
│   ├── api/
│   │   └── upload/route.ts         # POST — CSV file upload
├── components/
│   ├── MapView.tsx                 # Client Component, ssr:false
│   ├── PidChart.tsx                # Client Component, Recharts
│   └── UploadModal.tsx             # Client Component, drag-drop
├── lib/
│   ├── db/
│   │   ├── schema.ts               # Drizzle schema
│   │   ├── client.ts               # DB singleton
│   │   └── migrations/             # Drizzle-generated migrations
│   ├── ingest/
│   │   ├── parse.ts                # CSV parsing
│   │   ├── normalize.ts            # filtering + group detection
│   │   └── writer.ts               # Drizzle upserts
│   └── queries/
│       ├── sessions.ts             # session list + detail queries
│       └── readings.ts             # PID readings queries
├── scripts/
│   └── ingest.ts                   # CLI entry point
├── data.db                         # SQLite file (gitignored)
└── drizzle.config.ts
```

---

## Data Model

### `sessions`
| Column | Type | Notes |
|---|---|---|
| id | integer PK | autoincrement |
| filename | text unique | original CSV filename, used for dedup |
| name | text | custom label if in filename, else derived from started_at |
| started_at | integer | unix ms, parsed from filename |
| duration_seconds | real | max(offset_seconds) from readings |
| pid_count | integer | distinct PIDs in session |
| row_count | integer | total reading rows |
| distance_miles | real nullable | computed from GPS coordinates at ingest; null if no GPS |
| has_gps | integer | 0/1, true if any non-null lat/lon |
| ingested_at | integer | unix ms |

### `pids`
| Column | Type | Notes |
|---|---|---|
| id | integer PK | autoincrement |
| name | text unique | as it appears in source CSV |
| unit | text | from source CSV |
| pid_code | text nullable | e.g. `010C` for standard OBD-II; null for CSV imports and proprietary PIDs |

`pid_code` is reserved for future BRC binary import, where numeric PID IDs are available. A separate `pid_definitions` table (with manufacturer column) is the long-term direction for canonical PID identity — deferred to a future phase.

### `readings`
| Column | Type | Notes |
|---|---|---|
| id | integer PK | autoincrement |
| session_id | integer | → sessions.id |
| pid_id | integer | → pids.id |
| offset_seconds | real | SECONDS column value as-is |
| value | real | numeric reading value |
| lat | real nullable | null if GPS unavailable or 0,0 |
| lon | real nullable | null if GPS unavailable or 0,0 |

Indexed on `(session_id, pid_id)` for fast per-PID chart queries.

### `pid_groups`
| Column | Type | Notes |
|---|---|---|
| id | integer PK | autoincrement |
| pid_id | integer | → pids.id |
| group_name | text | auto-detected at ingest, user-editable |
| display_name | text | optional override label |
| sort_order | integer | display ordering |

---

## Ingestion Pipeline

### Entry Points

**CLI** (`scripts/ingest.ts`):
```bash
pnpm ingest ./csv_data/          # bulk — processes all .csv files
pnpm ingest ./csv_data/file.csv  # single file
```
- Globs for `.csv` files in directory
- Skips filenames already in `sessions.filename`
- Progress bar per file, summary on completion

**Browser upload** (`app/api/upload/route.ts`):
- `POST` multipart/form-data, single or multiple files
- Duplicate filename → skipped, returns 409 with message
- Returns per-file result JSON

Both entry points call the shared pipeline in `lib/ingest/`.

### Shared Pipeline Stages

**1. parse.ts**
- Semicolon-delimited CSV, all fields quoted
- Normalizes `LONGTITUDE` header typo → `lon`
- Extracts session name from filename: date prefix stripped, remainder is the custom name (e.g. `"2025-10-23 Klamath Falls to Cave Junction.csv"` → `"Klamath Falls to Cave Junction"`)
- Falls back to ISO date string if no custom name

**2. normalize.ts**
- Filters rows with empty/unparseable values
- Filters GPS coordinates of exactly `0, 0` → stored as null
- PID group auto-detection (applied in order):
  1. Has `[MODULE]` bracket prefix → group = module name (e.g. `BECM`, `ECM`, `BCM`)
  2. Contains `(GPS)` suffix → group = `GPS`
  3. Everything else → group = `General`
- Computes session stats (duration, row count, pid count, has_gps)

**3. writer.ts**
- Upsert session row (keyed on filename)
- Upsert PIDs (dedup by name)
- Upsert pid_groups (auto-detected, only if not already user-modified)
- Bulk insert readings in batches of 1000

### Edge Cases
- **Tiny sessions** (<10 rows) — ingested, flagged, shown greyed out in UI
- **Re-ingestion** — filename unique constraint, CLI skips silently, upload returns 409
- **Sparse PIDs** (<10 readings in a session) — stored, hidden by default in session detail, toggleable
- **Missing GPS** — lat/lon stored as null, map tab hidden for sessions with no GPS data

---

## Pages

### `/` — Session List
Server Component. Queries all sessions ordered by `started_at` desc.
- Search/filter bar (client-side filtering on name/date)
- Each session row: name, date, duration, row count
- Tiny/empty sessions rendered greyed out
- Upload button opens `UploadModal`

### `/sessions/[id]` — Session Detail
Server Component shell, passes data to client components.
- Session header: name (inline rename), date, duration, distance, PID count
- **Charts tab** (default): PIDs grouped by `group_name`, each PID an expandable row with a Recharts time-series chart. Sparse PIDs hidden by default with a "show all" toggle.
- **Map tab**: `MapView` (Client Component, `ssr: false`). Hidden entirely if `session.has_gps = false`.

### Map Tab Detail
- Tile layer: CartoDB `dark_nolabels` (`https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png`, subdomains `abcd`)
- Route plotted as a Leaflet polyline
- Color gradient along route driven by a selected PID's value (dropdown to pick PID)
- Click on route point → tooltip showing timestamp + all PID values at that offset

### Upload Modal
Client Component. Drag-and-drop or file picker, multiple file support.
- Per-file progress indicator
- Result per file: ingested / skipped (duplicate) / error
- Refreshes session list on completion

---

## Key Constraints & Decisions

- `data.db` is gitignored — every user has their own local database
- No authentication — single-user local app
- No hardcoded PID names, groups, or thresholds anywhere in application code
- Leaflet always loaded with `{ ssr: false }` — never rendered server-side
- `pid_code` nullable on `pids` — null for all CSV imports, reserved for future BRC pipeline
- Standard OBD-II PID names from Car Scanner are consistent across vehicles, so name-as-identity is reliable for CSV-sourced data
- CartoDB tiles require no API key and work cleanly as a no-label base for data overlay

---

## Future Phases (Out of Scope for v1)

- **BRC binary import** — populate `pid_code` from binary PID IDs
- **`pid_definitions` table** — canonical PID registry with manufacturer column for cross-vehicle identity
- **Cross-session aggregation** — charts comparing a PID across multiple sessions
- **Live OBD** — real-time data via BLE adapter
- **Sparse PID filtering threshold** — currently hardcoded at 10, could be user-configurable
