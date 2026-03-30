@echo off
REM Team Attendance Tracker - Quick Update Script
REM Double-click this file to update the attendance tracker HTML
REM ============================================================

title Team Attendance Tracker Update

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║    Team Attendance Tracker - Quick Update                   ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

REM Check if Python virtual environment exists
if exist "..\​.venv\Scripts\python.exe" (
    echo ✓ Using virtual environment Python
    "..\​.venv\Scripts\python.exe" update_attendance_tracker.py
) else if exist "python.exe" (
    echo ✓ Using system Python
    python update_attendance_tracker.py
) else (
    echo ❌ ERROR: Python not found!
    echo.
    echo Please ensure Python is installed or the virtual environment exists.
    pause
    exit /b 1
)

echo.
pause
