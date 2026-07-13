from pathlib import Path
text = Path('frontend/src/Admin.jsx').read_text('utf-8')
state = 'normal'
quote_char = None
escaped = False
line = 1
for idx, ch in enumerate(text):
    if ch == '\n':
        if state == 'line_comment':
            state = 'normal'
        line += 1
        escaped = False
        continue
    if state == 'normal':
        if ch in ('"', "'", '`'):
            quote_char = ch
            state = 'string'
            escaped = False
        elif ch == '/' and idx+1 < len(text) and text[idx+1] == '/':
            state = 'line_comment'
            print('enter line_comment at line', line, 'idx', idx)
    elif state == 'string':
        if escaped:
            escaped = False
        elif ch == '\\':
            escaped = True
        elif ch == quote_char:
            state = 'normal'
            quote_char = None
print('final state', state, 'line', line)
