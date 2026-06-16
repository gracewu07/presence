from pathlib import Path
import re
text = Path('src/index.css').read_text(encoding='utf-8')
selectors = []
stack = []
start = 0
for m in re.finditer(r'{|}', text):
    if m.group() == '{':
        stack.append(m.start())
    else:
        if stack:
            stack.pop()
            if not stack:
                sel = text[start:m.start()].strip()
                selectors.append(sel)
                start = m.end()
counts = {}
for sel in selectors:
    for s in [x.strip() for x in sel.split(',') if x.strip()]:
        counts[s] = counts.get(s, 0) + 1
dups = {s: c for s, c in counts.items() if c > 1}
print('dup count', len(dups))
for s, c in sorted(dups.items(), key=lambda x:(-x[1], x[0]))[:80]:
    print(c, s)
