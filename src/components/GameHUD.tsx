/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameMetrics, LevelConfig, AntOutfit } from '../types/game';
import { sound } from '../utils/audio';

interface GameHUDProps {
  metrics: GameMetrics;
  level: LevelConfig;
  outfit: AntOutfit;
  onPause: () => void;
  onOpenWardrobe: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  metrics,
  level,
  onPause,
  onOpenWardrobe,
  isMuted,
  onToggleMute,
}) => {
  const goalReached = metrics.crumbsCollected >= level.requiredCrumbs;

  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-4 md:p-6 font-sans">
      {/* Top Perimeter Header Bar */}
      <div className="flex items-start justify-between w-full">
        {/* Top Left: Level & Crumb Cluster */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-tight text-neutral-100">
              {level.name}
            </span>
            <span className="text-neutral-500">·</span>
            <span className="text-xs text-neutral-400 font-mono tabular-nums">
              {Math.floor(metrics.timeElapsed)}s
            </span>
          </div>

          {/* Crumb Goal Meter */}
          <div className="flex items-center gap-3 px-3 py-1.5 bg-neutral-900/90 border border-neutral-800 rounded-xl shadow-lg pointer-events-auto">
            <div className="flex items-center gap-1.5">
              <span className="text-lg">🍬</span>
              <div className="flex items-baseline gap-1 font-mono tabular-nums">
                <span
                  className={`text-base font-bold ${
                    goalReached ? 'text-amber-400' : 'text-neutral-100'
                  }`}
                >
                  {metrics.crumbsCollected}
                </span>
                <span className="text-xs text-neutral-500">/ {level.requiredCrumbs}</span>
              </div>
            </div>

            <div className="h-4 w-px bg-neutral-800" />

            <div className="text-[11px] font-medium">
              {goalReached ? (
                <span className="text-amber-400 animate-pulse font-semibold">
                  Hole Open! Scuttle to Exit ➔
                </span>
              ) : (
                <span className="text-neutral-400">
                  Find {level.requiredCrumbs - metrics.crumbsCollected} more
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Top Right: Status Badges, Wardrobe & Pause Controls */}
        <div className="flex items-center gap-2.5 pointer-events-auto">
          {/* Safe under shelter indicator */}
          {metrics.isSafe && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-950/90 border border-emerald-500/80 rounded-lg text-emerald-300 text-xs font-semibold shadow-md animate-pulse">
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Safe Shelter</span>
            </div>
          )}

          {/* Sound Toggle */}
          <button
            onClick={onToggleMute}
            aria-label="Toggle Sound"
            className="p-2 bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 rounded-lg border border-neutral-800 transition-colors cursor-pointer shadow-sm"
          >
            {isMuted ? (
              <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            )}
          </button>

          {/* Wardrobe Quick Access */}
          <button
            onClick={onOpenWardrobe}
            aria-label="Open Wardrobe"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900/90 hover:bg-neutral-800 text-amber-300 rounded-lg border border-neutral-800 transition-colors cursor-pointer shadow-sm text-xs font-medium"
          >
            <span>🎩</span>
            <span className="hidden sm:inline">Wardrobe</span>
          </button>

          {/* Pause Button */}
          <button
            onClick={onPause}
            aria-label="Pause Game"
            className="px-3 py-1.5 bg-neutral-900/90 hover:bg-neutral-800 text-neutral-200 rounded-lg border border-neutral-800 transition-colors cursor-pointer shadow-sm text-xs font-semibold"
          >
            Pause [Esc]
          </button>
        </div>
      </div>

      {/* Danger Warning Alert Toast */}
      {metrics.stompWarningActive && (
        <div className="self-center flex items-center gap-2 px-4 py-2 bg-red-950/90 border border-red-500/80 rounded-xl text-red-200 text-xs font-bold tracking-wide shadow-xl animate-bounce">
          <span className="text-base">⚠</span>
          <span>HUMAN FOOTSTEP VIBRATION DETECTED! RUN OR TAKE COVER!</span>
        </div>
      )}

      {/* Bottom Perimeter Bar */}
      <div className="flex items-end justify-between w-full">
        {/* Bottom Left: Dash Stamina Meter */}
        <div className="flex flex-col gap-1 p-2.5 bg-neutral-900/90 border border-neutral-800 rounded-xl shadow-lg pointer-events-auto min-w-[180px]">
          <div className="flex items-center justify-between text-[11px] font-medium text-neutral-300">
            <span>DASH STAMINA</span>
            <span className="font-mono tabular-nums text-neutral-400">
              {Math.round(metrics.stamina)}%
            </span>
          </div>

          {/* Stamina bar */}
          <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-75 ${
                metrics.stamina >= 30 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${metrics.stamina}%` }}
            />
          </div>

          <div className="text-[10px] text-neutral-400 flex items-center justify-between mt-0.5">
            <span>[SPACE] Scuttle Dash</span>
            <span>Takes 30%</span>
          </div>
        </div>

        {/* Bottom Center / Right: Danger Alert Meter or Controls hint */}
        <div className="hidden md:flex items-center gap-3 text-xs text-neutral-400 bg-neutral-950/80 px-4 py-2 rounded-xl border border-neutral-800/80">
          <span>WASD / Arrows to Move</span>
          <span>·</span>
          <span>Hide Under Bottle Caps & Chairs</span>
          <span>·</span>
          <span>Avoid Roomba & Slippers</span>
        </div>
      </div>
    </div>
  );
};
