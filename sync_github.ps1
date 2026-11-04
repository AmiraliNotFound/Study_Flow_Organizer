# ==============================================================================
# STUDY FLOW ORGANIZER - GITHUB AUTOMATION & SYNC DASHBOARD
# Repository: https://github.com/sinasharifi-7462/Study_Flow_Organizer
# Author: Sina Sharifi <Sinasharifi7462@gmail.com>
# ==============================================================================

$repoDir = $PSScriptRoot
Set-Location $repoDir

function Show-Header {
    Clear-Host
    Write-Host "======================================================================" -ForegroundColor Cyan
    Write-Host "             STUDY FLOW ORGANIZER - GITHUB SYNC DASHBOARD            " -ForegroundColor Yellow
    Write-Host "======================================================================" -ForegroundColor Cyan
    Write-Host " Repository: https://github.com/sinasharifi-7462/Study_Flow_Organizer" -ForegroundColor Gray
    Write-Host " Location  : $repoDir" -ForegroundColor Gray
    
    # Check subjects in study_flow_data.json
    $jsonPath = Join-Path $repoDir "study_flow_data.json"
    if (Test-Path $jsonPath) {
        try {
            $data = Get-Content $jsonPath -Raw | ConvertFrom-Json
            $subjCount = ($data.subjects).Count
            $itemsCount = ($data.items).Count
            $foldersCount = ($data.materials).Count
            Write-Host " Local Data: $subjCount Subjects | $itemsCount Tasks & Events | $foldersCount Folders" -ForegroundColor Green
        } catch {
            Write-Host " Local Data: study_flow_data.json present" -ForegroundColor Gray
        }
    }
    
    # Check git status
    $branch = (git branch --show-current 2>$null)
    if (!$branch) { $branch = "main" }
    Write-Host " Git Branch: $branch" -ForegroundColor Magenta
    Write-Host "======================================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Push-ToGitHub {
    param([string]$CommitMessage)

    Write-Host "`n[1/3] Staging changes..." -ForegroundColor Yellow
    git add -A

    $status = git status --porcelain
    if (-not $status) {
        Write-Host "No changes to commit. Everything is up to date!" -ForegroundColor Green
        Read-Host -Prompt "Press Enter to return to menu"
        return
    }

    Write-Host "[2/3] Creating commit: '$CommitMessage'..." -ForegroundColor Yellow
    git commit -m "$CommitMessage"

    Write-Host "[3/3] Pushing to origin main..." -ForegroundColor Yellow
    $pushResult = git push origin main 2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-Host "`nSUCCESS: Successfully pushed to GitHub!" -ForegroundColor Green
        Write-Host "Repository is live at: https://github.com/sinasharifi-7462/Study_Flow_Organizer" -ForegroundColor Cyan
    } else {
        Write-Host "`nPush encountered an issue:" -ForegroundColor Red
        Write-Host $pushResult -ForegroundColor DarkRed
    }

    Write-Host ""
    Read-Host -Prompt "Press Enter to return to menu"
}

function Push-RawTemplate {
    Write-Host "`nPreparing clean public raw planner template..." -ForegroundColor Yellow
    
    $jsonPath = Join-Path $repoDir "study_flow_data.json"
    $backupPath = Join-Path $repoDir "study_flow_data.personal.json"

    # Backup current data first
    if ((Test-Path $jsonPath) -and (-not (Test-Path $backupPath))) {
        Copy-Item -Path $jsonPath -Destination $backupPath -Force
        Write-Host "Backed up personal subjects to: study_flow_data.personal.json" -ForegroundColor Gray
    }

    $rawTemplate = @{
        "`$schema" = "StudyFlowOrganizer_v3"
        metadata = @{
            version = "3.1.0"
            appName = "Study Flow Organizer"
            lastSaved = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
            language = "en"
        }
        user = @{
            username = "student"
        }
        config = @{
            taskTypes = @(
                @{ id = "tt_hw"; name = "HW"; icon = "📚" },
                @{ id = "tt_project"; name = "Project"; icon = "💻" },
                @{ id = "tt_report"; name = "Lab Report"; icon = "📄" },
                @{ id = "tt_reading"; name = "Reading"; icon = "📖" },
                @{ id = "tt_custom"; name = "Custom"; icon = "📌" }
            )
            eventTypes = @(
                @{ id = "et_quiz"; name = "Quiz"; icon = "📝" },
                @{ id = "et_midterm"; name = "Midterm Exam"; icon = "🎓" },
                @{ id = "et_final"; name = "Final Exam"; icon = "🏆" },
                @{ id = "et_presentation"; name = "Presentation"; icon = "📊" },
                @{ id = "et_class"; name = "Review Session"; icon = "🏛️" },
                @{ id = "et_custom"; name = "Custom Event"; icon = "📌" }
            )
            materialTypes = @(
                @{ id = "mat_folder"; name = "Course Folder"; icon = "📁" }
            )
        }
        subjects = @()
        items = @()
        materials = @()
    }

    $rawTemplate | ConvertTo-Json -Depth 6 | Set-Content $jsonPath -Encoding UTF8
    Write-Host "study_flow_data.json set to raw starter template (0 subjects)." -ForegroundColor Green

    Push-ToGitHub -CommitMessage "Release clean raw planner template for public repository"
}

# Main Loop
while ($true) {
    Show-Header
    Write-Host "Select an action:" -ForegroundColor White
    Write-Host " [1] " -NoNewline -ForegroundColor Yellow; Write-Host "Quick Push (Auto-commit with date & time)"
    Write-Host " [2] " -NoNewline -ForegroundColor Yellow; Write-Host "Push with Custom Commit Message"
    Write-Host " [3] " -NoNewline -ForegroundColor Yellow; Write-Host "Push Raw Public Planner Template (Empty starter subjects)"
    Write-Host " [4] " -NoNewline -ForegroundColor Yellow; Write-Host "View Git Status & Pending Changes"
    Write-Host " [5] " -NoNewline -ForegroundColor Yellow; Write-Host "Pull Latest Changes from GitHub"
    Write-Host " [6] " -NoNewline -ForegroundColor Yellow; Write-Host "Exit"
    Write-Host ""
    $choice = Read-Host -Prompt "Enter option [1-6]"

    switch ($choice) {
        "1" {
            $ts = (Get-Date).ToString("yyyy-MM-dd HH:mm")
            Push-ToGitHub -CommitMessage "Update academic subjects & schedule ($ts)"
        }
        "2" {
            $msg = Read-Host -Prompt "Enter commit message"
            if ([string]::IsNullOrWhiteSpace($msg)) {
                $msg = "Update subjects and planner"
            }
            Push-ToGitHub -CommitMessage $msg
        }
        "3" {
            Push-RawTemplate
        }
        "4" {
            Write-Host "`n--- Git Status ---" -ForegroundColor Cyan
            git status
            Write-Host ""
            Read-Host -Prompt "Press Enter to return to menu"
        }
        "5" {
            Write-Host "`nPulling latest changes..." -ForegroundColor Yellow
            git pull origin main
            Read-Host -Prompt "Press Enter to return to menu"
        }
        "6" {
            Write-Host "Exiting. Goodbye!" -ForegroundColor Green
            exit 0
        }
        default {
            Write-Host "Invalid option. Please enter 1 to 6." -ForegroundColor Red
            Start-Sleep -Seconds 1
        }
    }
}
