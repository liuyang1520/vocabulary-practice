#!/usr/bin/env python3
"""Update the static word list from pinned course and dictionary snapshots.

Python's standard library is sufficient. Existing IDs, definitions, and study
groups are retained. Unit-topic lists are independently curated companion lists;
the legacy course snapshot does not establish current section/unit placement.
"""

import argparse
import io
import json
from pathlib import Path
import re
import tarfile
import unicodedata
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
COURSE_COMMIT = "922959f5631b0475cb408c042fa2db0683706c1b"
COURSE_URL = f"https://raw.githubusercontent.com/liuch/duolingo_courses_overview/{COURSE_COMMIT}/markdown/tree_ja_en_ver4.md"
DICTIONARY_RELEASE = "3.6.2+20260928191014"
DICTIONARY_URL = "https://github.com/scriptin/jmdict-simplified/releases/download/3.6.2%2B20260928191014/jmdict-eng-3.6.2%2B20260928191014.json.tgz"
TOPIC_SENSES = {
    "ほうき": "1566500",  # broom, not abandonment or legislation
    "分別": "1504200",  # bunbetsu: sorting recyclable waste
    "床": "1349380",  # yuka: floor
    "柄": "1508300",  # gara: pattern
    "辛い": "1365850",  # karai: spicy, not tsurai
    "通り": "1432920",  # toori: street
    "音": "1576900",  # oto: sound
}
TOPIC_GLOSSES = {
    # Clarify the dictionary sense used in each companion topic.
    "応募": ("application; contest entry", "おうぼ"),
    "設定": ("settings; setup", "せってい"),
    "保存": ("save; preservation", "ほぞん"),
    "禁煙": ("non-smoking; quitting smoking", "きんえん"),
    "期限": ("deadline; time limit", "きげん"),
    "監督": ("director; supervisor", "かんとく"),
    "用紙": ("paper; blank form", "ようし"),
    "結構": ("fine; no thank you", "けっこう"),
    "遠慮": ("restraint; hesitation", "えんりょ"),
    "出店": ("stall; booth", "でみせ"),
    "敷物": ("mat; rug", "しきもの"),
    "会場": ("venue; meeting place", "かいじょう"),
    "発熱": ("fever; generation of heat", "はつねつ"),
    "熱": ("heat; fever", "ねつ"),
    "会計": ("bill; payment", "かいけい"),
    "急行": ("express train; express", "きゅうこう"),
    "動く": ("to move; to function", "うごく"),
    "守る": ("to protect; to follow (rules)", "まもる"),
    "減らす": ("to reduce; to decrease", "へらす"),
}


def download(url):
    with urllib.request.urlopen(url, timeout=60) as response:
        return response.read()


def first_definition(entry, form):
    """Respect spelling/reading restrictions; avoid obsolete dictionary senses."""
    written_in_kana = not re.search(r"[\u3400-\u9fff]", form)
    for sense in entry["sense"]:
        restrictions = sense["appliesToKana"] if written_in_kana else sense["appliesToKanji"]
        if "*" not in restrictions and form not in restrictions:
            continue
        if any(tag in sense["misc"] for tag in ["arch", "obs", "rare"]):
            continue
        glosses = [g["text"] for g in sense["gloss"] if g["lang"] == "eng" and len(g["text"]) <= 100]
        if not glosses:
            continue
        readings = [k["text"] for k in entry["kana"] if "*" in k["appliesToKanji"] or form in k["appliesToKanji"]]
        if not readings:
            continue
        return {
            "meaning": "; ".join(glosses[:2]),
            "reading": form if written_in_kana else readings[0],
            "dictionaryId": entry["id"],
        }
    return None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dictionary", type=Path, help="Use an already downloaded pinned dictionary JSON")
    parser.add_argument("--course", type=Path, help="Use an already downloaded pinned course markdown")
    args = parser.parse_args()
    course = args.course.read_text() if args.course else download(COURSE_URL).decode()
    if args.dictionary:
        dictionary = json.loads(args.dictionary.read_text())
    else:
        with tarfile.open(fileobj=io.BytesIO(download(DICTIONARY_URL)), mode="r:gz") as archive:
            member = next(m for m in archive.getmembers() if m.name.endswith(".json"))
            dictionary = json.load(archive.extractfile(member))

    terms = {}
    skill = ""
    for line in course.splitlines():
        heading = re.match(r"## \[([^]]+)\]", line)
        if heading:
            skill = heading[1]
        lesson = re.match(r"    \d+\. (.*)", line)
        if lesson:
            for term in lesson[1].split(", "):
                # The snapshot mixes words with individual kana/kanji teaching
                # fragments. Only dictionary-attested words of 2+ chars are added.
                if len(term) > 1:
                    terms.setdefault(term, skill)

    topics = json.loads((ROOT / "src/data/section4-topics.json").read_text())
    topic_words = {term for topic in topics for term in topic["words"]}
    candidates = set(terms) | topic_words
    common_matches = {}
    all_matches = {}
    for entry in dictionary["words"]:
        for form in entry["kanji"] + entry["kana"]:
            term = form["text"]
            if term not in candidates:
                continue
            definition = first_definition(entry, term)
            if definition:
                all_matches.setdefault(term, {})[entry["id"]] = definition
                if form["common"]:
                    common_matches.setdefault(term, {})[entry["id"]] = definition

    path = ROOT / "src/data/japanese.json"
    existing = json.loads(path.read_text())
    extended_path = ROOT / "src/data/japanese-extended.json"
    if extended_path.exists():
        existing += json.loads(extended_path.read_text())
    words = {unicodedata.normalize("NFKC", w["japanese"]): w for w in existing}
    before = len(words)

    for term, skill in terms.items():
        key = unicodedata.normalize("NFKC", term)
        matches = common_matches.get(term, {})
        if len(matches) != 1:
            continue  # Do not guess which homophone/sense the course intended.
        definition = next(iter(matches.values()))
        if key in words:
            if not words[key].get("reading"):
                words[key]["reading"] = definition["reading"]
                words[key]["dictionaryId"] = definition["dictionaryId"]
            continue
        words[key] = {"id": f"duo:{key}", "japanese": term, **definition, "level": "3", "source": "legacy", "skill": skill}

    missing = []
    for term in sorted(topic_words):
        key = unicodedata.normalize("NFKC", term)
        matches = common_matches.get(term) or all_matches.get(term, {})
        if term in TOPIC_SENSES:
            matches = {TOPIC_SENSES[term]: all_matches[term][TOPIC_SENSES[term]]}
        if key in words:
            if not words[key].get("reading") and len(matches) == 1:
                definition = next(iter(matches.values()))
                words[key]["reading"] = definition["reading"]
                words[key]["dictionaryId"] = definition["dictionaryId"]
            continue
        if len(matches) != 1:
            missing.append((term, list(matches.values())))
            continue
        definition = next(iter(matches.values()))
        words[key] = {"id": f"duo:{key}", "japanese": term, **definition, "level": "4", "source": "companion"}

    if missing:
        for term, matches in missing:
            print("Needs a reviewed definition:", term, matches)
        raise SystemExit("The output was not changed. Resolve the companion definitions first.")

    for term, (meaning, reading) in TOPIC_GLOSSES.items():
        words[unicodedata.normalize("NFKC", term)].update(meaning=meaning, reading=reading)

    output = list(words.values())
    path.write_text(json.dumps([w for w in output if w["source"] != "legacy"], ensure_ascii=False, indent=2) + "\n")
    extended_path.write_text(json.dumps([w for w in output if w["source"] == "legacy"], ensure_ascii=False, indent=2) + "\n")
    print(f"Added {len(words) - before} words; {len(words)} unique terms, {len(topic_words)} Section 4 companion words across {len(topics)} units.")


if __name__ == "__main__":
    main()
