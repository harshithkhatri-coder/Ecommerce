from pathlib import Path
text = Path('frontend/src/Admin.jsx').read_text('utf-8')
for i in range(20, 36):
    line = text.splitlines()[i-1]
    print(f'{i}: {repr(line)}')
    for j,ch in enumerate(line):
        if ord(ch) < 32 or ord(ch) == 127:
            print(' control', j, ord(ch), repr(ch))
