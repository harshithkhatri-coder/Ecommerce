from pathlib import Path
p = Path('frontend/src/Admin.jsx')
text = p.read_bytes()
print('bytes', len(text))
print(repr(text[-40:]))
line_breaks = text.count(b'\n')
print('newline count', line_breaks)
if text.endswith(b'\n'):
    print('ends with newline')
else:
    print('does not end with newline')
last_line = text.splitlines()[-1] if text.splitlines() else b''
print('last line repr:', repr(last_line))
print('last 4 bytes:', text[-4:])
