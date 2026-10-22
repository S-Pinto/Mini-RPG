// Combat System, Skills, Projectiles, and Dynamic 3D Slash Animations
// The Albedo Renegades: Shadow of Elanthria

import * as THREE from 'three';
import { getBasic } from '../graphics/proceduralModels.ts';
import { particles } from '../graphics/particles.ts';
import { sound } from '../audio/soundEngine.ts';
import { telegraphs } from './telegraphs.ts';
import type { Player } from '../entities/player.ts';
import type { Enemy } from '../entities/enemy.ts';
import { dungeon, type DungeonRoom } from '../world/dungeonGenerator.ts';

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
  onHitEffect?: 'burn' | 'smite' | 'freeze';
}

export interface SlashEffect {
  mesh: THREE.Group;
  life: number;
  maxLife: number;
  initialScale: number;
  targetScale: number;
}

export class CombatSystem {
  public group = new THREE.Group();
  public projectiles: Projectile[] = [];
  public slashes: SlashEffect[] = [];

  public spawnSlashArc(x: number, y: number, angle: number, radius: number, color: number): void {
    const gr = new THREE.Group();
    gr.position.set(x, 0.45, y);
    gr.rotation.y = angle;

    // Glowing crescent arc geometry perfectly aligned with aim direction (+Z forward)
    const arcSpan = Math.PI * 0.88;
    const geo = new THREE.RingGeometry(radius * 0.42, radius, 24, 1, -arcSpan / 2, arcSpan);
    geo.rotateX(-Math.PI / 2); // Lay flat on XZ floor plane
    geo.rotateY(-Math.PI / 2); // Rotate center (+X) to point along +Z forward
    const mat = getBasic(color, 0.85, true);
    const mesh = new THREE.Mesh(geo, mat);
    gr.add(mesh);

    this.group.add(gr);
    this.slashes.push({
      mesh: gr,
      life: 0,
      maxLife: 0.18,
      initialScale: 0.6,
      targetScale: 1.15
    });
  }

  public castBasicAttack(player: Player, enemies: Enemy[], room: DungeonRoom): void {
    if (player.attackCd > 0) return;
    player.attackCd = player.stats.attackDelay;

    const classId = player.classId;
    const isCrit = Math.random() * 100 < player.stats.critChance;
    const critMult = isCrit ? player.stats.critDamage / 100 : 1.0;
    const baseDamage = Math.round(player.stats.damage * critMult);

    if (classId === 'paladin' || classId === 'fighter' || classId === 'cleric') {
      // Start Melee Attack Animation
      player.attackAnimTimer = 0.24;
      sound.swing();

      const reach = classId === 'fighter' ? 3.4 : 2.6;
      const arcHalf = classId === 'fighter' ? Math.PI * 0.55 : Math.PI * 0.45;
      const attackAngle = Math.atan2(player.aimX, player.aimY);

      // Spawn Glowing 3D Slash Arc on floor
      const slashColor = classId === 'paladin' ? (player.isSmiteCharged ? 0xffea00 : 0xffd700) : (classId === 'cleric' ? 0xffcc88 : 0xdfe6f2);
      this.spawnSlashArc(player.x, player.y, attackAngle, reach, slashColor);

      // Visual slash particle burst
      particles.spawnBurst(
        player.x + player.aimX * 1.5,
        1.1,
        player.y + player.aimY * 1.5,
        classId === 'paladin' ? 14 : 8,
        slashColor,
        5
      );

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
            let dmg = baseDamage;
            if (player.isSmiteCharged) {
              dmg = Math.round(dmg * 2.6);
              sound.smite();
              particles.spawnShockwave(e.x, e.y, 4.0, 0xffea00);
              particles.spawnBurst(e.x, 1.2, e.y, 25, 0xffd700, 8);
              player.isSmiteCharged = false;
            } else {
              sound.hitEnemy();
              particles.spawnBurst(e.x, 1.0, e.y, 8, isCrit ? 0xffd700 : 0xffffff, 5);
            }

            e.takeDamage(dmg, dx, dy, classId === 'fighter' ? 14 : 9);
            particles.spawnFloatingText(e.x, 2.0, e.y, `${dmg}`, isCrit ? '#ffd700' : '#ffffff', isCrit);

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
        if (p.hp <= 0) continue;
        const dx = p.x - player.x;
        const dy = p.y - player.y;
        if (Math.hypot(dx, dy) <= reach + 0.8) {
          p.hp -= baseDamage;
          if (p.hp <= 0 && p.mesh) {
            sound.breakProp();
            particles.spawnBurst(p.x, 0.6, p.y, 14, 0x8a5438, 4);
            p.mesh.visible = false;
            player.gold += Math.floor(1 + Math.random() * 4);
            sound.coin();
          }
        }
      }
    } else if (classId === 'wizard') {
      // Magic Missiles at range with staff thrust animation
      player.attackAnimTimer = 0.22;
      sound.fireball();
      particles.spawnBurst(player.x + player.aimX * 0.8, 1.3, player.y + player.aimY * 0.8, 8, 0x66a3ff, 4);
      const speed = 22;
      this.spawnProjectile(
        player.x + player.aimX * 0.8,
        player.y + player.aimY * 0.8,
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
        // Divine Smite
        player.skill1Cd = 5.5 * (1 - player.stats.cooldownReduction / 100);
        player.isSmiteCharged = true;
        sound.smite();
        particles.spawnBurst(player.x, 1.2, player.y, 20, 0xffea00, 6);
        particles.spawnFloatingText(player.x, 2.5, player.y, 'PUNIZIONE DIVINA ATTIVA!', '#ffea00', true);
        break;
      }

      case 'wizard': {
        // Fireball
        player.skill1Cd = 6.0 * (1 - player.stats.cooldownReduction / 100);
        sound.fireball();
        const speed = 18;
        this.spawnProjectile(
          player.x + player.aimX * 1.0,
          player.y + player.aimY * 1.0,
          player.aimX * speed,
          player.aimY * speed,
          0.45,
          Math.round(player.stats.damage * 3.2),
          true,
          0xff4400,
          0,
          'burn'
        );
        break;
      }

      case 'fighter': {
        // Whirlwind
        player.skill1Cd = 5.0 * (1 - player.stats.cooldownReduction / 100);
        sound.swing();
        this.spawnSlashArc(player.x, player.y, 0, 4.8, 0xffd700);
        particles.spawnShockwave(player.x, player.y, 5.0, 0xdfe6f2, 0.25);
        for (const e of enemies) {
          if (e.isDead) continue;
          const dx = e.x - player.x;
          const dy = e.y - player.y;
          const dist = Math.hypot(dx, dy);
          if (dist <= 4.8) {
            const dmg = Math.round(player.stats.damage * 2.6);
            e.takeDamage(dmg, dx, dy, 18);
            particles.spawnBurst(e.x, 1.0, e.y, 10, 0xffd700, 6);
            particles.spawnFloatingText(e.x, 2.2, e.y, `${dmg}`, '#ffd700', true);
          }
        }
        break;
      }

      case 'rogue': {
        // Sneak Attack: Fan of 5 piercing stilettos
        player.skill1Cd = 4.5 * (1 - player.stats.cooldownReduction / 100);
        sound.shootArrow();
        const baseAngle = Math.atan2(player.aimX, player.aimY);
        const fanSpread = 0.5;
        const count = 5;

        for (let i = 0; i < count; i++) {
          const angle = baseAngle + (i - (count - 1) / 2) * (fanSpread / (count - 1));
          const vx = Math.sin(angle) * 24;
          const vy = Math.cos(angle) * 24;
          this.spawnProjectile(
            player.x,
            player.y,
            vx,
            vy,
            0.22,
            Math.round(player.stats.damage * 1.8),
            true,
            0x44d98a,
            2
          );
        }
        break;
      }

      case 'cleric': {
        // Flamestrike / Guiding Bolt: Celestial column on target
        player.skill1Cd = 5.2 * (1 - player.stats.cooldownReduction / 100);
        sound.smite();
        const targetX = player.x + player.aimX * 6.0;
        const targetY = player.y + player.aimY * 6.0;

        particles.spawnShockwave(targetX, targetY, 4.0, 0xffea00);
        particles.spawnBurst(targetX, 2.0, targetY, 30, 0xffea00, 8);

        for (const e of enemies) {
          if (e.isDead) continue;
          const dx = e.x - targetX;
          const dy = e.y - targetY;
          if (Math.hypot(dx, dy) <= 3.8) {
            const dmg = Math.round(player.stats.damage * 2.7);
            e.takeDamage(dmg, dx, dy, 12);
            particles.spawnFloatingText(e.x, 2.0, e.y, `${dmg}`, '#ffea00', true);
          }
        }
        break;
      }
    }
  }

  public castSkill2(player: Player, room: DungeonRoom): void {
    if (player.skill2Cd > 0) return;
    const classId = player.classId;

    switch (classId) {
      case 'paladin': {
        player.skill2Cd = 3.5;
        player.dashTimer = 0.22;
        player.invulnerableTimer = 0.35;
        sound.dash();
        particles.spawnBurst(player.x, 0.8, player.y, 14, 0xffea00, 5);
        break;
      }

      case 'wizard': {
        player.skill2Cd = 4.0;
        sound.dash();
        particles.spawnBurst(player.x, 1.0, player.y, 20, 0x66a3ff, 6);

        const teleportDist = 5.5;
        const destX = player.x + player.aimX * teleportDist;
        const destY = player.y + player.aimY * teleportDist;

        if (!dungeon.isBlocked(room, destX, destY, player.radius)) {
          player.x = destX;
          player.y = destY;
        }
        particles.spawnBurst(player.x, 1.0, player.y, 20, 0x66a3ff, 6);
        break;
      }

      case 'fighter': {
        player.skill2Cd = 8.0;
        sound.heal();
        const healed = player.heal(Math.round(player.maxHp * 0.35));
        particles.spawnBurst(player.x, 1.2, player.y, 18, 0x55ff77, 4);
        particles.spawnFloatingText(player.x, 2.4, player.y, `+${healed} PV`, '#55ff77', true);
        break;
      }

      case 'rogue': {
        player.skill2Cd = 2.5;
        player.dashTimer = 0.24;
        player.invulnerableTimer = 0.45;
        sound.dash();
        particles.spawnBurst(player.x, 0.5, player.y, 12, 0x224838, 4);
        break;
      }

      case 'cleric': {
        player.skill2Cd = 7.0;
        sound.heal();
        const healed = player.heal(35);
        particles.spawnShockwave(player.x, player.y, 5.0, 0x55ff77);
        particles.spawnFloatingText(player.x, 2.4, player.y, `+${healed} PV`, '#55ff77', true);
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

    switch (e.stats.attackType) {
      case 'melee': {
        if (dist <= e.stats.attackRange + 0.3) {
          sound.swing();
          const dmg = player.takeDamage(e.stats.damage);
          if (dmg > 0) {
            sound.playerHurt();
            particles.spawnBurst(player.x, 1.0, player.y, 10, 0xff3b30, 5);
            particles.spawnFloatingText(player.x, 2.2, player.y, `-${dmg}`, '#ff3b30', true);
          }
        }
        break;
      }

      case 'projectile': {
        sound.fireball();
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
        break;
      }

      case 'charge': {
        telegraphs.createCircle(targetX, targetY, 2.0, 0.7, 0xff3b30, () => {
          e.knockbackX = dirX * 18;
          e.knockbackY = dirY * 18;
          if (Math.hypot(player.x - targetX, player.y - targetY) < 2.0) {
            const dmg = player.takeDamage(e.stats.damage * 1.3);
            if (dmg > 0) {
              sound.playerHurt();
              particles.spawnFloatingText(player.x, 2.2, player.y, `-${dmg}`, '#ff3b30', true);
            }
          }
        });
        break;
      }

      case 'aoe': {
        telegraphs.createCircle(e.x, e.y, 5.0, 1.2, 0xff3b30, () => {
          particles.spawnShockwave(e.x, e.y, 5.0, 0xff3b30);
          particles.spawnBurst(e.x, 1.0, e.y, 30, 0xff3b30, 8);
          if (Math.hypot(player.x - e.x, player.y - e.y) <= 5.0) {
            const dmg = player.takeDamage(e.stats.damage * 1.5);
            if (dmg > 0) {
              sound.playerHurt();
              particles.spawnFloatingText(player.x, 2.2, player.y, `-${dmg}`, '#ff3b30', true);
            }
          }
        });
        break;
      }

      case 'dragon_breath': {
        sound.dragonRoar();
        const numFireballs = 7;
        const spread = Math.PI * 0.45;
        const baseAngle = Math.atan2(dirX, dirY);

        for (let i = 0; i < numFireballs; i++) {
          const a = baseAngle + (i - (numFireballs - 1) / 2) * (spread / (numFireballs - 1));
          const vx = Math.sin(a) * 14;
          const vy = Math.cos(a) * 14;
          this.spawnProjectile(e.x, e.y, vx, vy, 0.4, e.stats.damage, false, 0xff3300, 0);
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
    onHitEffect?: 'burn' | 'smite' | 'freeze'
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
      onHitEffect
    };

    this.projectiles.push(proj);
    return proj;
  }

  public update(dt: number, player: Player, enemies: Enemy[], room: DungeonRoom): void {
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
      s.mesh.scale.set(scale, scale, scale);
    }

    // 2. Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.life <= 0 || dungeon.isBlocked(room, p.x, p.y, p.radius)) {
        particles.spawnBurst(p.x, 1.1, p.y, 4, p.color, 3);
        this.group.remove(p.mesh);
        p.mesh.geometry.dispose();
        this.projectiles.splice(i, 1);
        continue;
      }

      p.mesh.position.set(p.x, 1.1, p.y);

      if (p.isPlayer) {
        // Check destructible props in room
        let propHit = false;
        if (room && room.props) {
          for (const pr of room.props) {
            if (pr.hp <= 0 || !pr.mesh || pr.type === 'chest' || pr.type === 'shrine') continue;
            if (Math.hypot(pr.x - p.x, pr.y - p.y) <= 0.8 + p.radius) {
              pr.hp -= p.damage;
              sound.breakProp();
              particles.spawnBurst(pr.x, 0.6, pr.y, 14, 0x8a5438, 4);
              if (pr.hp <= 0) {
                pr.mesh.visible = false;
                player.gold += Math.floor(1 + Math.random() * 4);
                sound.coin();
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
  }
}

export const combat = new CombatSystem();
