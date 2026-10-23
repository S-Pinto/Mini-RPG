// Combat System, Skills, Projectiles, and Dynamic 3D Slash Animations
// The Albedo Renegades: Shadow of Elanthria

import * as THREE from 'three';
import { getBasic, type AttackAnimationType } from '../graphics/proceduralModels.ts';
import { particles } from '../graphics/particles.ts';
import { sound } from '../audio/soundEngine.ts';
import { telegraphs } from './telegraphs.ts';
import type { Player } from '../entities/player.ts';
import type { Enemy } from '../entities/enemy.ts';
import { dungeon, type DungeonRoom } from '../world/dungeonGenerator.ts';
import type { DestructibleProp } from '../types/game.ts';
import { physics } from '../physics/physicsEngine.ts';
import { aiManager } from '../ai/aiManager.ts';
import { postProcessing } from '../graphics/postProcessing.ts';

export interface Projectile {
  mesh: THREE.Mesh;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  life: number;
  isPlayer: boolean;
  color: number;
  pierce: number;
  bounces?: number;
  onHitEffect?: 'burn' | 'smite' | 'freeze' | 'poison';
}

export interface LingeringZone {
  x: number;
  y: number;
  radius: number;
  timer: number;
  tickTimer: number;
  type: 'sanctuary' | 'burn_crater' | 'smoke_screen';
  color: number;
  damage?: number;
  heal?: number;
}

export interface SlashEffect {
  mesh: THREE.Group;
  life: number;
  maxLife: number;
  initialScale: number;
  targetScale: number;
  type?: 'horizontal' | 'vertical' | 'thrust';
  startY?: number;
  targetY?: number;
}

export interface ExpandingShockwaveRing {
  mesh: THREE.Mesh;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  speed: number;
  damage: number;
  thickness: number;
  color: number;
  hitPlayer: boolean;
}

export class CombatSystem {
  public group = new THREE.Group();
  public projectiles: Projectile[] = [];
  public slashes: SlashEffect[] = [];
  public lingeringZones: LingeringZone[] = [];
  public shockwaveRings: ExpandingShockwaveRing[] = [];
  public hitStopTimer = 0;
  public shakeTrauma = 0;
  public onPropDropItem?: (propType: 'sarcophagus' | 'weapon_rack', x: number, y: number) => void;
  public onSecretWallDestroyed?: (pr: DestructibleProp) => void;

  public spawnShockwaveRing(
    x: number,
    y: number,
    initialRadius = 0.6,
    maxRadius = 13.5,
    speed = 8.5,
    damage = 28,
    color = 0xff3b30,
    thickness = 0.75
  ): ExpandingShockwaveRing {
    const geom = new THREE.TorusGeometry(1, 0.08, 8, 48);
    const mat = getBasic(color, 0.9, true);
    const mesh = new THREE.Mesh(geom, mat);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.set(x, 0.12, y);
    mesh.scale.set(initialRadius, initialRadius, 1);
    this.group.add(mesh);

    const ring: ExpandingShockwaveRing = {
      mesh,
      x,
      y,
      radius: initialRadius,
      maxRadius,
      speed,
      damage,
      thickness,
      color,
      hitPlayer: false
    };
    this.shockwaveRings.push(ring);
    return ring;
  }

  public spawnBulletHellSpiral(
    cx: number,
    cy: number,
    count = 12,
    speed = 10,
    angleOffset = 0,
    color = 0xff4400,
    damage = 22,
    radius = 0.35
  ): void {
    sound.fireball();
    const step = (Math.PI * 2) / count;
    for (let i = 0; i < count; i++) {
      const angle = angleOffset + i * step;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      this.spawnProjectile(cx, cy, vx, vy, radius, damage, false, color, 0);
    }
  }

  public addScreenShake(amount: number): void {
    this.shakeTrauma = Math.min(1.0, this.shakeTrauma + amount);
    postProcessing.triggerAberration(amount * 0.022);
  }

  public triggerPropDestruction(pr: DestructibleProp, player: Player, enemies: Enemy[]): void {
    pr.hp = 0;
    if (pr.mesh) pr.mesh.visible = false;
    physics.removePropCollider(pr.id);
    aiManager.removeObstacle(pr.id);

    if (pr.type === 'explosive_barrel') {
      sound.dragonRoar();
      this.addScreenShake(0.65);
      particles.spawnShockwave(pr.x, pr.y, 5.0, 0xff4400, 0.4);
      particles.spawnBurst(pr.x, 1.0, pr.y, 45, 0xff5500, 10);
      particles.spawnFloatingText(pr.x, 2.2, pr.y, '💥 DEFLAGRAZIONE!', '#ff4400', true);

      // Damage enemies
      for (const e of enemies) {
        if (e.isDead) continue;
        const d = Math.hypot(e.x - pr.x, e.y - pr.y);
        if (d <= 4.5) {
          e.takeDamage(65, e.x - pr.x, e.y - pr.y, 14);
          physics.applyKnockbackToEnemy(e.id, (e.x - pr.x) * 3.5, (e.y - pr.y) * 3.5);
          e.applyStatusEffect('burn', 4.0, 8);
          particles.spawnFloatingText(e.x, 2.0, e.y, '65 🔥 BRUCIATURA', '#ff6600', true);
        }
      }

      // Damage player if in blast radius
      const playerDist = Math.hypot(player.x - pr.x, player.y - pr.y);
      if (playerDist <= 4.5) {
        const dmg = player.takeDamage(25);
        if (dmg > 0) {
          sound.playerHurt();
          this.addScreenShake(0.35);
          particles.spawnFloatingText(player.x, 2.4, player.y, `-${dmg} ESPLOSIONE!`, '#ff2200', true);
        }
      }
    } else if (pr.type === 'toxic_barrel') {
      sound.heal();
      this.addScreenShake(0.3);
      particles.spawnShockwave(pr.x, pr.y, 4.2, 0x22c55e, 0.4);
      particles.spawnBurst(pr.x, 1.0, pr.y, 35, 0x16a34a, 8);
      particles.spawnFloatingText(pr.x, 2.2, pr.y, '☣️ NUBE TOSSICA!', '#22c55e', true);

      for (const e of enemies) {
        if (e.isDead) continue;
        const d = Math.hypot(e.x - pr.x, e.y - pr.y);
        if (d <= 4.0) {
          e.takeDamage(25, e.x - pr.x, e.y - pr.y, 8);
          e.applyStatusEffect('poison', 5.0, 6);
          particles.spawnFloatingText(e.x, 2.0, e.y, '25 🧪 AVVELENATO', '#22c55e', true);
        }
      }

      const playerDist = Math.hypot(player.x - pr.x, player.y - pr.y);
      if (playerDist <= 4.0) {
        const dmg = player.takeDamage(15);
        if (dmg > 0) {
          sound.playerHurt();
          this.addScreenShake(0.25);
          particles.spawnFloatingText(player.x, 2.4, player.y, `-${dmg} VELENO!`, '#22c55e', true);
        }
      }
    } else if (pr.type === 'sarcophagus') {
      sound.heavyChop();
      this.addScreenShake(0.35);
      particles.spawnShockwave(pr.x, pr.y, 3.5, 0x93c5fd, 0.35);
      particles.spawnBurst(pr.x, 0.8, pr.y, 28, 0x475569, 6);
      particles.spawnFloatingText(pr.x, 2.2, pr.y, '⚰️ SARCOFAGO INFRANTO!', '#93c5fd', true);
      player.gold += Math.floor(14 + Math.random() * 16);
      sound.coin();
      if (this.onPropDropItem) {
        this.onPropDropItem('sarcophagus', pr.x, pr.y);
      }
    } else if (pr.type === 'weapon_rack') {
      sound.breakProp();
      this.addScreenShake(0.25);
      particles.spawnBurst(pr.x, 0.8, pr.y, 22, 0xa0a8b4, 5);
      particles.spawnFloatingText(pr.x, 2.0, pr.y, '⚔️ ARMERIA FORZATA!', '#cbd5e1', true);
      player.gold += Math.floor(4 + Math.random() * 8);
      sound.coin();
      if (this.onPropDropItem) {
        this.onPropDropItem('weapon_rack', pr.x, pr.y);
      }
    } else if (pr.type === 'secret_wall') {
      sound.heavyChop();
      this.addScreenShake(0.5);
      particles.spawnShockwave(pr.x, pr.y, 4.2, 0x94a3b8, 0.4);
      particles.spawnBurst(pr.x, 1.2, pr.y, 35, 0x64748b, 8);
      particles.spawnFloatingText(pr.x, 2.4, pr.y, '🗝️ PARETE SEGRETA INFRANTA! +45 EXP', '#38bdf8', true);
      player.addXp(45);
      if (this.onSecretWallDestroyed) {
        this.onSecretWallDestroyed(pr);
      }
    } else if (pr.type === 'campfire') {
      sound.breakProp();
      this.addScreenShake(0.15);
      particles.spawnBurst(pr.x, 0.4, pr.y, 18, 0xff5500, 3);
      particles.spawnFloatingText(pr.x, 1.8, pr.y, 'Falò Spento', '#ea580c');
    } else {
      sound.breakProp();
      this.addScreenShake(0.08);
      particles.spawnBurst(pr.x, 0.6, pr.y, 14, 0x8a5438, 4);
      player.gold += Math.floor(1 + Math.random() * 4);
      sound.coin();
    }
  }

  public spawnSlashEffect(
    x: number,
    y: number,
    angle: number,
    radius: number,
    color: number,
    type: 'horizontal' | 'vertical' | 'thrust' = 'horizontal'
  ): void {
    const gr = new THREE.Group();

    if (type === 'vertical') {
      gr.position.set(x, 1.4, y);
      gr.rotation.y = angle;

      // Vertical crescent blade slicing down from above
      const arcSpan = Math.PI * 0.82;
      const geo = new THREE.RingGeometry(radius * 0.45, radius, 24, 1, -arcSpan / 2, arcSpan);
      geo.rotateY(-Math.PI / 2); // Forward along +Z
      geo.rotateZ(-Math.PI / 2); // Stand on edge vertically!
      const mat = getBasic(color, 0.9, true);
      const mesh = new THREE.Mesh(geo, mat);
      gr.add(mesh);

      this.group.add(gr);
      this.slashes.push({
        mesh: gr,
        life: 0,
        maxLife: 0.22,
        initialScale: 0.7,
        targetScale: 1.2,
        type: 'vertical',
        startY: 1.4,
        targetY: 0.35
      });
    } else if (type === 'thrust') {
      gr.position.set(x, 0.75, y);
      gr.rotation.y = angle;

      // Sharp piercing thrust beam / cone
      const coneGeo = new THREE.ConeGeometry(0.35, radius * 0.9, 12);
      coneGeo.rotateX(Math.PI / 2); // Point forward along +Z
      coneGeo.translate(0, 0, radius * 0.45);
      const mat = getBasic(color, 0.9, true);
      const mesh = new THREE.Mesh(coneGeo, mat);
      gr.add(mesh);

      this.group.add(gr);
      this.slashes.push({
        mesh: gr,
        life: 0,
        maxLife: 0.2,
        initialScale: 0.5,
        targetScale: 1.35,
        type: 'thrust'
      });
    } else {
      // Horizontal crescent sweep arc
      gr.position.set(x, 0.55, y);
      gr.rotation.y = angle;

      const arcSpan = Math.PI * 0.92;
      const geo = new THREE.RingGeometry(radius * 0.42, radius, 24, 1, -arcSpan / 2, arcSpan);
      geo.rotateX(-Math.PI / 2); // Lay flat
      geo.rotateY(-Math.PI / 2); // Forward along +Z
      const mat = getBasic(color, 0.88, true);
      const mesh = new THREE.Mesh(geo, mat);
      gr.add(mesh);

      this.group.add(gr);
      this.slashes.push({
        mesh: gr,
        life: 0,
        maxLife: 0.2,
        initialScale: 0.65,
        targetScale: 1.2,
        type: 'horizontal'
      });
    }
  }

  public spawnSlashArc(x: number, y: number, angle: number, radius: number, color: number): void {
    this.spawnSlashEffect(x, y, angle, radius, color, 'horizontal');
  }

  public performDodge(player: Player): boolean {
    if (player.dashCd > 0) return false;

    player.dashCd = player.dashMaxCd;
    player.dashTimer = 0.24;
    player.invulnerableTimer = 0.35;

    sound.dash();
    postProcessing.triggerAberration(0.016);

    // Determine dodge direction
    if (player.isMoving && (player.moveX !== 0 || player.moveY !== 0)) {
      // Keep moving in direction of input
    } else {
      player.moveX = player.aimX;
      player.moveY = player.aimY;
      player.isMoving = true;
    }

    // Spawn dodge effects: dust puff and blue speed streaks
    particles.spawnBurst(player.x, 0.25, player.y, 10, 0xd0c4e8, 3.5, 0.18);
    particles.spawnBurst(
      player.x - player.moveX * 0.5,
      0.4,
      player.y - player.moveY * 0.5,
      8,
      0x88ccff,
      2.5,
      0.14
    );

    return true;
  }

  public castBasicAttack(player: Player, enemies: Enemy[], room: DungeonRoom): void {
    if (player.attackCd > 0) return;
    player.attackCd = player.stats.attackDelay;

    const classId = player.classId;
    const isCrit = (player.flurryCritTimer > 0) || (Math.random() * 100 < player.stats.critChance);
    const critMult = isCrit ? player.stats.critDamage / 100 : 1.0;
    const baseDamage = Math.round(player.stats.damage * critMult);

    if (classId === 'paladin' || classId === 'fighter' || classId === 'cleric') {
      const step = player.comboStep; // 0 = spazzata, 1 = taglio verticale, 2 = affondo
      const attackAngle = Math.atan2(player.aimX, player.aimY);

      const baseReach = classId === 'fighter' ? 3.4 : 2.7;
      let reach = baseReach;
      let arcHalf = classId === 'fighter' ? Math.PI * 0.55 : Math.PI * 0.45;
      let comboDamageMult = 1.0;
      let knockback = classId === 'fighter' ? 14 : 9;
      let attackType: AttackAnimationType = 'slash_horizontal';
      let effectType: 'horizontal' | 'vertical' | 'thrust' = 'horizontal';

      if (step === 0) {
        // 1. SPAZZATA (Horizontal Sweep)
        attackType = 'slash_horizontal';
        effectType = 'horizontal';
        comboDamageMult = 1.0;
        player.attackDuration = 0.26;
        sound.swing();
        player.comboStep = 1;
        player.comboTimer = 1.2;
      } else if (step === 1) {
        // 2. TAGLIO VERTICALE (Overhead Vertical Chop)
        attackType = 'slash_vertical';
        effectType = 'vertical';
        comboDamageMult = 1.25;
        arcHalf = Math.PI * 0.32;
        reach = baseReach * 1.1;
        knockback = Math.round(knockback * 1.4);
        player.attackDuration = 0.28;
        sound.heavyChop();
        player.comboStep = 2;
        player.comboTimer = 1.2;
      } else {
        // 3. AFFONDO (Piercing Lunge / Thrust)
        attackType = 'thrust';
        effectType = 'thrust';
        comboDamageMult = 1.45;
        arcHalf = Math.PI * 0.22;
        reach = baseReach * 1.35;
        knockback = Math.round(knockback * 1.6);
        player.attackDuration = 0.30;
        sound.thrust();
        player.comboStep = 0;
        player.comboTimer = 0;

        // Dynamic forward lunge step
        const lungeDist = 0.35;
        const lx = player.x + player.aimX * lungeDist;
        const ly = player.y + player.aimY * lungeDist;
        if (!dungeon.isBlocked(room, lx, ly, player.radius)) {
          player.x = lx;
          player.y = ly;
        }
      }

      player.currentAttackType = attackType;
      player.attackAnimTimer = player.attackDuration;

      const slashColor = classId === 'paladin'
        ? (player.isSmiteCharged ? 0xffea00 : 0xffd700)
        : (classId === 'cleric' ? 0xffcc88 : 0xdfe6f2);

      this.spawnSlashEffect(player.x, player.y, attackAngle, reach, slashColor, effectType);

      // Visual slash particle burst
      particles.spawnBurst(
        player.x + player.aimX * 1.5,
        1.1,
        player.y + player.aimY * 1.5,
        classId === 'paladin' ? 14 : 8,
        slashColor,
        5
      );

      // If vertical chop, add ground slam shockwave
      if (step === 1) {
        particles.spawnShockwave(
          player.x + player.aimX * (reach * 0.7),
          player.y + player.aimY * (reach * 0.7),
          2.2,
          slashColor,
          0.25
        );
      }

      const totalDamage = Math.round(baseDamage * comboDamageMult);

      for (const e of enemies) {
        if (e.isDead) continue;
        const dx = e.x - player.x;
        const dy = e.y - player.y;
        const dist = Math.hypot(dx, dy);

        if (dist <= reach + e.stats.radius) {
          const enemyAngle = Math.atan2(dx, dy);
          let angleDiff = enemyAngle - attackAngle;
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

          if (Math.abs(angleDiff) <= arcHalf) {
            let dmg = totalDamage;
            if (player.isSmiteCharged) {
              dmg = Math.round(dmg * 2.6);
              sound.smite();
              this.addScreenShake(0.42);
              particles.spawnShockwave(e.x, e.y, 4.0, 0xffea00);
              particles.spawnBurst(e.x, 1.2, e.y, 25, 0xffd700, 8);
              if (player.hasAugment('pal_smite_double_charge')) {
                player.skillCharges['smite'] = (player.skillCharges['smite'] || 2) - 1;
                if (player.skillCharges['smite'] <= 0) {
                  player.isSmiteCharged = false;
                } else {
                  particles.spawnFloatingText(player.x, 2.2, player.y, 'PUNIZIONE: 1 CARICA RIMASTA!', '#ffea00');
                }
              } else {
                player.isSmiteCharged = false;
              }
            } else {
              sound.hitEnemy();
              this.addScreenShake(isCrit ? 0.28 : (step === 2 ? 0.16 : 0.08));
              particles.spawnBurst(e.x, 1.0, e.y, 8, isCrit ? 0xffd700 : 0xffffff, 5);
            }

            if (isCrit || step === 2) {
              this.hitStopTimer = 0.045;
            }

            e.takeDamage(dmg, dx, dy, knockback);
            physics.applyKnockbackToEnemy(e.id, dx * knockback * 0.22, dy * knockback * 0.22);
            const label = step === 2 ? `${dmg} AFFONDO!` : (step === 1 ? `${dmg} TAGLIO!` : `${dmg}`);
            particles.spawnFloatingText(e.x, 2.0, e.y, label, isCrit ? '#ffd700' : (step === 2 ? '#ff9955' : '#ffffff'), isCrit || step > 0);

            // Lifesteal
            if (player.stats.lifesteal > 0) {
              const stealAmount = Math.max(1, Math.round(dmg * (player.stats.lifesteal / 100)));
              player.heal(stealAmount);
            }
          }
        }
      }

      // Check destructible props in range
      for (const p of room.props) {
        if (p.hp <= 0 || p.type === 'chest' || p.type === 'shrine' || p.type === 'shop_counter' || p.type === 'teleport_pad' || p.type === 'skill_crucible' || p.type === 'pact_altar' || p.type === 'cage' || p.type === 'spike_trap' || p.type === 'fire_jet' || p.type === 'celestial_fountain' || p.type === 'celestial_forge') continue;
        const dx = p.x - player.x;
        const dy = p.y - player.y;
        if (Math.hypot(dx, dy) <= reach + 0.8) {
          p.hp -= totalDamage;
          if (p.hp <= 0) {
            this.triggerPropDestruction(p, player, enemies);
          }
        }
      }
    } else if (classId === 'wizard') {
      // Wizard staff thrust with distinct physical recoil
      player.currentAttackType = 'mage_cast';
      player.attackDuration = 0.28;
      player.attackAnimTimer = 0.28;

      sound.mageBlast();

      // Muzzle spark & arcane ring at the tip of the extended staff
      const staffTipX = player.x + player.aimX * 1.1;
      const staffTipY = player.y + player.aimY * 1.1;
      particles.spawnBurst(staffTipX, 1.35, staffTipY, 12, 0x66a3ff, 5);
      particles.spawnShockwave(staffTipX, staffTipY, 1.8, 0x88ccff, 0.2);

      // Wizard slight physical recoil impulse (pushes player slightly back from firing)
      const recoilDist = 0.12;
      const rx = player.x - player.aimX * recoilDist;
      const ry = player.y - player.aimY * recoilDist;
      if (!dungeon.isBlocked(room, rx, ry, player.radius)) {
        player.x = rx;
        player.y = ry;
      }

      // Magic missile projectile
      const speed = 22;
      this.spawnProjectile(
        staffTipX,
        staffTipY,
        player.aimX * speed,
        player.aimY * speed,
        0.28,
        baseDamage,
        true,
        0x66a3ff,
        1
      );
    } else if (classId === 'rogue') {
      // Throw daggers with rapid arm slash
      player.currentAttackType = 'slash_horizontal';
      player.attackDuration = 0.18;
      player.attackAnimTimer = 0.18;
      sound.shootArrow();
      this.spawnSlashArc(player.x, player.y, Math.atan2(player.aimX, player.aimY), 1.8, 0x44d98a);
      const speed = 26;
      this.spawnProjectile(
        player.x + player.aimX * 0.8,
        player.y + player.aimY * 0.8,
        player.aimX * speed,
        player.aimY * speed,
        0.2,
        baseDamage,
        true,
        0x44d98a,
        0
      );
    }
  }

  public castSkill1(player: Player, enemies: Enemy[]): void {
    if (player.skill1Cd > 0) return;
    const classId = player.classId;

    switch (classId) {
      case 'paladin': {
        // Divine Smite: Sacred lift & power infusion
        player.skill1Cd = 5.5 * (1 - player.stats.cooldownReduction / 100);
        player.isSmiteCharged = true;
        player.currentAttackType = 'smite_cast';
        player.attackDuration = 0.45;
        player.attackAnimTimer = 0.45;
        sound.smite();
        particles.spawnBurst(player.x, 1.2, player.y, 20, 0xffea00, 6);
        particles.spawnFloatingText(player.x, 2.5, player.y, 'PUNIZIONE DIVINA ATTIVA!', '#ffea00', true);

        // Augment: Nova Solare del Giudizio (Instant 6m blast)
        if (player.hasAugment('pal_smite_radiant_nova')) {
          particles.spawnShockwave(player.x, player.y, 6.0, 0xffea00, 0.35);
          particles.spawnBurst(player.x, 1.0, player.y, 30, 0xffffff, 8);
          for (const e of enemies) {
            if (e.isDead) continue;
            if (Math.hypot(e.x - player.x, e.y - player.y) <= 6.0) {
              const dmg = Math.round(player.stats.damage * 2.5);
              e.takeDamage(dmg, e.x - player.x, e.y - player.y, 16);
              particles.spawnFloatingText(e.x, 2.2, e.y, `☀️ ${dmg}`, '#ffea00', true);
            }
          }
        }

        // Augment: Doppia Punizione Consacrata
        if (player.hasAugment('pal_smite_double_charge')) {
          player.skillCharges['smite'] = 2;
        }

        // Augment: Fulmini a Catena
        if (player.hasAugment('pal_smite_holy_chains')) {
          let chained = 0;
          for (const e of enemies) {
            if (e.isDead || chained >= 4) continue;
            if (Math.hypot(e.x - player.x, e.y - player.y) <= 8.0) {
              const dmg = Math.round(player.stats.damage * 1.8);
              e.takeDamage(dmg, 0, 0, 10);
              particles.spawnBurst(e.x, 1.5, e.y, 14, 0xffff44, 6);
              particles.spawnFloatingText(e.x, 2.4, e.y, `⚡ ${dmg}`, '#ffff44');
              chained++;
            }
          }
        }
        break;
      }

      case 'wizard': {
        // Fireball: Arcane staff thrust with blazing orb
        player.skill1Cd = 6.0 * (1 - player.stats.cooldownReduction / 100);
        player.currentAttackType = 'fireball_cast';
        player.attackDuration = 0.45;
        player.attackAnimTimer = 0.45;
        sound.fireball();

        // Augment: Comete Orbitanti (spawns 2 circling flame orbs)
        if (player.hasAugment('wiz_fireball_orbit')) {
          player.activeOrbs.push(
            { angle: 0, radius: 2.2, timer: 10, color: 0xff4400, damage: Math.round(player.stats.damage * 1.4), hitCooldown: 0 },
            { angle: Math.PI, radius: 2.2, timer: 10, color: 0xff4400, damage: Math.round(player.stats.damage * 1.4), hitCooldown: 0 }
          );
          particles.spawnBurst(player.x, 1.2, player.y, 25, 0xff6600, 7);
          particles.spawnFloatingText(player.x, 2.5, player.y, '🔥 COMETE ORBITANTI!', '#ff6600', true);
        }

        const isAoe = player.hasAugment('wiz_fireball_aoe');
        const isBounce = player.hasAugment('wiz_fireball_bounce');
        const speed = isBounce ? 22 : 18;
        const radius = isAoe ? 0.75 : 0.45;
        const dmg = Math.round(player.stats.damage * (isAoe ? 4.5 : 3.2));
        const pierce = isBounce ? 2 : 0;

        if (isAoe) {
          this.lingeringZones.push({
            x: player.x + player.aimX * 4.5,
            y: player.y + player.aimY * 4.5,
            radius: 3.5,
            timer: 4.0,
            tickTimer: 0.4,
            type: 'burn_crater',
            color: 0xff4400,
            damage: Math.round(player.stats.damage * 0.75)
          });
        }

        this.spawnProjectile(
          player.x + player.aimX * 1.0,
          player.y + player.aimY * 1.0,
          player.aimX * speed,
          player.aimY * speed,
          radius,
          dmg,
          true,
          0xff4400,
          pierce,
          'burn',
          isBounce ? 2 : 0
        );
        break;
      }

      case 'fighter': {
        // Whirlwind: 720-degree full-body spinning cyclone
        const hasCharges = player.hasAugment('fgt_whirl_charges');
        if (hasCharges) {
          const ch = (player.skillCharges['whirlwind'] || 0) + 1;
          if (ch < 2) {
            player.skillCharges['whirlwind'] = ch;
            player.skill1Cd = 0.35; // Instant second cast!
            particles.spawnFloatingText(player.x, 2.5, player.y, 'VORTICE PRONTO! (Carica 2/2)', '#ffea00');
          } else {
            player.skillCharges['whirlwind'] = 0;
            player.skill1Cd = 5.0 * (1 - player.stats.cooldownReduction / 100);
          }
        } else {
          player.skill1Cd = 5.0 * (1 - player.stats.cooldownReduction / 100);
        }

        const hasDuration = player.hasAugment('fgt_whirl_duration');
        const reach = hasDuration ? 6.2 : 4.8;
        player.currentAttackType = 'whirlwind';
        player.attackDuration = hasDuration ? 0.85 : 0.55;
        player.attackAnimTimer = player.attackDuration;
        sound.swing();
        this.spawnSlashArc(player.x, player.y, 0, reach, 0xffd700);
        particles.spawnShockwave(player.x, player.y, reach, 0xdfe6f2, 0.25);

        for (const e of enemies) {
          if (e.isDead) continue;
          const dx = e.x - player.x;
          const dy = e.y - player.y;
          const dist = Math.hypot(dx, dy);
          if (dist <= reach) {
            const dmg = Math.round(player.stats.damage * (hasDuration ? 3.6 : 2.6));
            e.takeDamage(dmg, dx, dy, 18);
            particles.spawnBurst(e.x, 1.0, e.y, 10, 0xffd700, 6);
            particles.spawnFloatingText(e.x, 2.2, e.y, `${dmg}`, '#ffd700', true);
          }
        }

        // Augment: Lame di Vento Trancianti (6 radial shockwaves)
        if (player.hasAugment('fgt_whirl_wind_blades')) {
          for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI * 2) / 6;
            const vx = Math.cos(angle) * 20;
            const vy = Math.sin(angle) * 20;
            this.spawnProjectile(player.x, player.y, vx, vy, 0.25, Math.round(player.stats.damage * 1.5), true, 0xffd700, 1);
          }
        }
        break;
      }

      case 'rogue': {
        // Sneak Attack: Fan of piercing stilettos
        player.skill1Cd = 4.5 * (1 - player.stats.cooldownReduction / 100);
        player.currentAttackType = 'sneak_attack';
        player.attackDuration = 0.35;
        player.attackAnimTimer = 0.35;
        sound.shootArrow();

        // Augment: Cortina Fumogena (Smoke cloud stun)
        if (player.hasAugment('rog_backstab_smoke')) {
          particles.spawnBurst(player.x, 0.8, player.y, 40, 0x223322, 6);
          particles.spawnShockwave(player.x, player.y, 5.0, 0x335533, 0.3);
          for (const e of enemies) {
            if (e.isDead) continue;
            if (Math.hypot(e.x - player.x, e.y - player.y) <= 5.0) {
              e.attackTimer = Math.max(e.attackTimer, 3.5);
              particles.spawnFloatingText(e.x, 2.2, e.y, '💨 ACCECATO!', '#88aa88');
            }
          }
        }

        const hasPoison = player.hasAugment('rog_backstab_poison');
        const isTriple = player.hasAugment('rog_backstab_triple');
        const count = isTriple ? 8 : 5;
        const fanSpread = isTriple ? 0.75 : 0.5;
        const baseAngle = Math.atan2(player.aimX, player.aimY);

        for (let i = 0; i < count; i++) {
          const angle = baseAngle + (i - (count - 1) / 2) * (fanSpread / (count - 1));
          const vx = Math.sin(angle) * 26;
          const vy = Math.cos(angle) * 26;
          this.spawnProjectile(
            player.x,
            player.y,
            vx,
            vy,
            0.22,
            Math.round(player.stats.damage * (isTriple ? 2.2 : 1.8)),
            true,
            hasPoison ? 0x22cc55 : 0x44d98a,
            isTriple ? 3 : 2,
            hasPoison ? 'poison' : undefined
          );
        }
        break;
      }

      case 'cleric': {
        // Flamestrike / Guiding Bolt: Celestial hammer ground slam
        player.skill1Cd = 5.2 * (1 - player.stats.cooldownReduction / 100);
        player.currentAttackType = 'flamestrike';
        player.attackDuration = 0.45;
        player.attackAnimTimer = 0.45;
        sound.smite();

        // Augment: Globi di Grazia Orbitanti (3 holy orbs)
        if (player.hasAugment('clr_flame_orbs')) {
          player.activeOrbs.push(
            { angle: 0, radius: 2.2, timer: 12, color: 0xffea00, damage: Math.round(player.stats.damage * 1.3), hitCooldown: 0, isHealing: true, healTick: 0 },
            { angle: (Math.PI * 2) / 3, radius: 2.2, timer: 12, color: 0xffea00, damage: Math.round(player.stats.damage * 1.3), hitCooldown: 0, isHealing: true, healTick: 0 },
            { angle: (Math.PI * 4) / 3, radius: 2.2, timer: 12, color: 0xffea00, damage: Math.round(player.stats.damage * 1.3), hitCooldown: 0, isHealing: true, healTick: 0 }
          );
          particles.spawnBurst(player.x, 1.2, player.y, 25, 0xffea00, 7);
          particles.spawnFloatingText(player.x, 2.5, player.y, '🌟 GLOBI DI GRAZIA!', '#ffea00', true);
        }

        // Augment: Onda Purificatrice
        if (player.hasAugment('clr_flame_purify')) {
          player.heal(30);
          particles.spawnFloatingText(player.x, 2.2, player.y, '+30 PV PURIFICAZIONE', '#55ff77');
        }

        const isPillar = player.hasAugment('clr_flame_pillar');
        const targetX = player.x + player.aimX * 6.0;
        const targetY = player.y + player.aimY * 6.0;
        const radius = isPillar ? 7.0 : 4.0;

        particles.spawnShockwave(targetX, targetY, radius, 0xffea00);
        particles.spawnBurst(targetX, 2.0, targetY, isPillar ? 50 : 30, 0xffea00, 8);

        for (const e of enemies) {
          if (e.isDead) continue;
          const dx = e.x - targetX;
          const dy = e.y - targetY;
          if (Math.hypot(dx, dy) <= radius) {
            const dmg = Math.round(player.stats.damage * (isPillar ? 3.8 : 2.7));
            e.takeDamage(dmg, dx, dy, 16);
            particles.spawnFloatingText(e.x, 2.0, e.y, `${dmg}`, '#ffea00', true);
          }
        }
        break;
      }
    }
  }

  public castSkill2(player: Player, room: DungeonRoom, enemies: Enemy[] = []): void {
    if (player.skill2Cd > 0) return;
    const s2 = player.subclass.skill2;
    const cdReduction = Math.min(0.5, player.stats.cooldownReduction / 100);
    player.skill2Cd = s2.cd * (1 - cdReduction);

    switch (s2.id) {
      // 1. Paladino - Devozione (Carica con Scudo Sacro)
      case 'holy_dash': {
        player.dashTimer = 0.28;
        player.invulnerableTimer = 0.38;
        sound.dash();
        sound.smite();
        particles.spawnBurst(player.x, 0.8, player.y, 16, 0xffea00, 6);
        particles.spawnShockwave(player.x, player.y, 3.5, 0xffea00, 0.2);

        // Augment: Bastione Radioso Etereo (+80 shield)
        if (player.hasAugment('pal_charge_bastion')) {
          player.bonusShield = Math.min(250, player.bonusShield + 80);
          particles.spawnFloatingText(player.x, 2.2, player.y, '🛡️ SCUDO SACRO (+80)', '#ffea00');
        }

        for (const e of enemies) {
          if (e.isDead) continue;
          const dx = e.x - player.x;
          const dy = e.y - player.y;
          const dist = Math.hypot(dx, dy);
          if (dist <= 3.2) {
            const dmg = Math.round(player.stats.damage * s2.damageMultiplier);
            e.takeDamage(dmg, dx, dy, 20);
            particles.spawnFloatingText(e.x, 2.2, e.y, `${dmg}`, '#ffea00', true);
          }
        }
        break;
      }

      // 2. Paladino - Vendetta (Fendente del Castigo con Spadone a Due Mani)
      case 'vengeance_slam': {
        player.currentAttackType = 'slam_down';
        player.attackDuration = 0.55;
        player.attackAnimTimer = 0.55;
        sound.smite();
        const hitX = player.x + player.aimX * 2.2;
        const hitY = player.y + player.aimY * 2.2;
        particles.spawnShockwave(hitX, hitY, 4.5, 0xffaa00, 0.25);
        particles.spawnBurst(hitX, 1.2, hitY, 24, 0xffea00, 8);

        let totalDmgDone = 0;
        for (const e of enemies) {
          if (e.isDead) continue;
          const dx = e.x - hitX;
          const dy = e.y - hitY;
          const dist = Math.hypot(dx, dy);
          if (dist <= 3.8) {
            const dmg = Math.round(player.stats.damage * s2.damageMultiplier * (player.stats.spellPower / 100));
            e.takeDamage(dmg, player.aimX, player.aimY, 24);
            particles.spawnFloatingText(e.x, 2.4, e.y, `💥 ${dmg}`, '#ffaa00', true);
            totalDmgDone += dmg;
          }
        }

        // Augment: Cratere della Redenzione (heals 35% of damage dealt)
        if (player.hasAugment('pal_vengeance_crater') && totalDmgDone > 0) {
          const healAmt = Math.round(totalDmgDone * 0.35);
          player.heal(healAmt);
          particles.spawnFloatingText(player.x, 2.4, player.y, `💖 +${healAmt} REDENZIONE`, '#55ff77');
        }
        break;
      }

      // 3. Mago - Evocazione (Passo Velato & Bufera con Bastone a Due Mani)
      case 'misty_step': {
        sound.dash();
        sound.mageBlast();
        particles.spawnBurst(player.x, 1.0, player.y, 20, 0x80d0ff, 6);
        particles.spawnShockwave(player.x, player.y, 4.2, 0x00e5ff, 0.3);

        // Augment: Doppio Passo Etereo (2 consecutive charges)
        if (player.hasAugment('wiz_misty_double_step')) {
          const ch = (player.skillCharges['misty'] || 0) + 1;
          if (ch < 2) {
            player.skillCharges['misty'] = ch;
            player.skill2Cd = 0.3; // ready immediately for second blink!
            particles.spawnFloatingText(player.x, 2.2, player.y, 'PASSO PRONTO (2/2)', '#00e5ff');
          } else {
            player.skillCharges['misty'] = 0;
          }
        }

        // Augment: Zero Assoluto (8 frost needles starburst)
        if (player.hasAugment('wiz_misty_zero_kelvin')) {
          for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8;
            this.spawnProjectile(
              player.x,
              player.y,
              Math.cos(angle) * 22,
              Math.sin(angle) * 22,
              0.2,
              Math.round(player.stats.damage * 1.6),
              true,
              0x00e5ff,
              2,
              'freeze'
            );
          }
        }

        for (const e of enemies) {
          if (e.isDead) continue;
          const dx = e.x - player.x;
          const dy = e.y - player.y;
          const dist = Math.hypot(dx, dy);
          if (dist <= 4.2) {
            const dmg = Math.round(player.stats.damage * s2.damageMultiplier * (player.stats.spellPower / 100));
            e.takeDamage(dmg, dx, dy, 10);
            particles.spawnFloatingText(e.x, 2.2, e.y, `❄️ ${dmg}`, '#00e5ff', true);
          }
        }

        const teleportDist = 5.5;
        const destX = player.x + player.aimX * teleportDist;
        const destY = player.y + player.aimY * teleportDist;
        if (!dungeon.isBlocked(room, destX, destY, player.radius)) {
          player.x = destX;
          player.y = destY;
        }
        particles.spawnBurst(player.x, 1.0, player.y, 20, 0x80d0ff, 6);
        break;
      }

      // 4. Mago - Trama (Singolarità Arcana con Bacchetta & Tomo)
      case 'arcane_singularity': {
        player.currentAttackType = 'mage_cast';
        player.attackDuration = 0.45;
        player.attackAnimTimer = 0.45;
        sound.fireball();
        const isSupermassive = player.hasAugment('wiz_singularity_supermassive');
        const radius = isSupermassive ? 7.5 : 5.0;
        const vortexX = player.x + player.aimX * 4.0;
        const vortexY = player.y + player.aimY * 4.0;
        particles.spawnShockwave(vortexX, vortexY, radius, 0xbb44ff, 0.4);
        particles.spawnBurst(vortexX, 1.2, vortexY, 35, 0xd066ff, 8);

        let affected = 0;
        for (const e of enemies) {
          if (e.isDead) continue;
          const dx = vortexX - e.x;
          const dy = vortexY - e.y;
          const dist = Math.hypot(dx, dy);
          if (dist <= radius) {
            const mult = isSupermassive ? 2.0 : 1.0;
            const dmg = Math.round(player.stats.damage * s2.damageMultiplier * mult * (player.stats.spellPower / 100));
            e.takeDamage(dmg, -dx, -dy, -18);
            particles.spawnFloatingText(e.x, 2.2, e.y, `🌀 ${dmg}`, '#b366ff', true);
            affected++;
          }
        }

        // Augment: Egida della Trama (shield per enemy pulled)
        if (player.hasAugment('wiz_singularity_shield') && affected > 0) {
          player.bonusShield = Math.min(250, player.bonusShield + affected * 35);
          particles.spawnFloatingText(player.x, 2.2, player.y, `🛡️ EGIDA (+${affected * 35})`, '#b366ff');
        }
        break;
      }

      // 5. Guerriero - Berserker (Danza delle Lame Gemelle con Doppie Spade)
      case 'flurry_rush': {
        player.currentAttackType = 'spin_360';
        player.attackDuration = 0.45;
        player.attackAnimTimer = 0.45;
        player.dashTimer = 0.25;
        player.invulnerableTimer = 0.45;
        sound.swing();
        this.spawnSlashArc(player.x, player.y, 0, 4.2, 0xff4444);
        particles.spawnBurst(player.x, 0.8, player.y, 22, 0xff3355, 7);

        // Augment: Frenesia dei Critici (100% crit chance for 4s)
        if (player.hasAugment('fgt_flurry_crit')) {
          player.flurryCritTimer = 4.0;
          player.invulnerableTimer = 0.8;
          particles.spawnFloatingText(player.x, 2.5, player.y, '🩸 FRENESIA DEI CRITICI (4s)!', '#ff2244', true);
        }

        for (const e of enemies) {
          if (e.isDead) continue;
          const dx = e.x - player.x;
          const dy = e.y - player.y;
          const dist = Math.hypot(dx, dy);
          if (dist <= 4.2) {
            const dmg = Math.round(player.stats.damage * s2.damageMultiplier);
            e.takeDamage(dmg, dx, dy, 14);
            particles.spawnFloatingText(e.x, 2.2, e.y, `⚔️ ${dmg}`, '#ff4444', true);
          }
        }
        break;
      }

      // 6. Guerriero - Colosso (Schiacciata Sismica con Spadone/Ascia a Due Mani)
      case 'seismic_slam': {
        player.currentAttackType = 'slam_down';
        player.attackDuration = 0.55;
        player.attackAnimTimer = 0.55;
        sound.explosion();
        const isFissure = player.hasAugment('fgt_seismic_fissure');
        const slamX = player.x + player.aimX * 1.8;
        const slamY = player.y + player.aimY * 1.8;
        const radius = isFissure ? 7.5 : 5.5;
        particles.spawnShockwave(slamX, slamY, radius, 0xff9900, 0.3);
        particles.spawnBurst(slamX, 1.2, slamY, isFissure ? 50 : 32, 0xffbb33, 9);

        for (const e of enemies) {
          if (e.isDead) continue;
          const dx = e.x - slamX;
          const dy = e.y - slamY;
          const dist = Math.hypot(dx, dy);
          if (dist <= radius) {
            const dmg = Math.round(player.stats.damage * s2.damageMultiplier * (isFissure ? 1.6 : 1.0));
            e.takeDamage(dmg, dx, dy, 26);
            particles.spawnFloatingText(e.x, 2.4, e.y, `💥 ${dmg}`, '#ffaa00', true);
          }
        }
        break;
      }

      // 7. Ladro - Assassino (Passo d’Ombra & Ventaglio di Pugnali Furtivi)
      case 'shadow_roll': {
        const is16 = player.hasAugment('rog_shadow_fan_16');
        player.dashTimer = 0.28;
        player.invulnerableTimer = is16 ? 0.85 : 0.45;
        sound.dash();
        sound.shootArrow();
        particles.spawnBurst(player.x, 0.6, player.y, 20, 0x112211, 5);

        const daggerCount = is16 ? 16 : 8;
        const daggerDmg = Math.round(player.stats.damage * s2.damageMultiplier * (is16 ? 1.3 : 1.0));
        for (let i = 0; i < daggerCount; i++) {
          const angle = (i * Math.PI * 2) / daggerCount;
          const vx = Math.cos(angle) * 22;
          const vy = Math.sin(angle) * 22;
          this.spawnProjectile(player.x, player.y, vx, vy, 0.25, daggerDmg, true, 0x44d98a, 0);
        }
        break;
      }

      // 8. Ladro - Cacciatore (Pioggia di Frecce con Arco Composito)
      case 'arrow_rain': {
        player.currentAttackType = 'bow_shot';
        player.attackDuration = 0.40;
        player.attackAnimTimer = 0.40;
        sound.shootArrow();
        const baseAngle = Math.atan2(player.aimX, player.aimY);
        const isCluster = player.hasAugment('rog_arrow_cluster');
        const count = isCluster ? 14 : 7;
        const spread = isCluster ? 0.85 : 0.55;
        const arrowDmg = Math.round(player.stats.damage * s2.damageMultiplier * (isCluster ? 0.65 : 0.45));

        for (let i = 0; i < count; i++) {
          const angle = baseAngle + (i - (count - 1) / 2) * (spread / (count - 1));
          const vx = Math.sin(angle) * 26;
          const vy = Math.cos(angle) * 26;
          this.spawnProjectile(player.x, player.y, vx, vy, 0.28, arrowDmg, true, 0xffd700, isCluster ? 2 : 0);
        }
        break;
      }

      // 9. Chierico - Vita (Santuario Guaritore con Mazza & Scudo)
      case 'healing_word': {
        player.currentAttackType = 'roar_buff';
        player.attackDuration = 0.42;
        player.attackAnimTimer = 0.42;
        sound.heal();
        const isSanctuary = player.hasAugment('clr_heal_sanctuary');
        const healAmt = isSanctuary ? 85 : 45;
        const healed = player.heal(healAmt);
        particles.spawnShockwave(player.x, player.y, 5.5, 0x55ff77, 0.3);
        particles.spawnBurst(player.x, 1.2, player.y, 25, 0x88ffaa, 6);
        particles.spawnFloatingText(player.x, 2.4, player.y, `💖 +${healed} PV`, '#55ff77', true);

        if (isSanctuary) {
          this.lingeringZones.push({
            x: player.x,
            y: player.y,
            radius: 4.8,
            timer: 6.0,
            tickTimer: 0.6,
            type: 'sanctuary',
            color: 0x55ff77,
            heal: 14,
            damage: Math.round(player.stats.damage * 0.8)
          });
          particles.spawnFloatingText(player.x, 2.7, player.y, '🌿 SANTUARIO VIVENTE ATTIVO!', '#55ff77', true);
        }

        for (const e of enemies) {
          if (e.isDead) continue;
          const dx = e.x - player.x;
          const dy = e.y - player.y;
          const dist = Math.hypot(dx, dy);
          if (dist <= 5.0) {
            e.takeDamage(Math.round(player.stats.damage * 1.4), dx, dy, 24);
          }
        }
        break;
      }

      // 10. Chierico - Tempesta (Ira della Tempesta con Bastone a Due Mani)
      case 'thunder_judgement': {
        player.currentAttackType = 'mage_cast';
        player.attackDuration = 0.45;
        player.attackAnimTimer = 0.45;
        sound.lightning();
        sound.explosion();
        const isTriple = player.hasAugment('clr_thunder_triple');
        particles.spawnShockwave(player.x, player.y, 6.5, 0x99ddff, 0.35);

        const targetCount = isTriple ? 8 : 4;
        const sorted = [...enemies]
          .filter(e => !e.isDead)
          .sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y))
          .slice(0, targetCount);

        for (const e of sorted) {
          const dmg = Math.round(player.stats.damage * s2.damageMultiplier * (isTriple ? 1.5 : 1.0) * (player.stats.spellPower / 100));
          e.takeDamage(dmg, e.x - player.x, e.y - player.y, 18);
          particles.spawnBurst(e.x, 1.2, e.y, 24, 0x00ffff, 8);
          particles.spawnFloatingText(e.x, 2.5, e.y, `⚡ ${dmg}`, '#00ffff', true);
        }
        break;
      }
    }
  }

  public handleEnemyAttack(e: Enemy, targetX: number, targetY: number, player: Player): void {
    const dx = targetX - e.x;
    const dy = targetY - e.y;
    const dist = Math.hypot(dx, dy) || 1;
    const dirX = dx / dist;
    const dirY = dy / dist;

    e.attackCount = (e.attackCount || 0) + 1;

    // Helper to deal damage to player and process Elite Affixes (e.g. Vampiric lifesteal)
    const dealEnemyDmg = (rawDmg: number, label?: string, isCrit = false): number => {
      const dmg = player.takeDamage(rawDmg);
      if (dmg > 0) {
        sound.playerHurt();
        this.addScreenShake(isCrit ? 0.35 : 0.22);
        particles.spawnFloatingText(player.x, 2.2, player.y, label ? `-${dmg} ${label}` : `-${dmg}`, '#ff3b30', isCrit);
        if (e.stats.affix === 'vampiric') {
          const healAmt = Math.round(dmg * 0.65);
          e.hp = Math.min(e.maxHp, e.hp + healAmt);
          particles.spawnFloatingText(e.x, 2.2, e.y, `+${healAmt} 🩸 VAMPIRISMO`, '#dc2626', true);
          particles.spawnBurst(e.x, 1.0, e.y, 8, 0xdc2626, 3);
        }
      }
      return dmg;
    };

    // --- 1. BOSS SPECIAL MOVESETS ---

    // Boss 1: Capitano Grummak il Frantumatore (4 Distinct Attack Patterns)
    if (e.type === 'boss_grummak') {
      const pattern = e.attackCount % 4;

      if (pattern === 0) {
        // Pattern A: Earthquake Slam (Massive 5.5m ground shockwave AoE)
        telegraphs.createCircle(e.x, e.y, 5.5, 0.75, 0x853229, () => {
          sound.heavyChop();
          particles.spawnShockwave(e.x, e.y, 5.5, 0x853229, 0.4);
          particles.spawnBurst(e.x, 1.2, e.y, 35, 0xff5533, 8);
          if (Math.hypot(player.x - e.x, player.y - e.y) <= 5.5) {
            dealEnemyDmg(Math.round(e.stats.damage * 1.5), 'TERREMOTO!', true);
          }
        });
      } else if (pattern === 1) {
        // Pattern B: Molten Rubble Volley (Tri-directional fiery boulder blast)
        sound.fireball();
        const baseAngle = Math.atan2(dirX, dirY);
        for (let i = -1; i <= 1; i++) {
          const a = baseAngle + i * 0.32;
          const vx = Math.sin(a) * 16;
          const vy = Math.cos(a) * 16;
          this.spawnProjectile(e.x + dirX * 0.8, e.y + dirY * 0.8, vx, vy, 0.35, e.stats.damage, false, 0xd45020, 0);
        }
      } else if (pattern === 2) {
        // Pattern C: Bull Charge & Impact Crash
        telegraphs.createCircle(targetX, targetY, 2.6, 0.6, 0xff3b30, () => {
          e.knockbackX = dirX * 22;
          e.knockbackY = dirY * 22;
          sound.heavyChop();
          particles.spawnShockwave(targetX, targetY, 3.0, 0xff3b30, 0.3);
          if (Math.hypot(player.x - targetX, player.y - targetY) < 2.6) {
            dealEnemyDmg(Math.round(e.stats.damage * 1.4), 'CARICA!', true);
          }
        });
      } else {
        // Pattern D: Colossal Cleave (Front-facing heavy cleave)
        sound.heavyChop();
        particles.spawnShockwave(e.x + dirX * 1.8, e.y + dirY * 1.8, 3.4, 0xff5533, 0.25);
        if (dist <= 3.8) {
          dealEnemyDmg(Math.round(e.stats.damage * 1.25), undefined, true);
        }
      }
      return;
    }

    // Boss 2: Regina Spettrale Vaeloria (4 Distinct Attack Patterns)
    if (e.type === 'boss_vaeloria') {
      const pattern = e.attackCount % 4;

      if (pattern === 0) {
        // Pattern A: Soul Nova (Targeted ethereal vortex under the player)
        const sx = targetX;
        const sy = targetY;
        telegraphs.createCircle(sx, sy, 3.6, 0.8, 0x00ffff, () => {
          sound.mageBlast();
          particles.spawnShockwave(sx, sy, 3.8, 0x00ffff, 0.35);
          particles.spawnBurst(sx, 1.5, sy, 30, 0x00ffff, 7);
          if (Math.hypot(player.x - sx, player.y - sy) <= 3.6) {
            dealEnemyDmg(Math.round(e.stats.damage * 1.55), "NOVA D'ANIMA!", true);
          }
        });
      } else if (pattern === 1) {
        // Pattern B: Spectral Barrage (Fan of 5 ethereal seeking missiles)
        sound.mageBlast();
        const baseAngle = Math.atan2(dirX, dirY);
        for (let i = 0; i < 5; i++) {
          const a = baseAngle + (i - 2) * 0.22;
          const vx = Math.sin(a) * 16;
          const vy = Math.cos(a) * 16;
          this.spawnProjectile(e.x, e.y, vx, vy, 0.3, Math.round(e.stats.damage * 0.9), false, 0x00ffff, 0);
        }
      } else if (pattern === 2) {
        // Pattern C: Phantom Blink & Ambush Strike
        particles.spawnBurst(e.x, 1.2, e.y, 20, 0x00ffff, 5);
        sound.dash();
        // Reposition close to player flank
        e.x = player.x - dirX * 2.2;
        e.y = player.y - dirY * 2.2;
        particles.spawnBurst(e.x, 1.2, e.y, 20, 0x00ffff, 5);
        sound.swing();
        particles.spawnShockwave(e.x, e.y, 3.0, 0x4de0e8, 0.25);
        if (Math.hypot(player.x - e.x, player.y - e.y) <= 3.0) {
          dealEnemyDmg(Math.round(e.stats.damage * 1.2), 'AGGUATO!', true);
        }
      } else {
        // Pattern D: Wail of the Banshee (Large AoE Shockwave around her)
        telegraphs.createCircle(e.x, e.y, 6.0, 0.7, 0x4de0e8, () => {
          sound.dragonRoar();
          particles.spawnShockwave(e.x, e.y, 6.0, 0x4de0e8, 0.4);
          if (Math.hypot(player.x - e.x, player.y - e.y) <= 6.0) {
            dealEnemyDmg(Math.round(e.stats.damage * 1.35), 'URLO SPIRITUALE!', true);
          }
        });
      }
      return;
    }

    // Boss 3: Vorrash, Signore di Isargard (4 Distinct Attack Patterns)
    if (e.type === 'boss_troll_warlord') {
      const pattern = e.attackCount % 4;

      if (pattern === 0) {
        // Pattern A: Toxic Ground Pound (Huge poisonous AoE)
        telegraphs.createCircle(e.x, e.y, 5.5, 0.8, 0x567d36, () => {
          sound.heavyChop();
          particles.spawnShockwave(e.x, e.y, 5.5, 0x3d5c38, 0.4);
          particles.spawnBurst(e.x, 1.2, e.y, 32, 0x567d36, 8);
          if (Math.hypot(player.x - e.x, player.y - e.y) <= 5.5) {
            dealEnemyDmg(Math.round(e.stats.damage * 1.5), 'IMPATTO TOSSICO!', true);
          }
        });
      } else if (pattern === 1) {
        // Pattern B: Colossal Boulder Throw (Heavy projectile with impact explosion)
        sound.breakProp();
        const vx = dirX * 15;
        const vy = dirY * 15;
        this.spawnProjectile(e.x + dirX * 1.0, e.y + dirY * 1.0, vx, vy, 0.65, Math.round(e.stats.damage * 1.35), false, 0x4a4035, 0);
      } else if (pattern === 2) {
        // Pattern C: Troll Rampage Stampede
        telegraphs.createCircle(targetX, targetY, 2.8, 0.6, 0x567d36, () => {
          e.knockbackX = dirX * 22;
          e.knockbackY = dirY * 22;
          sound.heavyChop();
          particles.spawnShockwave(targetX, targetY, 3.2, 0x567d36, 0.3);
          if (Math.hypot(player.x - targetX, player.y - targetY) < 2.8) {
            dealEnemyDmg(Math.round(e.stats.damage * 1.4), 'TRAVOLGIMENTO!', true);
          }
        });
      } else {
        // Pattern D: Heavy Club Sweep with knockback
        sound.heavyChop();
        particles.spawnShockwave(e.x + dirX * 2.0, e.y + dirY * 2.0, 3.8, 0x8a5438, 0.3);
        if (dist <= 4.2) {
          dealEnemyDmg(Math.round(e.stats.damage * 1.25), undefined, true);
        }
      }
      return;
    }

    // Boss 4: Khloron Goldenhorn, Terrore di Elanthria (Epic 3-Phase Legendary Encounter)
    if (e.type === 'boss_dragon_vermithrax') {
      const phase = e.bossPhase || 1;

      if (phase === 1) {
        // === FASE 1: DRAGO GUERRIERO ARMATO (100% - 60% HP) ===
        const pattern = e.attackCount % 4;

        if (pattern === 0) {
          // Pattern A: Colpo di Coda ad Area (180° sweep with golden shockwave)
          sound.heavyChop();
          telegraphs.createCircle(e.x - dirX * 1.5, e.y - dirY * 1.5, 4.2, 0.65, 0xffd700, () => {
            sound.dragonRoar();
            particles.spawnShockwave(e.x, e.y, 4.5, 0xffd700, 0.35);
            particles.spawnBurst(e.x, 1.2, e.y, 25, 0xd4af37, 7);
            if (dist <= 4.2) {
              player.knockbackX = -dirX * 16;
              player.knockbackY = -dirY * 16;
              dealEnemyDmg(Math.round(e.stats.damage * 1.2), 'SPAZZATA DI CODA!', true);
            }
          });
        } else if (pattern === 1) {
          // Pattern B: Raffica d'Ala Repellente (Shockwave wind burst + 3 fireballs)
          sound.swing();
          particles.spawnShockwave(e.x + dirX * 2.0, e.y + dirY * 2.0, 5.0, 0xfef08a, 0.4);
          player.knockbackX = dirX * 18;
          player.knockbackY = dirY * 18;
          dealEnemyDmg(Math.round(e.stats.damage * 0.75), 'RAFFICA D\'ALA!');

          const baseAngle = Math.atan2(dirX, dirY);
          [-0.25, 0, 0.25].forEach((offset) => {
            const a = baseAngle + offset;
            this.spawnProjectile(e.x, e.y, Math.sin(a) * 14, Math.cos(a) * 14, 0.38, Math.round(e.stats.damage * 0.8), false, 0xffaa00, 0, 'burn');
          });
        } else if (pattern === 2) {
          // Pattern C: Soffio d'Oro Fuso (Fan of 9 molten golden fireballs)
          sound.dragonRoar();
          const numFireballs = 9;
          const spread = Math.PI * 0.52;
          const baseAngle = Math.atan2(dirX, dirY);
          for (let i = 0; i < numFireballs; i++) {
            const a = baseAngle + (i - (numFireballs - 1) / 2) * (spread / (numFireballs - 1));
            const vx = Math.sin(a) * 15;
            const vy = Math.cos(a) * 15;
            this.spawnProjectile(e.x, e.y, vx, vy, 0.42, e.stats.damage, false, 0xffd700, 0, 'burn');
          }
        } else {
          // Pattern D: Balzo Sismico e Schianto Dorato
          telegraphs.createCircle(targetX, targetY, 3.4, 0.7, 0xffd700, () => {
            e.knockbackX = dirX * 20;
            e.knockbackY = dirY * 20;
            sound.dragonRoar();
            this.addScreenShake(0.5);
            particles.spawnShockwave(targetX, targetY, 4.0, 0xffd700, 0.4);
            particles.spawnBurst(targetX, 1.4, targetY, 30, 0xffaa00, 8);
            if (Math.hypot(player.x - targetX, player.y - targetY) < 3.4) {
              dealEnemyDmg(Math.round(e.stats.damage * 1.35), 'SCHIANTO DORATO!', true);
            }
          });
        }

      } else if (phase === 2) {
        // === FASE 2: IRA SMERALDINA & RUGGITO SISMICO (60% - 25% HP) ===
        const pattern = e.attackCount % 4;

        if (pattern === 0) {
          // Pattern A: Nube Tossica Smeraldo (Poison gas projectiles)
          sound.dragonRoar();
          [-0.35, -0.12, 0.12, 0.35].forEach((off) => {
            const a = Math.atan2(dirX, dirY) + off;
            const spd = 12;
            this.spawnProjectile(e.x, e.y, Math.sin(a) * spd, Math.cos(a) * spd, 0.48, Math.round(e.stats.damage * 0.9), false, 0x10b981, 0, 'poison');
          });
          particles.spawnBurst(e.x, 1.2, e.y, 25, 0x10b981, 6);
        } else if (pattern === 1) {
          // Pattern B: Ruggito Sismico Stordente
          sound.dragonRoar();
          this.addScreenShake(0.85);
          telegraphs.createCircle(e.x, e.y, 6.5, 0.8, 0x10b981, () => {
            particles.spawnShockwave(e.x, e.y, 6.5, 0x10b981, 0.5);
            particles.spawnBurst(e.x, 1.5, e.y, 35, 0x34d399, 8);
            if (Math.hypot(player.x - e.x, player.y - e.y) <= 6.5) {
              dealEnemyDmg(Math.round(e.stats.damage * 1.4), 'RUGGITO SISMICO!', true);
              player.knockbackX = dirX * 12;
              player.knockbackY = dirY * 12;
            }
          });
        } else if (pattern === 2) {
          // Pattern C: Raffica Tripla Guidata
          sound.fireball();
          const baseAngle = Math.atan2(dirX, dirY);
          for (let i = 0; i < 5; i++) {
            const a = baseAngle + (i - 2) * 0.22;
            this.spawnProjectile(e.x, e.y, Math.sin(a) * 16, Math.cos(a) * 16, 0.36, Math.round(e.stats.damage * 1.1), false, 0x059669, 0, 'poison');
          }
        } else {
          // Pattern D: Picchiata Smeraldina Rapida
          telegraphs.createCircle(targetX, targetY, 3.0, 0.5, 0x10b981, () => {
            e.knockbackX = dirX * 26;
            e.knockbackY = dirY * 26;
            sound.dragonRoar();
            particles.spawnShockwave(targetX, targetY, 3.6, 0x10b981, 0.35);
            if (Math.hypot(player.x - targetX, player.y - targetY) < 3.0) {
              dealEnemyDmg(Math.round(e.stats.damage * 1.35), 'PICCHIATA SMERALDINA!', true);
            }
          });
        }

      } else {
        // === FASE 3: APOTEOSI D'ORO (< 25% HP) ===
        const pattern = e.attackCount % 4;

        if (pattern === 0) {
          // Pattern A: Pioggia di Meteore Dorate (5 simultaneous celestial golden impacts!)
          sound.dragonRoar();
          this.addScreenShake(0.9);
          const meteorOffsets = [
            { ox: 0, oy: 0 },
            { ox: -4.0, oy: 2.5 },
            { ox: 4.0, oy: -2.5 },
            { ox: -2.5, oy: -3.5 },
            { ox: 2.5, oy: 3.5 }
          ];
          meteorOffsets.forEach((off) => {
            const mx = targetX + off.ox;
            const my = targetY + off.oy;
            telegraphs.createCircle(mx, my, 2.6, 0.75, 0xffd700, () => {
              sound.fireball();
              this.addScreenShake(0.4);
              particles.spawnShockwave(mx, my, 3.2, 0xffd700, 0.4);
              particles.spawnBurst(mx, 1.8, my, 30, 0xffaa00, 9);
              if (Math.hypot(player.x - mx, player.y - my) <= 2.6) {
                dealEnemyDmg(Math.round(e.stats.damage * 1.55), 'METEORA D\'ORO!', true);
              }
            });
          });
        } else if (pattern === 1) {
          // Pattern B: Soffio del Sole d'Oro (Hyperbeam of 13 golden fireballs)
          sound.dragonRoar();
          const numFireballs = 13;
          const spread = Math.PI * 0.65;
          const baseAngle = Math.atan2(dirX, dirY);
          for (let i = 0; i < numFireballs; i++) {
            const a = baseAngle + (i - (numFireballs - 1) / 2) * (spread / (numFireballs - 1));
            this.spawnProjectile(e.x, e.y, Math.sin(a) * 16.5, Math.cos(a) * 16.5, 0.45, Math.round(e.stats.damage * 1.15), false, 0xffd700, 0, 'burn');
          }
        } else if (pattern === 2) {
          // Pattern C: Cataclisma Solare Radiante (Devastating 8.5m explosion)
          telegraphs.createCircle(e.x, e.y, 8.5, 0.85, 0xffaa00, () => {
            sound.dragonRoar();
            this.addScreenShake(1.2);
            particles.spawnShockwave(e.x, e.y, 8.5, 0xffd700, 0.6);
            particles.spawnBurst(e.x, 2.0, e.y, 55, 0xffd700, 11);
            if (Math.hypot(player.x - e.x, player.y - e.y) <= 8.5) {
              dealEnemyDmg(Math.round(e.stats.damage * 1.85), 'CATACLISMA D\'ORO!', true);
            }
          });
        } else {
          // Pattern D: Carica Sismica Supersonica (Super speed dash)
          telegraphs.createCircle(targetX, targetY, 3.5, 0.45, 0xffd700, () => {
            e.knockbackX = dirX * 30;
            e.knockbackY = dirY * 30;
            sound.dragonRoar();
            this.addScreenShake(0.6);
            particles.spawnShockwave(targetX, targetY, 4.2, 0xffd700, 0.4);
            if (Math.hypot(player.x - targetX, player.y - targetY) < 3.5) {
              dealEnemyDmg(Math.round(e.stats.damage * 1.6), 'CARICA DEL TITANO!', true);
            }
          });
        }
      }
      return;
    }

    // --- 2. STANDARD MONSTER ATTACKS WITH DYNAMIC VARIATION ---
    switch (e.stats.attackType) {
      case 'melee': {
        const isLunge = e.attackCount % 2 === 1;
        const reach = isLunge ? e.stats.attackRange * 1.35 : e.stats.attackRange + 0.3;

        if (dist <= reach) {
          if (isLunge) {
            sound.thrust();
            // Lunge forward step
            e.knockbackX = dirX * 6;
            e.knockbackY = dirY * 6;
            particles.spawnShockwave(e.x + dirX * 1.0, e.y + dirY * 1.0, 1.8, e.stats.color, 0.2);
          } else {
            sound.swing();
          }

          const mult = isLunge ? 1.25 : 1.0;
          dealEnemyDmg(Math.round(e.stats.damage * mult), isLunge ? 'AFFONDO!' : undefined, isLunge);
        }
        break;
      }

      case 'projectile': {
        const isBurst = e.attackCount % 3 === 2;
        sound.fireball();

        if (isBurst) {
          // Double shot spread
          const baseAngle = Math.atan2(dirX, dirY);
          [-0.15, 0.15].forEach((offsetAngle) => {
            const a = baseAngle + offsetAngle;
            const spd = 13;
            this.spawnProjectile(
              e.x + dirX * 0.8,
              e.y + dirY * 0.8,
              Math.sin(a) * spd,
              Math.cos(a) * spd,
              0.28,
              Math.round(e.stats.damage * 0.85),
              false,
              e.stats.color,
              0
            );
          });
        } else {
          const spd = 12;
          this.spawnProjectile(
            e.x + dirX * 0.8,
            e.y + dirY * 0.8,
            dirX * spd,
            dirY * spd,
            0.3,
            e.stats.damage,
            false,
            e.stats.color,
            0
          );
        }
        break;
      }

      case 'charge': {
        const isFrenzy = e.attackCount % 3 === 0 && dist < 2.5;

        if (isFrenzy) {
          // Close-quarters frenzy strike
          sound.heavyChop();
          particles.spawnBurst(player.x, 1.0, player.y, 14, 0x8f2d25, 5);
          dealEnemyDmg(Math.round(e.stats.damage * 1.3), 'FURIA!', true);
        } else {
          telegraphs.createCircle(targetX, targetY, 2.2, 0.55, 0xff3b30, () => {
            e.knockbackX = dirX * 19;
            e.knockbackY = dirY * 19;
            if (Math.hypot(player.x - targetX, player.y - targetY) < 2.2) {
              dealEnemyDmg(Math.round(e.stats.damage * 1.3));
            }
          });
        }
        break;
      }

      case 'aoe': {
        const isBoss = !!e.stats.isBoss;
        const radius = isBoss ? 6.5 : 5.0;
        const duration = isBoss ? 0.95 : 0.8;
        const bossColor = e.stats.color || 0xff3b30;

        telegraphs.createCircle(e.x, e.y, radius, duration, bossColor, () => {
          sound.dragonRoar();
          this.addScreenShake(isBoss ? 0.6 : 0.35);
          particles.spawnShockwave(e.x, e.y, radius, bossColor, 0.45);
          particles.spawnBurst(e.x, 1.0, e.y, isBoss ? 45 : 30, bossColor, 9);

          if (Math.hypot(player.x - e.x, player.y - e.y) <= radius) {
            dealEnemyDmg(Math.round(e.stats.damage * (isBoss ? 1.6 : 1.5)), isBoss ? 'FRANTUMAZIONE!' : undefined, true);
          }

          // Hades-style Expanding Shockwave Ring (i-frame dashable!)
          if (isBoss) {
            this.spawnShockwaveRing(e.x, e.y, 1.0, 14.0, 8.5, Math.round(e.stats.damage * 0.9), bossColor);

            // Phase 2 (< 50% HP): Bosses unleash distinct bullet-hell patterns
            const isPhase2 = e.hp <= e.maxHp * 0.5;
            if (isPhase2) {
              if (e.type === 'boss_grummak') {
                this.spawnBulletHellSpiral(e.x, e.y, 8, 9.0, (e.attackCount * 0.35), 0xd97706, Math.round(e.stats.damage * 0.7));
              } else if (e.type === 'boss_vaeloria') {
                this.spawnBulletHellSpiral(e.x, e.y, 12, 10.0, (e.attackCount * 0.5), 0x38bdf8, Math.round(e.stats.damage * 0.75));
              } else if (e.type === 'boss_troll_warlord') {
                setTimeout(() => {
                  this.spawnShockwaveRing(e.x, e.y, 1.0, 14.5, 9.0, Math.round(e.stats.damage * 0.85), 0x22c55e);
                }, 350);
              }
            }
          }
        });
        break;
      }

      case 'dragon_breath': {
        sound.dragonRoar();
        this.addScreenShake(0.5);
        const numFireballs = 7;
        const spread = Math.PI * 0.48;
        const baseAngle = Math.atan2(dirX, dirY);

        for (let i = 0; i < numFireballs; i++) {
          const a = baseAngle + (i - (numFireballs - 1) / 2) * (spread / (numFireballs - 1));
          const vx = Math.sin(a) * 14;
          const vy = Math.cos(a) * 14;
          this.spawnProjectile(e.x, e.y, vx, vy, 0.42, e.stats.damage, false, 0xff3300, 0);
        }

        // Draconic Ground Stomp Shockwave Ring
        this.spawnShockwaveRing(e.x, e.y, 1.2, 14.5, 9.2, Math.round(e.stats.damage * 0.95), 0xff4400);

        // Phase 2 (< 60% HP): Dragon triggers rotating bullet-hell flame spiral
        if (e.hp <= e.maxHp * 0.6) {
          const spiralCount = e.hp <= e.maxHp * 0.3 ? 18 : 12;
          this.spawnBulletHellSpiral(e.x, e.y, spiralCount, 10.5, (e.attackCount * 0.4), 0xff6600, Math.round(e.stats.damage * 0.8));
        }
        break;
      }
    }
  }

  public spawnProjectile(
    x: number,
    y: number,
    vx: number,
    vy: number,
    radius: number,
    damage: number,
    isPlayer: boolean,
    color: number,
    pierce = 0,
    onHitEffect?: 'burn' | 'smite' | 'freeze' | 'poison',
    bounces = 0
  ): Projectile {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 8, 8), getBasic(color));
    mesh.position.set(x, 1.1, y);
    this.group.add(mesh);

    const proj: Projectile = {
      mesh,
      x,
      y,
      vx,
      vy,
      radius,
      damage,
      life: 2.5,
      isPlayer,
      color,
      pierce,
      bounces,
      onHitEffect
    };

    this.projectiles.push(proj);
    return proj;
  }

  public update(dt: number, player: Player, enemies: Enemy[], room: DungeonRoom): void {
    // 0. Update Active Player Orbiting Spheres (Fire & Holy Orbs from Skill Augments)
    // 0.1 Update Expanding Shockwave Rings (Hades Dash / i-frame mechanics)
    for (let i = this.shockwaveRings.length - 1; i >= 0; i--) {
      const ring = this.shockwaveRings[i];
      ring.radius += ring.speed * dt;
      ring.mesh.scale.set(ring.radius, ring.radius, 1);

      const distToCenter = Math.hypot(player.x - ring.x, player.y - ring.y);
      const isTouchingRing = Math.abs(distToCenter - ring.radius) <= ring.thickness;

      if (isTouchingRing && !ring.hitPlayer) {
        if (player.dashTimer > 0 || player.invulnerableTimer > 0) {
          // Clean i-frame dash through the expanding wave!
          sound.whoosh();
          particles.spawnBurst(player.x, 1.0, player.y, 8, 0x38bdf8, 4);
          particles.spawnFloatingText(player.x, 2.2, player.y, '⚡ SCHIVATA PERFETTA!', '#38bdf8', true, 'large');
          ring.hitPlayer = true;
        } else {
          ring.hitPlayer = true;
          const dmg = player.takeDamage(ring.damage);
          if (dmg > 0) {
            sound.playerHurt();
            this.addScreenShake(0.45);
            particles.spawnBurst(player.x, 1.0, player.y, 16, ring.color, 6);
            particles.spawnFloatingText(player.x, 2.4, player.y, `-${dmg} ONDA D'URTO!`, '#ff2200', true);
            const pushAngle = Math.atan2(player.y - ring.y, player.x - ring.x);
            player.x += Math.cos(pushAngle) * 0.8;
            player.y += Math.sin(pushAngle) * 0.8;
          }
        }
      }

      if (ring.radius >= ring.maxRadius) {
        this.group.remove(ring.mesh);
        ring.mesh.geometry.dispose();
        this.shockwaveRings.splice(i, 1);
      }
    }
    if (player.activeOrbs && player.activeOrbs.length > 0) {
      for (const orb of player.activeOrbs) {
        if (orb.hitCooldown !== undefined && orb.hitCooldown > 0) {
          orb.hitCooldown -= dt;
        }
        if (orb.isHealing) {
          orb.healTick = (orb.healTick || 0) + dt;
          if (orb.healTick >= 1.2) {
            orb.healTick = 0;
            const healed = player.heal(4);
            if (healed > 0) {
              particles.spawnFloatingText(player.x, 2.2, player.y, `+${healed} GRAZIA`, '#ffea00');
            }
          }
        }
        const ox = player.x + Math.cos(orb.angle) * orb.radius;
        const oy = player.y + Math.sin(orb.angle) * orb.radius;
        if (Math.random() < 0.25) {
          particles.spawnBurst(ox, 1.1, oy, 1, orb.color, 1.8);
        }
        for (const e of enemies) {
          if (e.isDead) continue;
          if (Math.hypot(e.x - ox, e.y - oy) < e.stats.radius + 0.45) {
            if (!orb.hitCooldown || orb.hitCooldown <= 0) {
              orb.hitCooldown = 0.35; // Throttle hits to max ~3 per second
              e.takeDamage(orb.damage, Math.cos(orb.angle), Math.sin(orb.angle), 6);
              particles.spawnBurst(e.x, 1.1, e.y, 6, orb.color, 4);
              particles.spawnFloatingText(e.x, 2.0, e.y, `${orb.damage}`, '#ffea00');
              sound.hitEnemy();
              if (orb.color === 0xff4400) {
                e.applyStatusEffect('burn', 2.5, 4);
              }
            }
          }
        }
      }
    }

    // 0b. Update Lingering Zones (Healing Sanctuary, Burning Craters, Smoke Screens)
    for (let i = this.lingeringZones.length - 1; i >= 0; i--) {
      const z = this.lingeringZones[i];
      z.timer -= dt;
      z.tickTimer -= dt;
      if (Math.random() < 0.3) {
        const rx = z.x + (Math.random() - 0.5) * z.radius * 1.6;
        const ry = z.y + (Math.random() - 0.5) * z.radius * 1.6;
        particles.spawnBurst(rx, 0.3, ry, 1, z.color, 1.5);
      }
      if (z.tickTimer <= 0) {
        z.tickTimer = 0.6;
        if (z.type === 'sanctuary') {
          if (Math.hypot(player.x - z.x, player.y - z.y) <= z.radius) {
            const healed = player.heal(z.heal || 12);
            if (healed > 0) {
              particles.spawnFloatingText(player.x, 2.2, player.y, `+${healed} SANTUARIO`, '#55ff77');
            }
          }
          for (const e of enemies) {
            if (e.isDead) continue;
            if (Math.hypot(e.x - z.x, e.y - z.y) <= z.radius) {
              e.takeDamage(z.damage || 14, e.x - z.x, e.y - z.y, 2);
              particles.spawnFloatingText(e.x, 1.8, e.y, `☀️ ${z.damage || 14}`, '#ffea00');
            }
          }
        } else if (z.type === 'burn_crater') {
          for (const e of enemies) {
            if (e.isDead) continue;
            if (Math.hypot(e.x - z.x, e.y - z.y) <= z.radius) {
              e.takeDamage(z.damage || 12, e.x - z.x, e.y - z.y, 2);
              e.applyStatusEffect('burn', 3.0, 5);
              particles.spawnFloatingText(e.x, 1.8, e.y, `🔥 ${z.damage || 12}`, '#ff4400');
            }
          }
        }
      }
      if (z.timer <= 0) {
        this.lingeringZones.splice(i, 1);
      }
    }

    // 1. Update 3D Slash Arcs
    for (let i = this.slashes.length - 1; i >= 0; i--) {
      const s = this.slashes[i];
      s.life += dt;
      const progress = s.life / s.maxLife;
      if (progress >= 1) {
        this.group.remove(s.mesh);
        this.slashes.splice(i, 1);
        continue;
      }
      const scale = s.initialScale + (s.targetScale - s.initialScale) * progress;
      if (s.type === 'vertical') {
        const sy = s.startY ?? 1.4;
        const ty = s.targetY ?? 0.35;
        s.mesh.position.y = sy + (ty - sy) * progress;
        s.mesh.scale.set(scale, scale * 1.25, scale);
      } else if (s.type === 'thrust') {
        s.mesh.scale.set(scale * 0.75, scale * 0.75, scale * 1.4);
      } else {
        s.mesh.scale.set(scale, scale, scale);
      }
    }

    // 2. Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.life <= 0) {
        particles.spawnBurst(p.x, 1.1, p.y, 4, p.color, 3);
        this.group.remove(p.mesh);
        p.mesh.geometry.dispose();
        this.projectiles.splice(i, 1);
        continue;
      }

      if (dungeon.isBlocked(room, p.x, p.y, p.radius)) {
        if (p.bounces && p.bounces > 0) {
          p.bounces--;
          // Calculate bounce reflection against blocked wall
          const prevX = p.x - p.vx * dt;
          const prevY = p.y - p.vy * dt;
          const blockedX = dungeon.isBlocked(room, p.x, prevY, p.radius);
          const blockedY = dungeon.isBlocked(room, prevX, p.y, p.radius);
          if (blockedX) p.vx = -p.vx;
          if (blockedY) p.vy = -p.vy;
          if (!blockedX && !blockedY) { p.vx = -p.vx; p.vy = -p.vy; }
          p.x = prevX + p.vx * dt;
          p.y = prevY + p.vy * dt;
          sound.fireball();
          particles.spawnShockwave(p.x, p.y, 2.8, 0xff7722, 0.25);
          particles.spawnBurst(p.x, 1.1, p.y, 10, p.color, 4);
        } else {
          particles.spawnBurst(p.x, 1.1, p.y, 4, p.color, 3);
          this.group.remove(p.mesh);
          p.mesh.geometry.dispose();
          this.projectiles.splice(i, 1);
          continue;
        }
      }

      p.mesh.position.set(p.x, 1.1, p.y);

      if (p.isPlayer) {
        // Check destructible props in room
        let propHit = false;
        if (room && room.props) {
          for (const pr of room.props) {
            if (pr.hp <= 0 || !pr.mesh || pr.type === 'chest' || pr.type === 'shrine' || pr.type === 'shop_counter' || pr.type === 'teleport_pad' || pr.type === 'skill_crucible' || pr.type === 'pact_altar' || pr.type === 'cage' || pr.type === 'spike_trap' || pr.type === 'fire_jet' || pr.type === 'celestial_fountain' || pr.type === 'celestial_forge') continue;
            if (Math.hypot(pr.x - p.x, pr.y - p.y) <= 0.8 + p.radius) {
              pr.hp -= p.damage;
              if (pr.hp <= 0) {
                this.triggerPropDestruction(pr, player, enemies);
              } else {
                sound.breakProp();
                particles.spawnBurst(pr.x, 0.6, pr.y, 10, 0x8a5438, 3);
              }
              this.group.remove(p.mesh);
              p.mesh.geometry.dispose();
              this.projectiles.splice(i, 1);
              propHit = true;
              break;
            }
          }
        }
        if (propHit) continue;

        for (const e of enemies) {
          if (e.isDead) continue;
          if (Math.hypot(e.x - p.x, e.y - p.y) <= e.stats.radius + p.radius) {
            sound.hitEnemy();
            particles.spawnBurst(p.x, 1.1, p.y, 8, p.color, 4);

            if (p.onHitEffect === 'burn') {
              particles.spawnShockwave(p.x, p.y, 3.5, 0xff4400);
              e.applyStatusEffect('burn', 4.0, Math.max(3, Math.round(p.damage * 0.15)));
            } else if (p.onHitEffect === 'freeze') {
              e.applyStatusEffect('freeze', 3.5);
              particles.spawnBurst(p.x, 1.1, p.y, 10, 0x88eeff, 4);
              particles.spawnFloatingText(e.x, 2.2, e.y, '❄️ CONGELATO!', '#88eeff');
            } else if (p.onHitEffect === 'poison') {
              e.applyStatusEffect('poison', 4.5, Math.max(3, Math.round(p.damage * 0.20)));
              particles.spawnBurst(p.x, 1.1, p.y, 10, 0x44dd44, 4);
              particles.spawnFloatingText(e.x, 2.0, e.y, '☠️ AVVELENATO!', '#44dd44');
            }

            e.takeDamage(p.damage, p.vx, p.vy, 8);
            particles.spawnFloatingText(e.x, 2.0, e.y, `${p.damage}`, '#66a3ff');

            if (p.pierce > 0) {
              p.pierce--;
            } else {
              this.group.remove(p.mesh);
              p.mesh.geometry.dispose();
              this.projectiles.splice(i, 1);
              break;
            }
          }
        }
      } else {
        if (Math.hypot(player.x - p.x, player.y - p.y) <= player.radius + p.radius) {
          const dmg = player.takeDamage(p.damage);
          if (dmg > 0) {
            sound.playerHurt();
            particles.spawnBurst(player.x, 1.1, player.y, 10, 0xff3b30, 5);
            particles.spawnFloatingText(player.x, 2.2, player.y, `-${dmg}`, '#ff3b30', true);
          }
          this.group.remove(p.mesh);
          p.mesh.geometry.dispose();
          this.projectiles.splice(i, 1);
        }
      }
    }
  }

  public clear(): void {
    for (const p of this.projectiles) {
      this.group.remove(p.mesh);
      p.mesh.geometry.dispose();
    }
    this.projectiles = [];

    for (const s of this.slashes) {
      this.group.remove(s.mesh);
    }
    this.slashes = [];
    this.lingeringZones = [];

    for (const r of this.shockwaveRings) {
      this.group.remove(r.mesh);
      r.mesh.geometry.dispose();
    }
    this.shockwaveRings = [];
  }
}

export const combat = new CombatSystem();
