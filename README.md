# OBD Dashboard

A locally-hosted web dashboard for visualizing OBD-II drive session data exported from the [Car Scanner ELM OBD2](https://www.carscanner.info/) iOS app.

Bring your own CSV exports — no accounts, no cloud, no hardcoded vehicle logic.

## Stack

- **Next.js 16** (App Router) + TypeScript
- **Drizzle ORM** + SQLite (`better-sqlite3`)
- **shadcn/ui** + Tailwind CSS
- **Recharts** for time-series charts
- **Leaflet** + CartoDB tiles for GPS route maps

## Getting Started

**Install dependencies:**
```bash
pnpm install
```

**Run migrations:**
```bash
pnpm db:migrate
```

**Ingest your CSV exports:**
```bash
pnpm ingest ./path/to/csv_exports/
# or a single file
pnpm ingest ./path/to/session.csv
```

**Start the dev server:**
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## CSV Format

Expects exports from Car Scanner ELM OBD2 (semicolon-delimited, quoted fields). Both 4-column (no GPS) and 6-column (with GPS) formats are supported.

Session names are extracted from filenames — e.g. `2025-10-23 Klamath Falls to Cave Junction.csv` shows up as *Klamath Falls to Cave Junction*.

## Features

- **Session list** with search, duration, distance, and row count
- **Charts tab** — per-PID time-series charts grouped by module (BECM, ECM, GPS, etc.), sparse PIDs hidden by default
- **Map tab** — GPS route with optional color gradient driven by any PID value
- **Browser upload** — drag-and-drop CSV upload with duplicate detection
- **Inline rename / delete** for sessions

## Data

`data.db` is gitignored — each user has their own local database.
