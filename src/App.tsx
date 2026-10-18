/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { GameState, AntOutfit, GameMetrics, WardrobeItem, LevelConfig } from './types/game';
import { LEVELS } from './data/levels';
import { DEFAULT_OUTFIT, WARDROBE_ITEMS } from './data/wardrobeItems';
import { TitleScreen } from './components/TitleScreen';
import { GameCanvas } from './components/GameCanvas';
import { GameHUD } from './components/GameHUD';
import { WardrobeStudio } from './components/WardrobeStudio';
import { PauseModal } from './components/PauseModal';
import { VictoryModal } from './components/VictoryModal';
import { GameOverModal } from './components/GameOverModal';
import { LevelSelectModal } from './components/LevelSelectModal';
import { sound } from './utils/audio';

const STORAGE_KEY_OUTFIT = 'ant_escape_outfit';
const STORAGE_KEY_UNLOCKED = 'ant_escape_unlocked_items';
const STORAGE_KEY_CRUMBS = 'ant_escape_sugar_crumbs';
const STORAGE_KEY_LEVEL = 'ant_escape_unlocked_level';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [returnStateFromWardrobe, setReturnStateFromWardrobe] = useState<'TITLE_MENU' | 'PLAYING'>('TITLE_MENU');
  const [currentLevelIndex, setCurrentLevelIndex] = useState<number>(0);
  const [unlockedLevelId, setUnlockedLevelId] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_LEVEL);
    return saved ? parseInt(saved, 10) : 1;
  });
  const [showLevelSelect, setShowLevelSelect] = useState<boolean>(false);

  // Sugar crumbs currency
  const [sugarCrumbs, setSugarCrumbs] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CRUMBS);
    return saved ? parseInt(saved, 10) : 20; // 20 starter crumbs for immediate dress-up!
  });

  // Unlocked Wardrobe items
  const [unlockedItemIds, setUnlockedItemIds] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_UNLOCKED);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return WARDROBE_ITEMS.filter((i) => i.unlockedByDefault).map((i) => i.id);
  });

  // Active outfit
  const [outfit, setOutfit] = useState<AntOutfit>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_OUTFIT);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return DEFAULT_OUTFIT;
  });

  // Audio mute
  const [isMuted, setIsMuted] = useState<boolean>(sound.getMuted());

  // In-game metrics
  const [metrics, setMetrics] = useState<GameMetrics>({
    crumbsCollected: 0,
    totalCrumbs: LEVELS[0].requiredCrumbs,
    stamina: 100,
    isDashing: false,
    isSafe: false,
    timeElapsed: 0,
    dangerLevel: 0,
    stompWarningActive: false,
  });

  // End state details
  const [gameOverReason, setGameOverReason] = useState<string>('');
  const [recentCrumbs, setRecentCrumbs] = useState<number>(0);
  const [recentTime, setRecentTime] = useState<number>(0);

  // Level key for hard canvas reset
  const [gameKey, setGameKey] = useState<number>(1);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_OUTFIT, JSON.stringify(outfit));
  }, [outfit]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_UNLOCKED, JSON.stringify(unlockedItemIds));
  }, [unlockedItemIds]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CRUMBS, sugarCrumbs.toString());
  }, [sugarCrumbs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_LEVEL, unlockedLevelId.toString());
  }, [unlockedLevelId]);

  const currentLevel = LEVELS[currentLevelIndex] || LEVELS[0];

  // Global escape key handler for pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        if (gameState === 'PLAYING') {
          setGameState('PAUSED');
        } else if (gameState === 'PAUSED') {
          setGameState('PLAYING');
        } else if (gameState === 'WARDROBE') {
          setGameState(returnStateFromWardrobe);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, returnStateFromWardrobe]);

  const handleStartGame = (levelIdx: number = currentLevelIndex) => {
    setCurrentLevelIndex(levelIdx);
    setGameKey((prev) => prev + 1);
    setGameState('PLAYING');
  };

  const handleOpenWardrobe = (from: 'TITLE_MENU' | 'PLAYING' = 'TITLE_MENU') => {
    setReturnStateFromWardrobe(from);
    setGameState('WARDROBE');
  };

  const handleCloseWardrobe = () => {
    setGameState(returnStateFromWardrobe);
  };

  const handleUnlockItem = (item: WardrobeItem) => {
    if (sugarCrumbs >= item.cost) {
      setSugarCrumbs((prev) => prev - item.cost);
      setUnlockedItemIds((prev) => [...prev, item.id]);
      setOutfit((prev) => ({
        ...prev,
        [item.slot]: item.id,
      }));
    }
  };

  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const handleVictory = useCallback(
    (collected: number, time: number) => {
      setRecentCrumbs(collected);
      setRecentTime(time);
      setSugarCrumbs((prev) => prev + collected);

      // Unlock next level
      const nextLvl = currentLevelIndex + 2;
      if (nextLvl > unlockedLevelId && nextLvl <= LEVELS.length) {
        setUnlockedLevelId(nextLvl);
      }

      setGameState('VICTORY');
    },
    [currentLevelIndex, unlockedLevelId]
  );

  const handleGameOver = useCallback((reason: string, collected: number) => {
    setGameOverReason(reason);
    setRecentCrumbs(collected);
    setGameState('GAME_OVER');
  }, []);

  const handleNextLevel = () => {
    if (currentLevelIndex < LEVELS.length - 1) {
      setCurrentLevelIndex((prev) => prev + 1);
      setGameKey((prev) => prev + 1);
      setGameState('PLAYING');
    } else {
      setGameState('TITLE_MENU');
    }
  };

  const handleReplay = () => {
    setGameKey((prev) => prev + 1);
    setGameState('PLAYING');
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-neutral-950 font-sans text-neutral-100 select-none">
      {/* 1. TITLE SCREEN */}
      {gameState === 'TITLE_MENU' && (
        <TitleScreen
          outfit={outfit}
          sugarCrumbs={sugarCrumbs}
          onStartGame={() => handleStartGame(currentLevelIndex)}
          onOpenWardrobe={() => handleOpenWardrobe('TITLE_MENU')}
          onOpenLevelSelect={() => setShowLevelSelect(true)}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* 2. ACTIVE PLAY VIEW (Canvas + Low-Occlusion HUD) */}
      {(gameState === 'PLAYING' ||
        gameState === 'PAUSED' ||
        gameState === 'VICTORY' ||
        gameState === 'GAME_OVER') && (
        <>
          <GameCanvas
            key={gameKey}
            level={currentLevel}
            outfit={outfit}
            isPaused={gameState !== 'PLAYING'}
            onVictory={handleVictory}
            onGameOver={handleGameOver}
            onUpdateMetrics={setMetrics}
          />

          <GameHUD
            metrics={metrics}
            level={currentLevel}
            outfit={outfit}
            onPause={() => setGameState('PAUSED')}
            onOpenWardrobe={() => handleOpenWardrobe('PLAYING')}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
          />
        </>
      )}

      {/* 3. WARDROBE ATELIER STUDIO */}
      {gameState === 'WARDROBE' && (
        <WardrobeStudio
          outfit={outfit}
          unlockedItemIds={unlockedItemIds}
          sugarCrumbs={sugarCrumbs}
          onUpdateOutfit={setOutfit}
          onUnlockItem={handleUnlockItem}
          onClose={handleCloseWardrobe}
        />
      )}

      {/* 4. PAUSE MODAL */}
      {gameState === 'PAUSED' && (
        <PauseModal
          level={currentLevel}
          outfit={outfit}
          onResume={() => setGameState('PLAYING')}
          onRestart={handleReplay}
          onOpenWardrobe={() => handleOpenWardrobe('PLAYING')}
          onMainMenu={() => setGameState('TITLE_MENU')}
        />
      )}

      {/* 5. VICTORY MODAL */}
      {gameState === 'VICTORY' && (
        <VictoryModal
          level={currentLevel}
          outfit={outfit}
          crumbsCollected={recentCrumbs}
          timeElapsed={recentTime}
          hasNextLevel={currentLevelIndex < LEVELS.length - 1}
          onNextLevel={handleNextLevel}
          onReplay={handleReplay}
          onOpenWardrobe={() => handleOpenWardrobe('TITLE_MENU')}
          onMainMenu={() => setGameState('TITLE_MENU')}
        />
      )}

      {/* 6. GAME OVER MODAL */}
      {gameState === 'GAME_OVER' && (
        <GameOverModal
          level={currentLevel}
          outfit={outfit}
          reason={gameOverReason}
          crumbsCollected={recentCrumbs}
          onRetry={handleReplay}
          onOpenWardrobe={() => handleOpenWardrobe('PLAYING')}
          onMainMenu={() => setGameState('TITLE_MENU')}
        />
      )}

      {/* 7. LEVEL SELECT MODAL */}
      {showLevelSelect && (
        <LevelSelectModal
          unlockedLevelId={unlockedLevelId}
          selectedLevelId={currentLevel.id}
          onSelectLevel={(lvl) => {
            const idx = LEVELS.findIndex((l) => l.id === lvl.id);
            if (idx >= 0) {
              setCurrentLevelIndex(idx);
              setShowLevelSelect(false);
              handleStartGame(idx);
            }
          }}
          onClose={() => setShowLevelSelect(false)}
        />
      )}
    </div>
  );
}
