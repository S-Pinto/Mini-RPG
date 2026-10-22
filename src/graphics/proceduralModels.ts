// High-Quality Procedural 3D Models with Articulated Limbs and Attack Animations
// The Albedo Renegades: Shadow of Elanthria

import * as THREE from 'three';
import type { ClassId, EnemyType } from '../types/game.ts';

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
  animate: (t: number, speed: number, attackProgress?: number) => void;
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

  const animate = (t: number, speed: number, attackProgress: number = 0) => {
    const isMoving = speed > 0.1;

    if (attackProgress > 0) {
      const p = Math.min(1, Math.max(0, attackProgress));
      if (p < 0.35) {
        // Windup: raise weapon, twist torso back
        const k = p / 0.35;
        torso.rotation.y = -0.45 * k;
        armR.rotation.x = -0.4 - 1.4 * k;
        armR.rotation.z = 0.2 * k;
        forearmR.rotation.x = 0.4 * k;
        head.rotation.y = 0.2 * k;
      } else if (p < 0.7) {
        // Strike: slash through target with full momentum
        const k = (p - 0.35) / 0.35;
        torso.rotation.y = -0.45 + 0.9 * k;
        armR.rotation.x = -1.8 + 2.2 * k;
        armR.rotation.z = 0.2 - 0.5 * k;
        forearmR.rotation.x = 0.4 - 0.6 * k;
        head.rotation.y = 0.2 - 0.3 * k;
      } else {
        // Recovery: return to rest
        const k = (p - 0.7) / 0.3;
        torso.rotation.y = 0.45 * (1 - k);
        armR.rotation.x = 0.4 * (1 - k);
        armR.rotation.z = -0.3 * (1 - k);
        forearmR.rotation.x = -0.2 * (1 - k);
        head.rotation.y = -0.1 * (1 - k);
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
      armR.rotation.z *= 0.8;
      forearmR.rotation.x *= 0.8;
      head.rotation.y *= 0.8;

      if (isMoving) {
        const freq = t * 10;
        const stride = Math.sin(freq);
        legL.rotation.x = stride * 0.75;
        legR.rotation.x = -stride * 0.75;
        shinL.rotation.x = Math.max(0, -stride) * 0.55;
        shinR.rotation.x = Math.max(0, stride) * 0.55;
        armL.rotation.x = -stride * 0.55;
        armR.rotation.x = stride * 0.55;
        body.position.y = Math.abs(Math.sin(freq)) * 0.06;
        torso.rotation.z = stride * 0.04;
      } else {
        const breathe = Math.sin(t * 2.2) * 0.02;
        body.position.y = breathe;
        legL.rotation.x *= 0.85;
        legR.rotation.x *= 0.85;
        shinL.rotation.x *= 0.85;
        shinR.rotation.x *= 0.85;
        armL.rotation.x = -0.12;
        armR.rotation.x = -0.12;
        torso.rotation.z = breathe * 0.2;
      }
    }
  };

  return {
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
    animate
  };
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
      rig.head.add(helm, visor, crest);

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

      // Wizard Hat
      const hatBrim = new THREE.Mesh(GEO.cyl, getLambert(0x1a265c));
      hatBrim.scale.set(0.68, 0.06, 0.68);
      hatBrim.position.set(0, 0.58, 0);
      const hatCone = new THREE.Mesh(GEO.cone, getLambert(0x24327a));
      hatCone.scale.set(0.42, 1.1, 0.42);
      hatCone.position.set(0, 1.15, -0.05);
      hatCone.rotation.x = -0.15;
      rig.head.add(hatBrim, hatCone);

      // Wizard Robe Skirt
      const robe = new THREE.Mesh(GEO.cyl, getLambert(0x2d3a8a));
      robe.scale.set(0.44, 0.65, 0.35);
      robe.position.set(0, -0.18, 0);
      rig.torso.add(robe);

      // Arcane Staff
      const staff = new THREE.Group();
      const rod = new THREE.Mesh(GEO.cyl, getLambert(0x5a3e26));
      rod.scale.set(0.06, 2.2, 0.06);
      rod.position.set(0, 0.3, 0);
      const orb = new THREE.Mesh(GEO.sph, getLambert(0x60d0ff, 0x1060cc));
      orb.scale.setScalar(0.24);
      orb.position.set(0, 1.45, 0);
      const ring = new THREE.Mesh(GEO.torus, getLambert(0x88ccff, 0x225599));
      ring.scale.set(0.2, 0.2, 0.04);
      ring.position.set(0, 1.45, 0);
      staff.add(rod, orb, ring);
      staff.rotation.x = -0.25;
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
      rig.head.add(helm, hornL, hornR);

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
      rig.head.add(hood, mask);

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
      rig.head.add(mitre, halo);

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
      const staff = new THREE.Group();
      const sRod = new THREE.Mesh(GEO.cyl, getLambert(0x2a1630));
      sRod.scale.set(0.06, 1.8, 0.06);
      sRod.position.set(0, 0.35, 0);
      const skull = new THREE.Mesh(GEO.box, getLambert(0xe2dacb));
      skull.scale.set(0.24, 0.24, 0.24);
      skull.position.set(0, 1.3, 0);
      const voidOrb = new THREE.Mesh(GEO.sph, getLambert(0x8800cc, 0x550088));
      voidOrb.scale.setScalar(0.15);
      voidOrb.position.set(0, 1.34, 0);
      staff.add(sRod, skull, voidOrb);
      staff.rotation.x = -0.25;
      rig.weaponHolder.add(staff);

      const update = (t: number, speed: number, atk: number = 0) => {
        rig.animate(t, speed, 0);
        if (atk > 0) {
          rig.armR.rotation.x = -1.6 * atk;
          rig.armL.rotation.x = -1.6 * atk;
          rig.torso.rotation.y = Math.sin(t * 8) * 0.2;
        }
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
      const totem = new THREE.Group();
      const rod = new THREE.Mesh(GEO.cyl, getLambert(0x300a06));
      rod.scale.set(0.06, 1.7, 0.06);
      rod.position.set(0, 0.3, 0);
      const orb = new THREE.Mesh(GEO.sph, getLambert(0xff6600, 0x441100));
      orb.scale.setScalar(0.18);
      orb.position.set(0, 1.25, 0);
      totem.add(rod, orb);
      totem.rotation.x = -0.28;
      rig.weaponHolder.add(totem);

      const update = (t: number, spd: number, atk: number = 0) => {
        if (atk > 0) {
          rig.armR.rotation.x = -1.6 * atk;
          rig.armL.rotation.x = -1.6 * atk;
        } else {
          rig.animate(t, spd, 0);
        }
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
// Interactive Props: Chest, Barrel, Pot, Shrine
// -------------------------------------------------------------
export function buildPropModel(type: 'chest' | 'barrel' | 'pot' | 'shrine' | 'table' | 'chair' | 'crate'): { root: THREE.Group } {
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
  }
  return { root };
}
