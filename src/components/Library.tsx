import { useDeferredValue, useMemo, useState } from 'react';
import {
  ArrowRight,
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import type { Level, SavedState, Word } from '../types';
import { isInCollection, levels, levelTitle, section4Topics } from '../data/catalog';
import { wordsToCsv } from '../lib/csv';
import { Button, downloadFile, EmptyState, Picker } from './ui';
import Pronunciation from './Pronunciation';

interface Props {
  words: Word[];
  state: SavedState;
  onBookmark: (id: string) => void;
  onImport: () => void;
  onDelete: (id: string) => void;
  onStudy: (words: Word[], level: Level | 'all') => void;
}

const PAGE_SIZE = 20;

export default function Library({ words, state, onBookmark, onImport, onDelete, onStudy }: Props) {
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [level, setLevel] = useState<Level | 'all'>('all');
  const [status, setStatus] = useState('all');
  const [unit, setUnit] = useState(state.section4Unit);
  const [page, setPage] = useState(0);
  const saved = useMemo(() => new Set(state.bookmarks), [state.bookmarks]);
  const filtered = useMemo(
    () =>
      words.filter((word) => {
        const matchesLevel = isInCollection(word, level, unit);
        const progress = state.progress[word.id];
        const learned = (progress?.correct || 0) >= 3 && progress?.lastCorrect;
        const matchesStatus =
          status === 'all' ||
          (status === 'saved' && saved.has(word.id)) ||
          (status === 'learning' && progress && !learned) ||
          (status === 'learned' && learned);
        const query = deferredSearch.toLowerCase().normalize('NFKC').trim();
        return (
          matchesLevel &&
          matchesStatus &&
          [word.japanese, word.meaning, word.reading || ''].some((value) =>
            value.normalize('NFKC').toLowerCase().includes(query),
          )
        );
      }),
    [words, level, unit, status, saved, state.progress, deferredSearch],
  );
  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const currentPage = Math.min(page, Math.max(0, pageCount - 1));
  const visible = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  return (
    <section className="page-enter library-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR WORDS, ALL IN ONE PLACE</span>
          <h1>A growing vocabulary.</h1>
          <p>Find a word, save a favorite, or bring a list of your own.</p>
        </div>
        <Button variant="secondary" onClick={onImport}>
          <Upload size={16} />
          Add vocabulary
        </Button>
      </div>
      <div className="library-toolbar">
        <div className="search-field">
          <Search size={18} />
          <label htmlFor="word-search" className="sr-only">
            Search vocabulary
          </label>
          <input
            id="word-search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(0);
            }}
            placeholder="Search Japanese, reading, or meaning…"
          />
        </div>
        <Picker
          label="Filter by level"
          value={level}
          onChange={(value) => {
            setLevel(value as Level | 'all');
            setPage(0);
          }}
          options={[
            { value: 'all', label: 'All levels' },
            ...levels.map((item) => ({ value: item.id, label: `0${item.id} · ${item.title}` })),
            { value: 'custom', label: 'My vocabulary' },
          ]}
        />
        <Picker
          label="Filter by progress"
          value={status}
          onChange={(value) => {
            setStatus(value);
            setPage(0);
          }}
          options={[
            { value: 'all', label: 'All words' },
            { value: 'saved', label: 'Saved words' },
            { value: 'learning', label: 'Learning' },
            { value: 'learned', label: 'Learned' },
          ]}
        />
      </div>
      {level === '4' ? (
        <div className="library-unit-filter">
          <label className="field-label" htmlFor="library-unit">
            Section 4 topic
          </label>
          <Picker
            id="library-unit"
            label="Filter Section 4 topic"
            value={unit}
            onChange={(value) => {
              setUnit(value);
              setPage(0);
            }}
            options={[
              { value: 'all', label: 'All Section 4 topics' },
              ...section4Topics.map((topic) => ({
                value: String(topic.unit),
                label: `Unit ${topic.unit} · ${topic.title}`,
              })),
            ]}
          />
          <p className="small-note">
            Curated companion words for the unit’s topic. Exact lesson vocabulary varies by course
            version.
          </p>
        </div>
      ) : null}
      <div className="library-results">
        <p>
          <strong>{filtered.length.toLocaleString()}</strong>{' '}
          {filtered.length === 1 ? 'word' : 'words'}
          {search ? ` matching “${search}”` : ''}
        </p>
        <div className="flex gap-3">
          <button
            className="text-button"
            aria-label="Export vocabulary as CSV"
            disabled={!filtered.length}
            onClick={() =>
              downloadFile(wordsToCsv(filtered), 'kotoba-vocabulary.csv', 'text/csv;charset=utf-8')
            }
          >
            <Download size={15} />
            <span className="export-label">Export CSV</span>
          </button>
          <button
            className="text-button accent"
            disabled={!filtered.length}
            onClick={() => onStudy(filtered, level)}
          >
            Practice this list
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
      {visible.length ? (
        <>
          <div className="table-wrap">
            <table className="word-table">
              <thead>
                <tr>
                  <th>Japanese</th>
                  <th>Meaning</th>
                  <th>Collection</th>
                  <th>Status</th>
                  <th>
                    <span className="sr-only">Word actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((word) => {
                  const progress = state.progress[word.id];
                  const learned = (progress?.correct || 0) >= 3 && progress?.lastCorrect;
                  const displayLevel = level === '4' ? '4' : word.level;
                  return (
                    <tr key={word.id}>
                      <td>
                        <span className="table-japanese" lang="ja">
                          {word.japanese}
                        </span>
                        {state.showReading && word.reading && word.reading !== word.japanese ? (
                          <span className="table-reading" lang="ja">
                            {word.reading}
                          </span>
                        ) : null}
                        <span className="mobile-word-details">
                          {displayLevel === 'custom' ? 'Personal' : `Collection ${displayLevel}`} ·{' '}
                          {learned ? 'Learned' : progress ? 'Learning' : 'New'}
                        </span>
                      </td>
                      <td>{word.meaning}</td>
                      <td>
                        <span className="collection-label">
                          {displayLevel === 'custom' ? 'Personal' : `Collection ${displayLevel}`}
                        </span>
                        <span className="table-reading">{levelTitle(displayLevel)}</span>
                      </td>
                      <td>
                        <span className={`word-status ${learned ? 'status-learned' : ''}`}>
                          {learned ? (
                            <Check size={12} />
                          ) : (
                            <span className={`status-dot ${progress ? 'status-learning' : ''}`} />
                          )}
                          {learned ? 'Learned' : progress ? 'Learning' : 'New'}
                        </span>
                      </td>
                      <td>
                        <div className="word-actions">
                          <Pronunciation word={word} />
                          <button
                            className={`icon-button ${saved.has(word.id) ? 'is-bookmarked' : ''}`}
                            aria-label={`${saved.has(word.id) ? 'Unsave' : 'Save'} ${word.japanese}`}
                            aria-pressed={saved.has(word.id)}
                            onClick={() => onBookmark(word.id)}
                          >
                            <Bookmark size={16} />
                          </button>
                          {word.source === 'custom' ? (
                            <button
                              className="icon-button"
                              onClick={() => onDelete(word.id)}
                              aria-label={`Delete ${word.japanese}`}
                            >
                              <Trash2 size={15} />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <span>
              {currentPage * PAGE_SIZE + 1}–
              {Math.min((currentPage + 1) * PAGE_SIZE, filtered.length)} of{' '}
              {filtered.length.toLocaleString()} words
            </span>
            <div className="flex items-center gap-3">
              <button
                className="icon-button bordered"
                aria-label="Previous page"
                disabled={currentPage === 0}
                onClick={() => setPage(currentPage - 1)}
              >
                <ChevronLeft size={17} />
              </button>
              <span>
                {currentPage + 1} / {pageCount}
              </span>
              <button
                className="icon-button bordered"
                aria-label="Next page"
                disabled={currentPage + 1 >= pageCount}
                onClick={() => setPage(currentPage + 1)}
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          title={level === 'custom' && !search ? 'A place for your own words.' : 'No words found.'}
          description={
            level === 'custom' && !search
              ? 'Add a CSV or paste a few words to start a personal collection.'
              : 'Try another search or change the filters.'
          }
        >
          {level === 'custom' ? (
            <Button onClick={onImport}>
              <Upload size={16} />
              Add vocabulary
            </Button>
          ) : (
            <Button
              variant="secondary"
              onClick={() => {
                setSearch('');
                setLevel('all');
                setStatus('all');
              }}
            >
              Clear filters
            </Button>
          )}
        </EmptyState>
      )}
      <div className="source-note">
        <span className="eyebrow">ABOUT THE DEFAULT LIST</span>
        <p>
          Duolingo Japanese vocabulary from{' '}
          <a
            href="https://github.com/Cerno-b/anki-duolingo-japanese"
            target="_blank"
            rel="noreferrer"
          >
            a community export
          </a>{' '}
          and this project’s existing word list, expanded with{' '}
          <a
            href="https://liuch.github.io/duolingo_courses_overview/html/tree_ja_en_ver4.html"
            target="_blank"
            rel="noreferrer"
          >
            legacy course vocabulary
          </a>
          . New readings and definitions use{' '}
          <a href="https://www.edrdg.org/jmdict/j_jmdict.html" target="_blank" rel="noreferrer">
            JMdict
          </a>
          . The Section 4 companion follows the{' '}
          <a
            href="https://duolingodata.com/dat/jafen1030.html#section4"
            target="_blank"
            rel="noreferrer"
          >
            2026 unit topics
          </a>{' '}
          with independently selected review words. These are unofficial study collections; exact
          words and unit placement in your course may differ.{' '}
          <a href="/licenses/duolingo-community-MIT.txt" target="_blank" rel="noreferrer">
            Community license ↗
          </a>
          {' · '}
          <a href="/licenses/vocabulary-sources.txt" target="_blank" rel="noreferrer">
            Vocabulary attribution ↗
          </a>
        </p>
      </div>
    </section>
  );
}
