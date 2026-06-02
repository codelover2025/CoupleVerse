'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, MessageSquare, Heart, Flame, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Home', path: '/dashboard', icon: Compass },
    { name: 'Talk Zone', path: '/talk-zone', icon: MessageSquare },
    { name: 'Intimacy', path: '/intimacy-ideas', icon: Heart },
    { name: 'Positions', path: '/positions', icon: Flame },
    { name: 'Games', path: '/games', icon: Sparkles },
  ];

  // Don't show bottom nav on landing / setup pages
  if (pathname === '/' || pathname === '/setup') {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-5 pointer-events-none">
      <nav className="
        pointer-events-auto
        w-full
        max-w-[440px]
        glass-card
        rounded-2xl
        border
        border-white/10
        px-2
        py-2
        shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(31,11,51,0.3)]
        flex
        justify-between
        items-center
      ">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.path);
          const Icon = item.icon;

          return (
            <Link key={item.path} href={item.path} className="relative flex flex-col items-center flex-1 py-1">
              <motion.div
                whileTap={{ scale: 0.85 }}
                className={`
                  relative
                  z-10
                  p-2
                  rounded-xl
                  flex
                  flex-col
                  items-center
                  justify-center
                  transition-colors
                  duration-300
                  ${isActive ? 'text-sensual-pink' : 'text-zinc-500 hover:text-zinc-300'}
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'drop-shadow-[0_0_8px_rgba(255,42,109,0.7)]' : ''}`} />
                <span className="text-[10px] mt-1 font-medium font-sans">
                  {item.name}
                </span>
              </motion.div>

              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 bg-sensual-purple/35 rounded-xl border border-sensual-pink/15 -z-0"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
