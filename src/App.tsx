import { useRef } from 'react';
import HeroSection from './components/HeroSection';
import VelorahSection from './components/VelorahSection';
import GraphicsPortfolioSection from './components/GraphicsPortfolioSection';
import OfflineFooterSection from './components/OfflineFooterSection';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div
      id="main-scroll-container"
      ref={containerRef}
      className="w-screen h-screen overflow-y-scroll snap-y snap-mandatory bg-black text-white relative"
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
  );
}
