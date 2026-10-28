@echo off
setlocal
cd /d "%~dp0"
echo.
echo =========================================================
echo      Yanpb CodeLab Zero Config Windows Fast Builder
 echo =========================================================
echo.
echo This builds an installer and a portable EXE with GCC inside.
echo Node.js 22+ and internet are needed ONLY on this build PC.
echo Students DO NOT need Node.js, GCC or any internet access.
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\build-windows.ps1" %*
if errorlevel 1 (
  echo.
  echo Build failed. Check the detailed errors above.
  pause
  exit /b 1
)
echo.
echo Build complete. See dist-windows folder and size-report.json.
pause
