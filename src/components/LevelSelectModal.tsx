/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LevelConfig } from '../types/game';
import { LEVELS } from '../data/levels';

interface LevelSelectModalProps {
  unlockedLevelId: number;
  selectedLevelId: number;
  onSelectLevel: (level: LevelConfig) => void;
  onClose: () => void;
}

export const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
  unlockedLevelId,
  selectedLevelId,
  onSelectLevel,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/90 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-neutral-100 font-sans">
              House Escape Route
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Select a human room to navigate toward outdoor freedom
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-200 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer text-sm"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {LEVELS.map((level) => {
            const isUnlocked = level.id <= unlockedLevelId;
            const isSelected = level.id === selectedLevelId;

            return (
              <div
                key={level.id}
                onClick={() => {
                  if (isUnlocked) onSelectLevel(level);
                }}
                className={`p-4 rounded-xl border transition-all ${
                  !isUnlocked
                    ? 'opacity-40 bg-neutral-950/40 border-neutral-900 cursor-not-allowed'
                    : isSelected
                    ? 'bg-amber-950/30 border-amber-500/80 shadow-md cursor-pointer'
                    : 'bg-neutral-800/40 border-neutral-800 hover:border-neutral-700 cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-mono font-semibold text-amber-400">
                    ROOM 0{level.id}
                  </span>
                  {!isUnlocked && (
                    <span className="text-xs text-neutral-500 font-mono">🔒 Locked</span>
                  )}
                  {isSelected && (
                    <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300">
                      Current
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-neutral-100">{level.roomName}</h3>
                <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
                  {level.description}
                </p>

                <div className="flex items-center gap-3 mt-3 pt-2 border-t border-neutral-800/60 text-[11px] text-neutral-400">
                  <span>🍬 Req: {level.requiredCrumbs}</span>
                  <span>·</span>
                  <span>⏱ Par: {level.parTime}s</span>
                  <span>·</span>
                  <span>
                    {level.roombaCount > 0 ? `🤖 ${level.roombaCount} Roomba` : '🦶 Slippers'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-2 border-t border-neutral-800">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
