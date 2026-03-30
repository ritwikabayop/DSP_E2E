# Quick Reference Card - Auto-Login System

## 🎯 For Users

### Setup Option 1: Auth Service (Best) ⭐
```
1. Download: Start-Auth-Service.bat
2. Double-click to run
3. Keep window open
4. Open attendance tracker normally
   → Login is AUTOMATIC! 🎉
```

### Setup Option 2: Launcher Script
```
1. Download: Launch-Attendance-Tracker.bat  
2. Double-click to open app
   → Auto-login every time
```

---

## 🔧 Troubleshooting

### Access Denied?
→ Contact admin to add your username to Access.csv

### Auth Service not detected?
```powershell
# Test if running:
http://localhost:9999/username

# Should show:
{"success": true, "username": "your.name"}
```

### Wrong username detected?
→ Close auth service, run again under YOUR account

### Manual login not working?
```cmd
# Check your username:
echo %USERNAME%

# Use this exact name (lowercase)
```

---

## 🔐 Security

✅ Access control via Access.csv  
✅ All logins logged with IP and timestamp  
✅ Multiple authentication methods  
✅ Session tracking and audit trail  

---

## 📦 Downloads

All files at: `https://tcgndl2c-8000.inc1.devtunnels.ms/Attendance/`

- **Start-Auth-Service.bat** - Background service (recommended)
- **Launch-Attendance-Tracker.bat** - Quick launcher
- **AUTO_USERNAME_DETECTION.md** - Full guide

---

## 🆘 Support

**Issues?** Check logs:
- `Attendance/access_log.csv` - Login attempts
- Console (F12) - Browser errors

**Contact:** vishnu.ramalingam@company.com

---

## 🚀 Quick Test

```powershell
# 1. Test auth service
curl http://localhost:9999/username

# 2. Check if authorized  
# Your username should be in: Attendance/Access.csv

# 3. Open tracker
https://tcgndl2c-8000.inc1.devtunnels.ms/Attendance/team-attendance-tracker-sharepoint.html
```

---

**Updated:** March 6, 2026  
**Version:** 2.0 (Auto-detection enabled)
