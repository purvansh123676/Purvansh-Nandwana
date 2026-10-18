/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { LevelConfig, AntOutfit } from '../types/game';

interface GameOverModalProps {
  level: LevelConfig;
  outfit: AntOutfit;
  reason: string;
  crumbsCollected: number;
  onRetry: () => void;
  onOpenWardrobe: () => void;
  onMainMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  level,
  reason,
  crumbsCollected,
  onRetry,
  onOpenWardrobe,
  onMainMenu,
}) => {
  // Listen for Enter / Space for instant restart
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        onRetry();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onRetry]);

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/85 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-neutral-900 border border-red-900/60 rounded-2xl p-6 shadow-2xl flex flex-col gap-5 text-center">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-red-400">
            Micro Peril
          </span>
          <h2 className="text-2xl font-bold text-neutral-100 font-sans mt-1">
            Scuttle Interrupted!
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            {level.name}
          </p>
        </div>

        <div className="bg-red-950/30 border border-red-900/50 p-4 rounded-xl text-left space-y-2">
          <div className="text-sm text-red-200 font-medium">
            {reason}
          </div>
          <div className="text-xs text-neutral-400">
            Survival Tip: Look for circular shadows and listen for floor rumbles. Bottle caps act as total shields!
          </div>
        </div>

        <div className="flex items-center justify-between px-3 py-2 bg-neutral-950/60 rounded-lg text-xs">
          <span className="text-neutral-400">Crumbs collected before peril:</span>
          <span className="font-mono font-bold text-amber-400">{crumbsCollected} 🍬</span>
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={onRetry}
            className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Try Again</span>
            <span className="text-xs px-2 py-0.5 bg-black/30 rounded font-mono font-medium">
              [Enter / Space]
            </span>
          </button>

          <button
            onClick={onOpenWardrobe}
            className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-semibold text-xs rounded-xl border border-neutral-700 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>🎩</span>
            <span>Equip Better Boots or Hat</span>
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
