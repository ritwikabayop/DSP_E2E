import re

# Read the generated team data
with open('team_data_output.txt', 'r', encoding='utf-8') as f:
    new_team_data = f.read()

# Read the HTML file
with open('team-attendance-tracker.html', 'r', encoding='utf-8') as f:
    html_content = f.read()

# Find the start of teamData and the end (before leaveCategories)
pattern = r'(const teamData = \{[\s\S]*?\}\s*\};)'
match = re.search(pattern, html_content)

if match:
    old_team_data = match.group(1)
    print(f"Found old teamData, replacing...")
    
    # Replace old data with new data
    html_content = html_content.replace(old_team_data, new_team_data + ';')
    
    # Write back to HTML
    with open('team-attendance-tracker.html', 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    print("✅ Successfully updated HTML with correct levels from Excel!")
else:
    print("❌ Could not find teamData in HTML file")
