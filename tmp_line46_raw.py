from pathlib import Path
path = Path('frontend/src/Admin.jsx')
text = path.read_text('utf-8')
lines = text.splitlines()
line = lines[45]
print(repr(line))
print(len(line), line)
for i,ch in enumerate(line):
    print(i, repr(ch))
