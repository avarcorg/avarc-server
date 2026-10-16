#!/usr/bin/env python3
"""Checks the translation files of the frontend (avarc-server-frontend/messages).

Every language file must have the same keys, no empty text, and the same
{placeholders} in each text as the others. See spec/SPEC-frontend.md.
"""
import json
import re
import sys
from pathlib import Path

DIR = Path(__file__).resolve().parent.parent / "avarc-server-frontend" / "messages"


def flatten(node, prefix=""):
    for key, value in node.items():
        if isinstance(value, dict):
            yield from flatten(value, f"{prefix}{key}.")
        else:
            yield f"{prefix}{key}", value


def main():
    files = sorted(DIR.glob("*.json"))
    if len(files) < 2:
        print(f"{DIR}: expected at least two language files", file=sys.stderr)
        return 1
    texts = {f.stem: dict(flatten(json.loads(f.read_text(encoding="utf-8")))) for f in files}
    errors = []
    keys = set().union(*(set(t) for t in texts.values()))
    for language, flat in texts.items():
        for key in sorted(keys - set(flat)):
            errors.append(f"{language}: missing {key}")
        for key, text in flat.items():
            if not isinstance(text, str) or not text.strip():
                errors.append(f"{language}: empty text {key}")
    reference = files[0].stem
    for key in sorted(keys):
        want = set(re.findall(r"\{(\w+)\s*[,}]", str(texts[reference].get(key, ""))))
        for language, flat in texts.items():
            if key in flat and set(re.findall(r"\{(\w+)\s*[,}]", str(flat[key]))) != want:
                errors.append(f"{language}: placeholders of {key} differ from {reference}")
    for error in errors:
        print(error, file=sys.stderr)
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
