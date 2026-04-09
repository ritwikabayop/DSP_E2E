""" 
Extract team data from Excel and generate JavaScript object

Source File (SharePoint):
https://ts.accenture.com/:x:/r/sites/mySPTesting/Shared Documents/General/01 - Deliverables/Leave Tracker- Test(Do Not Delete)/Team Details.xlsx

Download the latest version before running this script.
"""
import pandas as pd
import json

# Read the Team Details Excel file
df = pd.read_excel(r'C:\Users\leena.a.das\Leave Tracker\Team Details.xlsx')

# Group by Lead and create the team structure
leads = []
for lead_name in df['Lead'].unique():
    if pd.notna(lead_name):
        team_df = df[df['Lead'] == lead_name]
        members = []
        for _, row in team_df.iterrows():
            if pd.notna(row['Team members']) and pd.notna(row['Level']):
                member = {
                    'name': row['Team members'],
                    'location': row['Location'],
                    'level': str(int(row['Level']))  # Convert to string to maintain consistency
                }
                members.append(member)
        
        lead = {
            'id': lead_name,
            'name': lead_name,
            'members': members
        }
        leads.append(lead)

# Create the teamData object
team_data = {'leads': leads}

# Output as JavaScript code
print("const teamData = " + json.dumps(team_data, indent=12).replace('            ', '                ') + ";")
