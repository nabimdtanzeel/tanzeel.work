import React, { useState, useRef, useEffect } from 'react';
import MacRetroScreen from './MacRetroScreen';

interface OfflineFooterSectionProps {
  onNavigateToTop?: () => void;
  onNavigateToPage3?: () => void;
}

export default function OfflineFooterSection({ onNavigateToTop, onNavigateToPage3 }: OfflineFooterSectionProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [litValue, setLitValue] = useState(0);
  const [glowingDot, setGlowingDot] = useState<{ x: number; y: number; scale: number; opacity: number } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 900);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const triggerGoOffline = (startFromCurrent = false) => {
    const vid = videoRef.current;
    if (!vid) return;

    setIsTransitioning(true);
    if (!startFromCurrent) {
      vid.currentTime = 2.3;
    }
    vid.play().catch(() => {});

    let dotTriggered = false;

    const checkCollapse = () => {
      if (vid.currentTime >= 4.72 && !dotTriggered) {
        dotTriggered = true;
        const powerBtn = document.getElementById('power-wordmark-btn-4');
        const rect = powerBtn?.getBoundingClientRect();
        const startX = window.innerWidth / 2;
        const startY = window.innerHeight * 0.7;
        const targetX = rect ? rect.left + rect.width / 2 : 50;
        const targetY = rect ? rect.top + rect.height / 2 : 50;

        const startTime = performance.now();
        const duration = 780;

        const animateDot = (now: number) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

          const currentX = startX + (targetX - startX) * ease - 16;
          const currentY = startY + (targetY - startY) * ease - 16;
          const scale = 1 + Math.sin(progress * Math.PI) * 1.5;

          setGlowingDot({ x: currentX, y: currentY, scale, opacity: 1 - progress * 0.2 });

          if (progress < 1) {
            requestAnimationFrame(animateDot);
          } else {
            setGlowingDot(null);
            setLitValue(0.9);
            const litInterval = setInterval(() => {
              setLitValue((prev) => {
                if (prev <= 0.05) {
                  clearInterval(litInterval);
                  return 0;
                }
                return prev - 0.1;
              });
            }, 100);
          }
        };
        requestAnimationFrame(animateDot);
      }

      if (vid.currentTime >= 5.0 || vid.ended) {
        vid.pause();
        setIsOnline(false);
        setIsTransitioning(false);
        vid.removeEventListener('timeupdate', checkCollapse);
      }
    };

    vid.addEventListener('timeupdate', checkCollapse);
  };

  const triggerGoOnline = () => {
    const vid = videoRef.current;
    if (!vid) return;

    setIsTransitioning(true);
    vid.currentTime = 0.6;
    vid.play().catch(() => {});

    const checkSwitchOn = () => {
      if (vid.currentTime >= 2.3) {
        vid.pause();
        setIsOnline(true);
        setIsTransitioning(false);
        vid.removeEventListener('timeupdate', checkSwitchOn);
      }
    };
    vid.addEventListener('timeupdate', checkSwitchOn);
  };

  // Run automatically when the user arrives at this specific page
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isInView) {
          setIsInView(true);
          const vid = videoRef.current;
          if (vid) {
            // Play arrival switch-on and seamlessly continue into the offline sequence
            vid.currentTime = 0.6;
            vid.play().catch(() => {});
            const handleInitialPlay = () => {
              if (vid.currentTime >= 2.2) {
                vid.removeEventListener('timeupdate', handleInitialPlay);
                triggerGoOffline(true);
              }
            };
            vid.addEventListener('timeupdate', handleInitialPlay);
          }
        }
      },
      { threshold: 0.35 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    return () => observer.disconnect();
  }, [isInView]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let scanlineY = 0;
    const glints: { x: number; y: number; size: number; alpha: number; speed: number }[] = [];

    for (let i = 0; i < 15; i++) {
      glints.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * (window.innerHeight * 0.4),
        size: Math.random() * 2 + 1,
        alpha: Math.random(),
        speed: Math.random() * 0.02 + 0.01,
      });
    }

    const render = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      scanlineY += 2;
      if (scanlineY > canvas.height + 100) scanlineY = -100;

      const grad = ctx.createLinearGradient(0, scanlineY, 0, scanlineY + 52);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.08)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = grad;
      ctx.fillRect(0, scanlineY, canvas.width, 52);

      const targetGlintCount = isOnline ? 12 : 22;
      while (glints.length < targetGlintCount) {
        glints.push({
          x: Math.random() * canvas.width,
          y: Math.random() * (canvas.height * 0.45),
          size: Math.random() * 2 + 1,
          alpha: Math.random(),
          speed: Math.random() * 0.03 + 0.01,
        });
      }

      glints.forEach((g) => {
        g.alpha += g.speed;
        if (g.alpha > 1 || g.alpha < 0.1) g.speed *= -1;

        ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(g.alpha)})`;
        ctx.beginPath();
        ctx.arc(g.x, g.y, g.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `rgba(255, 255, 255, ${Math.abs(g.alpha) * 0.6})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(g.x - g.size * 2.5, g.y);
        ctx.lineTo(g.x + g.size * 2.5, g.y);
        ctx.moveTo(g.x, g.y - g.size * 2.5);
        ctx.lineTo(g.x, g.y + g.size * 2.5);
        ctx.stroke();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isOnline]);

  const handlePowerClick = () => {
    if (isTransitioning) return;
    if (isOnline) {
      triggerGoOffline(false);
    } else {
      triggerGoOnline();
    }
  };

  const videoSrc = isMobile
    ? 'https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/15017aa7-135b-471f-a8a1-42a208bc61b2.mp4'
    : 'https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/abdab52e-bb1b-477d-ae7c-26c5f8915433.mp4';

  const posterSrc = 'https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/af6deff1-d678-4dc6-ae24-2880b16cdb20.jpg';

  return (
    <footer
      id="offline-footer-section"
      ref={sectionRef}
      className="w-full h-[100svh] relative overflow-hidden flex flex-col justify-between snap-start snap-always shrink-0 bg-black text-white select-none"
    >
      <video
        ref={videoRef}
        src={videoSrc}
        poster={posterSrc}
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover object-bottom z-0 transform translate-z-0 pointer-events-none"
      />

      <div className="absolute top-0 inset-x-0 h-[38%] bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none z-[1]" />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-[2]" />

      {glowingDot && (
        <div
          style={{
            position: 'fixed',
            left: `${glowingDot.x}px`,
            top: `${glowingDot.y}px`,
            transform: `scale(${glowingDot.scale})`,
            opacity: glowingDot.opacity,
            zIndex: 50,
            pointerEvents: 'none',
          }}
          className="w-8 h-8 rounded-full bg-white shadow-[0_0_24px_8px_rgba(255,255,255,0.9)] transition-transform"
        />
      )}

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 pt-12 sm:pt-16 flex justify-start items-center">
        <div className="flex items-center">
          <button
            id="power-wordmark-btn-4"
            type="button"
            onClick={handlePowerClick}
            aria-pressed={!isOnline}
            className="relative inline-flex items-center justify-center cursor-pointer hover:scale-[0.94] transition-transform group"
            title={isOnline ? 'Click to log off (power off)' : 'Click to turn back on'}
            style={{
              filter: litValue > 0 ? `drop-shadow(0 0 ${litValue * 18}px rgba(255,255,255,0.9))` : undefined,
            }}
          >
            <svg
              viewBox="0 0 50 62"
              className="w-[28px] sm:w-[38px] h-[34px] sm:h-[46px] text-white stroke-[4.6]"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14.2 22.6 A19 19 0 1 0 35.8 22.6" />
              <path d="M25 6.5 V33" />
            </svg>
            <span
              className="absolute inset-0 rounded-full bg-white blur-md transition-opacity duration-300 pointer-events-none"
              style={{ opacity: litValue }}
            />
          </button>
        </div>
      </div>

      {/* Mac Retro Desktop CRT Screen Overlay */}
      <MacRetroScreen isInView={isInView} isOnline={isOnline} />

      {/* Back to Top button in bottom-right corner */}
      <div className="absolute bottom-6 right-8 z-20">
        <button
          type="button"
          onClick={() => {
            if (onNavigateToTop) onNavigateToTop();
            else window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="text-xs text-white/60 hover:text-white transition-colors cursor-pointer bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10"
        >
          &uarr; Back to Top
        </button>
      </div>
    </footer>
  );
}
