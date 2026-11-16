import React, { useState, useRef, useEffect, memo } from 'react';
import { Volume2, VolumeX, Plus, Upload, Trash2, RefreshCw, Maximize2, X } from 'lucide-react';
import { saveGraphicToDB, getAllGraphicsFromDB, deleteGraphicFromDB } from '../lib/graphicsStorage';

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
    <div
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
      className={`group relative aspect-[9/16] h-[25vh] sm:h-[30vh] md:h-[34vh] max-h-[290px] min-h-[170px] w-auto rounded-xl sm:rounded-2xl md:rounded-3xl overflow-hidden liquid-glass transition-all duration-300 shadow-2xl bg-black/60 border shrink-0 animate-float-${slot} ${
        isDragOver
          ? 'border-primary ring-2 ring-primary/50 scale-[1.02]'
          : 'border-white/15 hover:border-white/30'
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
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={onImageError}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

          <div className="absolute top-2 inset-x-2 flex items-center justify-end z-10">
            <div className="flex items-center gap-1 pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="p-1 rounded-full bg-black/70 hover:bg-black text-white/80 hover:text-white transition-colors cursor-pointer border border-white/10"
                title="Change Graphic"
                aria-label="Change graphic"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={onRemove}
                className="p-1 rounded-full bg-black/70 hover:bg-red-950/80 text-white/80 hover:text-red-400 transition-colors cursor-pointer border border-white/10"
                title="Remove Graphic"
                aria-label="Remove graphic"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="absolute bottom-2 inset-x-2 flex items-center justify-between pointer-events-none z-10">
            <span className="text-[11px] font-medium text-white/95 truncate drop-shadow-md">
              0{slot}
            </span>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white/80 flex items-center gap-1 text-[11px]">
              <Maximize2 className="w-3 h-3" />
            </span>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="relative w-full h-full flex flex-col items-center justify-between p-2.5 sm:p-3 cursor-pointer hover:bg-white/[0.04] transition-all text-center select-none"
        >
          <div className="w-full flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[9px] tracking-wider font-mono text-muted-foreground border border-white/10 uppercase">
              {title}
            </span>
            <span className="text-[9px] text-muted-foreground font-mono">9:16</span>
          </div>

          <div className="flex flex-col items-center justify-center gap-1.5 my-auto">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full liquid-glass border border-white/20 flex items-center justify-center text-foreground group-hover:scale-110 group-hover:border-primary transition-all">
              {isUploading ? (
                <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <Plus className="w-4 h-4 text-foreground group-hover:text-primary transition-colors" />
              )}
            </div>
            <div className="space-y-0.5">
              <p className="text-[11px] sm:text-xs font-medium text-foreground">
                {isUploading ? 'Saving...' : 'Add Graphic'}
              </p>
              <p className="text-[9px] text-muted-foreground leading-tight">
                Click or drop
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[9px] text-muted-foreground/70">
            <Upload className="w-2.5 h-2.5" />
            <span>Reel Slot</span>
          </div>
        </div>
      )}
    </div>
  );
});

export default function GraphicsPortfolioSection({ onNavigateToTop, onNavigateToPage2, onNavigateToPage4 }: GraphicsPortfolioSectionProps) {
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const videoSrc = '/videos/threed-bg.mp4';
  const fallbackSrc = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261023_005028_9d693c33-2376-446e-bbc2-acb4c9ecf815.mp4';

  const [graphics, setGraphics] = useState<GraphicSlot[]>([
    { slot: 1, title: 'Piece 01', imageUrl: null },
    { slot: 2, title: 'Piece 02', imageUrl: null },
    { slot: 3, title: 'Piece 03', imageUrl: null },
    { slot: 4, title: 'Piece 04', imageUrl: null },
    { slot: 5, title: 'Piece 05', imageUrl: null },
    { slot: 6, title: 'Piece 06', imageUrl: null },
  ]);

  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [lightboxGraphic, setLightboxGraphic] = useState<GraphicSlot | null>(null);

  // Load existing graphics on mount from IndexedDB first, then server disk
  useEffect(() => {
    // 1. Immediately load any graphics from IndexedDB
    getAllGraphicsFromDB().then((stored) => {
      if (stored && stored.length > 0) {
        setGraphics((prev) =>
          prev.map((g) => {
            const found = stored.find((item) => item.slot === g.slot);
            return found ? { ...g, imageUrl: found.imageUrl } : g;
          })
        );
      }
    });

    // 2. Fetch server-persisted graphics
    fetch('/api/get-3d-graphics')
      .then((res) => res.json())
      .then((data: { graphics: { slot: number; path: string }[] }) => {
        if (data && data.graphics && data.graphics.length > 0) {
          setGraphics((prev) =>
            prev.map((g) => {
              const found = data.graphics.find((item) => item.slot === g.slot);
              if (found) {
                // If current imageUrl is not a custom local upload or is empty, use server path
                if (!g.imageUrl || g.imageUrl.startsWith('/images/')) {
                  return { ...g, imageUrl: found.path };
                }
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

      // 1. Instant preview and persist in IndexedDB
      setGraphics((prev) =>
        prev.map((g) => (g.slot === slotNum ? { ...g, imageUrl: dataUrl } : g))
      );
      await saveGraphicToDB(slotNum, dataUrl);

      // 2. Upload to server disk
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
      className="w-full h-screen min-h-screen relative overflow-hidden flex flex-col justify-between snap-start snap-always shrink-0 bg-[#000000] text-foreground select-none"
    >
      <video
        ref={videoRef}
        src={videoSrc}
        autoPlay
        loop
        muted={isMuted}
        playsInline
        preload="auto"
        onError={(e) => {
          const target = e.currentTarget;
          if (target.src !== fallbackSrc) {
            target.src = fallbackSrc;
            target.play().catch(() => {});
          }
        }}
        className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none transform translate-z-0"
      />

      <div className="absolute inset-0 bg-black/50 pointer-events-none z-[1]" />

      <header className="relative z-10 w-full shrink-0">
        <div className="flex row justify-between items-center px-6 sm:px-8 py-3 sm:py-4 max-w-7xl mx-auto w-full">
          <a
            href="#hero"
            onClick={handleHomeClick}
            className="text-2xl sm:text-3xl tracking-tight text-foreground transition-opacity hover:opacity-90 inline-flex items-baseline cursor-pointer"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            HOME
          </a>

          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="liquid-glass rounded-full p-2 text-foreground hover:scale-105 transition-all cursor-pointer"
              title={isMuted ? 'Unmute video audio' : 'Mute video audio'}
              aria-label="Toggle audio"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Volume2 className="w-4 h-4 text-foreground" />
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex flex-col items-center justify-center text-center px-4 sm:px-6 my-auto max-w-7xl w-full mx-auto">
        <h2
          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl leading-[1.05] tracking-[-1.5px] max-w-3xl font-normal text-foreground mb-3 sm:mb-5 animate-fade-rise"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Three-dimensional <em className="not-italic text-muted-foreground">explorations.</em>
        </h2>

        <div className="flex items-center justify-center gap-2.5 sm:gap-3.5 md:gap-4 w-full max-w-6xl mx-auto flex-wrap animate-fade-rise-delay">
          {graphics.map((graphic) => (
            <GraphicCard
              key={graphic.slot}
              slot={graphic.slot}
              title={graphic.title}
              imageUrl={graphic.imageUrl}
              onUpload={(file) => handleFileUpload(graphic.slot, file)}
              onRemove={(e) => handleRemoveGraphic(e, graphic.slot)}
              onImageError={() => handleImageError(graphic.slot)}
              onOpenLightbox={() => setLightboxGraphic(graphic)}
              isUploading={uploadingSlot === graphic.slot}
            />
          ))}
        </div>
      </main>

      <footer className="relative z-10 w-full px-6 sm:px-8 py-2.5 sm:py-3 max-w-7xl mx-auto flex justify-between items-center text-xs text-muted-foreground shrink-0">
        <span>6 Graphics Showcase &bull; 3D Portfolio</span>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onNavigateToPage2}
            className="hover:text-foreground transition-colors cursor-pointer"
          >
            &uarr; Page 2
          </button>
          {onNavigateToPage4 && (
            <button
              type="button"
              onClick={onNavigateToPage4}
              className="hover:text-foreground transition-colors cursor-pointer"
            >
              Page 4 &rarr;
            </button>
          )}
        </div>
      </footer>

      {lightboxGraphic && (
        <div
          onClick={() => setLightboxGraphic(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8 animate-fade-rise cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl max-h-[85vh] bg-black/85 rounded-2xl overflow-hidden border border-white/20 shadow-2xl flex flex-col cursor-default"
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
              <span className="text-sm font-medium text-foreground">
                {lightboxGraphic.title} &bull; 3D Graphic Work
              </span>
              <button
                type="button"
                onClick={() => setLightboxGraphic(null)}
                className="p-1.5 rounded-full hover:bg-white/10 text-foreground transition-colors cursor-pointer"
                aria-label="Close lightbox"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative flex items-center justify-center p-2 bg-black">
              <img
                src={lightboxGraphic.imageUrl || undefined}
                alt={lightboxGraphic.title}
                className="max-h-[70vh] w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
