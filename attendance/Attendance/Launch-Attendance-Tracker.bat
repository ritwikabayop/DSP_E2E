@echo off
setlocal

:: Launch Attendance Tracker with Auto-Login
:: This batch file runs the PowerShell launcher script

echo ================================
echo   Attendance Tracker Launcher
echo ================================
echo.

:: Get the directory where this batch file is located
set "SCRIPT_DIR=%~dp0"

:: Run the PowerShell script
powershell -ExecutionPolicy Bypass -File "%SCRIPT_DIR%Launch-Attendance-Tracker.ps1"

endlocal
