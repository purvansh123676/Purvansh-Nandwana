/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { AntOutfit, WardrobeSlot, WardrobeItem } from '../types/game';
import { WARDROBE_ITEMS } from '../data/wardrobeItems';
import { renderAnt } from '../utils/renderAnt';
import { sound } from '../utils/audio';

interface WardrobeStudioProps {
  outfit: AntOutfit;
  unlockedItemIds: string[];
  sugarCrumbs: number;
  onUpdateOutfit: (newOutfit: AntOutfit) => void;
  onUnlockItem: (item: WardrobeItem) => void;
  onClose: () => void;
}

export const WardrobeStudio: React.FC<WardrobeStudioProps> = ({
  outfit,
  unlockedItemIds,
  sugarCrumbs,
  onUpdateOutfit,
  onUnlockItem,
  onClose,
}) => {
  const [activeSlot, setActiveSlot] = useState<WardrobeSlot>('hat');
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [animMode, setAnimMode] = useState<'idle' | 'walk' | 'cheer'>('walk');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragStartRef = useRef<{ startX: number; initialAngle: number } | null>(null);

  // Filter items for current slot
  const slotItems = WARDROBE_ITEMS.filter((item) => item.slot === activeSlot);

  // Preview animation loop
  useEffect(() => {
    let animationFrameId: number;
    let startTime = performance.now();

    const loop = (time: number) => {
      const elapsed = (time - startTime) / 1000;
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Soft studio floor gradient
          const grad = ctx.createRadialGradient(
            canvas.width / 2,
            canvas.height / 2 + 30,
            10,
            canvas.width / 2,
            canvas.height / 2 + 30,
            140
          );
          grad.addColorStop(0, 'rgba(217, 119, 6, 0.15)');
          grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.4)');
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.ellipse(canvas.width / 2, canvas.height / 2 + 40, 110, 45, 0, 0, Math.PI * 2);
          ctx.fill();

          // Spotlight rings
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.25)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 6]);
          ctx.beginPath();
          ctx.ellipse(canvas.width / 2, canvas.height / 2 + 40, 85, 30, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);

          // Turn table rotation if auto-rotating
          let currentAngle = rotationAngle;
          if (isRotating) {
            currentAngle = (elapsed * 0.8) % (Math.PI * 2);
          }

          const cheerProgress =
            animMode === 'cheer' ? (Math.sin(elapsed * 5) + 1) / 2 : 0;

          renderAnt({
            ctx,
            x: canvas.width / 2,
            y: canvas.height / 2 + 10,
            angle: currentAngle,
            scale: 2.7,
            walkTime: elapsed,
            isMoving: animMode === 'walk',
            outfit,
            cheerProgress,
          });
        }
      }
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [outfit, rotationAngle, isRotating, animMode]);

  // Handle turntable drag
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsRotating(false);
    dragStartRef.current = { startX: e.clientX, initialAngle: rotationAngle };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragStartRef.current) return;
    const deltaX = e.clientX - dragStartRef.current.startX;
    setRotationAngle(dragStartRef.current.initialAngle + deltaX * 0.02);
  };

  const handleMouseUp = () => {
    dragStartRef.current = null;
  };

  const handleEquip = (item: WardrobeItem) => {
    const isUnlocked = item.cost === 0 || item.unlockedByDefault || unlockedItemIds.includes(item.id);
    if (!isUnlocked) {
      if (sugarCrumbs >= item.cost) {
        onUnlockItem(item);
        sound.playCrumb(true);
      }
      return;
    }

    sound.playEquip();
    onUpdateOutfit({
      ...outfit,
      [item.slot]: item.id,
    });
  };

  const handleRandomize = () => {
    sound.playEquip();
    const pickRandom = (slot: WardrobeSlot) => {
      const candidates = WARDROBE_ITEMS.filter(
        (i) => i.slot === slot && (i.cost === 0 || unlockedItemIds.includes(i.id))
      );
      if (candidates.length === 0) return WARDROBE_ITEMS.find((i) => i.slot === slot)?.id || '';
      return candidates[Math.floor(Math.random() * candidates.length)].id;
    };

    onUpdateOutfit({
      species: pickRandom('species'),
      hat: pickRandom('hat'),
      outfit: pickRandom('outfit'),
      eyewear: pickRandom('eyewear'),
      footwear: pickRandom('footwear'),
      charm: pickRandom('charm'),
    });
  };

  const tabs: { slot: WardrobeSlot; label: string }[] = [
    { slot: 'hat', label: 'Hats' },
    { slot: 'outfit', label: 'Outfits & Capes' },
    { slot: 'eyewear', label: 'Eyewear' },
    { slot: 'footwear', label: 'Footwear (6x)' },
    { slot: 'charm', label: 'Antenna Charms' },
    { slot: 'species', label: 'Ant Species' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/95 flex flex-col items-center justify-center p-4 md:p-6 overflow-hidden">
      {/* Background atelier accent image */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none bg-cover bg-center filter blur-sm"
        style={{ backgroundImage: `url('/src/assets/images/wardrobe_studio_bg_1792292747135.jpg')` }}
      />

      <div className="relative z-10 w-full max-w-5xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/80">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold tracking-tight text-amber-400 font-sans">
              Ant Couture Atelier
            </span>
            <span className="text-xs text-neutral-400">·</span>
            <span className="text-xs text-neutral-400">Tailored micro-fashion for house escapees</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-950/60 border border-amber-800/60 rounded-lg text-amber-300 text-sm font-medium">
              <span className="text-base">🍬</span>
              <span className="font-mono tabular-nums font-semibold">{sugarCrumbs}</span>
              <span className="text-xs text-amber-400/80">Crumbs</span>
            </div>

            <button
              onClick={handleRandomize}
              className="px-3 py-1.5 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg border border-neutral-700 transition-colors cursor-pointer"
            >
              Surprise Me
            </button>

            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-lg transition-colors cursor-pointer"
            >
              Ready to Escape
            </button>
          </div>
        </div>

        {/* Studio Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden">
          {/* Left: 360 Turntable Preview Stage */}
          <div className="md:col-span-5 bg-neutral-950 flex flex-col items-center justify-between p-6 border-b md:border-b-0 md:border-r border-neutral-800 relative">
            <div className="w-full flex items-center justify-between text-xs text-neutral-400">
              <span>Interactive 360° Mannequin</span>
              <button
                onClick={() => setIsRotating(!isRotating)}
                className="text-amber-400 hover:text-amber-300 cursor-pointer"
              >
                {isRotating ? 'Pause Spin' : 'Auto Spin'}
              </button>
            </div>

            {/* Turntable Canvas */}
            <div
              className="relative my-auto cursor-grab active:cursor-grabbing"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <canvas
                ref={canvasRef}
                width={360}
                height={320}
                className="w-full max-w-[340px] aspect-square object-contain"
              />
              <div className="text-center text-[11px] text-neutral-500 mt-1">
                Drag horizontally to rotate 360°
              </div>
            </div>

            {/* Animation state toggles */}
            <div className="flex items-center gap-1.5 p-1 bg-neutral-900 border border-neutral-800 rounded-lg">
              {(['walk', 'idle', 'cheer'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setAnimMode(mode)}
                  className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors cursor-pointer ${
                    animMode === mode
                      ? 'bg-amber-500 text-neutral-950 font-semibold'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Wardrobe Catalog & Wardrobe Slot Tabs */}
          <div className="md:col-span-7 flex flex-col bg-neutral-900/50 overflow-hidden">
            {/* Slot Navigation Tabs */}
            <div className="flex items-center gap-1 p-2 border-b border-neutral-800 bg-neutral-900 overflow-x-auto no-scrollbar">
              {tabs.map((tab) => (
                <button
                  key={tab.slot}
                  onClick={() => setActiveSlot(tab.slot)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                    activeSlot === tab.slot
                      ? 'bg-neutral-800 text-amber-400 border border-neutral-700'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Catalog Grid */}
            <div className="flex-1 p-4 overflow-y-auto space-y-2.5">
              {slotItems.map((item) => {
                const isEquipped = outfit[item.slot] === item.id;
                const isUnlocked =
                  item.cost === 0 || item.unlockedByDefault || unlockedItemIds.includes(item.id);
                const canAfford = sugarCrumbs >= item.cost;

                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                      isEquipped
                        ? 'bg-amber-950/20 border-amber-500/60'
                        : 'bg-neutral-800/40 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      {/* Swatch or Icon box */}
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center border shrink-0 text-base shadow-sm"
                        style={{
                          backgroundColor: item.color || '#262626',
                          borderColor: item.accentColor || '#404040',
                        }}
                      >
                        {item.slot === 'hat' && '🎩'}
                        {item.slot === 'outfit' && '👔'}
                        {item.slot === 'eyewear' && '👓'}
                        {item.slot === 'footwear' && '👞'}
                        {item.slot === 'charm' && '✨'}
                        {item.slot === 'species' && '🐜'}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-neutral-100">
                            {item.name}
                          </span>
                          {isEquipped && (
                            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                              Equipped
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-400 line-clamp-1">{item.description}</p>
                        <p className="text-[11px] text-amber-300/90 font-medium">
                          ✦ {item.perkDescription}
                        </p>
                      </div>
                    </div>

                    <div className="ml-4 shrink-0">
                      {isUnlocked ? (
                        <button
                          onClick={() => handleEquip(item)}
                          disabled={isEquipped}
                          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                            isEquipped
                              ? 'bg-neutral-800 text-neutral-500 cursor-default'
                              : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-100'
                          }`}
                        >
                          {isEquipped ? 'Worn' : 'Wear'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEquip(item)}
                          disabled={!canAfford}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                            canAfford
                              ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold'
                              : 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700'
                          }`}
                        >
                          <span>🍬</span>
                          <span>{item.cost}</span>
                          <span>Unlock</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
