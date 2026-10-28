@echo off
cd /d "%~dp0"
if not exist node_modules (call npm install || (pause & exit /b 1))
call npm start
