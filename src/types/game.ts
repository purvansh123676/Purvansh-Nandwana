/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameState =
  | 'TITLE_MENU'
  | 'PLAYING'
  | 'PAUSED'
  | 'WARDROBE'
  | 'LEVEL_SELECT'
  | 'VICTORY'
  | 'GAME_OVER';

export type AntSpecies = 'black' | 'crimson' | 'golden' | 'emerald' | 'violet';

export type WardrobeSlot = 'species' | 'hat' | 'outfit' | 'eyewear' | 'footwear' | 'charm';

export interface WardrobeItem {
  id: string;
  slot: WardrobeSlot;
  name: string;
  description: string;
  perkDescription: string;
  cost: number; // Cost in sugar crumbs
  unlockedByDefault?: boolean;
  color?: string;
  accentColor?: string;
  stats?: {
    speedBoost?: number; // e.g. 0.1 for +10%
    dashCooldownMult?: number; // e.g. 0.8 for 20% faster
    crumbMagnetRadius?: number; // extra pixels
    telegraphBonus?: number; // extra warning time in sec
    syrupImmune?: boolean;
    lightRadius?: number; // extra light
  };
}

export interface AntOutfit {
  species: string;
  hat: string;
  outfit: string;
  eyewear: string;
  footwear: string;
  charm: string;
}

export interface LevelConfig {
  id: number;
  name: string;
  roomName: string;
  subtitle: string;
  description: string;
  width: number;
  height: number;
  floorTheme: 'kitchen' | 'living_room' | 'bathroom' | 'garden_porch';
  floorTexturePath?: string;
  requiredCrumbs: number;
  totalCrumbs: number;
  stompInterval: [number, number]; // min and max seconds between stomps
  roombaCount: number;
  syrupPuddlesCount: number;
  bottleCapsCount: number;
  furnitureObstaclesCount: number;
  parTime: number; // in seconds
}

export interface Point {
  x: number;
  y: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  shape?: 'circle' | 'spark' | 'ring' | 'heart';
}

export interface SlipperHazard {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  radius: number;
  timer: number; // counts down
  maxTimer: number;
  state: 'telegraph' | 'stomping' | 'grounded' | 'lifting' | 'inactive';
  impactProgress: number; // 0 to 1
  shakeTriggered?: boolean;
}

export interface RoombaHazard {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  angle: number;
  speed: number;
  suctionAngle: number;
  suctionRadius: number;
}

export interface Crumb {
  id: number;
  x: number;
  y: number;
  value: number; // 1 for regular, 5 for golden sugar crystal
  isGolden?: boolean;
  collected: boolean;
  floatOffset: number;
}

export interface BottleCap {
  id: number;
  x: number;
  y: number;
  radius: number;
  color: string;
  label?: string;
  isPushed?: boolean;
}

export interface SyrupPuddle {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  type: 'chair_leg' | 'table_leg' | 'mug' | 'book' | 'baseboard' | 'box';
  color?: string;
}

export interface ExitHole {
  x: number;
  y: number;
  radius: number;
  label: string;
}

export interface GameMetrics {
  crumbsCollected: number;
  totalCrumbs: number;
  stamina: number; // 0 to 100
  isDashing: boolean;
  isSafe: boolean; // under bottle cap or obstacle shelter
  timeElapsed: number;
  dangerLevel: number; // 0 to 1 (near stomping foot or Roomba)
  stompWarningActive: boolean;
}
