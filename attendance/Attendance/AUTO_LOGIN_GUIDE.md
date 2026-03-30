# Attendance Tracker - Auto-Login Setup Guide

## 🚀 Quick Start (Recommended)

### For Team Members Using Dev Tunnel

1. **Download the Launcher Script**
   - Open: https://tcgndl2c-8000.inc1.devtunnels.ms/Attendance/Launch-Attendance-Tracker.bat
   - Save it to your desktop or any convenient location

2. **Run the Launcher**
   - Double-click `Launch-Attendance-Tracker.bat`
   - Your Windows username will be **automatically detected**
   - Browser will open with you already logged in! ✨

3. **Done!**
   - No need to type your username
   - No manual steps required
   - Secure authentication using your system profile

---

## 🔐 How Auto-Login Works

1. **Launcher Script Detection**: 
   - The launcher script reads your Windows username (`$env:USERNAME`)
   - Encodes it securely and passes it to the browser

2. **Automatic Validation**:
   - Your username is verified against the authorized users list (`Access.csv`)
   - If authorized, you get instant access
   - If not authorized, you'll see an "Access Denied" message

3. **Session Persistence**:
   - Your login is saved in browser storage
   - Next time you visit, you're automatically logged in
   - Click "Logout" button to clear your session

---

## 📋 Alternative Methods

### Method 1: PowerShell Script (Advanced Users)
If you prefer, you can run the PowerShell script directly:

1. Download `Launch-Attendance-Tracker.ps1`
2. Right-click → "Run with PowerShell"
3. Browser opens with auto-login

### Method 2: Manual Login (Not Recommended)
If auto-login doesn't work:

1. Open the attendance tracker URL directly
2. Enter your Windows username manually when prompted
3. Click "Continue"

> ⚠️ **Note**: Manual login is less secure as it relies on self-reported username

---

## 🔧 Troubleshooting

### "Access Denied" Error
- **Cause**: Your username is not in the authorized users list
- **Solution**: Contact your administrator to add you to `Access.csv`

### Launcher Script Doesn't Work
- **Cause 1**: PowerShell execution policy blocked
  - **Solution**: Run as administrator or use the .bat file instead

- **Cause 2**: Server not running
  - **Solution**: Contact administrator to start the server

### Wrong Username Detected
- **Cause**: Running from a different Windows account
- **Solution**: Login to your correct Windows account first

### Browser Opens But Shows Error
- **Cause**: Server or dev tunnel is down
- **Solution**: Contact administrator

---

## 🛡️ Security Features

✅ **Automatic Username Detection** - No typing = Less human error
✅ **Access Control** - Only authorized users can access
✅ **Audit Logging** - All access attempts are logged
✅ **Session Management** - Logout clears all stored credentials
✅ **No Password Required** - Uses Windows authentication

---

## 📝 For Administrators

### Adding New Users
Edit `Attendance/Access.csv` and add:
```csv
username.lastname,Admin,IT
```

### Viewing Access Logs
Check `Attendance/access_log.csv` for:
- Timestamp of access attempts
- Username and IP address
- Success/failure status
- Login method (Auto/Manual)

### Server Status
Monitor Flask server logs for real-time access attempts

---

## 📞 Support

If you experience issues:
1. Check if the server is running
2. Try the manual login method
3. Contact your system administrator
4. Check the access logs for details

---

**Last Updated**: March 6, 2026
