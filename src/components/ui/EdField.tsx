import type { ReactNode } from 'react';
import EdLabel from './EdLabel';

interface EdFieldProps {
  /** Field label text. */
  label: string;
  /** Optional hint rendered below the label. */
  hint?: string;
  /** The input / control element(s). */
  children: ReactNode;
}

/**
 * Editor form field wrapper: renders a label (with optional hint) above the children.
 * Adds consistent spacing between fields.
 */
export default function EdField({ label, hint, children }: EdFieldProps): ReactNode {
  return (
    <div style={{ marginBottom: 16 }}>
      <EdLabel label={label} hint={hint} />
      {children}
    </div>
  );
}
