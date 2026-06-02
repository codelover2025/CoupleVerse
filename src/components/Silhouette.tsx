'use client';

import React from 'react';

interface SilhouetteProps {
  type: 'lotus' | 'embrace' | 'bridge' | 'fusion' | 'ascent' | 'crescent';
  className?: string;
}

export default function Silhouette({ type, className = '' }: SilhouetteProps) {
  // We use glowing, semi-transparent abstract vector lines to suggest the flow and connection of the bodies.
  const renderArt = () => {
    switch (type) {
      case 'lotus':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <radialGradient id="lotusGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ff2a6d" stopOpacity="0.4" />
                <stop offset="60%" stopColor="#1f0b33" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#0e0616" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fcebc2" />
                <stop offset="100%" stopColor="#c5a880" />
              </linearGradient>
            </defs>
            {/* Ambient Aura */}
            <circle cx="50" cy="50" r="45" fill="url(#lotusGlow)" />
            {/* Seated Outer Ring */}
            <circle cx="50" cy="65" r="22" stroke="url(#goldGrad)" strokeWidth="1" strokeDasharray="3 3" fill="none" opacity="0.3" />
            {/* Partner 1 (Intertwined Inner Seated Shape) */}
            <path
              d="M38,70 C38,45 45,35 50,42 C55,35 62,45 62,70"
              fill="none"
              stroke="#ff2a6d"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.8"
            />
            {/* Partner 2 (Lap Seated Intersection) */}
            <path
              d="M44,70 C44,52 48,32 50,30 C52,32 56,52 56,70"
              fill="none"
              stroke="url(#goldGrad)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Heart Connection Orb */}
            <circle cx="50" cy="48" r="3.5" fill="#ff2a6d" className="animate-pulse" />
            {/* Decorative Intimacy Waves */}
            <path d="M25,80 Q50,72 75,80" fill="none" stroke="#ff2a6d" strokeWidth="0.5" opacity="0.4" />
            <path d="M20,85 Q50,78 80,85" fill="none" stroke="url(#goldGrad)" strokeWidth="0.5" opacity="0.3" />
          </svg>
        );

      case 'embrace':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <radialGradient id="embraceGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#aa50fa" stopOpacity="0.3" />
                <stop offset="80%" stopColor="#0e0616" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="pinkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ff2a6d" />
                <stop offset="100%" stopColor="#aa50fa" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="45" fill="url(#embraceGlow)" />
            {/* Lying Side Spooning Wave 1 */}
            <path
              d="M15,55 Q35,35 60,55 T90,45"
              fill="none"
              stroke="url(#pinkGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.8"
            />
            {/* Parallel Spooning Wave 2 */}
            <path
              d="M20,62 Q38,44 62,62 T85,53"
              fill="none"
              stroke="#c5a880"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.9"
            />
            {/* Intertwined Soft Ring */}
            <ellipse cx="50" cy="52" rx="30" ry="12" stroke="#ffffff" strokeWidth="0.5" strokeDasharray="4 4" fill="none" opacity="0.2" />
          </svg>
        );

      case 'bridge':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <radialGradient id="bridgeGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ff2a6d" stopOpacity="0.3" />
                <stop offset="70%" stopColor="#1b0728" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#0e0616" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="45" fill="url(#bridgeGlow)" />
            {/* Arching Active Lower Partner */}
            <path
              d="M15,75 C25,75 32,32 50,32 C68,32 75,75 85,75"
              fill="none"
              stroke="#c5a880"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.9"
            />
            {/* Kneeling/Hovering Partner Over */}
            <path
              d="M35,68 C40,48 55,24 60,35 C65,45 52,65 50,75"
              fill="none"
              stroke="#ff2a6d"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.85"
            />
            {/* Tension/Energy lines */}
            <line x1="50" y1="32" x2="50" y2="75" stroke="#ff2a6d" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.4" />
          </svg>
        );

      case 'fusion':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <radialGradient id="fusionGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ff2a6d" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#1c0f2a" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#07030c" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="fusionGold" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fcebc2" />
                <stop offset="100%" stopColor="#c5a880" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="45" fill="url(#fusionGlow)" />
            {/* Intersecting Chest-to-Chest Curves (Infinity flow shape) */}
            <path
              d="M25,50 C25,30 45,30 50,50 C55,70 75,70 75,50 C75,30 55,30 50,50 C45,70 25,70 25,50 Z"
              fill="none"
              stroke="url(#fusionGold)"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.75"
            />
            <path
              d="M32,50 C32,38 45,38 50,50 C55,62 68,62 68,50 C68,38 55,38 50,50 C45,62 32,62 32,50 Z"
              fill="none"
              stroke="#ff2a6d"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.85"
            />
            {/* Central energy sparks */}
            <circle cx="50" cy="50" r="1.5" fill="#ffffff" />
            <circle cx="45" cy="45" r="0.8" fill="#ff2a6d" />
            <circle cx="55" cy="55" r="0.8" fill="#c5a880" />
          </svg>
        );

      case 'ascent':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <radialGradient id="ascentGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ff2a6d" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#0e0616" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="45" fill="url(#ascentGlow)" />
            {/* Seated Table/Ledge Edge Line */}
            <line x1="10" y1="65" x2="90" y2="65" stroke="#ffffff" strokeWidth="0.5" opacity="0.3" />
            {/* Seated Partner (Vertical bent legs style) */}
            <path
              d="M30,65 Q35,65 35,50 T45,35 Q50,45 50,65"
              fill="none"
              stroke="#c5a880"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.9"
            />
            {/* Standing/Leaning Partner */}
            <path
              d="M52,78 Q48,65 48,45 T58,25"
              fill="none"
              stroke="#ff2a6d"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.8"
            />
            {/* Connecting Arc */}
            <path d="M38,40 Q46,35 52,38" fill="none" stroke="#ffffff" strokeWidth="0.75" strokeDasharray="2 2" opacity="0.5" />
          </svg>
        );

      case 'crescent':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <radialGradient id="crescentGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#630c2c" stopOpacity="0.4" />
                <stop offset="75%" stopColor="#07030c" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="45" fill="url(#crescentGlow)" />
            {/* Crescent Sweep Partner 1 (Prone/kneeling low) */}
            <path
              d="M20,68 C35,68 45,58 55,58 C68,58 75,68 85,68"
              fill="none"
              stroke="#ff2a6d"
              strokeWidth="2.2"
              strokeLinecap="round"
              opacity="0.8"
            />
            {/* Slide Over Partner Behind */}
            <path
              d="M35,68 C45,54 58,42 70,54"
              fill="none"
              stroke="#c5a880"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.9"
            />
            {/* Whispering Wave */}
            <path d="M56,48 Q64,45 68,52" fill="none" stroke="#ff2a6d" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.6" />
          </svg>
        );

      default:
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="50" cy="50" r="30" fill="none" stroke="#c5a880" strokeWidth="2" strokeDasharray="5 5" />
          </svg>
        );
    }
  };

  return (
    <div className={`w-full aspect-square max-w-[180px] mx-auto filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] ${className}`}>
      {renderArt()}
    </div>
  );
}
