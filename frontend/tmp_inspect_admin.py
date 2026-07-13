from pathlib import Path
path = Path('frontend/src/Admin.jsx')
text = path.read_text(encoding='utf-8', errors='replace')
lines = text.splitlines()
for i in range(max(0, len(lines)-70), len(lines)):
    print(f'{i+1}: {lines[i]}')
