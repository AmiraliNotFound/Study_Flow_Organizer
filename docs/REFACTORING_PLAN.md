# 🛠️ Study Flow Organizer: Redesign & Modernization Plan

This document outlines the architectural refactoring of **Study Flow Organizer** from a single-file prototype into a secure, modular, offline academic workspace.

---

## 1. Objectives

1. **Eliminate the 6,859-line HTML Monolith**: Modularize into clean CSS files and modern JavaScript ES modules (`app/css/` and `app/js/`).
2. **Resolve Critical RCE Security Vulnerability**: Replace the unsafe `openfile://` Windows Registry protocol handler with a safe local backend.
3. **Genuine Disk Persistence**: Connect the UI directly to `data/study_flow_data.json` via a zero-dependency local Node.js server, ensuring all changes persist to disk and sync with Git.
4. **Purge "AI Slop" Artifacts**:
   - Remove fake SHA-256 client auth and plaintext password storage in `localStorage`.
   - Purge ghost Shamsi/Persian calendar variables and functions (`taskShamsiYear`, `syncShamsiToGregorian`, `isFa`).
   - Fix inline XSS string interpolation holes.
5. **Dynamic Git Integration**: Replace hardcoded author URLs with dynamic repository detection via `git remote get-url origin`.
6. **Preserve All User Capabilities**: Keep the dark glassmorphic design, Cards grid view, Table schedule matrix, Proportional timeline, countdown urgency badges, and Windows folder linking.

---

## 2. Directory Layout (Redesigned)

```text
Study_Flow_Organizer/
├── Launch_Study_Flow.bat            # Starts local server & opens browser
├── Push_To_GitHub.bat               # Interactive PowerShell sync dashboard
├── Pull_From_GitHub.bat             # Safe pull with data preservation
├── README.md                        # Upgraded documentation
├── LICENSE                          # MIT License
├── .gitignore                       # Git ignore list
│
├── server/                          # Zero-dependency local Node.js backend
│   └── server.js                    # REST API (data persistence, explorer, git)
│
├── app/                             # Frontend client
│   ├── index.html                   # Clean, semantic HTML shell (~250 lines)
│   ├── css/                         # Modular CSS
│   │   ├── variables.css            # Color tokens & theme variables
│   │   ├── base.css                 # Reset, typography, utility classes
│   │   ├── components.css           # Badges, pills, statistics strip, toasts
│   │   ├── views.css                # Cards grid, Table matrix, Timeline styles
│   │   └── modals.css               # Modal overlays and form styling
│   └── js/                          # Native ES Modules
│       ├── app.js                   # Application bootstrap & lifecycle
│       ├── state.js                 # Central reactive state store
│       ├── api.js                   # REST API client with offline fallback
│       ├── dateUtils.js             # Gregorian ISO-8601 utilities & urgency engine
│       ├── views/                   # Dynamic view renderers
│       │   ├── cardsView.js         # Subjects grid & compact task drawer
│       │   ├── tableView.js         # High-density schedule matrix
│       │   └── timelineView.js      # Chronological proportional timeline
│       └── modals/                  # Dialog controllers
│           ├── itemModal.js         # Task & Event create/edit dialog
│           ├── subjectModal.js      # Course subject create/edit dialog
│           ├── folderModal.js       # Native folder linking dialog
│           ├── gitModal.js          # In-app GitHub sync dashboard
│           └── backupModal.js       # Backup, export/import & disk management
│
├── data/                            # Academic database & backups
│   ├── study_flow_data.json         # Active local database
│   ├── study_flow_data.template.json# Starter template
│   └── backups/                     # Automatic timestamped safety snapshots
│
├── scripts/                         # Maintenance and automation scripts
│   ├── Deregister_Legacy_Protocol.bat # Removes legacy unsafe openfile:// registry key
│   ├── sync_github.ps1              # Dynamic Git push engine
│   └── pull_github.ps1              # Safe pull engine
│
└── docs/
    └── REFACTORING_PLAN.md          # This action plan
```

---

## 3. Implementation Phases

- **Phase 1: Zero-Dependency Local Backend (`server/server.js`)**
  - Implement built-in `node:http` server with zero npm dependencies.
  - Endpoints: `GET/POST /api/data`, `POST /api/open-folder`, `POST /api/pick-folder`, `GET/POST /api/git/...`.
  - Static file server for `app/`.

- **Phase 2: Security & Scripts Cleanup**
  - Provide `scripts/Deregister_Legacy_Protocol.bat`.
  - Sanitize PowerShell sync scripts (remove hardcoded author names; detect git remote dynamically).
  - Update `Launch_Study_Flow.bat` to boot server and launch browser.

- **Phase 3: Frontend Deconstruction & Modularization**
  - Extract CSS into 5 clean stylesheets (`variables.css`, `base.css`, `components.css`, `views.css`, `modals.css`).
  - Modularize JS into ES modules (`app.js`, `state.js`, `api.js`, `dateUtils.js`, `views/*`, `modals/*`).
  - Rewrite `index.html` to a clean, semantic document.

- **Phase 4: Purge Slop Code & Fix XSS**
  - Remove `fastSha256` and fake authentication screen.
  - Replace ghost Shamsi variables with standard Gregorian date picker.
  - Fix unsanitized `onclick` ID interpolation using data attributes and event delegation.

- **Phase 5: Verification & End-to-End Testing**
  - Test data read/write directly to `data/study_flow_data.json`.
  - Test folder opening in Windows Explorer.
  - Test all views, filters, and Git sync.

- **Phase 6: Commit and PR Preparation**
  - Clean Git commit history on branch `refactor/clean-architecture`.
