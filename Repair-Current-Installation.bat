@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Repair-Current-Installation.ps1"
if errorlevel 1 (
  echo.
  echo Repair failed. Read WINLINK-FIX.md and reinstall to C:\YanpbCodeLab if needed.
)
pause
