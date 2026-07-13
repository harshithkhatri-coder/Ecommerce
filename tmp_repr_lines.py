from pathlib import Path
lines = Path('frontend/src/Admin.jsx').read_text('utf-8').splitlines()
for i in range(2465, 2473):
    print(f'{i+1}: {repr(lines[i])}')
