# Legacy protocol handler deprecated in v4.0
param ([string]$RawUri)

Write-Host "======================================================================" -ForegroundColor Yellow
Write-Host " NOTICE: The openfile:// protocol has been deprecated in v4.0+" -ForegroundColor Red
Write-Host " Study Flow Organizer now uses a secure local server." -ForegroundColor Yellow
Write-Host " Please run scripts/Deregister_Legacy_Protocol.bat to clean up this registry key." -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Yellow

Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.MessageBox]::Show(
    "The openfile:// protocol has been deprecated in Study Flow Organizer v4.0 in favor of a secure local server.`n`nPlease run scripts\Deregister_Legacy_Protocol.bat to remove this legacy handler.",
    "Study Flow Organizer - Protocol Deprecated",
    [System.Windows.Forms.MessageBoxButtons]::OK,
    [System.Windows.Forms.MessageBoxIcon]::Information
)
