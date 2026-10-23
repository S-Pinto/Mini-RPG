// Standalone 3D Item Showcase Models for Inventory 3D Inspector
// Procedural WebGL Models with Studio Shaders and Rarity Aesthetics

import * as THREE from 'three';
import type { Item, ItemRarity } from '../types/game.ts';
import { GEO, getStandard, getBasic } from './proceduralModels.ts';

// Color palettes for item rarities
export const RARITY_COLORS: Record<ItemRarity, { main: number; glow: number; trim: number }> = {
  common: { main: 0xb0a8c0, glow: 0x333344, trim: 0x6b7280 },
  uncommon: { main: 0x34d399, glow: 0x059669, trim: 0x10b981 },
  rare: { main: 0x38bdf8, glow: 0x0284c7, trim: 0x0ea5e9 },
  epic: { main: 0xc084fc, glow: 0x7e22ce, trim: 0xa855f7 },
  legendary: { main: 0xfbbf24, glow: 0xd97706, trim: 0xf59e0b }
};

export function buildStandaloneItem3D(item: Item): THREE.Group {
  const root = new THREE.Group();
  const rar = RARITY_COLORS[item.rarity] || RARITY_COLORS.common;

  const goldMat = getStandard(0xffd700, 0.28, 0.85, 0x442a00);
  const darkSteel = getStandard(0x232730, 0.55, 0.45);
  const brightMetal = getStandard(rar.main, 0.35, 0.75, rar.glow);
  const woodMat = getStandard(0x3e2717, 0.85, 0.05);
  const gemGlowMat = getBasic(rar.main, 0.95, true);

  switch (item.slot) {
    case 'weapon': {
      const type = item.modelType || 'sword';

      if (type === 'greatsword') {
        const sw = new THREE.Group();
        // Colossal two-handed claymore blade with dual fullers
        const blade = new THREE.Mesh(GEO.box, brightMetal);
        blade.scale.set(0.24, 2.4, 0.06);
        blade.position.set(0, 0.6, 0);

        const runeFuller = new THREE.Mesh(GEO.box, gemGlowMat);
        runeFuller.scale.set(0.06, 1.8, 0.07);
        runeFuller.position.set(0, 0.6, 0);

        // Dragon wing crossguard
        const guard = new THREE.Mesh(GEO.box, goldMat);
        guard.scale.set(0.88, 0.14, 0.16);
        guard.position.set(0, -0.6, 0);

        const guardGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.1, 0), gemGlowMat);
        guardGem.position.set(0, -0.6, 0.09);

        // Grip & Pommel
        const grip = new THREE.Mesh(GEO.cyl, darkSteel);
        grip.scale.set(0.06, 0.65, 0.06);
        grip.position.set(0, -0.98, 0);

        const pommel = new THREE.Mesh(new THREE.OctahedronGeometry(0.13, 0), goldMat);
        pommel.position.set(0, -1.34, 0);

        sw.add(blade, runeFuller, guard, guardGem, grip, pommel);
        sw.rotation.z = -Math.PI / 8;
        root.add(sw);

      } else if (type === 'crystal_greatsword') {
        const cg = new THREE.Group();
        // Crystalline translucent prism blade
        const crystalMat = getBasic(rar.main, 0.85, true);
        const blade = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), crystalMat);
        blade.scale.set(0.45, 3.2, 0.22);
        blade.position.set(0, 0.7, 0);

        // Pulsing interior astral core
        const core = new THREE.Mesh(GEO.box, getBasic(0xffffff, 0.95, true));
        core.scale.set(0.06, 1.8, 0.08);
        core.position.set(0, 0.7, 0);

        // Astral floating guard rings
        const guardRing = new THREE.Mesh(GEO.torus, goldMat);
        guardRing.scale.set(0.48, 0.48, 0.05);
        guardRing.rotation.x = Math.PI / 2;
        guardRing.position.set(0, -0.4, 0);

        const guardGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0), crystalMat);
        guardGem.position.set(0, -0.4, 0.12);

        // Grip & Prismatic Pommel
        const grip = new THREE.Mesh(GEO.cyl, darkSteel);
        grip.scale.set(0.055, 0.65, 0.055);
        grip.position.set(0, -0.8, 0);

        const pommel = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), crystalMat);
        pommel.position.set(0, -1.2, 0);

        cg.add(blade, core, guardRing, guardGem, grip, pommel);
        cg.rotation.z = -Math.PI / 8;
        root.add(cg);

      } else if (type === 'katana') {
        const kt = new THREE.Group();
        // Slender curved single-edge steel blade
        const blade = new THREE.Mesh(GEO.box, brightMetal);
        blade.scale.set(0.08, 2.1, 0.035);
        blade.position.set(0.06, 0.65, 0);
        blade.rotation.z = -0.06;

        // Glowing Hamon line along edge
        const hamon = new THREE.Mesh(GEO.box, gemGlowMat);
        hamon.scale.set(0.02, 2.05, 0.04);
        hamon.position.set(0.1, 0.65, 0);
        hamon.rotation.z = -0.06;

        // Circular Tsuba (Guard)
        const tsuba = new THREE.Mesh(GEO.cyl, goldMat);
        tsuba.scale.set(0.3, 0.035, 0.3);
        tsuba.position.set(0, -0.4, 0);

        // Braided Cord Hilt (Tsuka)
        const hilt = new THREE.Mesh(GEO.cyl, darkSteel);
        hilt.scale.set(0.05, 0.65, 0.05);
        hilt.position.set(0, -0.75, 0);

        // Gold Kashira (Pommel cap)
        const kashira = new THREE.Mesh(GEO.cyl, goldMat);
        kashira.scale.set(0.06, 0.06, 0.06);
        kashira.position.set(0, -1.1, 0);

        kt.add(blade, hamon, tsuba, hilt, kashira);
        kt.rotation.z = -Math.PI / 9;
        root.add(kt);

      } else if (type === 'rapier') {
        const rp = new THREE.Group();
        // Slender needle thrusting blade
        const blade = new THREE.Mesh(GEO.box, brightMetal);
        blade.scale.set(0.045, 2.3, 0.045);
        blade.position.set(0, 0.75, 0);

        const fuller = new THREE.Mesh(GEO.box, gemGlowMat);
        fuller.scale.set(0.02, 1.8, 0.05);
        fuller.position.set(0, 0.75, 0);

        // Swept-hilt ornate basket cup guard
        const cup = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2), goldMat);
        cup.rotation.x = Math.PI;
        cup.position.set(0, -0.4, 0);

        const knuckleBow = new THREE.Mesh(GEO.torus, goldMat);
        knuckleBow.scale.set(0.22, 0.35, 0.03);
        knuckleBow.position.set(0.14, -0.65, 0);

        const grip = new THREE.Mesh(GEO.cyl, darkSteel);
        grip.scale.set(0.045, 0.45, 0.045);
        grip.position.set(0, -0.65, 0);

        const pommel = new THREE.Mesh(GEO.sph, goldMat);
        pommel.scale.setScalar(0.1);
        pommel.position.set(0, -0.92, 0);

        rp.add(blade, fuller, cup, knuckleBow, grip, pommel);
        rp.rotation.z = -Math.PI / 8;
        root.add(rp);

      } else if (type === 'serpent_staff') {
        const ss = new THREE.Group();
        // Darkwood rod
        const rod = new THREE.Mesh(GEO.cyl, woodMat);
        rod.scale.set(0.06, 2.2, 0.06);

        // Dual entwined brass serpents coiling around the rod
        for (let i = 0; i < 4; i++) {
          const coil = new THREE.Mesh(GEO.torus, goldMat);
          coil.scale.set(0.14, 0.14, 0.035);
          coil.position.set(0, 0.3 + i * 0.28, 0);
          coil.rotation.x = 0.45;
          ss.add(coil);
        }

        // Two flared snake heads at crest
        const snakeHeadL = new THREE.Mesh(GEO.cone, goldMat);
        snakeHeadL.scale.set(0.1, 0.35, 0.1);
        snakeHeadL.position.set(-0.16, 1.25, 0);
        snakeHeadL.rotation.z = -0.45;

        const snakeHeadR = new THREE.Mesh(GEO.cone, goldMat);
        snakeHeadR.scale.set(0.1, 0.35, 0.1);
        snakeHeadR.position.set(0.16, 1.25, 0);
        snakeHeadR.rotation.z = 0.45;

        // Glowing venomous / astral orb clutched between fangs
        const orb = new THREE.Mesh(GEO.sph, gemGlowMat);
        orb.scale.setScalar(0.24);
        orb.position.set(0, 1.4, 0);

        ss.add(rod, snakeHeadL, snakeHeadR, orb);
        ss.rotation.z = -0.15;
        root.add(ss);

      } else if (type === 'flail') {
        const fl = new THREE.Group();
        // Heavy banded grip
        const handle = new THREE.Mesh(GEO.cyl, woodMat);
        handle.scale.set(0.065, 1.2, 0.065);
        handle.position.set(0, -0.4, 0);

        const cap = new THREE.Mesh(GEO.cyl, darkSteel);
        cap.scale.set(0.08, 0.2, 0.08);
        cap.position.set(0, 0.22, 0);

        // Iron chain links
        for (let i = 0; i < 3; i++) {
          const link = new THREE.Mesh(GEO.torus, darkSteel);
          link.scale.set(0.06, 0.09, 0.025);
          link.position.set(0, 0.4 + i * 0.15, 0);
          link.rotation.y = (i % 2) * (Math.PI / 2);
          fl.add(link);
        }

        // Heavy morningstar ball with spikes
        const ball = new THREE.Mesh(GEO.sph, brightMetal);
        ball.scale.setScalar(0.28);
        ball.position.set(0, 1.05, 0);

        for (let i = 0; i < 6; i++) {
          const spike = new THREE.Mesh(GEO.cone, goldMat);
          spike.scale.set(0.06, 0.2, 0.06);
          const angle = (i * Math.PI * 2) / 6;
          spike.position.set(Math.cos(angle) * 0.3, 1.05 + Math.sin(angle) * 0.1, Math.sin(angle) * 0.3);
          fl.add(spike);
        }

        const ballGlow = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0), gemGlowMat);
        ballGlow.position.set(0, 1.05, 0);

        fl.add(handle, cap, ball, ballGlow);
        fl.rotation.z = -Math.PI / 8;
        root.add(fl);

      } else if (type === 'scythe') {
        const sc = new THREE.Group();
        // Long curved darkwood pole
        const shaft = new THREE.Mesh(GEO.cyl, woodMat);
        shaft.scale.set(0.05, 2.5, 0.05);
        shaft.position.set(-0.25, 0, 0);

        // Massive crescent sweeping reaper blade
        const blade = new THREE.Mesh(GEO.box, brightMetal);
        blade.scale.set(1.4, 0.22, 0.05);
        blade.position.set(0.45, 1.15, 0);
        blade.rotation.z = 0.35;

        const edgeGlow = new THREE.Mesh(GEO.box, gemGlowMat);
        edgeGlow.scale.set(1.35, 0.05, 0.06);
        edgeGlow.position.set(0.45, 1.25, 0);
        edgeGlow.rotation.z = 0.35;

        // Snarling skull collar
        const collar = new THREE.Mesh(GEO.sph, darkSteel);
        collar.scale.set(0.18, 0.22, 0.18);
        collar.position.set(-0.25, 1.15, 0);

        sc.add(shaft, blade, edgeGlow, collar);
        sc.rotation.z = -0.15;
        root.add(sc);

      } else if (type === 'halberd') {
        const hb = new THREE.Group();
        const shaft = new THREE.Mesh(GEO.cyl, woodMat);
        shaft.scale.set(0.055, 2.6, 0.055);

        // Axe head
        const axeBlade = new THREE.Mesh(GEO.box, brightMetal);
        axeBlade.scale.set(0.55, 0.45, 0.05);
        axeBlade.position.set(0.3, 0.95, 0);

        // Rear armor hook
        const hook = new THREE.Mesh(GEO.cone, goldMat);
        hook.scale.set(0.08, 0.35, 0.08);
        hook.position.set(-0.25, 0.95, 0);
        hook.rotation.z = Math.PI / 2;

        // Long spear top point
        const spear = new THREE.Mesh(GEO.cone, brightMetal);
        spear.scale.set(0.12, 0.75, 0.12);
        spear.position.set(0, 1.6, 0);

        hb.add(shaft, axeBlade, hook, spear);
        hb.rotation.z = -Math.PI / 8;
        root.add(hb);

      } else if (type === 'greataxe' || type === 'axe') {
        const ax = new THREE.Group();
        const shaft = new THREE.Mesh(GEO.cyl, woodMat);
        shaft.scale.set(0.065, 2.1, 0.065);
        shaft.position.set(0, 0, 0);

        const socket = new THREE.Mesh(GEO.box, darkSteel);
        socket.scale.set(0.22, 0.38, 0.22);
        socket.position.set(0, 0.75, 0);

        // Double crescent blades
        const bladeL = new THREE.Mesh(GEO.box, brightMetal);
        bladeL.scale.set(0.08, 0.85, 0.55);
        bladeL.position.set(0, 0.75, 0.38);

        const bladeR = new THREE.Mesh(GEO.box, brightMetal);
        bladeR.scale.set(0.08, 0.85, 0.55);
        bladeR.position.set(0, 0.75, -0.38);

        const topSpike = new THREE.Mesh(GEO.cone, goldMat);
        topSpike.scale.set(0.1, 0.45, 0.1);
        topSpike.position.set(0, 1.25, 0);

        ax.add(shaft, socket, bladeL, bladeR, topSpike);
        ax.rotation.z = -Math.PI / 8;
        root.add(ax);

      } else if (type === 'bow' || type === 'crossbow') {
        const bow = new THREE.Group();
        const limbTop = new THREE.Mesh(GEO.cyl, woodMat);
        limbTop.scale.set(0.045, 0.95, 0.045);
        limbTop.position.set(0.15, 0.45, 0);
        limbTop.rotation.z = -0.38;

        const limbBot = new THREE.Mesh(GEO.cyl, woodMat);
        limbBot.scale.set(0.045, 0.95, 0.045);
        limbBot.position.set(0.15, -0.45, 0);
        limbBot.rotation.z = 0.38;

        const tipT = new THREE.Mesh(GEO.cone, goldMat);
        tipT.scale.set(0.06, 0.24, 0.06);
        tipT.position.set(0.35, 0.9, 0);
        tipT.rotation.z = -0.8;

        const tipB = tipT.clone();
        tipB.position.y = -0.9;
        tipB.rotation.z = 0.8;

        const riser = new THREE.Mesh(GEO.box, darkSteel);
        riser.scale.set(0.08, 0.35, 0.08);

        const string = new THREE.Mesh(GEO.cyl, gemGlowMat);
        string.scale.set(0.015, 1.8, 0.015);
        string.position.set(0.35, 0, 0);

        // Arrow resting on rest
        const arrow = new THREE.Mesh(GEO.cyl, goldMat);
        arrow.scale.set(0.025, 1.4, 0.025);
        arrow.rotation.z = Math.PI / 2;

        bow.add(limbTop, limbBot, tipT, tipB, riser, string, arrow);
        root.add(bow);

      } else if (type === 'staff' || type === 'staff_holy') {
        const st = new THREE.Group();
        const rod = new THREE.Mesh(GEO.cyl, woodMat);
        rod.scale.set(0.065, 2.2, 0.065);

        // Crown socket
        const crown = new THREE.Mesh(GEO.cyl, goldMat);
        crown.scale.set(0.15, 0.22, 0.15);
        crown.position.set(0, 1.05, 0);

        // Huge floating faceted crystal
        const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), gemGlowMat);
        crystal.scale.set(0.8, 1.8, 0.8);
        crystal.position.set(0, 1.35, 0);

        // Orbiting rune halo
        const halo = new THREE.Mesh(GEO.torus, getBasic(rar.main, 0.8, true));
        halo.scale.set(0.38, 0.38, 0.04);
        halo.rotation.x = Math.PI / 3;
        halo.position.set(0, 1.35, 0);

        st.add(rod, crown, crystal, halo);
        st.rotation.z = -0.15;
        root.add(st);

      } else if (type === 'wand_tome') {
        const wt = new THREE.Group();
        // Magic Grimoire
        const bookCover = new THREE.Mesh(GEO.box, darkSteel);
        bookCover.scale.set(0.9, 1.2, 0.15);
        bookCover.position.set(-0.25, 0, 0);

        const bookPages = new THREE.Mesh(GEO.box, getStandard(0xfff5e1, 0.9, 0.05));
        bookPages.scale.set(0.85, 1.15, 0.18);
        bookPages.position.set(-0.25, 0, 0.02);

        const bookGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), gemGlowMat);
        bookGem.position.set(-0.25, 0, 0.15);

        // Wand
        const wandRod = new THREE.Mesh(GEO.cyl, woodMat);
        wandRod.scale.set(0.035, 1.3, 0.035);
        wandRod.position.set(0.45, 0, 0);

        const wandGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0), gemGlowMat);
        wandGem.position.set(0.45, 0.72, 0);

        wt.add(bookCover, bookPages, bookGem, wandRod, wandGem);
        root.add(wt);

      } else if (type === 'hammer' || type === 'mace') {
        const hm = new THREE.Group();
        const shaft = new THREE.Mesh(GEO.cyl, woodMat);
        shaft.scale.set(0.065, 1.9, 0.065);

        const head = new THREE.Mesh(GEO.box, brightMetal);
        head.scale.set(0.65, 0.45, 0.45);
        head.position.set(0, 0.8, 0);

        const runeGlow = new THREE.Mesh(GEO.box, gemGlowMat);
        runeGlow.scale.set(0.67, 0.22, 0.22);
        runeGlow.position.set(0, 0.8, 0);

        const spike = new THREE.Mesh(GEO.cone, goldMat);
        spike.scale.set(0.12, 0.35, 0.12);
        spike.position.set(0, 0.8, -0.32);
        spike.rotation.x = -Math.PI / 2;

        hm.add(shaft, head, runeGlow, spike);
        hm.rotation.z = -Math.PI / 8;
        root.add(hm);

      } else if (type === 'dual_daggers') {
        const daggers = new THREE.Group();
        const makeDagger = (ox: number, rz: number) => {
          const d = new THREE.Group();
          const blade = new THREE.Mesh(GEO.box, brightMetal);
          blade.scale.set(0.08, 1.1, 0.04);
          blade.position.set(0, 0.5, 0);

          const edge = new THREE.Mesh(GEO.box, gemGlowMat);
          edge.scale.set(0.09, 0.9, 0.02);
          edge.position.set(0, 0.5, 0.02);

          const guard = new THREE.Mesh(GEO.box, goldMat);
          guard.scale.set(0.32, 0.06, 0.08);

          const pommel = new THREE.Mesh(GEO.torus, goldMat);
          pommel.scale.set(0.08, 0.08, 0.02);
          pommel.position.set(0, -0.22, 0);

          d.add(blade, edge, guard, pommel);
          d.position.x = ox;
          d.rotation.z = rz;
          return d;
        };
        daggers.add(makeDagger(-0.25, 0.25), makeDagger(0.25, -0.25));
        root.add(daggers);

      } else {
        // Standard Knight Longsword
        const sw = new THREE.Group();
        const blade = new THREE.Mesh(GEO.box, brightMetal);
        blade.scale.set(0.14, 1.8, 0.05);
        blade.position.set(0, 0.45, 0);

        const rune = new THREE.Mesh(GEO.box, gemGlowMat);
        rune.scale.set(0.05, 1.3, 0.06);
        rune.position.set(0, 0.45, 0);

        const guard = new THREE.Mesh(GEO.box, goldMat);
        guard.scale.set(0.68, 0.1, 0.14);
        guard.position.set(0, -0.45, 0);

        const grip = new THREE.Mesh(GEO.cyl, darkSteel);
        grip.scale.set(0.06, 0.45, 0.06);
        grip.position.set(0, -0.72, 0);

        const pommel = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), goldMat);
        pommel.position.set(0, -1.0, 0);

        sw.add(blade, rune, guard, grip, pommel);
        sw.rotation.z = -Math.PI / 8;
        root.add(sw);
      }
      break;
    }

    case 'helm': {
      const type = item.helmType || 'knight_helm';
      const helmGrp = new THREE.Group();

      // Display mannequin neck pedestal
      const bust = new THREE.Mesh(GEO.cyl, getStandard(0x181824, 0.7, 0.2));
      bust.scale.set(0.35, 0.8, 0.35);
      bust.position.set(0, -0.6, 0);
      helmGrp.add(bust);

      if (type === 'crown' || type === 'circlet') {
        const crownRing = new THREE.Mesh(GEO.tube, goldMat);
        crownRing.scale.set(0.65, 0.3, 0.65);
        crownRing.position.set(0, 0.2, 0);

        // 4 Spire Points
        for (let i = 0; i < 4; i++) {
          const angle = (i * Math.PI) / 2;
          const spire = new THREE.Mesh(GEO.cone, goldMat);
          spire.scale.set(0.1, 0.35, 0.1);
          spire.position.set(Math.cos(angle) * 0.62, 0.48, Math.sin(angle) * 0.62);
          helmGrp.add(spire);
        }

        const centerGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), gemGlowMat);
        centerGem.position.set(0, 0.35, 0.68);
        helmGrp.add(crownRing, centerGem);

      } else if (type === 'horned_helm') {
        const skullcap = new THREE.Mesh(GEO.sph, brightMetal);
        skullcap.scale.set(0.65, 0.5, 0.65);
        skullcap.position.set(0, 0.1, 0);

        const hornL = new THREE.Mesh(GEO.cone, goldMat);
        hornL.scale.set(0.15, 0.7, 0.15);
        hornL.position.set(-0.55, 0.35, 0.05);
        hornL.rotation.z = 0.65;
        hornL.rotation.x = -0.25;

        const hornR = new THREE.Mesh(GEO.cone, goldMat);
        hornR.scale.set(0.15, 0.7, 0.15);
        hornR.position.set(0.55, 0.35, 0.05);
        hornR.rotation.z = -0.65;
        hornR.rotation.x = -0.25;

        helmGrp.add(skullcap, hornL, hornR);

      } else if (type === 'winged_helm') {
        const helm = new THREE.Mesh(GEO.sph, brightMetal);
        helm.scale.set(0.65, 0.52, 0.65);
        helm.position.set(0, 0.1, 0);

        // Swept silver valkyrie wings
        const wingL = new THREE.Mesh(GEO.box, goldMat);
        wingL.scale.set(0.08, 0.85, 0.35);
        wingL.position.set(-0.62, 0.45, -0.15);
        wingL.rotation.z = 0.4;
        wingL.rotation.y = 0.2;

        const wingR = wingL.clone();
        wingR.position.x = 0.62;
        wingR.rotation.z = -0.4;
        wingR.rotation.y = -0.2;

        const browGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0), gemGlowMat);
        browGem.position.set(0, 0.25, 0.62);

        helmGrp.add(helm, wingL, wingR, browGem);

      } else if (type === 'mage_hat') {
        const brim = new THREE.Mesh(GEO.cyl, getStandard(rar.glow, 0.7, 0.1));
        brim.scale.set(0.85, 0.06, 0.85);
        brim.position.set(0, 0.15, 0);

        const cone = new THREE.Mesh(GEO.cone, getStandard(rar.glow, 0.7, 0.1));
        cone.scale.set(0.5, 1.25, 0.5);
        cone.position.set(0, 0.78, -0.08);
        cone.rotation.x = -0.18;

        const band = new THREE.Mesh(GEO.torus, goldMat);
        band.scale.set(0.48, 0.48, 0.04);
        band.rotation.x = Math.PI / 2;
        band.position.set(0, 0.22, 0);

        const buckleGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0), gemGlowMat);
        buckleGem.position.set(0, 0.24, 0.46);

        helmGrp.add(brim, cone, band, buckleGem);

      } else if (type === 'assassin_hood' || type === 'demon_mask') {
        const hood = new THREE.Mesh(GEO.box, darkSteel);
        hood.scale.set(0.72, 0.7, 0.7);
        hood.position.set(0, 0.15, 0);

        const mask = new THREE.Mesh(GEO.box, getStandard(0x14151a, 0.6, 0.3));
        mask.scale.set(0.55, 0.35, 0.25);
        mask.position.set(0, 0.05, 0.3);

        const eyesL = new THREE.Mesh(GEO.box, gemGlowMat);
        eyesL.scale.set(0.15, 0.04, 0.04);
        eyesL.position.set(-0.16, 0.1, 0.42);

        const eyesR = eyesL.clone();
        eyesR.position.x = 0.16;

        helmGrp.add(hood, mask, eyesL, eyesR);

      } else if (type === 'crusader_visage') {
        // Enclosed Great Crusader Helmet with embossed Golden Cross
        const helm = new THREE.Mesh(GEO.box, brightMetal);
        helm.scale.set(0.72, 0.74, 0.72);
        helm.position.set(0, 0.18, 0);

        // Golden Sun Cross Visor Plate
        const crossV = new THREE.Mesh(GEO.box, goldMat);
        crossV.scale.set(0.12, 0.76, 0.08);
        crossV.position.set(0, 0.18, 0.38);

        const crossH = new THREE.Mesh(GEO.box, goldMat);
        crossH.scale.set(0.68, 0.14, 0.08);
        crossH.position.set(0, 0.22, 0.38);

        // Pierced eye slits
        const slitL = new THREE.Mesh(GEO.box, gemGlowMat);
        slitL.scale.set(0.24, 0.03, 0.1);
        slitL.position.set(-0.2, 0.22, 0.4);

        const slitR = slitL.clone();
        slitR.position.x = 0.2;

        // Top Brass Rivet Trim
        const rivetRim = new THREE.Mesh(GEO.torus, goldMat);
        rivetRim.scale.set(0.55, 0.55, 0.04);
        rivetRim.rotation.x = Math.PI / 2;
        rivetRim.position.set(0, 0.54, 0);

        helmGrp.add(helm, crossV, crossH, slitL, slitR, rivetRim);

      } else if (type === 'crown_of_thorns') {
        // Twisted Bramble Ring
        const ring1 = new THREE.Mesh(GEO.torus, darkSteel);
        ring1.scale.set(0.62, 0.62, 0.045);
        ring1.rotation.x = Math.PI / 2;
        ring1.position.set(0, 0.22, 0);

        const ring2 = new THREE.Mesh(GEO.torus, darkSteel);
        ring2.scale.set(0.58, 0.58, 0.04);
        ring2.rotation.x = Math.PI / 2 + 0.15;
        ring2.position.set(0, 0.28, 0);

        helmGrp.add(ring1, ring2);

        // Sharp thorns projecting outwards and upwards
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI * 2) / 8;
          const thorn = new THREE.Mesh(GEO.cone, goldMat);
          thorn.scale.set(0.06, 0.28, 0.06);
          thorn.position.set(Math.cos(angle) * 0.6, 0.32, Math.sin(angle) * 0.6);
          thorn.rotation.z = Math.cos(angle) * -0.4;
          thorn.rotation.x = Math.sin(angle) * 0.4;

          const rubyDrop = new THREE.Mesh(new THREE.OctahedronGeometry(0.06, 0), gemGlowMat);
          rubyDrop.position.set(Math.cos(angle) * 0.6, 0.46, Math.sin(angle) * 0.6);

          helmGrp.add(thorn, rubyDrop);
        }

      } else {
        // Classic Knight Crusader Greathelm
        const helm = new THREE.Mesh(GEO.box, brightMetal);
        helm.scale.set(0.7, 0.65, 0.68);
        helm.position.set(0, 0.15, 0);

        const visor = new THREE.Mesh(GEO.box, darkSteel);
        visor.scale.set(0.72, 0.12, 0.12);
        visor.position.set(0, 0.15, 0.34);

        const visorSlit = new THREE.Mesh(GEO.box, gemGlowMat);
        visorSlit.scale.set(0.55, 0.03, 0.04);
        visorSlit.position.set(0, 0.15, 0.4);

        const crest = new THREE.Mesh(GEO.box, goldMat);
        crest.scale.set(0.08, 0.28, 0.72);
        crest.position.set(0, 0.52, 0);

        helmGrp.add(helm, visor, visorSlit, crest);
      }
      root.add(helmGrp);
      break;
    }

    case 'armor': {
      const type = item.armorType || 'heavy_plate';
      const armGrp = new THREE.Group();

      // Armor Mannequin Stand
      const stand = new THREE.Mesh(GEO.cyl, getStandard(0x181824, 0.7, 0.2));
      stand.scale.set(0.18, 2.0, 0.18);
      stand.position.set(0, -0.4, 0);
      armGrp.add(stand);

      if (type === 'dragon_scale') {
        const cuirass = new THREE.Mesh(GEO.box, getStandard(0x1a5933, 0.5, 0.4, 0x052e16));
        cuirass.scale.set(0.95, 1.25, 0.65);

        // Gold dragon pectoral rib plates
        for (let i = 0; i < 4; i++) {
          const ribL = new THREE.Mesh(GEO.box, goldMat);
          ribL.scale.set(0.38, 0.1, 0.1);
          ribL.position.set(-0.25, 0.35 - i * 0.2, 0.32);
          ribL.rotation.z = -0.15;

          const ribR = ribL.clone();
          ribR.position.x = 0.25;
          ribR.rotation.z = 0.15;
          armGrp.add(ribL, ribR);
        }

        const centerGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), gemGlowMat);
        centerGem.position.set(0, 0.25, 0.36);

        armGrp.add(cuirass, centerGem);

      } else if (type === 'mage_robes') {
        const robe = new THREE.Mesh(GEO.cyl, getStandard(rar.glow, 0.8, 0.1));
        robe.scale.set(0.55, 1.5, 0.45);

        const mantle = new THREE.Mesh(GEO.box, goldMat);
        mantle.scale.set(1.15, 0.22, 0.65);
        mantle.position.set(0, 0.65, 0);

        const sash = new THREE.Mesh(GEO.box, gemGlowMat);
        sash.scale.set(0.2, 1.1, 0.08);
        sash.position.set(0, 0, 0.26);

        armGrp.add(robe, mantle, sash);

      } else if (type === 'leather_tunic' || type === 'shadow_mantle') {
        const tunic = new THREE.Mesh(GEO.box, getStandard(0x28190e, 0.8, 0.1));
        tunic.scale.set(0.88, 1.2, 0.58);

        // Crossed studded belts
        const belt1 = new THREE.Mesh(GEO.box, darkSteel);
        belt1.scale.set(0.92, 0.1, 0.62);
        belt1.rotation.z = 0.4;

        const belt2 = new THREE.Mesh(GEO.box, darkSteel);
        belt2.scale.set(0.92, 0.1, 0.62);
        belt2.rotation.z = -0.4;

        const buckle = new THREE.Mesh(GEO.box, goldMat);
        buckle.scale.set(0.18, 0.18, 0.08);
        buckle.position.set(0, 0, 0.32);

        armGrp.add(tunic, belt1, belt2, buckle);

      } else if (type === 'gladiator_harness') {
        // Bronze/leather gladiator breast band and single massive spiked galerus
        const harness = new THREE.Mesh(GEO.box, getStandard(0x3a2212, 0.8, 0.1));
        harness.scale.set(0.85, 1.1, 0.52);

        // Crossed bronze baldric straps
        const strap = new THREE.Mesh(GEO.box, goldMat);
        strap.scale.set(0.16, 1.25, 0.56);
        strap.rotation.z = -0.55;

        // Massive gladiator left shoulder guard (galerus)
        const galerus = new THREE.Mesh(GEO.box, goldMat);
        galerus.scale.set(0.48, 0.65, 0.58);
        galerus.position.set(-0.55, 0.55, 0);

        for (let i = 0; i < 3; i++) {
          const spike = new THREE.Mesh(GEO.cone, brightMetal);
          spike.scale.set(0.08, 0.32, 0.08);
          spike.position.set(-0.68, 0.35 + i * 0.22, 0.22);
          spike.rotation.x = 0.4;
          galerus.add(spike);
        }

        const arenaEmblem = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 0), gemGlowMat);
        arenaEmblem.position.set(0, 0.2, 0.3);

        armGrp.add(harness, strap, galerus, arenaEmblem);

      } else if (type === 'frost_cuirass') {
        // Glacial Frost Plate Cuirass
        const frostMat = getBasic(0x38bdf8, 0.85, true);
        const cuirass = new THREE.Mesh(GEO.box, getStandard(0x1e3a5f, 0.4, 0.6, 0x0f2847));
        cuirass.scale.set(0.92, 1.25, 0.6);

        // Translucent blue ice spikes protruding from chest
        for (let i = 0; i < 4; i++) {
          const icicle = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0), frostMat);
          icicle.scale.set(0.5, 1.8, 0.5);
          icicle.position.set(-0.25 + (i % 2) * 0.5, 0.45 - Math.floor(i / 2) * 0.35, 0.34);
          icicle.rotation.z = (i % 2 === 0 ? 0.2 : -0.2);
          armGrp.add(icicle);
        }

        // Frost crystalline pauldrons
        const pL = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), frostMat);
        pL.scale.set(1.1, 1.6, 1.1);
        pL.position.set(-0.6, 0.65, 0);

        const pR = pL.clone();
        pR.position.x = 0.6;

        armGrp.add(cuirass, pL, pR);

      } else if (type === 'phoenix_mail') {
        // Blazing Phoenix Feathery Scale Cuirass
        const fireGold = getStandard(0xff6600, 0.3, 0.8, 0x992200);
        const cuirass = new THREE.Mesh(GEO.box, getStandard(0x5a180c, 0.6, 0.3));
        cuirass.scale.set(0.92, 1.25, 0.58);

        // Curving golden wings sweeping over the chest
        const wingL = new THREE.Mesh(GEO.box, fireGold);
        wingL.scale.set(0.42, 0.8, 0.12);
        wingL.position.set(-0.26, 0.25, 0.32);
        wingL.rotation.z = -0.3;

        const wingR = wingL.clone();
        wingR.position.x = 0.26;
        wingR.rotation.z = 0.3;

        // Sweeping fiery phoenix flame shoulders
        const pL = new THREE.Mesh(GEO.cone, fireGold);
        pL.scale.set(0.25, 0.6, 0.25);
        pL.position.set(-0.58, 0.68, 0);
        pL.rotation.z = 0.6;

        const pR = pL.clone();
        pR.position.x = 0.58;
        pR.rotation.z = -0.6;

        const flameHeart = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), getBasic(0xffaa00, 0.95, true));
        flameHeart.position.set(0, 0.25, 0.36);

        armGrp.add(cuirass, wingL, wingR, pL, pR, flameHeart);

      } else {
        // Heavy Gothic Steel Plate Cuirass
        const chest = new THREE.Mesh(GEO.box, brightMetal);
        chest.scale.set(0.95, 1.3, 0.62);

        const ridge = new THREE.Mesh(GEO.box, goldMat);
        ridge.scale.set(0.12, 1.1, 0.68);

        // Pauldrons (Shoulder Guards)
        const pL = new THREE.Mesh(GEO.box, goldMat);
        pL.scale.set(0.35, 0.35, 0.55);
        pL.position.set(-0.62, 0.55, 0);

        const pR = pL.clone();
        pR.position.x = 0.62;

        const emblem = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), gemGlowMat);
        emblem.position.set(0, 0.25, 0.34);

        armGrp.add(chest, ridge, pL, pR, emblem);
      }
      root.add(armGrp);
      break;
    }

    case 'ring': {
      const type = item.ringType || 'ruby_signet';
      const ringGrp = new THREE.Group();

      if (type === 'dragon_eye_ring') {
        // Scaled serpentine dragon band
        const band = new THREE.Mesh(GEO.torus, darkSteel);
        band.scale.set(0.72, 0.72, 0.18);
        band.rotation.x = Math.PI / 2;

        const dragonClawL = new THREE.Mesh(GEO.cone, goldMat);
        dragonClawL.scale.set(0.1, 0.35, 0.1);
        dragonClawL.position.set(-0.35, 0.75, 0);
        dragonClawL.rotation.z = -0.5;

        const dragonClawR = dragonClawL.clone();
        dragonClawR.position.x = 0.35;
        dragonClawR.rotation.z = 0.5;

        // Glowing dragon eye with slit pupil
        const eyeGem = new THREE.Mesh(GEO.sph, getBasic(0xff9900, 0.95, true));
        eyeGem.scale.set(0.38, 0.28, 0.28);
        eyeGem.position.set(0, 0.85, 0);

        const pupil = new THREE.Mesh(GEO.box, getStandard(0x0a0505, 0.1, 0.9));
        pupil.scale.set(0.04, 0.3, 0.3);
        pupil.position.set(0, 0.85, 0.05);

        ringGrp.add(band, dragonClawL, dragonClawR, eyeGem, pupil);

      } else if (type === 'void_seal') {
        // Obsidian band
        const band = new THREE.Mesh(GEO.torus, getStandard(0x0d0b14, 0.2, 0.8));
        band.scale.set(0.72, 0.72, 0.16);
        band.rotation.x = Math.PI / 2;

        // Void event horizon vortex
        const voidCore = new THREE.Mesh(GEO.sph, getBasic(0x1a0033, 1, false));
        voidCore.scale.setScalar(0.32);
        voidCore.position.set(0, 0.85, 0);

        const accretionDisk = new THREE.Mesh(GEO.torus, getBasic(0xa855f7, 0.85, true));
        accretionDisk.scale.set(0.48, 0.48, 0.035);
        accretionDisk.rotation.x = Math.PI / 3;
        accretionDisk.position.set(0, 0.85, 0);

        ringGrp.add(band, voidCore, accretionDisk);

      } else {
        // Heavy Gold / Silver Band
        const band = new THREE.Mesh(GEO.torus, goldMat);
        band.scale.set(0.72, 0.72, 0.16);
        band.rotation.x = Math.PI / 2;

        // Gemstone setting prongs
        const setting = new THREE.Mesh(GEO.box, goldMat);
        setting.scale.set(0.36, 0.25, 0.36);
        setting.position.set(0, 0.75, 0);

        // Large multi-faceted brilliant gem
        const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), gemGlowMat);
        gem.position.set(0, 0.95, 0);

        // Orbiting ethereal sparkles
        for (let i = 0; i < 3; i++) {
          const angle = (i * Math.PI * 2) / 3;
          const spark = new THREE.Mesh(new THREE.OctahedronGeometry(0.08, 0), getBasic(rar.main, 0.9, true));
          spark.position.set(Math.cos(angle) * 0.55, 0.95, Math.sin(angle) * 0.55);
          ringGrp.add(spark);
        }

        ringGrp.add(band, setting, gem);
      }
      ringGrp.rotation.x = 0.45;
      root.add(ringGrp);
      break;
    }

    case 'relic': {
      const type = item.relicType || 'holy_grail';
      const relicGrp = new THREE.Group();

      if (type === 'phoenix_feather') {
        // Flaming golden-crimson plume feather
        const spine = new THREE.Mesh(GEO.cyl, goldMat);
        spine.scale.set(0.025, 2.1, 0.025);
        spine.rotation.z = -0.2;

        for (let i = 0; i < 6; i++) {
          const barbL = new THREE.Mesh(GEO.box, getBasic(0xff4400, 0.85, true));
          barbL.scale.set(0.18 + i * 0.05, 0.12, 0.02);
          barbL.position.set(-0.16 - i * 0.03, -0.6 + i * 0.28, 0);
          barbL.rotation.z = 0.35;

          const barbR = new THREE.Mesh(GEO.box, getBasic(0xffaa00, 0.85, true));
          barbR.scale.set(0.18 + i * 0.05, 0.12, 0.02);
          barbR.position.set(0.16 + i * 0.03, -0.6 + i * 0.28, 0);
          barbR.rotation.z = -0.35;

          relicGrp.add(barbL, barbR);
        }

        const emberCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), getBasic(0xffffff, 0.95, true));
        emberCore.position.set(0, 0.2, 0);

        relicGrp.add(spine, emberCore);

      } else if (type === 'comet_shard') {
        // Celestial Meteor Fragment trapped in astrolabe rings
        const meteor = new THREE.Mesh(new THREE.DodecahedronGeometry(0.38, 0), getBasic(0x38bdf8, 0.95, true));

        const ring1 = new THREE.Mesh(GEO.torus, goldMat);
        ring1.scale.set(0.68, 0.68, 0.035);

        const ring2 = new THREE.Mesh(GEO.torus, brightMetal);
        ring2.scale.set(0.78, 0.78, 0.035);
        ring2.rotation.x = Math.PI / 2;

        const ring3 = new THREE.Mesh(GEO.torus, goldMat);
        ring3.scale.set(0.88, 0.88, 0.035);
        ring3.rotation.y = Math.PI / 3;

        relicGrp.add(meteor, ring1, ring2, ring3);

      } else if (type === 'ancient_grimoire') {
        const book = new THREE.Mesh(GEO.box, getStandard(0x3e1f2b, 0.7, 0.2));
        book.scale.set(1.1, 1.45, 0.25);

        const cornerTL = new THREE.Mesh(GEO.box, goldMat);
        cornerTL.scale.set(0.35, 0.35, 0.28);
        cornerTL.position.set(-0.4, 0.55, 0);

        const cornerTR = cornerTL.clone();
        cornerTR.position.x = 0.4;

        const eyeRune = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), gemGlowMat);
        eyeRune.position.set(0, 0, 0.16);

        relicGrp.add(book, cornerTL, cornerTR, eyeRune);

      } else if (type === 'celestial_hourglass') {
        const capT = new THREE.Mesh(GEO.cyl, goldMat);
        capT.scale.set(0.55, 0.12, 0.55);
        capT.position.set(0, 0.85, 0);

        const capB = capT.clone();
        capB.position.y = -0.85;

        const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.15, 1.5, 16), getBasic(0xa855f7, 0.45, true));

        const sand = new THREE.Mesh(GEO.sph, gemGlowMat);
        sand.scale.set(0.25, 0.35, 0.25);
        sand.position.set(0, -0.45, 0);

        relicGrp.add(capT, capB, glass, sand);

      } else if (type === 'dragon_heart_stone') {
        // Floating Draconic Crystal Core in Iron Cage
        const core = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45, 0), gemGlowMat);

        const ringX = new THREE.Mesh(GEO.torus, goldMat);
        ringX.scale.set(0.65, 0.65, 0.05);

        const ringY = new THREE.Mesh(GEO.torus, darkSteel);
        ringY.scale.set(0.72, 0.72, 0.05);
        ringY.rotation.x = Math.PI / 2;

        relicGrp.add(core, ringX, ringY);

      } else {
        // Holy Grail of Radiance
        const base = new THREE.Mesh(GEO.cyl, goldMat);
        base.scale.set(0.55, 0.12, 0.55);
        base.position.set(0, -0.7, 0);

        const stem = new THREE.Mesh(GEO.cyl, goldMat);
        stem.scale.set(0.12, 0.65, 0.12);
        stem.position.set(0, -0.35, 0);

        const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.25, 0.75, 16), goldMat);
        cup.position.set(0, 0.25, 0);

        const nectar = new THREE.Mesh(GEO.cyl, gemGlowMat);
        nectar.scale.set(0.48, 0.08, 0.48);
        nectar.position.set(0, 0.55, 0);

        relicGrp.add(base, stem, cup, nectar);
      }
      root.add(relicGrp);
      break;
    }
  }

  return root;
}
