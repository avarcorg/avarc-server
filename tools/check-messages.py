#!/usr/bin/env python3
"""Checks the translation files of the frontend (avarc-server-frontend/messages).

en.json is the source. Every other language file may lack keys that are not
translated yet (the page shows the English text), but must not have a key
that the source lacks, an empty text, or other {placeholders} than the source.
With --complete a missing key is an error as well.

The code is scanned as well: every key that a component asks for through
useTranslations/getTranslations must be in en.json, and every key of en.json
must be asked for somewhere. A key built at run time (a template string) is
only accepted for the prefixes in DYNAMIC. See spec/SPEC-frontend.md.
"""
import json
import re
import sys
from pathlib import Path

FRONTEND = Path(__file__).resolve().parent.parent / "avarc-server-frontend"
DIR = FRONTEND / "messages"
SRC = FRONTEND / "src"

# Keys that the code builds at run time: namespace -> prefixes. Every key
# under such a prefix counts as used, and the prefix must exist.
DYNAMIC = {"Form": ["error."], "Applications": ["description."]}

BINDING = re.compile(
    r"\b(?:const|let)\s+(\w+)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\(\s*"
    r"(?:\"([\w.]+)\"|\{[^}]*\bnamespace:\s*\"([\w.]+)\"[^}]*\})\s*\)"
)
INLINE = re.compile(r"getTranslations\(\"([\w.]+)\"\)\)\(\s*\"([\w.]+)\"")


def flatten(node, prefix=""):
    for key, value in node.items():
        if isinstance(value, dict):
            yield from flatten(value, f"{prefix}{key}.")
        else:
            yield f"{prefix}{key}", value


SOURCE = "en"


def scan_code(source):
    """Returns the errors from comparing the keys used in src/ with en.json."""
    errors = []
    used = set()
    for path in sorted(SRC.rglob("*.ts*")):
        code = path.read_text(encoding="utf-8")
        name = path.relative_to(FRONTEND)
        bound = {}
        for match in BINDING.finditer(code):
            variable, namespace = match.group(1), match.group(2) or match.group(3)
            bound.setdefault(variable, set()).add(namespace)
        for namespace, key in INLINE.findall(code):
            used.add(f"{namespace}.{key}")
            if f"{namespace}.{key}" not in source:
                errors.append(f"{name}: {namespace}.{key} is not in the source")
        for variable, namespaces in bound.items():
            call = re.compile(r"(?<![\w.])" + variable + r"(?:\.(?:rich|raw|markup|has))?\(\s*(\"([\w.]+)\"|[^\s)\"])")
            for match in call.finditer(code):
                if match.group(2):
                    keys = {f"{ns}.{match.group(2)}" for ns in namespaces}
                    found = keys & set(source)
                    used |= found or keys
                    if not found:
                        errors.append(f"{name}: {' or '.join(sorted(keys))} is not in the source")
                else:
                    # A key that is built at run time: accepted for known prefixes only.
                    allowed = [f"{ns}.{prefix}" for ns in namespaces for prefix in DYNAMIC.get(ns, [])]
                    template = re.match(r"`([\w.]*)\$\{", code[match.start(1):])
                    if not template or not any(
                        f"{ns}.{template.group(1)}" in allowed for ns in namespaces
                    ):
                        line = code.count("\n", 0, match.start()) + 1
                        errors.append(f"{name}:{line}: a key built at run time, add its prefix to DYNAMIC")
    for namespace, prefixes in DYNAMIC.items():
        for prefix in prefixes:
            under = {k for k in source if k.startswith(f"{namespace}.{prefix}")}
            if not under:
                errors.append(f"DYNAMIC {namespace}.{prefix} matches no key of the source")
            used |= under
    for key in sorted(set(source) - used):
        errors.append(f"en: {key} is not used in src/")
    return errors


def main():
    complete = "--complete" in sys.argv[1:]
    files = sorted(DIR.glob("*.json"))
    texts = {f.stem: dict(flatten(json.loads(f.read_text(encoding="utf-8")))) for f in files}
    if SOURCE not in texts or len(texts) < 2:
        print(f"{DIR}: expected {SOURCE}.json and at least one other language file", file=sys.stderr)
        return 1
    source = texts[SOURCE]
    errors = scan_code(source)
    for language, flat in texts.items():
        for key, text in flat.items():
            if not isinstance(text, str) or not text.strip():
                errors.append(f"{language}: empty text {key}")
        if language == SOURCE:
            continue
        for key in sorted(set(flat) - set(source)):
            errors.append(f"{language}: {key} is not in the source")
        if complete:
            for key in sorted(set(source) - set(flat)):
                errors.append(f"{language}: missing {key}")
        for key in sorted(set(flat) & set(source)):
            if placeholders(flat[key]) != placeholders(source[key]):
                errors.append(f"{language}: placeholders of {key} differ from the source")
    for error in errors:
        print(error, file=sys.stderr)
    return 1 if errors else 0


def placeholders(text):
    return set(re.findall(r"\{(\w+)\s*[,}]", str(text)))


if __name__ == "__main__":
    sys.exit(main())
