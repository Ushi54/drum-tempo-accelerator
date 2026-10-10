import { useState } from 'react';
import type { Preset } from '../logic/types';
import { Modal } from './Modal';

type Props = {
  presets: Preset[];
  selectedId: string;
  onSelect: (id: string) => void;
  onSave: (name: string) => void;
  onDelete: (id: string) => void;
};

export function PresetBar({ presets, selectedId, onSelect, onSave, onDelete }: Props) {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [name, setName] = useState('');
  const selected = presets.find((p) => p.id === selectedId);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed);
    setSaving(false);
  };

  return (
    <div className="preset-bar">
      <select value={selectedId} onChange={(e) => onSelect(e.target.value)} aria-label="プリセット">
        <option value="">{presets.length ? 'プリセットを選ぶ' : 'プリセットなし'}</option>
        {presets.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <button className="small-btn" onClick={() => { setName(selected?.name ?? ''); setSaving(true); }}>保存</button>
      {selected && (
        <button className="small-btn ghost" onClick={() => setDeleting(true)} aria-label="プリセットを削除">削除</button>
      )}

      {saving && (
        <Modal
          title="プリセットを保存"
          onClose={() => setSaving(false)}
          actions={
            <>
              <button className="small-btn ghost" onClick={() => setSaving(false)}>やめる</button>
              <button className="small-btn" onClick={submit} disabled={!name.trim()}>保存</button>
            </>
          }
        >
          <input
            className="text-input"
            autoFocus
            placeholder="例：7/8 限界突破"
            value={name}
            maxLength={40}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
          <p className="modal-note">いまの設定をこのブラウザに保存します。</p>
        </Modal>
      )}

      {deleting && selected && (
        <Modal
          title="プリセットを削除"
          onClose={() => setDeleting(false)}
          actions={
            <>
              <button className="small-btn ghost" onClick={() => setDeleting(false)}>やめる</button>
              <button className="small-btn danger" onClick={() => { onDelete(selected.id); setDeleting(false); }}>削除</button>
            </>
          }
        >
          <p>「{selected.name}」を削除します。元に戻せません。</p>
        </Modal>
      )}
    </div>
  );
}
