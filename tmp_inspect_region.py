from pathlib import Path
text = Path('frontend/src/Admin.jsx').read_text('utf-8')
start = text.index('export default function Admin')
print('index', start)
print('prev 80 chars repr:', repr(text[start-80:start]))
print('line above:', repr(text[text.rfind('\n', 0, start-1)+1:start]))
print('next 80 chars repr:', repr(text[start:start+80]))
