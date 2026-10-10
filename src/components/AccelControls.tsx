import { BPM_MAX, BPM_MIN, type AccelConfig, type AccelMode } from '../logic/types';
import { NumberField } from './NumberField';

type Props = {
  config: AccelConfig;
  isPlaying: boolean;
  onChange: (config: AccelConfig) => void;
  onModeChange: (mode: AccelMode) => void;
};

const MODES: { mode: AccelMode; label: string }[] = [
  { mode: 'off', label: 'オフ' },
  { mode: 'bars', label: '小節ごと' },
  { mode: 'time', label: '秒ごと' },
];

// 再生中は設定を変えられないようにする（途中で変えると、残りの表示と実際の動きがずれるため）
export function AccelControls({ config, isPlaying, onChange, onModeChange }: Props) {
  const set = (patch: Partial<AccelConfig>) => onChange({ ...config, ...patch });

  // 開始を目標以上にしたら、目標を開始より上に押し上げる
  const setStart = (startBpm: number) =>
    set({ startBpm, targetBpm: Math.max(config.targetBpm, Math.min(BPM_MAX, startBpm + config.amount)) });

  return (
    <div className="accel">
      <div className="field-label">自動テンポアップ</div>
      <div className="segmented" role="group" aria-label="自動テンポアップ">
        {MODES.map(({ mode, label }) => (
          <button
            key={mode}
            className={config.mode === mode ? 'selected' : ''}
            aria-pressed={config.mode === mode}
            onClick={() => onModeChange(mode)}
          >
            {label}
          </button>
        ))}
      </div>

      {config.mode !== 'off' && (
        <div className="accel-fields">
          <div className="accel-row">
            <NumberField label="開始BPM" value={config.startBpm} min={BPM_MIN} max={BPM_MAX - 1} onChange={setStart} disabled={isPlaying} />
            <span>→</span>
            <NumberField label="目標BPM" value={config.targetBpm} min={config.startBpm + 1} max={BPM_MAX} onChange={(targetBpm) => set({ targetBpm })} disabled={isPlaying} />
            <span>BPM</span>
          </div>
          <div className="accel-row">
            <NumberField
              label={config.mode === 'bars' ? '加速の間隔（小節）' : '加速の間隔（秒）'}
              value={config.interval}
              min={1}
              max={config.mode === 'bars' ? 100 : 300}
              onChange={(interval) => set({ interval })}
              disabled={isPlaying}
            />
            <span>{config.mode === 'bars' ? '小節ごとに +' : '秒ごとに +'}</span>
            <NumberField label="1回に上げるBPM" value={config.amount} min={1} max={50} onChange={(amount) => set({ amount })} disabled={isPlaying} />
          </div>
        </div>
      )}
    </div>
  );
}
