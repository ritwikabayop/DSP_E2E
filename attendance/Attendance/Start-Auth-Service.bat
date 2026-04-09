@echo off
:: Start Windows Username Authentication Service
:: This service allows automatic username detection in the browser

title Username Auth Service - Port 9999

:: Run PowerShell script with bypass execution policy
powershell.exe -ExecutionPolicy Bypass -NoProfile -File "%~dp0Username-Auth-Service.ps1"

pause
