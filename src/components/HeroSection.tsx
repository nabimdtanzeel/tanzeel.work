import { useRef, MouseEvent } from 'react';
import { motion, useInView } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';

const NAV_ITEMS = [
  'Design Work',
  'Motion Graphics',
  '3D',
  'About',
  'Connect',
];

interface HeroSectionProps {
  onNavigateToDesignWork?: () => void;
  onNavigateTo3D?: () => void;
  onNavigateToPage4?: () => void;
}

export default function HeroSection({ onNavigateToDesignWork, onNavigateTo3D, onNavigateToPage4 }: HeroSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true });

  const headingWords = ['Tanzeel'];

  const handleDesignWorkClick = (e: MouseEvent) => {
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

  const handle3DClick = (e: MouseEvent) => {
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

  const handlePage4Click = (e: MouseEvent) => {
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
      className="w-full h-screen p-4 md:p-6 bg-[#000000] flex flex-col justify-center items-center overflow-hidden box-border snap-start snap-always shrink-0 relative z-10"
    >
      {/* Inner Container with rounded corners */}
      <div
        id="hero-inner-container"
        ref={containerRef}
        className="relative w-full h-full rounded-2xl md:rounded-[2rem] overflow-hidden bg-[#000000] flex flex-col justify-between"
      >
        {/* Background Video */}
        <video
          id="hero-background-video"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_170732_8a9ccda6-5cff-4628-b164-059c500a2b41.mp4"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover z-0 transform translate-z-0"
        />

        {/* Gradient overlay */}
        <div
          id="hero-gradient-overlay"
          className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60 pointer-events-none z-[1]"
        />

        {/* Navbar: Absolutely positioned top-center, black pill hanging from top edge */}
        <nav
          id="hero-navbar"
          className="absolute top-0 left-1/2 -translate-x-1/2 z-30 bg-black rounded-b-2xl md:rounded-b-3xl px-4 py-2 sm:px-6 md:px-8 md:py-2.5 shadow-2xl flex items-center justify-center gap-3 sm:gap-6 md:gap-12 lg:gap-14"
        >
          {NAV_ITEMS.map((item) => (
            <a
              key={item}
              href={item === 'Connect' ? '#offline-footer-section' : `#${item.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={
                item === 'Connect'
                  ? handlePage4Click
                  : item === 'Design Work' || item === '3D'
                  ? handle3DClick
                  : item === 'Motion Graphics'
                  ? handleDesignWorkClick
                  : undefined
              }
              className="text-[10px] sm:text-xs md:text-sm font-medium tracking-wide whitespace-nowrap transition-colors duration-200 cursor-pointer"
              style={{ color: 'rgba(225, 224, 204, 0.8)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#E1E0CC';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'rgba(225, 224, 204, 0.8)';
              }}
            >
              {item}
            </a>
          ))}
        </nav>

        {/* Hero Content (Bottom-aligned) */}
        <div
          id="hero-bottom-content"
          className="absolute bottom-0 left-0 right-0 z-20 p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12 pb-3 sm:pb-5 md:pb-6 lg:pb-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 items-end gap-6 lg:gap-8 xl:gap-10">
            {/* Left 8 columns: Giant Heading */}
            <div className="lg:col-span-8 flex flex-col justify-end">
              <h1
                id="hero-title"
                className="select-none flex items-baseline tracking-[-0.07em] font-medium leading-[0.85] text-[26vw] sm:text-[24vw] md:text-[22vw] lg:text-[20vw] xl:text-[19vw] 2xl:text-[20vw]"
                style={{ color: '#E1E0CC' }}
              >
                {headingWords.map((word, index) => (
                  <span
                    key={word}
                    className="inline-flex overflow-hidden relative items-baseline"
                  >
                    <motion.span
                      initial={{ y: 20, opacity: 0 }}
                      animate={isInView ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
                      transition={{
                        duration: 0.85,
                        delay: index * 0.08,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className="inline-block"
                      style={{ color: '#E1E0CC' }}
                    >
                      {word}
                    </motion.span>
                  </span>
                ))}
                {/* Superscript asterisk in Instrument Serif italic */}
                <motion.sup
                  initial={{ opacity: 0, y: 15, scale: 0.8 }}
                  animate={
                    isInView
                      ? { opacity: 1, y: 0, scale: 1 }
                      : { opacity: 0, y: 15, scale: 0.8 }
                  }
                  transition={{
                    duration: 0.8,
                    delay: 0.25,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="font-serif italic font-normal text-[0.4em] align-super ml-0.5 sm:ml-1 select-none leading-none inline-block"
                  style={{ color: '#E1E0CC' }}
                >
                  *
                </motion.sup>
              </h1>
            </div>

            {/* Right 4 columns: Description + CTA Button */}
            <div className="lg:col-span-4 flex flex-col justify-end items-start space-y-4 sm:space-y-5 md:space-y-6 pb-2 lg:pb-5 xl:pb-7">
              {/* Description Paragraph */}
              <motion.p
                id="hero-description"
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{
                  duration: 0.8,
                  delay: 0.5,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="text-primary/70 text-xs sm:text-sm md:text-base max-w-sm lg:max-w-xs xl:max-w-sm tracking-normal"
                style={{
                  lineHeight: '1.2',
                  color: 'rgba(222, 219, 200, 0.7)',
                }}
              >
                Editor, motion designer, and creative professional — crafting
                visual stories through precision and craft.
              </motion.p>

              {/* Pill-shaped CTA Button */}
              <motion.a
                id="hero-cta-button"
                href="#design-work"
                onClick={handleDesignWorkClick}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{
                  duration: 0.8,
                  delay: 0.7,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="group inline-flex items-center bg-[#DEDBC8] rounded-full pl-5 sm:pl-6 pr-1.5 sm:pr-2 py-1.5 sm:py-2 text-black font-medium text-xs sm:text-sm md:text-base gap-3 hover:gap-5 transition-all duration-300 shadow-xl cursor-pointer"
              >
                <span className="whitespace-nowrap font-medium">See the work</span>
                <div
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black flex items-center justify-center text-[#DEDBC8] group-hover:scale-110 group-hover:rotate-45 transition-transform duration-300 shrink-0"
                >
                  <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-[#DEDBC8]" />
                </div>
              </motion.a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
