#!/usr/bin/env python3
"""
migrate.py — Phase 3 migration for FLUTTER-FRIENDLY-DUA-2.

Reads the original monolithic dataset (backup/legacy-data/allData.json) and
writes the fully reorganized, hierarchical JSON architecture under data/,
metadata/, and regenerates the public API files under public/api/v1/.

Design goals:
  * Zero data loss: every source record is mapped to a destination record.
  * Stable IDs: original dua IDs are retained verbatim; new stable IDs are
    minted only for records that had no ID in the source (99 Names, 25
    Prophets, 40 Rabbana duas, prophet name meanings).
  * item_count / total counts are always computed from actual data.
  * All paths written into indexes are repo-relative POSIX paths.

Run from anywhere:  python3 scripts/migrate.py
"""

import json
import os
import shutil
from collections import OrderedDict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LEGACY = os.path.join(ROOT, "backup", "legacy-data", "allData.json")
LEGACY_PUB_INDEX = os.path.join(ROOT, "backup", "legacy-public-api", "index.json")

SCHEMA_VERSION = "3.0.0"
DATASET_NAME = "islamic-duas-collection"
LANGS = ["en", "ar", "ur", "fr", "tr", "id", "bn", "ms", "ta", "ml"]


def jdump(obj, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)
        f.write("\n")


def jload(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def norm(s):
    return " ".join((s or "").split())


# ---------------------------------------------------------------------------
# Load legacy data
# ---------------------------------------------------------------------------
legacy = jload(LEGACY)
categories = legacy["categories"]
duas103_block = legacy["duas1To103"][0]

COLLECTIONS = OrderedDict()
COLLECTIONS["duas"] = {
    "title": {"en": "Situation-based Duas", "ta": "நிலைமைக்கேற்பான துஆக்கள்"},
    "description": {
        "en": "The collection is organized into 39 categories.",
        "ta": "இந்தத் தொகுப்பு 39 வகைகளாக ஒழுங்கமைக்கப்பட்டுள்ளது.",
    },
}
COLLECTIONS["asma-ul-husna"] = {
    "title": {"en": "Asma ul Husna — 99 Names of Allah", "ta": "அஸ்மாவுல் ஹுஸ்னா — அல்லாஹ்வின் 99 பெயர்கள்"},
    "description": {"en": "The 99 Most Beautiful Names of Allah with transliteration and meanings.",
                    "ta": "அல்லாஹ்வின் 99 அழகான பெயர்கள், படிப்பதும் பொருளும் சேர்த்து."},
}
COLLECTIONS["asma-ul-anbiya"] = {
    "title": {"en": "Asma ul Anbiya — 25 Prophets", "ta": "அஸ்மாவுல் அன்பியா — 25 நபிமார்கள்"},
    "description": {"en": "The 25 prophets named in the Quran with titles, era notes, meanings of their names, and the duas revealed to them where recorded.",
                    "ta": "குர்ஆனில் குறிப்பிடப்பட்ட 25 நபிமார்களின் பெயர்கள், பட்டங்கள், காலம், பொருள் மற்றும் அவர்களுக்கு வழங்கப்பட்ட துஆக்கள்."},
}
COLLECTIONS["rabbana-duas"] = {
    "title": {"en": "40 Rabbana Duas (Quranic)", "ta": "40 ரੱבና துஆக்கள் (குர்ஆன்)"},
    "description": {"en": "Forty Quranic supplications that begin with 'Rabbana' (Our Lord), each with its verse reference.",
                    "ta": "'ரੱబ్ன' (எங்கள் இறைவா) எனத் தொடங்கும் 40 குர்ஆன் துஆக்கள், ஒவ்வொன்றையும் வசன ஆதாரத்துடன்."},
}


def dua_record(src, category_id, order):
    """Normalize one source dua into the common dua model, preserving all fields."""
    rec = OrderedDict()
    rec["id"] = src["id"]
    rec["category_id"] = category_id
    rec["subcategory_id"] = None
    rec["order"] = order
    rec["title"] = src.get("title", {})
    rec["arabic"] = src.get("arabic", "")
    if "transliteration" in src:
        rec["transliteration"] = src["transliteration"]
    rec["translation"] = src.get("translation", {})
    ref = src.get("reference", "")
    rec["reference"] = {
        "source": (ref.split()[0] if norm(ref) else None),
        "reference_text": (ref if norm(ref) else None),
    }
    if "times" in src:
        rec["repetition_count"] = src["times"]
    if "context" in src:
        rec["context"] = src["context"]
    if "sourceText" in src:
        rec["source_text"] = src["sourceText"]
    if "translationStatus" in src:
        rec["translation_status"] = src["translationStatus"]
    return rec


def category_metadata(cat, cid, order, data_file_rel, extra=None):
    md = OrderedDict()
    md["id"] = cat["id"] if cat else cid
    md["name"] = cat["name"] if cat else {}
    md["description"] = {"en": "Category of duas: {}".format(md["name"].get("en", cid))}
    md["parent_id"] = None
    md["order"] = order
    md["icon"] = (cat or {}).get("icon")
    md["theme"] = OrderedDict([
        ("color", (cat or {}).get("color")),
        ("gradient", (cat or {}).get("gradient")),
        ("bg", (cat or {}).get("bg")),
        ("border", (cat or {}).get("border")),
        ("text", (cat or {}).get("text")),
    ]) if cat else None
    md["item_count"] = None  # filled by caller
    md["data_file"] = data_file_rel
    if extra:
        md.update(extra)
    return md


# ===========================================================================
# 1. COLLECTION: duas (35 legacy categories + consolidated Others)
# ===========================================================================
mapping_rows = []
collection_stats = {}
dua_cat_entries = []

for i, cat in enumerate(categories, start=1):
    cid = cat["id"]
    cdir = os.path.join(ROOT, "data", "duas", "categories", cid)
    duas = [dua_record(x, cid, k) for k, x in enumerate(cat["duas"], start=1)]
    jdump({"schema_version": SCHEMA_VERSION, "category_id": cid,
           "count": len(duas), "duas": duas},
          os.path.join(cdir, "duas.json"))
    md = category_metadata(cat, cid, i, "duas.json")
    md["item_count"] = len(duas)
    jdump(md, os.path.join(cdir, "metadata.json"))
    for src, dst in zip(cat["duas"], duas):
        mapping_rows.append({"old_locator": f"src/data/allData.json#/categories/{cid}/duas/{src['id']}",
                             "new_id": dst["id"], "new_category_id": cid})
    dua_cat_entries.append({"id": cid, "order": i, "item_count": len(duas),
                            "metadata_file": f"data/duas/categories/{cid}/metadata.json",
                            "data_file": f"data/duas/categories/{cid}/duas.json"})
    collection_stats.setdefault("duas", 0)
    collection_stats["duas"] += len(duas)

# Consolidated legacy category (was stored outside the `categories` array)
cat103 = duas103_block
cat103["name"] = {
    "en": "Others",
    "ar": "أخرى",
    "ur": "دیگر",
    "fr": "Autres",
    "tr": "Diğerleri",
    "id": "Lainnya",
    "bn": "অন্যান্য",
    "ms": "Lain-lain",
    "ta": "மற்றவை",
    "ml": "മറ്റുള്ളവ",
}
cid = "Others"
i = len(categories) + 1
legacy_category_dir = os.path.join(ROOT, "data", "duas", "categories", "duas1To103")
if os.path.isdir(legacy_category_dir):
    shutil.rmtree(legacy_category_dir)
cdir = os.path.join(ROOT, "data", "duas", "categories", cid)
duas = [dua_record(x, cid, k) for k, x in enumerate(cat103["duas"], start=1)]
jdump({"schema_version": SCHEMA_VERSION, "category_id": cid,
       "count": len(duas), "duas": duas,
       "collection_notes": cat103.get("_metadata", {})},
      os.path.join(cdir, "duas.json"))
md = category_metadata(cat103, cid, i, "duas.json")
md["item_count"] = len(duas)
md["description"] = {
    "en": "Consolidated collection of 103 duas (originally numbered 1 to 103). "
          "Each record preserves the verbatim source text in source_text; several "
          "records have empty arabic/reference fields in the original data.",
    "ta": "103 துஆக்களின் தொகுத்தல் தொகுப்பு. ஒவ்வொரு பதிவும் மூல உரத்துடன் பாதுகாக்கப்பட்டுள்ளது.",
}
jdump(md, os.path.join(cdir, "metadata.json"))
for src, dst in zip(cat103["duas"], duas):
    mapping_rows.append({"old_locator": f"src/data/allData.json#/duas1To103/0/duas/{src['id']}",
                         "new_id": dst["id"], "new_category_id": cid})
dua_cat_entries.append({"id": cid, "order": i, "item_count": len(duas),
                        "metadata_file": f"data/duas/categories/{cid}/metadata.json",
                        "data_file": f"data/duas/categories/{cid}/duas.json"})
collection_stats["duas"] += len(duas)

jdump(OrderedDict([
    ("schema_version", SCHEMA_VERSION),
    ("collection_id", "duas"),
    ("title", COLLECTIONS["duas"]["title"]),
    ("description", COLLECTIONS["duas"]["description"]),
    ("total_categories", len(dua_cat_entries)),
    ("total_records", collection_stats["duas"]),
    ("languages", LANGS),
    ("categories", dua_cat_entries),
]), os.path.join(ROOT, "data", "duas", "categories", "index.json"))
jdump(OrderedDict([
    ("schema_version", SCHEMA_VERSION),
    ("collection_id", "duas"),
    ("total_categories", len(dua_cat_entries)),
    ("total_records", collection_stats["duas"]),
    ("categories_index", "categories/index.json"),
]), os.path.join(ROOT, "data", "duas", "index.json"))

# ===========================================================================
# 2. COLLECTION: asma-ul-husna
# ===========================================================================
husna_dir = os.path.join(ROOT, "data", "asma-ul-husna")
names = []
for n in legacy["asmaUlHusna"]:
    names.append(OrderedDict([
        ("id", f"husna-{n['n']:02d}"),
        ("number", n["n"]),
        ("arabic", n["ar"]),
        ("transliteration", n["tr"]),
        ("meaning", {"en": n["en"], "ta": n["ta"], "ml": n["ml"]}),
    ]))
    mapping_rows.append({"old_locator": f"src/data/allData.json#/asmaUlHusna/{n['n']}",
                         "new_id": f"husna-{n['n']:02d}", "new_category_id": "names"})
jdump({"schema_version": SCHEMA_VERSION, "count": len(names), "names": names},
      os.path.join(husna_dir, "names.json"))

hcat = next(c for c in categories if c["id"] == "asma-ul-husna")
featured = []
for k, n in enumerate(hcat["names"], start=1):
    featured.append(OrderedDict([
        ("id", f"husna-featured-{n['number']:02d}"),
        ("name_ref", f"husna-{n['number']:02d}"),
        ("number", n["number"]),
        ("order", k),
        ("arabic", n["arabic"]),
        ("transliteration", n["transliteration"]),
        ("meaning", n["meaning"]),
    ]))
    mapping_rows.append({"old_locator": f"src/data/allData.json#/categories/asma-ul-husna/names/{n['number']}",
                         "new_id": f"husna-featured-{n['number']:02d}", "new_category_id": "featured-names"})
jdump({"schema_version": SCHEMA_VERSION, "count": len(featured), "featured_names": featured,
       "note": "Featured subset preserved from the original asma-ul-husna category. "
               "Name #5 arabic differs diacritically from the master list (السَّلاَمُ vs السَّلَامُ); both forms preserved verbatim."},
      os.path.join(husna_dir, "featured-names.json"))

intro_dua = dua_record(hcat["duas"][0], "asma-ul-husna", 1)
jdump({"schema_version": SCHEMA_VERSION, "category_id": "asma-ul-husna",
       "count": 1, "duas": [intro_dua]},
      os.path.join(husna_dir, "duas.json"))
mapping_rows.append({"old_locator": "src/data/allData.json#/categories/asma-ul-husna/duas/ah-1",
                     "new_id": "ah-1", "new_category_id": "asma-ul-husna (intro dua)"})

jdump(OrderedDict([
    ("id", "asma-ul-husna"),
    ("name", hcat["name"]),
    ("description", COLLECTIONS["asma-ul-husna"]["description"]),
    ("parent_id", None),
    ("order", 2),
    ("icon", hcat["icon"]),
    ("theme", category_metadata(hcat, "asma-ul-husna", 2, "")["theme"]),
    ("item_count", len(names) + len(featured) + 1),
    ("data_file", "index.json"),
    ("counts", {"names": len(names), "featured_names": len(featured), "duas": 1}),
    ("data_files", {"names": "names.json", "featured_names": "featured-names.json", "duas": "duas.json"}),
]), os.path.join(husna_dir, "metadata.json"))

jdump(OrderedDict([
    ("schema_version", SCHEMA_VERSION),
    ("collection_id", "asma-ul-husna"),
    ("title", COLLECTIONS["asma-ul-husna"]["title"]),
    ("description", COLLECTIONS["asma-ul-husna"]["description"]),
    ("total_records", len(names) + len(featured) + 1),
    ("record_breakdown", {"names": len(names), "featured_names": len(featured), "duas": 1}),
    ("languages", ["ar", "en", "tr", "ta", "ml"]),
    ("files", {"metadata": "metadata.json", "names": "names.json",
               "featured_names": "featured-names.json", "duas": "duas.json"}),
]), os.path.join(husna_dir, "index.json"))
collection_stats["asma-ul-husna"] = len(names) + len(featured) + 1

# ===========================================================================
# 3. COLLECTION: asma-ul-anbiya
# ===========================================================================
anb_dir = os.path.join(ROOT, "data", "asma-ul-anbiya")
prophets = []
for p in legacy["asmaUlAnbiya"]:
    prophets.append(OrderedDict([
        ("id", f"prophet-{p['n']:02d}"),
        ("number", p["n"]),
        ("arabic", p["ar"]),
        ("name", {"en": p["en"], "ta": p["ta"], "ml": p["ml"]}),
        ("title", p["title"]),
        ("era", p["years"]),
    ]))
    mapping_rows.append({"old_locator": f"src/data/allData.json#/asmaUlAnbiya/{p['n']}",
                         "new_id": f"prophet-{p['n']:02d}", "new_category_id": "prophets"})
jdump({"schema_version": SCHEMA_VERSION, "count": len(prophets), "prophets": prophets},
      os.path.join(anb_dir, "prophets.json"))

acat = next(c for c in categories if c["id"] == "asma-ul-anbiya")
emb = []
for k, n in enumerate(acat["prophets"], start=1):
    emb.append(OrderedDict([
        ("id", f"prophet-embedded-{n['number']:02d}"),
        ("prophet_ref", f"prophet-{n['number']:02d}"),
        ("number", n["number"]),
        ("order", k),
        ("arabic", n["arabic"]),
        ("name", n["name"]),
    ]))
    mapping_rows.append({"old_locator": f"src/data/allData.json#/categories/asma-ul-anbiya/prophets/{n['number']}",
                         "new_id": f"prophet-embedded-{n['number']:02d}", "new_category_id": "prophets-embedded"})
jdump({"schema_version": SCHEMA_VERSION, "count": len(emb), "prophets": emb,
       "note": "Preserved verbatim from the original asma-ul-anbiya category. Its numbering places "
               "Dhu al-Kifl at 13 while the master list orders Musa/Harun/Dhu al-Kifl as 14/15/16; "
               "both variants kept, nothing merged or deleted."},
      os.path.join(anb_dir, "prophets-embedded.json"))

meanings = []
for m in legacy["prophetNamesWithMeanings"]:
    meanings.append(OrderedDict([
        ("id", f"prophet-meaning-{m['number']:02d}"),
        ("prophet_ref", f"prophet-{m['number']:02d}"),
        ("number", m["number"]),
        ("arabic", m["arabic"]),
        ("name", m["name"]),
        ("meaning", {"en": m["meaning"], "ta": m["ta"], "ml": m["ml"]}),
    ]))
    mapping_rows.append({"old_locator": f"src/data/allData.json#/prophetNamesWithMeanings/{m['number']}",
                         "new_id": f"prophet-meaning-{m['number']:02d}", "new_category_id": "name-meanings"})
jdump({"schema_version": SCHEMA_VERSION, "count": len(meanings), "name_meanings": meanings},
      os.path.join(anb_dir, "name-meanings.json"))

pwd = []
for p in legacy["prophetsWithDuas"]:
    entry = OrderedDict([
        ("prophet_ref", f"prophet-{p['prophetNumber']:02d}"),
        ("prophet_number", p["prophetNumber"]),
        ("prophet_name", p["prophetName"]),
        ("prophet_meaning", p["prophetMeaning"]),
        ("dua_count", len(p["duas"])),
        ("duas", [dua_record(d, "prophet-" + str(p["prophetNumber"]), k)
                  for k, d in enumerate(p["duas"], start=1)]),
    ])
    pwd.append(entry)
    for d in p["duas"]:
        mapping_rows.append({"old_locator": f"src/data/allData.json#/prophetsWithDuas/{p['prophetNumber']}/duas/{d['id']}",
                             "new_id": d["id"], "new_category_id": f"prophet-{p['prophetNumber']} (with-duas)"})
jdump({"schema_version": SCHEMA_VERSION, "count": len(pwd),
       "total_duas": sum(e["dua_count"] for e in pwd), "prophets": pwd},
      os.path.join(anb_dir, "prophets-with-duas.json"))

aa_dua = dua_record(acat["duas"][0], "asma-ul-anbiya", 1)
jdump({"schema_version": SCHEMA_VERSION, "category_id": "asma-ul-anbiya",
       "count": 1, "duas": [aa_dua]},
      os.path.join(anb_dir, "duas.json"))
mapping_rows.append({"old_locator": "src/data/allData.json#/categories/asma-ul-anbiya/duas/aa-1",
                     "new_id": "aa-1", "new_category_id": "asma-ul-anbiya (intro dua)"})

jdump(OrderedDict([
    ("id", "asma-ul-anbiya"),
    ("name", acat["name"]),
    ("description", COLLECTIONS["asma-ul-anbiya"]["description"]),
    ("parent_id", None),
    ("order", 3),
    ("icon", acat["icon"]),
    ("theme", category_metadata(acat, "asma-ul-anbiya", 3, "")["theme"]),
    ("item_count", len(prophets) + len(emb) + len(meanings) + len(pwd) + 1),
    ("data_file", "index.json"),
    ("counts", {"prophets": len(prophets), "prophets_embedded": len(emb),
                "name_meanings": len(meanings), "prophets_with_duas": len(pwd),
                "prophet_duas": sum(e["dua_count"] for e in pwd), "duas": 1}),
    ("data_files", {"prophets": "prophets.json", "prophets_embedded": "prophets-embedded.json",
                    "name_meanings": "name-meanings.json", "prophets_with_duas": "prophets-with-duas.json",
                    "duas": "duas.json"}),
]), os.path.join(anb_dir, "metadata.json"))

jdump(OrderedDict([
    ("schema_version", SCHEMA_VERSION),
    ("collection_id", "asma-ul-anbiya"),
    ("title", COLLECTIONS["asma-ul-anbiya"]["title"]),
    ("description", COLLECTIONS["asma-ul-anbiya"]["description"]),
    ("total_records", len(prophets) + len(emb) + len(meanings) + len(pwd) + 1),
    ("record_breakdown", {"prophets": len(prophets), "prophets_embedded": len(emb),
                          "name_meanings": len(meanings), "prophets_with_duas": len(pwd),
                          "prophet_duas": sum(e["dua_count"] for e in pwd), "intro_dua": 1}),
    ("languages", ["ar", "en", "ta", "ml", "ur", "fr", "tr", "id", "bn", "ms"]),
    ("files", {"metadata": "metadata.json", "prophets": "prophets.json",
               "prophets_embedded": "prophets-embedded.json", "name_meanings": "name-meanings.json",
               "prophets_with-duas": "prophets-with-duas.json", "duas": "duas.json"}),
]), os.path.join(anb_dir, "index.json"))
collection_stats["asma-ul-anbiya"] = len(prophets) + len(emb) + len(meanings) + len(pwd) + 1

# ===========================================================================
# 4. COLLECTION: rabbana-duas
# ===========================================================================
rb_dir = os.path.join(ROOT, "data", "rabbana-duas")
rb = []
for r in legacy["rabbanaDuas"]:
    rb.append(OrderedDict([
        ("id", f"rabbana-{r['n']:02d}"),
        ("number", r["n"]),
        ("arabic", r["ar"]),
        ("translation", {"en": r["en"]}),
        ("reference", {"source": "The Noble Quran", "reference_text": r["ref"]}),
    ]))
    mapping_rows.append({"old_locator": f"src/data/allData.json#/rabbanaDuas/{r['n']}",
                         "new_id": f"rabbana-{r['n']:02d}", "new_category_id": "rabbana-duas"})
jdump({"schema_version": SCHEMA_VERSION, "count": len(rb), "duas": rb},
      os.path.join(rb_dir, "duas.json"))
jdump(OrderedDict([
    ("id", "rabbana-duas"),
    ("name", {"en": "40 Rabbana Duas", "ta": "40 ரੱবና துஆக்கள்"}),
    ("description", COLLECTIONS["rabbana-duas"]["description"]),
    ("parent_id", None),
    ("order", 4),
    ("icon", "🤲"),
    ("theme", None),
    ("item_count", len(rb)),
    ("data_file", "duas.json"),
]), os.path.join(rb_dir, "metadata.json"))
jdump(OrderedDict([
    ("schema_version", SCHEMA_VERSION),
    ("collection_id", "rabbana-duas"),
    ("title", COLLECTIONS["rabbana-duas"]["title"]),
    ("description", COLLECTIONS["rabbana-duas"]["description"]),
    ("total_records", len(rb)),
    ("languages", ["ar", "en"]),
    ("files", {"metadata": "metadata.json", "duas": "duas.json"}),
]), os.path.join(rb_dir, "index.json"))
collection_stats["rabbana-duas"] = len(rb)

# ===========================================================================
# 5. metadata/categories.json, languages.json, manifest.json
# ===========================================================================
master_cats = []
for e in dua_cat_entries:
    mdsk = jload(os.path.join(ROOT, "data", "duas", "categories", e["id"], "metadata.json"))
    master_cats.append(OrderedDict([
        ("id", e["id"]),
        ("collection_id", "duas"),
        ("name", mdsk["name"]),
        ("parent_id", None),
        ("order", e["order"]),
        ("icon", mdsk.get("icon")),
        ("item_count", e["item_count"]),
        ("metadata_file", e["metadata_file"]),
        ("data_file", e["data_file"]),
    ]))
master_cats.append(OrderedDict([
    ("id", "asma-ul-husna-collection"), ("collection_id", "asma-ul-husna"),
    ("name", COLLECTIONS["asma-ul-husna"]["title"]), ("parent_id", None), ("order", 37),
    ("icon", "✨"), ("item_count", collection_stats["asma-ul-husna"]),
    ("metadata_file", "data/asma-ul-husna/metadata.json"), ("data_file", "data/asma-ul-husna/index.json"),
]))
master_cats.append(OrderedDict([
    ("id", "asma-ul-anbiya-collection"), ("collection_id", "asma-ul-anbiya"),
    ("name", COLLECTIONS["asma-ul-anbiya"]["title"]), ("parent_id", None), ("order", 38),
    ("icon", "📖"), ("item_count", collection_stats["asma-ul-anbiya"]),
    ("metadata_file", "data/asma-ul-anbiya/metadata.json"), ("data_file", "data/asma-ul-anbiya/index.json"),
]))
master_cats.append(OrderedDict([
    ("id", "rabbana-duas-collection"), ("collection_id", "rabbana-duas"),
    ("name", COLLECTIONS["rabbana-duas"]["title"]), ("parent_id", None), ("order", 39),
    ("icon", "🤲"), ("item_count", collection_stats["rabbana-duas"]),
    ("metadata_file", "data/rabbana-duas/metadata.json"), ("data_file", "data/rabbana-duas/index.json"),
]))
jdump({"schema_version": SCHEMA_VERSION, "total_categories": len(master_cats),
       "total_records": sum(c["item_count"] for c in master_cats),
       "categories": master_cats},
      os.path.join(ROOT, "metadata", "categories.json"))

jdump({"schema_version": SCHEMA_VERSION,
       "languages": legacy["languages"],
       "notes": "Language codes follow ISO-639-1. Every localized field is an object keyed by these codes. "
                "Not every record provides every language; consumers must fall back to 'en'."},
      os.path.join(ROOT, "metadata", "languages.json"))

dua_records_total = collection_stats["duas"]
jdump(OrderedDict([
    ("dataset", DATASET_NAME),
    ("schema_version", SCHEMA_VERSION),
    ("generated_by", "scripts/migrate.py"),
    ("description", "Complete Islamic Duas Collection reorganized into a hierarchical, "
                    "Flutter-friendly JSON architecture inspired by quran-hadith-json."),
    ("repository", "https://github.com/Rizna001/FLUTTER-FRIENDLY-DUA-2"),
    ("license", "MIT"),
    ("collections", [
        {"id": "duas", "title": COLLECTIONS["duas"]["title"],
         "total_records": collection_stats["duas"], "total_categories": len(dua_cat_entries),
         "index_file": "data/duas/index.json",
         "categories_index": "data/duas/categories/index.json"},
        {"id": "asma-ul-husna", "title": COLLECTIONS["asma-ul-husna"]["title"],
         "total_records": collection_stats["asma-ul-husna"], "total_categories": 1,
         "index_file": "data/asma-ul-husna/index.json"},
        {"id": "asma-ul-anbiya", "title": COLLECTIONS["asma-ul-anbiya"]["title"],
         "total_records": collection_stats["asma-ul-anbiya"], "total_categories": 1,
         "index_file": "data/asma-ul-anbiya/index.json"},
        {"id": "rabbana-duas", "title": COLLECTIONS["rabbana-duas"]["title"],
         "total_records": collection_stats["rabbana-duas"], "total_categories": 1,
         "index_file": "data/rabbana-duas/index.json"},
    ]),
    ("master_category_index", "metadata/categories.json"),
    ("language_index", "metadata/languages.json"),
    ("supported_languages", LANGS),
    ("totals", {
        "collections": len(COLLECTIONS),
        "dua_categories": len(dua_cat_entries),
        "dua_records": dua_records_total,
        "rabbana_records": collection_stats["rabbana-duas"],
        "prophet_dua_records": sum(e["dua_count"] for e in pwd),
        "intro_dua_records": 2,
        "husna_name_records": len(names),
        "anbiya_prophet_records": len(prophets),
        "records_all_collections": sum(collection_stats.values()),
    }),
    ("paths", {"relative_to": "repository root", "style": "posix"}),
    ("compatibility", {
        "flutter_bundle_root": "flutter_app/assets/json",
        "flutter_bundle_mapping": "entries under flutter_app/assets/json mirror this repository's data/ tree",
        "legacy_public_api": "public/api/v1 regenerated from migrated data",
        "original_backup": "backup/legacy-data/allData.json",
    }),
]), os.path.join(ROOT, "metadata", "manifest.json"))

jdump({"schema_version": SCHEMA_VERSION,
       "description": "Old source locator -> new stable ID. Original dua IDs were retained verbatim; "
                      "IDs were newly minted only for previously un-IDed records.",
       "count": len(mapping_rows),
       "mappings": mapping_rows},
      os.path.join(ROOT, "docs", "id-mapping.json"))

# ===========================================================================
# 6. Regenerate src/data/allData.json as a slim bundle compatible with app code
# ===========================================================================
bundle_categories = []
for e in dua_cat_entries:
    cat_md = jload(os.path.join(ROOT, "data", "duas", "categories", e["id"], "metadata.json"))
    cat_data = jload(os.path.join(ROOT, "data", "duas", "categories", e["id"], "duas.json"))
    legacy_duas = []
    for r in cat_data["duas"]:
        lr = OrderedDict([("id", r["id"]), ("title", r["title"]), ("arabic", r["arabic"])])
        if "transliteration" in r:
            lr["transliteration"] = r["transliteration"]
        lr["translation"] = r["translation"]
        lr["reference"] = r["reference"]["reference_text"] or ""
        lr["times"] = r.get("repetition_count", 1)
        if "context" in r:
            lr["context"] = r["context"]
        if "source_text" in r:
            lr["sourceText"] = r["source_text"]
        if "translation_status" in r:
            lr["translationStatus"] = r["translation_status"]
        legacy_duas.append(lr)
    theme = cat_md.get("theme") or {}
    bundle_categories.append(OrderedDict([
        ("id", cat_md["id"]), ("icon", cat_md.get("icon")),
        ("color", theme.get("color")), ("gradient", theme.get("gradient")),
        ("bg", theme.get("bg")), ("border", theme.get("border")), ("text", theme.get("text")),
        ("name", cat_md["name"]), ("duas", legacy_duas),
    ]))

husna_c = next(c for c in bundle_categories if c["id"] == "asma-ul-husna")
anbiya_c = next(c for c in bundle_categories if c["id"] == "asma-ul-anbiya")
husna_c["names"] = jload(os.path.join(ROOT, "data", "asma-ul-husna", "featured-names.json"))["featured_names"]
anbiya_c["prophets"] = jload(os.path.join(ROOT, "data", "asma-ul-anbiya", "prophets-embedded.json"))["prophets"]

bundle = OrderedDict([
    ("version", SCHEMA_VERSION),
    ("_architecture_note", "This file is a compatibility bundle assembled from data/**. "
                           "The canonical store is the hierarchical tree under data/ and metadata/. "
                           "Regenerate with: python3 scripts/migrate.py && python3 scripts/build_app_bundle.py"),
    ("metadata", OrderedDict([
        ("total_categories", len(bundle_categories)),
        ("total_duas", collection_stats["duas"]),
        ("supported_languages", LANGS),
        ("last_updated", legacy["metadata"]["last_updated"]),
        ("description", legacy["metadata"]["description"]),
    ])),
    ("categories", bundle_categories),
    ("languages", legacy["languages"]),
    ("asmaUlHusna", legacy["asmaUlHusna"]),
    ("asmaUlAnbiya", legacy["asmaUlAnbiya"]),
    ("rabbanaDuas", legacy["rabbanaDuas"]),
    ("prophetNamesWithMeanings", legacy["prophetNamesWithMeanings"]),
    ("prophetsWithDuas", legacy["prophetsWithDuas"]),
    ("Others", [OrderedDict([("id", "Others"), ("name", cat103["name"]),
                                 ("duas", bundle_categories[-1]["duas"]),
                                 ("_metadata", cat103.get("_metadata", {}))])]),
])
jdump(bundle, os.path.join(ROOT, "src", "data", "allData.json"))

# ===========================================================================
# 7. Regenerate public API files from migrated data (corrected counts)
# ===========================================================================
pub_cats = []
for e in dua_cat_entries:
    cat_md = jload(os.path.join(ROOT, "data", "duas", "categories", e["id"], "metadata.json"))
    cat_data = jload(os.path.join(ROOT, "data", "duas", "categories", e["id"], "duas.json"))
    pub_cats.append(OrderedDict([
        ("id", cat_md["id"]), ("icon", cat_md.get("icon")),
        ("color", (cat_md.get("theme") or {}).get("color")),
        ("name", cat_md["name"]),
        ("duas", [dict(x) for x in cat_data["duas"]]),
    ]))
jdump(OrderedDict([
    ("api_version", SCHEMA_VERSION),
    ("description", "Complete Islamic Duas Collection - All supplications with translations "
                    "(regenerated from the migrated hierarchical dataset)."),
    ("total_categories", len(pub_cats)),
    ("total_duas", collection_stats["duas"]),
    ("supported_languages", LANGS),
    ("categories", pub_cats),
]), os.path.join(ROOT, "public", "api", "v1", "duas.json"))

legacy_pub = jload(LEGACY_PUB_INDEX)
jdump(OrderedDict([
    ("api_version", SCHEMA_VERSION),
    ("description", legacy_pub["description"]),
    ("base_url", "/api/v1"),
    ("documentation", "https://github.com/Rizna001/FLUTTER-FRIENDLY-DUA-2/blob/main/API.md"),
    ("endpoints", {"all_duas": "/api/v1/duas.json", "api_index": "/api/v1/index.json"}),
    ("total_categories", len(pub_cats)),
    ("total_duas", collection_stats["duas"]),
    ("supported_languages", legacy_pub["supported_languages"]),
    ("categories", [{"id": c["id"], "name": {"en": c["name"]["en"]}, "icon": c["icon"],
                     "duas_count": len(c["duas"])} for c in pub_cats]),
    ("sources", legacy_pub["sources"]),
    ("usage", legacy_pub["usage"]),
    ("examples", legacy_pub["examples"]),
    ("license", "MIT"),
    ("repository", "https://github.com/Rizna001/FLUTTER-FRIENDLY-DUA-2"),
    ("issues", "https://github.com/Rizna001/FLUTTER-FRIENDLY-DUA-2/issues"),
    ("contributing", "https://github.com/Rizna001/FLUTTER-FRIENDLY-DUA-2/blob/main/CONTRIBUTING.md"),
]), os.path.join(ROOT, "public", "api", "v1", "index.json"))

print("Migration written.")
print("Collections:", json.dumps(collection_stats, indent=2))
print("Mapping rows:", len(mapping_rows))
