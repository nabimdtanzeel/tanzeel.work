import React, { useState, useEffect, useRef } from 'react';

interface MacRetroScreenProps {
  isInView: boolean;
  isOnline: boolean;
}

interface SocialItem {
  id: string;
  name: string;
  href: string;
  icon: (props: { className?: string }) => React.JSX.Element;
}

const SOCIAL_ITEMS: SocialItem[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    href: 'https://www.instagram.com/toosoonmaybeee/',
    icon: ({ className = 'w-5 h-5' }) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeWidth="2.5" />
      </svg>
    ),
  },
  {
    id: 'gmail',
    name: 'Gmail',
    href: 'mailto:nabimdtanzeel@gmail.com',
    icon: ({ className = 'w-5 h-5' }) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
    ),
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    href: 'https://www.linkedin.com',
    icon: ({ className = 'w-5 h-5' }) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    ),
  },
  {
    id: 'behance',
    name: 'Behance',
    href: 'https://www.behance.net',
    icon: ({ className = 'w-5 h-5' }) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M3 8h4.5a2.5 2.5 0 0 1 0 5H3V8zm0 5h5a2.5 2.5 0 0 1 0 5H3v-5zM14 14.5a3 3 0 1 0 6 0c0-2-1.5-3.5-3-3.5a3 3 0 0 0-3 3.5zm0 0h6M15 8.5h4" />
      </svg>
    ),
  },
  {
    id: 'youtube',
    name: 'YouTube',
    href: 'https://www.youtube.com',
    icon: ({ className = 'w-5 h-5' }) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
        <polygon points="10 15 15 12 10 9" fill="currentColor" />
      </svg>
    ),
  },
];

export default function MacRetroScreen({ isInView, isOnline }: MacRetroScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [screenCoords, setScreenCoords] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
    scale: number;
  }>({
    left: 0,
    top: 0,
    width: 271,
    height: 219,
    scale: 1,
  });

  const [powerOn, setPowerOn] = useState(false);
  const [typedLength, setTypedLength] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const fullMessage = "Let's work together.";

  // Calculate pixel bounds of CRT screen in container
  useEffect(() => {
    const updateCoords = () => {
      const container = containerRef.current?.parentElement;
      if (!container) return;

      const containerW = container.clientWidth;
      const containerH = container.clientHeight;

      const videoAspect = 1920 / 1080;
      const containerAspect = containerW / containerH;

      let s = 1;
      let offsetX = 0;
      let offsetY = 0;

      if (containerAspect > videoAspect) {
        s = containerW / 1920;
        const renderedH = 1080 * s;
        offsetY = containerH - renderedH;
        offsetX = 0;
      } else {
        s = containerH / 1080;
        const renderedW = 1920 * s;
        offsetX = (containerW - renderedW) / 2;
        offsetY = 0;
      }

      setScreenCoords({
        left: offsetX + 806 * s,
        top: offsetY + 505 * s,
        width: 271 * s,
        height: 219 * s,
        scale: s,
      });
    };

    updateCoords();
    window.addEventListener('resize', updateCoords);
    return () => window.removeEventListener('resize', updateCoords);
  }, []);

  // CRT power-on trigger
  useEffect(() => {
    if (isInView && isOnline) {
      const timer = setTimeout(() => {
        setPowerOn(true);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setPowerOn(false);
      setTypedLength(0);
    }
  }, [isInView, isOnline]);

  // Typewriter effect
  useEffect(() => {
    if (!powerOn) {
      setTypedLength(0);
      return;
    }

    // Delay typing slightly until the CRT flash finishes
    const startTimeout = setTimeout(() => {
      const interval = setInterval(() => {
        setTypedLength((prev) => {
          if (prev < fullMessage.length) {
            return prev + 1;
          } else {
            clearInterval(interval);
            return prev;
          }
        });
      }, 65);

      return () => clearInterval(interval);
    }, 600);

    return () => clearTimeout(startTimeout);
  }, [powerOn, fullMessage.length]);

  // Blinking cursor
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor((v) => !v);
    }, 530);
    return () => clearInterval(cursorInterval);
  }, []);

  const s = screenCoords.scale;
  const isMobileScreen = screenCoords.width < 230;

  if (!isOnline && !powerOn) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        left: `${screenCoords.left}px`,
        top: `${screenCoords.top}px`,
        width: `${screenCoords.width}px`,
        height: `${screenCoords.height}px`,
        zIndex: 12,
        borderRadius: `${Math.max(6 * s, 4)}px`,
      }}
      className={`pointer-events-auto overflow-hidden select-none transition-opacity duration-500 ${
        powerOn ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* CRT Bezel Glow & Shadow */}
      <div
        className="absolute inset-0 pointer-events-none z-30"
        style={{
          boxShadow: `0 0 ${16 * s}px ${3 * s}px rgba(90, 140, 255, 0.3), inset 0 0 ${12 * s}px rgba(0, 5, 25, 0.85)`,
          borderRadius: 'inherit',
        }}
      />

      {/* Screen Glass Reflection Sheen */}
      <div
        className="absolute inset-0 pointer-events-none z-20"
        style={{
          background:
            'linear-gradient(135deg, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0.04) 35%, transparent 60%)',
          borderRadius: 'inherit',
        }}
      />

      {/* Subtle Scanline Overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.28) 0px, rgba(0, 0, 0, 0.28) 1px, transparent 1px, transparent 3px)',
        }}
      />

      {/* Retro Desktop Content Container with CRT power-on expansion */}
      <div
        style={{
          backgroundColor: '#070f22',
          backgroundImage:
            'radial-gradient(ellipse at center, rgba(16, 32, 70, 0.95) 0%, rgba(6, 12, 28, 0.98) 100%)',
          fontFamily: "'VT323', 'Press Start 2P', monospace",
          color: '#CFE0FF',
        }}
        className={`w-full h-full relative flex flex-col justify-between p-2 sm:p-2.5 box-border overflow-hidden ${
          powerOn ? 'animate-crt-power-on' : ''
        }`}
      >
        {/* Top Desktop Bar / Header */}
        <div className="w-full flex items-center justify-between border-b border-[#CFE0FF]/20 pb-1">
          <div className="flex items-center gap-1">
            <span
              className="inline-block w-1.5 h-1.5 rounded-full bg-[#CFE0FF]"
              style={{ boxShadow: '0 0 4px #CFE0FF' }}
            />
            <span
              className="text-[#CFE0FF]/70 tracking-wider uppercase"
              style={{ fontSize: `${Math.max(9 * s, 8)}px` }}
            >
              FINDER
            </span>
          </div>
          <span
            className="text-[#CFE0FF]/50 tracking-widest font-mono"
            style={{ fontSize: `${Math.max(8 * s, 7)}px` }}
          >
            SYS 7.1
          </span>
        </div>

        {/* Center Typewriter Message */}
        <div className="my-auto text-center px-1">
          <p
            className="text-[#CFE0FF] font-mono tracking-wide leading-tight drop-shadow-[0_0_8px_rgba(207,224,255,0.7)]"
            style={{
              fontSize: `${Math.max(14 * s, 11)}px`,
              fontFamily: "'VT323', monospace",
            }}
          >
            {fullMessage.slice(0, typedLength)}
            <span
              className="inline-block ml-0.5 text-[#CFE0FF]"
              style={{ opacity: showCursor ? 1 : 0 }}
            >
              _
            </span>
          </p>
        </div>

        {/* Retro Desktop Icons Grid */}
        <div
          className={`w-full flex items-center justify-center gap-1.5 sm:gap-2 pb-0.5 ${
            isMobileScreen ? 'flex-wrap' : 'flex-nowrap'
          }`}
        >
          {SOCIAL_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.id}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                title={item.name}
                style={{
                  padding: `${Math.max(2.5 * s, 2)}px ${Math.max(3.5 * s, 3)}px`,
                  borderRadius: `${Math.max(3 * s, 2)}px`,
                }}
                className="group flex flex-col items-center justify-center text-[#CFE0FF] hover:bg-[#CFE0FF] hover:text-[#070f22] hover:shadow-[0_0_10px_rgba(207,224,255,0.8)] transition-colors duration-150 cursor-pointer text-decoration-none"
              >
                <Icon
                  className="transition-transform group-hover:scale-105"
                  {...{
                    style: {
                      width: `${Math.max(17 * s, 14)}px`,
                      height: `${Math.max(17 * s, 14)}px`,
                    },
                  }}
                />
                <span
                  className="font-mono mt-0.5 leading-none tracking-tight text-center truncate max-w-[42px] sm:max-w-none"
                  style={{
                    fontSize: `${Math.max(8.5 * s, 7)}px`,
                    fontFamily: "'VT323', monospace",
                  }}
                >
                  {item.name}
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
