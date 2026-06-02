'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ScratchCardProps {
  content: React.ReactNode;
  onReveal?: () => void;
  overlayText?: string;
  keyTrigger?: string; // Change key to reset the scratch mask
}

export default function ScratchCard({
  content,
  onReveal,
  overlayText = "Rub slowly to reveal...",
  keyTrigger = "",
}: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    setIsRevealed(false);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Set canvas dimensions based on client bounds
    const resizeCanvas = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      canvas.width = rect?.width || 360;
      canvas.height = rect?.height || 220;

      // Draw initial premium mask
      drawMask(ctx, canvas.width, canvas.height);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [keyTrigger]);

  const drawMask = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Fill with sensual gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#1c0f2a');
    gradient.addColorStop(0.5, '#0e0616');
    gradient.addColorStop(1, '#2c0c1e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Draw luxurious gold mesh lines
    ctx.strokeStyle = 'rgba(197, 168, 128, 0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 100, height);
      ctx.stroke();
    }

    // Add glowing border outline in mask
    ctx.strokeStyle = '#c5a880';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, width, height);

    // Add text label
    ctx.font = 'italic 16px Cormorant Garamond, serif';
    ctx.fillStyle = '#c5a880';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(overlayText, width / 2, height / 2);
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const scratch = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();
  };

  const checkScratchPercentage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.getImageData(0, 0, width, height);
    const pixels = imageData.data;
    let clearedCount = 0;

    // Check every 10th pixel for efficiency
    for (let i = 0; i < pixels.length; i += 40) {
      if (pixels[i + 3] === 0) {
        clearedCount++;
      }
    }

    const totalCheckable = pixels.length / 40;
    const percentCleared = (clearedCount / totalCheckable) * 100;

    if (percentCleared > 45 && !isRevealed) {
      setIsRevealed(true);
      if (onReveal) {
        onReveal();
      }
    }
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (isRevealed) return;
    const coords = getCoordinates(e);
    if (!coords) return;

    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      scratch(ctx, coords.x, coords.y);
    }
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || isRevealed) return;
    e.preventDefault(); // Prevent scrolling on mobile while scratching

    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      scratch(ctx, coords.x, coords.y);
    }
  };

  const handleEnd = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    checkScratchPercentage();
  };

  return (
    <div
      ref={containerRef}
      className="scratch-container relative w-full h-full bg-sensual-dark border border-white/5 rounded-2xl flex items-center justify-center p-6 shadow-inner overflow-hidden"
    >
      {/* Target content underneath */}
      <div className="w-full text-center relative z-0 flex flex-col justify-center items-center h-full min-h-[160px]">
        {content}
      </div>

      {/* Protective Scratch Mask Canvas */}
      <AnimatePresence>
        {!isRevealed && (
          <motion.canvas
            ref={canvasRef}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
            className="scratch-canvas touch-none"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
