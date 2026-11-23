import React, { useState, useRef, useEffect } from 'react';
import { ParallaxLayer } from '../context/ParallaxContext';
import { useMagnetic } from '../hooks/useMagnetic';
import { mountWave } from './NeonWave';
import { Split } from '../lib/replayAnim';

interface OfflineFooterSectionProps {
  onNavigateToTop?: () => void;
  onNavigateToPage3?: () => void;
}

// Magnetic pill button with max 6px pull and 250ms ease
function MagneticPillButton({
  children,
  href,
  target,
  rel,
  title,
  ariaLabel,
  className = '',
  style,
}: {
  children: React.ReactNode;
  href: string;
  target?: string;
  rel?: string;
  title?: string;
  ariaLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const buttonRef = useRef<HTMLAnchorElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distanceX = (e.clientX - centerX) / (rect.width / 2);
    const distanceY = (e.clientY - centerY) / (rect.height / 2);
    // Max 6px magnetic pull
    setOffset({
      x: Math.max(-6, Math.min(6, distanceX * 6)),
      y: Math.max(-6, Math.min(6, distanceY * 6)),
    });
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setOffset({ x: 0, y: 0 });
    setIsHovered(false);
  };

  return (
    <a
      ref={buttonRef}
      href={href}
      target={target}
      rel={rel}
      title={title}
      aria-label={ariaLabel}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      data-cursor="pointer"
      style={{
        ...style,
        transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${isHovered ? 1.12 : 1})`,
        transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 250ms ease-out, background-color 250ms ease-out, border-color 250ms ease-out',
      }}
      className={`group relative inline-flex items-center justify-center p-2 transition-all duration-250 ease-out cursor-pointer ${className}`}
    >
      {children}
    </a>
  );
}

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
      className="text-2xl sm:text-3xl tracking-tight text-[#F2EDE0] transition-colors duration-250 ease-out inline-flex items-baseline cursor-pointer origin-left"
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

export default function OfflineFooterSection({ onNavigateToTop }: OfflineFooterSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [headingTilt, setHeadingTilt] = useState({ x: 0, y: 0 });

  // Check prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (sectionRef.current) return mountWave(sectionRef.current);
  }, []);

  const handleHomeClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (onNavigateToTop) {
      onNavigateToTop();
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <section
      id="offline-footer-section"
      ref={sectionRef}
      onMouseMove={(e) => {
        if (reducedMotion || !sectionRef.current) return;
        const rect = sectionRef.current.getBoundingClientRect();
        const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const normY = ((e.clientY - rect.top) / rect.height) * 2 - 1;
        setHeadingTilt({ x: normX * 4, y: normY * 4 });
      }}
      onMouseLeave={() => setHeadingTilt({ x: 0, y: 0 })}
      className="w-full h-screen min-h-screen relative flex flex-col justify-between shrink-0 bg-black text-white select-none py-4 sm:py-6"
    >
      <header className="relative z-10 w-full shrink-0">
        <div className="flex row justify-between items-center px-6 sm:px-8 py-2 sm:py-3 max-w-7xl mx-auto w-full">
          <div data-anim="drop" style={{ '--i': 0 } as React.CSSProperties}>
            <MagneticHomeLink onClick={handleHomeClick} />
          </div>
        </div>
      </header>

      <ParallaxLayer
        pageIndex={3}
        layer="foreground"
        className="relative z-10 w-full max-w-[1100px] mx-auto flex flex-col items-center justify-center text-center px-6 mt-auto mb-[18vh] sm:mb-[20vh] lg:mb-28"
      >
        {/* Standalone Social Logos (middle, just above Wanna connect?) */}
        <div
          className="mb-6 sm:mb-8 md:mb-10 flex flex-row items-center justify-center gap-3 sm:gap-10 md:gap-12"
        >
          {/* Instagram Logo */}
          <div data-anim="pop" style={{ '--i': 0 } as React.CSSProperties}>
            <MagneticPillButton
              href="https://www.instagram.com/tanzeelllllllll/"
              target="_blank"
              rel="noopener noreferrer"
              title="Instagram"
              ariaLabel="Visit Instagram"
            >
            {/* Realistic Full-Color Instagram Logo */}
            <svg
              className="w-20 h-20 sm:w-[88px] sm:h-[88px] transition-transform duration-250 ease-out group-hover:scale-110 shrink-0 drop-shadow-[0_4px_16px_rgba(0,0,0,0.45)]"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <radialGradient id="ig-logo-grad" cx="30%" cy="107%" r="150%">
                  <stop offset="0%" stopColor="#FDF497" />
                  <stop offset="8%" stopColor="#FDF497" />
                  <stop offset="45%" stopColor="#FD5949" />
                  <stop offset="65%" stopColor="#D6249F" />
                  <stop offset="92%" stopColor="#285AEB" />
                </radialGradient>
                <linearGradient id="ig-logo-shine" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.22" />
                  <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0" />
                </linearGradient>
              </defs>
              <rect x="1.5" y="1.5" width="21" height="21" rx="5.5" fill="url(#ig-logo-grad)" />
              <rect x="1.5" y="1.5" width="21" height="21" rx="5.5" fill="url(#ig-logo-shine)" />
              <rect
                x="5.6"
                y="5.6"
                width="12.8"
                height="12.8"
                rx="3.7"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="1.65"
              />
              <circle
                cx="12"
                cy="12"
                r="3.1"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="1.65"
              />
              <circle cx="16" cy="8" r="0.95" fill="#FFFFFF" />
            </svg>
            </MagneticPillButton>
          </div>

          {/* Gmail Logo */}
          <div data-anim="glow" style={{ '--i': 1 } as React.CSSProperties}>
            <MagneticPillButton
              href="mailto:nabimdtanzeel@gmail.com"
              title="Email me"
              ariaLabel="Email me"
            >
              {/* Real Gmail Envelope Logo */}
              <svg
                className="w-20 h-20 sm:w-[88px] sm:h-[88px] transition-transform duration-250 ease-out group-hover:scale-110 shrink-0 drop-shadow-[0_4px_16px_rgba(0,0,0,0.45)]"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect x="2" y="4" width="20" height="16" rx="2.5" fill="#FFFFFF" />
                <path
                  d="M2 5.5L12 13L22 5.5V18.5C22 19.33 21.33 20 20.5 20H3.5C2.67 20 2 19.33 2 18.5V5.5Z"
                  fill="#FFFFFF"
                />
                <path
                  d="M2 5.2V18.8C2 19.46 2.54 20 3.2 20H6V9.5L2 6.5V5.2Z"
                  fill="#C5221F"
                />
                <path
                  d="M22 5.2V18.8C22 19.46 21.46 20 20.8 20H18V9.5L22 6.5V5.2Z"
                  fill="#C5221F"
                />
                <path
                  d="M2 5.2L12 12.8L22 5.2V4.8C22 4.14 21.46 3.6 20.8 3.6H3.2C2.54 3.6 2 4.14 2 4.8V5.2Z"
                  fill="#EA4335"
                />
              </svg>
            </MagneticPillButton>
          </div>

          {/* Discord Logo */}
          <div data-anim="pop" style={{ '--i': 2 } as React.CSSProperties}>
            <MagneticPillButton
              href="https://discord.com/users/767656399026913311"
              target="_blank"
              rel="noopener noreferrer"
              title="Discord"
              ariaLabel="Visit Discord"
            >
              {/* Realistic Full-Color Discord Logo */}
              <svg
                className="w-20 h-20 sm:w-[88px] sm:h-[88px] transition-transform duration-250 ease-out group-hover:scale-110 shrink-0 drop-shadow-[0_4px_16px_rgba(0,0,0,0.45)]"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="discord-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6B77FF" />
                    <stop offset="55%" stopColor="#5865F2" />
                    <stop offset="100%" stopColor="#434ECA" />
                  </linearGradient>
                  <linearGradient id="discord-logo-shine" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.22" />
                    <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <rect x="1.5" y="1.5" width="21" height="21" rx="5.5" fill="url(#discord-logo-grad)" />
                <rect x="1.5" y="1.5" width="21" height="21" rx="5.5" fill="url(#discord-logo-shine)" />
                <g transform="translate(5.5, 7.07) scale(0.10225)">
                  <path
                    fill="#FFFFFF"
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"
                  />
                </g>
              </svg>
            </MagneticPillButton>
          </div>
        </div>

        {/* Heading: Two lines, off-white (#F2EDE0), tight line-height, with "connect?" in italic serif */}
        <h2
          style={{
            transform: reducedMotion
              ? undefined
              : `perspective(1000px) rotateX(${-headingTilt.y}deg) rotateY(${headingTilt.x}deg)`,
            transformStyle: 'preserve-3d',
          }}
          className="font-sans font-medium leading-[0.95] tracking-[-0.05em] text-[#F2EDE0] text-[clamp(42px,min(12vw,11vh),120px)] [text-shadow:0_4px_40px_rgba(0,0,0,0.4)] select-none text-center transition-transform duration-200 ease-out cursor-default"
        >
          <span className="block transition-all duration-300">
            <Split text="Wanna" type="flip" start={2} />
          </span>
          <span className="block mt-1 sm:mt-2">
            <em
              className="not-italic font-normal tracking-tight text-[#F2EDE0] hover:text-white transition-colors duration-300"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              <Split text="connect?" type="wipe" start={3} />
            </em>
          </span>
        </h2>
      </ParallaxLayer>

      <div className="relative z-10 h-4 w-full pointer-events-none" />
    </section>
  );
}
