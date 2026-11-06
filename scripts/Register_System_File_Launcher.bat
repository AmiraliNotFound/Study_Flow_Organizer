@echo off
title Deprecated Protocol Installer - Study Flow Organizer v4.0
echo ======================================================================
echo  NOTICE: Custom openfile:// Protocol is DEPRECATED in v4.0+
echo ======================================================================
echo.
echo Study Flow Organizer v4.0 now uses a secure local Node.js server
echo that communicates directly with Windows File Explorer and native
echo folder dialogs without requiring any Windows Registry modifications.
echo.
echo If you previously registered the openfile:// protocol, please run:
echo   scripts\Deregister_Legacy_Protocol.bat
echo to safely remove it from your Windows Registry.
echo.
pause
