'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface SensualCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: 'pink' | 'gold' | 'purple' | 'none';
  onClick?: () => void;
  hoverScale?: boolean;
}

export default function SensualCard({
  children,
  className = '',
  glowColor = 'purple',
  onClick,
  hoverScale = true,
}: SensualCardProps) {
  const getGlowStyles = () => {
    switch (glowColor) {
      case 'pink':
        return 'border-sensual-pink/20 shadow-[0_0_15px_rgba(255,42,109,0.1)] hover:border-sensual-pink/50 hover:shadow-[0_0_25px_rgba(255,42,109,0.3)]';
      case 'gold':
        return 'border-rose-gold/20 shadow-[0_0_15px_rgba(197,168,128,0.1)] hover:border-rose-gold/50 hover:shadow-[0_0_25px_rgba(197,168,128,0.3)]';
      case 'purple':
        return 'border-sensual-purple/30 shadow-[0_0_15px_rgba(31,11,51,0.15)] hover:border-sensual-purple/60 hover:shadow-[0_0_25px_rgba(170,80,250,0.2)]';
      case 'none':
      default:
        return 'border-white/5';
    }
  };

  const interactiveProps = onClick
    ? {
        whileTap: { scale: 0.97 },
        whileHover: hoverScale ? { scale: 1.02, y: -2 } : {},
      }
    : hoverScale
    ? {
        whileHover: { y: -2 },
      }
    : {};

  return (
    <motion.div
      {...interactiveProps}
      onClick={onClick}
      className={`
        glass-card
        rounded-2xl
        border
        backdrop-blur-md
        transition-all
        duration-500
        ease-out
        overflow-hidden
        ${onClick ? 'cursor-pointer' : ''}
        ${getGlowStyles()}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}
