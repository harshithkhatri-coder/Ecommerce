from pathlib import Path
text = Path('frontend/src/Admin.jsx').read_text(encoding='utf-8')
state = 'normal'
quote_char = None
escaped = False
line = 1
errors = []
for i, ch in enumerate(text):
    if ch == '\n':
        line += 1
        escaped = False
        continue
    if state == 'normal':
        if ch in ('"', "'", '`'):
            quote_char = ch
            state = 'string'
            escaped = False
        elif ch == '/' and i+1 < len(text) and text[i+1] == '/':
            state = 'line_comment'
        elif ch == '/' and i+1 < len(text) and text[i+1] == '*':
            state = 'block_comment'
    elif state == 'string':
        if escaped:
            escaped = False
        elif ch == '\\':
            escaped = True
        elif ch == quote_char:
            state = 'normal'
            quote_char = None
    elif state == 'line_comment':
        if ch == '\n':
            state = 'normal'
    elif state == 'block_comment':
        if ch == '*' and i+1 < len(text) and text[i+1] == '/':
            state = 'normal'

print('final state:', state, 'quote_char:', quote_char)
if state != 'normal':
    print('unterminated literal at line', line)
else:
    print('all literals terminated')
