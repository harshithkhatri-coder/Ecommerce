from pathlib import Path
text = Path('frontend/src/Admin.jsx').read_bytes()
start = text.find(b'export default function Admin')
print('export idx', start)
print(repr(text[start-40:start+120]))
for i, b in enumerate(text[start-40:start+120]):
    if b < 32 and b not in (9,10,13):
        print('control char at', i-40, hex(b))
