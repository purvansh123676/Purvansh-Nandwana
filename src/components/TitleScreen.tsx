/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { AntOutfit } from '../types/game';
import { renderAnt } from '../utils/renderAnt';
import { sound } from '../utils/audio';

interface TitleScreenProps {
  outfit: AntOutfit;
  sugarCrumbs: number;
  onStartGame: () => void;
  onOpenWardrobe: () => void;
  onOpenLevelSelect: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  outfit,
  sugarCrumbs,
  onStartGame,
  onOpenWardrobe,
  onOpenLevelSelect,
  isMuted,
  onToggleMute,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Background animated hero centerpiece
  useEffect(() => {
    let animationId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Warm radial floor light
      const grad = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2 + 35,
        15,
        canvas.width / 2,
        canvas.height / 2 + 35,
        180
      );
      grad.addColorStop(0, 'rgba(245, 158, 11, 0.22)');
      grad.addColorStop(0.6, 'rgba(180, 83, 9, 0.08)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2 + 35, 180, 0, Math.PI * 2);
      ctx.fill();

      // Floating sugar crumbs in background
      for (let i = 0; i < 6; i++) {
        const orbitAngle = time * 0.4 + (i * Math.PI * 2) / 6;
        const orbitRadius = 140 + Math.sin(time * 2 + i) * 15;
        const cx = canvas.width / 2 + Math.cos(orbitAngle) * orbitRadius;
        const cy = canvas.height / 2 + 30 + Math.sin(orbitAngle) * (orbitRadius * 0.45);

        ctx.fillStyle = i % 2 === 0 ? '#fde047' : '#fef08a';
        ctx.beginPath();
        ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx - 1, cy - 1, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Live animated hero ant pacing gracefully
      const antAngle = Math.sin(time * 0.6) * 0.35;
      renderAnt({
        ctx,
        x: canvas.width / 2,
        y: canvas.height / 2 + 25,
        angle: antAngle,
        scale: 3.2,
        walkTime: time * 1.5,
        isMoving: true,
        outfit,
      });

      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [outfit]);

  // Keyboard shortcut listener (Space or Enter to start)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        onStartGame();
      } else if (e.code === 'KeyC' || e.code === 'KeyW') {
        onOpenWardrobe();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartGame, onOpenWardrobe]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-neutral-950 flex flex-col justify-between p-6 md:p-10 select-none">
      {/* Background kitchen floor texture with dark vignette */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30 pointer-events-none filter blur-sm scale-105"
        style={{ backgroundImage: `url('/src/assets/images/kitchen_floor_texture_1792292745931.jpg')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/70 to-neutral-950/85 pointer-events-none" />

      {/* Top Header Row */}
      <div className="relative z-10 flex items-center justify-between w-full max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-widest text-amber-500/90 font-mono">
            MICRO ARCADIA EDITION
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-950/60 border border-amber-800/60 rounded-lg text-amber-300 text-xs font-semibold">
            <span>🍬</span>
            <span className="font-mono tabular-nums">{sugarCrumbs}</span>
            <span className="text-neutral-400">Crumbs Banked</span>
          </div>

          <button
            onClick={onToggleMute}
            aria-label="Toggle Sound"
            className="p-2 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 rounded-lg border border-neutral-800 transition-colors cursor-pointer"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>

      {/* Main Center Area: Bespoke Inline SVG Title Lockup & Interactive Hero */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto w-full max-w-3xl mx-auto text-center">
        {/* Bespoke inline SVG Title Lockup */}
        <div className="mb-2 w-full max-w-xl">
          <svg viewBox="0 0 540 110" className="w-full h-auto drop-shadow-2xl">
            <defs>
              <linearGradient id="goldTitle" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
              <linearGradient id="crimsonAccent" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#dc2626" />
              </linearGradient>
            </defs>

            {/* Ant Silhouette emblem */}
            <path
              d="M 50 35 Q 65 30 75 42 Q 85 32 95 48 Q 105 40 120 45"
              stroke="#fbbf24"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
            {/* Crown icon on lockup */}
            <path
              d="M 68 28 L 74 18 L 80 25 L 86 18 L 92 28 Z"
              fill="#f59e0b"
              stroke="#fbbf24"
              strokeWidth="1.2"
            />

            {/* Main Wordmark */}
            <text
              x="270"
              y="58"
              textAnchor="middle"
              fontFamily="Outfit, sans-serif"
              fontSize="48"
              fontWeight="900"
              letterSpacing="2"
              fill="url(#goldTitle)"
              stroke="#451a03"
              strokeWidth="1.5"
            >
              ANT ESCAPE
            </text>

            {/* Subtitle ribbon */}
            <text
              x="270"
              y="94"
              textAnchor="middle"
              fontFamily="Outfit, sans-serif"
              fontSize="16"
              fontWeight="700"
              letterSpacing="5"
              fill="#f8fafc"
            >
              HAUTE COUTURE ODYSSEY
            </text>
          </svg>
        </div>

        {/* Narrative lead-in */}
        <p className="text-sm md:text-base text-neutral-300 max-w-md mx-auto mb-4 font-sans leading-relaxed">
          Escape the perils of giant human houses. Dodge thunderous slippers and robotic vacuums,
          dressed in tailored miniature elegance.
        </p>

        {/* Hero Ant Live Centerpiece Canvas */}
        <div className="relative w-[340px] h-[220px] mx-auto my-2">
          <canvas ref={canvasRef} width={340} height={220} className="w-full h-full object-contain" />
        </div>

        {/* Primary Call to Action */}
        <div className="flex flex-col sm:flex-row items-center gap-3.5 mt-2">
          <button
            onClick={onStartGame}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-neutral-950 font-bold text-base rounded-xl shadow-xl shadow-amber-500/20 transform hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Start Escape</span>
            <span className="text-xs px-2 py-0.5 bg-neutral-950/20 rounded font-mono font-medium">
              [Enter / Space]
            </span>
          </button>

          <button
            onClick={onOpenWardrobe}
            className="w-full sm:w-auto px-6 py-3.5 bg-neutral-900 hover:bg-neutral-800 text-amber-300 font-semibold text-sm rounded-xl border border-neutral-700 transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <span>🎩</span>
            <span>Dress Up Studio</span>
          </button>

          <button
            onClick={onOpenLevelSelect}
            className="w-full sm:w-auto px-5 py-3.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 font-medium text-sm rounded-xl border border-neutral-800 transition-colors cursor-pointer"
          >
            Rooms & Levels
          </button>
        </div>
      </div>

      {/* Flat Control Hint Line required by craft constitution */}
      <div className="relative z-10 w-full max-w-4xl mx-auto border-t border-neutral-800/80 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-400 font-mono">
        <div>WASD / Arrows Move · Space Dash · E Shelter · Esc Pause</div>
        <div className="mt-2 sm:mt-0 text-neutral-400">Miniature physics · 60 FPS · Web Audio</div>
      </div>
    </div>
  );
};
