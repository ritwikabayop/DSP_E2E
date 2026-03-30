"""
Generate holiday mapping from Excel files

Source Files (SharePoint):
- Locations: https://ts.accenture.com/:x:/r/sites/mySPTesting/Shared Documents/General/01 - Deliverables/Leave Tracker- Test(Do Not Delete)/Locations.xlsx
- Holiday List 2026: https://ts.accenture.com/:x:/r/sites/mySPTesting/Shared Documents/General/01 - Deliverables/Leave Tracker- Test(Do Not Delete)/holiday list_ 2026.xlsx

Download the latest versions from SharePoint before running this script.
"""
import pandas as pd
import json
from datetime import datetime

# Read Excel files
print("Reading Excel files...")
locations_df = pd.read_excel(r'C:\Users\Vishnu.ramalingam\MYISP_Tools\Attendance\Locations.xlsx', engine='openpyxl')
holidays_df = pd.read_excel(r'C:\Users\Vishnu.ramalingam\MYISP_Tools\Attendance\holiday list_ 2026.xlsx')

print("\n=== Holidays DataFrame ===")
print(holidays_df.to_string())

print("\n\n=== Locations DataFrame ===")
print(locations_df.to_string())

# Create mapping: location (city) -> list of holiday dates
print("\n\n=== Creating Holiday Mapping ===")

# Get all state columns from holidays
state_columns = [col for col in holidays_df.columns if col not in ['.', 'Holiday Name', 'Day of the Week']]
print(f"States found: {state_columns}")

# Create a mapping from city to state
city_to_state = {}
for state in locations_df.columns:
    cities = locations_df[state].dropna().tolist()
    for city in cities:
        city_to_state[city] = state
        print(f"{city} -> {state}")

print("\n=== Holiday Mapping (City -> Dates) ===")

# For each row in holidays, check which states have dates
holiday_mapping = {}

for idx, row in holidays_df.iterrows():
    holiday_name = row['Holiday Name']
    if pd.isna(holiday_name):
        continue
    
    print(f"\nProcessing: {holiday_name}")
    
    for state in state_columns:
        holiday_date = row[state]
        if pd.notna(holiday_date):
            # Convert to date string
            if isinstance(holiday_date, pd.Timestamp):
                date_str = holiday_date.strftime('%Y-%m-%d')
                print(f"  {state}: {date_str}")
                
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

# Print the final mapping
print("\n\n=== Final Holiday Mapping ===")
for location, holidays in sorted(holiday_mapping.items()):
    print(f"\n{location}:")
    for h in holidays:
        print(f"  - {h['date']}: {h['name']}")

# Generate JavaScript code
print("\n\n=== JavaScript Code for HTML ===")
print("// Add this to your HTML file")
print("const holidaysByLocation = " + json.dumps(holiday_mapping, indent=4) + ";")

# Save to file
with open('holiday_mapping.js', 'w') as f:
    f.write("// Holiday mapping by location\n")
    f.write("const holidaysByLocation = " + json.dumps(holiday_mapping, indent=4) + ";\n")
    
print("\n✅ Holiday mapping saved to holiday_mapping.js")
