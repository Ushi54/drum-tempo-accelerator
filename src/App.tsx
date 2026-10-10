import { useState } from 'react';
import { AccelControls } from './components/AccelControls';
import { BeatDisplay } from './components/BeatDisplay';
import { MeterControls } from './components/MeterControls';
import { Modal } from './components/Modal';
import { PresetBar } from './components/PresetBar';
import { TempoDisplay } from './components/TempoDisplay';
import { useMetronome } from './hooks/useMetronome';
import type { AccelMode, Preset, Settings } from './logic/types';
import { createPreset, loadPresets, savePresets, toSettings } from './storage/presets';

const DEFAULT_SETTINGS: Settings = {
  meter: { beats: 4, unit: 4, groups: null },
  polyrhythm: null,
  accent: true,
  bpm: 120,
  accelerate: { mode: 'off', startBpm: 100, targetBpm: 160, interval: 4, amount: 5 },
};

// モードを切り替えたときの間隔の初期値（小節と秒では数の感覚が違うため）
const DEFAULT_INTERVAL: Record<AccelMode, number> = { off: 4, bars: 4, time: 30 };

export default function App() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [presets, setPresets] = useState<Preset[]>(loadPresets);
  const [selectedId, setSelectedId] = useState('');
  const [saveFailed, setSaveFailed] = useState(false);
  const metronome = useMetronome(settings);

  const patch = (p: Partial<Settings>) => setSettings((s) => ({ ...s, ...p }));

  const changeMode = (mode: AccelMode) => {
    if (mode === settings.accelerate.mode) return;
    metronome.stop(); // 途中でモードを変えると数え方が変わるので、いったん止める
    patch({ accelerate: { ...settings.accelerate, mode, interval: DEFAULT_INTERVAL[mode] } });
  };

  const persist = (next: Preset[]) => {
    setPresets(next);
    setSaveFailed(!savePresets(next));
  };

  // 同じ名前のプリセットがあれば上書きする
  const savePreset = (name: string) => {
    const existing = presets.find((p) => p.name === name);
    const preset = existing ? { ...createPreset(name, settings), id: existing.id } : createPreset(name, settings);
    persist(existing ? presets.map((p) => (p.id === existing.id ? preset : p)) : [...presets, preset]);
    setSelectedId(preset.id);
  };

  const selectPreset = (id: string) => {
    setSelectedId(id);
    const preset = presets.find((p) => p.id === id);
    if (!preset) return;
    metronome.stop();
    setSettings(toSettings(preset));
  };

  const deletePreset = (id: string) => {
    persist(presets.filter((p) => p.id !== id));
    setSelectedId('');
  };

  return (
    <main className="app">
      <header>
        <h1>Drum Tempo Accelerator</h1>
        <PresetBar
          presets={presets}
          selectedId={selectedId}
          onSelect={selectPreset}
          onSave={savePreset}
          onDelete={deletePreset}
        />
        {saveFailed && <p className="warning">このブラウザでは保存できませんでした（プライベートブラウズ等）。</p>}
      </header>

      <section className="stage">
        <BeatDisplay
          meter={settings.meter}
          polyrhythm={settings.polyrhythm}
          accent={settings.accent}
          activeBeat={metronome.activeBeat}
          activePoly={metronome.activePoly}
        />
        <TempoDisplay
          settings={settings}
          isPlaying={metronome.isPlaying}
          playingBpm={metronome.playingBpm}
          countdown={metronome.countdown}
          onBpmChange={(bpm) => patch({ bpm })}
        />
      </section>

      <section className="panel">
        <MeterControls settings={settings} onChange={patch} />
        <AccelControls
          config={settings.accelerate}
          isPlaying={metronome.isPlaying}
          onChange={(accelerate) => patch({ accelerate })}
          onModeChange={changeMode}
        />
      </section>

      <button
        className={`play-btn ${metronome.isPlaying ? 'playing' : ''}`}
        onClick={metronome.isPlaying ? metronome.stop : metronome.start}
      >
        {metronome.isPlaying ? '■ ストップ' : '▶ スタート'}
      </button>

      {metronome.reachedTarget && (
        <Modal
          title="目標BPMに到達"
          onClose={metronome.clearReachedTarget}
          actions={<button className="small-btn" onClick={metronome.clearReachedTarget}>閉じる</button>}
        >
          <p className="achievement">{settings.accelerate.targetBpm} BPM</p>
          <p>{settings.accelerate.startBpm} から {settings.accelerate.targetBpm} まで叩ききりました。</p>
        </Modal>
      )}
    </main>
  );
}
