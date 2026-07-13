from pathlib import Path
path = Path('frontend/src/Admin.jsx')
text = path.read_text(encoding='utf-8')
lines = text.splitlines()
for i in range(2520, min(2555, len(lines))):
    print(f'{i+1:4}: {lines[i]}')
