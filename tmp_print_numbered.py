from pathlib import Path
lines = Path('frontend/src/Admin.jsx').read_text('utf-8').splitlines()
for i in range(2455, 2496):
    if i < len(lines):
        print(f'{i+1:4}: {lines[i]}')
