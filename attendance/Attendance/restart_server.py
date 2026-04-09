"""
Stop Flask Server and Clear Cache
==================================
"""
import os
import sys
import shutil
import subprocess

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)

print("="*80)
print("🔄 RESTARTING FLASK SERVER")
print("="*80)

# Step 1: Clear Python cache
print("\n📝 Step 1: Clearing Python cache...")
pycache_dir = os.path.join(PROJECT_DIR, '__pycache__')
if os.path.exists(pycache_dir):
    try:
        shutil.rmtree(pycache_dir)
        print(f"  ✓ Deleted: {pycache_dir}")
    except Exception as e:
        print(f"  ⚠️ Could not delete cache: {e}")
else:
    print(f"  ℹ️ No cache directory found")

# Also check for .pyc files
print(f"\n📝 Step 2: Looking for .pyc files...")
for root, dirs, files in os.walk(PROJECT_DIR):
    for file in files:
        if file.endswith('.pyc'):
            pyc_path = os.path.join(root, file)
            try:
                os.remove(pyc_path)
                print(f"  ✓ Deleted: {pyc_path}")
            except:
                pass

print("\n" + "="*80)
print("✅ CACHE CLEARED!")
print("="*80)

print("""
📝 NEXT STEPS:

1. STOP the Flask server:
   - Look for the terminal running app.py
   - Press Ctrl+C to stop it
   - Or run this command in PowerShell:
     Stop-Process -Id 32596 -Force

2. RESTART the Flask server:
   - In terminal, run: python app.py
   - Or: python run_production.py
   - Wait for "Running on http://..." message

3. TEST the fix:
   - Open web attendance tracker
   - Save attendance for February
   - Run: python validate_sheet_format.py
   - Should see: "✅ ALL SHEETS PERFECT!"

The server MUST be restarted for the new format to work!
""")

print("="*80)
