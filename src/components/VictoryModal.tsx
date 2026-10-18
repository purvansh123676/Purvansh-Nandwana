/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LevelConfig, AntOutfit } from '../types/game';
import { WARDROBE_ITEMS } from '../data/wardrobeItems';

interface VictoryModalProps {
  level: LevelConfig;
  outfit: AntOutfit;
  crumbsCollected: number;
  timeElapsed: number;
  hasNextLevel: boolean;
  onNextLevel: () => void;
  onReplay: () => void;
  onOpenWardrobe: () => void;
  onMainMenu: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  level,
  outfit,
  crumbsCollected,
  timeElapsed,
  hasNextLevel,
  onNextLevel,
  onReplay,
  onOpenWardrobe,
  onMainMenu,
}) => {
  // Calculate style bonus based on worn items
  const species = WARDROBE_ITEMS.find((i) => i.id === outfit.species)?.name || 'Ant';
  const hat = WARDROBE_ITEMS.find((i) => i.id === outfit.hat)?.name || 'Bare';
  const outfitTitle = WARDROBE_ITEMS.find((i) => i.id === outfit.outfit)?.name || 'Default';

  const isDapper = outfit.hat !== 'hat_none' || outfit.outfit !== 'outfit_none';
  const styleRating = isDapper ? 'Haute Couture Masterpiece ★★★' : 'Practical Scuttler ★★☆';

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/85 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-5 text-center">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-amber-400">
            Micro Room Escaped!
          </span>
          <h2 className="text-2xl font-bold text-neutral-100 font-sans mt-1">
            Safe at the Baseboard!
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            {level.name}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 bg-neutral-950/70 p-4 rounded-xl border border-neutral-800/80">
          <div className="flex flex-col items-center">
            <span className="text-xs text-neutral-400">Crumbs Banked</span>
            <span className="text-xl font-bold font-mono text-amber-400 tabular-nums">
              +{crumbsCollected} 🍬
            </span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-xs text-neutral-400">Escape Time</span>
            <span className="text-xl font-bold font-mono text-neutral-100 tabular-nums">
              {Math.floor(timeElapsed)}s
            </span>
          </div>

          <div className="col-span-2 pt-2 border-t border-neutral-800/80 text-center">
            <span className="text-[11px] text-neutral-400">Elegance Assessment:</span>
            <div className="text-xs font-semibold text-amber-300 mt-0.5">
              {styleRating}
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5">
              Featuring {hat} & {outfitTitle}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          {hasNextLevel ? (
            <button
              onClick={onNextLevel}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Next Room Challenge ➔</span>
            </button>
          ) : (
            <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-amber-200 text-xs font-semibold">
              🎉 Congratulations! You have escaped the entire human house to the garden!
            </div>
          )}

          <button
            onClick={onOpenWardrobe}
            className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-semibold text-xs rounded-xl border border-neutral-700 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>🎩</span>
            <span>Spend Crumbs at Dressing Room</span>
          </button>

          <button
            onClick={onReplay}
            className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium text-xs rounded-xl border border-neutral-700 transition-colors cursor-pointer"
          >
            Replay Room
          </button>

          <button
            onClick={onMainMenu}
            className="w-full py-1.5 text-neutral-400 hover:text-neutral-200 text-xs transition-colors cursor-pointer"
          >
            Return to Title Screen
          </button>
        </div>
      </div>
    </div>
  );
};
