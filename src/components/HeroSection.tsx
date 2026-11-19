import React, { useRef, useState, MouseEvent } from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { ParallaxLayer } from '../context/ParallaxContext';
import { useMagnetic } from '../hooks/useMagnetic';
import { Split } from '../lib/replayAnim';

const NAV_ITEMS = [
  'Design Work',
  'Creative Visuals',
  'Connect',
];

interface HeroSectionProps {
  onNavigateToDesignWork?: () => void;
  onNavigateTo3D?: () => void;
  onNavigateToPage4?: () => void;
}

function MagneticNavLink({
  item,
  href,
  onClick,
}: {
  item: string;
  href: string;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
}) {
  const { ref, style, onMouseMove, onMouseEnter, onMouseLeave, isHovered } = useMagnetic<HTMLAnchorElement>({
    maxDisplacement: 8,
    scale: 1.25,
    damping: 0.35,
  });

  return (
    <a
      ref={ref}
      href={href}
      onClick={onClick}
      onMouseMove={onMouseMove}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      data-cursor="pointer"
      className="text-[10px] sm:text-xs md:text-sm font-medium tracking-wide whitespace-nowrap transition-colors duration-250 ease-out cursor-pointer inline-block origin-center text-[#E1E0CC]/80 hover:text-white"
      style={{
        ...style,
        color: isHovered ? '#FFFFFF' : 'rgba(225, 224, 204, 0.8)',
      }}
    >
      {item}
    </a>
  );
}

function MagneticCTAButton({
  onClick,
}: {
  onClick: (e: MouseEvent<HTMLAnchorElement>) => void;
}) {
  const { ref, style, onMouseMove, onMouseEnter, onMouseLeave, isHovered } = useMagnetic<HTMLAnchorElement>({
    maxDisplacement: 10,
    scale: 1.08,
    damping: 0.3,
  });

  return (
    <a
      ref={ref}
      id="hero-cta-button"
      href="#design-work"
      onClick={onClick}
      onMouseMove={onMouseMove}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      data-cursor="pointer"
      style={style}
      className="group inline-flex items-center bg-[#DEDBC8] rounded-full pl-5 sm:pl-6 pr-1.5 sm:pr-2 py-1.5 sm:py-2 text-black font-medium text-xs sm:text-sm md:text-base gap-3 hover:gap-5 shadow-xl cursor-pointer"
    >
      <span className="whitespace-nowrap font-medium">Explore</span>
      <div
        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black flex items-center justify-center text-[#DEDBC8] transition-transform duration-300 shrink-0 ${
          isHovered ? 'scale-110 rotate-45' : ''
        }`}
      >
        <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-[#DEDBC8]" />
      </div>
    </a>
  );
}

export default function HeroSection({ onNavigateToDesignWork, onNavigateTo3D, onNavigateToPage4 }: HeroSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mouseTilt, setMouseTilt] = useState({ x: 0, y: 0 });

  const headingWords = ['Tanzeel'];

  const handleHeroMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const normY = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    setMouseTilt({ x: normX * 4.5, y: normY * 4.5 });
  };

  const handleHeroMouseLeave = () => {
    setMouseTilt({ x: 0, y: 0 });
  };

  const handleDesignWorkClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (onNavigateToDesignWork) {
      e.preventDefault();
      onNavigateToDesignWork();
    } else {
      const el = document.getElementById('design-work');
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handle3DClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (onNavigateTo3D) {
      e.preventDefault();
      onNavigateTo3D();
    } else {
      const el = document.getElementById('three-d-section');
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handlePage4Click = (e: MouseEvent<HTMLAnchorElement>) => {
    if (onNavigateToPage4) {
      e.preventDefault();
      onNavigateToPage4();
    } else {
      const el = document.getElementById('offline-footer-section');
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <section
      id="hero"
      className="w-full h-screen p-4 md:p-6 bg-[#000000] flex flex-col justify-center items-center overflow-clip box-border shrink-0 relative z-10"
    >
      {/* Inner Container with rounded corners */}
      <div
        id="hero-inner-container"
        ref={containerRef}
        onMouseMove={handleHeroMouseMove}
        onMouseLeave={handleHeroMouseLeave}
        className="relative w-full h-full rounded-2xl md:rounded-[2rem] overflow-clip bg-[#000000] flex flex-col justify-between"
      >
        {/* Background Layer with Parallax & Bleed */}
        <ParallaxLayer
          pageIndex={0}
          layer="background"
          className="absolute -inset-[8%] w-[116%] h-[116%] pointer-events-none z-0"
        >
          <video
            id="hero-background-video"
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_170732_8a9ccda6-5cff-4628-b164-059c500a2b41.mp4"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover transform translate-z-0"
          />

          {/* Gradient overlay */}
          <div
            id="hero-gradient-overlay"
            className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60 pointer-events-none z-[1]"
          />
        </ParallaxLayer>

        {/* Navbar: Absolutely positioned top-center, black pill hanging from top edge - FIXED */}
        <nav
          id="hero-navbar"
          className="absolute top-0 left-1/2 -translate-x-1/2 z-30 bg-black rounded-b-2xl md:rounded-b-3xl px-4 py-2 sm:px-6 md:px-8 md:py-2.5 shadow-2xl flex items-center justify-center gap-3 sm:gap-6 md:gap-12 lg:gap-14"
        >
          {NAV_ITEMS.map((item, idx) => {
            const anim = idx === 1 ? 'pop' : 'drop';
            const iVal = idx === 0 ? 0 : idx === 1 ? 0.8 : 1.6;
            return (
              <div
                key={item}
                data-anim={anim}
                style={{ '--i': iVal } as React.CSSProperties}
              >
              <MagneticNavLink
                item={item}
                href={
                  item === 'Connect'
                    ? '#offline-footer-section'
                    : item === 'Design Work'
                    ? '#design-work'
                    : item === 'Creative Visuals'
                    ? '#three-d-section'
                    : `#${item.toLowerCase().replace(/\s+/g, '-')}`
                }
                onClick={
                  item === 'Connect'
                    ? handlePage4Click
                    : item === 'Design Work'
                    ? handleDesignWorkClick
                    : item === 'Creative Visuals'
                    ? handle3DClick
                    : undefined
                }
              />
            </div>
          );
        })}
        </nav>

        {/* Hero Content (Bottom-aligned Foreground Layer) */}
        <ParallaxLayer
          pageIndex={0}
          layer="foreground"
          className="absolute bottom-0 left-0 right-0 z-20 p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12 pb-3 sm:pb-5 md:pb-6 lg:pb-8"
        >
          <div id="hero-bottom-content">
            <div className="grid grid-cols-1 lg:grid-cols-12 items-end gap-6 lg:gap-8 xl:gap-10">
              {/* Left 8 columns: Giant Heading with Heading Parallax and cursor 3D depth */}
              <div className="lg:col-span-8 flex flex-col justify-end">
                <ParallaxLayer pageIndex={0} layer="heading">
                  <h1
                    id="hero-title"
                    className="select-none flex items-baseline tracking-[-0.07em] font-medium leading-[0.85] text-[26vw] sm:text-[24vw] md:text-[22vw] lg:text-[20vw] xl:text-[19vw] 2xl:text-[20vw] transition-transform duration-200 ease-out"
                    style={{
                      color: '#E1E0CC',
                      transform: `perspective(1000px) rotateX(${-mouseTilt.y}deg) rotateY(${mouseTilt.x}deg)`,
                      transformStyle: 'preserve-3d',
                    }}
                  >
                    {headingWords.map((word) => (
                      <span
                        key={word}
                        className="inline-flex overflow-visible relative items-baseline"
                      >
                        <motion.span
                          whileHover={{ scale: 1.03 }}
                          className="inline-block cursor-default transition-all duration-300"
                          style={{ color: '#E1E0CC' }}
                        >
                          <Split text={word} type="blur-up" />
                        </motion.span>
                      </span>
                    ))}
                    {/* Superscript asterisk with interactive spin */}
                    <span
                      data-anim="glow"
                      style={{ '--i': 1 } as React.CSSProperties}
                      className="inline-block"
                    >
                      <motion.sup
                        whileHover={{ rotate: 180, scale: 1.4 }}
                        className="font-serif italic font-normal text-[0.4em] align-super ml-0.5 sm:ml-1 select-none leading-none inline-block cursor-pointer"
                        style={{ color: '#E1E0CC' }}
                        title="*"
                      >
                        *
                      </motion.sup>
                    </span>
                  </h1>
                </ParallaxLayer>
              </div>

              {/* Right 4 columns: Description + Magnetic CTA Button */}
              <div className="lg:col-span-4 flex flex-col justify-end items-start space-y-4 sm:space-y-5 md:space-y-6 pb-2 lg:pb-5 xl:pb-7">
                {/* Description Paragraph with cursor highlight */}
                <p
                  id="hero-description"
                  data-anim="blur-up"
                  className="text-primary/70 text-xs sm:text-sm md:text-base max-w-sm lg:max-w-xs xl:max-w-sm tracking-normal cursor-default transition-colors duration-250 hover:text-white/95"
                  style={{
                    '--i': 2,
                    lineHeight: '1.2',
                    color: 'rgba(222, 219, 200, 0.7)',
                  } as React.CSSProperties}
                >
                  Editor, motion designer, and creative professional — crafting
                  visual stories through precision and craft.
                </p>

                {/* Pill-shaped Magnetic CTA Button */}
                <div data-anim="pop" style={{ '--i': 3 } as React.CSSProperties}>
                  <MagneticCTAButton
                    onClick={handleDesignWorkClick}
                  />
                </div>
              </div>
            </div>
          </div>
        </ParallaxLayer>
      </div>
    </section>
  );
}
