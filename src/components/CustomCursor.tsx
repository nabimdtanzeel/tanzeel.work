import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Maximize2 } from 'lucide-react';

type CursorMode = 'default' | 'pointer' | 'play' | 'pause' | 'view' | 'text' | 'hidden';

interface TrailPoint {
  x: number;
  y: number;
  time: number;
}

const TRAIL_LIFETIME_MS = 220;
const MAX_TRAIL_POINTS = 26;

export default function CustomCursor() {
  const [mode, setMode] = useState<CursorMode>('default');
  const [isClicking, setIsClicking] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const mousePos = useRef({ x: -100, y: -100 });
  const followerPos = useRef({ x: -100, y: -100 });
  const trailPoints = useRef<TrailPoint[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (isTouchDevice) return;
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [isTouchDevice]);

  useEffect(() => {
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Check if device supports fine cursor or is touch
    const checkTouch = () => {
      const isCoarse = window.matchMedia('(pointer: coarse)').matches;
      const isHoverNone = window.matchMedia('(hover: none)').matches;
      const touch = isCoarse || isHoverNone;
      setIsTouchDevice(touch);
      if (touch) {
        document.documentElement.classList.remove('has-custom-cursor');
      } else {
        document.documentElement.classList.add('has-custom-cursor');
      }
    };

    checkTouch();
    window.addEventListener('resize', checkTouch);

    const handlePointerMove = (e: PointerEvent) => {
      const isFirstMove = mousePos.current.x < 0 && mousePos.current.y < 0;
      mousePos.current = { x: e.clientX, y: e.clientY };
      if (isFirstMove) {
        followerPos.current = { x: e.clientX, y: e.clientY };
      }
      setIsVisible((prev) => (prev ? prev : true));

      // Record point for white trail
      if (!reducedMotionQuery.matches) {
        const points = trailPoints.current;
        const last = points[points.length - 1];
        const distSq = last ? (e.clientX - last.x) ** 2 + (e.clientY - last.y) ** 2 : Infinity;
        if (distSq > 2) {
          points.push({ x: e.clientX, y: e.clientY, time: performance.now() });
          if (points.length > MAX_TRAIL_POINTS) {
            points.shift();
          }
        }
      }

      // Directly update dot without waiting for lerp loop for zero perceived latency
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }

      // Detect hover target type
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const cursorEl = target.closest('[data-cursor]') as HTMLElement | null;
      if (cursorEl) {
        const customType = cursorEl.getAttribute('data-cursor') as CursorMode;
        if (customType) {
          setMode(customType);
          return;
        }
      }

      const isInteractive = target.closest('a, button, input, textarea, [role="button"], label');
      if (isInteractive) {
        setMode('pointer');
        return;
      }

      const isText = target.closest('p, h1, h2, h3, span, em');
      if (isText && !target.closest('a, button')) {
        setMode('text');
        return;
      }

      setMode('default');
    };

    const handlePointerDown = () => setIsClicking(true);
    const handlePointerUp = () => setIsClicking(false);
    const handleMouseLeave = () => {
      setIsVisible(false);
      trailPoints.current = [];
    };
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    // Smooth lerp loop for outer follower ring & crisp white trail
    const updateLoop = () => {
      const lerp = 0.16;
      followerPos.current.x += (mousePos.current.x - followerPos.current.x) * lerp;
      followerPos.current.y += (mousePos.current.y - followerPos.current.y) * lerp;

      if (followerRef.current) {
        followerRef.current.style.transform = `translate3d(${followerPos.current.x}px, ${followerPos.current.y}px, 0)`;
      }

      // Draw crisp tapered white trail (no glow/blur)
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

          const now = performance.now();
          const points = trailPoints.current;
          while (points.length > 0 && now - points[0].time > TRAIL_LIFETIME_MS) {
            points.shift();
          }

          if (points.length > 1 && !reducedMotionQuery.matches) {
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            for (let i = 1; i < points.length; i++) {
              const prev = points[i - 1];
              const curr = points[i];
              const ageRatio = 1 - (now - curr.time) / TRAIL_LIFETIME_MS;
              const progress = i / (points.length - 1);
              const strength = Math.max(0, Math.min(1, ageRatio * progress));

              ctx.beginPath();
              if (i === 1) {
                ctx.moveTo(prev.x, prev.y);
                ctx.lineTo(curr.x, curr.y);
              } else {
                const prev2 = points[i - 2];
                const mid1X = (prev2.x + prev.x) * 0.5;
                const mid1Y = (prev2.y + prev.y) * 0.5;
                const mid2X = (prev.x + curr.x) * 0.5;
                const mid2Y = (prev.y + curr.y) * 0.5;
                ctx.moveTo(mid1X, mid1Y);
                ctx.quadraticCurveTo(prev.x, prev.y, mid2X, mid2Y);
              }

              ctx.strokeStyle = `rgba(255, 255, 255, ${(strength * 0.72).toFixed(3)})`;
              ctx.lineWidth = Math.max(0.5, strength * 3.2);
              ctx.stroke();
            }
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(updateLoop);
    };

    animFrameRef.current = requestAnimationFrame(updateLoop);

    return () => {
      document.documentElement.classList.remove('has-custom-cursor');
      window.removeEventListener('resize', checkTouch);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  if (isTouchDevice) {
    return null; // Keep natural mobile browser feel
  }

  // Follower sizing and style by mode
  const getFollowerStyles = () => {
    switch (mode) {
      case 'pointer':
        return {
          width: '46px',
          height: '46px',
          borderColor: 'rgba(255, 255, 255, 0.75)',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          scale: isClicking ? 0.85 : 1.15,
        };
      case 'play':
      case 'pause':
        return {
          width: '64px',
          height: '64px',
          borderColor: 'rgba(255, 255, 255, 0.85)',
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          scale: isClicking ? 0.9 : 1.1,
        };
      case 'view':
        return {
          width: '58px',
          height: '58px',
          borderColor: 'rgba(255, 255, 255, 0.85)',
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          scale: isClicking ? 0.9 : 1.1,
        };
      case 'text':
        return {
          width: '32px',
          height: '32px',
          borderColor: 'rgba(255, 255, 255, 0.35)',
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          scale: 0.9,
        };
      default:
        return {
          width: '28px',
          height: '28px',
          borderColor: 'rgba(255, 255, 255, 0.45)',
          backgroundColor: 'transparent',
          scale: isClicking ? 0.8 : 1,
        };
    }
  };

  const followerStyle = getFollowerStyles();

  return (
    <>
      {/* Crisp white ribbon trail */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-[9998]"
      />

      {/* Outer fluid trailing ring */}
      <div
        ref={followerRef}
        aria-hidden="true"
        className="fixed top-0 left-0 pointer-events-none z-[9999]"
        style={{
          transform: `translate3d(${followerPos.current.x}px, ${followerPos.current.y}px, 0)`,
          opacity: isVisible ? 1 : 0,
        }}
      >
        <div
          className="-translate-x-1/2 -translate-y-1/2 rounded-full border transition-all duration-150 ease-out backdrop-blur-[2px] flex items-center justify-center select-none"
          style={{
            width: followerStyle.width,
            height: followerStyle.height,
            borderColor: followerStyle.borderColor,
            backgroundColor: followerStyle.backgroundColor,
            transform: `scale(${followerStyle.scale})`,
          }}
        >
          {mode === 'play' && (
            <Play className="w-4 h-4 fill-white text-white ml-0.5" />
          )}
          {mode === 'pause' && (
            <Pause className="w-4 h-4 fill-white text-white" />
          )}
          {mode === 'view' && (
            <Maximize2 className="w-4 h-4 text-white" />
          )}
        </div>
      </div>

      {/* Crisp center dot */}
      <div
        ref={dotRef}
        aria-hidden="true"
        className="fixed top-0 left-0 pointer-events-none z-[10000] transition-opacity duration-150"
        style={{
          opacity: isVisible && mode !== 'play' && mode !== 'pause' && mode !== 'view' ? 1 : 0,
          transform: `translate3d(${mousePos.current.x}px, ${mousePos.current.y}px, 0)`,
        }}
      >
        <div
          className="-translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white transition-transform duration-100"
          style={{
            transform: `scale(${isClicking ? 0.7 : 1})`,
          }}
        />
      </div>
    </>
  );
}
