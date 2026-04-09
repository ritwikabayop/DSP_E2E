"""
Process holidays from Excel files and generate JavaScript code for HTML
"""
import pandas as pd
import json
from datetime import datetime

# Read Excel files
locations_df = pd.read_excel(r'C:\Users\Vishnu.ramalingam\MYISP_Tools\Attendance\Locations.xlsx', engine='openpyxl')
holidays_df = pd.read_excel(r'C:\Users\Vishnu.ramalingam\MYISP_Tools\Attendance\holiday list_ 2026.xlsx', engine='openpyxl')

print("=== Locations.xlsx ===")
print(locations_df.head(10))
print("\n=== Columns in Locations ===")
print(locations_df.columns.tolist())
print("\n=== Holiday list 2026.xlsx ===")
print(holidays_df.head(10))
print("\n=== Columns in Holidays ===")
print(holidays_df.columns.tolist())

# Create location to holiday mapping
print("\n=== Creating Holiday Mapping ===")

# Assuming the structure (we'll adjust after seeing the actual columns):
# - Locations.xlsx has: Location, City, State, etc.
# - holiday list 2026.xlsx has: Date, Holiday Name, Location/State, etc.

# Group holidays by location
holiday_mapping = {}

# Print first few rows to understand structure
print("\n=== Sample Location Data ===")
for idx, row in locations_df.head(5).iterrows():
    print(f"Row {idx}: {row.to_dict()}")

print("\n=== Sample Holiday Data ===")
for idx, row in holidays_df.head(10).iterrows():
    print(f"Row {idx}: {row.to_dict()}")
