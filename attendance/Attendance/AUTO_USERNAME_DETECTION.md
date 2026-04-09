# Automatic Windows Username Detection - Complete Guide

## Overview

The Attendance Tracker now supports **fully automatic** Windows username detection when accessing through the shared dev tunnel. No manual entry required!

## How It Works

The system tries **multiple methods** to automatically detect your Windows username:

### Method 1: Local Authentication Service (Recommended) ⭐

A lightweight background service running on your computer that provides your Windows username to the browser.

**Advantages:**
- ✅ Completely automatic - no clicks needed
- ✅ Works with any browser
- ✅ Most secure method
- ✅ No URL parameters or tokens
- ✅ Works offline after first setup

**Setup (One-time):**

1. Download the auth service:
   - Go to: `https://tcgndl2c-8000.inc1.devtunnels.ms/Attendance/Start-Auth-Service.bat`
   - Or download from the webpage

2. Run the service:
   - Double-click `Start-Auth-Service.bat`
   - A window will open showing "Service started successfully"
   - **Keep this window open** while using the attendance tracker

3. Access the app:
   - Open any browser
   - Go to: `https://tcgndl2c-8000.inc1.devtunnels.ms/Attendance/team-attendance-tracker-sharepoint.html`
   - **Login is automatic!** No prompts, no clicking.

**How it works internally:**
- Service runs on `http://localhost:9999`
- Frontend JavaScript calls the local service
- Service reads `$env:USERNAME` and sends it back
- Frontend validates against Access.csv
- All happens in milliseconds!

---

### Method 2: Launcher Script

Opens your browser with a pre-authenticated URL containing your username.

**Advantages:**
- ✅ One-click access
- ✅ No background service needed
- ✅ Works immediately

**Setup:**

1. Download: `Launch-Attendance-Tracker.ps1` or `Launch-Attendance-Tracker.bat`
2. Double-click to run
3. Browser opens with automatic login

**How it works:**
- Script reads `$env:USERNAME`
- Encodes username to Base64
- Launches browser with `?auth=<token>`
- Frontend decodes and validates

---

### Method 3: Cached Username

After first login with Method 1 or 2, your username is cached in localStorage.

**Advantages:**
- ✅ Works offline
- ✅ Persists across sessions
- ✅ No repeated authentication

---

### Method 4: Manual Entry (Fallback)

If all automatic methods fail, you can manually enter your username.

**When to use:**
- Auth service not running
- Launcher not available
- Testing with different usernames

---

## Quick Start - For Team Members

### First Time Setup (Choose ONE):

**OPTION A: Auth Service (Best Experience)**
```
1. Download: Start-Auth-Service.bat
2. Run it (keep window open)
3. Open attendance tracker URL
4. Done! Login is automatic
```

**OPTION B: Launcher Script (Quick Access)**
```
1. Download: Launch-Attendance-Tracker.bat
2. Double-click it whenever you want to access the app
3. Browser opens with automatic login
```

### Daily Usage:

**If using Auth Service:**
- Just keep `Start-Auth-Service.bat` running in background
- Open the attendance tracker URL anytime
- Login is instant and automatic

**If using Launcher:**
- Double-click `Launch-Attendance-Tracker.bat` to open the app

---

## Troubleshooting

### "Access Denied" Error

**Problem:** Username not in authorized list

**Solution:**
- Contact the administrator to add your username to `Access.csv`
- Your username must match the Windows username exactly

### Auth Service Not Detected

**Problem:** Browser shows "Local auth service not available"

**Solution:**
1. Check if `Start-Auth-Service.bat` is running
2. Look for a PowerShell window showing "Service started successfully"
3. If not running:
   - Download `Start-Auth-Service.bat` again
   - Double-click to run
   - Don't close the window

4. Verify the service:
   - Open: `http://localhost:9999/username`
   - Should show: `{"success": true, "username": "your.username"}`

### Launcher Opens Wrong URL

**Problem:** Launcher connects to wrong server

**Solution:**
- Edit `Launch-Attendance-Tracker.ps1`
- Update the `$tunnelUrl` variable to current dev tunnel URL
- Save and run again

### Manual Login Not Working

**Problem:** Entered username but still getting "Access Denied"

**Solution:**
1. Check your Windows username:
   - Open CMD: `echo %USERNAME%`
   - Use this exact name (lowercase)

2. Verify username format:
   - Should be: `firstname.lastname`
   - No spaces, no special characters

3. Clear cached data:
   - Press F12 (Developer Tools)
   - Go to Application → Storage → Clear Site Data
   - Refresh page and try again

### Username Detection Shows Wrong User

**Problem:** System detects incorrect username

**Solution:**
- This usually means the auth service is running under a different user account
- Stop all `Start-Auth-Service.bat` processes
- Run it again under YOUR account
- Refresh the attendance tracker

---

## Security Features

### Access Control
- ✅ Only authorized users in `Access.csv` can access
- ✅ All access attempts logged with timestamp and IP
- ✅ Unauthorized attempts are blocked immediately

### Audit Trail
- Every login is logged in `access_log.csv`
- Includes: timestamp, username, IP address, user agent, access granted/denied

### Session Management
- Username cached in localStorage (browser only)
- Logout button clears all session data
- File protocol access blocked (no local HTML file opening)

### Detection Method Tracking
- System tracks how each user authenticated:
  - `local_service` - Auth service
  - `launcher` - PowerShell launcher
  - `manual` - Manual entry
  - `local` - Server environment (localhost only)

---

## For Administrators

### Adding Users

Edit `Attendance/Access.csv`:
```csv
username
vishnu.ramalingam
omkar.gandavarapu
shini.vv
```

- One username per line
- Must match Windows username exactly
- Use lowercase
- Save as UTF-8 encoding

### Monitoring Access

Check `Attendance/access_log.csv`:
```csv
Timestamp,Username,IP Address,User Agent,Access Granted,Method
2026-03-06 14:30:15,vishnu.ramalingam,192.168.1.100,Mozilla/5.0...,Yes,Remote
```

### Service Management

**Start Auth Service on All Machines:**
1. Share `Start-Auth-Service.bat` via network/email
2. Have users run it on their machines
3. Service runs on port 9999 (localhost only, no firewall issues)

**Update Dev Tunnel URL:**
1. Get new dev tunnel URL
2. Update in `Launch-Attendance-Tracker.ps1`:
   ```powershell
   $tunnelUrl = "https://NEW-URL.devtunnels.ms"
   ```
3. Share updated launcher with team

---

## Technical Details

### Authentication Flow

```
USER OPENS APP
    ↓
[1] Try Local Auth Service (localhost:9999)
    ├─ Success → Username detected → Validate
    └─ Fail → Continue
        ↓
[2] Check URL ?auth= parameter
    ├─ Found → Decode Base64 → Validate
    └─ Not found → Continue
        ↓
[3] Check localStorage cache
    ├─ Found → Use cached → Validate
    └─ Not found → Continue
        ↓
[4] Show manual entry prompt
    └─ User enters → Validate
        ↓
VALIDATE AGAINST Access.csv
    ├─ Found → Access Granted
    └─ Not found → Access Denied
```

### Backend Username Detection

Server tries these methods (in order):
1. `X-Windows-Username` header (from frontend)
2. `Authorization: Bearer` token (Base64 encoded)
3. `REMOTE_USER` environment variable (Windows Auth)
4. POST body `username` field
5. Server environment `$USERNAME` (localhost only)

### Ports Used

- **8000** - Flask server (attendance tracker)
- **9999** - Local auth service (optional, localhost only)

---

## Downloads

All files available at:
- `https://tcgndl2c-8000.inc1.devtunnels.ms/Attendance/`

**Files:**
- `Start-Auth-Service.bat` - Auth service launcher
- `Username-Auth-Service.ps1` - Auth service script
- `Launch-Attendance-Tracker.bat` - Quick launcher (batch)
- `Launch-Attendance-Tracker.ps1` - Quick launcher (PowerShell)
- `AUTO_LOGIN_GUIDE.md` - This guide

---

## Support

**Issues?**
1. Check access logs: `Attendance/access_log.csv`
2. Verify username: `echo %USERNAME%` in CMD
3. Test auth service: `http://localhost:9999/username`
4. Clear browser cache and try again

**Still having issues?**
- Contact: vishnu.ramalingam@company.com
- Include: error message, username, detection method tried

---

## Change Log

### Version 2.0 (March 6, 2026)
- Added local authentication service (Port 9999)
- Automated username detection with 4 fallback methods
- Enhanced security with access logging
- Added Bearer token authentication
- Improved error messages and troubleshooting

### Version 1.0 (February 2026)
- Initial access control implementation
- Manual username entry
- Launcher script support

---

**🎉 Enjoy automatic, secure attendance tracking!**
