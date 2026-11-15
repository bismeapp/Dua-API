#!/usr/bin/env python3
"""Build the bundled JSON dataset for the Flutter app.

Copies the canonical data and metadata trees into flutter_app/assets/json and
writes an asset map for consumers that need to resolve paths dynamically.

Usage: python3 scripts/build_flutter_assets.py
"""

import json
import os
import shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "data")
META = os.path.join(ROOT, "metadata")
DST = os.path.join(ROOT, "flutter_app", "assets", "json")


def main():
    if os.path.isdir(DST):
        shutil.rmtree(DST)
    shutil.copytree(SRC, os.path.join(DST, "data"))
    shutil.copytree(META, os.path.join(DST, "metadata"))

    entries = []
    for base in ("data", "metadata"):
        bdir = os.path.join(DST, base)
        for dirpath, _, filenames in os.walk(bdir):
            for fn in sorted(filenames):
                full = os.path.join(dirpath, fn)
                rel = os.path.relpath(full, DST).replace(os.sep, "/")
                data = None
                if fn.lower().endswith(".json"):
                    with open(full, encoding="utf-8") as f:
                        try:
                            data = json.load(f)
                        except json.JSONDecodeError as error:
                            raise ValueError(f"Invalid JSON asset {rel}: {error}") from error
                size = os.path.getsize(full)
                entries.append({"asset_path": rel,
                                "repo_path": rel.replace("data/", "data/", 1) if base == "data" else rel,
                                "bytes": size,
                                "top_level_keys": sorted(data.keys()) if isinstance(data, dict) else None})
    manifest = {
        "schema_version": "3.0.0",
        "description": "Flutter asset map. Declare each asset directory in flutter_app/pubspec.yaml; "
                       "resolve paths relative to assets/json.",
        "asset_root": "assets/json",
        "entry_count": len(entries),
        "entries": entries,
    }
    out = os.path.join(DST, "ASSET_MAP.json")
    with open(out, "w", encoding="utf-8", newline="\n") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"Wrote {len(entries)} asset entries under flutter_app/assets/json/")


if __name__ == "__main__":
    main()
