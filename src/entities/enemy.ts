// Enemy Entity, AI behaviors and Boss Mechanics with Animated Limbs
// The Albedo Renegades: Shadow of Elanthria

import * as THREE from 'three';
import type { EnemyStats, EnemyType } from '../types/game.ts';
import { buildEnemyModel } from '../graphics/proceduralModels.ts';
import { dungeon, type DungeonRoom } from '../world/dungeonGenerator.ts';

const ENEMY_BASE_STATS: Record<EnemyType, EnemyStats> = {
  // Azren
  orc_warrior: {
    name: 'Orco Soldato di Azren',
    hp: 40,
    maxHp: 40,
    damage: 12,
    speed: 3.2,
    radius: 0.65,
    xpReward: 12,
    color: 0x567d46,
    attackRange: 1.8,
    attackCooldown: 1.4,
    attackType: 'melee'
  },
  orc_berserker: {
    name: 'Orco Berserker Furente',
    hp: 65,
    maxHp: 65,
    damage: 18,
    speed: 4.2,
    radius: 0.75,
    xpReward: 20,
    color: 0x8f2d25,
    attackRange: 2.2,
    attackCooldown: 1.8,
    attackType: 'charge'
  },
  orc_shaman: {
    name: 'Sciamano delle Macerie',
    hp: 35,
    maxHp: 35,
    damage: 14,
    speed: 2.8,
    radius: 0.6,
    xpReward: 18,
    color: 0x422648,
    attackRange: 9.0,
    attackCooldown: 2.2,
    attackType: 'projectile'
  },
  boss_grummak: {
    name: 'Capitano Grummak il Frantumatore',
    hp: 280,
    maxHp: 280,
    damage: 26,
    speed: 2.8,
    radius: 1.2,
    xpReward: 120,
    color: 0x853229,
    attackRange: 3.5,
    attackCooldown: 2.0,
    attackType: 'aoe',
    isBoss: true
  },

  // Elshiff
  elven_shadow: {
    name: 'Ombra di Elshiff',
    hp: 30,
    maxHp: 30,
    damage: 15,
    speed: 5.4,
    radius: 0.55,
    xpReward: 16,
    color: 0x00ffff,
    attackRange: 1.6,
    attackCooldown: 1.2,
    attackType: 'melee'
  },
  corrupted_golem: {
    name: 'Costrutto Elfico Corrotto',
    hp: 95,
    maxHp: 95,
    damage: 20,
    speed: 2.2,
    radius: 0.85,
    xpReward: 26,
    color: 0x6a7b8c,
    attackRange: 2.2,
    attackCooldown: 2.0,
    attackType: 'melee'
  },
  spectral_archer: {
    name: 'Arciere Spettrale Dannato',
    hp: 32,
    maxHp: 32,
    damage: 16,
    speed: 3.0,
    radius: 0.6,
    xpReward: 20,
    color: 0x4de0e8,
    attackRange: 12.0,
    attackCooldown: 2.0,
    attackType: 'projectile'
  },
  boss_vaeloria: {
    name: 'Regina Spettrale Vaeloria',
    hp: 360,
    maxHp: 360,
    damage: 28,
    speed: 3.5,
    radius: 1.1,
    xpReward: 180,
    color: 0x00ffff,
    attackRange: 7.0,
    attackCooldown: 1.8,
    attackType: 'aoe',
    isBoss: true
  },

  // Morgen & Isargard
  marsh_troll: {
    name: 'Troll della Palude di Morgen',
    hp: 110,
    maxHp: 110,
    damage: 22,
    speed: 2.4,
    radius: 0.95,
    xpReward: 32,
    color: 0x3d5c38,
    attackRange: 2.8,
    attackCooldown: 2.2,
    attackType: 'melee'
  },
  dire_beast: {
    name: 'Bestia Crudele Famelica',
    hp: 45,
    maxHp: 45,
    damage: 16,
    speed: 5.8,
    radius: 0.7,
    xpReward: 22,
    color: 0x3d3329,
    attackRange: 2.0,
    attackCooldown: 1.5,
    attackType: 'charge'
  },
  spore_spitter: {
    name: 'Sputa-Spore Carnivoro',
    hp: 40,
    maxHp: 40,
    damage: 15,
    speed: 2.5,
    radius: 0.6,
    xpReward: 24,
    color: 0x567d36,
    attackRange: 10.0,
    attackCooldown: 2.2,
    attackType: 'projectile'
  },
  boss_troll_warlord: {
    name: 'Vorrash, Signore di Isargard',
    hp: 450,
    maxHp: 450,
    damage: 32,
    speed: 2.6,
    radius: 1.4,
    xpReward: 250,
    color: 0x284224,
    attackRange: 4.0,
    attackCooldown: 2.2,
    attackType: 'aoe',
    isBoss: true
  },

  // Vazark Caverns & Vermithrax
  kobold_spearman: {
    name: 'Koboldo Verde con Lancia',
    hp: 25,
    maxHp: 25,
    damage: 12,
    speed: 4.5,
    radius: 0.5,
    xpReward: 14,
    color: 0x488a38,
    attackRange: 2.0,
    attackCooldown: 1.2,
    attackType: 'melee'
  },
  kobold_bomber: {
    name: 'Koboldo Bombarolo Suicida',
    hp: 20,
    maxHp: 20,
    damage: 24,
    speed: 5.0,
    radius: 0.5,
    xpReward: 18,
    color: 0xcc291f,
    attackRange: 1.6,
    attackCooldown: 1.0,
    attackType: 'charge'
  },
  dragon_shaman: {
    name: 'Sciamano della Fiamma Draconica',
    hp: 42,
    maxHp: 42,
    damage: 18,
    speed: 3.0,
    radius: 0.55,
    xpReward: 25,
    color: 0xff6600,
    attackRange: 11.0,
    attackCooldown: 2.0,
    attackType: 'projectile'
  },
  boss_dragon_vermithrax: {
    name: 'Vermithrax, Terrore di Elanthria',
    hp: 680,
    maxHp: 680,
    damage: 38,
    speed: 2.2,
    radius: 2.0,
    xpReward: 500,
    color: 0x8a1c14,
    attackRange: 9.0,
    attackCooldown: 2.4,
    attackType: 'dragon_breath',
    isBoss: true
  }
};

let nextEnemyId = 1;

export class Enemy {
  public id: number;
  public type: EnemyType;
  public x: number;
  public y: number;
  public hp: number;
  public maxHp: number;
  public radius: number;
  public stats: EnemyStats;
  public isDead = false;

  public knockbackX = 0;
  public knockbackY = 0;
  public attackTimer = 0;
  public attackAnimTimer = 0;
  public rot = 0;
  public isCharging = false;
  public chargeDirX = 0;
  public chargeDirY = 0;
  public attackCount = 0;

  public mesh: THREE.Group;
  private modelUpdate: (t: number, speed: number, attackProgress?: number) => void;

  constructor(type: EnemyType, x: number, y: number, actMultiplier = 1.0) {
    this.id = ++nextEnemyId;
    this.type = type;
    this.x = x;
    this.y = y;

    const base = ENEMY_BASE_STATS[type];
    const hpScaled = Math.round(base.hp * actMultiplier);
    const dmgScaled = Math.round(base.damage * actMultiplier);

    this.stats = {
      ...base,
      hp: hpScaled,
      maxHp: hpScaled,
      damage: dmgScaled
    };
    this.hp = hpScaled;
    this.maxHp = hpScaled;
    this.radius = this.stats.radius;

    const modelObj = buildEnemyModel(type);
    this.mesh = modelObj.root;
    this.modelUpdate = modelObj.update;
    this.mesh.position.set(x, 0, y);
    this.attackTimer = 0.5 + Math.random() * 1.0;
  }

  public update(
    dt: number,
    targetX: number,
    targetY: number,
    room: DungeonRoom,
    onAttackTrigger: (e: Enemy, targetX: number, targetY: number) => void
  ): void {
    if (this.isDead) return;

    // Apply knockback with sliding collision
    if (Math.hypot(this.knockbackX, this.knockbackY) > 0.05) {
      dungeon.moveEntity(room, this, this.knockbackX * dt, this.knockbackY * dt);
      this.knockbackX *= 0.88;
      this.knockbackY *= 0.88;
    }

    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    const dirX = dx / dist;
    const dirY = dy / dist;

    // Face player
    this.rot = Math.atan2(dirX, dirY);
    this.mesh.rotation.y = this.rot;

    let actualSpeed = 0;

    // Movement AI: chase player until within attack range
    if (dist > this.stats.attackRange * 0.75) {
      const startX = this.x;
      const startY = this.y;
      const vx = dirX * this.stats.speed * dt;
      const vy = dirY * this.stats.speed * dt;

      // Sliding movement
      dungeon.moveEntity(room, this, vx, vy);
      const movedDist = Math.hypot(this.x - startX, this.y - startY);
      actualSpeed = movedDist / dt;
    }

    // Attack cooldown logic
    this.attackTimer -= dt;
    if (this.attackTimer <= 0 && dist <= this.stats.attackRange) {
      this.attackTimer = this.stats.attackCooldown;
      this.attackAnimTimer = 0.45; // Start attack animation!
      onAttackTrigger(this, targetX, targetY);
    }

    // Update attack animation timer
    if (this.attackAnimTimer > 0) {
      this.attackAnimTimer -= dt;
    }
    const attackProgress = this.attackAnimTimer > 0 ? (1.0 - this.attackAnimTimer / 0.45) : 0;

    // Update 3D mesh position and animations
    this.mesh.position.set(this.x, 0, this.y);
    this.modelUpdate(performance.now() * 0.001, actualSpeed, attackProgress);
  }

  public takeDamage(amount: number, kbX = 0, kbY = 0, kbStrength = 0): void {
    if (this.isDead) return;
    this.hp -= amount;

    if (!this.stats.isBoss && kbStrength > 0) {
      const len = Math.hypot(kbX, kbY) || 1;
      this.knockbackX = (kbX / len) * kbStrength;
      this.knockbackY = (kbY / len) * kbStrength;
    }

    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
    }
  }
}
