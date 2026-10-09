# Kotoba

A frontend-only Japanese vocabulary practice app built with React, TypeScript, Vite, Tailwind CSS, and Radix UI. The design takes inspiration from [TypeUI](https://www.typeui.sh/): clear typography, simple buttons, and quiet bordered surfaces, with a warm red accent. Geist is bundled locally; no external font requests are needed.

## Run locally

Use Node.js 22.12 or newer and pnpm 10.34.1 (pinned in `package.json`). With Corepack available, run `corepack enable` to activate pnpm.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open the URL printed by Vite. There are no environment variables, accounts, API keys, or backend services to configure.

```sh
pnpm test       # CSV parsing, answer matching, study logic, and vocabulary integrity
pnpm build      # TypeScript check and production build
pnpm preview    # Preview the production build
```

The production site is generated in `dist/` and can be served by any static web server.

## GitHub Pages

The site is hosted at https://liuyang1520.github.io/vocabulary-practice/. Vite's `base` is
`/vocabulary-practice/` so built assets, the favicon, home links, and license links resolve inside the
repository's Pages path.

In the GitHub repository, go to **Settings → Pages → Build and deployment → Source** and select
**GitHub Actions**. The workflow in [.github/workflows/deploy.yml](.github/workflows/deploy.yml)
installs the pinned pnpm dependencies, tests and builds the app, and publishes **only `dist/`** on
pushes to `main`. It can also be run manually from the Actions tab.

Publishing the repository root directly serves the development `index.html`, which references
`/src/main.tsx` and cannot run on a static host. Deploy the build output instead. For hosting at a
domain root, build with `pnpm build --base=/`.

## Practice

- Flashcards with self-assessed recall, multiple choice, and typed answers.
- Japanese → English and English → Japanese directions; 5, 10, 20, or 30 words per session.
- Collection, saved-word, and missed-word practice; search and paginate the vocabulary library. The Section 4 companion has a topic selector for all 60 units, initially set to unit 57.
- Local progress, completed-session history, a daily goal, and a study streak. A word is marked learned after at least three correct answers or positive flashcard ratings, with the latest answer correct.
- Light/dark themes, optional kana readings, and Japanese pronunciation with voice selection, speed controls, and a preview in Study settings. Automatic selection prefers enhanced/natural voices, Google Japanese, and standard Japanese system voices such as Kyoko over novelty voices. Chrome’s asynchronously loaded voice list is handled before playback.
- Personal vocabulary from pasted text or CSV, plus export of any filtered list. Personal words can be removed from the library.

Progress, bookmarks, preferences, and personal vocabulary live in versioned browser local storage. Clearing site data removes them. They do not sync across browsers or devices. Bundled word lists require no remote service at runtime; pronunciation support varies by browser and device. No service worker or offline-install claim is made.

## Default Japanese vocabulary

The app includes **4,136 unique terms**, preserving the original 1,448 IDs so existing bookmarks and word progress continue to work:

| Study level                            | Words | Source                                                                         |
| -------------------------------------- | ----: | ------------------------------------------------------------------------------ |
| First words · Beginner                 |   115 | Community Duolingo Japanese section 1 export                                   |
| Everyday Japanese · Elementary         |   620 | Community section 2 export, partial coverage (source units 11–29)              |
| A wider vocabulary · Extended practice | 3,210 | Original export + dictionary-attested vocabulary from a legacy Duolingo course |
| Section 4 companion · Unit topics      |   523 | Independently curated review words for the 2026 Section 4 unit topics          |

The Section 4 companion overlaps the other collections: 332 of its words also appear in an earlier collection. Its 60 unit titles follow the [Japanese-from-English 1,030-unit course outline](https://duolingodata.com/dat/jafen1030.html#section4), dated March 5, 2026. Unit 57 is “Reduce waste at home.” Words in these topic lists are independently selected companion vocabulary, **not a verified export of the words introduced in each Duolingo lesson**. Duolingo has different course versions; titles and vocabulary may differ in your account.

These are unofficial study collections, not certified proficiency or JLPT levels. The first two collections use older section snapshots. The third is extended vocabulary, not an official section 3. The legacy course source records actual Duolingo vocabulary and original skill names, but does not establish placement in the current path.

Sources and processing:

- [Cerno-b/anki-duolingo-japanese](https://github.com/Cerno-b/anki-duolingo-japanese), commit `b273ad67570c3537cd053981d92e90643f975273`, MIT. All 1,447 terms from this project’s original export are retained.
- [liuch/duolingo_courses_overview](https://github.com/liuch/duolingo_courses_overview), commit `922959f5631b0475cb408c042fa2db0683706c1b`, CC0. The Japanese version 4 snapshot adds 2,497 common, dictionary-attested terms. Individual kana/kanji teaching fragments and ambiguous homophones are excluded; source skill names are retained.
- [JMdict](https://www.edrdg.org/jmdict/j_jmdict.html), copyright the Electronic Dictionary Research and Development Group, CC BY-SA 4.0. Readings and English glosses use [jmdict-simplified](https://github.com/scriptin/jmdict-simplified), pinned release `3.6.2+20260928191014`. Spelling and reading restrictions are respected. Some glosses are clarified for their companion topic; for example, 分別 is ぶんべつ, waste sorting.
- Section 4 topic word selections are maintained in `src/data/section4-topics.json`. Every topic word resolves to one stable ID in the bundled vocabulary. Matching words share bookmarks and progress across collections.

The combined vocabulary data, including dictionary adaptations, is distributed under CC BY-SA 4.0; this applies to the data, not the application code. Source notices and full license texts are in [public/licenses/vocabulary-sources.txt](public/licenses/vocabulary-sources.txt) and linked from the library. The app ships only the selected terms in `src/data/japanese.json` and `src/data/japanese-extended.json`, not the full dictionary. Bundled readings are provided for 4,017 terms; the other 119 retain their source text without guessed readings.

To repeat the data update using the pinned public sources:

```sh
python3 scripts/update-vocabulary.py
pnpm exec prettier --write src/data
pnpm test
```

The updater requires Python 3 and network access, with no third-party Python packages. It preserves existing IDs and manually clarified definitions. Source vocabulary and dictionary downloads happen only when maintaining the bundled data.

For better pronunciation on macOS, add a Japanese voice in **System Settings → Accessibility → Read & Speak → System voice**, reopen Chrome, then select and preview it in Kotoba’s Study settings. Installed voices work locally; a browser-supplied online voice may require internet access. Audio quality still depends on the voices Chrome exposes. No paid TTS service or API key is required.

This app is not affiliated with Duolingo.

## Personal CSV format

```csv
word,meaning,reading
猫,"cat, cats",ねこ
ありがとう,thank you,
```

The header and reading column are optional. Legacy `Word,Meaning` and `word,translation` headers also work. Quote any field containing commas, line breaks, or double quotes (escape a quote as `""`). Imports are validated before adding any words; duplicate personal written forms are skipped. Limits: 1 MB per file, 500 characters per field, and 5,000 personal words.

## Dependency policy

`pnpm-workspace.yaml` sets `minimumReleaseAge: 10080` (**seven days**) for direct and transitive dependencies, with strict handling of missing release timestamps and no age exemptions. Exotic transitive sources are blocked. Dependency scripts require explicit approval in the project’s allowlist; the current stack requires none. Exact package versions and the pnpm lockfile are committed. Keep the release-age policy active when adding or updating dependencies; it reduces exposure to newly published compromised releases, but is not a guarantee of safety.

The old vanilla JavaScript app, static-server dependency, and outdated documentation have been replaced. The app can be served by any static host; the included workflow publishes it to GitHub Pages.
