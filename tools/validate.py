#!/usr/bin/env python3
"""ANTENNA コンテンツ検証 — push前に必ず実行する(update-runbook.md 参照)。
検査: JSON構文 / site.json⇔pages対応 / [[glossary:]]・[[page:]]リンク整合 / demo id実在
"""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content"
DEMOS = {"next-token", "attention", "training", "tokenize", "temperature"}
LINK_RE = re.compile(r"\[\[(glossary|page):([a-z0-9/-]+)\|([^\]]+)\]\]")
errors = []


def load(path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as e:
        errors.append(f"JSON構文エラー: {path.relative_to(ROOT)}: {e}")
        return None


def walk_text(obj):
    if isinstance(obj, str):
        yield obj
    elif isinstance(obj, list):
        for v in obj:
            yield from walk_text(v)
    elif isinstance(obj, dict):
        for v in obj.values():
            yield from walk_text(v)


site = load(CONTENT / "site.json")
glossary = load(CONTENT / "glossary.json")
trends = load(CONTENT / "trends.json")
if site is None or glossary is None or trends is None:
    print("\n".join(errors)); sys.exit(1)

slugs = {t.get("slug") for t in glossary["terms"]}
if None in slugs or "" in slugs:
    errors.append("glossary: slug のないエントリがある")

page_refs = set()
for s in site["sections"]:
    for p in s.get("pages", []):
        page_refs.add(f"{s['id']}/{p['slug']}")
        f = CONTENT / "pages" / s["id"] / f"{p['slug']}.json"
        if not f.exists():
            errors.append(f"site.json に載っているが実体がない: {f.relative_to(ROOT)}")

for f in sorted((CONTENT / "pages").rglob("*.json")):
    rel = f"{f.parent.name}/{f.stem}"
    if rel not in page_refs:
        errors.append(f"実体はあるが site.json に載っていない: {f.relative_to(ROOT)}")
    data = load(f)
    if data is None:
        continue
    for key in ("title", "lede", "updated", "blocks"):
        if key not in data:
            errors.append(f"{f.relative_to(ROOT)}: 必須キー {key} がない")
    for b in data.get("blocks", []):
        if b.get("type") == "demo" and b.get("id") not in DEMOS:
            errors.append(f"{f.relative_to(ROOT)}: 不明な demo id {b.get('id')}")
    for text in walk_text(data):
        for kind, target, _label in LINK_RE.findall(text):
            if kind == "glossary" and target not in slugs:
                errors.append(f"{f.relative_to(ROOT)}: 存在しない用語リンク [[glossary:{target}]]")
            if kind == "page" and target not in page_refs:
                errors.append(f"{f.relative_to(ROOT)}: 存在しないページリンク [[page:{target}]]")

for t in glossary["terms"]:
    for r in t.get("related", []):
        if r not in slugs:
            errors.append(f"glossary[{t.get('slug')}]: related に存在しないslug {r}")
    for kind, target, _ in LINK_RE.findall(t.get("definition", "") + t.get("context", "")):
        if kind == "glossary" and target not in slugs:
            errors.append(f"glossary[{t.get('slug')}]: 存在しない用語リンク [[glossary:{target}]]")
        if kind == "page" and target not in page_refs:
            errors.append(f"glossary[{t.get('slug')}]: 存在しないページリンク [[page:{target}]]")

versions = [i["version"] for i in trends["issues"]]
if len(versions) != len(set(versions)):
    errors.append("trends: version が重複している")
for i in trends["issues"]:
    for item in i["items"]:
        for key in ("title", "category", "summary", "why"):
            if key not in item:
                errors.append(f"trends[{i['version']}]: 記事に {key} がない: {item.get('title', '?')[:20]}")

if errors:
    print(f"NG: {len(errors)}件")
    print("\n".join(" - " + e for e in errors))
    sys.exit(1)
n_pages = len(list((CONTENT / 'pages').rglob('*.json')))
print(f"OK: pages={n_pages} terms={len(slugs)} issues={len(versions)}")
