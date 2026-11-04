@echo off
title Study Flow Organizer - GitHub Pull & Data Preservation Dashboard
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\pull_github.ps1"
pause
