from pathlib import Path
path = Path('frontend/src/Admin.jsx')
lines = path.read_text('utf-8').splitlines()
for i in range(2455, 2485):
    if i < len(lines):
        print(f'{i+1:4}: {lines[i]}')
