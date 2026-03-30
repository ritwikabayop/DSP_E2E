import pandas as pd
import re

# Read Excel file
df = pd.read_excel(r'C:\Users\Vishnu.ramalingam\MYISP_Tools\Attendance\Team Details.xlsx')

# Read HTML file
with open('team-attendance-tracker.html', 'r', encoding='utf-8') as f:
    html_content = f.read()

# Group data by Lead
grouped = df.groupby('Lead')

# Build new team data structure
new_team_data_lines = []
for lead_name, group in grouped:
    if pd.isna(lead_name) or lead_name == '':
        continue
    
    members_lines = []
    for _, row in group.iterrows():
        member_name = row['Team members'] if not pd.isna(row['Team members']) else ''
        location = row['Location'] if not pd.isna(row['Location']) else ''
        level = int(row['Level']) if not pd.isna(row['Level']) else 0
        
        if member_name:  # Only add if member name exists
            members_lines.append(f"                    {{ name: '{member_name}', location: '{location}', level: '{level}' }}")
    
    if members_lines:  # Only add lead if they have members
        members_str = ',\n'.join(members_lines)
        new_team_data_lines.append(f"                {{ id: '{lead_name}', name: '{lead_name}', members: [\n{members_str}\n                ]}}")

new_team_data = ',\n'.join(new_team_data_lines)

# Find and replace the teamData section
pattern = r'(const teamData = \{\s+leads: \[)(.*?)(\]\s+\};)'
match = re.search(pattern, html_content, re.DOTALL)

if match:
    new_html = html_content[:match.start(2)] + '\n' + new_team_data + '\n            ' + html_content[match.end(2):]
    
    # Write updated HTML
    with open('team-attendance-tracker.html', 'w', encoding='utf-8') as f:
        f.write(new_html)
    
    print("✅ HTML file updated with correct levels from Excel!")
    print(f"   Updated {len(new_team_data_lines)} leads")
    print(f"   Levels range: {sorted(df['Level'].dropna().unique())}")
else:
    print("❌ Could not find teamData section in HTML")
