import { useState } from 'react';
import type { SavedState } from '../types';
import { Button, Modal, Picker } from './ui';
import { useSpeech } from './Speech';

export default function Settings({
  open,
  onOpenChange,
  state,
  onUpdate,
  onReset,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: SavedState;
  onUpdate: (
    settings: Partial<Pick<SavedState, 'goal' | 'showReading' | 'voiceURI' | 'speechRate'>>,
  ) => void;
  onReset: () => void;
}) {
  const [confirmReset, setConfirmReset] = useState(false);
  const { supported, voices, selectedVoice, speakingId, error, speak } = useSpeech();
  return (
    <Modal
      open={open}
      onOpenChange={(value) => {
        onOpenChange(value);
        if (!value) setConfirmReset(false);
      }}
      title="A practice that fits you."
      description="A few simple preferences for your daily study."
    >
      <div className="settings-row">
        <div>
          <h3>Daily goal</h3>
          <p>Words to practice in completed sessions.</p>
        </div>
        <Picker
          label="Daily word goal"
          value={String(state.goal)}
          onChange={(value) => onUpdate({ goal: Number(value) })}
          options={[5, 10, 20, 30].map((value) => ({
            value: String(value),
            label: `${value} words`,
          }))}
        />
      </div>
      <div className="settings-row">
        <div>
          <h3>
            <label htmlFor="show-readings">Show kana readings</label>
          </h3>
          <p>Display readings where the source includes them.</p>
        </div>
        <input
          id="show-readings"
          className="checkbox"
          type="checkbox"
          checked={state.showReading}
          onChange={(event) => onUpdate({ showReading: event.target.checked })}
        />
      </div>
      <div className="audio-settings">
        <h3>Japanese pronunciation</h3>
        <p>Choose the voice that sounds best to you.</p>
        {supported ? (
          <>
            <label className="field-label" htmlFor="japanese-voice">
              Voice
            </label>
            <Picker
              id="japanese-voice"
              label="Japanese pronunciation voice"
              value={
                voices.some((voice) => voice.voiceURI === state.voiceURI) ? state.voiceURI : 'auto'
              }
              onChange={(voiceURI) => onUpdate({ voiceURI })}
              options={[
                {
                  value: 'auto',
                  label: `Automatic${selectedVoice ? ` · ${selectedVoice.name}` : ''}`,
                },
                ...voices.map((voice) => ({ value: voice.voiceURI, label: voice.name })),
              ]}
            />
            <div className="audio-settings-controls">
              <div>
                <label className="field-label" htmlFor="speech-rate">
                  Speed
                </label>
                <Picker
                  id="speech-rate"
                  label="Pronunciation speed"
                  value={String(state.speechRate)}
                  onChange={(value) => onUpdate({ speechRate: Number(value) })}
                  options={[
                    { value: '0.8', label: 'Slower · 0.8×' },
                    { value: '1', label: 'Natural · 1×' },
                    { value: '1.1', label: 'Faster · 1.1×' },
                  ]}
                />
              </div>
              <Button
                variant="secondary"
                onClick={() =>
                  speak('こんにちは。日本語を少しずつ練習しましょう。', 'voice-preview')
                }
                aria-busy={speakingId === 'voice-preview'}
              >
                Preview voice
              </Button>
            </div>
            <p className="small-note">
              {selectedVoice
                ? `${selectedVoice.localService ? 'Device voice' : 'Online voice · internet needed'}: ${selectedVoice.name}.`
                : 'No Japanese voice is available yet.'}{' '}
              On a Mac, you can add Japanese voices in Accessibility → Read & Speak → System voice.
              Reopen Chrome after downloading a voice.
            </p>
            {error?.id === 'voice-preview' ? (
              <p role="status" className="form-error">
                {error.message}
              </p>
            ) : null}
          </>
        ) : (
          <p className="small-note">Speech playback is unavailable in this browser.</p>
        )}
      </div>
      <div className="settings-privacy">
        <h3>Your progress stays with you.</h3>
        <p>
          Everything is saved in this browser. Clearing browser data removes your personal
          vocabulary and progress. Export your personal list from the library to keep a copy.
        </p>
      </div>
      <div className="reset-section">
        {confirmReset ? (
          <>
            <p>
              Reset all answer history and completed sessions? Your personal word list and saved
              words will be kept.
            </p>
            <div className="flex gap-3 mt-3">
              <Button variant="secondary" onClick={() => setConfirmReset(false)}>
                Keep progress
              </Button>
              <Button
                className="danger-button"
                onClick={() => {
                  onReset();
                  setConfirmReset(false);
                }}
              >
                Reset progress
              </Button>
            </div>
          </>
        ) : (
          <button className="text-button muted" onClick={() => setConfirmReset(true)}>
            Reset study progress
          </button>
        )}
      </div>
      <div className="modal-actions">
        <Button onClick={() => onOpenChange(false)}>Done</Button>
      </div>
    </Modal>
  );
}
