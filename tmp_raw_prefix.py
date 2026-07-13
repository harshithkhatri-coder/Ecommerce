from pathlib import Path
text = Path('frontend/src/Admin.jsx').read_text('utf-8')
lines = text.splitlines(True)
for i in range(40, 47):
    line = lines[i-1]
    print(f'{i}: {repr(line)}')
print('--- chars of line 46 ---')
for j,ch in enumerate(lines[45]):
    print(j, ord(ch), repr(ch))
