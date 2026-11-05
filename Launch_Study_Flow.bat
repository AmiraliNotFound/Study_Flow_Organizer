@echo off
title Launching Study Flow Organizer v4.0...
cd /d "%~dp0"

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% equ 0 (
    echo Starting local Study Flow server...
    start /min "Study Flow Server" node "%~dp0server\server.js"
    timeout /t 1 /nobreak >nul
    start "" "http://127.0.0.1:3456"
) else (
    echo Node.js not detected. Opening in Standalone Browser Mode...
    start "" "%~dp0app\index.html"
)

exit
