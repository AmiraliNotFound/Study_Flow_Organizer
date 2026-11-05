@echo off
title Removing Legacy OpenFile Protocol Handler...
echo ======================================================================
echo  Removing Legacy OpenFile Protocol from Study Flow Organizer
echo  Secures your system against arbitrary protocol URL invocations
echo ======================================================================

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$key = 'HKCU:\Software\Classes\openfile'; " ^
  "if (Test-Path $key) { " ^
  "    Remove-Item -Path $key -Recurse -Force; " ^
  "    Write-Host 'SUCCESS: Legacy openfile:// protocol deregistered from registry.' -ForegroundColor Green; " ^
  "} else { " ^
  "    Write-Host 'Protocol was not registered or already removed.' -ForegroundColor Yellow; " ^
  "}"

echo.
echo Operation Complete! The secure local Node.js server is now used instead.
echo.
pause
