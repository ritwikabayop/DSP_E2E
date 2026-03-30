# Launch Attendance Tracker with Auto-Login
# This script automatically detects your Windows username and opens the attendance tracker

Write-Host "================================" -ForegroundColor Cyan
Write-Host "  Attendance Tracker Launcher" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Get current Windows username
$username = $env:USERNAME.ToLower()
Write-Host "Detected user: $username" -ForegroundColor Green
Write-Host ""

# Determine server URL
$localUrl = "http://localhost:8000"
$tunnelUrl = "https://tcgndl2c-8000.inc1.devtunnels.ms"

# Check if server is running locally
$serverRunning = $false
try {
    $response = Invoke-WebRequest -Uri "$localUrl/api/auth/check-access" -Method GET -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
    $serverRunning = $true
    $serverUrl = $localUrl
    Write-Host "✓ Local server detected" -ForegroundColor Green
} catch {
    Write-Host "⚠ Local server not running, using dev tunnel" -ForegroundColor Yellow
    $serverUrl = $tunnelUrl
}

Write-Host ""

# Generate secure token from username (simple encoding)
$bytes = [System.Text.Encoding]::UTF8.GetBytes($username)
$encoded = [Convert]::ToBase64String($bytes)

# Build URL with username token
$attendanceUrl = "$serverUrl/Attendance/team-attendance-tracker-sharepoint.html?auth=$encoded"

Write-Host "Opening Attendance Tracker..." -ForegroundColor Cyan
Write-Host "URL: $serverUrl" -ForegroundColor Gray
Write-Host ""

# Open default browser
Start-Process $attendanceUrl

Write-Host "✓ Browser opened successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
