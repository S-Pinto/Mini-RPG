// High-Quality Procedural 3D Models with Articulated Limbs and Attack Animations
// The Albedo Renegades: Shadow of Elanthria

import * as THREE from 'three';
import type { ClassId, EnemyType, Item, ItemSlot, WeaponStyle, WeaponModelType, HelmModelType, ArmorModelType, AllyType, DestructibleProp } from '../types/game.ts';

export const GEO = {
  box: new THREE.BoxGeometry(1, 1, 1),
  sph: new THREE.SphereGeometry(1, 12, 10),
  cone: new THREE.ConeGeometry(1, 1, 10),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 12),
  tube: new THREE.CylinderGeometry(1, 1, 1, 12, 1, true),
  torus: new THREE.TorusGeometry(1, 0.14, 8, 20),
  ring: new THREE.RingGeometry(0.85, 1, 24),
  circle: new THREE.CircleGeometry(1, 24),
  plane: new THREE.PlaneGeometry(1, 1)
};

const MAT_CACHE = new Map<string, THREE.Material>();

export function getLambert(color: number, emissive: number = 0x000000): THREE.MeshLambertMaterial {
  const key = `lam_${color}_${emissive}`;
  let m = MAT_CACHE.get(key) as THREE.MeshLambertMaterial;
  if (!m) {
    m = new THREE.MeshLambertMaterial({ color, emissive });
    MAT_CACHE.set(key, m);
  }
  return m;
}

export function getBasic(color: number, opacity: number = 1, transparent: boolean = false): THREE.MeshBasicMaterial {
  const key = `bas_${color}_${opacity}_${transparent}`;
  let m = MAT_CACHE.get(key) as THREE.MeshBasicMaterial;
  if (!m) {
    m = new THREE.MeshBasicMaterial({
      color,
      opacity,
      transparent,
      depthWrite: !transparent,
      side: THREE.DoubleSide
    });
    MAT_CACHE.set(key, m);
  }
  return m;
}

export function createShadowBlob(parent: THREE.Group, radius: number = 0.7): THREE.Mesh {
  const m = new THREE.Mesh(GEO.circle, getBasic(0x000000, 0.45, true));
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.02;
  m.scale.set(radius, radius, radius);
  parent.add(m);
  return m;
}

export type AttackAnimationType =
  | 'slash_horizontal'
  | 'slash_vertical'
  | 'thrust'
  | 'mage_cast'
  | 'fireball_cast'
  | 'smite_cast'
  | 'whirlwind'
  | 'roar_buff'
  | 'sneak_attack'
  | 'flamestrike'
  | 'dagger_flurry'
  | 'slam_down'
  | 'spin_360'
  | 'bow_shot'
  | 'generic';

export interface HumanoidRig {
  root: THREE.Group;
  body: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
  forearmL: THREE.Group;
  forearmR: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
  shinL: THREE.Group;
  shinR: THREE.Group;
  weaponHolder: THREE.Group;
  shieldHolder: THREE.Group;
  gearHelmGroup: THREE.Group;
  gearArmorGroup: THREE.Group;
  defaultHeadgearGroup: THREE.Group;
  isWizard?: boolean;
  animate: (
    t: number,
    speed: number,
    attackProgress?: number,
    attackType?: AttackAnimationType,
    isDashing?: boolean
  ) => void;
  updateGearVisuals?: (equip: Partial<Record<ItemSlot, Item>>, classId: ClassId, subclassWeaponStyle?: WeaponStyle) => void;
}

export interface EnemyModelRig {
  root: THREE.Group;
  update: (t: number, speed: number, attackProgress?: number) => void;
}

// -------------------------------------------------------------
// Humanoid Rig with Correct Anatomical Hierarchies & Pivot Points
// -------------------------------------------------------------
export function buildHumanoid(
  scale: number = 1.0,
  skinCol: number = 0xf5cfa6,
  bodyCol: number = 0x5a6075,
  legsCol: number = 0x333a4d,
  beltCol: number = 0x2a2030
): HumanoidRig {
  const root = new THREE.Group();
  const body = new THREE.Group();
  body.scale.setScalar(scale);
  root.add(body);

  const hipY = 0.95;

  // LEFT LEG: Hip joint
  const legL = new THREE.Group();
  legL.position.set(-0.22, hipY, 0);
  const thighL = new THREE.Mesh(GEO.box, getLambert(legsCol));
  thighL.scale.set(0.28, 0.48, 0.28);
  thighL.position.set(0, -0.24, 0);
  legL.add(thighL);

  // Knee joint
  const shinL = new THREE.Group();
  shinL.position.set(0, -0.48, 0);
  const shinLM = new THREE.Mesh(GEO.box, getLambert(legsCol));
  shinLM.scale.set(0.25, 0.45, 0.25);
  shinLM.position.set(0, -0.22, 0);
  // Boot correctly positioned at foot
  const bootL = new THREE.Mesh(GEO.box, getLambert(beltCol));
  bootL.scale.set(0.3, 0.16, 0.38);
  bootL.position.set(0, -0.42, 0.06);
  shinL.add(shinLM, bootL);
  legL.add(shinL);
  body.add(legL);

  // RIGHT LEG: Hip joint
  const legR = new THREE.Group();
  legR.position.set(0.22, hipY, 0);
  const thighR = new THREE.Mesh(GEO.box, getLambert(legsCol));
  thighR.scale.set(0.28, 0.48, 0.28);
  thighR.position.set(0, -0.24, 0);
  legR.add(thighR);

  // Knee joint
  const shinR = new THREE.Group();
  shinR.position.set(0, -0.48, 0);
  const shinRM = new THREE.Mesh(GEO.box, getLambert(legsCol));
  shinRM.scale.set(0.25, 0.45, 0.25);
  shinRM.position.set(0, -0.22, 0);
  // Boot correctly positioned at foot
  const bootR = new THREE.Mesh(GEO.box, getLambert(beltCol));
  bootR.scale.set(0.3, 0.16, 0.38);
  bootR.position.set(0, -0.42, 0.06);
  shinR.add(shinRM, bootR);
  legR.add(shinR);
  body.add(legR);

  // TORSO: Waist joint at y = 0.95
  const torso = new THREE.Group();
  torso.position.set(0, hipY, 0);
  const belt = new THREE.Mesh(GEO.box, getLambert(beltCol));
  belt.scale.set(0.8, 0.16, 0.48);
  belt.position.set(0, 0.08, 0);

  const chestM = new THREE.Mesh(GEO.box, getLambert(bodyCol));
  chestM.scale.set(0.82, 0.75, 0.46);
  chestM.position.set(0, 0.48, 0);
  torso.add(belt, chestM);
  body.add(torso);

  // HEAD: Neck joint at y = 0.85 in torso space
  const head = new THREE.Group();
  head.position.set(0, 0.85, 0);
  const neckM = new THREE.Mesh(GEO.cyl, getLambert(skinCol));
  neckM.scale.set(0.16, 0.16, 0.16);
  neckM.position.set(0, 0.06, 0);

  const headM = new THREE.Mesh(GEO.box, getLambert(skinCol));
  headM.scale.set(0.5, 0.5, 0.48);
  headM.position.set(0, 0.34, 0);

  const eyeL = new THREE.Mesh(GEO.box, getLambert(0x1a202c));
  eyeL.scale.set(0.08, 0.06, 0.04);
  eyeL.position.set(-0.13, 0.35, 0.25);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.13;

  head.add(neckM, headM, eyeL, eyeR);
  torso.add(head);

  // LEFT ARM: Shoulder joint at (-0.52, 0.72, 0) in torso space
  const armL = new THREE.Group();
  armL.position.set(-0.52, 0.72, 0);
  const upAL = new THREE.Mesh(GEO.box, getLambert(bodyCol));
  upAL.scale.set(0.24, 0.44, 0.24);
  upAL.position.set(0, -0.22, 0);
  armL.add(upAL);

  const forearmL = new THREE.Group();
  forearmL.position.set(0, -0.44, 0);
  const loAL = new THREE.Mesh(GEO.box, getLambert(skinCol));
  loAL.scale.set(0.2, 0.38, 0.2);
  loAL.position.set(0, -0.19, 0);
  const handL = new THREE.Mesh(GEO.box, getLambert(skinCol));
  handL.scale.set(0.18, 0.14, 0.18);
  handL.position.set(0, -0.42, 0.02);
  forearmL.add(loAL, handL);

  const shieldHolder = new THREE.Group();
  shieldHolder.position.set(-0.12, -0.36, 0.1);
  forearmL.add(shieldHolder);

  armL.add(forearmL);
  torso.add(armL);

  // RIGHT ARM: Shoulder joint at (0.52, 0.72, 0) in torso space
  const armR = new THREE.Group();
  armR.position.set(0.52, 0.72, 0);
  const upAR = new THREE.Mesh(GEO.box, getLambert(bodyCol));
  upAR.scale.set(0.24, 0.44, 0.24);
  upAR.position.set(0, -0.22, 0);
  armR.add(upAR);

  const forearmR = new THREE.Group();
  forearmR.position.set(0, -0.44, 0);
  const loAR = new THREE.Mesh(GEO.box, getLambert(skinCol));
  loAR.scale.set(0.2, 0.38, 0.2);
  loAR.position.set(0, -0.19, 0);
  const handR = new THREE.Mesh(GEO.box, getLambert(skinCol));
  handR.scale.set(0.18, 0.14, 0.18);
  handR.position.set(0, -0.42, 0.02);
  forearmR.add(loAR, handR);

  const weaponHolder = new THREE.Group();
  weaponHolder.position.set(0, -0.42, 0.1);
  forearmR.add(weaponHolder);

  armR.add(forearmR);
  torso.add(armR);

  createShadowBlob(root, 0.65 * scale);

  const animate = (
    t: number,
    speed: number,
    attackProgress: number = 0,
    attackType: AttackAnimationType = 'slash_horizontal',
    isDashing: boolean = false
  ) => {
    const isMoving = speed > 0.1;

    if (isDashing) {
      // Dynamic evasive dodge roll / slide pose
      torso.rotation.x = 0.52;
      torso.position.y = hipY - 0.16;
      head.rotation.x = -0.35;
      armR.rotation.x = 0.65;
      armR.rotation.z = 0.25;
      armL.rotation.x = 0.65;
      armL.rotation.z = -0.25;
      forearmR.rotation.x = 0.5;
      forearmL.rotation.x = 0.5;
      legL.rotation.x = -0.7;
      legR.rotation.x = 0.7;
      shinL.rotation.x = 0.6;
      shinR.rotation.x = 0.2;
      body.position.y = -0.05;
      return;
    }

    if (attackProgress > 0) {
      const p = Math.min(1, Math.max(0, attackProgress));

      switch (attackType) {
        case 'slash_horizontal': {
          // Realistic horizontal sword sweep: arm pulls back right, then slashes wide across to left
          if (p < 0.32) {
            // Windup: coil torso right, raise right arm outward and back
            const k = p / 0.32;
            torso.rotation.y = -0.65 * k;
            torso.rotation.z = -0.08 * k;
            head.rotation.y = 0.3 * k;
            armR.rotation.x = -0.45 * k;
            armR.rotation.y = 0.6 * k;
            armR.rotation.z = 0.85 * k;
            forearmR.rotation.x = 0.85 * k;
            armL.rotation.x = 0.4 * k;
            armL.rotation.z = -0.3 * k;
          } else if (p < 0.68) {
            // Strike: whip torso across from right to left, arm sweeps wide arc
            const k = (p - 0.32) / 0.36;
            torso.rotation.y = -0.65 + 1.45 * k;
            torso.rotation.z = -0.08 + 0.16 * k;
            head.rotation.y = 0.3 - 0.55 * k;
            armR.rotation.x = -0.45 - 0.35 * Math.sin(k * Math.PI);
            armR.rotation.y = 0.6 - 1.5 * k;
            armR.rotation.z = 0.85 - 0.95 * k;
            forearmR.rotation.x = 0.85 - 0.75 * k;
            armL.rotation.x = 0.4 - 0.8 * k;
            armL.rotation.z = -0.3 - 0.3 * k;
          } else {
            // Recovery: follow-through settles back to ready stance
            const k = (p - 0.68) / 0.32;
            torso.rotation.y = 0.80 * (1 - k);
            torso.rotation.z = 0.08 * (1 - k);
            head.rotation.y = -0.25 * (1 - k);
            armR.rotation.x = (-0.45) * (1 - k) - 0.12 * k;
            armR.rotation.y = (-0.9) * (1 - k);
            armR.rotation.z = (-0.1) * (1 - k);
            forearmR.rotation.x = 0.1 * (1 - k);
            armL.rotation.x = (-0.4) * (1 - k) - 0.12 * k;
            armL.rotation.z = (-0.6) * (1 - k);
          }
          break;
        }

        case 'slash_vertical': {
          // Overhead heavy vertical chop: arm raises high above head, torso snaps downward
          if (p < 0.30) {
            // Windup: raise arm high above head, arch torso back
            const k = p / 0.30;
            torso.rotation.x = -0.28 * k;
            torso.position.y = hipY + 0.1 * k;
            armR.rotation.x = -2.4 * k;
            armR.rotation.y = 0.15 * k;
            armR.rotation.z = 0.2 * k;
            forearmR.rotation.x = 0.95 * k;
            armL.rotation.x = -1.8 * k;
            armL.rotation.z = 0.4 * k;
            forearmL.rotation.x = 0.85 * k;
          } else if (p < 0.66) {
            // Strike: powerful vertical chop down with full torso crunch
            const k = (p - 0.30) / 0.36;
            torso.rotation.x = -0.28 + 0.72 * k;
            torso.position.y = hipY + 0.1 - 0.18 * k;
            armR.rotation.x = -2.4 + 2.9 * k;
            armR.rotation.z = 0.2 - 0.25 * k;
            forearmR.rotation.x = 0.95 - 0.85 * k;
            armL.rotation.x = -1.8 + 2.3 * k;
            armL.rotation.z = 0.4 - 0.45 * k;
            forearmL.rotation.x = 0.85 - 0.75 * k;
          } else {
            // Recovery: rebound from ground impact
            const k = (p - 0.66) / 0.34;
            torso.rotation.x = 0.44 * (1 - k);
            torso.position.y = (hipY - 0.08) * (1 - k) + hipY * k;
            armR.rotation.x = 0.5 * (1 - k) - 0.12 * k;
            armR.rotation.z = -0.05 * (1 - k);
            forearmR.rotation.x = 0.1 * (1 - k);
            armL.rotation.x = 0.5 * (1 - k) - 0.12 * k;
            forearmL.rotation.x = 0.1 * (1 - k);
          }
          break;
        }

        case 'thrust': {
          // Piercing thrust / lunge: pull arm to side, explode straight forward
          if (p < 0.28) {
            // Windup: coil at hip, tilt blade forward
            const k = p / 0.28;
            torso.rotation.y = -0.3 * k;
            torso.rotation.x = 0.12 * k;
            torso.position.y = hipY - 0.06 * k;
            armR.position.z = -0.22 * k;
            armR.rotation.x = 0.15 * k;
            armR.rotation.z = 0.15 * k;
            forearmR.rotation.x = 1.45 * k;
            armL.rotation.x = -0.3 * k;
            armL.rotation.z = -0.3 * k;
          } else if (p < 0.65) {
            // Strike: explosive straight thrust along +Z forward
            const k = (p - 0.28) / 0.37;
            torso.rotation.y = -0.3 + 0.45 * k;
            torso.rotation.x = 0.12 + 0.26 * k;
            torso.position.z = 0.32 * k;
            armR.position.z = -0.22 + 0.58 * k;
            armR.rotation.x = 0.15 - 1.70 * k;
            armR.rotation.y = -0.15 * k;
            armR.rotation.z = 0.15 - 0.2 * k;
            forearmR.rotation.x = 1.45 - 1.45 * k;
            armL.rotation.x = -0.3 + 0.85 * k;
            armL.rotation.z = -0.3 - 0.35 * k;
          } else {
            // Recovery: retract blade smoothly
            const k = (p - 0.65) / 0.35;
            torso.position.z = 0.32 * (1 - k);
            torso.rotation.x = 0.38 * (1 - k);
            torso.rotation.y = 0.15 * (1 - k);
            torso.position.y = (hipY - 0.06) * (1 - k) + hipY * k;
            armR.position.z = 0.36 * (1 - k);
            armR.rotation.x = -1.55 * (1 - k) - 0.12 * k;
            armR.rotation.y = -0.15 * (1 - k);
            armL.rotation.x = 0.55 * (1 - k) - 0.12 * k;
          }
          break;
        }

        case 'mage_cast': {
          // Wizard staff thrust with distinct physical & magical recoil
          if (p < 0.32) {
            // Staff Extension: points staff directly forward at target
            const k = p / 0.32;
            armR.position.z = 0.28 * k;
            armR.rotation.x = -0.12 - 1.45 * k;
            armR.rotation.y = -0.12 * k;
            armR.rotation.z = -0.1 * k;
            forearmR.rotation.x = 0.05 * k;
            torso.rotation.x = 0.14 * k;
            torso.rotation.y = -0.12 * k;
            armL.rotation.x = -0.75 * k;
            armL.rotation.z = -0.55 * k;
            forearmL.rotation.x = 0.65 * k;
          } else if (p < 0.68) {
            // Discharge & Recoil: staff tip kicks upward, torso jolts back
            const k = (p - 0.32) / 0.36;
            torso.rotation.x = 0.14 - 0.42 * Math.sin(k * Math.PI);
            torso.position.z = -0.16 * Math.sin(k * Math.PI);
            armR.rotation.x = -1.57 - 0.55 * Math.sin(k * Math.PI);
            armR.rotation.z = -0.1 + 0.35 * Math.sin(k * Math.PI);
            armR.position.z = 0.28 - 0.38 * Math.sin(k * Math.PI);
            forearmR.rotation.x = 0.05 + 0.5 * Math.sin(k * Math.PI);
            armL.rotation.x = -0.75 + 0.6 * Math.sin(k * Math.PI);
            armL.rotation.z = -0.55 - 0.3 * Math.sin(k * Math.PI);
            head.rotation.x = -0.22 * Math.sin(k * Math.PI);
          } else {
            // Settle: staff and body return to ready posture
            const k = (p - 0.68) / 0.32;
            armR.position.z = 0.28 * (1 - k);
            armR.rotation.x = -1.57 * (1 - k) - 0.12 * k;
            armR.rotation.y = -0.12 * (1 - k);
            armR.rotation.z = -0.1 * (1 - k);
            forearmR.rotation.x = 0.05 * (1 - k);
            torso.rotation.x = 0.14 * (1 - k);
            torso.rotation.y = -0.12 * (1 - k);
            armL.rotation.x = -0.75 * (1 - k) - 0.12 * k;
            armL.rotation.z = -0.55 * (1 - k);
            forearmL.rotation.x = 0.65 * (1 - k);
          }
          break;
        }

        case 'whirlwind': {
          // Fighter 720-degree spin with greatsword horizontal
          armR.rotation.x = -1.55;
          armR.rotation.z = 0.85;
          armL.rotation.x = -1.55;
          armL.rotation.z = -0.85;
          forearmR.rotation.x = 0.0;
          forearmL.rotation.x = 0.0;
          torso.rotation.y = p * Math.PI * 4; // 2 full 360 spins!
          body.position.y = Math.abs(Math.sin(p * Math.PI * 4)) * 0.08;
          break;
        }

        case 'smite_cast': {
          // Paladin raises sword skyward with both hands into celestial light
          armR.rotation.x = -2.55;
          armR.rotation.z = 0.22;
          armL.rotation.x = -2.4;
          armL.rotation.z = -0.22;
          forearmR.rotation.x = 0.55;
          forearmL.rotation.x = 0.55;
          torso.rotation.x = -0.25;
          head.rotation.x = -0.4;
          body.position.y = 0.06;
          break;
        }

        case 'fireball_cast': {
          // Wizard channels massive fireball overhead then hurls it down forward
          if (p < 0.45) {
            const k = p / 0.45;
            armR.position.z = 0.22 * k;
            armR.rotation.x = -0.3 - 2.1 * k;
            armL.rotation.x = -1.8 * k;
            armL.rotation.z = -0.45 * k;
            torso.rotation.x = -0.25 * k;
          } else {
            const k = (p - 0.45) / 0.55;
            armR.position.z = 0.22 + 0.2 * k;
            armR.rotation.x = -2.4 + 1.25 * k;
            armL.rotation.x = -1.8 + 1.2 * k;
            torso.rotation.x = -0.25 + 0.45 * k;
          }
          break;
        }

        case 'roar_buff': {
          // Roar / Second Wind / Divine prayer: arms flexed high, chest proud
          armR.rotation.x = -1.85;
          armR.rotation.z = 0.65;
          armL.rotation.x = -1.85;
          armL.rotation.z = -0.65;
          forearmR.rotation.x = 0.6;
          forearmL.rotation.x = 0.6;
          torso.rotation.x = -0.22;
          head.rotation.x = -0.35;
          break;
        }

        case 'sneak_attack': {
          // Rogue crossed twin daggers snapping wide outward
          if (p < 0.35) {
            const k = p / 0.35;
            armR.rotation.x = -1.4 * k;
            armR.rotation.z = -0.6 * k;
            armL.rotation.x = -1.4 * k;
            armL.rotation.z = 0.6 * k;
          } else {
            const k = (p - 0.35) / 0.65;
            armR.rotation.x = -1.4 + 0.3 * k;
            armR.rotation.z = -0.6 + 1.4 * k;
            armL.rotation.x = -1.4 + 0.3 * k;
            armL.rotation.z = 0.6 - 1.4 * k;
          }
          break;
        }

        case 'flamestrike': {
          // Cleric raises warhammer to heaven and slams down
          if (p < 0.45) {
            const k = p / 0.45;
            armR.rotation.x = -2.5 * k;
            armL.rotation.x = -1.6 * k;
            torso.rotation.x = -0.25 * k;
          } else {
            const k = (p - 0.45) / 0.55;
            armR.rotation.x = -2.5 + 2.9 * k;
            torso.rotation.x = -0.25 + 0.6 * k;
          }
          break;
        }

        case 'slam_down': {
          // Massive 2H overhead vertical ground slam
          if (p < 0.45) {
            const k = p / 0.45;
            armR.rotation.x = -0.3 - 2.5 * k;
            armL.rotation.x = -0.3 - 2.4 * k;
            armR.rotation.z = 0.2 * k;
            armL.rotation.z = -0.2 * k;
            torso.rotation.x = -0.3 * k;
            body.position.y = 0.08 * k;
          } else {
            const k = (p - 0.45) / 0.55;
            armR.rotation.x = -2.8 + 3.4 * k;
            armL.rotation.x = -2.7 + 3.3 * k;
            torso.rotation.x = -0.3 + 0.85 * k;
            body.position.y = 0.08 - 0.16 * k;
          }
          break;
        }

        case 'spin_360': {
          // Dual weapon rapid 360 spin
          armR.rotation.x = -1.55;
          armR.rotation.z = 0.85;
          armL.rotation.x = -1.55;
          armL.rotation.z = -0.85;
          forearmR.rotation.x = 0.0;
          forearmL.rotation.x = 0.0;
          torso.rotation.y = p * Math.PI * 2;
          body.position.y = Math.sin(p * Math.PI) * 0.06;
          break;
        }

        case 'bow_shot': {
          // Archery draw and release
          if (p < 0.55) {
            const k = p / 0.55;
            torso.rotation.y = 0.65 * k;
            armL.rotation.x = -1.57 * k;
            armL.rotation.y = 0.45 * k;
            armR.rotation.x = -1.50 * k;
            armR.rotation.y = 0.55 * k;
            forearmR.rotation.x = 1.35 * k;
            head.rotation.y = -0.6 * k;
          } else {
            const k = (p - 0.55) / 0.45;
            torso.rotation.y = 0.65 * (1 - k);
            armL.rotation.x = -1.57 * (1 - k);
            armR.rotation.x = -1.50 * (1 - k);
            forearmR.rotation.x = 1.35 * (1 - k);
            head.rotation.y = -0.6 * (1 - k);
          }
          break;
        }

        default: {
          // Clean generic fallback
          if (p < 0.35) {
            const k = p / 0.35;
            torso.rotation.y = -0.45 * k;
            armR.rotation.x = -0.4 - 1.4 * k;
            armR.rotation.z = 0.2 * k;
            forearmR.rotation.x = 0.4 * k;
            head.rotation.y = 0.2 * k;
          } else if (p < 0.7) {
            const k = (p - 0.35) / 0.35;
            torso.rotation.y = -0.45 + 0.9 * k;
            armR.rotation.x = -1.8 + 2.2 * k;
            armR.rotation.z = 0.2 - 0.5 * k;
            forearmR.rotation.x = 0.4 - 0.6 * k;
            head.rotation.y = 0.2 - 0.3 * k;
          } else {
            const k = (p - 0.7) / 0.3;
            torso.rotation.y = 0.45 * (1 - k);
            armR.rotation.x = 0.4 * (1 - k);
            armR.rotation.z = -0.3 * (1 - k);
            forearmR.rotation.x = -0.2 * (1 - k);
            head.rotation.y = -0.1 * (1 - k);
          }
          break;
        }
      }

      if (isMoving) {
        const freq = t * 10;
        const stride = Math.sin(freq);
        legL.rotation.x = stride * 0.7;
        legR.rotation.x = -stride * 0.7;
        shinL.rotation.x = Math.max(0, -stride) * 0.6;
        shinR.rotation.x = Math.max(0, stride) * 0.6;
        body.position.y = Math.abs(Math.sin(freq)) * 0.06;
      } else {
        legL.rotation.x *= 0.85;
        legR.rotation.x *= 0.85;
        shinL.rotation.x *= 0.85;
        shinR.rotation.x *= 0.85;
        body.position.y = 0;
      }
    } else {
      torso.rotation.y *= 0.8;
      torso.rotation.x *= 0.8;
      torso.rotation.z *= 0.8;
      torso.position.set(0, hipY, 0);
      armR.position.set(0.52, 0.72, 0);
      armL.position.set(-0.52, 0.72, 0);
      armR.rotation.y *= 0.8;
      armR.rotation.z *= 0.8;
      forearmR.rotation.y *= 0.8;
      forearmL.rotation.x *= 0.8;
      head.rotation.y *= 0.8;
      head.rotation.x *= 0.8;

      if (rig.isWizard) {
        // Natural wizard posture: forearm bent forward holding staff in front of body
        armR.rotation.x = -0.28;
        armR.rotation.z = -0.12;
        forearmR.rotation.x = 0.65;
        armL.rotation.x = -0.18;
        armL.rotation.z = -0.22;
        forearmL.rotation.x = 0.35;
      } else {
        forearmR.rotation.x *= 0.8;
      }

      if (isMoving) {
        const freq = t * 10;
        const stride = Math.sin(freq);
        legL.rotation.x = stride * 0.75;
        legR.rotation.x = -stride * 0.75;
        shinL.rotation.x = Math.max(0, -stride) * 0.55;
        shinR.rotation.x = Math.max(0, stride) * 0.55;
        if (rig.isWizard) {
          armR.rotation.x = -0.28 + stride * 0.08;
          armL.rotation.x = -0.18 - stride * 0.45;
        } else {
          armL.rotation.x = -stride * 0.55;
          armR.rotation.x = stride * 0.55;
        }
        body.position.y = Math.abs(Math.sin(freq)) * 0.06;
        torso.rotation.z = stride * 0.04;
      } else {
        const breathe = Math.sin(t * 2.2) * 0.02;
        body.position.y = breathe;
        legL.rotation.x *= 0.85;
        legR.rotation.x *= 0.85;
        shinL.rotation.x *= 0.85;
        shinR.rotation.x *= 0.85;
        if (!rig.isWizard) {
          armL.rotation.x = -0.12;
          armR.rotation.x = -0.12;
        }
        torso.rotation.z = breathe * 0.2;
      }
    }
  };

  // Gear visual groups for dynamic equipment display
  const gearHelmGroup = new THREE.Group();
  head.add(gearHelmGroup);

  const defaultHeadgearGroup = new THREE.Group();
  head.add(defaultHeadgearGroup);

  const gearArmorGroup = new THREE.Group();
  torso.add(gearArmorGroup);

  const updateGearVisuals = (equip: Partial<Record<ItemSlot, Item>>, classId: ClassId, subclassWeaponStyle?: WeaponStyle) => {
    // 1. WEAPON VISUAL
    weaponHolder.clear();
    shieldHolder.clear();

    const wItem = equip.weapon;
    const wRarity = wItem?.rarity || 'common';
    let bladeColor = 0xb8c4d8;
    let emissiveColor = 0x000000;
    if (wRarity === 'uncommon') { bladeColor = 0x44d98a; emissiveColor = 0x113322; }
    else if (wRarity === 'rare') { bladeColor = 0x44aaff; emissiveColor = 0x113366; }
    else if (wRarity === 'epic') { bladeColor = 0xb366ff; emissiveColor = 0x331155; }
    else if (wRarity === 'legendary') { bladeColor = 0xffa500; emissiveColor = 0x662200; }

    // Deduce effective weapon model
    let model: WeaponModelType = wItem?.modelType || 'sword';
    if (!wItem?.modelType) {
      if (subclassWeaponStyle === 'bow') model = 'bow';
      else if (subclassWeaponStyle === 'wand_tome') model = 'wand_tome';
      else if (subclassWeaponStyle === 'dual_swords') model = 'dual_swords';
      else if (subclassWeaponStyle === 'greatsword_2h') model = 'greatsword';
      else if (subclassWeaponStyle === 'dual_daggers') model = 'dual_daggers';
      else if (subclassWeaponStyle === 'staff_holy') model = 'staff_holy';
      else if (subclassWeaponStyle === 'staff_2h' || classId === 'wizard') model = 'staff';
      else if (subclassWeaponStyle === 'mace_shield' || classId === 'cleric') model = 'mace';
      else if (classId === 'fighter') model = 'greatsword';
      else if (classId === 'rogue') model = 'dual_daggers';
    }

    const goldMat = getLambert(0xffd700, 0x332200);
    const darkMetal = getLambert(0x282c34);
    const woodMat = getLambert(0x4a2e18);

    // Helpers to build shields
    const addShield = (type: 'crusader' | 'sun' | 'heater') => {
      const shieldGroup = new THREE.Group();
      if (type === 'sun') {
        const sun = new THREE.Mesh(GEO.cyl, getLambert(0xffa500, emissiveColor));
        sun.scale.set(0.48, 0.08, 0.48);
        sun.rotation.z = Math.PI / 2;
        const core = new THREE.Mesh(GEO.sph, goldMat);
        core.scale.setScalar(0.18);
        core.position.set(0.06, 0, 0);
        shieldGroup.add(sun, core);
      } else if (type === 'crusader') {
        const body = new THREE.Mesh(GEO.box, getLambert(0x1a263a));
        body.scale.set(0.08, 0.95, 0.62);
        const rim = new THREE.Mesh(GEO.box, goldMat);
        rim.scale.set(0.1, 0.98, 0.1);
        rim.position.set(0, 0, 0.31);
        const crossH = new THREE.Mesh(GEO.box, getLambert(0xffffff, bladeColor));
        crossH.scale.set(0.11, 0.16, 0.52);
        crossH.position.set(0, 0.1, 0);
        const crossV = new THREE.Mesh(GEO.box, getLambert(0xffffff, bladeColor));
        crossV.scale.set(0.11, 0.72, 0.16);
        crossV.position.set(0, 0, 0);
        shieldGroup.add(body, rim, crossH, crossV);
      } else {
        const heater = new THREE.Mesh(GEO.box, darkMetal);
        heater.scale.set(0.08, 0.85, 0.55);
        const rim = new THREE.Mesh(GEO.box, getLambert(bladeColor, emissiveColor));
        rim.scale.set(0.1, 0.88, 0.12);
        rim.position.set(0, 0, 0.27);
        shieldGroup.add(heater, rim);
      }
      shieldHolder.add(shieldGroup);
    };

    switch (model) {
      case 'axe': {
        const axe = new THREE.Group();
        const handle = new THREE.Mesh(GEO.cyl, woodMat);
        handle.scale.set(0.05, 1.4, 0.05);
        handle.position.set(0, 0.25, 0);
        // Brass grip bands
        for (let i = 0; i < 3; i++) {
          const band = new THREE.Mesh(GEO.cyl, goldMat);
          band.scale.set(0.056, 0.04, 0.056);
          band.position.set(0, -0.15 + i * 0.22, 0);
          axe.add(band);
        }
        // Bearded broad axe head
        const blade = new THREE.Mesh(GEO.box, getLambert(bladeColor, emissiveColor));
        blade.scale.set(0.08, 0.65, 0.44);
        blade.position.set(0, 0.72, 0.22);
        // Axe glowing rune inlay
        const rune = new THREE.Mesh(GEO.box, getBasic(bladeColor, 0.95, true));
        rune.scale.set(0.09, 0.4, 0.06);
        rune.position.set(0, 0.72, 0.24);
        // Back armor-piercing hook
        const hook = new THREE.Mesh(GEO.cone, darkMetal);
        hook.scale.set(0.08, 0.28, 0.08);
        hook.position.set(0, 0.75, -0.2);
        hook.rotation.x = -Math.PI / 2;
        // Top spike
        const spike = new THREE.Mesh(GEO.cone, goldMat);
        spike.scale.set(0.07, 0.32, 0.07);
        spike.position.set(0, 1.05, 0);
        axe.add(handle, blade, rune, hook, spike);
        axe.rotation.x = Math.PI / 2;
        weaponHolder.add(axe);
        addShield(classId === 'paladin' ? 'crusader' : (classId === 'cleric' ? 'sun' : 'heater'));
        break;
      }

      case 'greataxe': {
        const gAxe = new THREE.Group();
        const shaft = new THREE.Mesh(GEO.cyl, woodMat);
        shaft.scale.set(0.07, 2.2, 0.07);
        shaft.position.set(0, 0.5, 0);
        // Heavy socket with steel brackets
        const socket = new THREE.Mesh(GEO.box, darkMetal);
        socket.scale.set(0.24, 0.42, 0.24);
        socket.position.set(0, 1.25, 0);
        const socketRune = new THREE.Mesh(GEO.sph, getBasic(bladeColor, 0.95, true));
        socketRune.scale.setScalar(0.14);
        socketRune.position.set(0.12, 1.25, 0);
        // Massive double-crescent bearded blades
        const bladeL = new THREE.Mesh(GEO.box, getLambert(bladeColor, emissiveColor));
        bladeL.scale.set(0.08, 0.95, 0.58);
        bladeL.position.set(0, 1.25, 0.42);
        const bladeR = new THREE.Mesh(GEO.box, getLambert(bladeColor, emissiveColor));
        bladeR.scale.set(0.08, 0.95, 0.58);
        bladeR.position.set(0, 1.25, -0.42);
        // Jagged horns on outer edges
        const hornL = new THREE.Mesh(GEO.cone, goldMat);
        hornL.scale.set(0.08, 0.28, 0.08);
        hornL.position.set(0, 1.7, 0.65);
        hornL.rotation.z = -0.4;
        const hornR = new THREE.Mesh(GEO.cone, goldMat);
        hornR.scale.set(0.08, 0.28, 0.08);
        hornR.position.set(0, 1.7, -0.65);
        hornR.rotation.z = 0.4;
        // Colossal tip spear
        const topSpike = new THREE.Mesh(GEO.cone, goldMat);
        topSpike.scale.set(0.12, 0.52, 0.12);
        topSpike.position.set(0, 1.78, 0);
        gAxe.add(shaft, socket, socketRune, bladeL, bladeR, hornL, hornR, topSpike);
        gAxe.rotation.x = Math.PI / 2;
        weaponHolder.add(gAxe);
        break;
      }

      case 'greatsword': {
        const claymore = new THREE.Group();
        // Colossal blade with dual fuller
        const blade = new THREE.Mesh(GEO.box, getLambert(bladeColor, emissiveColor));
        blade.scale.set(0.22, 2.3, 0.06);
        blade.position.set(0, 1.15, 0);
        // Glowing inscribed rune channel along center of blade
        const fullerRune = new THREE.Mesh(GEO.box, getBasic(bladeColor, 0.95, true));
        fullerRune.scale.set(0.06, 1.7, 0.07);
        fullerRune.position.set(0, 1.15, 0);
        // Winged dragon guard
        const guard = new THREE.Mesh(GEO.box, goldMat);
        guard.scale.set(0.85, 0.14, 0.16);
        guard.position.set(0, 0.06, 0);
        const guardGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.09, 0), getBasic(bladeColor, 0.95, true));
        guardGem.position.set(0, 0.06, 0.09);
        // Two-handed leather grip with ring divider
        const handle = new THREE.Mesh(GEO.cyl, getLambert(0x1a1510));
        handle.scale.set(0.06, 0.62, 0.06);
        handle.position.set(0, -0.32, 0);
        const gripRing = new THREE.Mesh(GEO.cyl, goldMat);
        gripRing.scale.set(0.07, 0.04, 0.07);
        gripRing.position.set(0, -0.32, 0);
        // Heavy faceted diamond pommel
        const pommel = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0), goldMat);
        pommel.position.set(0, -0.66, 0);
        claymore.add(blade, fullerRune, guard, guardGem, handle, gripRing, pommel);
        claymore.rotation.x = Math.PI / 2;
        weaponHolder.add(claymore);
        break;
      }

      case 'dual_swords': {
        // Mainhand: Crimson Flame Sword
        const sw1 = new THREE.Group();
        const b1 = new THREE.Mesh(GEO.box, getLambert(0xff4433, 0x551100));
        b1.scale.set(0.11, 1.55, 0.05);
        b1.position.set(0, 0.78, 0);
        const rune1 = new THREE.Mesh(GEO.box, getBasic(0xffaa22, 0.95, true));
        rune1.scale.set(0.04, 1.1, 0.06);
        rune1.position.set(0, 0.78, 0);
        const g1 = new THREE.Mesh(GEO.box, goldMat);
        g1.scale.set(0.52, 0.09, 0.11);
        g1.position.set(0, 0.05, 0);
        sw1.add(b1, rune1, g1);
        sw1.rotation.x = Math.PI / 2;
        weaponHolder.add(sw1);

        // Offhand: Azure Frost Sword
        const sw2 = new THREE.Group();
        const b2 = new THREE.Mesh(GEO.box, getLambert(0x00d0ff, 0x003366));
        b2.scale.set(0.11, 1.55, 0.05);
        b2.position.set(0, 0.78, 0);
        const rune2 = new THREE.Mesh(GEO.box, getBasic(0x80e5ff, 0.95, true));
        rune2.scale.set(0.04, 1.1, 0.06);
        rune2.position.set(0, 0.78, 0);
        const g2 = new THREE.Mesh(GEO.box, darkMetal);
        g2.scale.set(0.52, 0.09, 0.11);
        g2.position.set(0, 0.05, 0);
        sw2.add(b2, rune2, g2);
        sw2.rotation.x = Math.PI / 2;
        shieldHolder.add(sw2);
        break;
      }

      case 'dual_daggers': {
        const mkDagger = (glowColor: number) => {
          const d = new THREE.Group();
          // Curved stiletto blade
          const dBlade = new THREE.Mesh(GEO.box, getLambert(bladeColor, emissiveColor));
          dBlade.scale.set(0.07, 0.95, 0.04);
          dBlade.position.set(0, 0.48, 0);
          // Dripping poison/shadow edge
          const edge = new THREE.Mesh(GEO.box, getBasic(glowColor, 0.95, true));
          edge.scale.set(0.08, 0.75, 0.02);
          edge.position.set(0, 0.48, 0.02);
          // Serrated back
          for (let i = 0; i < 3; i++) {
            const barb = new THREE.Mesh(GEO.cone, darkMetal);
            barb.scale.set(0.04, 0.1, 0.04);
            barb.position.set(0, 0.35 + i * 0.18, -0.04);
            barb.rotation.x = -Math.PI / 3;
            d.add(barb);
          }
          const dGuard = new THREE.Mesh(GEO.box, darkMetal);
          dGuard.scale.set(0.28, 0.06, 0.09);
          const ringPommel = new THREE.Mesh(GEO.torus, goldMat);
          ringPommel.scale.set(0.07, 0.07, 0.02);
          ringPommel.position.set(0, -0.22, 0);
          d.add(dBlade, edge, dGuard, ringPommel);
          d.rotation.x = Math.PI / 2;
          return d;
        };
        weaponHolder.add(mkDagger(0x33ff77));
        shieldHolder.add(mkDagger(0xb366ff));
        break;
      }

      case 'bow': {
        // Left hand holds recurve composite bow
        const bow = new THREE.Group();
        const limbTop = new THREE.Mesh(GEO.cyl, woodMat);
        limbTop.scale.set(0.045, 0.85, 0.045);
        limbTop.position.set(0, 0.4, 0.14);
        limbTop.rotation.x = 0.38;
        const limbBot = new THREE.Mesh(GEO.cyl, woodMat);
        limbBot.scale.set(0.045, 0.85, 0.045);
        limbBot.position.set(0, -0.4, 0.14);
        limbBot.rotation.x = -0.38;
        // Gold bindings on tips
        const tipL = new THREE.Mesh(GEO.cone, goldMat);
        tipL.scale.set(0.06, 0.22, 0.06);
        tipL.position.set(0, 0.82, 0.3);
        tipL.rotation.x = 0.8;
        const tipR = tipL.clone();
        tipR.position.y = -0.82;
        tipR.rotation.x = -0.8;
        // Crystal riser
        const grip = new THREE.Mesh(GEO.box, getBasic(bladeColor, 0.9, true));
        grip.scale.set(0.07, 0.3, 0.07);
        // Taut glowing ethereal bowstring
        const string = new THREE.Mesh(GEO.cyl, getBasic(0x80e5ff, 0.95, true));
        string.scale.set(0.015, 1.55, 0.015);
        string.position.set(0, 0, 0.32);
        bow.add(limbTop, limbBot, tipL, tipR, grip, string);
        bow.rotation.y = Math.PI / 2;
        shieldHolder.add(bow);

        // Right hand holds radiant arrow with feathers
        const arrow = new THREE.Group();
        const shaft = new THREE.Mesh(GEO.cyl, woodMat);
        shaft.scale.set(0.03, 1.35, 0.03);
        shaft.position.set(0, 0.55, 0);
        const head = new THREE.Mesh(GEO.cone, getBasic(bladeColor, 0.95, true));
        head.scale.set(0.08, 0.26, 0.08);
        head.position.set(0, 1.25, 0);
        // Feather fletching
        const fletch = new THREE.Mesh(GEO.box, goldMat);
        fletch.scale.set(0.12, 0.2, 0.02);
        fletch.position.set(0, -0.05, 0);
        arrow.add(shaft, head, fletch);
        arrow.rotation.x = Math.PI / 2;
        weaponHolder.add(arrow);
        break;
      }

      case 'wand_tome': {
        // Right hand: crystal wand with floating spinning shard
        const wand = new THREE.Group();
        const rod = new THREE.Mesh(GEO.cyl, woodMat);
        rod.scale.set(0.04, 1.1, 0.04);
        rod.position.set(0, 0.4, 0);
        const collar = new THREE.Mesh(GEO.torus, goldMat);
        collar.scale.set(0.08, 0.08, 0.03);
        collar.position.set(0, 0.95, 0);
        const crystalTip = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), getBasic(bladeColor, 0.95, true));
        crystalTip.position.set(0, 1.1, 0);
        wand.add(rod, collar, crystalTip);
        wand.rotation.x = Math.PI / 2;
        weaponHolder.add(wand);

        // Left hand: open glowing arcane tome with floating magical rune
        const tome = new THREE.Group();
        const cover = new THREE.Mesh(GEO.box, getLambert(0x3a1528, 0x110510));
        cover.scale.set(0.56, 0.72, 0.06);
        const pages = new THREE.Mesh(GEO.box, getLambert(0xfff8e7, emissiveColor));
        pages.scale.set(0.52, 0.66, 0.12);
        pages.position.set(0, 0, 0.07);
        // Floating 3D glowing rune hovering above open book
        const runeGlyph = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0), getBasic(bladeColor, 0.95, true));
        runeGlyph.position.set(0, 0, 0.28);
        tome.add(cover, pages, runeGlyph);
        tome.position.set(0.14, 0, 0.08);
        tome.rotation.x = 0.45;
        tome.rotation.y = -0.35;
        shieldHolder.add(tome);
        break;
      }

      case 'staff_holy': {
        const staff = new THREE.Group();
        const rod = new THREE.Mesh(GEO.cyl, woodMat);
        rod.scale.set(0.065, 2.05, 0.065);
        rod.position.set(0, 0.35, 0);
        // Sunburst Solar Cross Headpiece
        const crossH = new THREE.Mesh(GEO.box, goldMat);
        crossH.scale.set(0.48, 0.12, 0.1);
        crossH.position.set(0, 1.42, 0);
        const crossV = new THREE.Mesh(GEO.box, goldMat);
        crossV.scale.set(0.12, 0.65, 0.1);
        crossV.position.set(0, 1.45, 0);
        // Radiant solar halo
        const halo = new THREE.Mesh(GEO.torus, getBasic(0xffea00, 0.95, true));
        halo.scale.set(0.32, 0.32, 0.04);
        halo.position.set(0, 1.45, 0);
        const sunCore = new THREE.Mesh(GEO.sph, getBasic(0xffffff, 0.95, true));
        sunCore.scale.setScalar(0.12);
        sunCore.position.set(0, 1.45, 0);
        staff.add(rod, crossH, crossV, halo, sunCore);
        staff.position.set(0.06, -0.02, 0.08);
        staff.rotation.x = 0.22;
        weaponHolder.add(staff);
        break;
      }

      case 'staff': {
        const staff = new THREE.Group();
        const rod = new THREE.Mesh(GEO.cyl, woodMat);
        rod.scale.set(0.06, 2.05, 0.06);
        rod.position.set(0, 0.35, 0);
        // Crown socket
        const crown = new THREE.Mesh(GEO.cyl, goldMat);
        crown.scale.set(0.14, 0.18, 0.14);
        crown.position.set(0, 1.35, 0);
        // Giant floating prismatic crystal shard
        const crystalShard = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), getBasic(bladeColor, 0.95, true));
        crystalShard.scale.set(0.7, 1.8, 0.7);
        crystalShard.position.set(0, 1.55, 0);
        // Orbiting glowing rune ring
        const ring = new THREE.Mesh(GEO.torus, getBasic(bladeColor, 0.8, true));
        ring.scale.set(0.34, 0.34, 0.03);
        ring.rotation.x = Math.PI / 3;
        ring.position.set(0, 1.55, 0);
        staff.add(rod, crown, crystalShard, ring);
        staff.position.set(0.06, -0.02, 0.08);
        staff.rotation.x = 0.22;
        staff.rotation.z = -0.1;
        weaponHolder.add(staff);
        break;
      }

      case 'hammer': {
        const hammer = new THREE.Group();
        const shaft = new THREE.Mesh(GEO.cyl, woodMat);
        shaft.scale.set(0.07, 1.8, 0.07);
        shaft.position.set(0, 0.35, 0);
        // Colossal dwarven maul head with engraved gold runes
        const hHead = new THREE.Mesh(GEO.box, getLambert(bladeColor, emissiveColor));
        hHead.scale.set(0.65, 0.44, 0.44);
        hHead.position.set(0, 1.25, 0);
        const anvilRuneL = new THREE.Mesh(GEO.box, getBasic(bladeColor, 0.95, true));
        anvilRuneL.scale.set(0.67, 0.2, 0.2);
        anvilRuneL.position.set(0, 1.25, 0);
        const backSpike = new THREE.Mesh(GEO.cone, goldMat);
        backSpike.scale.set(0.14, 0.42, 0.14);
        backSpike.position.set(0, 1.25, -0.38);
        backSpike.rotation.x = -Math.PI / 2;
        hammer.add(shaft, hHead, anvilRuneL, backSpike);
        hammer.rotation.x = Math.PI / 2;
        weaponHolder.add(hammer);
        break;
      }

      case 'mace': {
        const mace = new THREE.Group();
        const shaft = new THREE.Mesh(GEO.cyl, darkMetal);
        shaft.scale.set(0.06, 1.4, 0.06);
        shaft.position.set(0, 0.25, 0);
        const head = new THREE.Mesh(GEO.sph, getLambert(bladeColor, emissiveColor));
        head.scale.setScalar(0.26);
        head.position.set(0, 0.95, 0);
        // 6 flanged steel blades around head
        for (let i = 0; i < 4; i++) {
          const angle = (i * Math.PI) / 2;
          const fl = new THREE.Mesh(GEO.box, goldMat);
          fl.scale.set(0.1, 0.32, 0.46);
          fl.rotation.y = angle;
          fl.position.set(0, 0.95, 0);
          mace.add(fl);
        }
        const topSpike = new THREE.Mesh(GEO.cone, getBasic(bladeColor, 0.95, true));
        topSpike.scale.set(0.08, 0.28, 0.08);
        topSpike.position.set(0, 1.25, 0);
        mace.add(shaft, head, topSpike);
        mace.rotation.x = Math.PI / 2;
        weaponHolder.add(mace);
        addShield(classId === 'cleric' ? 'sun' : 'heater');
        break;
      }

      default: { // 'sword'
        const sword = new THREE.Group();
        const blade = new THREE.Mesh(GEO.box, getLambert(bladeColor, emissiveColor));
        blade.scale.set(0.12, 1.55, 0.05);
        blade.position.set(0, 0.78, 0);
        const rune = new THREE.Mesh(GEO.box, getBasic(bladeColor, 0.95, true));
        rune.scale.set(0.04, 1.15, 0.06);
        rune.position.set(0, 0.78, 0);
        const guard = new THREE.Mesh(GEO.box, goldMat);
        guard.scale.set(0.58, 0.1, 0.12);
        guard.position.set(0, 0.06, 0);
        const pommel = new THREE.Mesh(new THREE.OctahedronGeometry(0.09, 0), goldMat);
        pommel.position.set(0, -0.22, 0);
        sword.add(blade, rune, guard, pommel);
        sword.rotation.x = Math.PI / 2;
        weaponHolder.add(sword);
        addShield(classId === 'paladin' ? 'crusader' : 'heater');
        break;
      }
    }

    // 2. HELM VISUAL
    gearHelmGroup.clear();
    const hItem = equip.helm;
    if (hItem) {
      defaultHeadgearGroup.visible = false;
      gearHelmGroup.visible = true;

      const hRarity = hItem.rarity || 'common';
      let helmColor = 0x6a7585;
      let crestColor = 0xffd700;
      if (hRarity === 'uncommon') { helmColor = 0x446655; crestColor = 0x44d98a; }
      else if (hRarity === 'rare') { helmColor = 0x3a557a; crestColor = 0x44aaff; }
      else if (hRarity === 'epic') { helmColor = 0x4a2a6a; crestColor = 0xb366ff; }
      else if (hRarity === 'legendary') { helmColor = 0x8a5522; crestColor = 0xffa500; }

      const hType: HelmModelType = hItem.helmType || (classId === 'wizard' ? 'mage_hat' : (classId === 'rogue' ? 'assassin_hood' : 'knight_helm'));

      if (hType === 'horned_helm') {
        const skullcap = new THREE.Mesh(GEO.sph, getLambert(helmColor));
        skullcap.scale.set(0.58, 0.42, 0.58);
        skullcap.position.set(0, 0.38, 0);
        const hornL = new THREE.Mesh(GEO.cone, goldMat);
        hornL.scale.set(0.12, 0.55, 0.12);
        hornL.position.set(-0.35, 0.48, 0.05);
        hornL.rotation.z = 0.55;
        hornL.rotation.x = -0.25;
        const hornR = new THREE.Mesh(GEO.cone, goldMat);
        hornR.scale.set(0.12, 0.55, 0.12);
        hornR.position.set(0.35, 0.48, 0.05);
        hornR.rotation.z = -0.55;
        hornR.rotation.x = -0.25;
        gearHelmGroup.add(skullcap, hornL, hornR);
      } else if (hType === 'crown') {
        const band = new THREE.Mesh(GEO.tube, goldMat);
        band.scale.set(0.56, 0.22, 0.56);
        band.position.set(0, 0.44, 0);
        const gem = new THREE.Mesh(GEO.sph, getLambert(crestColor, crestColor));
        gem.scale.setScalar(0.14);
        gem.position.set(0, 0.55, 0.28);
        gearHelmGroup.add(band, gem);
      } else if (hType === 'mage_hat') {
        const brim = new THREE.Mesh(GEO.cyl, getLambert(helmColor));
        brim.scale.set(0.72, 0.06, 0.72);
        brim.position.set(0, 0.58, 0);
        const cone = new THREE.Mesh(GEO.cone, getLambert(helmColor));
        cone.scale.set(0.44, 1.15, 0.44);
        cone.position.set(0, 1.18, -0.05);
        cone.rotation.x = -0.15;
        const gem = new THREE.Mesh(GEO.sph, getLambert(crestColor, crestColor));
        gem.scale.setScalar(0.12);
        gem.position.set(0, 0.75, 0.26);
        gearHelmGroup.add(brim, cone, gem);
      } else if (hType === 'assassin_hood') {
        const hood = new THREE.Mesh(GEO.box, getLambert(helmColor));
        hood.scale.set(0.62, 0.56, 0.6);
        hood.position.set(0, 0.36, -0.02);
        const mask = new THREE.Mesh(GEO.box, getLambert(0x111116));
        mask.scale.set(0.5, 0.22, 0.22);
        mask.position.set(0, 0.2, 0.22);
        const eyes = new THREE.Mesh(GEO.box, getLambert(crestColor, crestColor));
        eyes.scale.set(0.35, 0.05, 0.05);
        eyes.position.set(0, 0.24, 0.32);
        gearHelmGroup.add(hood, mask, eyes);
      } else { // 'knight_helm'
        const helm = new THREE.Mesh(GEO.box, getLambert(helmColor));
        helm.scale.set(0.6, 0.48, 0.58);
        helm.position.set(0, 0.38, 0);
        const visor = new THREE.Mesh(GEO.box, getLambert(0x161820));
        visor.scale.set(0.44, 0.12, 0.1);
        visor.position.set(0, 0.35, 0.28);
        const plume = new THREE.Mesh(GEO.box, getLambert(crestColor, crestColor));
        plume.scale.set(0.09, 0.42, 0.52);
        plume.position.set(0, 0.65, 0.02);
        gearHelmGroup.add(helm, visor, plume);
      }
    } else {
      defaultHeadgearGroup.visible = true;
      gearHelmGroup.visible = false;
    }

    // 3. ARMOR / CHESTPLATE VISUAL
    gearArmorGroup.clear();
    const aItem = equip.armor;
    if (aItem) {
      const aRarity = aItem.rarity || 'common';
      let armorColor = 0x6e7888;
      let trimColor = 0x445060;
      if (aRarity === 'uncommon') { armorColor = 0x3d6850; trimColor = 0x44d98a; }
      else if (aRarity === 'rare') { armorColor = 0x335588; trimColor = 0x44aaff; }
      else if (aRarity === 'epic') { armorColor = 0x5a2d7a; trimColor = 0xb366ff; }
      else if (aRarity === 'legendary') { armorColor = 0x8a3818; trimColor = 0xffa500; }

      const aType: ArmorModelType = aItem.armorType || (classId === 'wizard' ? 'mage_robes' : (classId === 'rogue' ? 'leather_tunic' : 'heavy_plate'));

      if (aType === 'heavy_plate') {
        const plate = new THREE.Mesh(GEO.box, getLambert(armorColor));
        plate.scale.set(0.88, 0.82, 0.52);
        plate.position.set(0, 0.48, 0);
        const emblem = new THREE.Mesh(GEO.box, getLambert(trimColor, trimColor));
        emblem.scale.set(0.35, 0.35, 0.1);
        emblem.position.set(0, 0.54, 0.25);
        // Giant shoulder pauldrons
        const pauldronL = new THREE.Mesh(GEO.box, getLambert(armorColor));
        pauldronL.scale.set(0.36, 0.28, 0.42);
        pauldronL.position.set(-0.52, 0.82, 0);
        pauldronL.rotation.z = -0.25;
        const pauldronR = new THREE.Mesh(GEO.box, getLambert(armorColor));
        pauldronR.scale.set(0.36, 0.28, 0.42);
        pauldronR.position.set(0.52, 0.82, 0);
        pauldronR.rotation.z = 0.25;
        gearArmorGroup.add(plate, emblem, pauldronL, pauldronR);
      } else if (aType === 'leather_tunic') {
        const tunic = new THREE.Mesh(GEO.box, getLambert(0x4a2e18));
        tunic.scale.set(0.84, 0.78, 0.48);
        tunic.position.set(0, 0.48, 0);
        const strap1 = new THREE.Mesh(GEO.box, getLambert(0x22150c));
        strap1.scale.set(0.12, 0.88, 0.52);
        strap1.position.set(-0.12, 0.48, 0);
        strap1.rotation.z = 0.35;
        const strap2 = new THREE.Mesh(GEO.box, getLambert(0x22150c));
        strap2.scale.set(0.12, 0.88, 0.52);
        strap2.position.set(0.12, 0.48, 0);
        strap2.rotation.z = -0.35;
        const buckle = new THREE.Mesh(GEO.box, goldMat);
        buckle.scale.set(0.18, 0.14, 0.56);
        buckle.position.set(0, 0.48, 0);
        gearArmorGroup.add(tunic, strap1, strap2, buckle);
      } else if (aType === 'mage_robes') {
        const mantle = new THREE.Mesh(GEO.box, getLambert(armorColor));
        mantle.scale.set(0.86, 0.82, 0.48);
        mantle.position.set(0, 0.48, 0);
        const stole = new THREE.Mesh(GEO.box, getLambert(trimColor, trimColor));
        stole.scale.set(0.24, 0.85, 0.52);
        stole.position.set(0, 0.48, 0);
        const brooch = new THREE.Mesh(GEO.sph, goldMat);
        brooch.scale.setScalar(0.14);
        brooch.position.set(0, 0.76, 0.25);
        gearArmorGroup.add(mantle, stole, brooch);
      } else { // 'chainmail'
        const mail = new THREE.Mesh(GEO.box, getLambert(0x555e6a));
        mail.scale.set(0.85, 0.8, 0.5);
        mail.position.set(0, 0.48, 0);
        const tabard = new THREE.Mesh(GEO.box, getLambert(trimColor));
        tabard.scale.set(0.38, 0.82, 0.54);
        tabard.position.set(0, 0.48, 0);
        gearArmorGroup.add(mail, tabard);
      }
    }
  };

  const rig: HumanoidRig = {
    root,
    body,
    torso,
    head,
    armL,
    armR,
    forearmL,
    forearmR,
    legL,
    legR,
    shinL,
    shinR,
    weaponHolder,
    shieldHolder,
    gearHelmGroup,
    gearArmorGroup,
    defaultHeadgearGroup,
    isWizard: false,
    animate,
    updateGearVisuals
  };

  return rig;
}

// -------------------------------------------------------------
// Player Classes: Paladin, Wizard, Fighter, Rogue, Cleric
// -------------------------------------------------------------
export function buildPlayerModel(classId: ClassId): HumanoidRig {
  switch (classId) {
    case 'paladin': {
      const rig = buildHumanoid(0.88, 0xfad6b0, 0x8ca0b8, 0x4a5870, 0x2a3544);

      // Pauldrons correctly attached at shoulder joints!
      const pauldronL = new THREE.Mesh(GEO.box, getLambert(0xa0b4cc));
      pauldronL.scale.set(0.42, 0.2, 0.42);
      pauldronL.position.set(0, 0.05, 0);
      rig.armL.add(pauldronL);

      const pauldronR = new THREE.Mesh(GEO.box, getLambert(0xa0b4cc));
      pauldronR.scale.set(0.42, 0.2, 0.42);
      pauldronR.position.set(0, 0.05, 0);
      rig.armR.add(pauldronR);

      // Paladin Knight Helm
      const helm = new THREE.Mesh(GEO.box, getLambert(0xb0c4dc));
      helm.scale.set(0.56, 0.42, 0.54);
      helm.position.set(0, 0.36, 0);
      const visor = new THREE.Mesh(GEO.box, getLambert(0x1e2430));
      visor.scale.set(0.38, 0.09, 0.08);
      visor.position.set(0, 0.33, 0.26);
      const crest = new THREE.Mesh(GEO.box, getLambert(0xffd700, 0x332200));
      crest.scale.set(0.08, 0.32, 0.45);
      crest.position.set(0, 0.58, 0.02);
      rig.defaultHeadgearGroup.add(helm, visor, crest);

      // Radiant Sword
      const sword = new THREE.Group();
      const blade = new THREE.Mesh(GEO.box, getLambert(0xf0f6ff, 0x334466));
      blade.scale.set(0.1, 1.4, 0.05);
      blade.position.set(0, 0.7, 0);
      const guard = new THREE.Mesh(GEO.box, getLambert(0xffd700));
      guard.scale.set(0.5, 0.08, 0.1);
      guard.position.set(0, 0.05, 0);
      const pommel = new THREE.Mesh(GEO.sph, getLambert(0xffd700));
      pommel.scale.setScalar(0.08);
      pommel.position.set(0, -0.2, 0);
      sword.add(blade, guard, pommel);
      sword.rotation.x = Math.PI / 2;
      rig.weaponHolder.add(sword);

      // Paladin Shield
      const shield = new THREE.Mesh(GEO.box, getLambert(0x283858));
      shield.scale.set(0.08, 0.8, 0.55);
      const shieldRim = new THREE.Mesh(GEO.box, getLambert(0xffd700));
      shieldRim.scale.set(0.1, 0.84, 0.12);
      shieldRim.position.set(0, 0, 0.28);
      const shieldGroup = new THREE.Group();
      shieldGroup.add(shield, shieldRim);
      rig.shieldHolder.add(shieldGroup);

      return rig;
    }

    case 'wizard': {
      const rig = buildHumanoid(0.82, 0xfce0c4, 0x3a48a8, 0x22296a, 0x1c2255);
      rig.isWizard = true;

      // Wizard Hat
      const hatBrim = new THREE.Mesh(GEO.cyl, getLambert(0x1a265c));
      hatBrim.scale.set(0.68, 0.06, 0.68);
      hatBrim.position.set(0, 0.58, 0);
      const hatCone = new THREE.Mesh(GEO.cone, getLambert(0x24327a));
      hatCone.scale.set(0.42, 1.1, 0.42);
      hatCone.position.set(0, 1.15, -0.05);
      hatCone.rotation.x = -0.15;
      rig.defaultHeadgearGroup.add(hatBrim, hatCone);

      // Wizard Robe Skirt
      const robe = new THREE.Mesh(GEO.cyl, getLambert(0x2d3a8a));
      robe.scale.set(0.44, 0.65, 0.35);
      robe.position.set(0, -0.18, 0);
      rig.torso.add(robe);

      // Arcane Staff - Gripped naturally forward in hand, pointing upwards & forward, completely clear of shoulder!
      const staff = new THREE.Group();
      const rod = new THREE.Mesh(GEO.cyl, getLambert(0x5a3e26));
      rod.scale.set(0.055, 1.9, 0.055);
      rod.position.set(0, 0.32, 0); // Bottom extends to -0.63, top to +1.27

      const prongs = new THREE.Mesh(GEO.torus, getLambert(0xffd700));
      prongs.scale.set(0.18, 0.18, 0.04);
      prongs.rotation.x = Math.PI / 2;
      prongs.position.set(0, 1.25, 0);

      const orb = new THREE.Mesh(GEO.sph, getLambert(0x60d0ff, 0x1060cc));
      orb.scale.setScalar(0.22);
      orb.position.set(0, 1.32, 0);

      const ring = new THREE.Mesh(GEO.torus, getLambert(0x88ccff, 0x225599));
      ring.scale.set(0.26, 0.26, 0.03);
      ring.position.set(0, 1.32, 0);

      staff.add(rod, prongs, orb, ring);
      // Offset forward from palm and angle forward
      staff.position.set(0.06, -0.02, 0.08);
      staff.rotation.x = 0.22;
      staff.rotation.z = -0.1;
      rig.weaponHolder.add(staff);

      return rig;
    }

    case 'fighter': {
      const rig = buildHumanoid(0.92, 0xf5cfa6, 0x6e4a3c, 0x3d2b24, 0x2c1e18);

      // Horned Battle Helm
      const helm = new THREE.Mesh(GEO.box, getLambert(0x5c6470));
      helm.scale.set(0.58, 0.4, 0.56);
      helm.position.set(0, 0.35, 0);
      const hornL = new THREE.Mesh(GEO.cone, getLambert(0xded6c8));
      hornL.scale.set(0.1, 0.45, 0.1);
      hornL.position.set(-0.35, 0.55, 0);
      hornL.rotation.z = 0.55;
      const hornR = hornL.clone();
      hornR.position.x = 0.35;
      hornR.rotation.z = -0.55;
      rig.defaultHeadgearGroup.add(helm, hornL, hornR);

      // Massive Two-Handed Greatsword
      const claymore = new THREE.Group();
      const blade = new THREE.Mesh(GEO.box, getLambert(0xd8e8f8, 0x222222));
      blade.scale.set(0.18, 2.0, 0.06);
      blade.position.set(0, 1.0, 0);
      const guard = new THREE.Mesh(GEO.box, getLambert(0x4a3828));
      guard.scale.set(0.65, 0.1, 0.14);
      guard.position.set(0, 0.05, 0);
      const handle = new THREE.Mesh(GEO.cyl, getLambert(0x2a1c10));
      handle.scale.set(0.06, 0.5, 0.06);
      handle.position.set(0, -0.25, 0);
      claymore.add(blade, guard, handle);
      claymore.rotation.x = Math.PI / 2;
      rig.weaponHolder.add(claymore);

      return rig;
    }

    case 'rogue': {
      const rig = buildHumanoid(0.8, 0xebc49d, 0x253028, 0x182218, 0x101810);

      // Shadow Hood & Scarf
      const hood = new THREE.Mesh(GEO.box, getLambert(0x182218));
      hood.scale.set(0.6, 0.55, 0.58);
      hood.position.set(0, 0.35, -0.02);
      const mask = new THREE.Mesh(GEO.box, getLambert(0x0e140e));
      mask.scale.set(0.48, 0.22, 0.2);
      mask.position.set(0, 0.2, 0.22);
      rig.defaultHeadgearGroup.add(hood, mask);

      // Twin Assassin Daggers
      const mkDagger = () => {
        const d = new THREE.Group();
        const dBlade = new THREE.Mesh(GEO.box, getLambert(0xb8f0c8, 0x1a4428));
        dBlade.scale.set(0.07, 0.8, 0.04);
        dBlade.position.set(0, 0.4, 0);
        const dGuard = new THREE.Mesh(GEO.box, getLambert(0x1a261a));
        dGuard.scale.set(0.24, 0.05, 0.08);
        d.add(dBlade, dGuard);
        d.rotation.x = Math.PI / 2;
        return d;
      };

      rig.weaponHolder.add(mkDagger());
      rig.shieldHolder.add(mkDagger());

      return rig;
    }

    case 'cleric': {
      const rig = buildHumanoid(0.85, 0xfce0c4, 0x6e5c8e, 0x463860, 0x282038);

      // Holy Mitre with Solar Cross
      const mitre = new THREE.Mesh(GEO.cone, getLambert(0xfff5dc, 0x221100));
      mitre.scale.set(0.32, 0.65, 0.32);
      mitre.position.set(0, 0.75, 0);
      const halo = new THREE.Mesh(GEO.torus, getLambert(0xffd700, 0x442200));
      halo.scale.set(0.32, 0.32, 0.05);
      halo.position.set(0, 0.48, -0.15);
      halo.rotation.x = 0.2;
      rig.defaultHeadgearGroup.add(mitre, halo);

      // Radiant Warhammer
      const hammer = new THREE.Group();
      const shaft = new THREE.Mesh(GEO.cyl, getLambert(0x7a6248));
      shaft.scale.set(0.06, 1.4, 0.06);
      shaft.position.set(0, 0.2, 0);
      const hHead = new THREE.Mesh(GEO.box, getLambert(0xe0e8f0, 0x112233));
      hHead.scale.set(0.36, 0.26, 0.22);
      hHead.position.set(0, 0.9, 0);
      hammer.add(shaft, hHead);
      hammer.rotation.x = Math.PI / 2;
      rig.weaponHolder.add(hammer);

      // Sunburst Buckler
      const sunShield = new THREE.Mesh(GEO.cyl, getLambert(0xffa500, 0x441800));
      sunShield.scale.set(0.48, 0.06, 0.48);
      sunShield.rotation.z = Math.PI / 2;
      rig.shieldHolder.add(sunShield);

      return rig;
    }

    default:
      return buildHumanoid();
  }
}

// -------------------------------------------------------------
// Enemy Models: Correct Hierarchies for All 4 Zones & Bosses
// -------------------------------------------------------------
export function buildEnemyModel(type: EnemyType): EnemyModelRig {
  const root = new THREE.Group();

  switch (type) {
    case 'orc_warrior': {
      const rig = buildHumanoid(0.98, 0x5a8248, 0x4a3830, 0x2e2420, 0x1c1610);
      const tuskL = new THREE.Mesh(GEO.cone, getLambert(0xe8e2d4));
      tuskL.scale.set(0.05, 0.2, 0.05);
      tuskL.position.set(-0.14, 0.18, 0.26);
      tuskL.rotation.x = -0.5;
      const tuskR = tuskL.clone();
      tuskR.position.x = 0.14;
      rig.head.add(tuskL, tuskR);

      const axe = new THREE.Group();
      const axeH = new THREE.Mesh(GEO.cyl, getLambert(0x4a321e));
      axeH.scale.set(0.06, 1.3, 0.06);
      axeH.position.set(0, 0.25, 0);
      const axeHd = new THREE.Mesh(GEO.box, getLambert(0x787878));
      axeHd.scale.set(0.08, 0.45, 0.32);
      axeHd.position.set(0.18, 0.85, 0);
      axe.add(axeH, axeHd);
      axe.rotation.x = Math.PI / 2;
      rig.weaponHolder.add(axe);

      root.add(rig.root);
      return { root, update: (t: number, s: number, a: number = 0) => rig.animate(t, s, a) };
    }

    case 'orc_berserker': {
      const rig = buildHumanoid(1.06, 0x4e783c, 0x7a2818, 0x3d1410, 0x220b08);
      const mkAxe = () => {
        const a = new THREE.Group();
        const h = new THREE.Mesh(GEO.cyl, getLambert(0x3a2216));
        h.scale.set(0.06, 1.1, 0.06);
        h.position.set(0, 0.2, 0);
        const hd = new THREE.Mesh(GEO.box, getLambert(0x8e2b20));
        hd.scale.set(0.08, 0.38, 0.26);
        hd.position.set(0.15, 0.72, 0);
        a.add(h, hd);
        a.rotation.x = Math.PI / 2;
        return a;
      };
      rig.weaponHolder.add(mkAxe());
      rig.shieldHolder.add(mkAxe());

      const update = (t: number, speed: number, atk: number = 0) => {
        rig.animate(t, speed, atk);
        if (speed > 2.5) {
          rig.torso.rotation.x = 0.25;
        } else {
          rig.torso.rotation.x *= 0.8;
        }
      };
      root.add(rig.root);
      return { root, update };
    }

    case 'orc_shaman': {
      const rig = buildHumanoid(0.88, 0x628c50, 0x3e2248, 0x241428, 0x180c1a);
      rig.isWizard = true;
      const staff = new THREE.Group();
      const sRod = new THREE.Mesh(GEO.cyl, getLambert(0x2a1630));
      sRod.scale.set(0.06, 1.8, 0.06);
      sRod.position.set(0, 0.32, 0);
      const skull = new THREE.Mesh(GEO.box, getLambert(0xe2dacb));
      skull.scale.set(0.24, 0.24, 0.24);
      skull.position.set(0, 1.25, 0);
      const voidOrb = new THREE.Mesh(GEO.sph, getLambert(0x8800cc, 0x550088));
      voidOrb.scale.setScalar(0.18);
      voidOrb.position.set(0, 1.28, 0);
      staff.add(sRod, skull, voidOrb);
      staff.position.set(0.06, -0.02, 0.08);
      staff.rotation.x = 0.22;
      staff.rotation.z = -0.08;
      rig.weaponHolder.add(staff);

      const update = (t: number, speed: number, atk: number = 0) => {
        rig.animate(t, speed, atk, 'mage_cast');
      };
      root.add(rig.root);
      return { root, update };
    }

    case 'boss_grummak': {
      const rig = buildHumanoid(1.5, 0x426b30, 0x68241c, 0x34120e, 0x200a06);
      const helm = new THREE.Mesh(GEO.box, getLambert(0x38404a));
      helm.scale.set(0.68, 0.44, 0.65);
      helm.position.set(0, 0.4, 0);
      const hL = new THREE.Mesh(GEO.cone, getLambert(0xd8d0c0));
      hL.scale.set(0.12, 0.5, 0.12);
      hL.position.set(-0.4, 0.6, 0);
      hL.rotation.z = 0.6;
      const hR = hL.clone();
      hR.position.x = 0.4;
      hR.rotation.z = -0.6;
      rig.head.add(helm, hL, hR);

      const hammer = new THREE.Group();
      const hHandle = new THREE.Mesh(GEO.cyl, getLambert(0x3e2818));
      hHandle.scale.set(0.1, 2.2, 0.1);
      hHandle.position.set(0, 0.4, 0);
      const hBlock = new THREE.Mesh(GEO.box, getLambert(0x403838, 0x221111));
      hBlock.scale.set(0.6, 0.4, 0.45);
      hBlock.position.set(0, 1.5, 0);
      hammer.add(hHandle, hBlock);
      hammer.rotation.x = Math.PI / 2;
      rig.weaponHolder.add(hammer);

      const update = (t: number, speed: number, atk: number = 0) => {
        rig.animate(t, speed, 0);
        if (atk > 0) {
          const p = Math.min(1, Math.max(0, atk));
          if (p < 0.4) {
            const k = p / 0.4;
            rig.torso.rotation.x = -0.5 * k;
            rig.armR.rotation.x = -2.2 * k;
            rig.armL.rotation.x = -2.0 * k;
          } else {
            const k = (p - 0.4) / 0.6;
            rig.torso.rotation.x = -0.5 + 0.8 * k;
            rig.armR.rotation.x = -2.2 + 2.8 * k;
            rig.armL.rotation.x = -2.0 + 2.6 * k;
          }
        }
      };
      root.add(rig.root);
      return { root, update };
    }

    case 'elven_shadow': {
      const floatGroup = new THREE.Group();
      const body = new THREE.Mesh(GEO.cone, getBasic(0x0c2236, 0.82, true));
      body.scale.set(0.65, 1.8, 0.65);
      body.position.set(0, 1.1, 0);
      floatGroup.add(body);

      const hood = new THREE.Mesh(GEO.sph, getBasic(0x18364e, 0.9, true));
      hood.scale.set(0.5, 0.45, 0.5);
      hood.position.set(0, 2.15, 0);
      floatGroup.add(hood);

      const eyeL = new THREE.Mesh(GEO.sph, getBasic(0x00ffff));
      eyeL.scale.setScalar(0.08);
      eyeL.position.set(-0.13, 2.18, 0.22);
      const eyeR = eyeL.clone();
      eyeR.position.x = 0.13;
      floatGroup.add(eyeL, eyeR);

      const armL = new THREE.Group();
      armL.position.set(-0.48, 1.9, 0);
      const aLM = new THREE.Mesh(GEO.box, getBasic(0x00ffff, 0.5, true));
      aLM.scale.set(0.12, 0.7, 0.12);
      aLM.position.set(0, -0.35, 0.1);
      armL.add(aLM);
      floatGroup.add(armL);

      const armR = new THREE.Group();
      armR.position.set(0.48, 1.9, 0);
      const aRM = new THREE.Mesh(GEO.box, getBasic(0x00ffff, 0.5, true));
      aRM.scale.set(0.12, 0.7, 0.12);
      aRM.position.set(0, -0.35, 0.1);
      armR.add(aRM);
      floatGroup.add(armR);

      createShadowBlob(root, 0.55);
      root.add(floatGroup);

      const update = (t: number, _s: number, atk: number = 0) => {
        floatGroup.position.y = Math.sin(t * 3.5) * 0.12;
        body.rotation.y = Math.sin(t * 1.5) * 0.15;
        if (atk > 0) {
          armL.rotation.x = -Math.PI * 0.55 * atk;
          armR.rotation.x = -Math.PI * 0.55 * atk;
        } else {
          armL.rotation.x = Math.sin(t * 3.0) * 0.3;
          armR.rotation.x = -Math.sin(t * 3.0) * 0.3;
        }
      };
      return { root, update };
    }

    case 'corrupted_golem': {
      const golemGroup = new THREE.Group();

      const torso = new THREE.Group();
      torso.position.set(0, 1.8, 0);
      const torsoM = new THREE.Mesh(GEO.box, getLambert(0x546270));
      torsoM.scale.set(1.35, 1.15, 0.85);
      torso.add(torsoM);

      const core = new THREE.Mesh(GEO.sph, getBasic(0xff6600));
      core.scale.setScalar(0.16);
      core.position.set(0, 0.1, 0.44);
      torso.add(core);

      // Head is properly CHILD OF TORSO!
      const head = new THREE.Group();
      head.position.set(0, 0.82, 0);
      const headM = new THREE.Mesh(GEO.box, getLambert(0x3e4854));
      headM.scale.set(0.65, 0.55, 0.65);
      const eyeL = new THREE.Mesh(GEO.sph, getBasic(0xff6600));
      eyeL.scale.setScalar(0.1);
      eyeL.position.set(-0.16, 0.08, 0.34);
      const eyeR = eyeL.clone();
      eyeR.position.x = 0.16;
      head.add(headM, eyeL, eyeR);
      torso.add(head);

      const armL = new THREE.Group();
      armL.position.set(-0.85, 0.35, 0);
      const aLM = new THREE.Mesh(GEO.box, getLambert(0x606e7c));
      aLM.scale.set(0.42, 1.15, 0.42);
      aLM.position.set(0, -0.58, 0);
      armL.add(aLM);
      torso.add(armL);

      const armR = new THREE.Group();
      armR.position.set(0.85, 0.35, 0);
      const aRM = aLM.clone();
      armR.add(aRM);
      torso.add(armR);

      golemGroup.add(torso);

      const legL = new THREE.Group();
      legL.position.set(-0.4, 1.1, 0);
      const lgLM = new THREE.Mesh(GEO.box, getLambert(0x485462));
      lgLM.scale.set(0.42, 1.1, 0.42);
      lgLM.position.set(0, -0.55, 0);
      legL.add(lgLM);
      golemGroup.add(legL);

      const legR = new THREE.Group();
      legR.position.set(0.4, 1.1, 0);
      const lgRM = lgLM.clone();
      legR.add(lgRM);
      golemGroup.add(legR);

      createShadowBlob(root, 1.15);
      root.add(golemGroup);

      const update = (t: number, spd: number, atk: number = 0) => {
        if (spd > 0.1) {
          const f = t * 6.5;
          legL.rotation.x = Math.sin(f) * 0.6;
          legR.rotation.x = -Math.sin(f) * 0.6;
          torso.position.y = 1.8 + Math.abs(Math.sin(f)) * 0.08;
        } else {
          legL.rotation.x *= 0.85;
          legR.rotation.x *= 0.85;
          torso.position.y = 1.8;
        }

        if (atk > 0) {
          armR.rotation.x = -1.8 * atk;
          armL.rotation.x = -1.8 * atk;
        } else {
          armR.rotation.x *= 0.8;
          armL.rotation.x *= 0.8;
        }
      };
      return { root, update };
    }

    case 'spectral_archer': {
      const rig = buildHumanoid(0.85, 0xaad4e6, 0x1e4860, 0x122c3a, 0x0e1e28);
      const bow = new THREE.Group();
      const bowMesh = new THREE.Mesh(GEO.torus, getLambert(0x3dd8ec, 0x1466aa));
      bowMesh.scale.set(0.48, 0.65, 0.08);
      bowMesh.rotation.y = Math.PI / 2;
      bow.add(bowMesh);
      rig.weaponHolder.add(bow);

      const update = (t: number, spd: number, atk: number = 0) => {
        rig.animate(t, spd, 0);
        if (atk > 0) {
          rig.armL.rotation.x = -1.4;
          rig.armL.rotation.y = 0.3;
          rig.armR.rotation.x = -1.4;
          rig.armR.rotation.y = -0.7 + 0.7 * atk;
        }
      };
      root.add(rig.root);
      return { root, update };
    }

    case 'boss_vaeloria': {
      const rig = buildHumanoid(1.4, 0xb8e6f8, 0x1a354c, 0x0e1e2e, 0x08121c);
      const crown = new THREE.Mesh(GEO.cyl, getLambert(0x00ddff, 0x003355));
      crown.scale.set(0.48, 0.12, 0.48);
      crown.position.set(0, 0.75, 0);
      rig.head.add(crown);

      const update = (t: number, spd: number, atk: number = 0) => {
        rig.body.position.y = Math.sin(t * 3.0) * 0.12;
        rig.animate(t, spd, atk);
      };
      root.add(rig.root);
      return { root, update };
    }

    case 'marsh_troll':
    case 'boss_troll_warlord': {
      const isBoss = type === 'boss_troll_warlord';
      const scale = isBoss ? 1.5 : 1.1;
      const tG = new THREE.Group();
      tG.scale.setScalar(scale);

      const torso = new THREE.Group();
      torso.position.set(0, 1.8, 0);
      const tbody = new THREE.Mesh(GEO.box, getLambert(isBoss ? 0x284224 : 0x3d5c38));
      tbody.scale.set(1.45, 1.35, 1.0);
      torso.add(tbody);

      // Head is properly CHILD OF TORSO!
      const tHead = new THREE.Group();
      tHead.position.set(0, 0.85, 0.15);
      const headM = new THREE.Mesh(GEO.box, getLambert(isBoss ? 0x1e3018 : 0x2e472b));
      headM.scale.set(0.85, 0.78, 0.85);
      const tuskL = new THREE.Mesh(GEO.cone, getLambert(0xded098));
      tuskL.scale.set(0.08, 0.28, 0.08);
      tuskL.position.set(-0.24, -0.25, 0.44);
      tuskL.rotation.x = -0.4;
      const tuskR = tuskL.clone();
      tuskR.position.x = 0.24;
      tHead.add(headM, tuskL, tuskR);
      torso.add(tHead);

      const tAR = new THREE.Group();
      tAR.position.set(0.98, 0.45, 0);
      const tARM = new THREE.Mesh(GEO.box, getLambert(isBoss ? 0x284224 : 0x3d5c38));
      tARM.scale.set(0.48, 1.25, 0.48);
      tARM.position.set(0, -0.6, 0);
      const club = new THREE.Mesh(GEO.cyl, getLambert(0x4a3221));
      club.scale.set(0.24, 2.2, 0.24);
      club.position.set(0, -1.4, 0.25);
      club.rotation.x = 0.25;
      tAR.add(tARM, club);
      torso.add(tAR);

      const tAL = new THREE.Group();
      tAL.position.set(-0.98, 0.45, 0);
      const tALM = tARM.clone();
      tAL.add(tALM);
      torso.add(tAL);

      tG.add(torso);

      const tLL = new THREE.Group();
      tLL.position.set(-0.45, 1.15, 0);
      const tLLM = new THREE.Mesh(GEO.box, getLambert(isBoss ? 0x1e3018 : 0x2e472b));
      tLLM.scale.set(0.48, 1.15, 0.48);
      tLLM.position.set(0, -0.58, 0);
      tLL.add(tLLM);
      tG.add(tLL);

      const tLR = new THREE.Group();
      tLR.position.set(0.45, 1.15, 0);
      const tLRM = tLLM.clone();
      tLR.add(tLRM);
      tG.add(tLR);

      createShadowBlob(root, 1.3 * scale);
      root.add(tG);

      const update = (t: number, spd: number, atk: number = 0) => {
        if (spd > 0.1) {
          const f = t * 6.5;
          tLL.rotation.x = Math.sin(f) * 0.65;
          tLR.rotation.x = -Math.sin(f) * 0.65;
          torso.position.y = 1.8 + Math.abs(Math.sin(f)) * 0.12;
          tAL.rotation.x = Math.sin(f) * 0.35;
        } else {
          tLL.rotation.x *= 0.85;
          tLR.rotation.x *= 0.85;
          torso.position.y = 1.8;
        }

        if (atk > 0) {
          tAR.rotation.x = -Math.PI * 0.85 * atk;
          tHead.rotation.x = -0.25 * atk;
        } else {
          tAR.rotation.x *= 0.8;
          tHead.rotation.x *= 0.8;
        }
      };
      return { root, update };
    }

    case 'dire_beast': {
      const bG = new THREE.Group();

      const bBody = new THREE.Group();
      bBody.position.set(0, 0.82, 0);
      const bodyM = new THREE.Mesh(GEO.box, getLambert(0x2c2418));
      bodyM.scale.set(0.92, 0.7, 1.65);
      bBody.add(bodyM);

      // Neck and Head are CHILD OF BODY!
      const bNeck = new THREE.Group();
      bNeck.position.set(0, 0.15, 0.8);
      const headM = new THREE.Mesh(GEO.box, getLambert(0x3a3228));
      headM.scale.set(0.54, 0.46, 0.7);
      headM.position.set(0, 0.22, 0.45);
      const eyeL = new THREE.Mesh(GEO.sph, getBasic(0xff6600));
      eyeL.scale.setScalar(0.08);
      eyeL.position.set(-0.16, 0.3, 0.65);
      const eyeR = eyeL.clone();
      eyeR.position.x = 0.16;
      bNeck.add(headM, eyeL, eyeR);
      bBody.add(bNeck);

      const tail = new THREE.Group();
      tail.position.set(0, 0.1, -0.8);
      const tailM = new THREE.Mesh(GEO.cyl, getLambert(0x2c2418));
      tailM.scale.set(0.14, 0.85, 0.14);
      tailM.rotation.x = -0.55;
      tailM.position.set(0, 0.25, -0.3);
      tail.add(tailM);
      bBody.add(tail);

      bG.add(bBody);

      const mkLeg = (ox: number, oz: number) => {
        const lg = new THREE.Group();
        lg.position.set(ox, 0.6, oz);
        const up = new THREE.Mesh(GEO.box, getLambert(0x1e1a12));
        up.scale.set(0.22, 0.48, 0.22);
        up.position.set(0, -0.24, 0);
        const lo = new THREE.Mesh(GEO.box, getLambert(0x14120e));
        lo.scale.set(0.2, 0.45, 0.2);
        lo.position.set(0, -0.55, 0.04);
        lg.add(up, lo);
        return lg;
      };

      const lFL = mkLeg(-0.36, 0.58);
      const lFR = mkLeg(0.36, 0.58);
      const lBL = mkLeg(-0.36, -0.58);
      const lBR = mkLeg(0.36, -0.58);
      bG.add(lFL, lFR, lBL, lBR);

      createShadowBlob(root, 0.9);
      root.add(bG);

      const update = (t: number, spd: number, atk: number = 0) => {
        if (spd > 0.1) {
          const f = t * 12;
          const s = Math.sin(f);
          lFL.rotation.x = s * 0.8;
          lFR.rotation.x = -s * 0.8;
          lBL.rotation.x = -s * 0.8;
          lBR.rotation.x = s * 0.8;
          bBody.position.y = 0.82 + Math.abs(s) * 0.08;
          tail.rotation.x = Math.sin(f * 0.7) * 0.45;
        } else {
          [lFL, lFR, lBL, lBR].forEach(l => (l.rotation.x *= 0.85));
          bBody.position.y = 0.82 + Math.sin(t * 2.2) * 0.02;
          tail.rotation.x = Math.sin(t * 3.0) * 0.35;
        }

        if (atk > 0) {
          bNeck.rotation.x = -0.4 - 0.7 * atk;
        } else {
          bNeck.rotation.x *= 0.8;
        }
      };
      return { root, update };
    }

    case 'spore_spitter': {
      const sG = new THREE.Group();
      const base = new THREE.Mesh(GEO.cone, getLambert(0x567d36));
      base.scale.set(0.8, 1.5, 0.8);
      base.position.set(0, 0.75, 0);
      sG.add(base);

      const sac = new THREE.Mesh(GEO.sph, getLambert(0x6e9a3c));
      sac.scale.set(0.48, 0.44, 0.48);
      sac.position.set(0, 1.55, 0);
      sG.add(sac);

      const muzzle = new THREE.Mesh(GEO.cyl, getLambert(0x3e5c28));
      muzzle.scale.set(0.16, 0.28, 0.16);
      muzzle.rotation.x = Math.PI / 2;
      muzzle.position.set(0, 1.45, 0.48);
      sG.add(muzzle);

      createShadowBlob(root, 0.75);
      root.add(sG);

      const update = (t: number, _s: number, atk: number = 0) => {
        base.scale.y = 1.5 + Math.sin(t * 5.0) * 0.15;
        sac.scale.setScalar(0.46 + Math.sin(t * 3.5) * 0.05 + (atk ? 0.15 * atk : 0));
      };
      return { root, update };
    }

    case 'kobold_spearman': {
      const rig = buildHumanoid(0.68, 0x488a38, 0x5e4832, 0x3d2f20, 0x221b12);
      const spear = new THREE.Group();
      const spS = new THREE.Mesh(GEO.cyl, getLambert(0x7a6040));
      spS.scale.set(0.05, 2.0, 0.05);
      spS.position.set(0, 0.5, 0);
      const spT = new THREE.Mesh(GEO.cone, getLambert(0x909898));
      spT.scale.set(0.09, 0.35, 0.09);
      spT.position.set(0, 1.6, 0);
      spear.add(spS, spT);
      spear.rotation.x = Math.PI / 2;
      rig.weaponHolder.add(spear);

      root.add(rig.root);
      return { root, update: (t: number, s: number, a: number = 0) => rig.animate(t, s, a) };
    }

    case 'kobold_bomber': {
      const rig = buildHumanoid(0.68, 0x569944, 0x7a3228, 0x4a221a, 0x2a1410);
      const bomb = new THREE.Group();
      const bB = new THREE.Mesh(GEO.sph, getLambert(0xb82018, 0x330404));
      bB.scale.setScalar(0.32);
      bB.position.set(0, 0.25, 0.25);
      const fuse = new THREE.Mesh(GEO.cyl, getLambert(0x806020));
      fuse.scale.set(0.04, 0.25, 0.04);
      fuse.position.set(0, 0.52, 0.25);
      bomb.add(bB, fuse);
      rig.weaponHolder.add(bomb);

      root.add(rig.root);
      return { root, update: (t, s, a: number = 0) => rig.animate(t, s, a) };
    }

    case 'dragon_shaman': {
      const rig = buildHumanoid(0.75, 0x8a3828, 0x3e1410, 0x260c08, 0x180806);
      rig.isWizard = true;
      const totem = new THREE.Group();
      const rod = new THREE.Mesh(GEO.cyl, getLambert(0x300a06));
      rod.scale.set(0.06, 1.7, 0.06);
      rod.position.set(0, 0.32, 0);
      const orb = new THREE.Mesh(GEO.sph, getLambert(0xff6600, 0x441100));
      orb.scale.setScalar(0.2);
      orb.position.set(0, 1.22, 0);
      totem.add(rod, orb);
      totem.position.set(0.06, -0.02, 0.08);
      totem.rotation.x = 0.22;
      totem.rotation.z = -0.08;
      rig.weaponHolder.add(totem);

      const update = (t: number, spd: number, atk: number = 0) => {
        rig.animate(t, spd, atk, 'mage_cast');
      };
      root.add(rig.root);
      return { root, update };
    }

    case 'boss_dragon_vermithrax': {
      const dG = new THREE.Group();

      const dBody = new THREE.Group();
      dBody.position.set(0, 2.2, 0);
      const bodyM = new THREE.Mesh(GEO.box, getLambert(0x8a1c14, 0x1a0402));
      bodyM.scale.set(2.4, 2.0, 4.2);
      dBody.add(bodyM);

      // Neck, Head and Jaw ALL CHILDREN OF BODY!
      const neckPivot = new THREE.Group();
      neckPivot.position.set(0, 0.8, 2.0);
      const neckM = new THREE.Mesh(GEO.cyl, getLambert(0x781810));
      neckM.scale.set(0.8, 1.9, 0.8);
      neckM.rotation.x = 0.6;
      neckM.position.set(0, 0.75, 0.5);
      neckPivot.add(neckM);

      const headPivot = new THREE.Group();
      headPivot.position.set(0, 1.5, 1.7);
      const dSnout = new THREE.Mesh(GEO.box, getLambert(0x9e2017, 0x1a0000));
      dSnout.scale.set(1.1, 0.85, 1.8);
      headPivot.add(dSnout);

      // Opening/closing lower jaw
      const dJaw = new THREE.Group();
      dJaw.position.set(0, -0.35, 0.45);
      const jawM = new THREE.Mesh(GEO.box, getLambert(0x7a160d));
      jawM.scale.set(0.95, 0.35, 1.3);
      dJaw.add(jawM);
      headPivot.add(dJaw);

      // Glowing dragon eyes
      const eyeL = new THREE.Mesh(GEO.sph, getBasic(0xffea00));
      eyeL.scale.setScalar(0.2);
      eyeL.position.set(-0.55, 0.35, 0.45);
      const eyeR = eyeL.clone();
      eyeR.position.x = 0.55;
      headPivot.add(eyeL, eyeR);

      // Dragon Horns
      const hornL = new THREE.Mesh(GEO.cone, getLambert(0x2a0505));
      hornL.scale.set(0.18, 1.1, 0.18);
      hornL.position.set(-0.45, 0.7, -0.5);
      hornL.rotation.x = -0.55;
      const hornR = hornL.clone();
      hornR.position.x = 0.45;
      headPivot.add(hornL, hornR);

      neckPivot.add(headPivot);
      dBody.add(neckPivot);

      // Tail CHILD OF BODY
      const tailP = new THREE.Group();
      tailP.position.set(0, 0.2, -2.1);
      const tailM = new THREE.Mesh(GEO.cyl, getLambert(0x701510));
      tailM.scale.set(0.65, 3.4, 0.65);
      tailM.rotation.x = -0.4;
      tailM.position.set(0, 0, -1.2);
      tailP.add(tailM);
      dBody.add(tailP);

      // Dragon Wings ATTACHED TO BODY!
      const mkWing = (side: number) => {
        const wg = new THREE.Group();
        wg.position.set(side * 1.25, 0.8, 0.3);
        const wm = new THREE.Mesh(GEO.plane, getLambert(0x6e140d));
        wm.scale.set(4.0, 2.5, 1);
        wm.rotation.set(Math.PI / 2, side * 0.35, 0);
        wm.position.set(side * 1.5, 0, 0);
        const wb = new THREE.Mesh(GEO.cyl, getLambert(0x3e0a06));
        wb.scale.set(0.12, 3.6, 0.12);
        wb.rotation.z = side * -0.6;
        wb.position.set(side * 1.1, 0.3, 0);
        wg.add(wm, wb);
        return wg;
      };
      const wingL = mkWing(-1);
      const wingR = mkWing(1);
      dBody.add(wingL, wingR);

      dG.add(dBody);

      // 4 Dragon Legs
      const mkDLeg = (ox: number, oz: number) => {
        const lg = new THREE.Group();
        lg.position.set(ox, 1.5, oz);
        const up = new THREE.Mesh(GEO.box, getLambert(0x6e140d));
        up.scale.set(0.55, 1.4, 0.55);
        up.position.set(0, -0.7, 0);
        const lo = new THREE.Mesh(GEO.box, getLambert(0x5a1008));
        lo.scale.set(0.48, 1.1, 0.48);
        lo.position.set(0, -1.5, 0.15);
        lg.add(up, lo);
        return lg;
      };
      const dFL = mkDLeg(-1.15, 1.3);
      const dFR = mkDLeg(1.15, 1.3);
      const dBL = mkDLeg(-1.15, -1.3);
      const dBR = mkDLeg(1.15, -1.3);
      dG.add(dFL, dFR, dBL, dBR);

      createShadowBlob(root, 2.4);
      root.add(dG);

      const update = (t: number, spd: number, atk: number = 0) => {
        wingL.rotation.z = Math.sin(t * 2.8) * 0.25;
        wingR.rotation.z = -Math.sin(t * 2.8) * 0.25;
        dBody.position.y = 2.2 + Math.sin(t * 1.5) * 0.08;
        tailP.rotation.y = Math.sin(t * 2.0) * 0.35;

        if (spd > 0.1) {
          const f = t * 5;
          const s = Math.sin(f);
          dFL.rotation.x = s * 0.6;
          dFR.rotation.x = -s * 0.6;
          dBL.rotation.x = -s * 0.6;
          dBR.rotation.x = s * 0.6;
        } else {
          [dFL, dFR, dBL, dBR].forEach(l => (l.rotation.x *= 0.85));
        }

        if (atk > 0) {
          neckPivot.rotation.x = -0.5 * atk;
          headPivot.rotation.x = 0.4 * atk;
          dJaw.rotation.x = 0.8 * atk;
        } else {
          neckPivot.rotation.x *= 0.8;
          headPivot.rotation.x *= 0.8;
          dJaw.rotation.x *= 0.8;
        }
      };
      return { root, update };
    }

    default: {
      const rig = buildHumanoid(0.85);
      root.add(rig.root);
      return { root, update: (t: number, s: number, a: number = 0) => rig.animate(t, s, a) };
    }
  }
}

// -------------------------------------------------------------
// Interactive Props: Chest, Barrel, Pot, Shrine, Traps, Altar, Cage
// -------------------------------------------------------------
export function buildPropModel(type: DestructibleProp['type']): { root: THREE.Group } {
  const root = new THREE.Group();
  if (type === 'chest') {
    const base = new THREE.Mesh(GEO.box, getLambert(0x5a3a1c));
    base.scale.set(0.8, 0.55, 0.6);
    base.position.set(0, 0.28, 0);
    const lid = new THREE.Mesh(GEO.box, getLambert(0x6a4a28));
    lid.scale.set(0.84, 0.2, 0.64);
    lid.position.set(0, 0.66, 0);
    const lock = new THREE.Mesh(GEO.box, getLambert(0xffd700, 0x221100));
    lock.scale.set(0.14, 0.14, 0.06);
    lock.position.set(0, 0.52, 0.31);
    root.add(base, lid, lock);
  } else if (type === 'barrel') {
    const barrel = new THREE.Mesh(GEO.cyl, getLambert(0x4a3020));
    barrel.scale.set(0.42, 0.76, 0.42);
    barrel.position.set(0, 0.38, 0);
    const hoop = new THREE.Mesh(GEO.torus, getLambert(0x604010));
    hoop.scale.set(0.44, 0.44, 0.04);
    hoop.position.set(0, 0.62, 0);
    root.add(barrel, hoop);
  } else if (type === 'pot') {
    const pot = new THREE.Mesh(GEO.sph, getLambert(0x8a6040));
    pot.scale.set(0.46, 0.5, 0.46);
    pot.position.set(0, 0.28, 0);
    root.add(pot);
  } else if (type === 'table') {
    const woodMat = getLambert(0x533822);
    const top = new THREE.Mesh(GEO.box, woodMat);
    top.scale.set(1.3, 0.1, 0.8);
    top.position.set(0, 0.65, 0);
    root.add(top);

    const legMat = getLambert(0x3e2816);
    const legOffsets = [[-0.55, -0.3], [0.55, -0.3], [-0.55, 0.3], [0.55, 0.3]];
    for (const [lx, lz] of legOffsets) {
      const leg = new THREE.Mesh(GEO.box, legMat);
      leg.scale.set(0.1, 0.62, 0.1);
      leg.position.set(lx, 0.31, lz);
      root.add(leg);
    }
  } else if (type === 'chair') {
    const chairMat = getLambert(0x5a3e26);
    const seat = new THREE.Mesh(GEO.box, chairMat);
    seat.scale.set(0.5, 0.08, 0.5);
    seat.position.set(0, 0.42, 0);
    root.add(seat);

    const legMat = getLambert(0x422d1b);
    for (const [lx, lz] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) {
      const leg = new THREE.Mesh(GEO.box, legMat);
      leg.scale.set(0.08, 0.4, 0.08);
      leg.position.set(lx, 0.2, lz);
      root.add(leg);
    }
    const backL = new THREE.Mesh(GEO.box, legMat);
    backL.scale.set(0.07, 0.5, 0.07);
    backL.position.set(-0.2, 0.67, -0.2);
    const backR = backL.clone();
    backR.position.x = 0.2;
    const backBar = new THREE.Mesh(GEO.box, chairMat);
    backBar.scale.set(0.44, 0.14, 0.06);
    backBar.position.set(0, 0.82, -0.2);
    root.add(backL, backR, backBar);
  } else if (type === 'crate') {
    const crate = new THREE.Mesh(GEO.box, getLambert(0x6b4c2b));
    crate.scale.set(0.72, 0.72, 0.72);
    crate.position.set(0, 0.36, 0);
    const band = new THREE.Mesh(GEO.box, getLambert(0x2d241c));
    band.scale.set(0.74, 0.12, 0.74);
    band.position.set(0, 0.36, 0);
    root.add(crate, band);
  } else if (type === 'shrine') {
    const base = new THREE.Mesh(GEO.box, getLambert(0x4a3860));
    base.scale.set(0.9, 0.22, 0.9);
    base.position.set(0, 0.11, 0);
    const pillar = new THREE.Mesh(GEO.cyl, getLambert(0x6a5888));
    pillar.scale.set(0.38, 1.2, 0.38);
    pillar.position.set(0, 0.72, 0);
    const orb = new THREE.Mesh(GEO.sph, getLambert(0x00ffee, 0x008877));
    orb.scale.setScalar(0.22);
    orb.position.set(0, 1.68, 0);
    root.add(base, pillar, orb);
  } else if (type === 'teleport_pad') {
    // 3D Teleport Waypoint Shrine
    const dais = new THREE.Mesh(GEO.cyl, getLambert(0x181c26, 0x0a1018));
    dais.scale.set(1.9, 0.18, 1.9);
    dais.position.set(0, 0.09, 0);

    const runeRing = new THREE.Mesh(GEO.torus, getBasic(0x00e5ff, 0.8, true));
    runeRing.scale.set(1.65, 1.65, 0.04);
    runeRing.rotation.x = Math.PI / 2;
    runeRing.position.set(0, 0.20, 0);

    const beacon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 4.0, 16, 1, true),
      getBasic(0x00e5ff, 0.22, true)
    );
    beacon.position.set(0, 2.0, 0);

    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI * 2) / 4;
      const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), getBasic(0x33ffff, 0.9, true));
      crystal.scale.set(0.6, 1.6, 0.6);
      crystal.position.set(Math.cos(angle) * 1.45, 0.95, Math.sin(angle) * 1.45);
      crystal.rotation.y = angle;
      crystal.rotation.z = 0.2;
      root.add(crystal);
    }
    root.add(dais, runeRing, beacon);
  } else if (type === 'shop_counter') {
    // 3D Merchant Stall & Merchant NPC
    const stall = new THREE.Group();
    const desk = new THREE.Mesh(GEO.box, getLambert(0x3e2816));
    desk.scale.set(2.4, 0.85, 0.8);
    desk.position.set(0, 0.42, 0);

    const postMat = getLambert(0x281a10);
    const postL = new THREE.Mesh(GEO.cyl, postMat);
    postL.scale.set(0.06, 2.3, 0.06);
    postL.position.set(-1.1, 1.15, -0.35);
    const postR = postL.clone();
    postR.position.x = 1.1;

    const roof = new THREE.Mesh(GEO.box, getLambert(0x9e2a2b, 0x441111));
    roof.scale.set(2.6, 0.12, 1.2);
    roof.position.set(0, 2.3, -0.1);
    roof.rotation.x = 0.15;

    const lantern = new THREE.Mesh(GEO.box, getBasic(0xffcc44, 0.9, true));
    lantern.scale.set(0.18, 0.24, 0.18);
    lantern.position.set(0, 2.0, 0.1);

    const potR = new THREE.Mesh(GEO.sph, getBasic(0xff3355, 0.9, true));
    potR.scale.setScalar(0.15);
    potR.position.set(-0.6, 0.92, 0.1);
    const potB = new THREE.Mesh(GEO.sph, getBasic(0x33aaff, 0.9, true));
    potB.scale.setScalar(0.15);
    potB.position.set(-0.3, 0.92, 0.1);

    const npc = new THREE.Group();
    const robe = new THREE.Mesh(GEO.cyl, getLambert(0x252a34));
    robe.scale.set(0.38, 1.2, 0.38);
    robe.position.set(0, 0.6, -0.65);
    const hood = new THREE.Mesh(GEO.sph, getLambert(0x181a20));
    hood.scale.set(0.28, 0.32, 0.28);
    hood.position.set(0, 1.35, -0.65);
    const eyes = new THREE.Mesh(GEO.box, getBasic(0xffdd44, 0.95, true));
    eyes.scale.set(0.16, 0.04, 0.04);
    eyes.position.set(0, 1.34, -0.48);
    npc.add(robe, hood, eyes);

    stall.add(desk, postL, postR, roof, lantern, potR, potB, npc);
    root.add(stall);
  } else if (type === 'skill_crucible') {
    // 3D Altare della Maestria delle Abilità (Skill Augments Crucible)
    const dais = new THREE.Mesh(GEO.cyl, getLambert(0x1a1528, 0x221133));
    dais.scale.set(1.5, 0.35, 1.5);
    dais.position.set(0, 0.17, 0);

    const basin = new THREE.Mesh(GEO.cyl, getLambert(0xffd700, 0x443300));
    basin.scale.set(1.1, 0.5, 1.1);
    basin.position.set(0, 0.55, 0);

    const flameOrb = new THREE.Mesh(GEO.sph, getBasic(0xb366ff, 0.85, true));
    flameOrb.scale.set(0.55, 0.45, 0.55);
    flameOrb.position.set(0, 0.88, 0);

    const crystalColors = [0xff4433, 0x00e5ff, 0xffd700];
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), getBasic(crystalColors[i], 0.95, true));
      crystal.scale.set(0.65, 1.4, 0.65);
      crystal.position.set(Math.cos(angle) * 0.9, 1.45, Math.sin(angle) * 0.9);
      root.add(crystal);
    }

    const lightPillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, 4.0, 16, 1, true),
      getBasic(0xbb55ff, 0.22, true)
    );
    lightPillar.position.set(0, 2.2, 0);

    root.add(dais, basin, flameOrb, lightPillar);
  } else if (type === 'explosive_barrel') {
    const barrel = new THREE.Mesh(GEO.cyl, getLambert(0xc91f37, 0x440a10));
    barrel.scale.set(0.44, 0.8, 0.44);
    barrel.position.set(0, 0.4, 0);

    const band = new THREE.Mesh(GEO.cyl, getLambert(0xffd700, 0x443300));
    band.scale.set(0.46, 0.16, 0.46);
    band.position.set(0, 0.4, 0);

    const fuse = new THREE.Mesh(GEO.cyl, getBasic(0xff5500, 0.9, true));
    fuse.scale.set(0.04, 0.18, 0.04);
    fuse.position.set(0, 0.88, 0);

    const spark = new THREE.Mesh(GEO.sph, getBasic(0xffee33, 0.95, true));
    spark.scale.setScalar(0.08);
    spark.position.set(0, 0.98, 0);

    root.add(barrel, band, fuse, spark);
  } else if (type === 'toxic_barrel') {
    const barrel = new THREE.Mesh(GEO.cyl, getLambert(0x1e3a1e, 0x0a1f0a));
    barrel.scale.set(0.44, 0.8, 0.44);
    barrel.position.set(0, 0.4, 0);

    const slime = new THREE.Mesh(GEO.sph, getBasic(0x33ff55, 0.85, true));
    slime.scale.set(0.45, 0.15, 0.45);
    slime.position.set(0, 0.78, 0);

    const oozeDrop = new THREE.Mesh(GEO.sph, getBasic(0x44ff66, 0.9, true));
    oozeDrop.scale.set(0.08, 0.16, 0.08);
    oozeDrop.position.set(0.4, 0.5, 0);

    root.add(barrel, slime, oozeDrop);
  } else if (type === 'spike_trap') {
    const base = new THREE.Mesh(GEO.box, getLambert(0x2a2430));
    base.scale.set(1.4, 0.08, 1.4);
    base.position.set(0, 0.04, 0);

    for (let x = -0.4; x <= 0.4; x += 0.4) {
      for (let z = -0.4; z <= 0.4; z += 0.4) {
        const spike = new THREE.Mesh(GEO.cone, getLambert(0xa6b0c0, 0x112233));
        spike.scale.set(0.07, 0.55, 0.07);
        spike.position.set(x, 0.32, z);
        base.add(spike);
      }
    }
    root.add(base);
  } else if (type === 'cage') {
    const floor = new THREE.Mesh(GEO.cyl, getLambert(0x1a1a24));
    floor.scale.set(0.9, 0.1, 0.9);
    floor.position.set(0, 0.05, 0);

    const roof = new THREE.Mesh(GEO.cone, getLambert(0x262636));
    roof.scale.set(0.95, 0.4, 0.95);
    roof.position.set(0, 1.7, 0);

    const barMat = getLambert(0x4a4a58);
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI * 2) / 10;
      const bar = new THREE.Mesh(GEO.cyl, barMat);
      bar.scale.set(0.03, 1.5, 0.03);
      bar.position.set(Math.cos(angle) * 0.8, 0.85, Math.sin(angle) * 0.8);
      root.add(bar);
    }

    const prisoner = new THREE.Mesh(GEO.cyl, getLambert(0x567d46));
    prisoner.scale.set(0.24, 0.9, 0.24);
    prisoner.position.set(0, 0.5, 0);

    root.add(floor, roof, prisoner);
  } else if (type === 'pact_altar') {
    const dais = new THREE.Mesh(GEO.box, getLambert(0x140810, 0x220510));
    dais.scale.set(1.4, 0.25, 1.4);
    dais.position.set(0, 0.12, 0);

    const pillar = new THREE.Mesh(GEO.box, getLambert(0x260d1b));
    pillar.scale.set(0.85, 0.8, 0.85);
    pillar.position.set(0, 0.6, 0);

    const skull = new THREE.Mesh(GEO.sph, getBasic(0xff2244, 0.95, true));
    skull.scale.set(0.25, 0.28, 0.25);
    skull.position.set(0, 1.15, 0);

    const darkPillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 4.0, 16, 1, true),
      getBasic(0x990022, 0.25, true)
    );
    darkPillar.position.set(0, 2.2, 0);

    root.add(dais, pillar, skull, darkPillar);
  }
  return { root };
}

// -------------------------------------------------------------
// Grand Boss Teleport Portal Gate with Swirling Ethereal Vortex
// -------------------------------------------------------------
export function buildGrandPortalModel(): { root: THREE.Group; update: (t: number) => void } {
  const root = new THREE.Group();

  // Stone base pedestal
  const base = new THREE.Mesh(GEO.box, getLambert(0x1e1e28));
  base.scale.set(4.4, 0.25, 1.8);
  base.position.set(0, 0.12, 0);

  // Left & Right ancient monolithic pillars
  const pillMat = getLambert(0x282a36);
  const pillL = new THREE.Mesh(GEO.box, pillMat);
  pillL.scale.set(0.65, 4.4, 0.65);
  pillL.position.set(-1.7, 2.3, 0);

  const pillR = pillL.clone();
  pillR.position.x = 1.7;

  // Luminous runic bands on pillars
  const runeMat = getLambert(0x00e5ff, 0x0088cc);
  const runeL1 = new THREE.Mesh(GEO.box, runeMat);
  runeL1.scale.set(0.68, 0.15, 0.68);
  runeL1.position.set(-1.7, 1.6, 0);
  const runeL2 = runeL1.clone();
  runeL2.position.y = 3.2;

  const runeR1 = runeL1.clone();
  runeR1.position.x = 1.7;
  const runeR2 = runeL2.clone();
  runeR2.position.x = 1.7;

  // Top Runic Archway
  const arch = new THREE.Mesh(GEO.box, pillMat);
  arch.scale.set(4.0, 0.65, 0.65);
  arch.position.set(0, 4.4, 0);

  // Central glowing keystone
  const keystone = new THREE.Mesh(GEO.sph, getLambert(0xffea00, 0xcc8800));
  keystone.scale.set(0.35, 0.45, 0.25);
  keystone.position.set(0, 4.5, 0.2);

  // Circular Floor Teleport Dais with glowing runes
  const dais = new THREE.Mesh(GEO.circle, getBasic(0x00ffff, 0.55, true));
  dais.rotation.x = -Math.PI / 2;
  dais.position.set(0, 0.26, 0);
  dais.scale.set(1.6, 1.6, 1.6);

  // Swirling Ethereal Vortex Core (vertical disc with rings)
  const vortexGroup = new THREE.Group();
  vortexGroup.position.set(0, 2.3, 0);

  const vortexOuter = new THREE.Mesh(GEO.ring, getBasic(0x00e5ff, 0.75, true));
  vortexOuter.scale.set(1.4, 1.9, 1);

  const vortexInner = new THREE.Mesh(GEO.ring, getBasic(0xaa00ff, 0.85, true));
  vortexInner.scale.set(0.95, 1.4, 1);

  const vortexCore = new THREE.Mesh(GEO.circle, getBasic(0xffffff, 0.45, true));
  vortexCore.scale.set(0.6, 0.9, 1);

  vortexGroup.add(vortexOuter, vortexInner, vortexCore);

  root.add(base, pillL, pillR, runeL1, runeL2, runeR1, runeR2, arch, keystone, dais, vortexGroup);
  createShadowBlob(root, 2.2);

  const update = (t: number) => {
    vortexOuter.rotation.z = t * 1.6;
    vortexInner.rotation.z = -t * 2.2;
    dais.rotation.z = t * 0.8;
    const pulse = 1.0 + Math.sin(t * 3.5) * 0.08;
    vortexGroup.scale.set(pulse, pulse, 1);
  };

  return { root, update };
}

// -------------------------------------------------------------
// Allied Companion NPC 3D Models (Lyanna & Elidor)
// -------------------------------------------------------------
export function buildAllyModel(type: AllyType): { root: THREE.Group; update: (t: number, isMoving: boolean) => void } {
  const root = new THREE.Group();
  createShadowBlob(root, 0.45);

  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  // Legs
  const legMat = getLambert(0x2a1a38);
  const legL = new THREE.Mesh(GEO.cyl, legMat);
  legL.scale.set(0.08, 0.5, 0.08);
  legL.position.set(-0.14, 0.25, 0);
  const legR = legL.clone();
  legR.position.x = 0.14;
  bodyGroup.add(legL, legR);

  // Torso
  const isArcher = type === 'archer_lyanna';
  const torsoColor = isArcher ? 0x244f32 : 0xede4d8;
  const torso = new THREE.Mesh(GEO.cyl, getLambert(torsoColor));
  torso.scale.set(0.24, 0.55, 0.18);
  torso.position.set(0, 0.72, 0);
  bodyGroup.add(torso);

  // Cape
  const capeColor = isArcher ? 0x1b3b25 : 0xa83232;
  const cape = new THREE.Mesh(GEO.box, getLambert(capeColor));
  cape.scale.set(0.38, 0.75, 0.04);
  cape.position.set(0, 0.7, -0.12);
  cape.rotation.x = 0.1;
  bodyGroup.add(cape);

  // Head & Hood/Hat
  const head = new THREE.Mesh(GEO.sph, getLambert(0xf4d0b0));
  head.scale.setScalar(0.18);
  head.position.set(0, 1.15, 0);

  const cowl = new THREE.Mesh(GEO.cone, getLambert(isArcher ? 0x1b3b25 : 0xd8c8b0));
  cowl.scale.set(0.24, 0.35, 0.24);
  cowl.position.set(0, 1.25, -0.02);
  bodyGroup.add(head, cowl);

  // Weapon in hand
  const weaponGroup = new THREE.Group();
  if (isArcher) {
    const bow = new THREE.Mesh(GEO.torus, getLambert(0x8a5525));
    bow.scale.set(0.3, 0.3, 0.03);
    bow.position.set(0.28, 0.7, 0.1);
    bow.rotation.y = Math.PI / 2;
    weaponGroup.add(bow);
  } else {
    const staff = new THREE.Mesh(GEO.cyl, getLambert(0xffd700, 0x443300));
    staff.scale.set(0.04, 1.2, 0.04);
    staff.position.set(0.28, 0.7, 0.1);
    const sunOrb = new THREE.Mesh(GEO.sph, getBasic(0xffea00, 0.95, true));
    sunOrb.scale.setScalar(0.14);
    sunOrb.position.set(0.28, 1.3, 0.1);
    weaponGroup.add(staff, sunOrb);
  }
  bodyGroup.add(weaponGroup);

  const update = (t: number, isMoving: boolean) => {
    if (isMoving) {
      legL.rotation.x = Math.sin(t * 8) * 0.45;
      legR.rotation.x = -Math.sin(t * 8) * 0.45;
      bodyGroup.position.y = Math.abs(Math.sin(t * 8)) * 0.05;
      cape.rotation.x = 0.25 + Math.sin(t * 8) * 0.1;
    } else {
      legL.rotation.x = 0;
      legR.rotation.x = 0;
      bodyGroup.position.y = Math.sin(t * 2) * 0.02;
      cape.rotation.x = 0.08;
    }
  };

  return { root, update };
}
