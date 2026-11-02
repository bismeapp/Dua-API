#!/usr/bin/env python3
"""Build the 'mawlid' category (Manqoos Mawlid first) and sync all data mirrors.
Add further mawlids by appending to MAWLIDS (source module in data/duas/categories/mawlid/)."""
import importlib.util, json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CAT = "mawlid"
L = ["en", "ta", "ml", "ar", "ur", "fr", "tr", "id", "bn", "ms"]
NAMES = {"en": "Mawlid", "ta": "மௌலித்", "ml": "മൗലിദ്", "ar": "المولد", "ur": "مولد",
         "fr": "Mawlid", "tr": "Mevlid", "id": "Maulid", "bn": "মাওলিদ", "ms": "Maulid"}
DESCR = {"en": "Mawlid texts in praise of the Prophet ﷺ, with Arabic text.",
         "ar": "نصوص المولد النبوي الشريف.",
         **{k: "Mawlid" for k in L if k not in ("en", "ar")}}
PART = {"en": "Part", "ta": "பகுதி", "ml": "ഭാഗം", "ar": "الجزء", "ur": "حصہ",
        "fr": "Partie", "tr": "Bölüm", "id": "Bagian", "bn": "অংশ", "ms": "Bahagian"}
MAWLIDS = [{
    "id": "manqoos-mawlid", "module": "manqoos.py", "number": 1,
    "title": {"en": "Manqoos Mawlid", "ta": "மன்கூஸ் மௌலித்", "ml": "മൻഖൂസ് മൗലിദ്",
              "ar": "مَنْقُوصْ مَوْلِدْ", "ur": "منقوص مولد", "fr": "Manqoos Mawlid",
              "tr": "Mankus Mevlid", "id": "Maulid Manqus", "bn": "মানকুস মাওলিদ", "ms": "Maulid Manqus"},
}]

def rj(p):
    with open(os.path.join(ROOT, p), encoding="utf-8") as f: return json.load(f)
def wj(p, v):
    p = os.path.join(ROOT, p); os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w", encoding="utf-8", newline="\n") as f:
        json.dump(v, f, ensure_ascii=False, indent=2); f.write("\n")

def load(m):
    spec = importlib.util.spec_from_file_location("src", os.path.join(ROOT, "data/duas/categories/mawlid", m["module"]))
    mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod); return mod.E

def load_translations(m):
    """translations/<module>_<lang>.py defining T = [one string per part]; missing languages stay empty."""
    out, stem = {}, m["module"][:-3]
    for l in L:
        f = os.path.join(ROOT, "data/duas/categories/mawlid/translations", f"{stem}_{l}.py")
        if os.path.exists(f):
            spec = importlib.util.spec_from_file_location(f"tr_{stem}_{l}", f)
            mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod); out[l] = mod.T
    return out

def build():
    sections, records = [], []
    for m in MAWLIDS:
        ids = []; src = load(m); trs = load_translations(m)
        for l, T in trs.items():
            assert len(T) == len(src), f"{m['id']}/{l}: {len(T)} parts, expected {len(src)}"
        for i, (kind, ar) in enumerate(src, 1):
            rid = f'{m["id"]}-{i:02d}'; ids.append(rid)
            records.append({
                "id": rid, "category_id": CAT, "subcategory_id": None, "order": len(records) + 1,
                "title": {l: f'{m["title"][l]} · {PART[l]} {i}' for l in L},
                "arabic": ar,
                "translation": {l: (ar if l == "ar" else trs[l][i - 1] if l in trs else "") for l in L},
                "repetition_count": 1, "section_id": m["id"], "section_number": m["number"],
                "verse_number": i, "kind": kind})
        sections.append({"id": m["id"], "section_number": m["number"], "title": m["title"]["en"],
                         "title_localized": m["title"], "verse_ids": ids})
    return sections, records

def _close(text, open_idx):
    """Index of the ']' matching the '[' at open_idx (string-aware)."""
    depth, i, instr = 0, open_idx, False
    while i < len(text):
        c = text[i]
        if instr:
            if c == "\\": i += 1
            elif c == '"': instr = False
        elif c == '"': instr = True
        elif c == "[": depth += 1
        elif c == "]":
            depth -= 1
            if depth == 0: return i
        i += 1
    raise ValueError("unbalanced")

def splice(path, elem, totals=None):
    """Insert elem at the end of the top-level "categories" array and bump totals, as a
    minimal text edit so the repo's CRLF / PowerShell-style formatting is left untouched."""
    full = os.path.join(ROOT, path)
    with open(full, encoding="utf-8", newline="") as f: text = f.read()
    if re.search(r'"id":\s*"%s"' % CAT, text) and CAT in [c["id"] for c in json.loads(text)["categories"]]:
        raise SystemExit(f"{path}: '{CAT}' already present - run `git checkout -- .` first")
    m = re.search(r'\n    "categories":\s*\[', text)
    o = m.end() - 1; c = _close(text, o)
    first = re.match(r"\s*\n([ \t]*)\{", text[o + 1:])
    ind = first.group(1) if first else " " * 8
    body = json.dumps(elem, ensure_ascii=False, indent=4)
    body = re.sub(r'^(\s*"(?:[^"\\]|\\.)*"): ', r"\1:  ", body, flags=re.M)
    body = "\r\n".join(ind + ln for ln in body.split("\n"))
    j = len(text[:c].rstrip())
    text = text[:j] + ",\r\n" + body + text[j:]
    for key, delta in (totals or {}).items():
        text = re.sub(r'("%s":\s*)(\d+)' % key, lambda mm: mm.group(1) + str(int(mm.group(2)) + delta), text, count=1)
    with open(full, "w", encoding="utf-8", newline="") as f: f.write(text)
    json.loads(text)  # must still parse

def main():
    sections, records = build(); n = len(records)
    theme = {"color": "teal", "gradient": "from-teal-500 to-emerald-700", "bg": "bg-teal-50",
             "border": "border-teal-200", "text": "text-teal-700"}
    meta_dir = f"data/duas/categories/{CAT}"
    canon = {"schema_version": "3.0.0", "category_id": CAT, "count": n,
             "description": "Arabic text transcribed from a published edition; translations pending review.",
             "sections": sections, "duas": records}
    meta = {"id": CAT, "name": NAMES, "display_title": NAMES, "description": DESCR, "parent_id": None,
            "order": 43, "theme": theme, "item_count": n, "data_file": "duas.json"}
    tot = {"total_categories": 1, "total_records": n}
    for base in ("", "flutter_app/assets/json/"):
        wj(f"{base}{meta_dir}/duas.json", canon); wj(f"{base}{meta_dir}/metadata.json", meta)
        splice(f"{base}data/duas/categories/index.json",
               {"id": CAT, "order": 43, "item_count": n, "metadata_file": f"{meta_dir}/metadata.json",
                "data_file": f"{meta_dir}/duas.json"}, tot)
        splice(f"{base}metadata/categories.json",
               {"id": CAT, "collection_id": "duas", "name": NAMES, "parent_id": None, "order": 43,
                "item_count": n, "metadata_file": f"{meta_dir}/metadata.json",
                "data_file": f"{meta_dir}/duas.json"}, tot)
    api_tot = {"total_categories": 1, "total_duas": n}
    splice("public/api/v1/index.json", {"id": CAT, "name": {"en": NAMES["en"], "ar": NAMES["ar"]},
                                        "duas_count": n}, api_tot)
    splice("public/api/v1/duas.json", {"id": CAT, "color": "teal", "name": NAMES, "display_title": NAMES,
                                       "description": DESCR, "sections": sections, "duas": records}, api_tot)
    splice("src/data/allData.json", {"id": CAT, **theme, "name": NAMES, "description": DESCR,
                                     "displayTitle": NAMES, "sections": sections, "duas": records})
    print(f"mawlid: {len(sections)} mawlid(s), {n} records")

if __name__ == "__main__":
    main()
