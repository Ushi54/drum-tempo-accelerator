import type { AccelConfig } from './types';

// テンポは小節の頭でしか変えない。そのため「小節ごと」も「秒ごと」も、
// 最後は「あと何小節で変えるか」に置き換えて扱う。
// 秒ごとのときは、設定した秒数が経ったあとの最初の小節の頭で変える。
export function barsUntilChange(config: AccelConfig, barSeconds: number): number {
  if (config.mode === 'bars') return Math.max(1, Math.round(config.interval));
  // 1e-9 は割り算の誤差で 4.0000001 小節のようになり、1小節多く数えるのを防ぐため
  return Math.max(1, Math.ceil(config.interval / barSeconds - 1e-9));
}

// 次のBPM。すでに目標に着いていたら null（練習の終わり）を返す。
export function nextBpm(config: AccelConfig, bpm: number): number | null {
  if (bpm >= config.targetBpm) return null;
  return Math.min(config.targetBpm, bpm + config.amount);
}
