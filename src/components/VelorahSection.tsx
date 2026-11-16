import React, { useState, useRef, useEffect, memo } from 'react';
import { Play, Pause, Upload, Plus, Trash2, RefreshCw, Volume2, VolumeX } from 'lucide-react';

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
}: {
  reel: ReelSlot;
  isActive: boolean;
  onTogglePlay: () => void;
  onFileUpload: (file: File) => void;
  onRemoveReel: (e: React.MouseEvent) => void;
  isSlotUploading: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      setHasStartedPlaying(true);
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

  const hasVideo = Boolean(reel.videoUrl);

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
        if (file) onFileUpload(file);
      }}
      className={`group relative aspect-[9/16] w-full rounded-2xl md:rounded-3xl overflow-hidden liquid-glass transition-all duration-300 shadow-2xl bg-black/70 border ${
        isDragOver
          ? 'border-primary ring-2 ring-primary/50 scale-[1.02]'
          : 'border-white/15 hover:border-white/30'
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

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/50 pointer-events-none" />

          <div
            className={`absolute inset-0 flex items-center justify-center transition-all duration-300 pointer-events-none ${
              isActive
                ? 'opacity-0 group-hover:opacity-100 bg-black/25'
                : 'opacity-100 bg-black/40'
            }`}
          >
            <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-full bg-white/95 text-black flex items-center justify-center shadow-2xl transition-all duration-300 group-hover:scale-110">
              {isActive ? (
                <Pause className="w-6 h-6 fill-black text-black" />
              ) : (
                <Play className="w-6 h-6 fill-black text-black ml-1" />
              )}
            </div>
          </div>

          <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between z-10 pointer-events-none">
            <span className="px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[10px] tracking-wider font-mono text-white/90 border border-white/10 uppercase">
              {reel.title}
            </span>

            <div className="flex items-center gap-1.5 pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted(!isMuted);
                }}
                className="p-1.5 rounded-full bg-black/70 hover:bg-black text-white/80 hover:text-white transition-colors cursor-pointer border border-white/10"
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
                className="p-1.5 rounded-full bg-black/70 hover:bg-black text-white/80 hover:text-white transition-colors cursor-pointer border border-white/10"
                title="Change Reel Video"
                aria-label="Change reel video"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={onRemoveReel}
                className="p-1.5 rounded-full bg-black/70 hover:bg-red-950/80 text-white/80 hover:text-red-400 transition-colors cursor-pointer border border-white/10"
                title="Remove Reel"
                aria-label="Remove reel"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="absolute bottom-3 inset-x-3 flex flex-col gap-1.5 pointer-events-none z-10">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-xs font-medium text-white/95 drop-shadow-md">
                  {reel.title}
                </p>
                <p className="text-[10px] text-white/70">
                  {isActive
                    ? 'Playing • Click to pause'
                    : hasStartedPlaying
                    ? 'Paused • Click to resume'
                    : 'Click to play'}
                </p>
              </div>

              {isActive ? (
                <span className="flex h-2.5 w-2.5 relative shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                </span>
              ) : hasStartedPlaying ? (
                <span className="px-1.5 py-0.5 rounded bg-white/20 text-[9px] font-mono text-white/90">
                  PAUSED
                </span>
              ) : null}
            </div>

            <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
              <div
                ref={progressBarRef}
                className="h-full bg-white transition-all duration-75 rounded-full"
                style={{ width: '0%' }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="relative w-full h-full flex flex-col items-center justify-between p-4 cursor-pointer hover:bg-white/[0.04] transition-all"
        >
          <div className="w-full flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[10px] tracking-wider font-mono text-muted-foreground border border-white/10 uppercase">
              {reel.title}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">9:16</span>
          </div>

          <div className="flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full liquid-glass border border-white/20 flex items-center justify-center text-foreground group-hover:scale-110 group-hover:border-primary transition-all">
              {isSlotUploading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <Plus className="w-6 h-6 text-foreground group-hover:text-primary transition-colors" />
              )}
            </div>
            <div className="space-y-1">
              <p className="text-xs sm:text-sm font-medium text-foreground">
                {isSlotUploading ? 'Saving Reel...' : 'Upload Reel'}
              </p>
              <p className="text-[10px] text-muted-foreground leading-tight">
                Click or drag MP4 video
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/70">
            <Upload className="w-3 h-3" />
            <span>Vertical Reel Video</span>
          </div>
        </div>
      )}
    </div>
  );
});

export default function VelorahSection({ onNavigateToTop, onNavigateToPage3 }: VelorahSectionProps) {
  const [reels, setReels] = useState<ReelSlot[]>([
    { slot: 1, title: 'Reel 01', videoUrl: null },
    { slot: 2, title: 'Reel 02', videoUrl: null },
    { slot: 3, title: 'Reel 03', videoUrl: null },
    { slot: 4, title: 'Reel 04', videoUrl: null },
  ]);

  const [playingSlot, setPlayingSlot] = useState<number | null>(null);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);

  useEffect(() => {
    let localData: ReelSlot[] | null = null;
    try {
      const stored = localStorage.getItem('velorah_uploaded_reels');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length === 4) {
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

  const handleHomeClick = (e: React.MouseEvent) => {
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

  return (
    <section
      id="design-work"
      className="w-full min-h-screen h-screen relative overflow-hidden flex flex-col justify-between snap-start snap-always shrink-0 bg-background text-foreground select-none"
    >
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none transform translate-z-0"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4"
      />

      <div className="absolute inset-0 bg-black/45 pointer-events-none z-[1]" />

      <header className="relative z-10 w-full">
        <div className="flex row justify-between items-center px-6 sm:px-8 py-4 sm:py-5 max-w-7xl mx-auto w-full">
          <a
            href="#hero"
            onClick={handleHomeClick}
            className="text-2xl sm:text-3xl tracking-tight text-foreground transition-opacity hover:opacity-90 inline-flex items-baseline cursor-pointer"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            HOME
          </a>

          <button
            type="button"
            onClick={onNavigateToPage3}
            className="liquid-glass rounded-full px-5 sm:px-6 py-2 text-xs sm:text-sm text-foreground hover:scale-[1.03] transition-transform duration-200 cursor-pointer"
          >
            3D Space
          </button>
        </div>
      </header>

      <main className="relative z-10 flex flex-col items-center justify-center text-center px-4 sm:px-6 my-auto max-w-7xl w-full mx-auto">
        <h1
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-[1.05] tracking-[-1.5px] max-w-4xl font-normal text-foreground animate-fade-rise"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Stacking <em className="not-italic text-muted-foreground">skills</em> with{' '}
          <em className="not-italic text-muted-foreground">every experience.</em>
        </h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-5 w-full mt-5 sm:mt-7 max-w-5xl animate-fade-rise-delay">
          {reels.map((reel) => (
            <ReelCard
              key={reel.slot}
              reel={reel}
              isActive={playingSlot === reel.slot}
              onTogglePlay={() => togglePlay(reel.slot)}
              onFileUpload={(file) => handleFileUpload(reel.slot, file)}
              onRemoveReel={(e) => handleRemoveReel(e, reel.slot)}
              isSlotUploading={uploadingSlot === reel.slot}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={onNavigateToPage3}
          className="liquid-glass rounded-full px-10 sm:px-14 py-3 sm:py-3.5 text-sm sm:text-base text-foreground mt-6 sm:mt-8 hover:scale-[1.03] cursor-pointer animate-fade-rise-delay-2 transition-transform duration-200"
        >
          Continue
        </button>
      </main>

      <div className="relative z-10 h-6 w-full pointer-events-none" />
    </section>
  );
}
