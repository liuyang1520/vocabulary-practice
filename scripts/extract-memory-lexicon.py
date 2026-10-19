#!/usr/bin/env python3
"""Extract dictionary-backed word classes and character cues for bundled words.

Uses local pinned jmdict-simplified files. It never guesses a word's reading,
translates a Chinese lookalike, or changes the source vocabulary.
"""

import argparse
import json
from pathlib import Path
import re
import unicodedata

ROOT = Path(__file__).resolve().parents[1]


def gloss_key(text):
    text = unicodedata.normalize("NFKC", text).lower()
    text = re.sub(r"\([^)]*\)", "", text)
    text = re.sub(r"^(?:a|an|the|to)\s+", "", text.strip())
    return re.sub(r"\s+", " ", text).strip()


def glosses(text):
    # Split only separators outside explanatory parentheses.
    result, start, depth = [], 0, 0
    for index, char in enumerate(text):
        if char == "(":
            depth += 1
        elif char == ")":
            depth = max(0, depth - 1)
        elif char in ",;" and depth == 0:
            result.append(text[start:index])
            start = index + 1
    return {gloss_key(value) for value in result + [text[start:]] if gloss_key(value)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dictionary", type=Path, required=True)
    parser.add_argument("--kanjidic", type=Path, required=True)
    args = parser.parse_args()
    words = []
    for name in ["japanese.json", "japanese-extended.json"]:
        words.extend(json.loads((ROOT / "src/data" / name).read_text()))
    dictionary = json.loads(args.dictionary.read_text())
    by_id = {entry["id"]: entry for entry in dictionary["words"]}
    by_form = {}
    wanted = {word["japanese"] for word in words}
    for entry in dictionary["words"]:
        for form in entry["kanji"] + entry["kana"]:
            if form["text"] in wanted:
                by_form.setdefault(form["text"], []).append(entry)
    lexical = {}
    for word in words:
        candidates = (
            [by_id[word["dictionaryId"]]]
            if word.get("dictionaryId") in by_id
            else by_form.get(word["japanese"], [])
        )
        meanings = glosses(word["meaning"])
        matches = []
        for entry in candidates:
            reading = word.get("reading")
            legal_readings = [
                kana["text"] for kana in entry["kana"]
                if "*" in kana["appliesToKanji"] or word["japanese"] in kana["appliesToKanji"]
            ]
            if reading and reading not in legal_readings:
                continue
            for sense in entry["sense"]:
                if "*" not in sense["appliesToKanji"] and word["japanese"] not in sense["appliesToKanji"]:
                    continue
                if "*" not in sense["appliesToKana"] and reading not in sense["appliesToKana"]:
                    continue
                score = len(meanings & {gloss_key(g["text"]) for g in sense["gloss"] if g["lang"] == "eng"})
                if score:
                    matches.append((score, entry, sense))
        if not matches:
            continue
        best_score = max(match[0] for match in matches)
        best = [match for match in matches if match[0] == best_score]
        if len({entry["id"] for _, entry, _ in best}) != 1:
            continue
        _, entry, sense = best[0]
        lexical[word["id"]] = {
            "reading": word.get("reading", ""),
            "meaning": word["meaning"],
            "partOfSpeech": sense["partOfSpeech"],
            "dictionaryId": entry["id"],
        }
    used_kanji = set("".join(word["japanese"] for word in words))
    kanjidic = json.loads(args.kanjidic.read_text())
    kanji = {}
    for character in kanjidic["characters"]:
        if character["literal"] not in used_kanji or not character.get("readingMeaning"):
            continue
        meanings = [
            meaning["value"]
            for group in character["readingMeaning"]["groups"]
            for meaning in group["meanings"] if meaning["lang"] == "en"
        ]
        if meanings:
            kanji[character["literal"]] = meanings[:2]
    output = {"words": lexical, "kanji": kanji}
    (ROOT / "src/data/memory-lexicon.json").write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({"wordClasses": len(lexical), "characterCues": len(kanji)}))


if __name__ == "__main__":
    main()
