import { groupingOptions } from '../logic/pattern';
import type { Meter, Settings } from '../logic/types';

type Props = {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
};

const BEAT_CHOICES = Array.from({ length: 16 }, (_, i) => i + 1);
const POLY_CHOICES = [2, 3, 4, 5, 6, 7, 8, 9];

export function MeterControls({ settings, onChange }: Props) {
  const { meter, polyrhythm, accent } = settings;
  const options = meter.unit === 8 ? groupingOptions(meter.beats) : [];
  const groupKey = meter.groups?.join('+') ?? '';

  // 拍子を変えたら区切りは合わなくなるので、区切りなしに戻す。
  // 拍数と同じ数のポリリズムは拍と重なるだけなので、オフにする。
  const setMeter = (patch: Partial<Meter>) => {
    const next = { ...meter, ...patch, groups: null };
    onChange({ meter: next, polyrhythm: polyrhythm === next.beats ? null : polyrhythm });
  };

  return (
    <div className="panel-grid">
      <label className="field">
        <span>拍子</span>
        <div className="meter-select">
          <select value={meter.beats} onChange={(e) => setMeter({ beats: Number(e.target.value) })}>
            {BEAT_CHOICES.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <span className="slash">/</span>
          <select value={meter.unit} onChange={(e) => setMeter({ unit: Number(e.target.value) as 4 | 8 })}>
            <option value={4}>4</option>
            <option value={8}>8</option>
          </select>
        </div>
      </label>

      <label className="field">
        <span>区切り</span>
        <select
          value={groupKey}
          disabled={options.length === 0}
          onChange={(e) =>
            onChange({ meter: { ...meter, groups: e.target.value ? e.target.value.split('+').map(Number) : null } })
          }
        >
          <option value="">なし</option>
          {options.map((g) => {
            const key = g.join('+');
            return <option key={key} value={key}>{key}</option>;
          })}
        </select>
      </label>

      <label className="field">
        <span>ポリリズム</span>
        <select
          value={polyrhythm ?? ''}
          onChange={(e) => onChange({ polyrhythm: e.target.value ? Number(e.target.value) : null })}
        >
          <option value="">オフ</option>
          {POLY_CHOICES.filter((n) => n !== meter.beats).map((n) => (
            <option key={n} value={n}>{meter.beats}:{n}</option>
          ))}
        </select>
      </label>

      <div className="field">
        <span>アクセント</span>
        <button
          className={`toggle ${accent ? 'on' : ''}`}
          aria-pressed={accent}
          onClick={() => onChange({ accent: !accent })}
        >
          {accent ? 'ON' : 'OFF'}
        </button>
      </div>
    </div>
  );
}
