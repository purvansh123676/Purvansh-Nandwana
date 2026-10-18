/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LevelConfig, AntOutfit } from '../types/game';

interface PauseModalProps {
  level: LevelConfig;
  outfit: AntOutfit;
  onResume: () => void;
  onRestart: () => void;
  onOpenWardrobe: () => void;
  onMainMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  level,
  onResume,
  onRestart,
  onOpenWardrobe,
  onMainMenu,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/85 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-5 text-center">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-amber-500">
            Escaped to Shelter
          </span>
          <h2 className="text-2xl font-bold text-neutral-100 font-sans mt-1">
            Game Paused
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            {level.name}
          </p>
        </div>

        <div className="bg-neutral-950/70 p-3.5 rounded-xl border border-neutral-800/80 text-left text-xs space-y-1.5 text-neutral-300">
          <div className="font-semibold text-neutral-200">Surviving the House:</div>
          <div>• Red dashed circles warn of human slippers slamming down.</div>
          <div>• Bottle caps and wooden table legs grant complete invulnerability.</div>
          <div>• Use <span className="font-mono text-amber-300">[SPACE]</span> to dash away from Roomba vacuums.</div>
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={onResume}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm rounded-xl transition-colors cursor-pointer"
          >
            Resume Scuttle [Esc]
          </button>

          <button
            onClick={onOpenWardrobe}
            className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-semibold text-xs rounded-xl border border-neutral-700 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>🎩</span>
            <span>Change Wardrobe & Hat</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium text-xs rounded-xl border border-neutral-700 transition-colors cursor-pointer"
          >
            Restart Room
          </button>

          <button
            onClick={onMainMenu}
            className="w-full py-2 text-neutral-400 hover:text-neutral-200 text-xs transition-colors cursor-pointer"
          >
            Return to Title Screen
          </button>
        </div>
      </div>
    </div>
  );
};
