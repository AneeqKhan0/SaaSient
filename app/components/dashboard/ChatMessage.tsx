import { CSSProperties } from 'react';
import { colors, borderRadius } from '../shared/constants';

type ChatMessageProps = {
  sender: 'bot' | 'user' | 'system';
  text: string;
  timestamp?: string | null;
  fontSize?: number;
};

export function ChatMessage({ sender, text, timestamp, fontSize = 13 }: ChatMessageProps) {
  if (sender === 'system') {
    return (
      <div style={styles.systemWrap}>
        <div style={{ ...styles.systemMsg, fontSize }}>{text}</div>
      </div>
    );
  }

  const isUser = sender === 'user';

  return (
    <div
      style={{
        ...styles.msgRow,
        justifyContent: isUser ? 'flex-end' : 'flex-start',
      }}
    >
      <div style={{ ...styles.bubble, ...(isUser ? styles.bubbleUser : styles.bubbleBot) }}>
        <div style={{ ...styles.msgText, fontSize }}>{text}</div>
        {timestamp && <div style={styles.msgTime}>{timestamp}</div>}
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  msgRow: { display: 'flex', marginBottom: 10 },
  bubble: {
    maxWidth: 720,
    borderRadius: borderRadius.lg,
    padding: 12,
    border: `1px solid ${colors.card.border}`,
  },
  bubbleBot: {
    background: 'linear-gradient(135deg, rgba(0,153,249,0.12) 0%, rgba(80,40,180,0.08) 100%)',
    color: colors.text.primary,
    border: '1px solid rgba(0,153,249,0.15)',
  },
  bubbleUser: {
    background: colors.accent,
    color: '#001018',
    border: `1px solid ${colors.card.borderAccent}`,
    boxShadow: '0 10px 30px rgba(0,153,249,0.18)',
  },
  msgText: { lineHeight: 1.45, whiteSpace: 'pre-wrap' as const },
  msgTime: { fontSize: 11, opacity: 0.75, marginTop: 8 },
  systemWrap: { display: 'flex', justifyContent: 'center', marginBottom: 10 },
  systemMsg: {
    color: colors.text.secondary,
    border: '1px dashed rgba(255,255,255,0.18)',
    padding: '8px 10px',
    borderRadius: borderRadius.sm,
    background: 'rgba(0,0,0,0.20)',
  },
};