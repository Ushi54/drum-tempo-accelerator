import { barsUntilChange, nextBpm } from '../logic/accelerate';
import { barDuration, buildBarPattern, type PatternNote } from '../logic/pattern';
import type { Settings } from '../logic/types';
import { playClick } from './click';

const LOOKAHEAD_MS = 25; // 予約の見回りをする間隔
const SCHEDULE_AHEAD_SEC = 0.1; // どこまで先の音を予約しておくか

// 画面に知らせる出来事。音を予約した時点ではなく、time になって音が聞こえた時点で画面に反映する。
export type EngineEvent =
  | { type: 'note'; time: number; note: PatternNote }
  | { type: 'bar'; time: number; bpm: number; barsLeft: number; changeAt: number; finishes: boolean }
  | { type: 'finish'; time: number };

// 音を鳴らす本体。React とは切り離してあり、画面の再描画が遅れても音はずれない。
export class MetronomeEngine {
  private ctx: AudioContext | null = null;
  private timer: number | null = null;
  private running = false;
  private settings: Settings;

  private bpm = 120;
  private pattern: PatternNote[] = [];
  private noteIndex = 0; // 今の小節で、次に予約する音の番号
  private cursorPos = 0; // 最後に予約した音の、小節の中の位置（0〜1）
  private cursorTime = 0; // その音が鳴る時刻
  private barsLeft = 0; // 次にテンポを変えるまでの小節数（今の小節を含む）

  readonly events: EngineEvent[] = [];

  constructor(settings: Settings) {
    this.settings = settings;
  }

  now(): number {
    return this.ctx?.currentTime ?? 0;
  }

  async start(settings: Settings): Promise<void> {
    this.settings = settings;
    // iPhone のマナーモード中でも音が出るようにする（対応しているブラウザだけ）
    const nav = navigator as Navigator & { audioSession?: { type: string } };
    if (nav.audioSession) nav.audioSession.type = 'playback';

    this.ctx ??= new AudioContext();
    if (this.ctx.state === 'suspended') await this.ctx.resume();

    this.stop();
    this.running = true;
    this.bpm = settings.accelerate.mode === 'off' ? settings.bpm : settings.accelerate.startBpm;
    this.barsLeft = 0;
    this.startBar(this.ctx.currentTime + 0.05, true);
    this.tick();
  }

  stop(): void {
    this.running = false;
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
    this.events.length = 0;
  }

  // 拍子・ポリリズム・アクセントの変更は次の小節から。手動のBPM変更はすぐ反映する。
  update(settings: Settings): void {
    this.settings = settings;
    if (this.running && settings.accelerate.mode === 'off') this.bpm = settings.bpm;
  }

  private barSeconds(): number {
    return barDuration(this.settings.meter.beats, this.bpm);
  }

  // 小節の中の位置 pos の音が鳴る時刻。最後に予約した音からの差を今のBPMで足す。
  // こうしておくと、小節の途中で手動でBPMを変えても、そこから先だけ新しい速さになる。
  private timeAt(pos: number): number {
    return this.cursorTime + (pos - this.cursorPos) * this.barSeconds();
  }

  private tick = (): void => {
    const ctx = this.ctx;
    if (!ctx || !this.running) return;

    while (this.running) {
      const pos = this.noteIndex < this.pattern.length ? this.pattern[this.noteIndex].position : 1;
      const time = this.timeAt(pos);
      if (time >= ctx.currentTime + SCHEDULE_AHEAD_SEC) break;

      if (pos < 1) {
        const note = this.pattern[this.noteIndex++];
        this.cursorPos = pos;
        this.cursorTime = time;
        playClick(ctx, note.kind, time);
        this.events.push({ type: 'note', time, note });
      } else {
        this.startBar(time, false); // 小節が終わった
      }
    }

    if (this.running) this.timer = window.setTimeout(this.tick, LOOKAHEAD_MS);
  };

  // 小節の頭の処理。テンポを変えるのはここだけ。
  private startBar(time: number, first: boolean): void {
    const accel = this.settings.accelerate;

    if (accel.mode !== 'off') {
      if (!first) this.barsLeft--;
      if (first || this.barsLeft <= 0) {
        if (!first) {
          const next = nextBpm(accel, this.bpm);
          if (next === null) {
            this.running = false;
            this.events.push({ type: 'finish', time });
            return;
          }
          this.bpm = next;
        }
        this.barsLeft = barsUntilChange(accel, this.barSeconds());
      }
    }

    this.pattern = buildBarPattern(this.settings.meter, this.settings.polyrhythm, this.settings.accent);
    this.noteIndex = 0;
    this.cursorPos = 0;
    this.cursorTime = time;

    this.events.push({
      type: 'bar',
      time,
      bpm: this.bpm,
      barsLeft: this.barsLeft,
      changeAt: time + this.barsLeft * this.barSeconds(),
      finishes: accel.mode !== 'off' && this.bpm >= accel.targetBpm,
    });
  }
}
