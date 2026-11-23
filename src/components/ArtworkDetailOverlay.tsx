import React, { useEffect, useMemo, useRef, useState } from 'react';

export interface PortfolioArtworkItem {
  slot: number;
  code: string;
  title: string;
  description: string;
  imageUrl: string | null;
}

interface ArtworkDetailOverlayProps {
  artwork: PortfolioArtworkItem | null;
  onClose: () => void;
}

const GRID_COLS = 5;
const GRID_ROWS = 7;
const TOTAL_BLOCKS = GRID_COLS * GRID_ROWS;

export default function ArtworkDetailOverlay({
  artwork,
  onClose,
}: ArtworkDetailOverlayProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [imageReady, setImageReady] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Randomized 5x7 block timings over ~750ms
  const blockTimings = useMemo(() => {
    if (!artwork) return [];
    const indices = Array.from({ length: TOTAL_BLOCKS }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    const orderMap = new Array<number>(TOTAL_BLOCKS);
    indices.forEach((cellIdx, rank) => {
      orderMap[cellIdx] = rank;
    });
    return orderMap.map((rank) => {
      const t = rank / Math.max(1, TOTAL_BLOCKS - 1);
      const delayMs = Math.round(70 + t * 540 + (Math.random() - 0.5) * 40);
      return {
        delayMs: Math.max(30, delayMs),
        pixelDurationMs: 130,
      };
    });
  }, [artwork]);

  const [blockStates, setBlockStates] = useState<('dark' | 'pixel' | 'open')[]>(
    () => new Array(TOTAL_BLOCKS).fill('dark')
  );

  // Open reveal & Esc listener (keyed only on artwork so inline onClose never resets state)
  useEffect(() => {
    if (!artwork) {
      setIsRevealed(false);
      setImageReady(false);
      return;
    }

    setIsRevealed(false);
    setImageReady(false);
    setBlockStates(new Array(TOTAL_BLOCKS).fill('dark'));

    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsRevealed(true));
    });

    // If image was already cached synchronously on mount, mark ready immediately
    const checkCached = () => {
      const el = imgRef.current;
      if (el && el.complete && el.naturalWidth > 0) {
        setImageReady(true);
      }
    };
    const cacheCheckId = requestAnimationFrame(checkCached);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onCloseRef.current();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      cancelAnimationFrame(rafId);
      cancelAnimationFrame(cacheCheckId);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [artwork]);

  // Trigger 5x7 random block pixel -> open sequence once image is ready
  useEffect(() => {
    if (!artwork || !imageReady) return;

    const timers: number[] = [];
    blockTimings.forEach((timing, idx) => {
      const tPixel = window.setTimeout(() => {
        setBlockStates((prev) => {
          const next = prev.slice();
          next[idx] = 'pixel';
          return next;
        });
      }, timing.delayMs);

      const tOpen = window.setTimeout(() => {
        setBlockStates((prev) => {
          const next = prev.slice();
          next[idx] = 'open';
          return next;
        });
      }, timing.delayMs + timing.pixelDurationMs);

      timers.push(tPixel, tOpen);
    });

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [artwork, imageReady, blockTimings]);

  if (!artwork) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={artwork.title}
      onClick={onClose}
      style={{
        clipPath: isRevealed ? 'inset(0% 0% 0% 0%)' : 'inset(0% 50% 0% 50%)',
        transition: 'clip-path 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      className="fixed inset-0 z-50 bg-black/90 text-[#F2EDE0] flex flex-col overflow-y-auto select-none"
    >
      {/* Top Bar with CLOSE button at top right */}
      <div className="w-full max-w-7xl mx-auto px-5 sm:px-8 pt-5 sm:pt-7 pb-2 flex items-center justify-between shrink-0">
        <span className="text-[11px] sm:text-xs tracking-[0.22em] uppercase text-[#F2EDE0]/50 font-sans">
          {artwork.code} &bull; 3D / DIGITAL ARCHIVE
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          data-cursor="pointer"
          className="px-4 py-1.5 sm:px-5 sm:py-2 rounded-full border border-white/20 bg-white/[0.04] hover:bg-white/[0.12] hover:border-white/45 text-[11px] sm:text-xs tracking-[0.22em] uppercase text-[#F2EDE0] hover:text-white transition-colors cursor-pointer"
        >
          CLOSE
        </button>
      </div>

      {/* Main Content: 2 columns on desktop, stacked 1 column on mobile */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-6xl mx-auto flex-1 grid grid-cols-1 md:grid-cols-12 items-center gap-6 sm:gap-8 md:gap-12 px-5 sm:px-8 py-4 sm:py-8 my-auto"
      >
        {/* Left side: Large image covered by 5x7 random-vanish block grid */}
        <div className="md:col-span-6 flex items-center justify-center w-full">
          <div className="relative w-full max-w-[320px] sm:max-w-[380px] md:max-w-[440px] aspect-[3/4] max-h-[54vh] md:max-h-[72vh] rounded-[5%] overflow-hidden bg-[#111114] border border-white/12 shadow-2xl">
            {artwork.imageUrl && (
              <img
                ref={imgRef}
                src={artwork.imageUrl}
                alt={artwork.title}
                onLoad={() => setImageReady(true)}
                onError={() => setImageReady(true)}
                className={`w-full h-full object-cover object-center transition-opacity duration-200 ${
                  imageReady ? 'opacity-100' : 'opacity-0'
                }`}
              />
            )}

            {/* 5x7 Block Grid Overlay */}
            <div
              aria-hidden="true"
              className="absolute inset-0 grid grid-cols-5 grid-rows-7 pointer-events-none"
            >
              {blockStates.map((state, idx) => {
                const col = idx % GRID_COLS;
                const row = Math.floor(idx / GRID_COLS);
                const bgPosX = (col / (GRID_COLS - 1)) * 100;
                const bgPosY = (row / (GRID_ROWS - 1)) * 100;

                if (state === 'open') {
                  return <div key={idx} className="opacity-0" />;
                }

                if (state === 'pixel' && artwork.imageUrl) {
                  return (
                    <div
                      key={idx}
                      className="relative overflow-hidden border-[0.5px] border-white/10"
                      style={{
                        backgroundImage: `url(${artwork.imageUrl})`,
                        backgroundSize: '500% 700%',
                        backgroundPosition: `${bgPosX}% ${bgPosY}%`,
                        filter: 'blur(6px) contrast(1.15) brightness(1.15)',
                        transform: 'scale(1.25)',
                      }}
                    />
                  );
                }

                return (
                  <div
                    key={idx}
                    className="bg-[#111114] border-[0.5px] border-white/[0.04]"
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Right side: Project number, project name in large type, short description */}
        <div className="md:col-span-6 flex flex-col items-start justify-center text-left gap-3 sm:gap-5 max-w-lg mx-auto md:mx-0 w-full">
          <span className="text-xs sm:text-sm tracking-[0.26em] uppercase text-[#F2EDE0]/55 font-sans">
            PROJECT {artwork.code}
          </span>

          <h2
            style={{ fontFamily: "'Instrument Serif', serif" }}
            className="text-[clamp(2.25rem,5.2vw,4.5rem)] leading-[0.95] tracking-[-0.02em] font-normal text-[#F2EDE0]"
          >
            {artwork.title}
          </h2>

          <div className="w-12 h-px bg-white/25 my-1" />
        </div>
      </div>
    </div>
  );
}
