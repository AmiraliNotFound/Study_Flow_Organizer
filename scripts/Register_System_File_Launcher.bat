@echo off
title Registering Study Flow Native File Launcher...
echo ======================================================================
echo  Setting up OpenFile Protocol for Study Flow Organizer
echo  Enables direct opening of PDFs in Foxit Reader & Videos in Media Player
echo ======================================================================

set SCRIPT_DIR=%~dp0
set PS_SCRIPT=%SCRIPT_DIR%open_file_launcher.ps1

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$key = 'HKCU:\Software\Classes\openfile'; " ^
  "if (!(Test-Path $key)) { New-Item -Path $key -Force | Out-Null }; " ^
  "Set-ItemProperty -Path $key -Name '(default)' -Value 'URL:Study Flow Open File Protocol'; " ^
  "Set-ItemProperty -Path $key -Name 'URL Protocol' -Value ''; " ^
  "$cmd = \"$key\shell\open\command\"; " ^
  "if (!(Test-Path $cmd)) { New-Item -Path $cmd -Force | Out-Null }; " ^
  "$psPath = '%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe'; " ^
  "$execVal = \"powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `\"%PS_SCRIPT%`\" `\"%%1`\"\"; " ^
  "Set-ItemProperty -Path $cmd -Name '(default)' -Value $execVal; " ^
  "Write-Host 'SUCCESS: Native launcher registered in Windows!' -ForegroundColor Green;"

echo.
echo Setup Complete! You can now click any file link in Study Flow Organizer
echo and it will open directly in Foxit Reader or your default media player.
echo.
pause
