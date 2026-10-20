#!/usr/bin/env python3
"""Removes the empty texts from the target language files of the frontend.

    tools/drop-empty-texts.py [--check]

Untranslated strings must be left out of a target file (the page then shows the
English text, see spec/SPEC-frontend.md), but the translation service may send
them as empty texts. The download workflow runs this on the downloaded files
before tools/check-messages.py, which rejects an empty text. en.json, the
source, is never changed. Keys that become empty objects are dropped too. With
--check nothing is written; the exit status is 1 when a file would change.
"""
import json
import sys
from pathlib import Path

DIR = Path(__file__).resolve().parent.parent / "avarc-server-frontend" / "messages"


def prune(node):
    """Returns the node without its empty texts, or None when nothing is left."""
    if isinstance(node, dict):
        kept = {}
        for key, value in node.items():
            value = prune(value)
            if value is not None:
                kept[key] = value
        return kept or None
    return node if node != "" else None


def main():
    check = "--check" in sys.argv[1:]
    changed = False
    for path in sorted(DIR.glob("*.json")):
        if path.name == "en.json":
            continue
        original = json.loads(path.read_text(encoding="utf-8"))
        pruned = prune(original) or {}
        if pruned != original:
            changed = True
            print(f"{path.name}: empty texts {'found' if check else 'removed'}")
            if not check:
                path.write_text(json.dumps(pruned, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    sys.exit(1 if check and changed else 0)


if __name__ == "__main__":
    main()
