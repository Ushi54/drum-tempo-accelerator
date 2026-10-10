import type { ReactNode } from 'react';

type Props = {
  title: string;
  children?: ReactNode;
  actions: ReactNode;
  onClose: () => void;
};

export function Modal({ title, children, actions, onClose }: Props) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        {children}
        <div className="modal-actions">{actions}</div>
      </div>
    </div>
  );
}
