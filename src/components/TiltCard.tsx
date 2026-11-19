import React, { useState, useRef, useCallback, ReactNode, CSSProperties } from 'react';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  maxTilt?: number;      // max tilt angle in degrees (default 7)
  scale?: number;        // scale factor on hover (default 1.025)
  perspective?: number;  // perspective in px (default 1000)
  style?: CSSProperties;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
  dataCursor?: string;
}

export default function TiltCard({
  children,
  className = '',
  maxTilt = 7,
  scale = 1.025,
  perspective = 1000,
  style = {},
  onClick,
  onDragOver,
  onDragLeave,
  onDrop,
  dataCursor,
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    const normX = (clientX / width) * 2 - 1;
    const normY = (clientY / height) * 2 - 1;

    setTilt({
      rotateX: -normY * maxTilt,
      rotateY: normX * maxTilt,
    });
  }, [maxTilt]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setTilt({ rotateX: 0, rotateY: 0 });
  }, []);

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      data-cursor={dataCursor}
      style={{
        perspective: `${perspective}px`,
        ...style,
      }}
      className={`relative transform-gpu ${className}`}
    >
      <div
        style={{
          transform: isHovered
            ? `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale3d(${scale}, ${scale}, ${scale})`
            : 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
          transformStyle: 'preserve-3d',
          transition: isHovered
            ? 'transform 100ms cubic-bezier(0.2, 0, 0.2, 1)'
            : 'transform 450ms cubic-bezier(0.25, 1, 0.5, 1)',
        }}
        className="relative w-full h-full rounded-[inherit] overflow-hidden"
      >
        {children}
      </div>
    </div>
  );
}
