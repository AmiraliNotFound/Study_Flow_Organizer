@echo off
title Study Flow Organizer - GitHub Push Dashboard
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\sync_github.ps1"
pause
