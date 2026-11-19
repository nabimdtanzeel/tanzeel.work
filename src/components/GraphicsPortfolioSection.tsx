import React, { useState, useRef, useEffect, memo, useCallback } from 'react';
import { Plus, Upload, Trash2, RefreshCw, Maximize2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { saveGraphicToDB, getAllGraphicsFromDB, deleteGraphicFromDB } from '../lib/graphicsStorage';
import { ParallaxLayer } from '../context/ParallaxContext';
import TiltCard from './TiltCard';
import { useMagnetic } from '../hooks/useMagnetic';
import { Split } from '../lib/replayAnim';

const CARD_ANIMS = ['zoom', 'wipe', 'rotate', 'flip', 'blur-up'] as const;

interface GraphicsPortfolioSectionProps {
  onNavigateToTop?: () => void;
  onNavigateToPage2?: () => void;
  onNavigateToPage4?: () => void;
}

interface GraphicSlot {
  slot: number;
  title: string;
  imageUrl: string | null;
}

const GraphicCard = memo(function GraphicCard({
  slot,
  title,
  imageUrl,
  onUpload,
  onRemove,
  onImageError,
  onOpenLightbox,
  isUploading,
}: {
  slot: number;
  title: string;
  imageUrl: string | null;
  onUpload: (file: File) => void;
  onRemove: (e: React.MouseEvent) => void;
  onImageError: () => void;
  onOpenLightbox: () => void;
  isUploading: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const hasImage = Boolean(imageUrl);

  return (
    <TiltCard
      maxTilt={8}
      scale={1.035}
      dataCursor="view"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onUpload(file);
      }}
      className={`group relative aspect-[9/16] w-[160px] sm:w-[185px] lg:w-[205px] xl:w-[215px] h-auto shrink-0 mx-auto rounded-2xl md:rounded-3xl overflow-hidden liquid-glass transition-all duration-300 shadow-2xl bg-black/60 border hover:border-white/40 ${
        isDragOver
          ? 'border-primary ring-2 ring-primary/50 scale-[1.02]'
          : 'border-white/15'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
        }}
        className="hidden"
      />

      {hasImage ? (
        <div
          onClick={onOpenLightbox}
          className="relative w-full h-full cursor-pointer select-none overflow-hidden"
          title="Click to view full size"
        >
          <img
            src={imageUrl || undefined}
            alt={title}
            draggable={false}
            className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105 select-none"
            onError={onImageError}
          />

          {/* Top action controls on hover */}
          <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-end z-10">
            <div className="flex items-center gap-1.5 pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="p-1.5 rounded-full bg-black/75 hover:bg-black text-white/80 hover:text-white transition-colors cursor-pointer border border-white/15 shadow-md"
                title="Change Graphic"
                aria-label="Change graphic"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={onRemove}
                className="p-1.5 rounded-full bg-black/75 hover:bg-red-950/80 text-white/80 hover:text-red-400 transition-colors cursor-pointer border border-white/15 shadow-md"
                title="Remove Graphic"
                aria-label="Remove graphic"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Bottom-right expand indicator on hover */}
          <div className="absolute bottom-2.5 right-2.5 flex items-center justify-end pointer-events-none z-10">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white/90 p-1.5 rounded-full bg-black/60 border border-white/15 drop-shadow">
              <Maximize2 className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="relative w-full h-full flex flex-col items-center justify-between p-3 sm:p-4 cursor-pointer hover:bg-white/[0.04] transition-all text-center select-none"
        >
          <div className="flex flex-col items-center justify-center gap-2 my-auto">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full liquid-glass border border-white/20 flex items-center justify-center text-foreground group-hover:scale-110 group-hover:border-primary transition-all">
              {isUploading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-foreground group-hover:text-primary transition-colors" />
              )}
            </div>
            <div className="space-y-0.5">
              <p className="text-xs sm:text-sm font-medium text-foreground">
                {isUploading ? 'Saving...' : 'Add Graphic'}
              </p>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground leading-tight">
                Click or drop portrait art
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-muted-foreground/70">
            <Upload className="w-3 h-3" />
            <span>9:16 Portrait</span>
          </div>
        </div>
      )}
    </TiltCard>
  );
});

function MagneticHomeButton({
  onClick,
}: {
  onClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  const { ref, style, onMouseMove, onMouseEnter, onMouseLeave, isHovered } = useMagnetic<HTMLAnchorElement>({
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
  const { ref, style, onMouseMove, onMouseEnter, onMouseLeave } = useMagnetic<HTMLButtonElement>({
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

export default function GraphicsPortfolioSection({ onNavigateToTop, onNavigateToPage2, onNavigateToPage4 }: GraphicsPortfolioSectionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const firstSetRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef({ isDown: false, startX: 0, startScrollLeft: 0, dragged: false });
  const suppressClickRef = useRef(false);
  const pauseAutoUntilRef = useRef(0);
  const carryRef = useRef(0);
  const lastFrameRef = useRef(0);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.volume = 0;
    }
  }, []);

  useEffect(() => {
    const el = marqueeRef.current;
    const setEl = firstSetRef.current;
    if (!el || !setEl) return;

    const getLoopWidth = () => setEl.offsetWidth || 0;
    const initialW = getLoopWidth();
    if (initialW > 0 && el.scrollLeft === 0) {
      el.scrollLeft = initialW;
    }

    const wrapScroll = () => {
      const w = getLoopWidth();
      if (!w) return;
      if (el.scrollLeft <= w * 0.25) {
        el.scrollLeft += w;
      } else if (el.scrollLeft >= w * 1.75) {
        el.scrollLeft -= w;
      }
    };

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let rafId = 0;
    const SPEED_PX_PER_SEC = 28;

    const tick = (now: number) => {
      rafId = requestAnimationFrame(tick);
      if (!lastFrameRef.current) {
        lastFrameRef.current = now;
        return;
      }
      const dt = Math.min((now - lastFrameRef.current) / 1000, 0.1);
      lastFrameRef.current = now;

      if (reduceMotion || document.hidden) return;
      if (dragStateRef.current.isDown || now < pauseAutoUntilRef.current) return;

      // Decreasing scrollLeft moves the artwork strip slowly to the right
      carryRef.current -= SPEED_PX_PER_SEC * dt;
      if (Math.abs(carryRef.current) >= 1) {
        const step = Math.trunc(carryRef.current);
        el.scrollLeft += step;
        carryRef.current -= step;
      }
      wrapScroll();
    };

    const onScroll = () => {
      wrapScroll();
    };

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > 0 || e.shiftKey) {
        pauseAutoUntilRef.current = performance.now() + 600;
      }
    };

    const onTouchStart = () => {
      pauseAutoUntilRef.current = performance.now() + 1200;
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    el.addEventListener('wheel', onWheel, { passive: true });
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      el.removeEventListener('scroll', onScroll);
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
    };
  }, []);

  const videoSrc = '/videos/threed-bg.mp4';
  const fallbackSrc = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261023_005028_9d693c33-2376-446e-bbc2-acb4c9ecf815.mp4';

  const [graphics, setGraphics] = useState<GraphicSlot[]>([
    {
      slot: 1,
      title: 'Love Work',
      imageUrl: 'https://res.cloudinary.com/fe0ahalt/image/upload/v1794858149/lovework.png',
    },
    {
      slot: 2,
      title: 'Denim',
      imageUrl: 'https://res.cloudinary.com/fe0ahalt/image/upload/v1794858149/denim_0-00-00-00__1.png',
    },
    {
      slot: 3,
      title: 'Strawberry Frappe',
      imageUrl: 'https://res.cloudinary.com/fe0ahalt/image/upload/v1794858148/strawberryfrappe-Recovered.png',
    },
    {
      slot: 4,
      title: 'Design Artwork',
      imageUrl: 'https://res.cloudinary.com/fe0ahalt/image/upload/v1794858148/design-1.jpg.png',
    },
    {
      slot: 5,
      title: 'Introvert Illustration',
      imageUrl: 'https://res.cloudinary.com/fe0ahalt/image/upload/v1794858147/introvertillustration.png',
    },
  ]);

  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [lightboxGraphic, setLightboxGraphic] = useState<GraphicSlot | null>(null);

  const populatedGraphics = graphics.filter((g) => Boolean(g.imageUrl));
  const currentLightboxIndex = lightboxGraphic
    ? populatedGraphics.findIndex((g) => g.slot === lightboxGraphic.slot)
    : -1;

  const navigateLightbox = useCallback(
    (direction: -1 | 1) => {
      if (populatedGraphics.length === 0 || currentLightboxIndex === -1) return;
      const nextIndex =
        (currentLightboxIndex + direction + populatedGraphics.length) %
        populatedGraphics.length;
      setLightboxGraphic(populatedGraphics[nextIndex]);
    },
    [populatedGraphics, currentLightboxIndex]
  );

  useEffect(() => {
    if (!lightboxGraphic) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setLightboxGraphic(null);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        e.stopPropagation();
        navigateLightbox(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        e.stopPropagation();
        navigateLightbox(1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxGraphic, navigateLightbox]);

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

  const handleFileUpload = (slotNum: number, file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (.png, .jpg, .webp)');
      return;
    }

    setUploadingSlot(slotNum);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;

      setGraphics((prev) =>
        prev.map((g) => (g.slot === slotNum ? { ...g, imageUrl: dataUrl } : g))
      );
      await saveGraphicToDB(slotNum, dataUrl);

      try {
        const res = await fetch('/api/upload-3d-graphic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slot: slotNum, dataUrl }),
        });
        const result = await res.json();
        if (result && result.path) {
          setGraphics((prev) =>
            prev.map((g) => (g.slot === slotNum ? { ...g, imageUrl: result.path } : g))
          );
          await saveGraphicToDB(slotNum, result.path);
        }
      } catch (err) {
        console.warn('Could not persist 3D graphic to disk immediately:', err);
      } finally {
        setUploadingSlot(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveGraphic = async (e: React.MouseEvent, slotNum: number) => {
    e.stopPropagation();
    setGraphics((prev) => prev.map((g) => (g.slot === slotNum ? { ...g, imageUrl: null } : g)));
    await deleteGraphicFromDB(slotNum);

    fetch('/api/delete-3d-graphic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slot: slotNum }),
    }).catch(() => {});
  };

  const handleImageError = (slotNum: number) => {
    setGraphics((prev) =>
      prev.map((g) => (g.slot === slotNum ? { ...g, imageUrl: null } : g))
    );
    deleteGraphicFromDB(slotNum);
  };

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

        <div className="absolute inset-0 bg-black/25 pointer-events-none z-[1]" />
      </ParallaxLayer>

      <header className="relative z-10 w-full shrink-0">
        <div className="flex row justify-between items-center px-6 sm:px-8 py-2 sm:py-3 max-w-7xl mx-auto w-full">
          <div data-anim="drop" style={{ '--i': 0 } as React.CSSProperties}>
            <MagneticHomeButton onClick={handleHomeClick} />
          </div>
        </div>
      </header>

      <main className="relative z-10 flex flex-col items-center justify-center text-center px-3 sm:px-6 my-auto max-w-7xl w-full mx-auto gap-3 sm:gap-5">
        <ParallaxLayer pageIndex={2} layer="heading">
          <h1
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl leading-[1.05] tracking-[-1.5px] max-w-4xl font-normal text-foreground cursor-default transition-all duration-300"
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

        <ParallaxLayer pageIndex={2} layer="midground" className="w-full">
          <div className="w-full max-w-6xl mx-auto [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]">
            <div
              ref={marqueeRef}
              onPointerDown={(e) => {
                if (e.pointerType !== 'mouse' || e.button !== 0) return;
                if ((e.target as HTMLElement).closest('button')) return;
                const el = marqueeRef.current;
                if (!el) return;
                dragStateRef.current = {
                  isDown: true,
                  startX: e.clientX,
                  startScrollLeft: el.scrollLeft,
                  dragged: false,
                };
              }}
              onPointerMove={(e) => {
                if (!dragStateRef.current.isDown) return;
                const el = marqueeRef.current;
                if (!el) return;
                const dx = e.clientX - dragStateRef.current.startX;
                if (Math.abs(dx) > 5) {
                  dragStateRef.current.dragged = true;
                }
                if (dragStateRef.current.dragged) {
                  el.scrollLeft = dragStateRef.current.startScrollLeft - dx;
                }
              }}
              onPointerUp={() => {
                if (dragStateRef.current.dragged) {
                  suppressClickRef.current = true;
                  pauseAutoUntilRef.current = performance.now() + 600;
                }
                dragStateRef.current.isDown = false;
                dragStateRef.current.dragged = false;
              }}
              onPointerCancel={() => {
                dragStateRef.current.isDown = false;
                dragStateRef.current.dragged = false;
              }}
              onPointerLeave={() => {
                if (dragStateRef.current.dragged) {
                  pauseAutoUntilRef.current = performance.now() + 600;
                }
                dragStateRef.current.isDown = false;
                dragStateRef.current.dragged = false;
              }}
              onClickCapture={(e) => {
                if (suppressClickRef.current) {
                  e.stopPropagation();
                  e.preventDefault();
                  suppressClickRef.current = false;
                }
              }}
              className="flex w-full overflow-x-auto no-scrollbar py-4 select-none cursor-grab active:cursor-grabbing"
            >
              {[0, 1, 2].map((loopIndex) => (
                <div
                  key={loopIndex}
                  ref={loopIndex === 0 ? firstSetRef : undefined}
                  aria-hidden={loopIndex !== 1 || undefined}
                  className="flex items-center gap-4 sm:gap-5 lg:gap-6 pr-4 sm:pr-5 lg:pr-6 shrink-0"
                >
                  {graphics.map((graphic, index) => (
                    <div
                      key={`${loopIndex}-${graphic.slot}`}
                      data-anim={CARD_ANIMS[index] || 'zoom'}
                      style={{ '--i': index } as React.CSSProperties}
                      className="shrink-0"
                    >
                      <GraphicCard
                        slot={graphic.slot}
                        title={graphic.title}
                        imageUrl={graphic.imageUrl}
                        onUpload={(file) => handleFileUpload(graphic.slot, file)}
                        onRemove={(e) => handleRemoveGraphic(e, graphic.slot)}
                        onImageError={() => handleImageError(graphic.slot)}
                        onOpenLightbox={() => setLightboxGraphic(graphic)}
                        isUploading={uploadingSlot === graphic.slot}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </ParallaxLayer>
      </main>

      <ParallaxLayer pageIndex={2} layer="foreground" className="relative z-10 w-full shrink-0">
        <footer className="w-full px-6 sm:px-8 py-2 sm:py-3 max-w-7xl mx-auto flex justify-between items-center text-xs text-muted-foreground">
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

      {lightboxGraphic && (
        <div
          onClick={() => setLightboxGraphic(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center gap-3 sm:gap-6 p-4 sm:p-8 cursor-pointer"
        >
          {populatedGraphics.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigateLightbox(-1);
              }}
              data-cursor="pointer"
              aria-label="Previous artwork"
              className="p-2.5 sm:p-3 rounded-full bg-white/10 hover:bg-white/20 text-white/85 hover:text-white border border-white/15 transition-colors cursor-pointer shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          <div className="flex flex-col items-center gap-3">
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-3xl max-h-[82vh] bg-black/85 rounded-2xl overflow-hidden border border-white/20 shadow-2xl flex flex-col cursor-default p-2"
            >
              <button
                type="button"
                onClick={() => setLightboxGraphic(null)}
                data-cursor="pointer"
                className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/75 hover:bg-black text-white/80 hover:text-white border border-white/15 transition-colors cursor-pointer"
                aria-label="Close lightbox"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="relative flex items-center justify-center bg-black">
                <img
                  src={lightboxGraphic.imageUrl || undefined}
                  alt={lightboxGraphic.title}
                  className="max-h-[78vh] w-auto object-contain rounded-xl"
                />
              </div>
            </div>

            {populatedGraphics.length > 1 && currentLightboxIndex >= 0 && (
              <span
                onClick={(e) => e.stopPropagation()}
                className="text-xs text-white/55 tracking-widest cursor-default select-none"
              >
                {currentLightboxIndex + 1} / {populatedGraphics.length}
              </span>
            )}
          </div>

          {populatedGraphics.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigateLightbox(1);
              }}
              data-cursor="pointer"
              aria-label="Next artwork"
              className="p-2.5 sm:p-3 rounded-full bg-white/10 hover:bg-white/20 text-white/85 hover:text-white border border-white/15 transition-colors cursor-pointer shrink-0"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      )}
    </section>
  );
}
