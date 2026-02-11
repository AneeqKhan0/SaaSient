import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '../shared/hooks';
import { clamp } from '../shared/utils';

export function useCardGlow() {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  const [hovered, setHovered] = useState(false);
  const [suspendGlow, setSuspendGlow] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const onMove = (e: PointerEvent) => {
      if (reducedMotion || suspendGlow) return;

      const r = el.getBoundingClientRect();
      const x = clamp(e.clientX - r.left, 0, r.width);
      const y = clamp(e.clientY - r.top, 0, r.height);

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => setPos({ x, y }));
    };

    const onEnter = () => setHovered(true);
    const onLeave = () => {
      setHovered(false);
      setPos({ x: 0, y: 0 });
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerenter', onEnter);
    el.addEventListener('pointerleave', onLeave);

    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerenter', onEnter);
      el.removeEventListener('pointerleave', onLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [reducedMotion, suspendGlow]);

  return { cardRef, hovered, pos, setSuspendGlow };
}
