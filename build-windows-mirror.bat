@echo off
setlocal
cd /d "%~dp0"
echo Trying Electron mirror for Windows build...
call "%~dp0build-windows.bat" -ElectronSource Mirror %*
