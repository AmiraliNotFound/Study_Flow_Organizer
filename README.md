# 🎓 Study Flow Organizer

[![100% Offline](https://img.shields.io/badge/Architecture-100%25%20Offline-success.svg)](#)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero%20CDN%20%2F%20Self--Contained-blue.svg)](#)
[![Windows Explorer Integration](https://img.shields.io/badge/Windows-Native%20Folder%20Bridge-orange.svg)](#)
[![Data Preservation Engine](https://img.shields.io/badge/Git%20Pull-100%25%20Data%20Preservation-brightgreen.svg)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An intelligent, privacy-first, 100% offline academic deadline planner, subject matrix, and course folder organizer. Built for university students, researchers, and self-learners who want total control over their academic life without relying on cloud services, subscriptions, or external servers.

---

## 🌟 Key Features

### 🗂️ 1. Raw Planner & Custom Course Hub
* **Completely Raw & Ready**: Ships as a clean, ready-to-use template with zero sample or personal courses. Add your own subjects, course codes, and visual gradient themes.
* **Compact Task Drawer**: In Cards view, each subject displays its top 2 urgent items in a space-saving compact layout with an intuitive **"Show All Tasks"** expand toggle.
* **Full Course Hub Modal**: Deep dive into individual course analytics, syllabus items, and linked folder resources in a dedicated view.

### 📁 2. Native Windows File Explorer Folder Linking
* **Direct Explorer Opening**: Link any folder on your hard drive (e.g., lecture slides, lab manuals, reference materials) to a course.
* **One-Click Native Windows Launcher**: Click any folder in the dashboard to open it directly in **Windows File Explorer** using a lightweight custom protocol (`openfile://`).
* **Zero Manual Copy/Pasting**: Uses an automated Windows folder browser bridge—select the folder in the native Windows dialog, and the path is automatically captured and connected.

### 📑 3. Interactive Matrix & Cards Views
* **Cards Grid View**: Beautiful, responsive subject cards with progress indicators, upcoming deadline badges, and expandable task drawers.
* **Courses & Schedule Matrix (Table View)**: High-density schedule matrix with quick inline subject editing (pencil icon), deadline countdown chips, and expandable course accordions.
* **Smart Urgency Engine**: Automatically highlights deadlines as **Overdue**, **Urgent (≤2 days)**, **Medium**, or **Calm**, with precise day countdowns.

### 🛡️ 4. Automated Git Pull with 100% Data Preservation Guarantee
* **Zero Data Loss Guarantee**: When collaborators or contributors submit updates, enhancements, or bug fixes to GitHub, you can pull their changes with total confidence.
* **Smart Merge Engine (`Pull_From_GitHub.bat`)**:
  1. Creates an automatic timestamped backup in `data/backups/`.
  2. Safeguards your personal subjects, tasks, events, and linked folders in git-ignored storage.
  3. Pulls new code, schemas, and features from `origin/main`.
  4. Automatically restores and merges all your previous personal information into your active planner.
  5. Your academic data is never overwritten or lost during updates.

### 🛠️ 5. Customizable Task & Event Types
* Manage types across academic work:
  * **Tasks**: Assignments, Homework (HW), Projects, Lab Reports, Reading, Custom.
  * **Events**: Quizzes, Midterms, Final Exams, Presentations, Review Sessions.
* Create, customize, and color-code your own types on the fly.

### 💾 6. 100% Offline & Direct Disk Persistence
* **HTML5 File System Access API**: Connect directly to `data/study_flow_data.json` on disk. Changes save automatically to your local file.
* **Local Storage Redundancy**: Dual persistence ensures your data is never lost, even if offline.
* **Zero External Dependencies**: Operates completely self-contained with no remote CDNs or third-party tracking scripts.

### 🚀 7. Automated GitHub Push & Sync Dashboard
* **In-App GitHub Sync Modal**: One-click button in the header and Courses Matrix to review local course counts and trigger automated pushes.
* **Interactive CLI Dashboard (`Push_To_GitHub.bat`)**: Beautiful terminal menu to quick-push updates, commit custom messages, or reset to a clean public template.

---

## 📂 Project Structure

The project root is kept ultra-clean, containing only primary launchers and documentation for the user:

```text
Study_Flow_Organizer/
│
├── Launch_Study_Flow.bat            # ⚡ One-click desktop launcher to start the application
├── Push_To_GitHub.bat               # 🚀 Automated dashboard to push updates to GitHub
├── Pull_From_GitHub.bat             # 🔄 Safe pull dashboard (preserves your personal data)
├── README.md                        # Documentation and user guide
├── LICENSE                          # MIT License
├── .gitignore                       # Safeguards personal data & backup snapshots
│
├── app/                             # Core Application Folder
│   └── index.html                   # Complete single-page application (UI, Styles, Logic)
│
├── data/                            # Academic Database & Backups
│   ├── study_flow_data.json         # Active local database (your subjects & schedule)
│   ├── study_flow_data.template.json# Pristine raw template for new users
│   └── backups/                     # Automatic timestamped safety backups (git-ignored)
│
└── scripts/                         # System Bridges & Automation Engines
    ├── open_file_launcher.ps1       # Windows protocol bridge for native explorer opening
    ├── Register_System_File_Launcher.bat # Windows Registry installer for openfile:// protocol
    ├── sync_github.ps1              # Interactive PowerShell GitHub sync & push dashboard
    └── pull_github.ps1              # Smart-merge pull engine with zero data loss guarantee
```

---

## 🚀 Quick Start Guide

### Step 1: Clone the Repository
```bash
git clone https://github.com/sinasharifi-7462/Study_Flow_Organizer.git
cd Study_Flow_Organizer
```

### Step 2: Register Native Windows Folder Launcher (One-Time Setup)
To allow the browser to open local folders directly in Windows File Explorer:
1. Double-click or run as administrator **`scripts/Register_System_File_Launcher.bat`**.
2. This registers the lightweight `openfile://` protocol handler in Windows (`scripts/open_file_launcher.ps1`).

### Step 3: Launch Study Flow Organizer
Simply double-click **`Launch_Study_Flow.bat`** (or open `app/index.html` in Chrome, Edge, Firefox, Brave, or Opera).

---

## 🔄 User Dashboards & Workflows

### 1. Launching the App
* **Double-click `Launch_Study_Flow.bat`**: Opens the organizer in your default web browser instantly.

### 2. Pushing Updates to GitHub (`Push_To_GitHub.bat`)
Keep your repository updated as you add new subjects and improvements:
1. Double-click **`Push_To_GitHub.bat`**.
2. Select your desired option:
   * **[1] Quick Push**: Auto-commits and pushes with the current date/time.
   * **[2] Custom Commit**: Enter a specific description (e.g. `Add Machine Learning syllabus`).
   * **[3] Push Raw Public Planner Template**: Resets `data/study_flow_data.json` to a clean public starter template while backing up your personal courses to `data/study_flow_data.personal.json`.
   * **[4] Restore Personal Subjects**: Restores your personal courses into active data.
   * **[5] View Git Status**: Check modified files before pushing.
   * **[6] Pull Latest Changes**: Seamlessly launches the safe pull workflow.

### 3. Safely Pulling Contributor Updates (`Pull_From_GitHub.bat`)
When someone contributes to the project on GitHub:
1. Double-click **`Pull_From_GitHub.bat`**.
2. Select **[1] Safe Pull**.
3. The dashboard executes:
   * **Step 1**: Automatic snapshot saved in `data/backups/`.
   * **Step 2**: Personal subjects preserved in memory and git-ignored storage.
   * **Step 3**: `git pull origin main` retrieves contributor changes.
   * **Step 4**: Automatic restoration merges your existing courses, items, and linked folders back into the application.

---

## 🔒 Privacy & Data Ownership

* **No tracking**: Zero Google Analytics, cookies, or remote tracking.
* **No external servers**: Your academic data lives exclusively on your local disk in `data/study_flow_data.json`.
* **Personal Data Protection**: Personal course files (`*.personal.json`, `*.user.json`) and backup folders (`data/backups/`) are automatically excluded via `.gitignore`.

---

## 👤 Author & Maintainer

* **Sina Sharifi**
* **Email**: [Sinasharifi7462@gmail.com](mailto:Sinasharifi7462@gmail.com)
* **GitHub**: [@sinasharifi-7462](https://github.com/sinasharifi-7462)
* **Repository**: [https://github.com/sinasharifi-7462/Study_Flow_Organizer](https://github.com/sinasharifi-7462/Study_Flow_Organizer)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) — free to use, modify, and distribute for personal and educational purposes.
