import { groupStarts } from '../logic/pattern';
import type { Meter } from '../logic/types';

type Props = {
  meter: Meter;
  polyrhythm: number | null;
  accent: boolean;
  activeBeat: number;
  activePoly: number;
};

// 1小節を左から右への時間の線として描く。拍とポリリズムの音は、鳴る位置に置く。
// 左端と右端の余白をそろえるため、全体を拍の間隔の半分だけ右にずらす（拍は (i + 0.5) / 拍数 の位置）。
// ポリリズムも同じだけずらすので、小節の頭で拍とポリリズムの1つ目が縦にそろったままになる。
export function BeatDisplay({ meter, polyrhythm, accent, activeBeat, activePoly }: Props) {
  const starts = groupStarts(meter);
  const beats = Array.from({ length: meter.beats }, (_, i) => i);
  const polys = polyrhythm ? Array.from({ length: polyrhythm }, (_, j) => j) : [];
  const offset = 0.5 / meter.beats;
  const at = (t: number) => `${(t + offset) * 100}%`;

  const beatClass = (i: number) => {
    const kind = accent && i === 0 ? 'downbeat' : accent && starts.has(i) ? 'group' : 'beat';
    return `beat-dot ${kind} ${i === activeBeat ? 'active' : ''}`;
  };

  return (
    <div className="beat-display" aria-hidden="true">
      <div className="beat-track">
        {beats.map((i) => (
          <span key={i} className={beatClass(i)} style={{ left: at(i / meter.beats) }} />
        ))}
      </div>
      {polys.length > 0 && (
        <div className="beat-track poly">
          {polys.map((j) => (
            <span
              key={j}
              className={`poly-dot ${j === activePoly ? 'active' : ''}`}
              style={{ left: at(j / polys.length) }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
