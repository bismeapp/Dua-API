#!/usr/bin/env python3
"""Synchronize supplied Hajj & Umrah items to all application data mirrors."""

import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LANGUAGES = ["en", "ta", "ml", "ar", "ur", "fr", "tr", "id", "bn", "ms"]
SOURCE_PATH = "data/duas/categories/hajj-umrah/source-items.json"
LOCALIZED_PATH = "data/duas/categories/hajj-umrah/localized-items.json"
CATEGORY_ID = "hajj-umrah"
TRANSLATION_STATUS = "Machine-generated; human review required."
DUPLICATE_SOURCE_ITEMS = {8, 48}


def retained_source_items(source):
    return [
        item for item in source["items"]
        if item["number"] not in DUPLICATE_SOURCE_ITEMS
    ]


def read_json(relative_path):
    with open(os.path.join(ROOT, relative_path), encoding="utf-8") as file:
        return json.load(file)


def write_json(relative_path, value):
    path = os.path.join(ROOT, relative_path)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as file:
        json.dump(value, file, ensure_ascii=False, indent=2)
        file.write("\n")


def assert_localized_map(value, where, allow_empty=False):
    if not isinstance(value, dict) or set(value) != set(LANGUAGES):
        raise ValueError(f"{where} must have exactly the supported language keys")
    for language in LANGUAGES:
        text = value[language]
        if not isinstance(text, str) or (not allow_empty and not text.strip()):
            raise ValueError(f"{where}.{language} must be a non-empty string")


def validate_source(source, localized):
    source_items = source.get("items", [])
    translated_items = localized.get("items", [])
    if [item.get("number") for item in source_items] != list(range(1, 55)):
        raise ValueError("Source must contain items numbered exactly 1 through 54.")
    if [item.get("number") for item in translated_items] != list(range(1, 55)):
        raise ValueError("Localized data must contain items numbered exactly 1 through 54.")
    expected_sections = list("ABCDEFGHIJKLMNOP")
    if [section.get("letter") for section in source.get("sections", [])] != expected_sections:
        raise ValueError("Source must contain sections A through P in order.")
    if [section.get("letter") for section in localized.get("sections", [])] != expected_sections:
        raise ValueError("Localized data must contain sections A through P in order.")
    if localized.get("translation_status") != TRANSLATION_STATUS:
        raise ValueError("Translation status must indicate human review is required.")
    for source_item, translated_item in zip(source_items, translated_items):
        number = source_item["number"]
        if source_item["section"] != translated_item.get("section"):
            raise ValueError(f"Item {number} section differs from source.")
        for field in ("title", "translation", "classification"):
            assert_localized_map(
                translated_item.get(field), f"item {number} {field}"
            )
        if source_item.get("notes_en"):
            assert_localized_map(
                translated_item.get("notes"), f"item {number} notes"
            )
        if translated_item["title"]["en"] != source_item["title"]:
            raise ValueError(f"Item {number} English title differs from source.")
        if translated_item["translation"]["en"] != source_item["english"]:
            raise ValueError(f"Item {number} English meaning differs from source.")
        if source_item.get("notes_en"):
            if translated_item["notes"]["en"] != source_item["notes_en"]:
                raise ValueError(f"Item {number} English note differs from source.")
        elif "notes" in translated_item:
            raise ValueError(f"Item {number} has notes that are absent from the source.")
        if translated_item["classification"]["en"] != source_item["classification"]:
            raise ValueError(f"Item {number} English classification differs from source.")
        if not isinstance(source_item.get("arabic"), str):
            raise ValueError(f"Item {number} Arabic must be a string.")
        if not isinstance(source_item.get("transliteration"), str):
            raise ValueError(f"Item {number} transliteration must be a string.")
    for source_section, translated_section in zip(
        source["sections"], localized["sections"]
    ):
        assert_localized_map(
            translated_section.get("title"),
            f"section {source_section['letter']} title",
        )
        if source_section.get("introduction"):
            assert_localized_map(
                translated_section.get("introduction"),
                f"section {source_section['letter']} introduction",
            )
        if translated_section["title"]["en"] != source_section["title"]:
            raise ValueError(f"Section {source_section['letter']} English title differs.")
        if translated_section.get("introduction", {}).get("en", "") != source_section.get("introduction", ""):
            raise ValueError(f"Section {source_section['letter']} introduction differs.")


def references(value):
    if not value:
        return {"source": None, "reference_text": None}
    first_source = value.split()[0].rstrip(".,;:")
    return {"source": first_source, "reference_text": value}


def localized_sections(source, localized):
    source_by_letter = {section["letter"]: section for section in source["sections"]}
    result = []
    for number, section in enumerate(localized["sections"], start=1):
        letter = section["letter"]
        ids = [
            f"hu-expanded-{item['number']:03d}"
            for item in retained_source_items(source)
            if item["section"] == letter
        ]
        section_record = {
            "id": f"hajj-{letter.lower()}",
            "section_number": number,
            "letter": letter,
            "title": section["title"]["en"],
            "title_localized": section["title"],
            "item_numbers": [
                item["number"] for item in retained_source_items(source)
                if item["section"] == letter
            ],
            "dua_ids": ids,
        }
        if section.get("introduction"):
            section_record["introduction"] = section["introduction"]
            section_record["source_introduction"] = source_by_letter[letter]["introduction"]
        result.append(section_record)
    return result


def expanded_records(source, localized, first_order):
    localized_by_number = {item["number"]: item for item in localized["items"]}
    section_by_letter = {section["letter"]: section for section in localized["sections"]}
    records = []
    for item in retained_source_items(source):
        number = item["number"]
        locale = localized_by_number[number]
        section_number = ord(item["section"]) - ord("A") + 1
        section = section_by_letter[item["section"]]
        record = {
            "id": f"hu-expanded-{number:03d}",
            "category_id": CATEGORY_ID,
            "subcategory_id": None,
            "order": first_order + len(records),
            "title": locale["title"],
            "arabic": item["arabic"],
            "transliteration": item["transliteration"],
            "translation": locale["translation"],
            "reference": references(item.get("reference", "")),
            "repetition_count": 1,
            "item_number": number,
            "section_id": f"hajj-{item['section'].lower()}",
            "section_number": section_number,
            "section_letter": item["section"],
            "section_title": section["title"],
            "classification": locale["classification"],
            "translation_status": TRANSLATION_STATUS,
            "source_text": {
                "arabic": item["arabic"],
                "transliteration": item["transliteration"],
                "english_title": item["title"],
                "english_translation": item["english"],
                "english_note": item.get("notes_en", ""),
                "reference": item.get("reference", ""),
            },
        }
        if locale.get("notes"):
            record["notes"] = locale["notes"]
        records.append(record)
    return records


def runtime_record(record):
    result = dict(record)
    reference = record["reference"].get("reference_text")
    result["reference"] = reference or ""
    result["times"] = record["repetition_count"]
    result.pop("repetition_count", None)
    return result


def update_indexes(count):
    for path in (
        "data/duas/categories/index.json",
        "flutter_app/assets/json/data/duas/categories/index.json",
    ):
        index = read_json(path)
        category = next(
            (entry for entry in index["categories"] if entry["id"] == CATEGORY_ID),
            None,
        )
        if category is None:
            raise ValueError(f"{path} does not contain {CATEGORY_ID}.")
        previous_count = category["item_count"]
        category["item_count"] = count
        index["total_records"] += count - previous_count
        write_json(path, index)

    for path in (
        "metadata/categories.json",
        "flutter_app/assets/json/metadata/categories.json",
    ):
        index = read_json(path)
        category = next(
            (entry for entry in index["categories"] if entry["id"] == CATEGORY_ID),
            None,
        )
        if category is None:
            raise ValueError(f"{path} does not contain {CATEGORY_ID}.")
        previous_count = category["item_count"]
        category["item_count"] = count
        index["total_records"] += count - previous_count
        write_json(path, index)

    api_index_path = "public/api/v1/index.json"
    api_index = read_json(api_index_path)
    api_category = next(
        (entry for entry in api_index["categories"] if entry["id"] == CATEGORY_ID),
        None,
    )
    if api_category is None:
        raise ValueError(f"{api_index_path} does not contain {CATEGORY_ID}.")
    previous_count = api_category["duas_count"]
    api_category["duas_count"] = count
    api_index["total_duas"] += count - previous_count
    write_json(api_index_path, api_index)


def update_asset_map():
    path = "flutter_app/assets/json/ASSET_MAP.json"
    manifest = read_json(path)
    asset_root = os.path.join(ROOT, "flutter_app", "assets", "json")
    for entry in manifest.get("entries", []):
        asset_path = entry.get("asset_path", "")
        if asset_path in {
            "data/duas/categories/hajj-umrah/duas.json",
            "data/duas/categories/hajj-umrah/metadata.json",
            "data/duas/categories/index.json",
            "metadata/categories.json",
        }:
            full_path = os.path.join(asset_root, *asset_path.split("/"))
            entry["bytes"] = os.path.getsize(full_path)
            with open(full_path, encoding="utf-8") as file:
                data = json.load(file)
            entry["top_level_keys"] = sorted(data.keys())
    write_json(path, manifest)


def main():
    source = read_json(SOURCE_PATH)
    localized = read_json(LOCALIZED_PATH)
    validate_source(source, localized)

    canonical_path = "data/duas/categories/hajj-umrah/duas.json"
    canonical = read_json(canonical_path)
    existing = [
        dua for dua in canonical["duas"]
        if not str(dua.get("id", "")).startswith("hu-expanded-")
    ]
    additions = expanded_records(source, localized, len(existing) + 1)
    records = existing + additions
    canonical["duas"] = records
    canonical["count"] = len(records)
    canonical["sections"] = localized_sections(source, localized)
    canonical["translation_status"] = TRANSLATION_STATUS
    write_json(canonical_path, canonical)

    metadata_path = "data/duas/categories/hajj-umrah/metadata.json"
    metadata = read_json(metadata_path)
    metadata["item_count"] = len(records)
    metadata["description"] = {
        "en": "Hajj and Umrah supplications, remembrances, instructions, and explanatory notes organized by ritual stage.",
        "ta": "ஹஜ் மற்றும் உம்ரா துஆக்கள், திக்ர்கள், வழிமுறைகள் மற்றும் விளக்கக் குறிப்புகள் சடங்கு நிலைகளின்படி ஒழுங்கமைக்கப்பட்டுள்ளன.",
        "ml": "ഹജ്ജ്, ഉംറ ദുആകൾ, ദിക്റുകൾ, നിർദേശങ്ങൾ, വിശദീകരണ കുറിപ്പുകൾ എന്നിവ ആചാരഘട്ടങ്ങളായി ക്രമീകരിച്ചിരിക്കുന്നു.",
        "ar": "أدعية وأذكار وتعليمات وملاحظات توضيحية للحج والعمرة مرتبة حسب مراحل المناسك.",
        "ur": "حج اور عمرہ کی دعائیں، اذکار، ہدایات اور وضاحتی نوٹس مناسک کے مراحل کے مطابق ترتیب دیے گئے ہیں۔",
        "fr": "Invocations, évocations, instructions et notes explicatives du Hajj et de la Omra, organisées par étape rituelle.",
        "tr": "Hac ve Umre duaları, zikirleri, talimatları ve açıklayıcı notları ibadet aşamalarına göre düzenlenmiştir.",
        "id": "Doa, zikir, petunjuk, dan catatan penjelasan Haji dan Umrah disusun berdasarkan tahap ibadah.",
        "bn": "হজ ও উমরাহর দোয়া, জিকির, নির্দেশনা ও ব্যাখ্যামূলক নোট আচার-অনুষ্ঠানের ধাপ অনুযায়ী সাজানো হয়েছে।",
        "ms": "Doa, zikir, arahan dan nota penjelasan Haji dan Umrah disusun mengikut peringkat ibadah.",
    }
    metadata["translation_status"] = TRANSLATION_STATUS
    write_json(metadata_path, metadata)

    runtime = read_json("src/data/allData.json")
    runtime_category = next(
        (category for category in runtime["categories"] if category["id"] == CATEGORY_ID),
        None,
    )
    if runtime_category is None:
        raise ValueError("React runtime data does not contain Hajj & Umrah.")
    old_runtime = [
        dua for dua in runtime_category["duas"]
        if not str(dua.get("id", "")).startswith("hu-expanded-")
    ]
    runtime_category["duas"] = old_runtime + [
        runtime_record(record) for record in additions
    ]
    runtime_category["hajjSections"] = localized_sections(source, localized)
    runtime_category["translationStatus"] = TRANSLATION_STATUS
    write_json("src/data/allData.json", runtime)

    api_path = "public/api/v1/duas.json"
    api = read_json(api_path)
    api_category = next(
        (category for category in api["categories"] if category["id"] == CATEGORY_ID),
        None,
    )
    if api_category is None:
        raise ValueError("Public API data does not contain Hajj & Umrah.")
    previous_api_count = len(api_category["duas"])
    old_api = [
        dua for dua in api_category["duas"]
        if not str(dua.get("id", "")).startswith("hu-expanded-")
    ]
    api_category["duas"] = old_api + additions
    api_category["sections"] = canonical["sections"]
    api_category["translation_status"] = TRANSLATION_STATUS
    api["total_duas"] += len(api_category["duas"]) - previous_api_count
    write_json(api_path, api)

    write_json(
        "flutter_app/assets/json/data/duas/categories/hajj-umrah/duas.json",
        canonical,
    )
    write_json(
        "flutter_app/assets/json/data/duas/categories/hajj-umrah/metadata.json",
        metadata,
    )
    update_indexes(len(records))
    update_asset_map()
    print(
        f"Synchronized {len(additions)} numbered items in 16 sections; "
        f"preserved {len(existing)} existing records ({len(records)} total)."
    )


if __name__ == "__main__":
    main()
