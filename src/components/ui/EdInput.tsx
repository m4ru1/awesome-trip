import type { CSSProperties, ReactNode } from 'react';

interface EdInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  /** HTML input type — defaults to "text". */
  type?: string;
  style?: CSSProperties;
}

/**
 * Styled text input for the editor panel.
 * Matches the design-system aesthetic with soft border, rounded corners, and brand focus ring.
 */
export default function EdInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  style,
}: EdInputProps): ReactNode {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="num"
      style={{
        width: '100%',
        padding: '9px 12px',
        fontSize: 14,
        fontFamily: 'var(--font-cn-body)',
        color: 'var(--color-ink)',
        background: '#fff',
        border: '1.5px solid var(--color-line)',
        borderRadius: 'var(--radius-btn)',
        outline: 'none',
        transition: 'border-color .2s, box-shadow .2s',
        ...style,
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-brand)';
        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,107,92,.15)';
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-line)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    />
  );
}
