import { useState, useRef, useCallback, CSSProperties, MouseEvent } from 'react';

interface UseMagneticOptions {
  maxDisplacement?: number; // max pixels to pull in X/Y (default 8)
  scale?: number;           // scale factor on hover (default 1.15)
  damping?: number;         // pull sensitivity factor 0 to 1 (default 0.35)
}

export function useMagnetic<T extends HTMLElement = HTMLElement>(options: UseMagneticOptions = {}) {
  const { maxDisplacement = 8, scale = 1.15, damping = 0.35 } = options;
  const ref = useRef<T>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: MouseEvent<T>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distanceX = (e.clientX - centerX) * damping;
    const distanceY = (e.clientY - centerY) * damping;

    setOffset({
      x: Math.max(-maxDisplacement, Math.min(maxDisplacement, distanceX)),
      y: Math.max(-maxDisplacement, Math.min(maxDisplacement, distanceY)),
    });
    setIsHovered(true);
  }, [damping, maxDisplacement]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setOffset({ x: 0, y: 0 });
    setIsHovered(false);
  }, []);

  const style: CSSProperties = {
    transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${isHovered ? scale : 1})`,
    transition: isHovered
      ? 'transform 120ms cubic-bezier(0.2, 0, 0.2, 1)'
      : 'transform 350ms cubic-bezier(0.34, 1.56, 0.64, 1)',
    willChange: 'transform',
  };

  return {
    ref,
    style,
    isHovered,
    onMouseMove: handleMouseMove,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
  };
}
