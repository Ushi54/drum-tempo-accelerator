import type { Meter } from './types';

// downbeat: 小節の頭 / group: 区切りの頭 / beat: ふつうの拍 / poly: ポリリズムの音
export type ClickKind = 'downbeat' | 'group' | 'beat' | 'poly';

export type PatternNote = {
  position: number; // 小節の中の位置（0 = 小節の頭、1 = 次の小節の頭）
  kind: ClickKind;
  index: number; // 何拍目か（poly のときは何個目か）
};

// 拍数を 2 と 3 の組み合わせに分ける候補を、2 を先にして全部返す。
// 7 なら [2,2,3] [2,3,2] [3,2,2]。区切りが1つだけのもの（2/8 や 3/8）は区切りなしと同じなので除く。
export function groupingOptions(beats: number): number[][] {
  const result: number[][] = [];
  const walk = (rest: number, acc: number[]) => {
    if (rest === 0) {
      if (acc.length > 1) result.push(acc);
      return;
    }
    for (const size of [2, 3]) {
      if (size <= rest) walk(rest - size, [...acc, size]);
    }
  };
  walk(beats, []);
  return result;
}

// 区切りの頭が何拍目かを返す。区切りの合計が拍数と合わないときは区切りなしとして扱う。
export function groupStarts(meter: Meter): Set<number> {
  const starts = new Set<number>();
  if (meter.unit !== 8 || !meter.groups) return starts;
  if (meter.groups.reduce((sum, size) => sum + size, 0) !== meter.beats) return starts;
  let pos = 0;
  for (const size of meter.groups) {
    starts.add(pos);
    pos += size;
  }
  return starts;
}

// 拍子・区切り・ポリリズムから、1小節ぶんの音の並びを作る。
export function buildBarPattern(meter: Meter, polyrhythm: number | null, accent: boolean): PatternNote[] {
  const starts = groupStarts(meter);
  const notes: PatternNote[] = [];

  for (let i = 0; i < meter.beats; i++) {
    let kind: ClickKind = 'beat';
    if (accent && i === 0) kind = 'downbeat';
    else if (accent && starts.has(i)) kind = 'group';
    notes.push({ position: i / meter.beats, kind, index: i });
  }

  if (polyrhythm) {
    for (let j = 0; j < polyrhythm; j++) {
      notes.push({ position: j / polyrhythm, kind: 'poly', index: j });
    }
  }

  // 同じ位置なら拍の音が先に来る（sort は安定なので、先に入れた順が残る）
  return notes.sort((a, b) => a.position - b.position);
}

// 1小節の長さ（秒）。BPM は拍子の分母の音符を1拍として数える。
export function barDuration(beats: number, bpm: number): number {
  return (beats * 60) / bpm;
}
