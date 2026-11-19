import React, { useEffect, useRef, useState } from 'react';

interface ScrollProgressIndicatorProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
}

const SECTIONS = [
  { id: 'design-work', label: 'Motion Reels' },
  { id: 'three-d-section', label: '3D Graphics' },
  { id: 'offline-footer-section', label: 'Connect' },
];

const BAR_GLOW_RGB = [
  '66, 133, 244',
  '234, 67, 53',
  '251, 188, 4',
  '52, 168, 83',
] as const;

export default function ScrollProgressIndicator({
  containerRef,
}: ScrollProgressIndicatorProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSectionState = (triggeredByScroll: boolean) => {
      const viewportHeight = container.clientHeight || window.innerHeight;
      if (viewportHeight <= 0) {
        setActiveIndex(0);
        setIsVisible(false);
        return;
      }

      const rawPageIndex = Math.round(container.scrollTop / viewportHeight);
      setIsVisible(rawPageIndex >= 1);

      const currentIdx = Math.min(
        SECTIONS.length - 1,
        Math.max(0, rawPageIndex - 1)
      );
      setActiveIndex(currentIdx);

      if (triggeredByScroll) {
        setIsScrolling(true);
        if (scrollTimeoutRef.current !== null) {
          window.clearTimeout(scrollTimeoutRef.current);
        }
        scrollTimeoutRef.current = window.setTimeout(() => {
          setIsScrolling(false);
        }, 400);
      }
    };

    const handleScroll = () => updateSectionState(true);
    const handleResize = () => updateSectionState(false);

    updateSectionState(false);
    container.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      if (scrollTimeoutRef.current !== null) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [containerRef]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div
      role="navigation"
      aria-label="Section navigation"
      aria-hidden={!isVisible}
      className={`fixed right-[-18px] top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-[8px] p-[30px] overflow-visible pointer-events-none bg-transparent select-none transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {SECTIONS.map((section, idx) => {
        const isActive = idx === activeIndex;
        const glowRgb = BAR_GLOW_RGB[idx % BAR_GLOW_RGB.length];
        const barDelayMs = (idx % 4) * 120;
        const glowDelayMs = barDelayMs + 80;
        const barAnimClass = isScrolling
          ? isActive
            ? 'assistant-nav-bar--scroll-active'
            : 'assistant-nav-bar--scroll-inactive'
          : isActive
          ? 'assistant-nav-bar--idle-active'
          : 'assistant-nav-bar--idle-inactive';

        return (
          <button
            key={section.id}
            type="button"
            onClick={() => scrollToSection(section.id)}
            data-cursor="pointer"
            aria-label={`Go to section ${idx + 1}`}
            aria-current={isActive ? 'true' : undefined}
            title={section.label}
            tabIndex={isVisible ? 0 : -1}
            className={`assistant-nav-btn ${
              isVisible ? 'pointer-events-auto' : 'pointer-events-none'
            }`}
            style={
              {
                '--glow': glowRgb,
              } as React.CSSProperties
            }
          >
            <span
              className={`assistant-nav-bar ${barAnimClass}`}
              style={
                {
                  '--bar-delay': `${barDelayMs}ms`,
                  '--glow-delay': `${glowDelayMs}ms`,
                } as React.CSSProperties
              }
            />
          </button>
        );
      })}
    </div>
  );
}
