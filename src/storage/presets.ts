import type { Preset, Settings } from '../logic/types';

// 版番号 v1 は、あとでプリセットの形を変えたときに古いデータと区別するため
const KEY = 'dta.presets.v1';

function isPreset(value: unknown): value is Preset {
  if (!value || typeof value !== 'object') return false;
  const p = value as Partial<Preset>;
  return typeof p.id === 'string' && typeof p.name === 'string' && !!p.meter && !!p.accelerate;
}

// プライベートブラウズなどで localStorage が使えないこともあるので、失敗しても止まらないようにする
export function loadPresets(): Preset[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const data: unknown = JSON.parse(raw);
    return Array.isArray(data) ? data.filter(isPreset) : [];
  } catch {
    return [];
  }
}

export function savePresets(presets: Preset[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(presets));
    return true;
  } catch {
    return false;
  }
}

// crypto.randomUUID は https か localhost でしか使えないので、使えないときは代わりのIDを作る
function newId(): string {
  return crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function createPreset(name: string, settings: Settings): Preset {
  return { ...settings, id: newId(), name, createdAt: new Date().toISOString() };
}

// プリセットから設定だけを取り出す（id や name を設定に混ぜないため）
export function toSettings(preset: Preset): Settings {
  const { meter, polyrhythm, accent, bpm, accelerate } = preset;
  return { meter, polyrhythm, accent, bpm, accelerate };
}
