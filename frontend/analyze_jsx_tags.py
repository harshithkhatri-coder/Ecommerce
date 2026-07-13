import re
from pathlib import Path
text = Path('frontend/src/Admin.jsx').read_text(encoding='utf-8', errors='replace')
# Simplified JSX tag parser
pattern = re.compile(r'<(/?)([A-Za-z][A-Za-z0-9_-]*)([^>]*)>|({|})')
stack = []
line_starts = [0]
for i, line in enumerate(text.splitlines(), 1):
    line_starts.append(line_starts[-1] + len(line) + 1)
for m in pattern.finditer(text):
    token = m.group(0)
    close = m.group(1) == '/'
    tag = m.group(2)
    rest = m.group(3)
    pos = m.start()
    line = next(i for i,p in enumerate(line_starts) if p > pos) - 1
    if token == '{':
        stack.append(('brace', line+1))
    elif token == '}':
        if not stack or stack[-1][0] != 'brace':
            print('Unmatched } at line', line+1)
        else:
            stack.pop()
    elif tag:
        if tag.lower() in ('br','img','input','hr','meta','link','path','rect','circle','line','polyline','polygon','stop','embed','source','track','param','area','col','base'):
            continue
        if close:
            if not stack:
                print('Unmatched close tag', tag, 'at line', line+1)
            else:
                top = stack.pop()
                if top[0].lower() != tag.lower():
                    print('Tag mismatch', top, 'closed by', tag, 'at line', line+1)
        else:
            if rest.strip().endswith('/'):
                continue
            stack.append((tag, line+1))
if stack:
    print('Unclosed tags:')
    for item in stack[-20:]:
        print(item)
else:
    print('No unclosed tags detected')
