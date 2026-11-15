# Bismi Radio JSON API

The JSON files under `data/` are the source of truth. The Node HTTP server loads the manifest and indexes from disk, caches parsed JSON by file modification time, serves the web app, and retains the existing static `/api/v1/*.json` resources for compatibility.

## Run locally

```powershell
npm ci
npm run build
npm start
```

The server listens on `http://localhost:10000` by default. Set `PORT` to change the port, `HOST` to change the bind address, and `CORS_ORIGIN` to a comma-separated origin allowlist. The default CORS origin is `*`.

## Endpoints

All structured endpoints use the `/api/v1` prefix.

| Endpoint | Description |
|---|---|
| `GET /health` | Health check for deployment platforms |
| `GET /api/v1/manifest` | Main sections, order, language codes, and index paths |
| `GET /api/v1/categories` | Seven top-level sections with their nested category/collection lists |
| `GET /api/v1/categories?section=duas` | Dua categories only |
| `GET /api/v1/categories/:id` | A section index, category data file, or collection |
| `GET /api/v1/collections` | All section indexes and their registered collections |
| `GET /api/v1/collections/:collectionId` | Original JSON content for an available collection |
| `GET /api/v1/duas` | Paginated records in the public Dua categories |
| `GET /api/v1/duas/:id` | A Dua by stable ID |
| `GET /api/v1/dhikr` | Daily Dhikir entries and records |
| `GET /api/v1/dhikr/:id` | A Dhikr category or record |
| `GET /api/v1/mawlid` | Mawlid collection index |
| `GET /api/v1/baith` | Baith collection index |
| `GET /api/v1/salawath` | Salawath collection index |
| `GET /api/v1/rathib` | Rathib collection index |
| `GET /api/v1/asma-ul-husna` | Asma Ul Husna source JSON |
| `GET /api/v1/asma-ul-anbiya` | Asma Ul Anbiya source JSON |
| `GET /api/v1/asma-un-nabi` | Asma Un Nabi source JSON |
| `GET /api/v1/search?q=...` | Search Arabic, transliteration, titles, translations, and indexed collection text |

Collection endpoints accept `?collection=<id>` or a collection ID path where applicable. Dua listings accept `?category=<id>` and `?collection=forty-rabbana`. Dhikr listings accept `?category=<id>`.

Paginated endpoints accept `page` and `limit` (default 1 and 50; maximum limit 100). `lang` accepts a language code from the manifest. When filtering by a language, a record without that translation is omitted; English is never substituted for a missing translation. Unfiltered requests return each source record with its original structure.

Errors use a JSON object such as:

```json
{
  "error": {
    "code": "not_found",
    "message": "Dua not found."
  }
}
```

## Data organization and verification

`data/manifest.json` registers the ordered main sections: Duas, Daily Dhikir, Moulid, Baith, Salawath, Rathib, and Others. Each section index references content files without converting their collection-specific JSON formats. Existing app/API records are retained in their original files and exposed through indexes.

Daily Dhikir contains the ten entries supplied for the section, with translations for all ten app languages and no invented repetition counts. The supplied deeper-meaning notes are retained in English. References are reproduced as provided and should be checked against their cited editions. The named Salawath and Rathib collections are pending source verification. The existing Subuhana Mawlid translation metadata also notes that human review is required.

Run the schema and integrity report with:

```powershell
npm run validate:database
```

The report distinguishes structural validity from collection completeness, and reports missing Arabic, references, translations, and pending collections.

## Legacy static JSON

Existing resources such as `/api/v1/duas.json`, `/api/v1/index.json`, and `/api/v1/rabbana-duas.json` remain available from the built `public/api/v1` directory. New API consumers should use the structured endpoints above.

## Render deployment

`render.yaml` configures a Node web service. Render runs `npm ci && npm run build`, starts with `npm start`, and checks `/health`. No external database or API key is required.
