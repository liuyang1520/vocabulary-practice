#!/usr/bin/env python3
"""Prepare and resume local illustration assets generated with the built-in tool.

This script never calls a model or an external API. Generation happens through
Codex's image_gen tool; `import` optimizes its saved PNG into a local WebP.
"""

import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import unicodedata

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "public/illustrations/catalog.json"
INDEX = ROOT / "src/data/illustrations.json"
STYLE = (
    "Use case: scientific-educational. Asset type: individual Japanese vocabulary memory illustration. "
    "Create one square full-frame illustration. Style: cute tasteful colored-pencil and gouache "
    "illustration, soft cream paper background, warm muted colors with sage green and terracotta "
    "accents, subtle grain, soft shadows, simple clear silhouette, high clarity at small size. "
    "Composition: centered subject with generous quiet margins, no decorative clutter. "
    "No text, no letters, no numbers, no logos or watermark. "
)
SCENES = {
    "はん": "A simple round analog clock showing half past three: the long minute hand points straight down and the short hour hand sits halfway between three and four. Use only small hour tick marks, no printed numerals. A small orange arc highlights the lower half of the clock. This word is the HALF HOUR in clock time, not a quantity of thirty objects.",
    "ごろ": "A person gestures toward an analog clock with a soft translucent arc around one approximate hour position, suggesting around that time rather than a precise appointment. No numerals or lettering.",
    "それ": "Two people face each other a couple of steps apart. The speaking person points to a green mug held close to the listener's body. The mug is clearly near the listener, away from the speaker. Show the meaning THAT NEAR YOU, not something far from both people.",
    "そこ": "Two people stand a couple of steps apart. The speaker points to a small empty spot beside the listener's feet. A simple soft circle on the floor highlights that location near the listener. Show THERE NEAR YOU, not a faraway landscape.",
    "それら": "Two people face each other. The speaker points to three books placed right beside the listener. The books are clearly together near the listener, away from the speaker. Show THOSE NEAR YOU with several objects, not a faraway group.",
    "その": "A speaker points to a red book held by the listener, with the book close to the listener's chest. Show THAT BOOK NEAR YOU: a clearly identifiable noun near the listener. Both people are visible.",
    "これ": "A person points to one green mug right beside their own hand, close to their own body. Show THIS ONE NEAR ME, with the mug as the obvious referent.",
    "この": "A person holds one book near their own chest and points to it. Show THIS BOOK NEAR ME: one clearly identifiable noun close to the speaker.",
    "ここ": "A person points down to the ground right beside their own feet. A soft circle highlights that near location. Show HERE WHERE I AM.",
    "じゃないです": "A child holds a real orange. A separate thought bubble shows an apple with a simple diagonal cross over it. Contrast the actual orange with the crossed-out imagined apple to convey IT IS NOT AN APPLE, a negative identity statement. No writing or letters.",
    "の": "A child touches their own chest with one hand and holds their own school bag with the other. Make the ownership relationship clear: MY BAG. The child and bag are the main subjects, no unrelated animals.",
    "は": "A student gently points to their own chest while holding school books, introducing themselves as the topic of the conversation to a friend. Show AS FOR ME, I AM A STUDENT through a simple introduction scene.",
}
PERSON_NAMES = {
    "Ken", "Naomi", "Nakayama", "Tanaka", "Yamaguchi", "John", "Mary", "Maria",
    "Tom", "Bob", "Anna", "Hana", "Mark", "Lisa", "Hiro", "Yuki", "Hiroshi",
    "Kenta", "Akira", "Sakura", "Michael", "Takashi", "Aiko", "Dave", "Mike",
    "Peter", "Paul", "Kate", "Sarah", "Alex", "Emi", "Rin", "Emiko", "Satoshi",
    "Ichiro", "Jiro", "Taro", "Hanako", "James", "Julia", "Emma",
    "Daniel", "Andrew", "Yamada", "Smith", "Sam", "Erica", "Erika",
}

SCENES["半"] = SCENES["はん"]
SCENES["あの"] = "Two people stand together in the foreground. The speaker points to a tree well away from both people. Show THAT TREE OVER THERE, far from both speaker and listener."
SCENES["あれ"] = "Two people stand together and one points to a red bicycle far away from both of them. Show THAT ONE OVER THERE, far from speaker and listener."
SCENES["あそこ"] = "Two people stand together and point to a small park far away. A soft circle highlights the distant park. Show OVER THERE, far from both speaker and listener."
SCENES.update({
    "があります": "One book rests on an otherwise quiet desk, with a soft glow drawing attention to the book's presence. Show THERE IS A BOOK, existence of an INANIMATE OBJECT. No people or animals; this is arimasu, not imasu.",
    "いっかい": "A simple two-storey building shown from the front. Highlight only the GROUND FLOOR, the lower level, with warm orange light and a clear outline. The upper storey is pale and unhighlighted. Show FIRST FLOOR in the Japanese ground-floor sense; no numerals or lettering.",
    "シャワーをあびます": "An unoccupied tiled shower stall with a showerhead releasing a clear spray of running water. Include a soap dish and folded towel. Show an active SHOWER using only bathroom fixtures, water, and towels. No people or body parts.",
    "シャワー": "A simple showerhead above an empty tiled shower stall, with a small spray of water, a soap dish, and a folded towel. Only bathroom fixtures and objects, no people or body parts.",
    "おふろ": "A cozy Japanese bathroom with a deep bathtub of warm steaming water, a wooden bath bucket and neatly folded towels. The bathroom is unoccupied; only the tub, water, and bathing objects are visible.",
    "ロック": "A small ROCK MUSIC BAND performs: an electric guitarist, a bass player, and a drummer playing energetically together. This word means ROCK MUSIC, not a stone, boulder, or padlock. No band names or text.",
    "を": "A person reads a book, with the book clearly emphasized as the OBJECT OF THE READING ACTION. This illustrates the Japanese object particle in hon o yomimasu. Show the person, their gaze, and the book together; not a path through an archway.",
    "ふたり": "Exactly TWO HUMAN PEOPLE sit together on a park bench. No other people, animals, or counted objects. This is the Japanese counter for two PEOPLE.",
    "ひとり": "Exactly ONE HUMAN PERSON sits alone on a park bench, with empty space beside them. No other people or animals. This word counts one PERSON.",
    "にはいります": "A fully dressed adult wearing a sweater and trousers opens a bathroom door toward a steaming Japanese bathtub. The adult stands in the doorway, outside the tub. Show going into the bathing room for ofuro ni hairimasu, with ordinary clothing covering the entire body.",
    "とりましょう": "Two friends decide to take a photograph. One raises a camera toward the other friend posing by a scenic tree. Show LET'S TAKE A PHOTO, not taking someone else's possessions.",
    "かかります": "A traveler walks along a short winding path toward a station, with a small analog clock beside the path. Show a journey TAKING TIME, the duration needed to get somewhere.",
    "ぐらい": "A person looks at a simple analog clock with a softly shaded arc around one hour position. The arc suggests an APPROXIMATE AMOUNT OF TIME, about that long, rather than an exact time.",
    "どの": "A shopper faces three different bags on a shelf and gestures between them while asking a shop assistant WHICH BAG. Show a choice among specific objects, not all of them at once.",
    "うち": "A person arrives at their own cozy house, holding a key and smiling in recognition. Show MY HOME, not an unrelated group of people.",
    "います": "A cat is clearly present sitting on a sofa, while a person points to the cat to tell a friend it is there. Show the EXISTENCE OF A LIVING BEING in a place.",
    "はいますか": "Two friends look at one friend's family photograph; the other gestures inquisitively toward the siblings in the photograph. Show asking whether someone HAS FAMILY MEMBERS such as a brother or sister.",
    "ができます": "A person confidently plays a piano with both hands while a friend watches appreciatively. Show BEING ABLE TO PLAY, having the ability to do an activity.",
    "で": "A person cuts a carrot USING A KNIFE on a chopping board. Emphasize the tool and the action to show the Japanese particle for the MEANS OR INSTRUMENT used to do something.",
    "が": "A person notices one cat sleeping on a cushion and points toward that cat while telling a friend about it. Make the cat the clear SUBJECT being identified in the scene.",
})
SCENES["風呂"] = SCENES["おふろ"]
SCENES["あります"] = SCENES["があります"]
SCENES["お風呂"] = SCENES["おふろ"]
SCENES["ぬぎます"] = "A fully dressed adult wearing a long-sleeved shirt, trousers, and socks takes off only an outdoor coat, sliding one arm out of the coat sleeve. Show REMOVING AN OUTER COAT while all ordinary clothing underneath stays in place."
SCENES["脱ぐ"] = SCENES["ぬぎます"]
SCENES["四時間"] = "Exactly FOUR identical hourglasses stand in one clear row, each symbolizing one hour. Count precisely four hourglasses to represent FOUR HOURS OF DURATION. Only four hourglasses, a quiet cream background, no clocks, writing, or numerals."
SCENES["かいそく"] = "A rapid-service commuter TRAIN moves swiftly along railway tracks past a small local station without stopping. Show RAPID RAIL SERVICE with the train as the primary subject, not fast-food service or a restaurant. No writing or train logos."
SCENES["四年生"] = "A young adult STUDENT in their final university year carries textbooks on a university campus, with a rolled diploma and graduation cap nearby. Show a fourth-year university SENIOR STUDENT, not elderly people."
SCENES["つめたい"] = "Close view of a hand touching the outside of a glass of icy water, with ice cubes and clear condensation on the glass. Emphasize the COLD TEMPERATURE OF AN OBJECT TO THE TOUCH. This is tsumetai for cold things or drinks, not samui for cold weather. Quiet indoor setting, no winter clothes or snowy landscape."
SCENES["冷たい"] = SCENES["つめたい"]
SCENES["マウス"] = "One COMPUTER MOUSE rests on a desk beside the edge of a keyboard, with its scroll wheel and two buttons clearly visible. This vocabulary item means the computer input device, not a living rodent. No animals or writing."
SCENES["八分"] = "A digital KITCHEN COUNTDOWN TIMER displays exactly 08:00, indicating EIGHT MINUTES and zero seconds remaining. Put it beside an oven mitt and a small tray of cookies to show a cooking duration, not a time of day. The display digits 08:00 are the only writing."
SCENES["シャンプー"] = "An unlabeled shampoo pump bottle stands on a clean tiled shelf beside a comb and a few soft soap bubbles. A simple still life of hair-care products only: bottle, comb, and bubbles. No people or body parts."
SCENES["ございます"] = "A courteous adult host gestures with an open hand toward one BOOK resting on a small table. Make the inanimate book the obvious object being presented: THERE IS A BOOK HERE, expressed very politely. This is gozaimasu, a very polite form of aru for an inanimate object, not iru for a living animal. No animals."
SCENES["よろしく"] = "Two fully dressed adults meet for the first time and exchange a small courteous bow, smiling warmly. One has just introduced themselves. Show the common Japanese greeting yoroshiku: PLEASE TREAT ME KINDLY or NICE TO MEET YOU. A simple introduction scene, not cleaning or housework."
for compass_word, arrow_position in {
    "北東": "UPPER RIGHT, exactly halfway between north at the top and east on the right",
    "北西": "UPPER LEFT, exactly halfway between north at the top and west on the left",
    "南東": "LOWER RIGHT, exactly halfway between south at the bottom and east on the right",
    "南西": "LOWER LEFT, exactly halfway between south at the bottom and west on the left",
}.items():
    SCENES[compass_word] = (
        "A simple TOP-DOWN compass-rose diagram centered on cream paper. Thin gray lines form a cardinal cross. "
        "The top of the cross is labeled with exactly one small capital N, establishing NORTH UP. "
        f"One large thick ORANGE ARROW starts at the center and points toward the {arrow_position}. "
        "The orange arrow is the main subject. Keep the viewpoint flat, with no perspective tilt. "
        "No scenery, people, physical compass needles, or other arrows. The only writing is the single N at the top."
    )
SCENES["滑り"] = "A small glossy mound of pale green craft slime sits on a ceramic tray beside an unlabelled open jar. A wooden stirring stick lifts a short sticky strand, making the thick gooey SLIMY TEXTURE immediately visible. This vocabulary item is read NUMERI and means SLIME or SLIMINESS, rather than suberi meaning sliding. An object-only craft-material still life: tray, jar, stick, and slime. No people, animals, or body parts."
SCENES["そっち"] = "Two adults stand several steps apart in a quiet park. The speaker on the left points toward a park bench right beside the listener on the right. A small arrow on the ground leads from the speaker toward that listener and the nearby bench. Make THAT WAY, TOWARD YOUR SIDE clear: the destination is near the listener, rather than a distant landscape beyond both people. Both people and the bench are visible."
SCENES["そちら"] = SCENES["そっち"]
SCENES["キロ"] = "The exact numeral 1000 is formed from four large carved wooden digits standing in one clear row on cream paper: ONE followed by exactly THREE ZEROS. This is the metric prefix KILO meaning ONE THOUSAND. Make 1000 large and immediately readable; do not depict an uncountable pile of objects. No units, letters, or other numbers."
SCENES["二番"] = "A cheerful runner proudly holds a large SILVER MEDAL at chest level. The silver medal prominently displays exactly the numeral 2. Emphasize SECOND PLACE with the silver medal and its clearly readable 2, rather than winning a race. Simple uncluttered background, no other numbers or writing."
SCENES["レベル"] = "Three small stair-step platforms rise from low to medium to high, representing a progression of learning ability. One adult learner holding a book stands on the middle platform, which is gently highlighted in orange. Show a person's CURRENT SKILL LEVEL or STANDARD OF ABILITY, with a clear low-to-high progression. No construction tools, spirit levels, lettering, or numerals."
SCENES["負け"] = "The LOSING chess player is large in the foreground, looking gently disappointed at their own king lying on its side on the chessboard. The opponent sits farther away with a quiet sympathetic smile. Emphasize accepting a DEFEAT OR LOSS through the foreground player's expression and the fallen king. No trophies, finish lines, victory gestures, or celebration."
SCENES["殺し"] = "A gently serious murder-mystery scene: one adult detective with a magnifying glass examines a simple chalk outline of a person on the floor, behind a cordon. Convey the noun MURDER OR KILLING through a detective investigating a fictional crime scene. No actual body, weapon, attack, blood, wounds, or graphic details. Keep the scene calm and suitable for a vocabulary card."
SCENES["電子"] = "An educational symbol of ONE ELECTRON: a single large bright BLUE SPHERE bearing one clearly visible MINUS SIGN at its center, representing its negative electric charge. A faint thin circular orbital guide and a tiny gray nucleus far behind provide subtle atomic context, but the large blue negatively charged particle is the unmistakable main subject. The only mark is the minus sign on the blue sphere. Do not make the complete atom or its nucleus the main subject. No people or lettering."
SCENES["暴力"] = "A simple symbolic close-up shows one clenched adult fist striking a small wooden crate, with a few wooden splinters and clear impact lines. Convey VIOLENT DESTRUCTIVE FORCE directed only at an inanimate object. Keep the image calm in color and non-graphic. No other people, children, animals, injuries, weapons, or fighting between people."
SCENES["サイト"] = "A laptop screen prominently displays ONE WEBSITE inside a clear web-browser window, with a simple top address bar, navigation tabs, a landscape picture, and neatly arranged content cards. Convey a WEBSITE, the Japanese technology word saito from English web site. A clean computer still life only. No archaeological ruins, construction sites, excavation, people, logos, or readable text."
SCENES["つらい"] = "A weary adult sits at a desk after a very difficult day, head lowered into their hands, shoulders slumped, with a few quiet tears. A small pile of unfinished papers and a rainy window establish a hard situation. Focus on EMOTIONAL PAIN AND HARDSHIP, tsurai meaning painful, distressing, or hard to bear. No food, tasting, injuries, or violence. This is not a bitter flavor."
SCENES["殺人"] = SCENES["殺し"]
SCENES["死刑"] = "A quiet law-court tabletop holds a closed legal book, a wooden gavel, and balanced scales. A small framed pictogram above the book depicts an EMPTY gallows, with no one nearby. Convey the concept of CAPITAL PUNISHMENT or the DEATH PENALTY through legal judgment and the empty symbolic gallows. Calm symbolic still life only. No people, bodies, restraints, violence, or execution scene."
SCENES["ひどい"] = "Two adults in a courtyard: one has dropped a stack of books and looks upset while gathering them. The other person points and laughs unkindly, refusing to help. Emphasize CRUEL OR HEARTLESS BEHAVIOR through the unkind expression and refusal of help. No physical violence, injuries, weapons, or animals."
SCENES["変わらない"] = "Three side-by-side panels show the EXACT SAME plain gray stone, centered at the identical size and position on a quiet cream table. Its shape, color, and position are identical in all three panels. Only a tiny corner weather icon changes between sun, cloud, and snow. The UNCHANGING stone is the large primary subject. Show DOES NOT CHANGE, CONSTANT OR INVARIANT, not a tree changing its leaves with the seasons. No writing or numbers."
SCENES["落ち"] = "An adult notices an unchecked umbrella picture on a simple illustrated packing checklist. Their packed bag contains a book and hat, but the real umbrella has been left beside the door. Highlight the single unmarked checkbox and the forgotten umbrella to convey an OMISSION, OVERSIGHT, or item left out. This vocabulary sense is a mental slip or omission, not physically slipping or falling. No banana skins, falling people, words, or letters."
SCENES["上げ"] = "A dress lies flat on a sewing table. Two hands pinch a narrow fold in the dress fabric and secure it with sewing pins, with a neat stitched tuck visible next to it. Emphasize FABRIC FOLDED AND SEWN INTO A GARMENT, a tailoring tuck or pleat. This noun means a tuck in clothing, not tucking in a bedsheet. No beds or blankets."
SCENES["数年"] = "Three annual desk calendars stand side by side, clearly labeled only 2024, 2025, and 2026, from left to right. Under EACH large year label is a small complete four-season motif: blossom, sun, orange leaf, snowflake. EACH calendar represents an ENTIRE YEAR, so the scene shows several consecutive YEARS, not just the four seasons within one year. The only writing is the three year labels 2024, 2025, 2026."


def build_prompt(word):
    style = STYLE
    if word["japanese"] in {"北東", "北西", "南東", "南西"}:
        style = style.replace("No text, no letters, no numbers, no logos or watermark.", "The only writing is a single capital N at the top of the compass rose. No other letters, numbers, logos, or watermark.")
    if word["japanese"] in {"八分", "キロ", "二番", "数年"}:
        style = style.replace("No text, no letters, no numbers, no logos or watermark.", "No letters, logos, or watermark. The only numerals are those explicitly requested for this educational illustration.")
    scene = SCENES.get(word["japanese"])
    name = re.split(r"[,;]", word["meaning"])[0].strip()
    if name in PERSON_NAMES:
        scene = (
            f"A friendly adult HUMAN PERSON named {name} introduces themselves "
            "to another person, gently pointing to their own chest. The human is the primary "
            "subject. This is a PERSON'S NAME, not an animal, a landscape, or another homophone."
        )
    return style + (
        f"Vocabulary: {word['japanese']}. Reading: {word.get('reading', '')}. Exact intended meaning: {word['meaning']}. "
        + (f"Required scene and usage context: {scene} " if scene else "")
        + "Depict one concrete memorable scene that clearly communicates that meaning. "
        "For object nouns, make the object large and easy to identify; include people only when they help communicate the meaning. "
        "For actions, show the action unambiguously. For adjectives or abstract ideas, "
        "show a simple contrasting situation or clear visual relationship. "
        "For particles, grammatical phrases, greetings or pronouns, use a small everyday "
        "interaction, pointing gesture or spatial relationship to communicate their role. "
        "For frightening or medical vocabulary, use a gentle non-graphic symbolic scene. "
        "Illustrate the intended meaning, not the written characters or an unrelated homophone. "
        "Keep the focus on one meaning; do not combine unrelated dictionary senses."
    )


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + f".{os.getpid()}.tmp")
    temporary.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    temporary.replace(path)


def prepare():
    words = []
    for name in ["japanese.json", "japanese-extended.json"]:
        words.extend(json.loads((ROOT / "src/data" / name).read_text()))
    previous = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {"items": []}
    existing = {item["id"]: item for item in previous["items"]}
    unit57 = json.loads((ROOT / "public/illustrations/unit57/prompts.json").read_text())
    unit_terms = json.loads((ROOT / "src/data/section4-topics.json").read_text())[56]["words"]
    unit_images = dict(zip(unit_terms, unit57["prompts"]))
    items = []
    for word in words:
        slug = "word-" + hashlib.sha256(word["id"].encode()).hexdigest()[:16]
        item = {
            "id": word["id"],
            "japanese": word["japanese"],
            "reading": word.get("reading", ""),
            "meaning": word["meaning"],
            "level": word["level"],
            "file": f"illustrations/vocabulary/{slug}.webp",
            "prompt": build_prompt(word),
        }
        if word["japanese"] in unit_images:
            original = unit_images[word["japanese"]]
            item["file"] = f"illustrations/unit57/{original['slug']}.webp"
            item["prompt"] = original["prompt"]
        elif word["id"] in existing and (
            (ROOT / "public" / existing[word["id"]]["file"]).is_file()
            or existing[word["id"]].get("revision")
        ):
            item["prompt"] = existing[word["id"]]["prompt"]
            item["file"] = existing[word["id"]]["file"]
            if existing[word["id"]].get("revision"):
                item["revision"] = existing[word["id"]]["revision"]
            if existing[word["id"]].get("sharedWith"):
                item["sharedWith"] = existing[word["id"]]["sharedWith"]
        items.append(item)
    # Equivalent written forms can share a picture only when dictionary entry,
    # pronunciation, and intended meaning all agree. Preserve already-saved art.
    lexical_path = ROOT / "src/data/memory-lexicon.json"
    lexical = json.loads(lexical_path.read_text())["words"] if lexical_path.exists() else {}
    def concept_key(item):
        source = lexical.get(item["id"])
        if not source or source["reading"] != item["reading"]:
            return None
        reading = "".join(chr(ord(c) - 0x60) if "ァ" <= c <= "ヶ" else c for c in item["reading"])
        meaning = re.sub(r"\([^)]*\)", "", item["meaning"])
        meaning = re.split(r"[,;]", meaning)[0]
        meaning = unicodedata.normalize("NFKC", meaning).lower().strip()
        meaning = re.sub(r"^(?:a|an|the|to)\s+", "", meaning)
        return source["dictionaryId"], reading, meaning
    concepts = {}
    for item in items:
        key = concept_key(item)
        if key and (ROOT / "public" / item["file"]).is_file():
            concepts.setdefault(key, item)
    for item in items:
        key = concept_key(item)
        if not key:
            continue
        original = concepts.setdefault(key, item)
        if original is not item and not (ROOT / "public" / item["file"]).is_file():
            item["file"] = original["file"]
            item["prompt"] = original["prompt"]
            item["sharedWith"] = original["id"]
    # The course glosses both spellings as "thirty" in clock-time exercises.
    # Their meaning is half past; share the explicitly reviewed clock picture.
    by_written_form = {item["japanese"]: item for item in items}
    if "半" in by_written_form and "はん" in by_written_form:
        half_hour = by_written_form["はん"]
        by_written_form["半"].update({
            "file": half_hour["file"], "prompt": half_hour["prompt"],
            "sharedWith": half_hour["id"],
        })
    if "あります" in by_written_form and "があります" in by_written_form:
        existence = by_written_form["があります"]
        by_written_form["あります"].update({
            "file": existence["file"], "prompt": existence["prompt"],
            "sharedWith": existence["id"],
        })
    assert len({item["id"] for item in items}) == len(items)
    write_json(MANIFEST, {"version": 1, "generatedWith": "Built-in image_gen tool", "items": items})
    refresh()


def refresh():
    manifest = json.loads(MANIFEST.read_text())
    ready = {
        item["id"]: item["file"]
        for item in manifest["items"]
        if (ROOT / "public" / item["file"]).is_file()
    }
    write_json(INDEX, ready)
    return ready


def import_image(args):
    from PIL import Image

    manifest = json.loads(MANIFEST.read_text())
    item = next(item for item in manifest["items"] if item["id"] == args.word_id)
    target = ROOT / "public" / item["file"]
    if target.exists():
        refresh()
        print(json.dumps({"id": item["id"], "file": item["file"], "status": "already-saved"}))
        return
    target.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(args.source) as source:
        image = source.convert("RGB")
        image.thumbnail((512, 512), Image.Resampling.LANCZOS)
        temporary = ROOT / "tmp/imagegen/optimized" / (target.stem + f".{os.getpid()}.webp")
        temporary.parent.mkdir(parents=True, exist_ok=True)
        image.save(temporary, "WEBP", quality=86, method=6)
        temporary.replace(target)
    refresh()
    print(json.dumps({"id": item["id"], "file": item["file"], "status": "saved"}))


def review_images(args):
    """Prepare contact sheets without marking unseen images as reviewed."""
    import textwrap
    import time
    from PIL import Image, ImageDraw

    directory = ROOT / "tmp/imagegen"
    reviewed_path = directory / "reviewed.json"
    reviewed = set(json.loads(reviewed_path.read_text())) if reviewed_path.exists() else set()
    items = []
    for item in json.loads(MANIFEST.read_text())["items"]:
        if item["file"] in reviewed or not (ROOT / "public" / item["file"]).is_file():
            continue
        reviewed.add(item["file"])
        items.append({key: item[key] for key in ["id", "japanese", "meaning", "file"]})
        if len(items) >= args.limit:
            break
    receipt = {"items": items, "sheets": []}
    stem = directory / f"review-{time.time_ns()}"
    directory.mkdir(parents=True, exist_ok=True)
    for page in range((len(items) + 31) // 32):
        sheet = Image.new("RGB", (1200, 1440), "#faf6ed")
        draw = ImageDraw.Draw(sheet)
        for index, item in enumerate(items[page * 32:(page + 1) * 32]):
            x, y = index % 6 * 200 + 5, index // 6 * 240 + 5
            with Image.open(ROOT / "public" / item["file"]) as original:
                original.thumbnail((190, 190))
                sheet.paste(original, (x, y))
            label = f"{page * 32 + index + 1}. {item['meaning']}"
            for line, text in enumerate(textwrap.wrap(label, 25)[:2]):
                draw.text((x, y + 194 + line * 14), text, fill="#252722")
        target = Path(f"{stem}-{page + 1}.jpg")
        sheet.save(target)
        receipt["sheets"].append(str(target.relative_to(ROOT)))
    target = stem.with_suffix(".json")
    write_json(target, receipt)
    print(json.dumps({"receipt": str(target.relative_to(ROOT)), **receipt}, ensure_ascii=False))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    subcommands = parser.add_subparsers(dest="command", required=True)
    subcommands.add_parser("prepare")
    subcommands.add_parser("refresh")
    subcommands.add_parser("check-complete")
    pending = subcommands.add_parser("pending")
    pending.add_argument("--offset", type=int, default=0)
    pending.add_argument("--limit", type=int, default=50)
    incoming = subcommands.add_parser("import")
    incoming.add_argument("--word-id", required=True)
    incoming.add_argument("--source", type=Path, required=True)
    revision = subcommands.add_parser("revise")
    revision.add_argument("--word-id", required=True)
    review = subcommands.add_parser("review")
    review.add_argument("--limit", type=int, default=64)
    mark_reviewed = subcommands.add_parser("mark-reviewed")
    mark_reviewed.add_argument("--receipt", type=Path)
    args = parser.parse_args()
    if args.command == "prepare":
        prepare()
    elif args.command in ["refresh", "check-complete"]:
        ready = refresh()
        items = json.loads(MANIFEST.read_text())["items"]
        total = len(items)
        pending_files = {item["file"] for item in items if item["id"] not in ready}
        print(json.dumps({"ready": len(ready), "total": total, "remaining": total - len(ready), "remainingImages": len(pending_files)}))
        if args.command == "check-complete" and pending_files:
            raise SystemExit(1)
    elif args.command == "pending":
        manifest = json.loads(MANIFEST.read_text())
        items, seen = [], set()
        for item in manifest["items"]:
            if not (ROOT / "public" / item["file"]).is_file() and item["file"] not in seen:
                items.append(item)
                seen.add(item["file"])
        print(json.dumps(items[args.offset:args.offset + args.limit], ensure_ascii=False))
    elif args.command == "import":
        import_image(args)
    elif args.command == "review":
        review_images(args)
    elif args.command == "mark-reviewed":
        reviewed_path = ROOT / "tmp/imagegen/reviewed.json"
        reviewed = set(json.loads(reviewed_path.read_text())) if reviewed_path.exists() else set()
        receipt_path = args.receipt or max(
            (ROOT / "tmp/imagegen").glob("review-[0-9]*.json"),
            key=lambda path: path.stat().st_mtime_ns,
        )
        receipt = json.loads(receipt_path.read_text())
        reviewed.update(item["file"] for item in receipt["items"])
        write_json(reviewed_path, sorted(reviewed))
        print(json.dumps({"reviewedImages": len(reviewed)}))
    elif args.command == "revise":
        manifest = json.loads(MANIFEST.read_text())
        item = next(item for item in manifest["items"] if item["id"] == args.word_id)
        old_file = item["file"]
        saved_version = re.search(r"-v(\d+)$", Path(old_file).stem)
        version = max(item.get("revision", 1), int(saved_version[1]) if saved_version else 1) + 1
        stem = re.sub(r"-v\d+$", "", Path(old_file).stem)
        new_file = str(Path(old_file).with_name(f"{stem}-v{version}.webp"))
        while (ROOT / "public" / new_file).exists():
            version += 1
            new_file = str(Path(old_file).with_name(f"{stem}-v{version}.webp"))
        prompt = build_prompt(item)
        for related in manifest["items"]:
            if related["file"] == old_file:
                related.update({"file": new_file, "prompt": prompt, "revision": version})
        write_json(MANIFEST, manifest)
        refresh()
        print(json.dumps({"id": item["id"], "file": new_file, "status": "revision-pending"}))


if __name__ == "__main__":
    main()
