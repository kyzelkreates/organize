# AP3X PROJECT RESCUE OS™

**Local-first Project Command Centre + Broken Build Recovery Dashboard**

> Rescue broken builds. Rank working systems. Rebuild with control.

**Owner:** Kyzel Kreates

---

## Features

- **Dashboard** — System health score, stat cards, recent activity, next best actions
- **Projects** — Full CRUD, status classification, priority, archive/restore, search & filter
- **Project Detail** — AI classification, portfolio & investor readiness checklists
- **Prompt Vault** — Store and reuse your best prompts, linked to projects, favourites
- **Error Centre** — Paste errors, auto-classify (401/403/RLS/CORS/build), track status
- **Repair Plans** — Step-by-step fix plans generated from projects or errors
- **Import / Export** — Full JSON backup and restore, demo data loader
- **Settings** — Compact mode, accent colours, reset

## Tech Stack

Pure HTML + CSS + JavaScript (ES Modules) · localStorage SSOT · No backend · Installable PWA

## Getting Started

```bash
npx serve .
# or
python3 -m http.server 3000
```

Go to **Import / Export → Load Demo Data** on first load to see all 5 sample projects.

## File Structure

```
/index.html  /manifest.json  /service-worker.js
/src/
  app.js  storage.js  router.js
  styles/styles.css
  components/  Sidebar.js TopBar.js StatCard.js ProjectCard.js
               PromptCard.js ErrorCard.js Modal.js EmptyState.js
               StatusBadge.js Toast.js
  pages/       DashboardPage.js ProjectsPage.js ProjectDetailPage.js
               PromptsPage.js ErrorCentrePage.js RepairPlansPage.js
               ImportExportPage.js SettingsPage.js
  utils/       classifiers.js validators.js formatters.js sampleData.js
```

> All data is stored in this browser using localStorage. No backend, no cloud sync, no external AI calls.

*Built by Kyzel Kreates*
