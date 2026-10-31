#!/usr/bin/env python3
"""Create reviewable machine translations for the supplied Hajj source text."""

import concurrent.futures
import json
import os
import time
import urllib.parse
import urllib.request

SOURCE = "data/duas/categories/hajj-umrah/source-items.json"
OUTPUT = "data/duas/categories/hajj-umrah/localized-items.json"
LANGUAGES = ["ta", "ml", "ar", "ur", "fr", "tr", "id", "bn", "ms"]


def load_json(path):
    with open(path, encoding="utf-8") as file:
        return json.load(file)


def translate_phrase(language, phrase):
    query = urllib.parse.urlencode({
        "client": "dict-chrome-ex",
        "sl": "en",
        "tl": language,
        "dt": "t",
        "q": phrase,
    })
    url = f"https://translate.googleapis.com/translate_a/single?{query}"
    last_error = None
    for attempt in range(5):
        try:
            request = urllib.request.Request(
                url, headers={"User-Agent": "Mozilla/5.0"}
            )
            with urllib.request.urlopen(request, timeout=60) as response:
                payload = json.loads(response.read().decode("utf-8"))
            translated = "".join(
                segment[0] for segment in payload[0]
                if segment and isinstance(segment[0], str)
            )
            if not translated.strip():
                raise ValueError("translation response was empty")
            return language, phrase, translated.strip()
        except Exception as error:
            last_error = error
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"Unable to translate text to {language}: {last_error}")


def main():
    source = load_json(SOURCE)
    phrases = []
    for item in source["items"]:
        phrases.extend((item["title"], item["english"], item["classification"]))
        if item.get("notes_en"):
            phrases.append(item["notes_en"])
    for section in source["sections"]:
        phrases.append(section["title"])
        if section.get("introduction"):
            phrases.append(section["introduction"])
    phrases = list(dict.fromkeys(phrases))
    translations = {language: {} for language in LANGUAGES}
    if os.path.exists(OUTPUT):
        with open(OUTPUT, encoding="utf-8") as file:
            previous = json.load(file)
        previous_items = {item["number"]: item for item in previous.get("items", [])}
        source_items = {item["number"]: item for item in source["items"]}
        for number, old_item in previous_items.items():
            source_item = source_items.get(number)
            if not source_item:
                continue
            for field, source_field in (
                ("title", "title"),
                ("translation", "english"),
                ("notes", "notes_en"),
                ("classification", "classification"),
            ):
                phrase = source_item.get(source_field, "")
                for language, value in old_item.get(field, {}).items():
                    if language in translations and value:
                        translations[language][phrase] = value
        previous_sections = {
            section["letter"]: section
            for section in previous.get("sections", [])
        }
        source_sections = {
            section["letter"]: section
            for section in source["sections"]
        }
        for letter, old_section in previous_sections.items():
            source_section = source_sections.get(letter)
            if not source_section:
                continue
            for field, source_field in (
                ("title", "title"),
                ("introduction", "introduction"),
            ):
                phrase = source_section.get(source_field, "")
                for language, value in old_section.get(field, {}).items():
                    if language in translations and value:
                        translations[language][phrase] = value

    jobs = [
        (language, phrase)
        for language in LANGUAGES
        for phrase in phrases
        if phrase not in translations[language]
    ]
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as executor:
        for language, phrase, result in executor.map(
            lambda job: translate_phrase(*job), jobs
        ):
            translations[language][phrase] = result

    localized_items = []
    for item in source["items"]:
        title = {"en": item["title"]}
        meaning = {"en": item["english"]}
        classification = {"en": item["classification"]}
        for language in LANGUAGES:
            title[language] = translations[language][item["title"]]
            meaning[language] = translations[language][item["english"]]
            classification[language] = translations[language][item["classification"]]
        localized_item = {
            "number": item["number"],
            "section": item["section"],
            "title": title,
            "translation": meaning,
            "classification": classification,
        }
        if item.get("notes_en"):
            notes = {"en": item["notes_en"]}
            for language in LANGUAGES:
                notes[language] = translations[language][item["notes_en"]]
            localized_item["notes"] = notes
        localized_items.append(localized_item)

    localized_sections = []
    for section in source["sections"]:
        title = {"en": section["title"]}
        for language in LANGUAGES:
            title[language] = translations[language][section["title"]]
        localized_section = {
            "letter": section["letter"],
            "title": title,
        }
        if section.get("introduction"):
            introduction = {"en": section["introduction"]}
            for language in LANGUAGES:
                introduction[language] = translations[language][section["introduction"]]
            localized_section["introduction"] = introduction
        localized_sections.append(localized_section)

    output = {
        "schema_version": "1.0.0",
        "category_id": "hajj-umrah",
        "translation_status": "Machine-generated; human review required.",
        "sections": localized_sections,
        "items": localized_items,
    }
    with open(OUTPUT, "w", encoding="utf-8", newline="\n") as file:
        json.dump(output, file, ensure_ascii=False, indent=2)
        file.write("\n")
    print(
        f"Generated translations for {len(localized_items)} items and "
        f"{len(localized_sections)} sections in {len(LANGUAGES)} target languages."
    )


if __name__ == "__main__":
    main()
