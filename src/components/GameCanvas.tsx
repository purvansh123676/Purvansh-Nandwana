/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  LevelConfig,
  AntOutfit,
  GameMetrics,
  Point,
  Particle,
  SlipperHazard,
  RoombaHazard,
  Crumb,
  BottleCap,
  SyrupPuddle,
  Obstacle,
  ExitHole,
} from '../types/game';
import { renderAnt } from '../utils/renderAnt';
import { sound } from '../utils/audio';
import { WARDROBE_ITEMS } from '../data/wardrobeItems';

interface GameCanvasProps {
  level: LevelConfig;
  outfit: AntOutfit;
  isPaused: boolean;
  onVictory: (crumbsCollected: number, timeElapsed: number) => void;
  onGameOver: (reason: string, crumbsCollected: number) => void;
  onUpdateMetrics: (metrics: GameMetrics) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  level,
  outfit,
  isPaused,
  onVictory,
  onGameOver,
  onUpdateMetrics,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Touch controls state for mobile
  const [touchActive, setTouchActive] = useState<boolean>(false);
  const touchStartPos = useRef<Point | null>(null);
  const touchCurrentPos = useRef<Point | null>(null);

  // Preloaded floor image
  const floorImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (level.floorTexturePath) {
      const img = new Image();
      img.src = level.floorTexturePath;
      img.onload = () => {
        floorImageRef.current = img;
      };
    }
  }, [level]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Retrieve active perks
    const activePerks = {
      speedBoost: 0,
      dashCooldownMult: 1,
      crumbMagnetRadius: 0,
      telegraphBonus: 0,
      syrupImmune: false,
      lightRadius: 0,
    };

    Object.values(outfit).forEach((itemId) => {
      const item = WARDROBE_ITEMS.find((i) => i.id === itemId);
      if (item?.stats) {
        if (item.stats.speedBoost) activePerks.speedBoost += item.stats.speedBoost;
        if (item.stats.dashCooldownMult) activePerks.dashCooldownMult *= item.stats.dashCooldownMult;
        if (item.stats.crumbMagnetRadius) activePerks.crumbMagnetRadius += item.stats.crumbMagnetRadius;
        if (item.stats.telegraphBonus) activePerks.telegraphBonus += item.stats.telegraphBonus;
        if (item.stats.syrupImmune) activePerks.syrupImmune = true;
        if (item.stats.lightRadius) activePerks.lightRadius += item.stats.lightRadius;
      }
    });

    // Resize canvas to full window
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Game Simulation State
    let isRunning = true;
    let lastTime = performance.now();
    let hitstopTimer = 0;
    let cameraShake = 0;
    let totalTimeElapsed = 0;

    // Player Ant
    const player = {
      x: 120,
      y: level.height / 2,
      vx: 0,
      vy: 0,
      angle: 0,
      baseSpeed: 190 * (1 + activePerks.speedBoost),
      currentSpeed: 190 * (1 + activePerks.speedBoost),
      radius: 12,
      stamina: 100,
      isDashing: false,
      isMoving: false,
      dashCooldown: 0,
      dashDuration: 0,
      isSafe: false,
      walkCycle: 0,
    };

    // Camera
    const camera = {
      x: player.x - canvas.width / 2,
      y: player.y - canvas.height / 2,
    };

    // Crumbs setup
    const crumbs: Crumb[] = [];
    let crumbIdCounter = 1;
    // Generate scattered crumbs
    for (let i = 0; i < level.totalCrumbs; i++) {
      const isGolden = i % 4 === 0;
      crumbs.push({
        id: crumbIdCounter++,
        x: 200 + Math.random() * (level.width - 350),
        y: 100 + Math.random() * (level.height - 200),
        value: isGolden ? 5 : 1,
        isGolden,
        collected: false,
        floatOffset: Math.random() * Math.PI * 2,
      });
    }

    // Furniture / Obstacles setup
    const obstacles: Obstacle[] = [];
    // Perimeter Baseboard walls
    obstacles.push({ x: 0, y: 0, width: level.width, height: 28, type: 'baseboard', label: 'Wall' });
    obstacles.push({ x: 0, y: level.height - 28, width: level.width, height: 28, type: 'baseboard', label: 'Wall' });
    obstacles.push({ x: 0, y: 0, width: 28, height: level.height, type: 'baseboard', label: 'Wall' });
    obstacles.push({ x: level.width - 28, y: 0, width: 28, height: level.height, type: 'baseboard', label: 'Wall' });

    // Room specific furniture (Dining chairs, giant mug, book, sugar box)
    const obstSpacing = (level.width - 400) / (level.furnitureObstaclesCount + 1);
    for (let i = 0; i < level.furnitureObstaclesCount; i++) {
      const ox = 300 + i * obstSpacing + (Math.random() * 80 - 40);
      const oy = 200 + (i % 3) * 320 + (Math.random() * 60 - 30);
      const types: Obstacle['type'][] = ['chair_leg', 'table_leg', 'mug', 'book'];
      const chosenType = types[i % types.length];
      const w = chosenType === 'chair_leg' ? 40 : chosenType === 'mug' ? 75 : 90;
      const h = chosenType === 'chair_leg' ? 40 : chosenType === 'mug' ? 75 : 65;

      obstacles.push({
        x: ox,
        y: oy,
        width: w,
        height: h,
        type: chosenType,
        label: chosenType.replace('_', ' '),
      });
    }

    // Bottle Caps (Safe zones)
    const bottleCaps: BottleCap[] = [];
    for (let i = 0; i < level.bottleCapsCount; i++) {
      bottleCaps.push({
        id: i + 1,
        x: 250 + (i / level.bottleCapsCount) * (level.width - 500) + Math.random() * 60,
        y: 180 + Math.random() * (level.height - 360),
        radius: 28,
        color: ['#dc2626', '#2563eb', '#16a34a', '#ca8a04', '#7c3aed'][i % 5],
        label: 'CAP',
      });
    }

    // Syrup Puddles
    const syrupPuddles: SyrupPuddle[] = [];
    for (let i = 0; i < level.syrupPuddlesCount; i++) {
      syrupPuddles.push({
        id: i + 1,
        x: 350 + Math.random() * (level.width - 600),
        y: 200 + Math.random() * (level.height - 400),
        width: 120 + Math.random() * 80,
        height: 70 + Math.random() * 45,
        color: 'rgba(217, 119, 6, 0.55)', // Amber pancake syrup
      });
    }

    // Exit mouse hole
    const exitHole: ExitHole = {
      x: level.width - 65,
      y: level.height / 2,
      radius: 36,
      label: 'ESCAPE HOLE',
    };

    // Slipper Hazard
    const slippers: SlipperHazard[] = [];
    let nextStompTime = 3.5;

    // Roomba Hazards
    const roombas: RoombaHazard[] = [];
    for (let i = 0; i < level.roombaCount; i++) {
      roombas.push({
        id: i + 1,
        x: 600 + i * 500,
        y: 350 + i * 250,
        vx: (Math.random() > 0.5 ? 1 : -1) * (110 + i * 20),
        vy: (Math.random() > 0.5 ? 1 : -1) * (90 + i * 20),
        radius: 54,
        angle: 0,
        speed: 120 + i * 20,
        suctionAngle: 0,
        suctionRadius: 75,
      });
    }

    // Particle pool
    const particles: Particle[] = [];

    const spawnParticles = (
      px: number,
      py: number,
      count: number,
      color: string,
      shape: Particle['shape'] = 'circle'
    ) => {
      for (let i = 0; i < count; i++) {
        const pAngle = Math.random() * Math.PI * 2;
        const pSpeed = 40 + Math.random() * 140;
        particles.push({
          x: px,
          y: py,
          vx: Math.cos(pAngle) * pSpeed,
          vy: Math.sin(pAngle) * pSpeed,
          life: 0.4 + Math.random() * 0.4,
          maxLife: 0.6,
          size: 2 + Math.random() * 3,
          color,
          shape,
        });
      }
    };

    // Input state
    const keysHeld = new Set<string>();
    const keysJustPressed = new Set<string>();

    const onKeyDown = (e: KeyboardEvent) => {
      // Prevent scrolling on space / arrows
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
      keysHeld.add(e.code);
      keysHeld.add(e.key.toLowerCase());
      keysJustPressed.add(e.code);
      keysJustPressed.add(e.key.toLowerCase());
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysHeld.delete(e.code);
      keysHeld.delete(e.key.toLowerCase());
    };

    const onBlur = () => {
      keysHeld.clear();
      keysJustPressed.clear();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    let collectedCount = 0;

    // --- MAIN 60FPS SIMULATION LOOP ---
    const frame = (now: number) => {
      if (!isRunning) return;

      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(rawDt, 0.05); // Clamp dt to prevent physics tunnel

      // Handle hitstop
      if (hitstopTimer > 0) {
        hitstopTimer -= dt;
        requestAnimationFrame(frame);
        return;
      }

      if (!isPaused) {
        totalTimeElapsed += dt;

        // 1. INPUT PROCESSING
        let moveX = 0;
        let moveY = 0;

        if (keysHeld.has('KeyW') || keysHeld.has('ArrowUp') || keysHeld.has('w')) moveY -= 1;
        if (keysHeld.has('KeyS') || keysHeld.has('ArrowDown') || keysHeld.has('s')) moveY += 1;
        if (keysHeld.has('KeyA') || keysHeld.has('ArrowLeft') || keysHeld.has('a')) moveX -= 1;
        if (keysHeld.has('KeyD') || keysHeld.has('ArrowRight') || keysHeld.has('d')) moveX += 1;

        // Mobile touch joystick
        if (touchStartPos.current && touchCurrentPos.current) {
          const dx = touchCurrentPos.current.x - touchStartPos.current.x;
          const dy = touchCurrentPos.current.y - touchStartPos.current.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 12) {
            moveX = dx / dist;
            moveY = dy / dist;
          }
        }

        // Normalize diagonal vector
        const mag = Math.hypot(moveX, moveY);
        player.isMoving = mag > 0.05;

        // Dash trigger (Space or 'justPressed')
        const wantsDash = keysJustPressed.has('Space') || keysJustPressed.has('KeyJ');
        if (wantsDash && player.dashCooldown <= 0 && player.stamina >= 30) {
          player.isDashing = true;
          player.dashDuration = 0.22;
          player.dashCooldown = 1.1 * activePerks.dashCooldownMult;
          player.stamina = Math.max(0, player.stamina - 30);
          sound.playDash();
          spawnParticles(player.x, player.y, 8, '#f59e0b', 'spark');
        }

        // Update Dash & Stamina
        if (player.dashCooldown > 0) player.dashCooldown -= dt;
        if (player.isDashing) {
          player.dashDuration -= dt;
          if (player.dashDuration <= 0) player.isDashing = false;
        } else {
          // Recover stamina
          player.stamina = Math.min(100, player.stamina + 28 * dt);
        }

        // Check if on sticky syrup
        let onSyrup = false;
        syrupPuddles.forEach((puddle) => {
          if (
            player.x > puddle.x &&
            player.x < puddle.x + puddle.width &&
            player.y > puddle.y &&
            player.y < puddle.y + puddle.height
          ) {
            onSyrup = true;
          }
        });

        // Speed calculation
        let speed = player.baseSpeed;
        if (onSyrup && !activePerks.syrupImmune) {
          speed *= 0.4;
          if (Math.random() < 0.1) sound.playSyrup();
        }
        if (player.isDashing) {
          speed *= 2.4;
        }
        player.currentSpeed = speed;

        if (player.isMoving) {
          const dirX = moveX / (mag || 1);
          const dirY = moveY / (mag || 1);
          player.vx = dirX * speed;
          player.vy = dirY * speed;

          // Target angle
          const targetAngle = Math.atan2(dirY, dirX);
          // Smooth rotation
          let diff = targetAngle - player.angle;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          player.angle += diff * Math.min(1, 16 * dt);

          player.walkCycle += dt;
          sound.playScuttle();

          // Dash trail particles
          if (player.isDashing && Math.random() < 0.4) {
            spawnParticles(player.x, player.y, 2, 'rgba(251, 191, 36, 0.4)', 'spark');
          }
        } else {
          player.vx *= 0.6;
          player.vy *= 0.6;
        }

        // Apply movement
        player.x += player.vx * dt;
        player.y += player.vy * dt;

        // Collision with Obstacles
        obstacles.forEach((obs) => {
          // AABB vs Circle
          const closestX = Math.max(obs.x, Math.min(player.x, obs.x + obs.width));
          const closestY = Math.max(obs.y, Math.min(player.y, obs.y + obs.height));
          const distX = player.x - closestX;
          const distY = player.y - closestY;
          const dist = Math.hypot(distX, distY);

          if (dist < player.radius) {
            // Push player out
            const overlap = player.radius - dist;
            if (dist > 0.001) {
              player.x += (distX / dist) * overlap;
              player.y += (distY / dist) * overlap;
            } else {
              player.x += 1;
            }
          }
        });

        // 2. CHECK SAFE SHELTER (Under bottle caps or under giant table legs)
        let safeState = false;
        bottleCaps.forEach((cap) => {
          const capDist = Math.hypot(player.x - cap.x, player.y - cap.y);
          if (capDist < cap.radius) {
            safeState = true;
          }
        });
        // Table/chair leg shadow shelters
        obstacles.forEach((obs) => {
          if (obs.type === 'chair_leg' || obs.type === 'table_leg') {
            const centerX = obs.x + obs.width / 2;
            const centerY = obs.y + obs.height / 2;
            if (Math.hypot(player.x - centerX, player.y - centerY) < 42) {
              safeState = true;
            }
          }
        });

        if (safeState && !player.isSafe) {
          sound.playSafe();
          spawnParticles(player.x, player.y, 6, '#4ade80', 'ring');
        }
        player.isSafe = safeState;

        // 3. CRUMB COLLECTION
        const magnetRange = 36 + activePerks.crumbMagnetRadius;
        crumbs.forEach((crumb) => {
          if (crumb.collected) return;
          const dist = Math.hypot(player.x - crumb.x, player.y - crumb.y);

          // Crumb magnet pull
          if (dist < magnetRange && dist > 14) {
            crumb.x += ((player.x - crumb.x) / dist) * 160 * dt;
            crumb.y += ((player.y - crumb.y) / dist) * 160 * dt;
          }

          if (dist < player.radius + 14) {
            crumb.collected = true;
            collectedCount += crumb.value;
            sound.playCrumb(crumb.isGolden);
            spawnParticles(
              crumb.x,
              crumb.y,
              crumb.isGolden ? 12 : 6,
              crumb.isGolden ? '#facc15' : '#fef08a',
              'spark'
            );
          }
        });

        // 4. SLIPPER HAZARD SPAWN & UPDATE
        nextStompTime -= dt;
        if (nextStompTime <= 0) {
          // Schedule next stomp
          const [minSec, maxSec] = level.stompInterval;
          nextStompTime = minSec + Math.random() * (maxSec - minSec);

          // Target either near the player or somewhere in the room
          const leadAhead = 60;
          const targetX = Math.max(
            80,
            Math.min(
              level.width - 80,
              player.x + Math.cos(player.angle) * leadAhead + (Math.random() * 80 - 40)
            )
          );
          const targetY = Math.max(
            80,
            Math.min(
              level.height - 80,
              player.y + Math.sin(player.angle) * leadAhead + (Math.random() * 80 - 40)
            )
          );

          const warningDuration = 1.8 + activePerks.telegraphBonus;
          slippers.push({
            id: Date.now() + Math.random(),
            x: targetX,
            y: targetY,
            targetX,
            targetY,
            radius: 88, // Giant slipper impact zone
            timer: warningDuration,
            maxTimer: warningDuration,
            state: 'telegraph',
            impactProgress: 0,
          });
          sound.playStompWarning();
        }

        // Update active slippers
        let stompWarningActive = false;
        for (let i = slippers.length - 1; i >= 0; i--) {
          const slip = slippers[i];
          slip.timer -= dt;

          if (slip.state === 'telegraph') {
            stompWarningActive = true;
            if (slip.timer <= 0) {
              slip.state = 'stomping';
              slip.timer = 0.12;
            }
          } else if (slip.state === 'stomping') {
            slip.impactProgress += dt / 0.12;
            if (slip.timer <= 0) {
              slip.state = 'grounded';
              slip.timer = 0.8;
              slip.impactProgress = 1;

              // SLAM TRIGGER!
              sound.playStompImpact();
              cameraShake = 16;
              hitstopTimer = 0.05; // 50ms hitstop
              spawnParticles(slip.x, slip.y, 24, '#a8a29e', 'ring');

              // Check squish collision
              const slipDist = Math.hypot(player.x - slip.x, player.y - slip.y);
              if (slipDist < slip.radius && !player.isSafe) {
                // Game Over squished!
                isRunning = false;
                sound.playDefeat();
                onGameOver('Squished by a giant human slipper! Duck under bottle caps or table legs!', collectedCount);
                return;
              }
            }
          } else if (slip.state === 'grounded') {
            if (slip.timer <= 0) {
              slip.state = 'lifting';
              slip.timer = 0.4;
            }
          } else if (slip.state === 'lifting') {
            if (slip.timer <= 0) {
              slippers.splice(i, 1);
            }
          }
        }

        // 5. ROOMBA HAZARD PATROL
        let dangerLevel = 0;
        roombas.forEach((r) => {
          r.x += r.vx * dt;
          r.y += r.vy * dt;
          r.angle = Math.atan2(r.vy, r.vx);

          // Bounce off bounds
          if (r.x < r.radius + 30) {
            r.x = r.radius + 30;
            r.vx = Math.abs(r.vx);
          } else if (r.x > level.width - r.radius - 30) {
            r.x = level.width - r.radius - 30;
            r.vx = -Math.abs(r.vx);
          }
          if (r.y < r.radius + 30) {
            r.y = r.radius + 30;
            r.vy = Math.abs(r.vy);
          } else if (r.y > level.height - r.radius - 30) {
            r.y = level.height - r.radius - 30;
            r.vy = -Math.abs(r.vy);
          }

          // Bounce off furniture
          obstacles.forEach((obs) => {
            if (obs.type === 'chair_leg' || obs.type === 'table_leg' || obs.type === 'mug') {
              const ox = obs.x + obs.width / 2;
              const oy = obs.y + obs.height / 2;
              const d = Math.hypot(r.x - ox, r.y - oy);
              if (d < r.radius + obs.width / 2) {
                r.vx = ((r.x - ox) / d) * r.speed;
                r.vy = ((r.y - oy) / d) * r.speed;
              }
            }
          });

          // Check distance to player
          const distToAnt = Math.hypot(player.x - r.x, player.y - r.y);
          if (distToAnt < 280) {
            dangerLevel = Math.max(dangerLevel, (280 - distToAnt) / 280);
          }

          // Suction cone pull on player if not safe
          const antAngleFromRoomba = Math.atan2(player.y - r.y, player.x - r.x);
          let angleDiff = Math.abs(antAngleFromRoomba - r.angle);
          while (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

          if (distToAnt < r.suctionRadius + 60 && angleDiff < 0.6 && !player.isSafe) {
            // Suction pull
            const pullForce = 85 * (1 - distToAnt / (r.suctionRadius + 60));
            player.x -= Math.cos(antAngleFromRoomba) * pullForce * dt;
            player.y -= Math.sin(antAngleFromRoomba) * pullForce * dt;
          }

          // Direct collision squish / vacuum intake
          if (distToAnt < r.radius + player.radius && !player.isSafe) {
            isRunning = false;
            sound.playDefeat();
            onGameOver('Sucked into the robotic vacuum dustbin! Steer clear of its front brush!', collectedCount);
            return;
          }
        });

        // 6. EXIT HOLE VICTORY CHECK
        const distToExit = Math.hypot(player.x - exitHole.x, player.y - exitHole.y);
        const canExit = collectedCount >= level.requiredCrumbs;

        if (distToExit < exitHole.radius && canExit) {
          isRunning = false;
          sound.playVictory();
          onVictory(collectedCount, totalTimeElapsed);
          return;
        }

        // 7. CAMERA TRACKING
        const targetCamX = player.x - canvas.width / 2;
        const targetCamY = player.y - canvas.height / 2;
        camera.x += (targetCamX - camera.x) * 0.1;
        camera.y += (targetCamY - camera.y) * 0.1;

        // Clamp camera to level edges
        camera.x = Math.max(0, Math.min(level.width - canvas.width, camera.x));
        camera.y = Math.max(0, Math.min(level.height - canvas.height, camera.y));

        // Update metrics back to HUD
        onUpdateMetrics({
          crumbsCollected: collectedCount,
          totalCrumbs: level.requiredCrumbs,
          stamina: player.stamina,
          isDashing: player.isDashing,
          isSafe: player.isSafe,
          timeElapsed: totalTimeElapsed,
          dangerLevel,
          stompWarningActive,
        });

        // Decay camera shake
        if (cameraShake > 0.1) {
          cameraShake *= 0.88;
        } else {
          cameraShake = 0;
        }
      }

      // --- RENDERING PHASE ---
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      // Apply camera shake
      const shakeX = cameraShake > 0 ? (Math.random() * 2 - 1) * cameraShake : 0;
      const shakeY = cameraShake > 0 ? (Math.random() * 2 - 1) * cameraShake : 0;
      ctx.translate(-camera.x + shakeX, -camera.y + shakeY);

      // A. DRAW FLOOR
      if (floorImageRef.current && floorImageRef.current.complete) {
        // Tile or stretch the preloaded floor texture
        const pattern = ctx.createPattern(floorImageRef.current, 'repeat');
        if (pattern) {
          ctx.fillStyle = pattern;
          ctx.fillRect(0, 0, level.width, level.height);
        } else {
          ctx.fillStyle = '#292524';
          ctx.fillRect(0, 0, level.width, level.height);
        }
      } else {
        // Stylized room floor fallback
        if (level.floorTheme === 'kitchen') {
          // Terracotta tiles
          ctx.fillStyle = '#c2410c';
          ctx.fillRect(0, 0, level.width, level.height);
          // Grout grid
          ctx.strokeStyle = '#7c2d12';
          ctx.lineWidth = 4;
          for (let tx = 0; tx < level.width; tx += 120) {
            ctx.beginPath();
            ctx.moveTo(tx, 0);
            ctx.lineTo(tx, level.height);
            ctx.stroke();
          }
          for (let ty = 0; ty < level.height; ty += 120) {
            ctx.beginPath();
            ctx.moveTo(0, ty);
            ctx.lineTo(level.width, ty);
            ctx.stroke();
          }
        } else if (level.floorTheme === 'living_room') {
          ctx.fillStyle = '#44403c';
          ctx.fillRect(0, 0, level.width, level.height);
        } else {
          ctx.fillStyle = '#334155';
          ctx.fillRect(0, 0, level.width, level.height);
        }
      }

      // Floor ambient tint
      ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
      ctx.fillRect(0, 0, level.width, level.height);

      // B. DRAW SYRUP PUDDLES
      syrupPuddles.forEach((puddle) => {
        ctx.save();
        ctx.fillStyle = puddle.color;
        ctx.beginPath();
        ctx.ellipse(
          puddle.x + puddle.width / 2,
          puddle.y + puddle.height / 2,
          puddle.width / 2,
          puddle.height / 2,
          0.1,
          0,
          Math.PI * 2
        );
        ctx.fill();

        // Syrup gloss sheen
        ctx.fillStyle = 'rgba(254, 243, 199, 0.35)';
        ctx.beginPath();
        ctx.ellipse(
          puddle.x + puddle.width / 2 - 15,
          puddle.y + puddle.height / 2 - 10,
          puddle.width / 3.5,
          puddle.height / 4,
          0.1,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.restore();
      });

      // C. DRAW EXIT HOLE
      ctx.save();
      const exitOpen = collectedCount >= level.requiredCrumbs;
      // Hole shadow
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(exitHole.x, exitHole.y, exitHole.radius, 0, Math.PI * 2);
      ctx.fill();

      // Border and illumination
      ctx.strokeStyle = exitOpen ? '#facc15' : '#71717a';
      ctx.lineWidth = exitOpen ? 4 : 2;
      ctx.stroke();

      if (exitOpen) {
        // Golden escape glow
        const glowGrad = ctx.createRadialGradient(
          exitHole.x,
          exitHole.y,
          5,
          exitHole.x,
          exitHole.y,
          exitHole.radius * 2.2
        );
        glowGrad.addColorStop(0, 'rgba(250, 204, 21, 0.45)');
        glowGrad.addColorStop(1, 'rgba(250, 204, 21, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(exitHole.x, exitHole.y, exitHole.radius * 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Pulsing exit arrow
        const pulse = Math.sin(totalTimeElapsed * 6) * 6;
        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('ESCAPE! →', exitHole.x - 55 + pulse, exitHole.y);
      } else {
        ctx.fillStyle = '#a1a1aa';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`NEED ${level.requiredCrumbs} 🍬`, exitHole.x - 55, exitHole.y);
      }
      ctx.restore();

      // D. DRAW CRUMBS
      crumbs.forEach((crumb) => {
        if (crumb.collected) return;
        ctx.save();
        const floatY = Math.sin(totalTimeElapsed * 4 + crumb.floatOffset) * 2;

        if (crumb.isGolden) {
          // Golden Sugar Crystal
          ctx.fillStyle = '#eab308';
          ctx.beginPath();
          ctx.arc(crumb.x, crumb.y + floatY, 6, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(crumb.x - 1.5, crumb.y + floatY - 1.5, 2.5, 0, Math.PI * 2);
          ctx.fill();

          // Sparkle halo
          ctx.strokeStyle = 'rgba(254, 240, 138, 0.4)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(crumb.x, crumb.y + floatY, 9, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          // Regular Sugar Crumb
          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.arc(crumb.x, crumb.y + floatY, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(crumb.x - 1, crumb.y + floatY - 1, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      // E. DRAW BOTTLE CAPS (Safe Shelters)
      bottleCaps.forEach((cap) => {
        ctx.save();
        // Drop shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.arc(cap.x + 3, cap.y + 4, cap.radius, 0, Math.PI * 2);
        ctx.fill();

        // Metallic serrated edge (crown cork)
        ctx.fillStyle = cap.color;
        ctx.beginPath();
        ctx.arc(cap.x, cap.y, cap.radius, 0, Math.PI * 2);
        ctx.fill();

        // Rim bevel
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(cap.x, cap.y, cap.radius - 3, 0, Math.PI * 2);
        ctx.stroke();

        // Label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('SHIELD', cap.x, cap.y);
        ctx.restore();
      });

      // F. DRAW ROOMBA HAZARDS
      roombas.forEach((r) => {
        ctx.save();
        ctx.translate(r.x, r.y);
        ctx.rotate(r.angle);

        // Suction vacuum cone
        const coneGrad = ctx.createLinearGradient(0, 0, r.suctionRadius + 50, 0);
        coneGrad.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
        coneGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.fillStyle = coneGrad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, r.suctionRadius + 50, -0.45, 0.45);
        ctx.closePath();
        ctx.fill();

        // Main body disc
        ctx.fillStyle = '#18181b';
        ctx.beginPath();
        ctx.arc(0, 0, r.radius, 0, Math.PI * 2);
        ctx.fill();

        // Bumper rim
        ctx.strokeStyle = '#52525b';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Front bumper arc
        ctx.strokeStyle = '#71717a';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(0, 0, r.radius - 3, -Math.PI / 2.5, Math.PI / 2.5);
        ctx.stroke();

        // Green power LED
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();

        // Headlight beams
        ctx.fillStyle = 'rgba(254, 240, 138, 0.4)';
        ctx.beginPath();
        ctx.arc(r.radius - 2, -12, 3, 0, Math.PI * 2);
        ctx.arc(r.radius - 2, 12, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });

      // G. DRAW SLIPPER HAZARD TELEGRAPHS & STOMPS
      slippers.forEach((slip) => {
        ctx.save();
        if (slip.state === 'telegraph') {
          // Warning circle with contracting countdown ring
          const progress = 1 - slip.timer / slip.maxTimer; // 0 to 1

          // Pulsating red danger zone
          ctx.fillStyle = 'rgba(239, 68, 68, 0.22)';
          ctx.beginPath();
          ctx.arc(slip.x, slip.y, slip.radius, 0, Math.PI * 2);
          ctx.fill();

          // Outer dashed danger boundary
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([8, 6]);
          ctx.beginPath();
          ctx.arc(slip.x, slip.y, slip.radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);

          // Contracting inner warning ring
          const innerR = slip.radius * (1 - progress);
          ctx.strokeStyle = '#f87171';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(slip.x, slip.y, Math.max(2, innerR), 0, Math.PI * 2);
          ctx.stroke();

          // Warning exclamation icon
          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 22px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('⚠', slip.x, slip.y);
        } else if (slip.state === 'stomping' || slip.state === 'grounded' || slip.state === 'lifting') {
          // Giant Plaid / Leather Slipper
          ctx.save();
          ctx.translate(slip.x, slip.y);

          // Slipper shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
          ctx.beginPath();
          ctx.ellipse(0, 0, slip.radius + 6, slip.radius * 0.75, 0.1, 0, Math.PI * 2);
          ctx.fill();

          // Giant Slipper Sole & Plaid upper
          ctx.fillStyle = '#7f1d1d'; // Crimson fleece
          ctx.beginPath();
          ctx.ellipse(0, 0, slip.radius, slip.radius * 0.68, 0.1, 0, Math.PI * 2);
          ctx.fill();

          // Foam sole rim
          ctx.strokeStyle = '#f8fafc';
          ctx.lineWidth = 6;
          ctx.stroke();

          // Plaid weave stripes
          ctx.strokeStyle = '#b91c1c';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(-slip.radius * 0.6, -slip.radius * 0.4);
          ctx.lineTo(slip.radius * 0.6, slip.radius * 0.4);
          ctx.stroke();

          ctx.restore();
        }
        ctx.restore();
      });

      // H. DRAW PLAYER ANT
      renderAnt({
        ctx,
        x: player.x,
        y: player.y,
        angle: player.angle,
        scale: 1.05,
        walkTime: player.walkCycle,
        isMoving: player.isMoving,
        outfit,
        isDashing: player.isDashing,
        isSafe: player.isSafe,
      });

      // I. DRAW FURNITURE OBSTACLES (Above floor & ant shadow)
      obstacles.forEach((obs) => {
        ctx.save();
        if (obs.type === 'baseboard') {
          ctx.fillStyle = '#27272a';
          ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
          ctx.strokeStyle = '#3f3f46';
          ctx.lineWidth = 1;
          ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
        } else if (obs.type === 'chair_leg' || obs.type === 'table_leg') {
          // Cast soft shadow circle below leg
          ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
          ctx.beginPath();
          ctx.arc(obs.x + obs.width / 2, obs.y + obs.height / 2, obs.width / 1.7, 0, Math.PI * 2);
          ctx.fill();

          // Wood grain post
          ctx.fillStyle = '#78350f';
          ctx.beginPath();
          ctx.arc(obs.x + obs.width / 2, obs.y + obs.height / 2, obs.width / 2, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#92400e';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Safe icon on furniture base
          ctx.fillStyle = '#fef3c7';
          ctx.font = '9px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('SHELTER', obs.x + obs.width / 2, obs.y + obs.height / 2);
        } else if (obs.type === 'mug') {
          // Ceramic Coffee Mug top-down
          ctx.fillStyle = '#f8fafc';
          ctx.beginPath();
          ctx.arc(obs.x + obs.width / 2, obs.y + obs.height / 2, obs.width / 2, 0, Math.PI * 2);
          ctx.fill();
          // Dark coffee inside
          ctx.fillStyle = '#292524';
          ctx.beginPath();
          ctx.arc(obs.x + obs.width / 2, obs.y + obs.height / 2, obs.width / 2.6, 0, Math.PI * 2);
          ctx.fill();
          // Handle
          ctx.strokeStyle = '#f8fafc';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.arc(obs.x + obs.width / 2 + obs.width / 2, obs.y + obs.height / 2, 8, -Math.PI / 2, Math.PI / 2);
          ctx.stroke();
        } else if (obs.type === 'book') {
          // Large book
          ctx.fillStyle = '#065f46';
          ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(obs.x + 3, obs.y + 3, obs.width - 6, 4);
          ctx.strokeStyle = '#047857';
          ctx.lineWidth = 2;
          ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
        }
        ctx.restore();
      });

      // J. DRAW PARTICLES
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        ctx.save();
        ctx.fillStyle = p.color;
        if (p.shape === 'ring') {
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      ctx.restore(); // Restore camera translation

      // Clear edge-triggered keys after each frame update
      keysJustPressed.clear();

      requestAnimationFrame(frame);
    };

    const animId = requestAnimationFrame(frame);

    return () => {
      isRunning = false;
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [level, outfit, isPaused, onVictory, onGameOver, onUpdateMetrics]);

  // Touch joystick handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    touchCurrentPos.current = { x: touch.clientX, y: touch.clientY };
    setTouchActive(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPos.current) return;
    const touch = e.touches[0];
    touchCurrentPos.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = () => {
    touchStartPos.current = null;
    touchCurrentPos.current = null;
    setTouchActive(false);
  };

  return (
    <div
      className="relative w-full h-screen overflow-hidden bg-neutral-950 select-none touch-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />

      {/* Virtual Joystick Visual Indicator on Mobile */}
      {touchActive && touchStartPos.current && touchCurrentPos.current && (
        <div
          className="absolute pointer-events-none rounded-full border-2 border-amber-400/50 bg-amber-950/20 w-24 h-24 -translate-x-12 -translate-y-12 flex items-center justify-center z-20"
          style={{
            left: touchStartPos.current.x,
            top: touchStartPos.current.y,
          }}
        >
          <div
            className="w-8 h-8 rounded-full bg-amber-400 shadow-md"
            style={{
              transform: `translate(${Math.max(
                -28,
                Math.min(28, touchCurrentPos.current.x - touchStartPos.current.x)
              )}px, ${Math.max(
                -28,
                Math.min(28, touchCurrentPos.current.y - touchStartPos.current.y)
              )}px)`,
            }}
          />
        </div>
      )}
    </div>
  );
};
