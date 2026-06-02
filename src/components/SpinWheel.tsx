'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Play } from 'lucide-react';
import confetti from 'canvas-confetti';

interface WheelSector {
  label: string;
  color: string;
  textColor: string;
  activity: string;
}

const SECTORS: WheelSector[] = [
  { label: 'Touch', color: '#1b0728', textColor: '#c5a880', activity: 'Slowly trace a finger along your partner\'s collarbone and neck.' },
  { label: 'Kiss', color: '#3d081f', textColor: '#ff2a6d', activity: 'Give a slow, lingering kiss on a spot of their choice that lasts at least 15 seconds.' },
  { label: 'Whisper', color: '#0e0616', textColor: '#c5a880', activity: 'Lean in and whisper one secret desire or flirty compliment directly into their ear.' },
  { label: 'Massage', color: '#1c0f2a', textColor: '#ff2a6d', activity: 'Give your partner a deep, warm neck and shoulder rub for 2 minutes.' },
  { label: 'Tease', color: '#540828', textColor: '#ffffff', activity: 'Gently blow on the back of their neck and kiss down to their shoulder.' },
  { label: 'Gaze', color: '#07030c', textColor: '#c5a880', activity: 'Hold direct eye contact for 15 seconds without speaking. Smiling is allowed.' },
  { label: 'Bite', color: '#2c0c1e', textColor: '#ff2a6d', activity: 'Nibble gently on your partner\'s earlobe or neck, followed by a soft kiss.' },
  { label: 'Wildcard', color: '#10051e', textColor: '#ffffff', activity: 'The spinner gets to request any single sensual act (keep it under 3 minutes).' },
];

export default function SpinWheel() {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotationDegrees, setRotationDegrees] = useState(0);
  const [selectedSector, setSelectedSector] = useState<WheelSector | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  const spin = () => {
    if (isSpinning) return;

    setSelectedSector(null);
    setIsSpinning(true);

    // Generate random rotations (5 to 8 full spins) + random segment offset
    const sectorCount = SECTORS.length;
    const randomIndex = Math.floor(Math.random() * sectorCount);
    
    // Each sector takes 360 / 8 = 45 degrees
    const sectorAngle = 360 / sectorCount;
    // Align index at the top (which is 270 degrees on a standard circle, so let's offset index)
    // To make index land on the top arrow indicator:
    const targetAngle = 360 - (randomIndex * sectorAngle) - (sectorAngle / 2);
    
    const extraSpins = 360 * (5 + Math.floor(Math.random() * 4)); // 5 to 8 spins
    const totalRotation = rotationDegrees + extraSpins + targetAngle - (rotationDegrees % 360);

    setRotationDegrees(totalRotation);

    setTimeout(() => {
      setIsSpinning(false);
      const wonSector = SECTORS[randomIndex];
      setSelectedSector(wonSector);
      
      // Fire subtle romantic confetti
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#ff2a6d', '#c5a880', '#1f0b33'],
      });
    }, 4000); // Animation duration
  };

  return (
    <div className="flex flex-col items-center justify-center py-6 w-full">
      <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
        {/* Top Gold Indicator Arrow */}
        <div className="absolute top-[-10px] z-20 text-rose-gold filter drop-shadow-[0_2px_5px_rgba(0,0,0,0.5)]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21l-9-13h18z" />
          </svg>
        </div>

        {/* Outer Sensual Glow Ring */}
        <div className="absolute inset-0 rounded-full border border-rose-gold/30 shadow-[0_0_30px_rgba(255,42,109,0.2)] animate-neon-glow -z-0" />

        {/* Spinning Wheel */}
        <div
          ref={wheelRef}
          style={{
            transform: `rotate(${rotationDegrees}deg)`,
            transition: 'transform 4.2s cubic-bezier(0.1, 0.8, 0.25, 1)',
          }}
          className="w-full h-full rounded-full border-4 border-rose-gold/40 overflow-hidden relative shadow-2xl bg-sensual-dark flex items-center justify-center"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
            {SECTORS.map((sector, index) => {
              const angle = 360 / SECTORS.length;
              const startAngle = index * angle;
              const endAngle = (index + 1) * angle;

              // Helper variables to draw SVG pie slices
              const x1 = 50 + 50 * Math.cos((startAngle * Math.PI) / 180);
              const y1 = 50 + 50 * Math.sin((startAngle * Math.PI) / 180);
              const x2 = 50 + 50 * Math.cos((endAngle * Math.PI) / 180);
              const y2 = 50 + 50 * Math.sin((endAngle * Math.PI) / 180);

              const textAngle = startAngle + angle / 2;
              const tx = 50 + 32 * Math.cos((textAngle * Math.PI) / 180);
              const ty = 50 + 32 * Math.sin((textAngle * Math.PI) / 180);

              return (
                <g key={index}>
                  {/* Slice */}
                  <path
                    d={`M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`}
                    fill={sector.color}
                    stroke="rgba(197, 168, 128, 0.25)"
                    strokeWidth="0.5"
                  />
                  {/* Label Text */}
                  <text
                    x={tx}
                    y={ty}
                    transform={`rotate(${textAngle}, ${tx}, ${ty})`}
                    fill={sector.textColor}
                    fontSize="4"
                    fontWeight="bold"
                    fontFamily="Inter, sans-serif"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                  >
                    {sector.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Inner Golden Hub Lock */}
          <div className="absolute w-12 h-12 bg-sensual-dark border-2 border-rose-gold rounded-full flex items-center justify-center shadow-md z-10">
            <Sparkles className="w-5 h-5 text-rose-gold animate-pulse" />
          </div>
        </div>
      </div>

      {/* Control Area */}
      <div className="mt-8 w-full flex flex-col items-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={isSpinning}
          onClick={spin}
          className={`
            px-8 py-3.5
            rounded-full
            font-serif
            text-lg
            font-bold
            tracking-wider
            flex items-center gap-2
            shadow-lg
            transition-all duration-300
            ${
              isSpinning
                ? 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
                : 'bg-gradient-to-r from-sensual-pink to-velvet-crimson text-white border border-sensual-pink/40 shadow-[0_0_15px_rgba(255,42,109,0.3)] hover:shadow-[0_0_25px_rgba(255,42,109,0.6)]'
            }
          `}
        >
          <Play className="w-4 h-4 fill-current" />
          {isSpinning ? 'SPINNING...' : 'SPIN DESIRE WHEEL'}
        </motion.button>

        {/* Selected Sector Card */}
        <div className="min-h-[140px] mt-6 w-full max-w-[360px]">
          <AnimatePresence mode="wait">
            {selectedSector && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.95 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="glass-card-rose rounded-2xl p-5 border border-rose-gold/20 shadow-[0_0_20px_rgba(197,168,128,0.1)] text-center"
              >
                <div
                  className="text-xs uppercase tracking-widest font-bold mb-1"
                  style={{ color: selectedSector.textColor }}
                >
                  Target Sector: {selectedSector.label}
                </div>
                <h3 className="text-2xl font-serif text-gold-gradient font-semibold mb-3">
                  Your Sensual Task
                </h3>
                <p className="text-zinc-200 text-sm leading-relaxed font-sans italic">
                  "{selectedSector.activity}"
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
