from pathlib import Path
import re

path = Path('frontend/src/Admin.jsx')
text = path.read_text(encoding='utf-8')
lines = text.splitlines()

stack = []
line_num = 0
errors = []

# Simplified parser to detect unclosed JSX tags and braces
for line_idx, line in enumerate(lines):
    line_num = line_idx + 1
    # remove string literals roughly
    stripped = re.sub(r'".*?"|\'.*?\'', '', line)
    for ch in stripped:
        if ch == '{':
            stack.append(('brace', line_num))
        elif ch == '}':
            if stack and stack[-1][0] == 'brace':
                stack.pop()
            else:
                errors.append((line_num, 'unmatched }'))

# Check simple JSX tag start/end counts
open_tags = []
for line_idx, line in enumerate(lines):
    line_num = line_idx + 1
    for match in re.finditer(r'<(/?)([A-Za-z][A-Za-z0-9_]*)[^>]*?>', line):
        closing = match.group(1) == '/'
        tag = match.group(2)
        text = match.group(0)
        if text.endswith('/>'):
            continue
        if closing:
            if open_tags and open_tags[-1][0] == tag:
                open_tags.pop()
            else:
                errors.append((line_num, f'unmatched closing tag </{tag}>'))
        else:
            open_tags.append((tag, line_num))

print('brace stack remaining:', stack[-5:])
print('open_tags remaining:', open_tags[-10:])
print('errors count:', len(errors))
for err in errors[:50]:
    print(err)
print('--- last 20 lines ---')
for i in range(len(lines)-20, len(lines)):
    print(f'{i+1:4}: {lines[i]}')
