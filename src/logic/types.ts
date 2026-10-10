export type Meter = {
  beats: number; // 拍子の分子（1〜16）
  unit: 4 | 8; // 拍子の分母。BPMはこの音符を1拍として数える
  groups: number[] | null; // 8分の拍子の区切り（例 [2, 2, 3]）。null は区切りなし
};

export type AccelMode = 'off' | 'bars' | 'time';

export type AccelConfig = {
  mode: AccelMode;
  startBpm: number;
  targetBpm: number;
  interval: number; // 小節数 または 秒数
  amount: number; // 1回に上げるBPM
};

export type Settings = {
  meter: Meter;
  polyrhythm: number | null; // 1小節に重ねる音の数（2〜9）。null はオフ
  accent: boolean;
  bpm: number; // 自動テンポアップがオフのときのBPM
  accelerate: AccelConfig;
};

export type Preset = Settings & {
  id: string;
  name: string;
  createdAt: string;
};

export const BPM_MIN = 30;
export const BPM_MAX = 300;
