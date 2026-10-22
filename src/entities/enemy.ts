// Enemy Entity, AI behaviors and Boss Mechanics with Animated Limbs
// The Albedo Renegades: Shadow of Elanthria

import * as THREE from 'three';
import type { EliteAffix, EnemyStats, EnemyType, StatusEffect, StatusEffectType } from '../types/game.ts';
import { buildEnemyModel } from '../graphics/proceduralModels.ts';
import { dungeon, type DungeonRoom } from '../world/dungeonGenerator.ts';
import { particles } from '../graphics/particles.ts';
import { sound } from '../audio/soundEngine.ts';

const ENEMY_BASE_STATS: Record<EnemyType, EnemyStats> = {
  // Azren
  orc_warrior: {
    name: 'Orco Soldato di Azren',
    hp: 75,
    maxHp: 75,
    damage: 16,
    speed: 3.4,
    radius: 0.65,
    xpReward: 16,
    color: 0x567d46,
    attackRange: 1.8,
    attackCooldown: 1.25,
    attackType: 'melee'
  },
  orc_berserker: {
    name: 'Orco Berserker Furente',
    hp: 125,
    maxHp: 125,
    damage: 25,
    speed: 4.4,
    radius: 0.75,
    xpReward: 26,
    color: 0x8f2d25,
    attackRange: 2.2,
    attackCooldown: 1.45,
    attackType: 'charge'
  },
  orc_shaman: {
    name: 'Sciamano delle Macerie',
    hp: 65,
    maxHp: 65,
    damage: 19,
    speed: 3.0,
    radius: 0.6,
    xpReward: 22,
    color: 0x422648,
    attackRange: 9.5,
    attackCooldown: 1.75,
    attackType: 'projectile'
  },
  boss_grummak: {
    name: 'Capitano Grummak il Frantumatore',
    hp: 580,
    maxHp: 580,
    damage: 34,
    speed: 3.0,
    radius: 1.2,
    xpReward: 160,
    color: 0x853229,
    attackRange: 3.6,
    attackCooldown: 1.7,
    attackType: 'aoe',
    isBoss: true
  },

  // Elshiff
  elven_shadow: {
    name: 'Ombra di Elshiff',
    hp: 60,
    maxHp: 60,
    damage: 22,
    speed: 5.6,
    radius: 0.55,
    xpReward: 22,
    color: 0x00ffff,
    attackRange: 1.6,
    attackCooldown: 0.95,
    attackType: 'melee'
  },
  corrupted_golem: {
    name: 'Costrutto Elfico Corrotto',
    hp: 180,
    maxHp: 180,
    damage: 28,
    speed: 2.5,
    radius: 0.85,
    xpReward: 34,
    color: 0x6a7b8c,
    attackRange: 2.2,
    attackCooldown: 1.7,
    attackType: 'melee'
  },
  spectral_archer: {
    name: 'Arciere Spettrale Dannato',
    hp: 65,
    maxHp: 65,
    damage: 24,
    speed: 3.2,
    radius: 0.6,
    xpReward: 26,
    color: 0x4de0e8,
    attackRange: 12.0,
    attackCooldown: 1.65,
    attackType: 'projectile'
  },
  boss_vaeloria: {
    name: 'Regina Spettrale Vaeloria',
    hp: 780,
    maxHp: 780,
    damage: 38,
    speed: 3.8,
    radius: 1.1,
    xpReward: 240,
    color: 0x00ffff,
    attackRange: 7.5,
    attackCooldown: 1.5,
    attackType: 'aoe',
    isBoss: true
  },

  // Morgen & Isargard
  marsh_troll: {
    name: 'Troll della Palude di Morgen',
    hp: 220,
    maxHp: 220,
    damage: 32,
    speed: 2.6,
    radius: 0.95,
    xpReward: 42,
    color: 0x3d5c38,
    attackRange: 2.8,
    attackCooldown: 1.85,
    attackType: 'melee'
  },
  dire_beast: {
    name: 'Bestia Crudele Famelica',
    hp: 85,
    maxHp: 85,
    damage: 25,
    speed: 6.0,
    radius: 0.7,
    xpReward: 30,
    color: 0x3d3329,
    attackRange: 2.0,
    attackCooldown: 1.25,
    attackType: 'charge'
  },
  spore_spitter: {
    name: 'Sputa-Spore Carnivoro',
    hp: 75,
    maxHp: 75,
    damage: 22,
    speed: 2.8,
    radius: 0.6,
    xpReward: 32,
    color: 0x567d36,
    attackRange: 10.0,
    attackCooldown: 1.75,
    attackType: 'projectile'
  },
  boss_troll_warlord: {
    name: 'Vorrash, Signore di Isargard',
    hp: 1100,
    maxHp: 1100,
    damage: 44,
    speed: 2.8,
    radius: 1.4,
    xpReward: 350,
    color: 0x284224,
    attackRange: 4.2,
    attackCooldown: 1.75,
    attackType: 'aoe',
    isBoss: true
  },

  // Vazark Caverns & Vermithrax
  kobold_spearman: {
    name: 'Koboldo Verde con Lancia',
    hp: 55,
    maxHp: 55,
    damage: 18,
    speed: 4.8,
    radius: 0.5,
    xpReward: 18,
    color: 0x488a38,
    attackRange: 2.0,
    attackCooldown: 1.05,
    attackType: 'melee'
  },
  kobold_bomber: {
    name: 'Koboldo Bombarolo Suicida',
    hp: 45,
    maxHp: 45,
    damage: 36,
    speed: 5.4,
    radius: 0.5,
    xpReward: 24,
    color: 0xcc291f,
    attackRange: 1.6,
    attackCooldown: 0.85,
    attackType: 'charge'
  },
  dragon_shaman: {
    name: 'Sciamano della Fiamma Draconica',
    hp: 85,
    maxHp: 85,
    damage: 26,
    speed: 3.3,
    radius: 0.55,
    xpReward: 32,
    color: 0xff6600,
    attackRange: 11.5,
    attackCooldown: 1.65,
    attackType: 'projectile'
  },
  boss_dragon_vermithrax: {
    name: 'Vermithrax, Terrore di Elanthria',
    hp: 1650,
    maxHp: 1650,
    damage: 54,
    speed: 2.5,
    radius: 2.0,
    xpReward: 750,
    color: 0x8a1c14,
    attackRange: 9.5,
    attackCooldown: 1.9,
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

  public affix?: EliteAffix;
  public shieldHp = 0;
  public maxShieldHp = 0;
  public isEnraged = false;
  public toxicAuraTimer = 0;

  public mesh: THREE.Group;
  private modelUpdate: (t: number, speed: number, attackProgress?: number) => void;

  constructor(type: EnemyType, x: number, y: number, actMultiplier = 1.0, affix?: EliteAffix) {
    this.id = ++nextEnemyId;
    this.type = type;
    this.x = x;
    this.y = y;
    this.affix = affix;

    const base = ENEMY_BASE_STATS[type];
    let hpScaled = Math.round(base.hp * actMultiplier);
    let dmgScaled = Math.round(base.damage * actMultiplier);
    let speedScaled = base.speed;
    let cdScaled = base.attackCooldown;

    // Apply Elite Affixes
    if (affix === 'shielded') {
      this.shieldHp = Math.round(hpScaled * 0.45);
      this.maxShieldHp = this.shieldHp;
    } else if (affix === 'swift') {
      speedScaled *= 1.30;
      cdScaled *= 0.75;
    } else if (affix === 'vampiric') {
      dmgScaled = Math.round(dmgScaled * 1.2);
    }

    this.stats = {
      ...base,
      hp: hpScaled,
      maxHp: hpScaled,
      damage: dmgScaled,
      speed: speedScaled,
      attackCooldown: cdScaled,
      affix
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

  public statusEffects: StatusEffect[] = [];

  public applyStatusEffect(effect: StatusEffect | StatusEffectType, duration = 3.0, damagePerTick = 5): void {
    if (this.isDead) return;
    const eff: StatusEffect = typeof effect === 'string'
      ? { type: effect, duration, damagePerTick }
      : effect;
    const existing = this.statusEffects.find(s => s.type === eff.type);
    if (existing) {
      existing.duration = Math.max(existing.duration, eff.duration);
      if (eff.damagePerTick && eff.damagePerTick > (existing.damagePerTick || 0)) {
        existing.damagePerTick = eff.damagePerTick;
      }
    } else {
      this.statusEffects.push({ ...eff, tickTimer: 0.4 });
    }
  }

  public hasStatus(type: StatusEffect['type']): boolean {
    return this.statusEffects.some(s => s.type === type);
  }

  public update(
    dt: number,
    targetX: number,
    targetY: number,
    room: DungeonRoom,
    onAttackTrigger: (e: Enemy, targetX: number, targetY: number) => void,
    onAuraPulse?: (e: Enemy) => void
  ): void {
    if (this.isDead) return;

    // Process Status Effects (Burn, Freeze, Poison, Shock)
    let speedMult = 1.0;
    for (let i = this.statusEffects.length - 1; i >= 0; i--) {
      const s = this.statusEffects[i];
      s.duration -= dt;

      if (s.type === 'freeze') {
        speedMult *= 0.52;
        if (Math.random() < 0.15) {
          particles.spawnBurst(this.x, 0.8, this.y, 2, 0x88eeff, 1.5);
        }
      } else if (s.type === 'burn') {
        s.tickTimer = (s.tickTimer || 0.4) - dt;
        if (s.tickTimer <= 0) {
          s.tickTimer = 0.4;
          const burnDmg = s.damagePerTick || 4;
          this.takeDamage(burnDmg);
          particles.spawnFloatingText(this.x, 2.0, this.y, `🔥 ${burnDmg}`, '#ff6622');
          particles.spawnBurst(this.x, 1.0, this.y, 3, 0xff4400, 2);
        }
      } else if (s.type === 'poison') {
        s.tickTimer = (s.tickTimer || 0.5) - dt;
        if (s.tickTimer <= 0) {
          s.tickTimer = 0.5;
          const poisonDmg = s.damagePerTick || 3;
          this.takeDamage(poisonDmg);
          particles.spawnFloatingText(this.x, 1.8, this.y, `☠️ ${poisonDmg}`, '#44dd44');
          particles.spawnBurst(this.x, 0.7, this.y, 3, 0x55ff55, 1.8);
        }
      } else if (s.type === 'shock') {
        if (Math.random() < 0.18) {
          particles.spawnBurst(this.x, 1.1, this.y, 4, 0xffee44, 2.5);
        }
      }

      if (s.duration <= 0) {
        this.statusEffects.splice(i, 1);
      }
    }

    if (this.isDead) return;

    // Ambient particles for enraged or shielded enemies
    if (this.isEnraged && Math.random() < 0.3) {
      particles.spawnBurst(this.x, 1.2, this.y, 2, 0xff2200, 2);
    }
    if (this.shieldHp > 0 && Math.random() < 0.15) {
      particles.spawnBurst(this.x, 1.0, this.y, 1, 0x38bdf8, 1.5);
    }

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

    // Elite Affix: Toxic Aura pulse
    if (this.affix === 'toxic_aura') {
      this.toxicAuraTimer -= dt;
      if (this.toxicAuraTimer <= 0) {
        this.toxicAuraTimer = 1.6;
        particles.spawnShockwave(this.x, this.y, 2.8, 0x22c55e, 0.3);
        if (onAuraPulse) onAuraPulse(this);
      }
    }

    // Face player
    this.rot = Math.atan2(dirX, dirY);
    this.mesh.rotation.y = this.rot;

    let actualSpeed = 0;

    // Flocking encircling factor based on enemy id and time
    const perpX = -dirY;
    const perpY = dirX;
    const lateralSpread = Math.sin(performance.now() * 0.0018 + this.id * 1.5) * 0.45;

    let moveVecX = 0;
    let moveVecY = 0;

    // Movement AI
    const isRanged = this.stats.attackType === 'projectile';

    if (isRanged) {
      if (dist < 3.4) {
        // Ranged kiting: backpedal away from player!
        moveVecX = -dirX + perpX * lateralSpread;
        moveVecY = -dirY + perpY * lateralSpread;
      } else if (dist > this.stats.attackRange * 0.8) {
        // Advance into range
        moveVecX = dirX + perpX * lateralSpread;
        moveVecY = dirY + perpY * lateralSpread;
      } else {
        // Strafe around player while in ideal range
        moveVecX = perpX * (this.id % 2 === 0 ? 0.6 : -0.6);
        moveVecY = perpY * (this.id % 2 === 0 ? 0.6 : -0.6);
      }
    } else {
      // Melee / Charge / AoE AI: flank & encircle player until within attack range
      if (dist > this.stats.attackRange * 0.75) {
        moveVecX = dirX + perpX * lateralSpread;
        moveVecY = dirY + perpY * lateralSpread;
      }
    }

    if (moveVecX !== 0 || moveVecY !== 0) {
      const moveLen = Math.hypot(moveVecX, moveVecY) || 1;
      const startX = this.x;
      const startY = this.y;
      const vx = (moveVecX / moveLen) * this.stats.speed * speedMult * dt;
      const vy = (moveVecY / moveLen) * this.stats.speed * speedMult * dt;

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

    let finalDmg = amount;

    // Shield absorption
    if (this.shieldHp > 0) {
      if (this.shieldHp >= finalDmg) {
        this.shieldHp -= finalDmg;
        particles.spawnBurst(this.x, 1.2, this.y, 6, 0x38bdf8, 3);
        particles.spawnFloatingText(this.x, 2.2, this.y, `🛡️ -${finalDmg} SCUDO`, '#38bdf8');
        finalDmg = 0;
      } else {
        finalDmg -= this.shieldHp;
        this.shieldHp = 0;
        particles.spawnShockwave(this.x, this.y, 2.5, 0x38bdf8, 0.3);
        particles.spawnFloatingText(this.x, 2.2, this.y, '💥 SCUDO DISTRUTTO!', '#0284c7', true);
      }
    }

    this.hp -= finalDmg;

    // Enrage mechanic: below 45% HP for bosses, berserkers, or dire beasts
    const canEnrage = this.stats.isBoss || this.type === 'orc_berserker' || this.type === 'dire_beast';
    if (canEnrage && !this.isEnraged && this.hp > 0 && this.hp <= this.maxHp * 0.45) {
      this.isEnraged = true;
      this.stats.speed *= 1.35;
      this.stats.attackCooldown *= 0.65;
      sound.dragonRoar();
      particles.spawnShockwave(this.x, this.y, 4.2, 0xef4444, 0.45);
      particles.spawnBurst(this.x, 1.4, this.y, 28, 0xff0000, 7);
      particles.spawnFloatingText(this.x, 2.7, this.y, '🔥 ENRAGE! FURIA DISTRUTTIVA!', '#ff0000', true);
    }

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
