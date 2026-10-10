import { useCallback, useEffect, useRef, useState } from 'react';
import { MetronomeEngine } from '../audio/scheduler';
import type { Settings } from '../logic/types';

export type Countdown = {
  seconds: number; // 次にテンポが変わるまで（または終わるまで）の秒数
  bars: number; // 同じく小節数（今の小節を含む）
  finishes: boolean; // true なら次は「終わり」
};

// 音のエンジンと画面をつなぐ。エンジンが積んだ出来事を、音が聞こえる時刻になったら画面に反映する。
export function useMetronome(settings: Settings) {
  const engineRef = useRef<MetronomeEngine | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [playingBpm, setPlayingBpm] = useState(settings.bpm);
  const [activeBeat, setActiveBeat] = useState(-1);
  const [activePoly, setActivePoly] = useState(-1);
  const [countdown, setCountdown] = useState<Countdown | null>(null);
  const [reachedTarget, setReachedTarget] = useState(false);

  useEffect(() => {
    engineRef.current?.update(settings);
  }, [settings]);

  const stop = useCallback(() => {
    engineRef.current?.stop();
    setIsPlaying(false);
    setActiveBeat(-1);
    setActivePoly(-1);
    setCountdown(null);
  }, []);

  const start = useCallback(async () => {
    const engine = (engineRef.current ??= new MetronomeEngine(settings));
    await engine.start(settings);
    setReachedTarget(false);
    setCountdown(null);
    setIsPlaying(true);
  }, [settings]);

  // 再生中は画面の描き直しのたびに（1秒に約60回）、聞こえる時刻になった出来事を取り出す
  useEffect(() => {
    const engine = engineRef.current;
    if (!isPlaying || !engine) return;

    let frameId = 0;
    let changeAt = 0;

    const loop = () => {
      const now = engine.now();
      const events = engine.events;

      while (events.length && events[0].time <= now) {
        const ev = events.shift()!;
        if (ev.type === 'note') {
          if (ev.note.kind === 'poly') setActivePoly(ev.note.index);
          else setActiveBeat(ev.note.index);
        } else if (ev.type === 'bar') {
          setPlayingBpm(ev.bpm);
          changeAt = ev.changeAt;
          setCountdown((prev) => ({ seconds: prev?.seconds ?? 0, bars: ev.barsLeft, finishes: ev.finishes }));
        } else {
          stop();
          setReachedTarget(true);
          return;
        }
      }

      // 値が変わらなければ React は描き直さない
      const seconds = Math.max(0, Math.ceil(changeAt - now));
      setCountdown((prev) => (prev && prev.seconds !== seconds ? { ...prev, seconds } : prev));

      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [isPlaying, stop]);

  useEffect(() => stop, [stop]);

  return {
    isPlaying,
    start,
    stop,
    playingBpm,
    activeBeat,
    activePoly,
    countdown: settings.accelerate.mode === 'off' ? null : countdown,
    reachedTarget,
    clearReachedTarget: () => setReachedTarget(false),
  };
}
