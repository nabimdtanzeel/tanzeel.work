import React, { useState, useRef, useEffect, memo } from 'react';
import { Play, Pause, Upload, Plus, Trash2, RefreshCw, Volume2, VolumeX } from 'lucide-react';
import { ParallaxLayer } from '../context/ParallaxContext';
import TiltCard from './TiltCard';
import { useMagnetic } from '../hooks/useMagnetic';
import { Split } from '../lib/replayAnim';

interface VelorahSectionProps {
  onNavigateToTop?: () => void;
  onNavigateToPage3?: () => void;
}

interface ReelSlot {
  slot: number;
  title: string;
  videoUrl: string | null;
}

const ReelCard = memo(function ReelCard({
  reel,
  isActive,
  onTogglePlay,
  onFileUpload,
  onRemoveReel,
  isSlotUploading,
  isLandscape = false,
}: {
  reel: ReelSlot;
  isActive: boolean;
  onTogglePlay: () => void;
  onFileUpload: (file: File) => void;
  onRemoveReel: (e: React.MouseEvent) => void;
  isSlotUploading: boolean;
  isLandscape?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Playback interrupted or permission error:', err);
        });
      }
    } else {
      video.pause();
    }
  }, [isActive]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    const bar = progressBarRef.current;
    if (video && bar && video.duration) {
      const pct = (video.currentTime / video.duration) * 100;
      bar.style.width = `${pct}%`;
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    video.currentTime = ratio * video.duration;
    if (progressBarRef.current) {
      progressBarRef.current.style.width = `${ratio * 100}%`;
    }
  };

  const hasVideo = Boolean(reel.videoUrl);

  return (
    <TiltCard
      maxTilt={isLandscape ? 5 : 7}
      scale={1.02}
      dataCursor={isActive ? 'pause' : 'play'}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onFileUpload(file);
      }}
      className={`group relative ${
        isLandscape
          ? 'aspect-video w-full max-w-[min(100%,calc(22vh*16/9))] md:max-w-[min(100%,calc(42vh*16/9),32rem)] lg:max-w-[min(100%,calc(46vh*16/9),36rem)] mx-auto'
          : 'aspect-[9/16] w-full max-w-[min(100%,calc(30vh*9/16))] md:max-w-[min(100%,calc(46vh*9/16),240px)] lg:max-w-[min(100%,calc(50vh*9/16),260px)] mx-auto'
      } rounded-2xl md:rounded-3xl overflow-hidden liquid-glass transition-all duration-300 shadow-2xl bg-black/70 border ${
        isDragOver
          ? 'border-primary ring-2 ring-primary/50 scale-[1.02]'
          : 'border-white/15 hover:border-white/35'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm,video/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileUpload(file);
        }}
        className="hidden"
      />

      {hasVideo ? (
        <div
          onClick={onTogglePlay}
          className="relative w-full h-full cursor-pointer select-none"
          title={isActive ? 'Click to Pause' : 'Click to Play'}
        >
          <video
            ref={videoRef}
            src={reel.videoUrl || undefined}
            loop
            playsInline
            muted={isMuted}
            preload="auto"
            onTimeUpdate={handleTimeUpdate}
            className="w-full h-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent pointer-events-none" />

          <div
            className={`absolute inset-0 flex items-center justify-center transition-all duration-300 pointer-events-none ${
              isActive
                ? 'opacity-0 group-hover:opacity-100 bg-black/20'
                : 'opacity-100 bg-black/35'
            }`}
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/95 text-black flex items-center justify-center shadow-2xl transition-all duration-300 group-hover:scale-115 group-hover:bg-white">
              {isActive ? (
                <Pause className="w-5 h-5 fill-black text-black" />
              ) : (
                <Play className="w-5 h-5 fill-black text-black ml-0.5" />
              )}
            </div>
          </div>

          <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-end z-10 pointer-events-none">
            <div className="flex items-center gap-1.5 pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted(!isMuted);
                }}
                className="p-1.5 rounded-full bg-black/70 hover:bg-black text-white/80 hover:text-white transition-colors cursor-pointer border border-white/10 hover:border-white/30"
                title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                aria-label="Toggle mute"
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 text-muted-foreground" /> : <Volume2 className="w-3.5 h-3.5 text-foreground" />}
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="p-1.5 rounded-full bg-black/70 hover:bg-black text-white/80 hover:text-white transition-colors cursor-pointer border border-white/10 hover:border-white/30"
                title="Change Reel Video"
                aria-label="Change reel video"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={onRemoveReel}
                className="p-1.5 rounded-full bg-black/70 hover:bg-red-950/80 text-white/80 hover:text-red-400 transition-colors cursor-pointer border border-white/10 hover:border-red-500/30"
                title="Remove Reel"
                aria-label="Remove reel"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="absolute bottom-3 inset-x-3 flex flex-col gap-1.5 pointer-events-none z-10">
            {isActive && (
              <div className="flex items-center justify-end">
                <span className="flex h-2.5 w-2.5 relative shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                </span>
              </div>
            )}

            <div
              onClick={handleSeek}
              title="Click to seek"
              className="w-full py-1.5 pointer-events-auto cursor-pointer group/seek"
            >
              <div className="w-full h-1 group-hover/seek:h-1.5 bg-white/25 rounded-full overflow-hidden transition-all duration-150">
                <div
                  ref={progressBarRef}
                  className="h-full bg-white transition-all duration-75 rounded-full"
                  style={{ width: '0%' }}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="relative w-full h-full flex flex-col items-center justify-between p-4 cursor-pointer hover:bg-white/[0.04] transition-all"
        >
          <div className="flex flex-col items-center justify-center gap-2 my-auto">
            <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-full liquid-glass border border-white/20 flex items-center justify-center text-foreground group-hover:scale-110 group-hover:border-primary transition-all">
              {isSlotUploading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <Plus className="w-5 h-5 text-foreground group-hover:text-primary transition-colors" />
              )}
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-foreground">
                {isSlotUploading ? 'Saving...' : 'Upload Reel'}
              </p>
              <p className="text-[9px] text-muted-foreground leading-tight">
                MP4 video
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[9px] text-muted-foreground/70">
            <Upload className="w-2.5 h-2.5" />
            <span>Vertical Reel Video</span>
          </div>
        </div>
      )}
    </TiltCard>
  );
});

function MagneticHomeLink({ onClick }: { onClick: (e: React.MouseEvent<HTMLAnchorElement>) => void }) {
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

function MagneticContinueButton({ onClick }: { onClick?: () => void }) {
  const { ref, style, onMouseMove, onMouseEnter, onMouseLeave } = useMagnetic<HTMLButtonElement>({
    maxDisplacement: 8,
    scale: 1.1,
    damping: 0.3,
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
      className="liquid-glass rounded-full px-10 sm:px-14 py-2.5 sm:py-3.5 text-sm sm:text-base text-foreground mt-1 sm:mt-2 hover:border-white/40 active:scale-95 cursor-pointer"
    >
      Continue
    </button>
  );
}

export default function VelorahSection({ onNavigateToTop, onNavigateToPage3 }: VelorahSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [reels, setReels] = useState<ReelSlot[]>([
    { slot: 1, title: 'Reel 01', videoUrl: '/videos/reel-1.mp4' },
    { slot: 2, title: 'Reel 02', videoUrl: '/videos/reel-2.mp4' },
    { slot: 3, title: 'Landscape Reel', videoUrl: 'https://res.cloudinary.com/fe0ahalt/video/upload/v1794858241/1st_2_1.mp4' },
  ]);

  const [playingSlot, setPlayingSlot] = useState<number | null>(null);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);

  // Auto-pause active reel when user scrolls away from Page 2
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          setPlayingSlot(null);
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let localData: ReelSlot[] | null = null;
    try {
      const stored = localStorage.getItem('velorah_uploaded_reels');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length >= 3) {
          localData = parsed;
          setReels(parsed);
        }
      }
    } catch {}

    fetch('/api/get-reels')
      .then((res) => res.json())
      .then((data: { reels: { slot: number; path: string }[] }) => {
        if (data && data.reels) {
          setReels((prev) =>
            prev.map((r) => {
              const localItem = localData?.find((item) => item.slot === r.slot);
              if (localItem && localItem.videoUrl) {
                return localItem;
              }
              const found = data.reels.find((item) => item.slot === r.slot);
              return found ? { ...r, videoUrl: found.path } : r;
            })
          );
        }
      })
      .catch(() => {});
  }, []);

  const saveReelsState = (updated: ReelSlot[]) => {
    setReels(updated);
    try {
      localStorage.setItem('velorah_uploaded_reels', JSON.stringify(updated));
    } catch {}
  };

  const handleHomeClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (onNavigateToTop) {
      onNavigateToTop();
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFileUpload = (slotNum: number, file: File) => {
    if (!file.type.startsWith('video/')) {
      alert('Please upload a video file (.mp4, .mov, .webm)');
      return;
    }

    setUploadingSlot(slotNum);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setReels((prev) => {
        const persisted = prev.map((r) =>
          r.slot === slotNum ? { ...r, videoUrl: dataUrl } : r
        );
        saveReelsState(persisted);
        return persisted;
      });

      try {
        await fetch('/api/upload-reel-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slot: slotNum, dataUrl }),
        });
      } catch (err) {
        console.warn('Could not persist to server disk:', err);
      } finally {
        setUploadingSlot(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const togglePlay = (slotNum: number) => {
    setPlayingSlot((prev) => (prev === slotNum ? null : slotNum));
  };

  const handleRemoveReel = (e: React.MouseEvent, slotNum: number) => {
    e.stopPropagation();
    if (playingSlot === slotNum) {
      setPlayingSlot(null);
    }
    const updated = reels.map((r) => (r.slot === slotNum ? { ...r, videoUrl: null } : r));
    saveReelsState(updated);

    fetch('/api/delete-reel-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slot: slotNum }),
    }).catch(() => {});
  };

  const reel1 = reels.find((r) => r.slot === 1) || reels[0];
  const reel2 = reels.find((r) => r.slot === 2) || reels[1];
  const landscapeReel = reels.find((r) => r.slot === 3) || reels[2];

  return (
    <section
      ref={sectionRef}
      id="design-work"
      className="w-full h-screen min-h-screen relative overflow-clip flex flex-col justify-between shrink-0 bg-background text-foreground select-none py-3 sm:py-5 lg:py-8"
    >
      {/* Background Layer with Parallax & Bleed */}
      <ParallaxLayer
        pageIndex={1}
        layer="background"
        className="absolute -inset-[8%] w-[116%] h-[116%] pointer-events-none z-0"
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover transform translate-z-0"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4"
        />

        <div className="absolute inset-0 bg-black/45 pointer-events-none z-[1]" />
      </ParallaxLayer>

      <header className="relative z-10 w-full shrink-0">
        <div className="flex row justify-between items-center px-6 sm:px-8 py-2 sm:py-3 max-w-7xl mx-auto w-full">
          <div data-anim="drop" style={{ '--i': 0 } as React.CSSProperties}>
            <MagneticHomeLink onClick={handleHomeClick} />
          </div>
        </div>
      </header>

      <main className="relative z-10 flex flex-col items-center justify-center text-center px-4 sm:px-6 my-auto max-w-7xl w-full mx-auto gap-3 sm:gap-5 lg:gap-6 min-h-0">
        <ParallaxLayer pageIndex={1} layer="heading">
          <h1
            className="text-[clamp(1.35rem,3.6vw,3.5rem)] leading-[1.05] tracking-[-0.03em] max-w-4xl font-normal text-foreground cursor-default transition-all duration-300"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            <Split text="Craft" type="blur-up" start={0} />
            <em className="not-italic text-muted-foreground hover:text-white transition-colors">
              <Split text="In" type="flip" start={1} />
            </em>
            <Split text="Motion" type="blur-up" start={2} />
          </h1>
        </ParallaxLayer>

        <ParallaxLayer pageIndex={1} layer="midground" className="w-full">
          <div className="flex flex-col md:flex-row items-center justify-center gap-3 sm:gap-5 lg:gap-10 w-full max-w-6xl mx-auto px-2 sm:px-4">
            {/* Leftmost: Reel 3 (Landscape Reel - 16:9) */}
            <div
              data-anim="slide-left"
              style={{ '--i': 2 } as React.CSSProperties}
              className="w-full md:w-1/2 flex justify-center md:justify-start"
            >
              {landscapeReel && (
                <ReelCard
                  key={landscapeReel.slot}
                  reel={landscapeReel}
                  isLandscape
                  isActive={playingSlot === landscapeReel.slot}
                  onTogglePlay={() => togglePlay(landscapeReel.slot)}
                  onFileUpload={(file) => handleFileUpload(landscapeReel.slot, file)}
                  onRemoveReel={(e) => handleRemoveReel(e, landscapeReel.slot)}
                  isSlotUploading={uploadingSlot === landscapeReel.slot}
                />
              )}
            </div>

            {/* Right side: Reel 01 and Reel 02 side by side (Authentic 9:16 vertical phone reels) */}
            <div className="flex flex-row items-center justify-center gap-3 sm:gap-5 w-full md:w-1/2">
              {reel1 && (
                <div
                  data-anim="zoom"
                  style={{ '--i': 3 } as React.CSSProperties}
                  className="w-1/2 max-w-[min(46%,calc(30vh*9/16))] md:max-w-[min(48%,calc(46vh*9/16),240px)] lg:max-w-[min(48%,calc(50vh*9/16),260px)] flex justify-center"
                >
                  <ReelCard
                    key={reel1.slot}
                    reel={reel1}
                    isActive={playingSlot === reel1.slot}
                    onTogglePlay={() => togglePlay(reel1.slot)}
                    onFileUpload={(file) => handleFileUpload(reel1.slot, file)}
                    onRemoveReel={(e) => handleRemoveReel(e, reel1.slot)}
                    isSlotUploading={uploadingSlot === reel1.slot}
                  />
                </div>
              )}
              {reel2 && (
                <div
                  data-anim="slide-right"
                  style={{ '--i': 4 } as React.CSSProperties}
                  className="w-1/2 max-w-[min(46%,calc(30vh*9/16))] md:max-w-[min(48%,calc(46vh*9/16),240px)] lg:max-w-[min(48%,calc(50vh*9/16),260px)] flex justify-center"
                >
                  <ReelCard
                    key={reel2.slot}
                    reel={reel2}
                    isActive={playingSlot === reel2.slot}
                    onTogglePlay={() => togglePlay(reel2.slot)}
                    onFileUpload={(file) => handleFileUpload(reel2.slot, file)}
                    onRemoveReel={(e) => handleRemoveReel(e, reel2.slot)}
                    isSlotUploading={uploadingSlot === reel2.slot}
                  />
                </div>
              )}
            </div>
          </div>
        </ParallaxLayer>

        <ParallaxLayer pageIndex={1} layer="foreground">
          <div data-anim="pop" style={{ '--i': 5 } as React.CSSProperties}>
            <MagneticContinueButton onClick={onNavigateToPage3} />
          </div>
        </ParallaxLayer>
      </main>

      <div className="relative z-10 h-4 w-full pointer-events-none" />
    </section>
  );
}
