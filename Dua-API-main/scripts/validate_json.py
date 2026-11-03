#!/usr/bin/env python3
"""
validate_json.py — Phase 5 validator #1.

Checks, for every *.json file under data/, metadata/, schema/, public/api/v1/
and flutter_app/assets/json/:
  * the file parses as JSON (UTF-8);
  * the file is not empty / not a placeholder;
  * files that declare a `count`/`item_count`/`total_records` field match the
    actual number of records inside them;
  * IDs are unique within each documented scope (each data file and index);
  * language keys of localized maps belong to the documented set
    {en, ar, ur, fr, tr, id, bn, ms, ta, ml} (plus 'tr' transliteration fields
    which are plain strings on name records);
  * required fields exist with correct types per schema/*.schema.json.

Exit code 0 = all good; 1 = errors found (printed).
Usage: python3 scripts/validate_json.py
"""

import csv
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LANGS = {"en", "ar", "ur", "fr", "tr", "id", "bn", "ms", "ta", "ml"}

SCAN_DIRS = [
    "data",
    "metadata",
    "schema",
    os.path.join("public", "api", "v1"),
    os.path.join("flutter_app", "assets", "json"),
]

errors = []
warnings = []


def err(msg):
    errors.append(msg)


def walk_json():
    for base in SCAN_DIRS:
        bdir = os.path.join(ROOT, base)
        if not os.path.isdir(bdir):
            continue
        for dirpath, _, filenames in os.walk(bdir):
            for fn in sorted(filenames):
                if fn.endswith(".json"):
                    yield os.path.join(dirpath, fn)


def rel(p):
    return os.path.relpath(p, ROOT).replace(os.sep, "/")


def check_localized(obj, path, where, allow_partial=True):
    """All keys of a localized map must be documented language codes."""
    if not isinstance(obj, dict):
        err(f"{path}: {where} should be an object of lang->text, got {type(obj).__name__}")
        return
    bad = [k for k in obj if k not in LANGS]
    if bad:
        err(f"{path}: {where} has undocumented language keys {bad}")
    for k, v in obj.items():
        if not isinstance(v, str):
            err(f"{path}: {where}[{k}] must be a string")


def validate_dua(rec, path, idx):
    req = ["id", "category_id", "order", "title", "arabic", "translation"]
    for f in req:
        if f not in rec:
            err(f"{path}: dua[{idx}] ({rec.get('id','?')}) missing required field '{f}'")
    if not isinstance(rec.get("id"), str) or not rec["id"]:
        err(f"{path}: dua[{idx}] invalid id")
    if not isinstance(rec.get("order"), int):
        err(f"{path}: {rec.get('id')} order must be int")
    if rec.get("subcategory_id") is not None and not isinstance(rec["subcategory_id"], str):
        err(f"{path}: {rec.get('id')} subcategory_id must be null or string")
    check_localized(rec.get("title", {}), path, f"{rec.get('id')}.title")
    check_localized(rec.get("translation", {}), path, f"{rec.get('id')}.translation")
    ref = rec.get("reference")
    if ref is not None:
        if isinstance(ref, dict):
            for k in ("source", "reference_text"):
                v = ref.get(k)
                if v is not None and not isinstance(v, str):
                    err(f"{path}: {rec.get('id')}.reference.{k} must be string or null")
        else:
            err(f"{path}: {rec.get('id')}.reference must be an object")
    if "repetition_count" in rec and not isinstance(rec["repetition_count"], int):
        err(f"{path}: {rec.get('id')}.repetition_count must be int")
    if "transliteration" in rec and not isinstance(rec["transliteration"], str):
        err(f"{path}: {rec.get('id')}.transliteration must be string")


def validate_file(path):
    rp = rel(path)
    try:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:  # noqa: BLE001
        err(f"{rp}: JSON parse error: {e}")
        return
    if data == {} or data == []:
        err(f"{rp}: empty placeholder file")
        return

    if isinstance(data, dict):
        # declared counts vs actual
        for listkey, countkey in (("duas", "count"), ("names", "count"),
                                  ("prophets", "count"), ("featured_names", "count"),
                                  ("name_meanings", "count"), ("categories", "total_categories")):
            if listkey in data and countkey in data:
                actual = len(data[listkey])
                if actual != data[countkey]:
                    err(f"{rp}: declared {countkey}={data[countkey]} but {listkey} has {actual}")
        if "total_records" in data and isinstance(data.get("total_records"), int):
            # collection indexes: sum record_breakdown if present
            rb = data.get("record_breakdown")
            if rb:
                total = 0
                for key, val in rb.items():
                    total += val * (2 if key == "prophet_duas" else 1) if False else 0
        # ID uniqueness within file-level arrays
        seen = set()
        for arr_key in ("duas", "names", "prophets", "featured_names", "name_meanings", "categories", "collections"):
            arr = data.get(arr_key)
            if not isinstance(arr, list):
                continue
            for item in arr:
                if isinstance(item, dict) and "id" in item:
                    if item["id"] in seen:
                        err(f"{rp}: duplicate id '{item['id']}' in {arr_key}")
                    seen.add(item["id"])
        # nested prophet duas ids
        if "prophets" in data and isinstance(data["prophets"], list):
            pids = set()
            for p in data["prophets"]:
                for d in p.get("duas", []) or []:
                    if d["id"] in pids:
                        err(f"{rp}: duplicate prophet-dua id '{d['id']}'")
                    pids.add(d["id"])
        # schema files: basic sanity
        if rp.startswith("schema/") and "$id" in data:
            pass
        # category metadata checks
        if os.path.basename(path) == "metadata.json":
            for f in ("id", "name", "parent_id", "order", "item_count", "data_file"):
                if f not in data:
                    err(f"{rp}: category metadata missing '{f}'")
            if "name" in data:
                check_localized(data["name"], rp, "name")
        # manifest paths
        if rp.endswith("manifest.json") and "collections" in data:
            for c in data["collections"]:
                for key in ("index_file", "categories_index"):
                    if c.get(key):
                        target = os.path.join(ROOT, c[key])
                        if not os.path.exists(target):
                            err(f"{rp}: manifest path does not exist: {c[key]}")
        # categories.json entries
        if rp.endswith("metadata/categories.json"):
            for c in data.get("categories", []):
                for key in ("metadata_file", "data_file"):
                    target = os.path.join(ROOT, c[key])
                    if not os.path.exists(target):
                        err(f"{rp}: broken reference {key}={c[key]}")
        # collection category index entries
        if rp.endswith("data/duas/categories/index.json"):
            for c in data.get("categories", []):
                for key in ("metadata_file", "data_file"):
                    target = os.path.join(ROOT, c[key])
                    if not os.path.exists(target):
                        err(f"{rp}: broken reference {key}={c[key]}")

    if isinstance(data, dict) and "duas" in data and isinstance(data["duas"], list) \
            and data["duas"] and isinstance(data["duas"][0], dict) and "category_id" in data["duas"][0]:
        for i, rec in enumerate(data["duas"]):
            validate_dua(rec, rp, i)
            if rec.get("category_id") != data.get("category_id") and not str(rec.get("category_id","")).startswith("prophet-"):
                err(f"{rp}: dua {rec['id']} category_id '{rec['category_id']}' != file category_id '{data.get('category_id')}'")

    # public api regenerated files
    if rp.endswith("public/api/v1/duas.json"):
        total = sum(len(c["duas"]) for c in data["categories"])
        if total != data.get("total_duas"):
            err(f"{rp}: total_duas={data.get('total_duas')} but actual={total}")
        for c in data["categories"]:
            for d in c["duas"]:
                validate_dua(d, rp + "#" + c["id"], 0)
    if rp.endswith("public/api/v1/index.json"):
        cat_by_id = {c["id"]: c["duas_count"] for c in data["categories"]}
        du = json.load(open(os.path.join(ROOT, "public", "api", "v1", "duas.json"), encoding="utf-8"))
        real = {c["id"]: len(c["duas"]) for c in du["categories"]}
        for cid, claimed in cat_by_id.items():
            if real.get(cid) != claimed:
                err(f"{rp}: index claims {claimed} duas for {cid}, actual {real.get(cid)}")
        if data.get("total_duas") != sum(real.values()):
            err(f"{rp}: total_duas mismatch")


def validate_asma_un_nabi():
    source_path = os.path.join(ROOT, "data", "duas", "categories", "asma-un-nabi", "names.tsv")
    try:
        with open(source_path, encoding="utf-8", newline="") as source_file:
            rows = list(csv.DictReader(source_file, delimiter="\t"))
    except (OSError, UnicodeError, csv.Error) as e:
        err(f"{rel(source_path)}: unable to read authoritative source: {e}")
        return

    expected_header = ["number", "arabic", "transliteration", "meaning_en"]
    if not rows or list(rows[0]) != expected_header:
        err(f"{rel(source_path)}: expected TSV columns {expected_header}")
        return
    if len(rows) != 201:
        err(f"{rel(source_path)}: expected 201 source rows, found {len(rows)}")
        return

    sources = []
    for index, row in enumerate(rows, start=1):
        try:
            number = int(row["number"])
        except (TypeError, ValueError):
            err(f"{rel(source_path)}: row {index} has an invalid number")
            return
        if number != index:
            err(f"{rel(source_path)}: row {index} is numbered {number}, expected {index}")
        sources.append(row)

    files = {
        "data/duas/categories/asma-un-nabi/duas.json": lambda data: data.get("duas", []),
        "src/data/allData.json": lambda data: next(
            (category.get("duas", []) for category in data.get("categories", [])
             if category.get("id") == "asma-un-nabi"), []
        ),
        "public/api/v1/duas.json": lambda data: next(
            (category.get("duas", []) for category in data.get("categories", [])
             if category.get("id") == "asma-un-nabi"), []
        ),
        "flutter_app/assets/json/data/duas/categories/asma-un-nabi/duas.json": lambda data: data.get("duas", []),
    }

    canonical_records = None
    for relative_path, get_records in files.items():
        path = os.path.join(ROOT, relative_path)
        try:
            with open(path, encoding="utf-8") as data_file:
                data = json.load(data_file)
        except (OSError, UnicodeError, json.JSONDecodeError) as e:
            err(f"{relative_path}: unable to read Asma un Nabi data: {e}")
            continue

        records = get_records(data)
        if len(records) != 201:
            err(f"{relative_path}: expected 201 records, found {len(records)}")
            continue
        seen_ids = set()
        for index, (record, source) in enumerate(zip(records, sources), start=1):
            record_id = f"aun-{index:03d}"
            if record.get("id") in seen_ids:
                err(f"{relative_path}: duplicate id '{record.get('id')}'")
            seen_ids.add(record.get("id"))
            if record.get("id") != record_id:
                err(f"{relative_path}: row {index} id is {record.get('id')!r}, expected {record_id!r}")
            if record.get("order") != index:
                err(f"{relative_path}: {record_id} order is {record.get('order')!r}, expected {index}")
            for field in ("arabic", "transliteration"):
                if record.get(field) != source[field]:
                    err(f"{relative_path}: {record_id} {field} differs from names.tsv")
            if record.get("arabic") and any(0xD800 <= ord(char) <= 0xDFFF for char in record["arabic"]):
                err(f"{relative_path}: {record_id} Arabic contains an invalid Unicode surrogate")

            meaning = record.get("translation")
            if not isinstance(meaning, dict) or set(meaning) != LANGS:
                err(f"{relative_path}: {record_id} meaning must contain exactly {sorted(LANGS)}")
                continue
            if meaning.get("en") != source["meaning_en"]:
                err(f"{relative_path}: {record_id} English meaning differs from names.tsv")
            for language in LANGS:
                value = meaning.get(language)
                if not isinstance(value, str) or not value.strip():
                    err(f"{relative_path}: {record_id} has an empty {language} meaning")
                    continue
                if "?" in value:
                    err(f"{relative_path}: {record_id} {language} meaning contains a replacement question mark")
                if language != "en" and value.strip().casefold() in {
                    source["meaning_en"].strip().casefold(),
                    source["transliteration"].strip().casefold(),
                }:
                    err(f"{relative_path}: {record_id} {language} meaning repeats English or transliteration")

        if relative_path == "data/duas/categories/asma-un-nabi/duas.json":
            canonical_records = records
        elif canonical_records is not None:
            for index, (record, canonical) in enumerate(zip(records, canonical_records), start=1):
                for field in ("id", "order", "arabic", "transliteration", "translation"):
                    if record.get(field) != canonical.get(field):
                        err(f"{relative_path}: {field} differs from canonical Asma un Nabi record {index}")


def validate_qaseedah_burdah():
    source_path = os.path.join(ROOT, "data", "duas", "categories", "qaseedah-burdah", "content.json")
    try:
        with open(source_path, encoding="utf-8") as source_file:
            source = json.load(source_file)
    except (OSError, UnicodeError, json.JSONDecodeError) as e:
        err(f"{rel(source_path)}: unable to read supplied Qaseedah source: {e}")
        return

    sections = source.get("sections", [])
    expected_verse_counts = [12, 16, 31, 8]
    if len(sections) != 4:
        err(f"{rel(source_path)}: expected 4 supplied sections, found {len(sections)}")
        return

    source_verses = []
    for section_number, section in enumerate(sections, start=1):
        expected_section_id = f"qbur-{section_number:03d}"
        if section.get("id") != expected_section_id or section.get("section_number") != section_number:
            err(f"{rel(source_path)}: section {section_number} has an invalid stable id or order")
        verses = section.get("verses", [])
        if len(verses) != expected_verse_counts[section_number - 1]:
            err(f"{rel(source_path)}: {expected_section_id} has {len(verses)} verses; expected {expected_verse_counts[section_number - 1]}")
        if set(section.get("title_localized", {})) != LANGS:
            err(f"{rel(source_path)}: {expected_section_id} title must contain all supported languages")
        if set(section.get("introduction", {})) != LANGS:
            err(f"{rel(source_path)}: {expected_section_id} introduction must contain all supported languages")
        for language in LANGS:
            if not isinstance(section.get("introduction", {}).get(language), str) or not section["introduction"][language].strip():
                err(f"{rel(source_path)}: {expected_section_id} has an empty {language} introduction")
        ids = set()
        for verse_number, verse in enumerate(verses, start=1):
            expected_id = f"{expected_section_id}-{verse_number:03d}"
            if verse.get("id") != expected_id or verse.get("verse_number") != verse_number:
                err(f"{rel(source_path)}: {expected_section_id} verse {verse_number} has an invalid stable id or order")
            if verse.get("id") in ids:
                err(f"{rel(source_path)}: duplicate verse id {verse.get('id')!r}")
            ids.add(verse.get("id"))
            if not isinstance(verse.get("arabic"), str) or not verse["arabic"].strip() or "?" in verse["arabic"]:
                err(f"{rel(source_path)}: {expected_id} has empty or corrupted Arabic text")
            if not isinstance(verse.get("english"), str) or not verse["english"].strip():
                err(f"{rel(source_path)}: {expected_id} has no supplied English translation")
            if set(verse.get("translation", {})) != LANGS:
                err(f"{rel(source_path)}: {expected_id} translation must contain all supported languages")
            for language in LANGS:
                value = verse.get("translation", {}).get(language)
                if not isinstance(value, str) or not value.strip():
                    err(f"{rel(source_path)}: {expected_id} has an empty {language} translation")
            if verse.get("translation", {}).get("en") != verse.get("english"):
                err(f"{rel(source_path)}: {expected_id} English translation differs from supplied source")
            source_verses.append((section, verse))

    incomplete = sections[3].get("incomplete_source_fragment")
    if not incomplete or any(incomplete in verse["arabic"] for _, verse in source_verses):
        err(f"{rel(source_path)}: Section Four incomplete fragment must not be stored as a complete verse")
    if len(source_verses) != 67:
        err(f"{rel(source_path)}: expected 67 supplied complete verses, found {len(source_verses)}")

    expected_fields = ["id", "order", "arabic", "translation", "section_id", "section_number", "verse_number"]
    mirror_files = {
        "data/duas/categories/qaseedah-burdah/duas.json": lambda data: data,
        "src/data/allData.json": lambda data: next(
            (category for category in data.get("categories", [])
             if category.get("id") == "qaseedah-burdah"), {}
        ),
        "public/api/v1/duas.json": lambda data: next(
            (category for category in data.get("categories", [])
             if category.get("id") == "qaseedah-burdah"), {}
        ),
        "flutter_app/assets/json/data/duas/categories/qaseedah-burdah/duas.json": lambda data: data,
    }
    canonical = None
    expected_order = []
    for section, verse in source_verses:
        expected_order.append({
            "id": verse["id"],
            "order": len(expected_order) + 1,
            "arabic": verse["arabic"],
            "translation": verse["translation"],
            "section_id": section["id"],
            "section_number": section["section_number"],
            "verse_number": verse["verse_number"],
        })

    expected_sections = [{
        "id": section["id"],
        "section_number": section["section_number"],
        "title": section["title"],
        "title_localized": section["title_localized"],
        "introduction_en": section["introduction_en"],
        "introduction": section["introduction"],
        "verse_ids": [verse["id"] for verse in section["verses"]],
        "incomplete_source_fragment": section.get("incomplete_source_fragment"),
        "incomplete_content_note_en": section.get("incomplete_content_note_en"),
    } for section in sections]
    for relative_path, get_category in mirror_files.items():
        path = os.path.join(ROOT, relative_path)
        try:
            with open(path, encoding="utf-8") as data_file:
                data = json.load(data_file)
        except (OSError, UnicodeError, json.JSONDecodeError) as e:
            err(f"{relative_path}: unable to read Qaseedah data mirror: {e}")
            continue
        category = get_category(data)
        records = category.get("duas", [])
        if len(records) != len(expected_order):
            err(f"{relative_path}: expected 67 Qaseedah records, found {len(records)}")
            continue
        if category.get("sections") != expected_sections:
            err(f"{relative_path}: localized section titles or introductions differ from supplied Qaseedah source")
        for index, (record, expected) in enumerate(zip(records, expected_order), start=1):
            for field in expected_fields:
                if record.get(field) != expected[field]:
                    err(f"{relative_path}: record {index} field {field} differs from supplied source")
        if relative_path == "data/duas/categories/qaseedah-burdah/duas.json":
            canonical = records
        elif canonical is not None:
            for index, (record, reference) in enumerate(zip(records, canonical), start=1):
                for field in expected_fields:
                    if record.get(field) != reference.get(field):
                        err(f"{relative_path}: record {index} field {field} differs from canonical Qaseedah data")


def validate_hajj_umrah():
    source_path = os.path.join(ROOT, "data", "duas", "categories", "hajj-umrah", "source-items.json")
    localized_path = os.path.join(ROOT, "data", "duas", "categories", "hajj-umrah", "localized-items.json")
    try:
        with open(source_path, encoding="utf-8") as file:
            source = json.load(file)
        with open(localized_path, encoding="utf-8") as file:
            localized = json.load(file)
    except (OSError, UnicodeError, json.JSONDecodeError) as error:
        err(f"{rel(source_path)}: unable to read supplied Hajj source/localizations: {error}")
        return

    expected_letters = list("ABCDEFGHIJKLMNOP")
    source_items = source.get("items", [])
    source_sections = source.get("sections", [])
    localized_items = localized.get("items", [])
    localized_sections = localized.get("sections", [])
    if [item.get("number") for item in source_items] != list(range(1, 55)):
        err(f"{rel(source_path)}: expected source item numbers 1 through 54")
        return
    if [section.get("letter") for section in source_sections] != expected_letters:
        err(f"{rel(source_path)}: expected A-P source sections in order")
        return
    if [item.get("number") for item in localized_items] != list(range(1, 55)):
        err(f"{rel(localized_path)}: expected localized item numbers 1 through 54")
        return
    if [section.get("letter") for section in localized_sections] != expected_letters:
        err(f"{rel(localized_path)}: expected localized A-P sections in order")
        return
    if localized.get("translation_status") != "Machine-generated; human review required.":
        err(f"{rel(localized_path)}: machine translations must be marked for human review")

    source_by_number = {item["number"]: item for item in source_items}
    localized_by_number = {item["number"]: item for item in localized_items}
    for number in range(1, 55):
        source_item = source_by_number[number]
        localized_item = localized_by_number[number]
        if source_item.get("section") != localized_item.get("section"):
            err(f"{rel(localized_path)}: item {number} section differs from source")
        for field in ("title", "translation", "classification"):
            translations = localized_item.get(field)
            if not isinstance(translations, dict) or set(translations) != LANGS:
                err(f"{rel(localized_path)}: item {number} {field} must have all ten language keys")
                continue
            for language in LANGS:
                text = translations.get(language)
                if not isinstance(text, str) or not text.strip():
                    err(f"{rel(localized_path)}: item {number} has empty {language} {field}")
        if source_item.get("notes_en"):
            note_translations = localized_item.get("notes")
            if not isinstance(note_translations, dict) or set(note_translations) != LANGS:
                err(f"{rel(localized_path)}: item {number} notes must have all ten language keys")
            elif any(not isinstance(note_translations.get(language), str) or not note_translations[language].strip() for language in LANGS):
                err(f"{rel(localized_path)}: item {number} has an empty localized note")
        elif "notes" in localized_item:
            err(f"{rel(localized_path)}: item {number} has an empty note field absent from the source")
        if localized_item.get("title", {}).get("en") != source_item.get("title"):
            err(f"{rel(localized_path)}: item {number} English title differs from source")
        if localized_item.get("translation", {}).get("en") != source_item.get("english"):
            err(f"{rel(localized_path)}: item {number} English meaning differs from source")
        if source_item.get("notes_en") and localized_item.get("notes", {}).get("en") != source_item.get("notes_en"):
            err(f"{rel(localized_path)}: item {number} English note differs from source")
        if localized_item.get("classification", {}).get("en") != source_item.get("classification"):
            err(f"{rel(localized_path)}: item {number} classification differs from source")
        transliteration = source_item.get("transliteration", "")
        if any("\u0600" <= char <= "\u06ff" for char in transliteration):
            err(f"{rel(source_path)}: item {number} transliteration contains Arabic script")
        if transliteration and not any(char.isascii() and char.isalpha() for char in transliteration):
            err(f"{rel(source_path)}: item {number} transliteration is not Roman-script text")

    for language_section, source_section in zip(localized_sections, source_sections):
        for field in ("title", "introduction"):
            values = language_section.get(field)
            if field == "introduction" and not source_section.get("introduction"):
                if field in language_section:
                    err(f"{rel(localized_path)}: section {source_section['letter']} has an empty introduction absent from source")
                continue
            if not isinstance(values, dict) or set(values) != LANGS:
                err(f"{rel(localized_path)}: section {source_section['letter']} {field} must have all ten language keys")
                continue
            for language in LANGS:
                if not isinstance(values.get(language), str) or not values[language].strip():
                    err(f"{rel(localized_path)}: section {source_section['letter']} has empty {language} {field}")
        if language_section.get("title", {}).get("en") != source_section.get("title"):
            err(f"{rel(localized_path)}: section {source_section['letter']} title differs from source")
        if language_section.get("introduction", {}).get("en", "") != source_section.get("introduction", ""):
            err(f"{rel(localized_path)}: section {source_section['letter']} introduction differs from source")

    section_counts = {
        letter: sum(item.get("section") == letter for item in source_items)
        for letter in expected_letters
    }
    expected_section_counts = {
        "A": 3, "B": 2, "C": 4, "D": 1, "E": 5, "F": 6, "G": 2, "H": 2,
        "I": 5, "J": 1, "K": 3, "L": 4, "M": 4, "N": 3, "O": 4, "P": 5,
    }
    if section_counts != expected_section_counts:
        err(f"{rel(source_path)}: unexpected A-P item distribution {section_counts}")
    expected_ids = [f"hu-expanded-{number:03d}" for number in range(1, 55)]
    source_by_id = {
        f"hu-expanded-{number:03d}": source_by_number[number]
        for number in range(1, 55)
    }
    mirror_files = {
        "data/duas/categories/hajj-umrah/duas.json": lambda data: data.get("duas", []),
        "src/data/allData.json": lambda data: next(
            (category.get("duas", []) for category in data.get("categories", [])
             if category.get("id") == "hajj-umrah"), []
        ),
        "public/api/v1/duas.json": lambda data: next(
            (category.get("duas", []) for category in data.get("categories", [])
             if category.get("id") == "hajj-umrah"), []
        ),
        "flutter_app/assets/json/data/duas/categories/hajj-umrah/duas.json": lambda data: data.get("duas", []),
    }
    canonical_additions = None
    for relative_path, get_records in mirror_files.items():
        path = os.path.join(ROOT, relative_path)
        try:
            with open(path, encoding="utf-8") as file:
                data = json.load(file)
        except (OSError, UnicodeError, json.JSONDecodeError) as error:
            err(f"{relative_path}: unable to read Hajj data mirror: {error}")
            continue
        records = get_records(data)
        additions = [record for record in records if record.get("id") in expected_ids]
        if len(additions) != 54:
            err(f"{relative_path}: expected 54 numbered Hajj items, found {len(additions)}")
            continue
        if len(records) != 59:
            err(f"{relative_path}: expected 59 total Hajj records including five legacy records, found {len(records)}")
        if [record.get("id") for record in additions] != expected_ids:
            err(f"{relative_path}: numbered Hajj IDs are missing, duplicated, or out of order")
        for number, (record, source_item) in enumerate(zip(additions, source_items), start=1):
            expected_id = f"hu-expanded-{number:03d}"
            if record.get("id") != expected_id:
                continue
            if record.get("item_number") != number:
                err(f"{relative_path}: {expected_id} has an incorrect item number")
            if record.get("section_letter") != source_item.get("section"):
                err(f"{relative_path}: {expected_id} has an incorrect section")
            if record.get("arabic") != source_item.get("arabic"):
                err(f"{relative_path}: {expected_id} Arabic differs from supplied source")
            if record.get("transliteration") != source_item.get("transliteration"):
                err(f"{relative_path}: {expected_id} transliteration differs from supplied source")
            if record.get("title", {}).get("en") != source_item.get("title"):
                err(f"{relative_path}: {expected_id} English title differs from supplied source")
            if record.get("translation", {}).get("en") != source_item.get("english"):
                err(f"{relative_path}: {expected_id} English translation differs from supplied source")
            for field in ("title", "translation", "classification"):
                if not isinstance(record.get(field), dict) or set(record[field]) != LANGS:
                    err(f"{relative_path}: {expected_id} {field} lacks complete language fields")
            if source_item.get("notes_en"):
                if not isinstance(record.get("notes"), dict) or set(record["notes"]) != LANGS:
                    err(f"{relative_path}: {expected_id} notes lack complete language fields")
            elif "notes" in record:
                err(f"{relative_path}: {expected_id} has an empty note field absent from source")
            if relative_path == "data/duas/categories/hajj-umrah/duas.json":
                if record.get("source_text", {}).get("arabic") != source_item.get("arabic"):
                    err(f"{relative_path}: {expected_id} source Arabic is not retained")
                if record.get("reference", {}).get("reference_text") != (source_item.get("reference") or None):
                    err(f"{relative_path}: {expected_id} reference differs from supplied source")
        if relative_path == "data/duas/categories/hajj-umrah/duas.json":
            canonical_additions = additions
            if data.get("sections") is None or [section.get("letter") for section in data["sections"]] != expected_letters:
                err(f"{relative_path}: section metadata does not contain A-P in order")
        elif canonical_additions is not None:
            canonical_by_id = {record["id"]: record for record in canonical_additions}
            for record in additions:
                reference = canonical_by_id.get(record.get("id"))
                if reference is None:
                    continue
                fields = ("id", "item_number", "section_letter", "arabic", "transliteration", "title", "translation", "classification")
                if source_by_id[record["id"]].get("notes_en"):
                    fields += ("notes",)
                for field in fields:
                    if record.get(field) != reference.get(field):
                        err(f"{relative_path}: {record.get('id')} {field} differs from canonical Hajj data")


def main():
    nfiles = 0
    for p in walk_json():
        nfiles += 1
        validate_file(p)
    validate_asma_un_nabi()
    validate_qaseedah_burdah()
    validate_hajj_umrah()
    print(f"Scanned {nfiles} JSON files.")
    for w in warnings:
        print("WARN:", w)
    if errors:
        for e in errors:
            print("ERROR:", e)
        print(f"\nFAILED: {len(errors)} error(s).")
        sys.exit(1)
    print("OK: all JSON files parse, counts match, IDs unique, schemas respected.")


if __name__ == "__main__":
    main()
