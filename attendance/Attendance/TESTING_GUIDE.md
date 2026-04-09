# Testing Guide - Automatic Username Detection System

## Pre-requisites
✅ Flask server running on port 8000  
✅ Dev tunnel active: https://tcgndl2c-8000.inc1.devtunnels.ms/  
✅ Access.csv configured with test users  

---

## Test 1: Local Authentication Service

### Step 1: Start the Auth Service
```powershell
# Navigate to Attendance folder
cd C:\Users\vishnu.ramalingam\MyISP_Tools\Attendance

# Run the service launcher
.\Start-Auth-Service.bat
```

**Expected Result:**
- PowerShell window opens
- Shows: "Service started successfully!"
- Shows: "Listening on: http://localhost:9999/"

### Step 2: Test the Service Endpoint
**Option A - Browser:**
```
Open: http://localhost:9999/username
```

**Option B - PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:9999/username" | Select-Object -ExpandProperty Content
```

**Expected Response:**
```json
{
  "success": true,
  "username": "vishnu.ramalingam",
  "timestamp": "2026-03-06 14:30:00",
  "hostname": "DESKTOP-ABC123",
  "method": "local_service"
}
```

### Step 3: Test with Attendance Tracker
1. Keep auth service running (don't close the window)
2. Open browser
3. Navigate to: `http://localhost:8000/Attendance/team-attendance-tracker-sharepoint.html`
4. Watch browser console (F12 → Console tab)

**Expected Console Output:**
```
🔍 Attempting automatic username detection...
✅ Username auto-detected from local service: vishnu.ramalingam
🔐 Username detected: vishnu.ramalingam (via local_service)
Checking access permissions for: vishnu.ramalingam (local, method: local_service)
✅ Access granted for user: vishnu.ramalingam
```

**Expected UI:**
- No login prompt shown
- Attendance tracker loads immediately
- User badge shows: 🔐 vishnu.ramalingam

✅ **TEST PASSED** if login is automatic  
❌ **TEST FAILED** if prompted for username

---

## Test 2: Launcher Script Method

### Close Auth Service
- Close the PowerShell window running the auth service
- Verify it's closed: `http://localhost:9999/username` should fail

### Step 1: Test the Launcher
```powershell
# Navigate to Attendance folder
cd C:\Users\vishnu.ramalingam\MyISP_Tools\Attendance

# Run the launcher
.\Launch-Attendance-Tracker.bat
```

**Expected Result:**
- PowerShell window shows: "Detected user: vishnu.ramalingam"
- PowerShell window shows: "✓ Local server detected"
- Browser opens automatically
- Page loads with username pre-filled

**Expected URL Format:**
```
http://localhost:8000/Attendance/team-attendance-tracker-sharepoint.html?auth=dmlzaG51LnJhbWFsaW5nYW0=
```
*(Base64 encoded username in URL)*

**Expected Console Output:**
```
🔐 Auto-login with username from launcher: vishnu.ramalingam
🔐 Username detected: vishnu.ramalingam (via launcher)
✅ Access granted for user: vishnu.ramalingam
```

✅ **TEST PASSED** if browser opens and logs in automatically  
❌ **TEST FAILED** if prompted for username

---

## Test 3: Cached Credentials

### Prerequisites
- Have logged in once using Method 1 or 2
- Close all browser windows
- DO NOT close auth service or use launcher

### Test Cached Login
1. Open browser normally
2. Manually type URL: `http://localhost:8000/Attendance/team-attendance-tracker-sharepoint.html`
3. Watch console

**Expected Console Output:**
```
📦 Using cached username: vishnu.ramalingam (method: local_service)
🔐 Username detected: vishnu.ramalingam (via local_service)
✅ Access granted for user: vishnu.ramalingam
```

**Expected Result:**
- Login is automatic (no prompt)
- Uses cached username from localStorage

✅ **TEST PASSED** if cached credentials work  
❌ **TEST FAILED** if prompted for username again

---

## Test 4: Manual Entry (Fallback)

### Clear All Cached Data
```javascript
// Open browser console (F12)
localStorage.clear();
sessionStorage.clear();
```

### Ensure No Auto-Detection Available
- Auth service: STOPPED ❌
- URL parameter: NONE (direct URL access)
- Cache: CLEARED

### Test Manual Entry
1. Navigate to: `http://localhost:8000/Attendance/team-attendance-tracker-sharepoint.html`
2. Should show login prompt with 2 download buttons

**Expected UI:**
```
🔐 Automatic Login Setup

Method 1: Local Auth Service (Recommended)
[📥 Download Auth Service (.bat)]

Method 2: Launcher Script  
[📥 Download Launcher .ps1]

⚠️ Manual Login (Less Secure):
Only use if auto-login doesn't work
[Username input] [Login button]
```

3. Enter username manually: `vishnu.ramalingam`
4. Click "Login"

**Expected Console Output:**
```
🔐 Username detected: vishnu.ramalingam (via POST body (manual))
Checking access permissions for: vishnu.ramalingam (remote, method: manual)
✅ Access granted for user: vishnu.ramalingam
```

✅ **TEST PASSED** if manual entry works  
❌ **TEST FAILED** if access denied for valid user

---

## Test 5: Access Control (Security)

### Test Unauthorized Access
1. Clear cache: `localStorage.clear()`
2. Enter invalid username: `unauthorized.user`
3. Click "Login"

**Expected Result:**
- Access DENIED ❌
- Error message shown
- Console shows: `❌ Access denied for user: unauthorized.user`

### Test Backend Logging
Check `Attendance/access_log.csv`:

**Expected Entry:**
```csv
Timestamp,Username,IP Address,User Agent,Access Granted,Method
2026-03-06 14:45:30,unauthorized.user,127.0.0.1,Mozilla/5.0...,No,Remote
```

✅ **TEST PASSED** if unauthorized user blocked  
❌ **TEST FAILED** if unauthorized user gains access

---

## Test 6: Remote Access (Dev Tunnel)

### Prerequisites
- Dev tunnel running: `https://tcgndl2c-8000.inc1.devtunnels.ms/`
- Test from another machine OR use incognito mode

### Test Remote Auth Service
**On the remote machine:**
1. Download: `https://tcgndl2c-8000.inc1.devtunnels.ms/Attendance/Start-Auth-Service.bat`
2. Run the downloaded file
3. Open: `https://tcgndl2c-8000.inc1.devtunnels.ms/Attendance/team-attendance-tracker-sharepoint.html`

**Expected Behavior:**
- Auth service detects REMOTE machine's Windows username
- login is automatic
- Access granted if username in Access.csv

### Test Remote Launcher
1. Download: `Launch-Attendance-Tracker.ps1` from dev tunnel
2. Edit line 22: Change `$tunnelUrl` if needed
3. Run the script
4. Browser opens with dev tunnel URL

✅ **TEST PASSED** if remote users can auto-login  
❌ **TEST FAILED** if remote users must enter username manually

---

## Test 7: Multi-Method Fallback

### Test Failover Sequence
1. Start auth service ✅
2. Open attendance tracker → Should use **local_service** method
3. Stop auth service ❌
4. Refresh page → Should use **cached credentials**
5. Clear cache
6. Use launcher script → Should use **launcher** method
7. Direct URL access → Should prompt for **manual entry**

**Expected Console Flow:**
```
Attempt 1: ✅ local_service
Attempt 2: 📦 cached (local_service)  
Attempt 3: 🔐 launcher
Attempt 4: 👤 manual
```

✅ **TEST PASSED** if all 4 methods work in sequence  
❌ **TEST FAILED** if any method fails

---

## Test 8: Auto-Login Status Page

### Test Status Page
Navigate to: `http://localhost:8000/Attendance/auto-login.html`

**Expected UI Elements:**
1. **Download Buttons:**
   - Start-Auth-Service.bat
   - Username-Auth-Service.ps1
   - Launch-Attendance-Tracker.ps1

2. **Auth Service Status:**
   - If running: ✅ Green box with username
   - If not running: ⚠️ Red box with instruction

3. **Session Banner:**
   - If logged in: Shows "Already logged in as: [username]"

4. **Live Status Updates:**
   - Status refreshes every 10 seconds automatically

✅ **TEST PASSED** if status page accurately reflects service state  
❌ **TEST FAILED** if status checker fails

---

## Test 9: Backend Username Extraction

### Test Custom Headers
**Use curl or Postman:**

```powershell
# Test with X-Windows-Username header
Invoke-WebRequest -Uri "http://localhost:8000/api/auth/check-access" `
  -Method POST `
  -Headers @{"X-Windows-Username"="vishnu.ramalingam"; "Content-Type"="application/json"} `
  -Body '{"username":"vishnu.ramalingam"}' | Select-Object -ExpandProperty Content

# Test with Bearer token
$token = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes("vishnu.ramalingam"))
Invoke-WebRequest -Uri "http://localhost:8000/api/auth/check-access" `
  -Method POST `
  -Headers @{"Authorization"="Bearer $token"; "Content-Type"="application/json"} `
  -Body '{}' | Select-Object -ExpandProperty Content
```

**Expected Response:**
```json
{
  "success": true,
  "has_access": true,
  "username": "vishnu.ramalingam",
  "message": "Access granted"
}
```

✅ **TEST PASSED** if backend extracts username from headers  
❌ **TEST FAILED** if backend doesn't recognize headers

---

## Test 10: Cross-Browser Compatibility

### Test on Multiple Browsers
Test on all these browsers:
- ✅ Edge (Recommended)
- ✅ Chrome
- ✅ Firefox

**For Each Browser:**
1. Start auth service
2. Open attendance tracker
3. Verify automatic login
4. Check console for errors
5. Test logout and re-login

**Expected:**
- All browsers work identically
- Auth service detected in all
- No CORS errors

✅ **TEST PASSED** if works in all browsers  
❌ **TEST FAILED** if browser-specific issues

---

## Performance Benchmarks

### Expected Response Times:

| Method | Expected Time |
|--------|--------------|
| Local Auth Service | < 100ms |
| Cached Credentials | < 50ms |
| Launcher Script | < 200ms |
| Manual Entry | < 300ms |

### Load Test:
```powershell
# Test 10 rapid requests
1..10 | ForEach-Object {
    Measure-Command {
        Invoke-WebRequest -Uri "http://localhost:9999/username" -UseBasicParsing
    } | Select-Object -ExpandProperty TotalMilliseconds
}
```

**Expected:**
- Average: < 100ms
- No failures
- No connection timeouts

---

## Troubleshooting Test Failures

### Auth Service Not Detected
```powershell
# Check if service is running
Get-NetTCPConnection -LocalPort 9999 -ErrorAction SilentlyContinue

# Test manually
curl http://localhost:9999/username

# Check for errors in PowerShell window
```

### Access Denied for Valid User
```powershell
# Check Access.csv encoding
Get-Content .\Attendance\Access.csv -Encoding UTF8

# Verify username format (lowercase)
echo $env:USERNAME.ToLower()

# Check access logs
Get-Content .\Attendance\access_log.csv -Tail 10
```

### Frontend Not Detecting Methods
```javascript
// Check browser console for errors
// Verify localStorage:
console.log(localStorage.getItem('attendance_username'));
console.log(localStorage.getItem('attendance_detection_method'));

// Test fetch directly:
fetch('http://localhost:9999/username')
  .then(r => r.json())
  .then(d => console.log('Auth service response:', d))
  .catch(e => console.error('Auth service error:', e));
```

---

## Success Criteria

All tests must pass for deployment:

- [x] Auth service starts and responds
- [x] Launcher script works locally
- [x] Cached credentials persist
- [x] Manual entry works as fallback
- [x] Unauthorized users blocked
- [x] Access logging captures attempts
- [x] Remote access works via dev tunnel
- [x] Multi-method fallback functions correctly
- [x] Status page shows accurate information
- [x] Backend extracts username from multiple sources
- [x] Cross-browser compatible
- [x] Performance meets benchmarks

---

## Final Verification Checklist

Before deploying to team:
- [ ] All 10 tests passed
- [ ] No errors in browser console
- [ ] No errors in Flask server logs
- [ ] Access logging working correctly
- [ ] Documentation complete and accurate
- [ ] Download links functional
- [ ] Dev tunnel accessible remotely
- [ ] Team members trained on setup

---

## Test Report Template

```
Test Date: _________
Tester: _________
Server: http://localhost:8000
Dev Tunnel: https://tcgndl2c-8000.inc1.devtunnels.ms/

Test 1 - Auth Service: [PASS/FAIL] _________
Test 2 - Launcher: [PASS/FAIL] _________
Test 3 - Cached: [PASS/FAIL] _________
Test 4 - Manual: [PASS/FAIL] _________
Test 5 - Security: [PASS/FAIL] _________
Test 6 - Remote: [PASS/FAIL] _________
Test 7 - Fallback: [PASS/FAIL] _________
Test 8 - Status Page: [PASS/FAIL] _________
Test 9 - Backend: [PASS/FAIL] _________
Test 10 - Browsers: [PASS/FAIL] _________

Overall Result: [PASS/FAIL]
Notes: _________
```

---

**Ready to test?** Start with Test 1 and work through sequentially!
