# 🎓 Study Flow Organizer v4.0

[![Architecture: Modular & Secure](https://img.shields.io/badge/Architecture-Modular%20%26%20Secure-success.svg)](#)
[![Zero NPM Dependencies](https://img.shields.io/badge/Dependencies-Zero%20NPM%20Modules-blue.svg)](#)
[![Windows Explorer Integration](https://img.shields.io/badge/Windows-Native%20Folder%20Bridge-orange.svg)](#)
[![Two-Way Disk Persistence](https://img.shields.io/badge/Disk%20Persistence-Live%20Two--Way%20Sync-brightgreen.svg)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An intelligent, privacy-first, 100% offline academic deadline planner, schedule matrix, and course folder organizer. Built for university students, researchers, and self-learners who want total control over their academic life with direct local disk persistence and native Windows Explorer integration.

---

## 🌟 Key Features

### 🗂️ 1. Clean Course Hub & Modular Architecture
* **Clean Starter State**: Ships with zero dummy data—add your own courses, course codes, and gradient color themes.
* **Modular ES Modules**: Clean separation of concerns across CSS and JavaScript modules—no monolithic single-file spaghetti.
* **Instant Frictionless Access**: Zero fake client-side login or password hurdles.

### 💾 2. Genuine Two-Way Disk Persistence & Safety Snapshots
* **Direct Disk Link**: Connects directly to `data/study_flow_data.json` on disk via a zero-dependency local Node.js server.
* **Automatic Safety Snapshots**: Every write to disk automatically creates a timestamped safety backup in `data/backups/`.
* **Redundant Browser Fallback**: If launched directly without the local server, transparently operates in standalone browser mode with `localStorage`.

### 📁 3. Safe Windows File Explorer Integration
* **One-Click Folder Opening**: Click any linked folder to open it directly in **Windows File Explorer** safely via backend child process spawning.
* **Native Windows Folder Picker**: Select course folders directly through a native Windows folder browser dialog without manual copying or brittle custom protocols.

### 📑 4. High-Density Views: Cards, Table Matrix & Proportional Timeline
* **Cards Grid View**: Course cards with progress indicators, upcoming deadline badges, and expandable task drawers.
* **Courses & Schedule Matrix (Table View)**: High-density schedule matrix with quick inline subject editing, countdown chips, and expandable course accordions.
* **Proportional Timeline View**: Milestones where vertical spacing scales proportionally to actual time intervals between deadlines.
* **Smart Urgency Engine**: Highlights deadlines as **Overdue**, **Urgent (≤48h)**, **Medium**, or **Calm** with live day/hour countdowns.

### 🚀 5. Automated Git Sync Dashboard
* **Dynamic Remote Detection**: Detects your actual configured Git remote repository and active branch dynamically.
* **In-App GitHub Sync**: One-click button in the header and matrix to review status and push updates.
* **Interactive CLI Dashboards**: `Push_To_GitHub.bat` and `Pull_From_GitHub.bat` for interactive terminal workflows with data preservation.

---

## 📂 Project Structure

```text
Study_Flow_Organizer/
│
├── Launch_Study_Flow.bat            # ⚡ One-click launcher (starts server & opens browser)
├── Push_To_GitHub.bat               # 🚀 Automated terminal dashboard to push updates
├── Pull_From_GitHub.bat             # 🔄 Safe pull dashboard with data preservation
├── README.md                        # Documentation and architecture guide
├── LICENSE                          # MIT License
├── .gitignore                       # Safeguards backups & user files
│
├── server/                          # Local Node.js API & Static Server (Zero dependencies)
│   └── server.js                    # REST API: persistence, explorer launcher, git sync
│
├── app/                             # Modular Client Application
│   ├── index.html                   # Semantic HTML shell (~250 lines)
│   ├── css/                         # Modular CSS Stylesheets
│   │   ├── variables.css            # Color tokens, glassmorphism variables
│   │   ├── base.css                 # Reset, typography, utility classes, buttons
│   │   ├── components.css           # Header, toolbar, search, filter pills, stats, toasts
│   │   ├── views.css                # Cards grid, table matrix, and timeline view styles
│   │   └── modals.css               # Modal dialog overlays and form styles
│   └── js/                          # Native ES Modules
│       ├── app.js                   # Application bootstrap, routing, keyboard shortcuts
│       ├── state.js                 # Central reactive state store & data normalization
│       ├── api.js                   # REST API client with offline fallback
│       ├── dateUtils.js             # Gregorian ISO-8601 formatting, countdowns & urgency
│       ├── views/                   # Dynamic view renderers
│       │   ├── cardsView.js         # Subjects grid & compact task drawer
│       │   ├── tableView.js         # Courses & schedule matrix
│       │   └── timelineView.js      # Chronological proportional timeline
│       └── modals/                  # Dialog controllers
│           ├── itemModal.js         # Task & Event create/edit dialog
│           ├── subjectModal.js      # Course subject create/edit dialog
│           ├── folderModal.js       # Native folder linking dialog
│           ├── gitModal.js          # In-app GitHub sync dashboard
│           └── backupModal.js       # Backup, export/import & disk management
│
├── data/                            # Academic Database & Backups
│   ├── study_flow_data.json         # Active local database (your subjects & schedule)
│   ├── study_flow_data.template.json# Starter template for fresh installations
│   └── backups/                     # Automatic timestamped safety backups
│
└── scripts/                         # Maintenance & CLI Dashboards
    ├── Deregister_Legacy_Protocol.bat # Safely removes legacy unsafe openfile:// registry key
    ├── Register_System_File_Launcher.bat # Deprecation notice directing to local server
    ├── sync_github.ps1              # Dynamic Git push engine
    └── pull_github.ps1              # Safe pull engine
```

---

## 🚀 Quick Start Guide

### Step 1: Clone the Repository
```bash
git clone https://github.com/sinasharifi-7462/Study_Flow_Organizer.git
cd Study_Flow_Organizer
```

### Step 2: Launch Study Flow Organizer
Simply double-click **`Launch_Study_Flow.bat`**!

* If Node.js is installed on your computer, it starts the local server (`http://127.0.0.1:3456`) and opens the dashboard in your default browser.
* If Node.js is not present, it gracefully launches in **Standalone Browser Mode** using `localStorage`.

### Step 3 (Optional): Remove Legacy Protocol (If Previously Installed)
If you previously ran the old `Register_System_File_Launcher.bat` from version 3.x, double-click **`scripts/Deregister_Legacy_Protocol.bat`** to clean up the legacy `openfile://` Windows Registry key. Version 4.0 uses the safe local server instead.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + N` | Open New Task / Event dialog |
| `Escape` | Close any active modal dialog |
| `/` or `Ctrl + F` | Focus the global search bar |
| `Ctrl + Shift + V` | Cycle between Cards, Matrix Table, and Timeline views |

---

## 🔒 Privacy & Security

* **100% Offline**: No remote tracking, zero external CDNs, and zero third-party telemetry.
* **Safe OS Execution**: Eliminates arbitrary URI protocol handlers in favor of a local server with strict path validation.
* **Data Ownership**: Your schedule lives exclusively on your local disk in `data/study_flow_data.json`.
* **Personal Data Protection**: Backups (`data/backups/`) and personal JSON files are excluded by `.gitignore`.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) — free to use, modify, and distribute for personal and educational purposes.
