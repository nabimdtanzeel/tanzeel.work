import React, { useState, useRef, useEffect } from 'react';
import { getAllGraphicsFromDB } from '../lib/graphicsStorage';
import { ParallaxLayer } from '../context/ParallaxContext';
import { useMagnetic } from '../hooks/useMagnetic';
import { Split } from '../lib/replayAnim';
import CurvedGraphicsStage from './CurvedGraphicsStage';
import ArtworkDetailOverlay, { PortfolioArtworkItem } from './ArtworkDetailOverlay';

interface GraphicsPortfolioSectionProps {
  onNavigateToTop?: () => void;
  onNavigateToPage2?: () => void;
  onNavigateToPage4?: () => void;
}

interface GraphicSlot {
  slot: number;
  title: string;
  description: string;
  imageUrl: string | null;
}

function MagneticHomeButton({
  onClick,
}: {
  onClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  const { ref, style, onMouseMove, onMouseEnter, onMouseLeave, isHovered } =
    useMagnetic<HTMLAnchorElement>({
      maxDisplacement: 8,
      scale: 1.2,
      damping: 0.35,
    });

  return (
    <a
      ref={ref}
      href="#hero"
      onClick={onClick}
      onMouseMove={onMouseMove}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      data-cursor="pointer"
      className="text-2xl sm:text-3xl tracking-tight text-foreground transition-colors duration-250 ease-out inline-flex items-baseline cursor-pointer origin-left"
      style={{
        ...style,
        fontFamily: "'Instrument Serif', serif",
        color: isHovered ? '#FFFFFF' : undefined,
      }}
    >
      HOME
    </a>
  );
}

function MagneticNavLinkButton({
  children,
  onClick,
  className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const { ref, style, onMouseMove, onMouseEnter, onMouseLeave } =
    useMagnetic<HTMLButtonElement>({
      maxDisplacement: 7,
      scale: 1.2,
      damping: 0.35,
    });

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      onMouseMove={onMouseMove}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      data-cursor="pointer"
      style={style}
      className={`text-muted-foreground hover:text-white transition-colors duration-200 cursor-pointer inline-block origin-center px-2.5 py-1 rounded-md hover:bg-white/10 ${className}`}
    >
      {children}
    </button>
  );
}

const BASE_GRAPHICS: GraphicSlot[] = [
  {
    slot: 1,
    title: 'LOVE WORK',
    description:
      'Layered typographic composition exploring bold chromatic contrast, sculptural depth, and editorial balance.',
    imageUrl: 'https://res.cloudinary.com/fe0ahalt/image/upload/v1794858149/lovework.png',
  },
  {
    slot: 2,
    title: 'DENIM',
    description:
      'Tactile fabric and light study blending contemporary streetwear silhouettes with subtle surface grain.',
    imageUrl:
      'https://res.cloudinary.com/fe0ahalt/image/upload/v1794858149/denim_0-00-00-00__1.png',
  },
  {
    slot: 3,
    title: 'STRAWBERRY FRAPPE',
    description:
      'Playful commercial product render pairing glossy fluid textures with vibrant studio color grading.',
    imageUrl:
      'https://res.cloudinary.com/fe0ahalt/image/upload/v1794858148/strawberryfrappe-Recovered.png',
  },
  {
    slot: 4,
    title: 'DELHI Delhiying',
    description:
      'Experimental graphic study built around asymmetric framing, atmospheric tone, and clean geometry.',
    imageUrl: 'https://res.cloudinary.com/fe0ahalt/image/upload/v1794858148/design-1.jpg.png',
  },
  {
    slot: 5,
    title: 'The INTROVERT Story',
    description:
      'Character-driven illustration balancing minimalist silhouette forms with quiet contemplative mood.',
    imageUrl:
      'https://res.cloudinary.com/fe0ahalt/image/upload/v1794858147/introvertillustration.png',
  },
  {
    slot: 6,
    title: 'FIIT FORWARD 2026',
    description:
      'Visual composition study combining layered atmospheric lighting, crisp framing, and tonal depth.',
    imageUrl:
      'https://res.cloudinary.com/fe0ahalt/image/upload/v1795421062/Comp_1_0-00-05-26__1.png',
  },
];

const EXTRA_TITLES = [
  {
    title: 'LOVE WORK // II',
    description:
      'Alternate spatial framing highlighting multi-plane depth layering and rich mid-tone contrast.',
  },
  {
    title: 'DENIM // STUDY',
    description:
      'Close-range tonal material study focused on textile weave texture and crisp specular rim light.',
  },
  {
    title: 'FRAPPE // EDITION',
    description:
      'Color-graded key visual variation developed for high-impact motion and digital campaign tiles.',
  },
  {
    title: 'DELHI Delhiying',
    description:
      'Modular poster layout iteration exploring spatial rhythm, negative space, and stark tonal contrast.',
  },
  {
    title: 'The INTROVERT Story',
    description:
      'Editorial silhouette treatment emphasizing expressive posture, soft gradient light, and stillness.',
  },
  {
    title: 'FIIT FORWARD 2026',
    description:
      'Alternate sequence frame accentuating sculptural contrast, clean edge lighting, and spatial mood.',
  },
];

export default function GraphicsPortfolioSection({
  onNavigateToTop,
  onNavigateToPage2,
  onNavigateToPage4,
}: GraphicsPortfolioSectionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.volume = 0;
    }
  }, []);

  const videoSrc = '/videos/threed-bg.mp4';
  const fallbackSrc =
    'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261023_005028_9d693c33-2376-446e-bbc2-acb4c9ecf815.mp4';

  const [graphics, setGraphics] = useState<GraphicSlot[]>(BASE_GRAPHICS);
  const [selectedArtwork, setSelectedArtwork] = useState<PortfolioArtworkItem | null>(null);

  useEffect(() => {
    getAllGraphicsFromDB().then((stored) => {
      if (stored && stored.length > 0) {
        setGraphics((prev) =>
          prev.map((g) => {
            const found = stored.find((item) => item.slot === g.slot);
            if (found && found.imageUrl && found.imageUrl.startsWith('data:image/')) {
              return { ...g, imageUrl: found.imageUrl };
            }
            return g;
          })
        );
      }
    });

    fetch('/api/get-3d-graphics')
      .then((res) => res.json())
      .then((data: { graphics: { slot: number; path: string }[] }) => {
        if (data && data.graphics && data.graphics.length > 0) {
          setGraphics((prev) =>
            prev.map((g) => {
              const found = data.graphics.find((item) => item.slot === g.slot);
              if (found && found.path && !g.imageUrl) {
                return { ...g, imageUrl: found.path };
              }
              return g;
            })
          );
        }
      })
      .catch(() => {});
  }, []);

  // Build 12-card deck (2 cycles) using the user's images for the infinite curved strip
  const artworks: PortfolioArtworkItem[] = Array.from(
    { length: graphics.length * 2 },
    (_, idx) => {
    const base = graphics[idx % graphics.length];
    const isSecondCycle = idx >= graphics.length;
    const extraMeta = isSecondCycle ? EXTRA_TITLES[idx - graphics.length] : null;
    return {
      slot: idx + 1,
      code: String(idx + 1).padStart(2, '0'),
      title: extraMeta ? extraMeta.title : base.title,
      description: extraMeta ? extraMeta.description : base.description,
      imageUrl: base.imageUrl,
    };
  });

  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onNavigateToTop) {
      onNavigateToTop();
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <section
      id="three-d-section"
      className="w-full h-screen min-h-screen relative overflow-clip flex flex-col justify-between shrink-0 bg-[#000000] text-foreground select-none py-4 sm:py-6"
    >
      {/* Background Layer with Parallax & Bleed */}
      <ParallaxLayer
        pageIndex={2}
        layer="background"
        className="absolute -inset-[8%] w-[116%] h-[116%] pointer-events-none z-0"
      >
        <video
          ref={videoRef}
          src={videoSrc}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onError={(e) => {
            const target = e.currentTarget;
            if (target.src !== fallbackSrc) {
              target.src = fallbackSrc;
              target.play().catch(() => {});
            }
          }}
          className="absolute inset-0 w-full h-full object-cover transform translate-z-0"
        />

        <div className="absolute inset-0 bg-black/30 pointer-events-none z-[1]" />
      </ParallaxLayer>

      {/* Soft top & bottom transitions so no hard edges appear between sections */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-20 sm:h-28 bg-gradient-to-b from-black via-black/45 to-transparent pointer-events-none z-[2]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-20 sm:h-28 bg-gradient-to-t from-black via-black/45 to-transparent pointer-events-none z-[2]"
      />

      {/* WebGL Curved Card Strip Stage */}
      <CurvedGraphicsStage
        artworks={artworks}
        viewMode="strip"
        isDetailOpen={Boolean(selectedArtwork)}
        onSelectArtwork={(art) => setSelectedArtwork(art)}
      />

      {/* Header: HOME (left) */}
      <header className="relative z-20 w-full shrink-0 pointer-events-none">
        <div className="flex flex-row justify-between items-center px-6 sm:px-8 py-2 sm:py-3 max-w-7xl mx-auto w-full">
          <div
            data-anim="drop"
            style={{ '--i': 0 } as React.CSSProperties}
            className="pointer-events-auto"
          >
            <MagneticHomeButton onClick={handleHomeClick} />
          </div>
        </div>
      </header>

      {/* Section Heading (unchanged copy, font, and animations) */}
      <div className="relative z-20 flex flex-col items-center text-center px-3 sm:px-6 max-w-7xl w-full mx-auto pointer-events-none mb-auto pt-1 sm:pt-2">
        <ParallaxLayer pageIndex={2} layer="heading" className="pointer-events-auto">
          <h1
            className="text-[clamp(1.35rem,3.6vw,3rem)] leading-[1.05] tracking-[-0.03em] max-w-4xl font-normal text-foreground cursor-default transition-all duration-300"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            <Split text="Crafting" type="blur-up" start={0} />
            <em className="not-italic text-muted-foreground hover:text-white transition-colors">
              <Split text="dimension" type="flip" start={1} />
            </em>
            <Split text="in" type="blur-up" start={2} />
            <em className="not-italic text-muted-foreground hover:text-white transition-colors">
              <Split text="every" type="flip" start={3} />
              <Split text="render." type="blur-up" start={4} />
            </em>
          </h1>
        </ParallaxLayer>
      </div>

      {/* Footer Navigation */}
      <ParallaxLayer pageIndex={2} layer="foreground" className="relative z-20 w-full shrink-0">
        <footer className="w-full px-4 sm:px-8 py-2 sm:py-3 max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-x-3 gap-y-1 text-[11px] sm:text-xs text-muted-foreground">
          <span data-anim="skew" style={{ '--i': 5 } as React.CSSProperties}>
            5 Artworks Showcase &bull; 3D Portfolio
          </span>
          <div className="flex items-center gap-4">
            <div data-anim="pop" style={{ '--i': 6 } as React.CSSProperties}>
              <MagneticNavLinkButton onClick={onNavigateToPage2}>
                &uarr; Page 2
              </MagneticNavLinkButton>
            </div>
            {onNavigateToPage4 && (
              <div data-anim="drop" style={{ '--i': 7 } as React.CSSProperties}>
                <MagneticNavLinkButton onClick={onNavigateToPage4}>
                  Page 4 &rarr;
                </MagneticNavLinkButton>
              </div>
            )}
          </div>
        </footer>
      </ParallaxLayer>

      {/* Full-Screen Detail Overlay */}
      <ArtworkDetailOverlay
        artwork={selectedArtwork}
        onClose={() => setSelectedArtwork(null)}
      />
    </section>
  );
}
