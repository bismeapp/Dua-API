#!/usr/bin/env python3
"""Synchronize the supplied Qaseedah Burdah text to app and API data mirrors."""

import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LANGUAGES = ["en", "ta", "ml", "ar", "ur", "fr", "tr", "id", "bn", "ms"]

NAMES = {
    "en": "Qaseedah Burdhah",
    "ta": "கஸீதா புர்தா",
    "ml": "ഖസീദത്തുൽ ബുർദ",
    "ar": "قصيدة البردة",
    "ur": "قصیدہ بردہ",
    "fr": "Qaseedah Burdhah",
    "tr": "Kasîde-i Bürde",
    "id": "Qasidah Burdah",
    "bn": "কাসিদা বুরদাহ",
    "ms": "Qasidah Burdah",
}
DISPLAY_TITLES = {
    "en": "Qaseedah Burdah Shareef",
    "ta": "கஸீதா புர்தா ஷரீஃப்",
    "ml": "ഖസീദത്തുൽ ബുർദ ശരീഫ്",
    "ar": "قصيدة البردة الشريفة",
    "ur": "قصیدہ بردہ شریف",
    "fr": "Qaseedah Burdah Shareef",
    "tr": "Kasîde-i Bürde Şerif",
    "id": "Qasidah Burdah Shareef",
    "bn": "কাসিদা বুরদাহ শরীফ",
    "ms": "Qasidah Burdah Shareef",
}
DESCRIPTIONS = {
    "en": "Qaseedah Burdah with Arabic poetry and translations.",
    "ta": "அரபுக் கவிதைகளும் மொழிபெயர்ப்புகளும் கொண்ட கஸீதா புர்தா.",
    "ml": "അറബി കവിതകളും വിവർത്തനങ്ങളുമുള്ള ഖസീദത്തുൽ ബുർദ.",
    "ar": "قصيدة البردة بالنص العربي وترجماته.",
    "ur": "عربی شاعری اور تراجم کے ساتھ قصیدہ بردہ۔",
    "fr": "Qaseedah Burdah avec poésie arabe et traductions.",
    "tr": "Arapça şiir ve çevirileriyle Kasîde-i Bürde.",
    "id": "Qasidah Burdah dengan syair Arab dan terjemahannya.",
    "bn": "আরবি কবিতা ও অনুবাদসহ কাসিদা বুরদাহ।",
    "ms": "Qasidah Burdah dengan syair Arab dan terjemahannya.",
}
SECTION_LABELS = {
    "en": ["SECTION ONE", "SECTION TWO", "SECTION THREE", "SECTION FOUR"],
    "ta": ["பகுதி ஒன்று", "பகுதி இரண்டு", "பகுதி மூன்று", "பகுதி நான்கு"],
    "ml": ["ഒന്നാം ഭാഗം", "രണ്ടാം ഭാഗം", "മൂന്നാം ഭാഗം", "നാലാം ഭാഗം"],
    "ar": ["القسم الأول", "القسم الثاني", "القسم الثالث", "القسم الرابع"],
    "ur": ["پہلا حصہ", "دوسرا حصہ", "تیسرا حصہ", "چوتھا حصہ"],
    "fr": ["SECTION UN", "SECTION DEUX", "SECTION TROIS", "SECTION QUATRE"],
    "tr": ["BİRİNCİ BÖLÜM", "İKİNCİ BÖLÜM", "ÜÇÜNCÜ BÖLÜM", "DÖRDÜNCÜ BÖLÜM"],
    "id": ["BAGIAN SATU", "BAGIAN DUA", "BAGIAN TIGA", "BAGIAN EMPAT"],
    "bn": ["প্রথম অংশ", "দ্বিতীয় অংশ", "তৃতীয় অংশ", "চতুর্থ অংশ"],
    "ms": ["BAHAGIAN SATU", "BAHAGIAN DUA", "BAHAGIAN TIGA", "BAHAGIAN EMPAT"],
}


def read_json(relative_path):
    with open(os.path.join(ROOT, relative_path), encoding="utf-8") as file:
        return json.load(file)


def write_json(relative_path, value):
    path = os.path.join(ROOT, relative_path)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as file:
        json.dump(value, file, ensure_ascii=False, indent=2)
        file.write("\n")


def category_name_map():
    return NAMES


def section_metadata(sections):
    result = []
    for section in sections:
        result.append({
            "id": section["id"],
            "section_number": section["section_number"],
            "title": section["title"],
            "title_localized": section["title_localized"],
            "verse_ids": [verse["id"] for verse in section["verses"]],
        })
    return result


def dua_records(sections):
    records = []
    for section in sections:
        for verse in section["verses"]:
            number = len(records) + 1
            title = {
                language: f'{section["title_localized"][language]} · {verse["verse_number"]}'
                for language in LANGUAGES
            }
            records.append({
                "id": verse["id"],
                "category_id": "qaseedah-burdah",
                "subcategory_id": None,
                "order": number,
                "title": title,
                "arabic": verse["arabic"],
                "translation": verse["translation"],
                "repetition_count": 1,
                "section_id": section["id"],
                "section_number": section["section_number"],
                "verse_number": verse["verse_number"],
            })
    return records


def update_category_indexes(count):
    record = {
        "id": "qaseedah-burdah",
        "order": 37,
        "item_count": count,
        "metadata_file": "data/duas/categories/qaseedah-burdah/metadata.json",
        "data_file": "data/duas/categories/qaseedah-burdah/duas.json",
    }
    for path in (
        "data/duas/categories/index.json",
        "flutter_app/assets/json/data/duas/categories/index.json",
    ):
        index = read_json(path)
        previous = next((c for c in index["categories"] if c["id"] == record["id"]), None)
        index["total_categories"] += 0 if previous else 1
        index["total_records"] += count - (previous["item_count"] if previous else 0)
        index["categories"] = [c for c in index["categories"] if c["id"] != record["id"]]
        index["categories"].append(record)
        write_json(path, index)

    metadata_record = {
        "id": "qaseedah-burdah",
        "collection_id": "duas",
        "name": NAMES,
        "parent_id": None,
        "order": 40,
        "item_count": count,
        "metadata_file": "data/duas/categories/qaseedah-burdah/metadata.json",
        "data_file": "data/duas/categories/qaseedah-burdah/duas.json",
    }
    for path in ("metadata/categories.json", "flutter_app/assets/json/metadata/categories.json"):
        index = read_json(path)
        previous = next((c for c in index["categories"] if c["id"] == metadata_record["id"]), None)
        index["total_categories"] += 0 if previous else 1
        index["total_records"] += count - (previous["item_count"] if previous else 0)
        index["categories"] = [c for c in index["categories"] if c["id"] != metadata_record["id"]]
        index["categories"].append(metadata_record)
        write_json(path, index)

    api_index_path = "public/api/v1/index.json"
    api_index = read_json(api_index_path)
    previous = next((c for c in api_index["categories"] if c["id"] == record["id"]), None)
    api_index["total_categories"] += 0 if previous else 1
    api_index["total_duas"] += count - (previous["duas_count"] if previous else 0)
    api_index["categories"] = [c for c in api_index["categories"] if c["id"] != record["id"]]
    api_index["categories"].append({
        "id": "qaseedah-burdah",
        "name": {"en": NAMES["en"], "ar": NAMES["ar"]},
        "duas_count": count,
    })
    write_json(api_index_path, api_index)


def main():
    source = read_json("data/duas/categories/qaseedah-burdah/content.json")
    sections = source["sections"]
    records = dua_records(sections)
    count = len(records)

    canonical = {
        "schema_version": "3.0.0",
        "category_id": "qaseedah-burdah",
        "count": count,
        "description": source["translation_note"],
        "sections": section_metadata(sections),
        "duas": records,
    }
    write_json("data/duas/categories/qaseedah-burdah/duas.json", canonical)

    category_metadata = {
        "id": "qaseedah-burdah",
        "name": NAMES,
        "display_title": DISPLAY_TITLES,
        "description": DESCRIPTIONS,
        "parent_id": None,
        "order": 40,
        "theme": {
            "color": "emerald",
            "gradient": "from-emerald-500 to-teal-700",
            "bg": "bg-emerald-50",
            "border": "border-emerald-200",
            "text": "text-emerald-700",
        },
        "item_count": count,
        "data_file": "duas.json",
    }
    write_json("data/duas/categories/qaseedah-burdah/metadata.json", category_metadata)

    runtime = read_json("src/data/allData.json")
    runtime["categories"] = [c for c in runtime["categories"] if c["id"] != "qaseedah-burdah"]
    runtime["categories"].append({
        "id": "qaseedah-burdah",
        "color": "emerald",
        "gradient": "from-emerald-500 to-teal-700",
        "bg": "bg-emerald-50",
        "border": "border-emerald-200",
        "text": "text-emerald-700",
        "name": NAMES,
        "description": DESCRIPTIONS,
        "displayTitle": DISPLAY_TITLES,
        "sections": section_metadata(sections),
        "duas": records,
    })
    write_json("src/data/allData.json", runtime)

    api = read_json("public/api/v1/duas.json")
    previous = next((c for c in api["categories"] if c["id"] == "qaseedah-burdah"), None)
    api["total_categories"] += 0 if previous else 1
    api["total_duas"] += count - (len(previous.get("duas", [])) if previous else 0)
    api["categories"] = [c for c in api["categories"] if c["id"] != "qaseedah-burdah"]
    api["categories"].append({
        "id": "qaseedah-burdah",
        "color": "emerald",
        "name": NAMES,
        "display_title": DISPLAY_TITLES,
        "description": DESCRIPTIONS,
        "sections": section_metadata(sections),
        "duas": records,
    })
    write_json("public/api/v1/duas.json", api)

    flutter_data_path = "flutter_app/assets/json/data/duas/categories/qaseedah-burdah/duas.json"
    write_json(flutter_data_path, canonical)
    write_json(
        "flutter_app/assets/json/data/duas/categories/qaseedah-burdah/metadata.json",
        category_metadata,
    )
    update_category_indexes(count)
    print(f"Synchronized {len(sections)} sections and {count} supplied verses.")


if __name__ == "__main__":
    main()
