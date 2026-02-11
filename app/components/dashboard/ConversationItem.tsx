'use client';

import { CSSProperties, useState, useRef, useEffect } from 'react';
import { colors, borderRadius } from '../shared/constants';

type ConversationItemProps = {
  name: string;
  label?: string;
  isActive: boolean;
  nickname?: string;
  onNicknameChange?: (newNickname: string) => void;
};

export function ConversationItem({ name, label, isActive, nickname, onNicknameChange }: ConversationItemProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(nickname || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commitNickname = () => {
    const trimmed = draft.trim();
    onNicknameChange?.(trimmed);
    setEditing(false);
  };

  return (
    <div>
      <div style={styles.nameRow}>
        <div style={styles.name}>{name}</div>
      </div>
      <div style={styles.label}>{label || '—'}</div>

      {/* Nickname / Tag */}
      {editing ? (
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitNickname}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitNickname();
            if (e.key === 'Escape') { setDraft(nickname || ''); setEditing(false); }
          }}
          placeholder="Add tag…"
          style={styles.nickInput}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <div
          style={{
            ...styles.nickTag,
            ...(nickname ? styles.nickTagFilled : {}),
          }}
          onClick={(e) => {
            e.stopPropagation();
            setDraft(nickname || '');
            setEditing(true);
          }}
          title="Click to add/edit tag"
        >
          {nickname ? `🏷️ ${nickname}` : '+ Add tag'}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  nameRow: { minWidth: 0 },
  name: {
    fontWeight: 950,
    fontSize: 14,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  label: {
    marginTop: 6,
    fontSize: 12,
    color: colors.text.secondary,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  nickTag: {
    marginTop: 6,
    fontSize: 11,
    color: colors.text.tertiary,
    cursor: 'pointer',
    padding: '3px 8px',
    borderRadius: borderRadius.xs,
    border: '1px dashed rgba(255,255,255,0.15)',
    display: 'inline-block',
    transition: 'all 0.15s ease',
  },
  nickTagFilled: {
    color: 'rgba(0,180,255,0.9)',
    border: '1px solid rgba(0,153,249,0.25)',
    background: 'rgba(0,153,249,0.08)',
  },
  nickInput: {
    marginTop: 6,
    fontSize: 11,
    color: '#fff',
    padding: '4px 8px',
    borderRadius: borderRadius.xs,
    border: '1px solid rgba(0,153,249,0.4)',
    background: 'rgba(0,0,0,0.4)',
    outline: 'none',
    width: '100%',
    maxWidth: 160,
  },
};