import { describe, expect, it } from 'vitest';
import { barDuration, buildBarPattern, groupStarts, groupingOptions } from './pattern';
import { barsUntilChange, nextBpm } from './accelerate';
import type { AccelConfig } from './types';

describe('groupingOptions', () => {
  it('7/8 は 2+2+3 / 2+3+2 / 3+2+2 の順', () => {
    expect(groupingOptions(7)).toEqual([[2, 2, 3], [2, 3, 2], [3, 2, 2]]);
  });
  it('5/8 は 2+3 / 3+2', () => {
    expect(groupingOptions(5)).toEqual([[2, 3], [3, 2]]);
  });
  it('2拍と3拍は候補なし', () => {
    expect(groupingOptions(2)).toEqual([]);
    expect(groupingOptions(3)).toEqual([]);
  });
});

describe('groupStarts', () => {
  it('2+2+3 の頭は 0, 2, 4 拍目', () => {
    expect([...groupStarts({ beats: 7, unit: 8, groups: [2, 2, 3] })]).toEqual([0, 2, 4]);
  });
  it('合計が合わない区切りは無視する', () => {
    expect(groupStarts({ beats: 7, unit: 8, groups: [3, 3] }).size).toBe(0);
  });
  it('4分の拍子では区切らない', () => {
    expect(groupStarts({ beats: 4, unit: 4, groups: [2, 2] }).size).toBe(0);
  });
});

describe('buildBarPattern', () => {
  it('7/8 2+2+3 のアクセント', () => {
    const kinds = buildBarPattern({ beats: 7, unit: 8, groups: [2, 2, 3] }, null, true).map((n) => n.kind);
    expect(kinds).toEqual(['downbeat', 'beat', 'group', 'beat', 'group', 'beat', 'beat']);
  });
  it('アクセントOFFなら全部ふつうの拍', () => {
    const kinds = buildBarPattern({ beats: 7, unit: 8, groups: [2, 2, 3] }, null, false).map((n) => n.kind);
    expect(new Set(kinds)).toEqual(new Set(['beat']));
  });
  it('4/4 + 3 で 4:3 の並びになる', () => {
    const notes = buildBarPattern({ beats: 4, unit: 4, groups: null }, 3, true);
    expect(notes.map((n) => [n.kind, Number(n.position.toFixed(3))])).toEqual([
      ['downbeat', 0],
      ['poly', 0],
      ['beat', 0.25],
      ['poly', 0.333],
      ['beat', 0.5],
      ['poly', 0.667],
      ['beat', 0.75],
    ]);
  });
});

describe('barDuration', () => {
  it('4拍 BPM120 は2秒、7拍 BPM120 は3.5秒', () => {
    expect(barDuration(4, 120)).toBe(2);
    expect(barDuration(7, 120)).toBe(3.5);
  });
});

const config = (patch: Partial<AccelConfig>): AccelConfig => ({
  mode: 'bars',
  startBpm: 100,
  targetBpm: 160,
  interval: 4,
  amount: 5,
  ...patch,
});

describe('barsUntilChange', () => {
  it('小節ごとは設定した小節数', () => {
    expect(barsUntilChange(config({ mode: 'bars', interval: 4 }), 2)).toBe(4);
  });
  it('秒ごとは、秒数が経ったあとの最初の小節の頭まで', () => {
    expect(barsUntilChange(config({ mode: 'time', interval: 10 }), 2)).toBe(5); // ちょうど
    expect(barsUntilChange(config({ mode: 'time', interval: 10 }), 3.5)).toBe(3); // 10.5秒で変わる
    expect(barsUntilChange(config({ mode: 'time', interval: 1 }), 3.5)).toBe(1); // 最低1小節
  });
});

describe('nextBpm', () => {
  it('目標を超えない', () => {
    expect(nextBpm(config({}), 100)).toBe(105);
    expect(nextBpm(config({}), 158)).toBe(160);
  });
  it('目標に着いていたら終わり', () => {
    expect(nextBpm(config({}), 160)).toBeNull();
  });
});
