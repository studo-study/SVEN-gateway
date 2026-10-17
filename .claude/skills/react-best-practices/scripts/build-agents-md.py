import re, pathlib, sys

ROOT = pathlib.Path(sys.argv[1])
RULES = ROOT / 'rules'

# ---- sections ----
sec_txt = (RULES / '_sections.md').read_text()
sections = []
for m in re.finditer(r'^## (\d+)\. (.+?) \((\w+)\)\n\n\*\*Impact:\*\* (.+?)  \n\*\*Description:\*\* (.+?)$',
                     sec_txt, re.M):
    sections.append({'num': int(m.group(1)), 'title': m.group(2), 'prefix': m.group(3),
                     'impact': m.group(4).strip(), 'desc': m.group(5).strip()})
assert sections, 'no sections parsed'

# ---- rules ----
def parse(path):
    raw = path.read_text()
    m = re.match(r'^---\n(.*?)\n---\n(.*)$', raw, re.S)
    assert m, path
    fm = dict(re.findall(r'^(\w+):\s*(.*)$', m.group(1), re.M))
    body = m.group(2).lstrip('\n')
    body = re.sub(r'^## .+?\n+', '', body, count=1)          # drop the rule's own H2
    body = re.sub(r'^\*\*Impact:.*?\*\*\n+', '', body, count=1)  # drop a hand-written impact line
    return {'title': fm['title'].strip(), 'impact': fm.get('impact', 'MEDIUM').strip(),
            'desc': fm.get('impactDescription', '').strip(), 'body': body.rstrip() + '\n'}

for s in sections:
    files = sorted(RULES.glob(f"{s['prefix']}-*.md"))
    s['rules'] = sorted((parse(f) for f in files), key=lambda r: r['title'].lower())

def anchor(text):
    a = text.lower()
    a = re.sub(r'[^\w\s-]', '', a)
    return re.sub(r'\s+', '-', a.strip())

total = sum(len(s['rules']) for s in sections)

out = []
out.append(f"""# React Best Practices

**Version 1.0.0**  
Adapted from Vercel Engineering (MIT)  
January 2026

> **Note:**  
> This document is mainly for agents and LLMs to follow when maintaining,  
> generating, or refactoring React code in this repository. Humans  
> may also find it useful, but guidance here is optimized for automation  
> and consistency by AI-assisted workflows.

---

## Abstract

Performance optimization guide for client-rendered React applications, designed for AI agents and LLMs. Contains {total} rules across {len(sections)} categories, prioritized by impact from critical (eliminating waterfalls, reducing bundle size) to incremental (advanced patterns). Each rule includes detailed explanations, real-world examples comparing incorrect vs. correct implementations, and specific impact metrics to guide automated refactoring and code generation.

This is the Vercel React Best Practices set with the Next.js and server-rendering material removed: this repo ships a client-only React SPA on Vite, with the backend in Rust, so there are no server components, server actions, route handlers, or hydration passes.

---

## Table of Contents

""")

toc = []
for s in sections:
    toc.append(f"{s['num']}. [{s['title']}](#{s['num']}-{anchor(s['title'])}) — **{s['impact']}**")
    for i, r in enumerate(s['rules'], 1):
        rid = f"{s['num']}.{i}"
        toc.append(f"   - {rid} [{r['title']}](#{anchor(rid + ' ' + r['title'])})")
out.append('\n'.join(toc) + '\n')

for s in sections:
    out.append(f"\n---\n\n## {s['num']}. {s['title']}\n\n**Impact: {s['impact']}**\n\n{s['desc']}\n")
    for i, r in enumerate(s['rules'], 1):
        head = f"**Impact: {r['impact']}" + (f" ({r['desc']})**" if r['desc'] else "**")
        out.append(f"\n### {s['num']}.{i} {r['title']}\n\n{head}\n\n{r['body']}")

refs = []
for s in sections:
    for r in s['rules']:
        for url in re.findall(r'\]\((https?://[^)]+)\)', r['body']):
            if url not in refs:
                refs.append(url)
refs = ['https://react.dev'] + [u for u in refs if u != 'https://react.dev']
out.append("\n---\n\n## References\n\n" + '\n'.join(f"{i}. [{u}]({u})" for i, u in enumerate(refs, 1)) + '\n')

(ROOT / 'AGENTS.md').write_text(''.join(out))
print(f"{total} rules, {len(sections)} sections, {len(refs)} references")
