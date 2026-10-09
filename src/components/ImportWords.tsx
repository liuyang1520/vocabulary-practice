import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import type { Word } from '../types';
import { importWords } from '../lib/csv';
import { Button, Modal } from './ui';

export default function ImportWords({
  open,
  onOpenChange,
  words,
  onImport,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  words: Word[];
  onImport: (words: Word[]) => void;
}) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [reading, setReading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function readFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 1_000_000) {
      setError('Choose a CSV file smaller than 1 MB.');
      return;
    }
    setReading(true);
    setError('');
    try {
      setText(await file.text());
    } catch {
      setError('This file could not be read. Try pasting the words below.');
    } finally {
      setReading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Make it your vocabulary."
      description="Add a CSV file or paste a few words. They’ll go into your personal list."
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          try {
            onImport(importWords(text, words));
            setText('');
            setError('');
            onOpenChange(false);
          } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Could not import this list.');
          }
        }}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          aria-label="Choose vocabulary CSV"
          onChange={(event) => void readFile(event.target.files?.[0])}
        />
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={() => fileRef.current?.click()}
          disabled={reading}
        >
          <Upload size={17} />
          {reading ? 'Reading file…' : 'Choose a CSV file'}
        </Button>
        <label className="field-label mt-6" htmlFor="import-text">
          Or paste your words
        </label>
        <textarea
          id="import-text"
          className="input import-text"
          rows={7}
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setError('');
          }}
          placeholder={'word,meaning,reading\n猫,"cat, cats",ねこ\nありがとう,thank you'}
          spellCheck={false}
        />
        <p className="small-note">
          Use word, meaning, and an optional reading. Wrap meanings that contain commas in quotes.
          Duplicate personal words are skipped.
        </p>
        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={!text.trim() || reading}>
            Add to my vocabulary
          </Button>
        </div>
      </form>
    </Modal>
  );
}
