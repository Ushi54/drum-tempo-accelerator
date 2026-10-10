import type { ClickKind } from '../logic/pattern';

// 拍とポリリズムが同時に鳴っても音が割れないよう、音量は控えめにしている
const SOUNDS: Record<ClickKind, { freq: number; type: OscillatorType; gain: number }> = {
  downbeat: { freq: 1600, type: 'sine', gain: 0.8 },
  group: { freq: 1200, type: 'sine', gain: 0.7 },
  beat: { freq: 800, type: 'sine', gain: 0.55 },
  poly: { freq: 520, type: 'triangle', gain: 0.6 }, // 拍と聞き分けられるよう低く、音色も変える
};

// time（AudioContext の時計）ちょうどに、短いクリック音を1つ鳴らす予約をする
export function playClick(ctx: AudioContext, kind: ClickKind, time: number): void {
  const sound = SOUNDS[kind];
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = sound.type;
  osc.frequency.setValueAtTime(sound.freq, time);
  gain.gain.setValueAtTime(sound.gain, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

  osc.connect(gain).connect(ctx.destination);
  osc.start(time);
  osc.stop(time + 0.06);
}
