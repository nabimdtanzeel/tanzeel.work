import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  useMotionValue,
  MotionValue,
} from 'motion/react';

interface ParallaxContextType {
  containerRef: React.RefObject<HTMLDivElement | null>;
  scrollRoot: HTMLElement | null;
  smoothScrollY: MotionValue<number>;
  viewportHeight: number;
  isMobile: boolean;
  isReducedMotion: boolean;
}

const ParallaxContext = createContext<ParallaxContextType | null>(null);

export function useParallax() {
  const ctx = useContext(ParallaxContext);
  if (!ctx) {
    throw new Error('useParallax must be used within ParallaxProvider');
  }
  return ctx;
}

interface ParallaxProviderProps {
  children: React.ReactNode;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function ParallaxProvider({ children, containerRef }: ParallaxProviderProps) {
  const rawScrollY = useMotionValue(0);
  const [scrollRoot, setScrollRoot] = useState<HTMLElement | null>(null);

  const [viewportHeight, setViewportHeight] = useState(() =>
    typeof window !== 'undefined' ? window.innerHeight : 900
  );
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setViewportHeight(window.innerHeight);
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    setScrollRoot(container);
    if (!container) return;

    const handleScroll = () => {
      rawScrollY.set(container.scrollTop);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [containerRef, rawScrollY]);

  return (
    <ParallaxContext.Provider
      value={{
        containerRef,
        scrollRoot,
        smoothScrollY: rawScrollY,
        viewportHeight,
        isMobile,
        isReducedMotion: false,
      }}
    >
      {children}
    </ParallaxContext.Provider>
  );
}

export interface ParallaxLayerProps {
  pageIndex?: number;
  layer?: 'background' | 'midground' | 'foreground' | 'heading';
  isContact?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export function ParallaxLayer({
  className = '',
  style: userStyle = {},
  children,
}: ParallaxLayerProps) {
  return (
    <div
      style={userStyle}
      className={className}
    >
      {children}
    </div>
  );
}
