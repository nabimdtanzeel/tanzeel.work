import { useRef, useEffect, useCallback } from 'react';
import HeroSection from './components/HeroSection';
import VelorahSection from './components/VelorahSection';
import GraphicsPortfolioSection from './components/GraphicsPortfolioSection';
import OfflineFooterSection from './components/OfflineFooterSection';
import CustomCursor from './components/CustomCursor';
import ScrollProgressIndicator from './components/ScrollProgressIndicator';
import { ParallaxProvider } from './context/ParallaxContext';
import { useScrollScrub } from './lib/scrollScrub';
import { useTouchPhysics } from './lib/touchPhysics';

const SECTION_IDS = [
  'hero',
  'design-work',
  'three-d-section',
  'offline-footer-section',
] as const;

export default function App() {
  useScrollScrub();
  useTouchPhysics();
  const containerRef = useRef<HTMLDivElement>(null);
  const activeNavTargetRef = useRef<{ index: number; expiresAt: number } | null>(null);

  const scrollToSection = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      e.preventDefault();

      const now = Date.now();
      const viewportHeight = container.clientHeight || window.innerHeight;
      const settledIndex = Math.min(
        SECTION_IDS.length - 1,
        Math.max(0, Math.round(container.scrollTop / viewportHeight))
      );

      const currentIndex =
        activeNavTargetRef.current && activeNavTargetRef.current.expiresAt > now
          ? activeNavTargetRef.current.index
          : settledIndex;

      const delta = e.key === 'ArrowDown' ? 1 : -1;
      const nextIndex = Math.min(
        SECTION_IDS.length - 1,
        Math.max(0, currentIndex + delta)
      );

      activeNavTargetRef.current = { index: nextIndex, expiresAt: now + 550 };
      if (nextIndex !== currentIndex) {
        scrollToSection(SECTION_IDS[nextIndex]);
      }
    };

    // Attach directly to the main scroll container, with window fallback when body holds focus
    container.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [scrollToSection]);

  return (
    <ParallaxProvider containerRef={containerRef}>
      <CustomCursor />
      <ScrollProgressIndicator containerRef={containerRef} />
      <div
        id="main-scroll-container"
        ref={containerRef}
        tabIndex={0}
        style={{ scrollBehavior: 'auto' }}
        className="w-full h-screen overflow-x-clip overflow-y-scroll bg-black text-white relative outline-none"
      >
      {/* Page 1: Hero */}
      <HeroSection
        onNavigateToDesignWork={() => scrollToSection('design-work')}
        onNavigateTo3D={() => scrollToSection('three-d-section')}
        onNavigateToPage4={() => scrollToSection('offline-footer-section')}
      />

      {/* Page 2: Design Work / Motion Graphics Reels */}
      <VelorahSection
        onNavigateToTop={() => scrollToSection('hero')}
        onNavigateToPage3={() => scrollToSection('three-d-section')}
      />

      {/* Page 3: Original 3D Graphics / Digital Graphics Portfolio */}
      <GraphicsPortfolioSection
        onNavigateToTop={() => scrollToSection('hero')}
        onNavigateToPage2={() => scrollToSection('design-work')}
        onNavigateToPage4={() => scrollToSection('offline-footer-section')}
      />

      {/* Page 4: Cinematic Offline Footer */}
      <OfflineFooterSection
        onNavigateToTop={() => scrollToSection('hero')}
        onNavigateToPage3={() => scrollToSection('three-d-section')}
      />
    </div>
    </ParallaxProvider>
  );
}
