#!/usr/bin/env python3
"""Reclassify existing duas and synchronize the application data mirrors."""

import copy
import json
import os


ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LANGUAGES = ["en", "ta", "ml", "ar", "ur", "fr", "tr", "id", "bn", "ms"]

MOVE_GROUPS = {
    "home": ["d103-5"],
    "travel": ["d103-9", "d103-11", "d103-12", "d103-15", "d103-17"],
    "protection": [
        "d103-18", "d103-25", "d103-37", "d103-38", "d103-66",
        "d103-67", "d103-81", "d103-82", "d103-83", "d103-84",
    ],
    "prayer-duas": [
        "d103-19", "d103-20", "d103-21", "d103-22", "d103-23",
        "d103-24", "d103-31", "d103-32", "d103-68",
    ],
    "children-newborn": [
        "d103-26", "d103-47", "d103-48", "d103-49", "d103-50",
        "d103-51", "d103-52", "d103-53", "d103-58", "d103-69",
        "d103-70", "d103-71", "d103-72", "d103-73", "d103-74",
        "d103-77", "prn-1", "prn-2", "mw-1", "mw-2",
    ],
    "hereafter": ["d103-28", "d103-29", "d103-30"],
    "dua-general": ["d103-27"],
    "forgiveness": ["d103-33"],
    "morning-evening": ["d103-34"],
    "hardship": ["d103-41", "d103-65"],
    "good-character": ["d103-43"],
    "nightmare": ["d103-44"],
    "debt-poverty": ["d103-60", "d103-62", "d103-63", "d103-78"],
    "knowledge": ["d103-79", "d103-80"],
    "market-business": ["d103-91", "d103-92"],
    "death-funeral": ["d103-98", "d103-101"],
}

MOVE_TARGETS = {}
for target, identifiers in MOVE_GROUPS.items():
    for identifier in identifiers:
        if identifier in MOVE_TARGETS:
            raise ValueError(f"{identifier} has more than one destination.")
        MOVE_TARGETS[identifier] = target

EXPECTED_SOURCES = {identifier: "Others" for identifier in MOVE_TARGETS}
EXPECTED_SOURCES.update({
    "prn-1": "parents",
    "prn-2": "parents",
    "mw-1": "marriage-wedding",
    "mw-2": "marriage-wedding",
})

REMOVED_CATEGORIES = {"parents", "marriage-wedding"}
NEW_CATEGORIES = {
    "prayer-duas": {
        "canonical_order": 23,
        "metadata_order": 23,
        "name": {
            "en": "Prayer Duas",
            "ta": "தொழுகை துஆக்கள்",
            "ml": "നമസ്കാര ദുആകൾ",
            "ar": "أدعية الصلاة",
            "ur": "نماز کی دعائیں",
            "fr": "Invocations liées à la prière",
            "tr": "Namaz Duaları",
            "id": "Doa Salat",
            "bn": "নামাজের দোয়া",
            "ms": "Doa Solat",
        },
        "description": {
            "en": "Duas connected to Salah, specific prayer times, and the completion of prayer.",
            "ta": "தொழுகை, குறிப்பிட்ட தொழுகை நேரங்கள் மற்றும் தொழுகை நிறைவுடன் தொடர்புடைய துஆக்கள்.",
            "ml": "നമസ്കാരത്തോടും പ്രത്യേക നമസ്കാര സമയങ്ങളോടും നമസ്കാരത്തിന് ശേഷമുള്ള ദുആകളോടും ബന്ധപ്പെട്ടവ.",
            "ar": "أدعية مرتبطة بالصلاة وأوقاتها المحددة وما يقال بعد انتهائها.",
            "ur": "نماز، مخصوص اوقاتِ نماز اور نماز کے بعد پڑھی جانے والی دعاؤں سے متعلق دعائیں۔",
            "fr": "Invocations liées à la salat, à ses horaires précis et à son accomplissement.",
            "tr": "Namaz, belirli namaz vakitleri ve namazın tamamlanmasıyla ilgili dualar.",
            "id": "Doa yang berkaitan dengan salat, waktu salat tertentu, dan setelah salat.",
            "bn": "সালাত, নির্দিষ্ট নামাজের সময় এবং নামাজের পরের দোয়া-সংক্রান্ত আমল।",
            "ms": "Doa berkaitan solat, waktu solat tertentu dan doa selepas solat.",
        },
        "theme_source": "wudu-adhan",
    },
    "hereafter": {
        "canonical_order": 38,
        "name": {
            "en": "Hereafter",
            "ta": "மறுமை",
            "ml": "പരലോകം",
            "ar": "الآخرة",
            "ur": "آخرت",
            "fr": "L’au-delà",
            "tr": "Ahiret",
            "id": "Akhirat",
            "bn": "আখিরাত",
            "ms": "Akhirat",
        },
        "description": {
            "en": "Duas concerning the Hereafter and life after death.",
            "ta": "மறுமை மற்றும் மரணத்திற்குப் பிந்தைய வாழ்வைப் பற்றிய துஆக்கள்.",
            "ml": "പരലോകത്തെയും മരണാനന്തര ജീവിതത്തെയും കുറിച്ചുള്ള ദുആകൾ.",
            "ar": "أدعية تتعلق بالآخرة والحياة بعد الموت.",
            "ur": "آخرت اور مرنے کے بعد کی زندگی سے متعلق دعائیں۔",
            "fr": "Invocations concernant l’au-delà et la vie après la mort.",
            "tr": "Ahiret ve ölümden sonraki hayatla ilgili dualar.",
            "id": "Doa tentang akhirat dan kehidupan setelah kematian.",
            "bn": "আখিরাত ও মৃত্যুর পরের জীবন সম্পর্কিত দোয়া।",
            "ms": "Doa berkaitan akhirat dan kehidupan selepas mati.",
        },
        "theme_source": "death-funeral",
    },
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


def validate_localized_map(value, where):
    if not isinstance(value, dict) or set(value) != set(LANGUAGES):
        raise ValueError(f"{where} must have exactly the ten supported languages.")
    if any(not isinstance(value[language], str) or not value[language].strip()
           for language in LANGUAGES):
        raise ValueError(f"{where} must contain non-empty strings for all languages.")


def collect_canonical(index):
    data_by_category = {}
    metadata_by_category = {}
    records_by_id = {}
    for entry in index["categories"]:
        category_id = entry["id"]
        data = read_json(entry["data_file"])
        metadata = read_json(entry["metadata_file"])
        if data.get("category_id") != category_id:
            raise ValueError(f"{entry['data_file']} has the wrong category_id.")
        if len(data.get("duas", [])) != entry["item_count"]:
            raise ValueError(f"{entry['data_file']} has an incorrect item_count.")
        for record in data["duas"]:
            identifier = record["id"]
            if identifier in records_by_id:
                raise ValueError(f"Duplicate canonical Dua ID: {identifier}")
            if record.get("category_id") != category_id:
                raise ValueError(f"{identifier} has an inconsistent category_id.")
            records_by_id[identifier] = copy.deepcopy(record)
        data_by_category[category_id] = data
        metadata_by_category[category_id] = metadata

    if len(records_by_id) != index.get("total_records"):
        raise ValueError("Canonical category index total_records does not match the data.")
    return data_by_category, metadata_by_category, records_by_id


def create_category(category_id, definition, metadata_by_category, metadata_order=None):
    theme = copy.deepcopy(metadata_by_category[definition["theme_source"]]["theme"])
    metadata = {
        "id": category_id,
        "name": copy.deepcopy(definition["name"]),
        "description": copy.deepcopy(definition["description"]),
        "parent_id": None,
        "order": metadata_order if metadata_order is not None else definition.get(
            "metadata_order", definition["canonical_order"]
        ),
        "theme": theme,
        "item_count": 0,
        "data_file": "duas.json",
    }
    data = {
        "schema_version": "3.0.0",
        "category_id": category_id,
        "count": 0,
        "duas": [],
    }
    return metadata, data


def move_canonical_records(data_by_category):
    moved = {category_id: [] for category_id in MOVE_GROUPS}
    moved_counts = {identifier: 0 for identifier in MOVE_TARGETS}

    for category_id, data in list(data_by_category.items()):
        retained = []
        for record in data["duas"]:
            identifier = record["id"]
            target = MOVE_TARGETS.get(identifier)
            if target is None or target == category_id:
                retained.append(record)
                continue
            expected_source = EXPECTED_SOURCES[identifier]
            if category_id != expected_source:
                raise ValueError(
                    f"{identifier} was expected in {expected_source}, not {category_id}."
                )
            moved[target].append(record)
            moved_counts[identifier] += 1
        data["duas"] = retained

    for identifier, target in MOVE_TARGETS.items():
        if identifier not in {
            record["id"]
            for records in moved.values()
            for record in records
        } and not any(
            record["id"] == identifier
            for data in data_by_category.values()
            for record in data["duas"]
        ):
            raise ValueError(f"Expected Dua {identifier} is missing.")

    for target, records in moved.items():
        if target not in data_by_category:
            raise ValueError(f"Destination category {target} was not created.")
        for record in records:
            record["category_id"] = target
        data_by_category[target]["duas"].extend(records)

    return sum(moved_counts.values())


def move_mirror_records(categories, mirror_name, metadata_by_category, order_by_id):
    category_map = {category["id"]: category for category in categories}
    for category_id, definition in NEW_CATEGORIES.items():
        if category_id not in category_map:
            metadata = metadata_by_category[category_id]
            theme = metadata["theme"]
            category = {
                "id": category_id,
                "color": theme.get("color"),
                "name": copy.deepcopy(metadata["name"]),
                "duas": [],
            }
            if mirror_name == "runtime":
                category.update({
                    "gradient": theme.get("gradient"),
                    "bg": theme.get("bg"),
                    "border": theme.get("border"),
                    "text": theme.get("text"),
                })
            categories.append(category)
            category_map[category_id] = category

    moved = {category_id: [] for category_id in MOVE_GROUPS}
    moved_ids = set()
    found_ids = set()
    for category in categories:
        category_id = category["id"]
        retained = []
        for record in category.get("duas", []):
            identifier = record["id"]
            target = MOVE_TARGETS.get(identifier)
            if target is None:
                retained.append(record)
                continue
            if identifier in found_ids:
                raise ValueError(f"{mirror_name} has duplicate ID {identifier}.")
            found_ids.add(identifier)
            if target == category_id:
                retained.append(record)
                continue
            if category_id != EXPECTED_SOURCES[identifier]:
                raise ValueError(
                    f"{mirror_name} has {identifier} in unexpected category {category_id}."
                )
            moved_ids.add(identifier)
            if mirror_name == "api":
                record["category_id"] = target
            moved[target].append(record)
        category["duas"] = retained

    for identifier, target in MOVE_TARGETS.items():
        if identifier not in found_ids:
            raise ValueError(f"{mirror_name} is missing {identifier}.")

    for target, records in moved.items():
        category_map[target]["duas"].extend(records)

    categories[:] = [
        category for category in categories
        if category["id"] not in REMOVED_CATEGORIES
    ]
    categories.sort(key=lambda category: order_by_id[category["id"]])
    for category in categories:
        if category["id"] == "children-newborn":
            category["name"] = copy.deepcopy(metadata_by_category["children-newborn"]["name"])
        elif category["id"] in NEW_CATEGORIES:
            category["name"] = copy.deepcopy(metadata_by_category[category["id"]]["name"])
    return found_ids


def collect_mirror_records(categories, mirror_name):
    records = {}
    for category in categories:
        for record in category.get("duas", []):
            identifier = record["id"]
            if identifier in records:
                raise ValueError(f"{mirror_name} has duplicate ID {identifier}.")
            records[identifier] = copy.deepcopy(record)
    return records


def verify_mirror_records(before, categories, mirror_name, api_mirror=False):
    after = collect_mirror_records(categories, mirror_name)
    if set(before) != set(after):
        raise ValueError(f"{mirror_name} Dua IDs changed during reclassification.")
    for identifier, original in before.items():
        expected = copy.deepcopy(original)
        if api_mirror and identifier in MOVE_TARGETS:
            expected["category_id"] = MOVE_TARGETS[identifier]
        if after[identifier] != expected:
            raise ValueError(f"{mirror_name} content changed for {identifier}.")


def update_asset_map(changed_paths):
    manifest_path = "flutter_app/assets/json/ASSET_MAP.json"
    manifest = read_json(manifest_path)
    asset_root = os.path.join(ROOT, "flutter_app", "assets", "json")
    entries = {entry["asset_path"]: entry for entry in manifest["entries"]}

    for relative_path in changed_paths:
        full_path = os.path.join(ROOT, relative_path)
        asset_path = os.path.relpath(full_path, asset_root).replace(os.sep, "/")
        if not os.path.isfile(full_path):
            entries.pop(asset_path, None)
            continue
        with open(full_path, encoding="utf-8") as file:
            value = json.load(file)
        entry = entries.get(asset_path)
        if entry is None:
            entry = {
                "asset_path": asset_path,
                "repo_path": asset_path,
            }
            entries[asset_path] = entry
        entry["bytes"] = os.path.getsize(full_path)
        entry["top_level_keys"] = sorted(value.keys()) if isinstance(value, dict) else None

    manifest["entries"] = list(entries.values())
    manifest["entry_count"] = len(manifest["entries"])
    write_json(manifest_path, manifest)


def category_index_record(category_id, metadata, count):
    return {
        "id": category_id,
        "order": NEW_CATEGORIES[category_id]["canonical_order"],
        "item_count": count,
        "metadata_file": f"data/duas/categories/{category_id}/metadata.json",
        "data_file": f"data/duas/categories/{category_id}/duas.json",
    }


def remove_obsolete_files():
    removed_paths = []
    for base in (
        "data/duas/categories",
        "flutter_app/assets/json/data/duas/categories",
    ):
        for category_id in sorted(REMOVED_CATEGORIES):
            for filename in ("duas.json", "metadata.json"):
                relative_path = f"{base}/{category_id}/{filename}"
                full_path = os.path.join(ROOT, relative_path)
                if os.path.isfile(full_path):
                    os.remove(full_path)
                removed_paths.append(relative_path)
    return removed_paths


def main():
    canonical_index = read_json("data/duas/categories/index.json")
    data_by_category, metadata_by_category, original_records = collect_canonical(
        canonical_index
    )
    for category_id in REMOVED_CATEGORIES:
        if category_id not in data_by_category:
            raise ValueError(f"Expected source category {category_id} is missing.")

    for category_id, definition in NEW_CATEGORIES.items():
        for field in ("name", "description"):
            validate_localized_map(definition[field], f"{category_id}.{field}")
        if category_id not in data_by_category:
            metadata, data = create_category(
                category_id, definition, metadata_by_category
            )
            metadata_by_category[category_id] = metadata
            data_by_category[category_id] = data

    legacy_metadata_order = max(
        entry.get("order", 0)
        for entry in read_json("metadata/categories.json")["categories"]
        if entry["id"] not in REMOVED_CATEGORIES
        and entry["id"] not in NEW_CATEGORIES
    ) + 1
    hereafter_metadata = metadata_by_category["hereafter"]
    hereafter_metadata["order"] = legacy_metadata_order

    family_metadata = metadata_by_category["children-newborn"]
    family_metadata["name"]["en"] = "Family & Children"

    moved_count = move_canonical_records(data_by_category)
    if len(data_by_category) != len(canonical_index["categories"]) + len(NEW_CATEGORIES):
        raise ValueError("Unexpected category count after creating the new categories.")

    after_records = {}
    changed_category_ids = set(MOVE_GROUPS) | {"Others", "children-newborn"}
    for category_id, data in data_by_category.items():
        data["count"] = len(data["duas"])
        for record in data["duas"]:
            identifier = record["id"]
            if identifier in after_records:
                raise ValueError(f"Duplicate Dua ID after moving records: {identifier}")
            after_records[identifier] = record
            expected = copy.deepcopy(original_records[identifier])
            if identifier in MOVE_TARGETS:
                expected["category_id"] = MOVE_TARGETS[identifier]
            if record != expected:
                raise ValueError(f"Non-category content changed for {identifier}.")

        if category_id in metadata_by_category:
            metadata_by_category[category_id]["item_count"] = data["count"]
    if set(after_records) != set(original_records):
        raise ValueError("The record ID set changed during reclassification.")

    for category_id in REMOVED_CATEGORIES:
        if data_by_category[category_id]["duas"]:
            raise ValueError(f"Cannot remove non-empty category {category_id}.")
        del data_by_category[category_id]
        del metadata_by_category[category_id]

    canonical_entries = {
        entry["id"]: entry for entry in canonical_index["categories"]
        if entry["id"] not in REMOVED_CATEGORIES
    }
    for category_id in NEW_CATEGORIES:
        canonical_entries[category_id] = category_index_record(
            category_id, metadata_by_category[category_id],
            data_by_category[category_id]["count"],
        )
    for category_id, entry in canonical_entries.items():
        entry["item_count"] = data_by_category[category_id]["count"]
    canonical_index["categories"] = sorted(
        canonical_entries.values(), key=lambda entry: entry["order"]
    )
    canonical_index["total_categories"] = len(canonical_index["categories"])
    canonical_index["total_records"] = len(after_records)

    global_index = read_json("metadata/categories.json")
    global_entries = {}
    for entry in global_index["categories"]:
        if entry.get("collection_id") == "duas" and entry["id"] in REMOVED_CATEGORIES:
            continue
        if (
            entry.get("collection_id") == "duas"
            and entry["id"] in metadata_by_category
            and entry["id"] in changed_category_ids
        ):
            metadata = metadata_by_category[entry["id"]]
            entry["item_count"] = metadata["item_count"]
            if entry["id"] == "children-newborn":
                entry["name"] = copy.deepcopy(metadata["name"])
            entry["metadata_file"] = (
                f"data/duas/categories/{entry['id']}/metadata.json"
            )
            entry["data_file"] = f"data/duas/categories/{entry['id']}/duas.json"
        global_entries[entry["id"]] = entry

    for category_id in NEW_CATEGORIES:
        metadata = metadata_by_category[category_id]
        global_entries[category_id] = {
            "id": category_id,
            "collection_id": "duas",
            "name": copy.deepcopy(metadata["name"]),
            "parent_id": None,
            "order": metadata["order"],
            "item_count": metadata["item_count"],
            "metadata_file": f"data/duas/categories/{category_id}/metadata.json",
            "data_file": f"data/duas/categories/{category_id}/duas.json",
        }
    global_index["categories"] = sorted(
        global_entries.values(), key=lambda entry: entry.get("order", 0)
    )
    global_index["total_categories"] = len(global_index["categories"])

    order_by_id = {
        entry["id"]: entry["order"] for entry in canonical_index["categories"]
    }
    runtime = read_json("src/data/allData.json")
    original_runtime_records = collect_mirror_records(
        runtime["categories"], "React runtime"
    )
    runtime_moved = move_mirror_records(
        runtime["categories"], "runtime", metadata_by_category, order_by_id
    )
    verify_mirror_records(
        original_runtime_records, runtime["categories"], "React runtime"
    )
    runtime["metadata"]["total_categories"] = len(runtime["categories"])
    runtime["metadata"]["total_duas"] = len(after_records)
    runtime_others = next(
        category for category in runtime["categories"] if category["id"] == "Others"
    )
    for legacy_others in runtime.get("Others", []):
        if legacy_others.get("id") == "Others":
            legacy_others["name"] = copy.deepcopy(runtime_others["name"])
            legacy_others["duas"] = copy.deepcopy(runtime_others["duas"])

    api = read_json("public/api/v1/duas.json")
    original_api_records = collect_mirror_records(
        api["categories"], "Public API"
    )
    api_moved = move_mirror_records(
        api["categories"], "api", metadata_by_category, order_by_id
    )
    verify_mirror_records(
        original_api_records, api["categories"], "Public API", api_mirror=True
    )
    api["total_categories"] = len(api["categories"])
    api["total_duas"] = sum(len(category["duas"]) for category in api["categories"])

    if runtime_moved != set(MOVE_TARGETS) or api_moved != set(MOVE_TARGETS):
        raise ValueError("Runtime and API mirrors do not contain the expected moved IDs.")
    if api["total_duas"] != len(after_records):
        raise ValueError("Public API total_duas does not match the canonical collection.")

    api_index = read_json("public/api/v1/index.json")
    api_index_entries = {entry["id"]: entry for entry in api_index["categories"]}
    for category_id in REMOVED_CATEGORIES:
        api_index_entries.pop(category_id, None)
    for category_id in canonical_entries:
        metadata = metadata_by_category.get(category_id)
        api_category = api_index_entries.get(category_id)
        if api_category is None:
            api_category = {"id": category_id}
            api_index_entries[category_id] = api_category
        if metadata is not None:
            api_category["duas_count"] = metadata["item_count"]
            if category_id == "children-newborn" or category_id in NEW_CATEGORIES:
                api_category["name"] = copy.deepcopy(metadata["name"])
    api_index["categories"] = sorted(
        api_index_entries.values(), key=lambda entry: order_by_id[entry["id"]]
    )
    api_index["total_categories"] = len(api_index["categories"])
    api_index["total_duas"] = api["total_duas"]

    mapping_path = "docs/id-mapping.json"
    id_mapping = read_json(mapping_path)
    for mapping in id_mapping["mappings"]:
        target = MOVE_TARGETS.get(mapping["new_id"])
        if target is not None:
            mapping["new_category_id"] = target

    for category_id in changed_category_ids:
        data_by_category[category_id]["count"] = len(data_by_category[category_id]["duas"])
        metadata_by_category[category_id]["item_count"] = data_by_category[category_id]["count"]
        write_json(
            f"data/duas/categories/{category_id}/duas.json",
            data_by_category[category_id],
        )
        write_json(
            f"data/duas/categories/{category_id}/metadata.json",
            metadata_by_category[category_id],
        )
    write_json("data/duas/categories/index.json", canonical_index)
    write_json("metadata/categories.json", global_index)
    write_json("src/data/allData.json", runtime)
    write_json("public/api/v1/duas.json", api)
    write_json("public/api/v1/index.json", api_index)
    write_json(mapping_path, id_mapping)

    changed_asset_paths = []
    for category_id in changed_category_ids:
        for filename in ("duas.json", "metadata.json"):
            source_path = f"data/duas/categories/{category_id}/{filename}"
            asset_path = f"flutter_app/assets/json/{source_path}"
            write_json(asset_path, read_json(source_path))
            changed_asset_paths.append(asset_path)
    for relative_path in (
        "data/duas/categories/index.json",
        "metadata/categories.json",
    ):
        asset_path = f"flutter_app/assets/json/{relative_path}"
        write_json(asset_path, read_json(relative_path))
        changed_asset_paths.append(asset_path)

    changed_asset_paths.extend(remove_obsolete_files())
    update_asset_map(changed_asset_paths)

    for category_id in NEW_CATEGORIES:
        validate_localized_map(
            metadata_by_category[category_id]["name"],
            f"{category_id}.metadata.name",
        )
    print(
        f"Reclassified {moved_count} records; "
        f"{len(data_by_category['children-newborn']['duas'])} Family & Children, "
        f"{len(data_by_category['prayer-duas']['duas'])} Prayer Duas, "
        f"{len(data_by_category['hereafter']['duas'])} Hereafter."
    )
    print(f"Preserved all {len(after_records)} Dua IDs and non-category record fields.")


if __name__ == "__main__":
    main()
