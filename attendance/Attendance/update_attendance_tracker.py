"""
Team Attendance Tracker - Complete Update Script
=================================================

This script combines all data extraction and HTML generation steps into one executable file.

Data Sources (must be downloaded from SharePoint first):
1. Team Details.xlsx - Team member information
2. Locations.xlsx - City-to-state mappings  
3. holiday list_ 2026.xlsx - State-specific holidays

SharePoint Links:
- https://ts.accenture.com/:x:/r/sites/mySPTesting/Shared Documents/General/01 - Deliverables/Leave Tracker- Test(Do Not Delete)/

Usage:
    python update_attendance_tracker.py
"""

import pandas as pd
import json
import re
import os
from datetime import datetime
from pathlib import Path

# Configuration
SCRIPT_DIR = Path(__file__).parent
TEAM_DETAILS_FILE = SCRIPT_DIR / "Team Details.xlsx"
LOCATIONS_FILE = SCRIPT_DIR / "Locations.xlsx"
HOLIDAYS_FILE = SCRIPT_DIR / "holiday list_ 2026.xlsx"
HTML_FILE = SCRIPT_DIR / "team-attendance-tracker-sharepoint.html"

def print_header(text):
    """Print a formatted header"""
    print(f"\n{'='*70}")
    print(f"  {text}")
    print(f"{'='*70}\n")

def extract_team_data():
    """
    STEP 1: Extract team data from Excel and generate JavaScript object
    """
    print_header("STEP 1: Extracting Team Data")
    
    if not TEAM_DETAILS_FILE.exists():
        print(f"❌ ERROR: Team Details.xlsx not found at {TEAM_DETAILS_FILE}")
        return None
    
    print(f"📖 Reading: {TEAM_DETAILS_FILE.name}")
    df = pd.read_excel(TEAM_DETAILS_FILE)
    
    # Group by Lead and create the team structure
    leads = []
    for lead_name in df['Lead'].unique():
        if pd.notna(lead_name):
            lead_name = str(lead_name).strip()
            team_df = df[df['Lead'].astype(str).str.strip() == lead_name]
            members = []
            for _, row in team_df.iterrows():
                if pd.notna(row['Team members']) and pd.notna(row['Level']):
                    member = {
                        'name': str(row['Team members']).strip(),
                        'location': str(row['Location']).strip() if pd.notna(row['Location']) else '',
                        'level': str(int(row['Level']))  # Convert to string
                    }
                    members.append(member)
            
            lead = {
                'id': lead_name,
                'name': lead_name,
                'members': members
            }
            leads.append(lead)
            print(f"  ✓ Processed team: {lead_name} ({len(members)} members)")
    
    # Create the teamData object
    team_data = {'leads': leads}
    
    # Generate JavaScript code
    js_code = "const teamData = " + json.dumps(team_data, indent=12).replace('            ', '                ')
    
    print(f"\n✅ Successfully extracted {len(leads)} teams with {sum(len(l['members']) for l in leads)} total members")
    return js_code

def generate_holiday_mapping():
    """
    STEP 2: Generate holiday mapping from Excel files
    """
    print_header("STEP 2: Generating Holiday Mapping")
    
    if not LOCATIONS_FILE.exists():
        print(f"❌ ERROR: Locations.xlsx not found at {LOCATIONS_FILE}")
        return None
    
    if not HOLIDAYS_FILE.exists():
        print(f"❌ ERROR: holiday list_ 2026.xlsx not found at {HOLIDAYS_FILE}")
        return None
    
    print(f"📖 Reading: {LOCATIONS_FILE.name}")
    locations_df = pd.read_excel(LOCATIONS_FILE, engine='openpyxl')
    
    print(f"📖 Reading: {HOLIDAYS_FILE.name}")
    holidays_df = pd.read_excel(HOLIDAYS_FILE)
    
    # Get all state columns from holidays
    state_columns = [col for col in holidays_df.columns if col not in ['.', 'Holiday Name', 'Day of the Week']]
    print(f"  ✓ Found {len(state_columns)} states: {', '.join(state_columns[:5])}{'...' if len(state_columns) > 5 else ''}")
    
    # Create a mapping from city to state
    city_to_state = {}
    city_count = 0
    for state in locations_df.columns:
        cities = locations_df[state].dropna().tolist()
        for city in cities:
            city_to_state[city] = state
            city_count += 1
    
    print(f"  ✓ Mapped {city_count} cities to states")
    
    # For each row in holidays, check which states have dates
    holiday_mapping = {}
    holiday_count = 0
    
    for idx, row in holidays_df.iterrows():
        holiday_name = row['Holiday Name']
        if pd.isna(holiday_name):
            continue
        
        holiday_count += 1
        
        for state in state_columns:
            holiday_date = row[state]
            if pd.notna(holiday_date):
                # Convert to date string
                if isinstance(holiday_date, pd.Timestamp):
                    date_str = holiday_date.strftime('%Y-%m-%d')
                    
                    # Find all cities in this state
                    if state in locations_df.columns:
                        cities = locations_df[state].dropna().tolist()
                        for city in cities:
                            location_key = f"{city}, {state}"
                            if location_key not in holiday_mapping:
                                holiday_mapping[location_key] = []
                            holiday_mapping[location_key].append({
                                'date': date_str,
                                'name': holiday_name
                            })
    
    print(f"  ✓ Processed {holiday_count} holidays")
    print(f"  ✓ Created mappings for {len(holiday_mapping)} locations")
    
    # Generate JavaScript code
    js_code = "const holidaysByLocation = " + json.dumps(holiday_mapping, indent=4)
    
    print(f"\n✅ Successfully generated holiday mapping")
    return js_code

def update_html_file(team_data_js, holiday_mapping_js):
    """
    STEP 3: Update HTML file with team data and holiday mapping
    """
    print_header("STEP 3: Updating HTML File")
    
    if not HTML_FILE.exists():
        print(f"❌ ERROR: HTML file not found at {HTML_FILE}")
        return False
    
    print(f"📖 Reading: {HTML_FILE.name}")
    with open(HTML_FILE, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    original_size = len(html_content)
    
    # Update team data
    print("  🔄 Updating team data...")
    team_pattern = r'(const teamData = \{[\s\S]*?\}\s*;)'
    team_match = re.search(team_pattern, html_content)
    
    if team_match:
        old_team_data = team_match.group(1)
        html_content = html_content.replace(old_team_data, team_data_js + ';')
        print("  ✓ Team data updated")
    else:
        print("  ⚠️  WARNING: Could not find teamData in HTML file")
    
    # Update holiday mapping
    print("  🔄 Updating holiday mapping...")
    holiday_pattern = r'(const holidaysByLocation = \{[\s\S]*?\};)'
    holiday_match = re.search(holiday_pattern, html_content)
    
    if holiday_match:
        old_holiday_data = holiday_match.group(1)
        html_content = html_content.replace(old_holiday_data, holiday_mapping_js + ';')
        print("  ✓ Holiday mapping updated")
    else:
        print("  ⚠️  WARNING: Could not find holidaysByLocation in HTML file")
    
    # Write back to HTML
    print(f"  💾 Writing updated HTML...")
    with open(HTML_FILE, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    new_size = len(html_content)
    size_diff = new_size - original_size
    
    print(f"  ✓ File size: {original_size:,} → {new_size:,} bytes ({size_diff:+,} bytes)")
    print(f"\n✅ Successfully updated {HTML_FILE.name}")
    return True

def main():
    """Main execution function"""
    print("\n" + "="*70)
    print("  🎯 Team Attendance Tracker - Complete Update Script")
    print("="*70)
    print(f"\nWorking directory: {SCRIPT_DIR}")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    try:
        # Step 1: Extract team data
        team_data_js = extract_team_data()
        if not team_data_js:
            print("\n❌ FAILED: Could not extract team data")
            return False
        
        # Step 2: Generate holiday mapping
        holiday_mapping_js = generate_holiday_mapping()
        if not holiday_mapping_js:
            print("\n❌ FAILED: Could not generate holiday mapping")
            return False
        
        # Step 3: Update HTML file
        success = update_html_file(team_data_js, holiday_mapping_js)
        if not success:
            print("\n❌ FAILED: Could not update HTML file")
            return False
        
        # Success!
        print("\n" + "="*70)
        print("  ✅ SUCCESS! All updates completed successfully!")
        print("="*70)
        print(f"\n📄 Updated file: {HTML_FILE.name}")
        print(f"🌐 You can now open the HTML file in your browser\n")
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = main()
    
    # Pause so user can see the results
    input("\nPress Enter to exit...")
    
    # Exit with appropriate code
    exit(0 if success else 1)
