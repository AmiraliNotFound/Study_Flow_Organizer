# 🎓 Study Flow Organizer

[![100% Offline](https://img.shields.io/badge/Architecture-100%25%20Offline-success.svg)](#)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero%20CDN%20%2F%20Self--Contained-blue.svg)](#)
[![Windows Explorer Integration](https://img.shields.io/badge/Windows-Native%20Folder%20Bridge-orange.svg)](#)
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
* **Zero Manual Copy/Pasting**: Uses an automated Windows folder browser bridge—select the folder in Windows dialog, and the path is automatically captured and connected.

### 📑 3. Interactive Matrix & Cards Views
* **Cards Grid View**: Beautiful, responsive subject cards with progress indicators, upcoming deadline badges, and expandable task drawers.
* **Courses & Schedule Matrix (Table View)**: High-density schedule matrix with quick inline subject editing (pencil icon), deadline countdown chips, and expandable course accordions.
* **Smart Urgency Engine**: Automatically highlights deadlines as **Overdue**, **Urgent (≤2 days)**, **Medium**, or **Calm**, with precise day countdowns.

### 🛠️ 4. Customizable Task & Event Types
* Manage types across academic work:
  * **Tasks**: Assignments, Homework (HW), Projects, Lab Reports, Reading, Custom.
  * **Events**: Quizzes, Midterms, Final Exams, Presentations, Review Sessions.
* Create, customize, and color-code your own types on the fly.

### 💾 5. 100% Offline & Direct Disk Persistence
* **HTML5 File System Access API**: Connect directly to `study_flow_data.json` on disk. Changes save automatically to your local file.
* **Local Storage Redundancy**: Dual persistence ensures your data is never lost, even if offline.
* **Zero External Dependencies**: Operates completely self-contained with no remote CDNs or third-party tracking scripts.

### 🚀 6. Automated GitHub Push & Sync Dashboard
* **In-App GitHub Sync Modal**: One-click button in the header and Courses Matrix to review local course counts and trigger automated pushes.
* **Interactive CLI Dashboard (`push_to_github.bat`)**: Beautiful terminal menu to quick-push updates, commit custom messages, or reset to a clean public template.

---

## 🚀 Quick Start Guide

### Step 1: Clone the Repository
```bash
git clone https://github.com/sinasharifi-7462/Study_Flow_Organizer.git
cd Study_Flow_Organizer
```

### Step 2: Register Native Windows Folder Launcher (One-Time Setup)
To allow the browser to open local folders directly in Windows File Explorer:
1. Right-click **`Register_System_File_Launcher.bat`** and click **Run as administrator** (or run standard).
2. This registers the lightweight `openfile://` protocol handler in Windows (`open_file_launcher.ps1`).

### Step 3: Open the Organizer
Simply double-click **`index.html`** or open it in any modern browser (Chrome, Edge, Firefox, Brave, Opera).

---

## 📂 Project Structure

```text
Study_Flow_Organizer/
├── index.html                       # Complete single-page application (UI, Styles, Logic)
├── study_flow_data.json             # Raw starter JSON database for subjects & schedule
├── open_file_launcher.ps1           # Windows protocol bridge for native explorer opening
├── Register_System_File_Launcher.bat # Windows Registry installer for openfile:// protocol
├── sync_github.ps1                  # Interactive PowerShell GitHub sync dashboard
├── push_to_github.bat               # One-click Windows batch launcher for GitHub sync
├── .gitignore                       # Clean repository exclusions (personal data ignored)
└── README.md                        # Documentation and user guide
```

---

## 🔄 Automated GitHub Sync Dashboard

Keep your organizer repository updated as you add new subjects and semesters:

### Method A: Inside the App (Browser)
1. Click the **🚀 GitHub Sync** icon in the top header (or inside the Courses Matrix).
2. Review your local snapshot (number of subjects, tasks, and folders).
3. Click **"⚡ Automated One-Click Push to GitHub"**.

### Method B: Via Terminal (`push_to_github.bat`)
1. Double-click **`push_to_github.bat`**.
2. An interactive terminal dashboard will open:
   * **[1] Quick Push**: Auto-commits and pushes with the current date/time.
   * **[2] Custom Commit**: Enter a specific description (e.g. `Add Machine Learning syllabus`).
   * **[3] Reset to Raw Public Template**: Cleans local personal data for sharing public templates.
   * **[4] View Git Status**: Check modified files before pushing.

---

## 🔒 Privacy & Data Ownership

* **No tracking**: Zero Google Analytics, cookies, or remote tracking.
* **No external servers**: Your academic data lives exclusively on your local disk in `study_flow_data.json`.
* **Personal Data Protection**: Personal course files and scratch files are automatically excluded via `.gitignore`.

---

## 👤 Author & Maintainer

* **Sina Sharifi**
* **Email**: [Sinasharifi7462@gmail.com](mailto:Sinasharifi7462@gmail.com)
* **GitHub**: [@sinasharifi-7462](https://github.com/sinasharifi-7462)
* **Repository**: [https://github.com/sinasharifi-7462/Study_Flow_Organizer](https://github.com/sinasharifi-7462/Study_Flow_Organizer)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) — free to use, modify, and distribute for personal and educational purposes.
