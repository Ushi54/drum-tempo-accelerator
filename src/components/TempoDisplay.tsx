import type { Countdown } from '../hooks/useMetronome';
import { BPM_MAX, BPM_MIN, type Settings } from '../logic/types';
import { NumberField } from './NumberField';

type Props = {
  settings: Settings;
  isPlaying: boolean;
  playingBpm: number;
  countdown: Countdown | null;
  onBpmChange: (bpm: number) => void;
};

function countdownText(settings: Settings, countdown: Countdown | null): string {
  const { mode, startBpm, targetBpm } = settings.accelerate;
  if (!countdown) return `${startBpm} → ${targetBpm} まで自動で上げます`;
  const left = mode === 'time' ? `${countdown.seconds}秒` : `${countdown.bars}小節`;
  return countdown.finishes ? `目標に到達。終了まで あと ${left}` : `次のテンポアップまで あと ${left}`;
}

export function TempoDisplay({ settings, isPlaying, playingBpm, countdown, onBpmChange }: Props) {
  const accelOn = settings.accelerate.mode !== 'off';

  if (accelOn) {
    const bpm = isPlaying ? playingBpm : settings.accelerate.startBpm;
    return (
      <div className="tempo">
        <div className="tempo-value">{bpm}</div>
        <div className="tempo-unit">BPM</div>
        <div className={`countdown ${isPlaying ? 'live' : ''}`}>{countdownText(settings, countdown)}</div>
      </div>
    );
  }

  const step = (delta: number) => onBpmChange(Math.min(BPM_MAX, Math.max(BPM_MIN, settings.bpm + delta)));

  return (
    <div className="tempo">
      <div className="tempo-row">
        <button className="round-btn" onClick={() => step(-1)} aria-label="BPMを1下げる">−</button>
        <NumberField
          className="tempo-value"
          label="BPM"
          value={settings.bpm}
          min={BPM_MIN}
          max={BPM_MAX}
          onChange={onBpmChange}
        />
        <button className="round-btn" onClick={() => step(1)} aria-label="BPMを1上げる">＋</button>
      </div>
      <div className="tempo-unit">BPM（{settings.meter.unit === 8 ? '8分音符' : '4分音符'}）</div>
    </div>
  );
}
