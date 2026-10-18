/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AntOutfit } from '../types/game';
import { WARDROBE_ITEMS } from '../data/wardrobeItems';

export interface RenderAntOptions {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  angle: number; // in radians (0 is pointing right)
  scale?: number; // default 1.0 (approx 44px length)
  walkTime?: number;
  isMoving?: boolean;
  outfit: AntOutfit;
  isDashing?: boolean;
  isSafe?: boolean;
  cheerProgress?: number; // for celebration jump
}

export function renderAnt(options: RenderAntOptions) {
  const {
    ctx,
    x,
    y,
    angle,
    scale = 1.0,
    walkTime = 0,
    isMoving = false,
    outfit,
    isDashing = false,
    isSafe = false,
    cheerProgress = 0,
  } = options;

  // Retrieve item configs
  const speciesItem = WARDROBE_ITEMS.find((i) => i.id === outfit.species) || WARDROBE_ITEMS[0];
  const bodyColor = speciesItem.color || '#1c1917';
  const accentColor = speciesItem.accentColor || '#44403c';

  const hat = outfit.hat;
  const outfitItem = outfit.outfit;
  const eyewear = outfit.eyewear;
  const footwear = outfit.footwear;
  const charm = outfit.charm;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);

  // Jump offset if cheering
  if (cheerProgress > 0) {
    const jumpY = Math.sin(cheerProgress * Math.PI) * 14;
    ctx.translate(0, -jumpY);
  }

  // Dash squash-and-stretch
  if (isDashing) {
    ctx.scale(1.25, 0.85);
  }

  // Soft drop shadow
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.beginPath();
  ctx.ellipse(-2, 3, 24, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Walk gait calculation
  // Alternating tripod gait: Group A (L1, R2, L3), Group B (R1, L2, R3)
  const speed = isMoving ? 14 : 2;
  const gaitCycle = walkTime * speed;
  const swingA = Math.sin(gaitCycle);
  const swingB = Math.sin(gaitCycle + Math.PI);

  // --- DRAW LEGS (6 Articulated Tiny Legs) ---
  const legDefs = [
    // [xBase, yBase, length1, length2, swingSign, isGroupA]
    // Left side (y < 0 in local space)
    { x: 3, y: -4, l1: 10, l2: 12, angleOffset: -0.6, swing: swingA }, // Front Left
    { x: -2, y: -5, l1: 12, l2: 13, angleOffset: -1.4, swing: swingB }, // Middle Left
    { x: -7, y: -4, l1: 14, l2: 16, angleOffset: -2.3, swing: swingA }, // Rear Left
    // Right side (y > 0 in local space)
    { x: 3, y: 4, l1: 10, l2: 12, angleOffset: 0.6, swing: swingB }, // Front Right
    { x: -2, y: 5, l1: 12, l2: 13, angleOffset: 1.4, swing: swingA }, // Middle Right
    { x: -7, y: 4, l1: 14, l2: 16, angleOffset: 2.3, swing: swingB }, // Rear Right
  ];

  legDefs.forEach((leg) => {
    ctx.save();
    ctx.strokeStyle = bodyColor;
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const swingAngle = leg.swing * (isMoving ? 0.35 : 0.05);
    const jointAngle = leg.angleOffset + swingAngle;

    const jointX = leg.x + Math.cos(jointAngle) * leg.l1;
    const jointY = leg.y + Math.sin(jointAngle) * leg.l1;

    // Tarsus tip
    const tipAngle = jointAngle + (leg.y > 0 ? 0.5 : -0.5);
    const tipX = jointX + Math.cos(tipAngle) * leg.l2;
    const tipY = jointY + Math.sin(tipAngle) * leg.l2;

    ctx.beginPath();
    ctx.moveTo(leg.x, leg.y);
    ctx.lineTo(jointX, jointY);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();

    // Footwear on tip
    if (footwear === 'footwear_golden') {
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(tipX, tipY, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(tipX - 0.5, tipY - 0.5, 1, 0, Math.PI * 2);
      ctx.fill();
    } else if (footwear === 'footwear_sneakers') {
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.ellipse(tipX, tipY, 3, 2, tipAngle, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(tipX + Math.cos(tipAngle) * 1.5, tipY + Math.sin(tipAngle) * 1.5, 1.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (footwear === 'footwear_leaf') {
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.ellipse(tipX, tipY, 3.2, 1.8, tipAngle + 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  });

  // --- DRAW OUTFIT: VELVET CAPE (Rendered behind abdomen/thorax) ---
  if (outfitItem === 'outfit_cape') {
    ctx.save();
    const flutter = Math.sin(walkTime * 12) * (isMoving ? 4 : 1);
    ctx.fillStyle = '#881337';
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-1, -4);
    ctx.quadraticCurveTo(-14, -8 + flutter, -28, -6 + flutter * 1.5);
    ctx.lineTo(-28, 6 + flutter * 1.5);
    ctx.quadraticCurveTo(-14, 8 + flutter, -1, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Golden clasp
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.arc(-2, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (outfitItem === 'outfit_scarf') {
    // Trailing scarf
    ctx.save();
    const flutter = Math.cos(walkTime * 10) * (isMoving ? 5 : 1.5);
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.moveTo(3, -3);
    ctx.quadraticCurveTo(-8, -9 + flutter, -22, -8 + flutter * 1.4);
    ctx.lineTo(-20, -5 + flutter * 1.4);
    ctx.quadraticCurveTo(-7, -4 + flutter, 2, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // --- BODY SEGMENT 1: ABDOMEN (Gaster) ---
  // Oval back segment with chitin sheen
  ctx.save();
  const abdomenBob = Math.sin(walkTime * 8) * (isMoving ? 1.5 : 0.4);
  const gasterGrad = ctx.createRadialGradient(-16, -2, 2, -15, 0, 14);
  gasterGrad.addColorStop(0, accentColor);
  gasterGrad.addColorStop(0.7, bodyColor);
  gasterGrad.addColorStop(1, '#09090b');

  ctx.fillStyle = gasterGrad;
  ctx.beginPath();
  ctx.ellipse(-16, abdomenBob, 13, 8.5, -0.05, 0, Math.PI * 2);
  ctx.fill();

  // Chitin stripe highlights
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(-16, abdomenBob, 7, -1, 1);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(-13, abdomenBob, 7, -1, 1);
  ctx.stroke();
  ctx.restore();

  // --- PETIOLE (Thin waist joint) ---
  ctx.save();
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.arc(-5.5, 0, 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // --- BODY SEGMENT 2: THORAX (Mesosoma) ---
  ctx.save();
  const thoraxGrad = ctx.createRadialGradient(-1, -1, 1, 0, 0, 8);
  thoraxGrad.addColorStop(0, accentColor);
  thoraxGrad.addColorStop(0.8, bodyColor);
  thoraxGrad.addColorStop(1, '#09090b');

  ctx.fillStyle = thoraxGrad;
  ctx.beginPath();
  ctx.ellipse(-0.5, 0, 6.5, 4.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // --- OUTFIT OVERLAY: TUXEDO / TRENCH ---
  if (outfitItem === 'outfit_tuxedo') {
    ctx.save();
    // Crisp white shirt V
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(3, 0);
    ctx.lineTo(-2, -3);
    ctx.lineTo(-2, 3);
    ctx.closePath();
    ctx.fill();

    // Black tuxedo lapels
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.moveTo(3, -2);
    ctx.lineTo(-3, -4);
    ctx.lineTo(-3, -2);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(3, 2);
    ctx.lineTo(-3, 4);
    ctx.lineTo(-3, 2);
    ctx.closePath();
    ctx.fill();

    // Crimson Bowtie
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(3, 0);
    ctx.lineTo(5, -2.5);
    ctx.lineTo(5, 2.5);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(3, 0);
    ctx.lineTo(1, -2.5);
    ctx.lineTo(1, 2.5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.arc(3, 0, 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (outfitItem === 'outfit_trench') {
    ctx.save();
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.ellipse(-0.5, 0, 6, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Tiny belt buckle
    ctx.fillStyle = '#fde047';
    ctx.fillRect(-2, -1, 2, 2);
    ctx.restore();
  }

  // --- BODY SEGMENT 3: HEAD & MANDIBLES ---
  ctx.save();
  const headX = 8.5;
  const headGrad = ctx.createRadialGradient(headX + 1, -1, 1, headX, 0, 7);
  headGrad.addColorStop(0, accentColor);
  headGrad.addColorStop(0.7, bodyColor);
  headGrad.addColorStop(1, '#09090b');

  ctx.fillStyle = headGrad;
  ctx.beginPath();
  ctx.ellipse(headX, 0, 5.8, 5.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Mandibles (pincer jaws)
  ctx.fillStyle = '#78350f';
  ctx.beginPath();
  ctx.moveTo(headX + 5, -1.8);
  ctx.quadraticCurveTo(headX + 8.5, -3, headX + 7.5, -0.5);
  ctx.lineTo(headX + 5, -0.5);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(headX + 5, 1.8);
  ctx.quadraticCurveTo(headX + 8.5, 3, headX + 7.5, 0.5);
  ctx.lineTo(headX + 5, 0.5);
  ctx.closePath();
  ctx.fill();

  // Compound Eyes
  const eyeColor = speciesItem.id === 'species_violet' ? '#e879f9' : '#0f172a';
  // Left eye
  ctx.fillStyle = eyeColor;
  ctx.beginPath();
  ctx.ellipse(headX + 1, -3.4, 2.4, 1.8, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(headX + 1.6, -3.8, 0.7, 0, Math.PI * 2);
  ctx.fill();

  // Right eye
  ctx.fillStyle = eyeColor;
  ctx.beginPath();
  ctx.ellipse(headX + 1, 3.4, 2.4, 1.8, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(headX + 1.6, 3.8, 0.7, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // --- EYEWEAR ---
  if (eyewear === 'eyewear_monocle') {
    ctx.save();
    const ex = 9.5;
    const ey = 3.4;
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 1.3;
    ctx.fillStyle = 'rgba(254, 240, 138, 0.35)';
    ctx.beginPath();
    ctx.arc(ex, ey, 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Dainty hanging chain
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(ex, ey + 2.8);
    ctx.quadraticCurveTo(ex - 4, ey + 6, ex - 6, ey + 4);
    ctx.stroke();
    ctx.restore();
  } else if (eyewear === 'eyewear_sunglasses') {
    ctx.save();
    ctx.fillStyle = '#09090b';
    ctx.strokeStyle = '#52525b';
    ctx.lineWidth = 1;
    // Dual dark lenses
    ctx.beginPath();
    ctx.roundRect(8, -5.5, 3.8, 3.5, 1);
    ctx.roundRect(8, 2.0, 3.8, 3.5, 1);
    ctx.fill();
    ctx.stroke();

    // Bridge
    ctx.beginPath();
    ctx.moveTo(9.5, -2);
    ctx.lineTo(9.5, 2);
    ctx.stroke();
    ctx.restore();
  } else if (eyewear === 'eyewear_goggles') {
    ctx.save();
    ctx.fillStyle = '#78350f';
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 1.2;
    // Brass lens rims
    ctx.beginPath();
    ctx.arc(9.2, -3.2, 2.6, 0, Math.PI * 2);
    ctx.arc(9.2, 3.2, 2.6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.fill();
    ctx.restore();
  }

  // --- ANTENNAE (2 Jointed Wiggling Feelers) ---
  const antennaWiggle = Math.sin(walkTime * 9) * 0.12;
  const antBaseX = 11;
  const antL1 = 9;
  const antL2 = 10;

  // Left Antenna
  ctx.save();
  ctx.strokeStyle = bodyColor;
  ctx.lineWidth = 1.3;
  ctx.lineCap = 'round';

  const antAngle1 = -0.4 + antennaWiggle;
  const antElbow1X = antBaseX + Math.cos(antAngle1) * antL1;
  const antElbow1Y = -2 + Math.sin(antAngle1) * antL1;
  const antTip1X = antElbow1X + Math.cos(antAngle1 - 0.7) * antL2;
  const antTip1Y = antElbow1Y + Math.sin(antAngle1 - 0.7) * antL2;

  ctx.beginPath();
  ctx.moveTo(antBaseX, -2);
  ctx.lineTo(antElbow1X, antElbow1Y);
  ctx.lineTo(antTip1X, antTip1Y);
  ctx.stroke();

  // Right Antenna
  const antAngle2 = 0.4 - antennaWiggle;
  const antElbow2X = antBaseX + Math.cos(antAngle2) * antL1;
  const antElbow2Y = 2 + Math.sin(antAngle2) * antL1;
  const antTip2X = antElbow2X + Math.cos(antAngle2 + 0.7) * antL2;
  const antTip2Y = antElbow2Y + Math.sin(antAngle2 + 0.7) * antL2;

  ctx.beginPath();
  ctx.moveTo(antBaseX, 2);
  ctx.lineTo(antElbow2X, antElbow2Y);
  ctx.lineTo(antTip2X, antTip2Y);
  ctx.stroke();

  // --- CHARMS ON ANTENNA ---
  if (charm === 'charm_flower') {
    // Flower on left antenna elbow
    ctx.save();
    ctx.translate(antElbow1X, antElbow1Y);
    ctx.fillStyle = '#facc15';
    for (let i = 0; i < 5; i++) {
      const pAngle = (i * Math.PI * 2) / 5;
      ctx.beginPath();
      ctx.ellipse(Math.cos(pAngle) * 3, Math.sin(pAngle) * 3, 2, 1.2, pAngle, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (charm === 'charm_lantern') {
    // Mini glowing lantern on right antenna tip
    ctx.save();
    ctx.translate(antTip2X, antTip2Y);
    // Glow aura
    const radGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 18);
    radGrad.addColorStop(0, 'rgba(251, 191, 36, 0.6)');
    radGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();

    // Lantern fixture
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-1.5, -4, 3, 2);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-2, -2, 4, 5);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-2, 3, 4, 1.5);
    ctx.restore();
  } else if (charm === 'charm_sparkler') {
    // Sparkler stars
    const sparkPhase = (walkTime * 15) % (Math.PI * 2);
    ctx.save();
    ctx.fillStyle = '#38bdf8';
    [-2, 2].forEach((offsetY, idx) => {
      const tipX = idx === 0 ? antTip1X : antTip2X;
      const tipY = idx === 0 ? antTip1Y : antTip2Y;
      const sparkR = 2.5 + Math.sin(sparkPhase + idx) * 1.5;
      ctx.beginPath();
      ctx.arc(tipX, tipY, sparkR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(tipX, tipY, 1, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }
  ctx.restore();

  // --- HATS (Mounted on head top) ---
  const hatX = 8.5;
  const hatY = 0;

  if (hat === 'hat_tophat') {
    ctx.save();
    // Silk Top Hat
    ctx.fillStyle = '#18181b';
    // Brim
    ctx.beginPath();
    ctx.ellipse(hatX + 1, hatY, 3, 7.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Crown cylinder
    ctx.fillRect(hatX - 2, hatY - 5, 6.5, 10);
    ctx.beginPath();
    ctx.ellipse(hatX + 4.5, hatY, 2, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Crimson ribbon
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(hatX + 0.5, hatY - 5.1, 1.8, 10.2);
    ctx.restore();
  } else if (hat === 'hat_fedora') {
    ctx.save();
    ctx.fillStyle = '#78350f';
    // Curled brim
    ctx.beginPath();
    ctx.ellipse(hatX + 1, hatY, 3.5, 8, -0.1, 0, Math.PI * 2);
    ctx.fill();
    // Creased crown
    ctx.beginPath();
    ctx.ellipse(hatX + 1, hatY, 4, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Brown band
    ctx.fillStyle = '#451a03';
    ctx.fillRect(hatX - 0.5, hatY - 4.5, 1.8, 9);
    ctx.restore();
  } else if (hat === 'hat_crown') {
    ctx.save();
    ctx.fillStyle = '#eab308';
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 1;
    // 3 Peaks
    ctx.beginPath();
    ctx.moveTo(hatX - 2, -6);
    ctx.lineTo(hatX + 4, -5);
    ctx.lineTo(hatX + 2, -2);
    ctx.lineTo(hatX + 5, 0);
    ctx.lineTo(hatX + 2, 2);
    ctx.lineTo(hatX + 4, 5);
    ctx.lineTo(hatX - 2, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Ruby gem
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(hatX + 1, 0, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (hat === 'hat_toque') {
    ctx.save();
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    // Chef's puffed toque
    ctx.beginPath();
    ctx.ellipse(hatX + 1, hatY, 5, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Puffs
    [-4, 0, 4].forEach((py) => {
      ctx.beginPath();
      ctx.arc(hatX + 4, py, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
    ctx.restore();
  } else if (hat === 'hat_beret') {
    ctx.save();
    ctx.fillStyle = '#e11d48';
    ctx.beginPath();
    ctx.ellipse(hatX, hatY - 1, 4.5, 7.5, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Little green sprout stem
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(hatX + 1, hatY - 1, 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (hat === 'hat_space') {
    ctx.save();
    // Glass bubble dome
    const domeGrad = ctx.createRadialGradient(hatX - 1, -2, 2, hatX, 0, 9);
    domeGrad.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
    domeGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.25)');
    domeGrad.addColorStop(1, 'rgba(14, 165, 233, 0.6)');

    ctx.fillStyle = domeGrad;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(hatX, 0, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // --- SAFE / HIDDEN SHIELD BADGE ---
  if (isSafe) {
    ctx.save();
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(0, -18, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✓', 0, -18);
    ctx.restore();
  }

  ctx.restore();
}
