import * as THREE from 'three';
import type { CharacterStats, ClassId, Item, SubclassConfig, FeatUpgrade, SkillAugment, DarkPact } from '../types/game.ts';
import { CLASSES_DATA } from '../types/classesData.ts';
import { buildPlayerModel, type HumanoidRig, type AttackAnimationType } from '../graphics/proceduralModels.ts';
import { dungeon, type DungeonRoom } from '../world/dungeonGenerator.ts';

export class Player {
  public classId: ClassId;
  public subclass: SubclassConfig;
  public x = 15;
  public y = 10;
  public radius = 0.45;
  public rot = 0;
  public aimX = 0;
  public aimY = 1;
  public moveX = 0;
  public moveY = 0;
  public isMoving = false;

  public level = 1;
  public xp = 0;
  public xpNext = 65;
  public pendingLevelUps = 0;
  public feats: FeatUpgrade[] = [];
  public skillAugments: SkillAugment[] = [];
  public activePacts: DarkPact[] = [];
  public skillCharges: Record<string, number> = {};
  public activeOrbs: { angle: number; radius: number; timer: number; color: number; damage: number }[] = [];
  public bonusShield = 0;

  public hp: number;
  public maxHp: number;
  public stats: CharacterStats;

  public equip: Partial<Record<'weapon' | 'armor' | 'helm' | 'ring' | 'relic', Item>> = {};
  public bag: Item[] = [];
  public gold = 0;

  // Cooldown timers
  public attackCd = 0;
  public attackAnimTimer = 0;
  public skill1Cd = 0;
  public skill2Cd = 0;
  public dashTimer = 0;
  public dashCd = 0;
  public dashMaxCd = 1.1;
  public invulnerableTimer = 0;
  public potions = 2;
  public potionCd = 0;

  // Attack combo & animation state
  public comboStep = 0; // 0 = spazzata (horizontal), 1 = taglio (vertical), 2 = affondo (thrust)
  public comboTimer = 0;
  public currentAttackType: AttackAnimationType = 'slash_horizontal';
  public attackDuration = 0.26;

  public usePotion(): boolean {
    if (this.potions <= 0 || this.hp >= this.maxHp || this.potionCd > 0) return false;
    this.potions--;
    this.potionCd = 3.5;
    this.heal(Math.round(this.maxHp * 0.45));
    return true;
  }

  // Active combat state
  public isSmiteCharged = false;
  public isActionSurgeActive = false;

  public rig: HumanoidRig;
  public mesh: THREE.Group;

  constructor(classId: ClassId, subclassIndex = 0) {
    this.classId = classId;
    const cfg = CLASSES_DATA[classId];
    this.subclass = cfg.subclasses[subclassIndex] || cfg.subclasses[0];

    // Initialize stats
    this.stats = { ...cfg.baseStats };
    this.applySubclassBonuses();
    this.hp = this.stats.maxHp;
    this.maxHp = this.stats.maxHp;

    // 3D Rig
    this.rig = buildPlayerModel(classId);
    this.mesh = this.rig.root;
    this.mesh.position.set(this.x, 0, this.y);

    this.rig.updateGearVisuals?.(this.equip, this.classId, this.subclass.weaponStyle);
  }

  public get currentSkill2() {
    return this.subclass.skill2;
  }

  public hasAugment(id: string): boolean {
    return this.skillAugments.some(a => a.id === id);
  }

  public getAugmentsFor(target: 'skill1' | 'skill2'): SkillAugment[] {
    return this.skillAugments.filter(a => a.skillTarget === target);
  }

  private applySubclassBonuses(): void {
    for (const [k, v] of Object.entries(this.subclass.statBonus)) {
      const key = k as keyof CharacterStats;
      this.stats[key] = (this.stats[key] || 0) + (v as number);
    }
  }

  public recalculateStats(): void {
    const base = CLASSES_DATA[this.classId].baseStats;
    const newStats: CharacterStats = { ...base };

    // Add subclass
    for (const [k, v] of Object.entries(this.subclass.statBonus)) {
      const key = k as keyof CharacterStats;
      newStats[key] = (newStats[key] || 0) + (v as number);
    }

    // Meaningful & rewarding level progression (slower pace, but great tangible power jump)
    newStats.maxHp += (this.level - 1) * 16;
    newStats.damage += (this.level - 1) * 2.4;
    newStats.armor += (this.level - 1) * 1.5;
    newStats.critChance += (this.level - 1) * 1.0;
    newStats.spellPower += (this.level - 1) * 3.5;

    // Add equipped gear
    for (const item of Object.values(this.equip)) {
      if (!item) continue;
      for (const [k, v] of Object.entries(item.stats)) {
        const key = k as keyof CharacterStats;
        newStats[key] = (newStats[key] || 0) + (v as number);
      }
    }

    // Add feats bonuses
    for (const feat of this.feats) {
      if (feat.statBonuses) {
        for (const [k, v] of Object.entries(feat.statBonuses)) {
          const key = k as keyof CharacterStats;
          newStats[key] = (newStats[key] || 0) + (v as number);
        }
      }
    }

    const hpPercent = this.hp / this.maxHp;
    this.stats = newStats;
    this.maxHp = newStats.maxHp;
    this.hp = Math.min(this.maxHp, Math.round(this.maxHp * hpPercent));

    // Update 3D visual equipment
    this.rig.updateGearVisuals?.(this.equip, this.classId, this.subclass.weaponStyle);
  }

  public addXp(amount: number): boolean {
    this.xp += amount;
    let leveledUp = false;
    while (this.xp >= this.xpNext) {
      this.xp -= this.xpNext;
      this.level++;
      // Slower XP curve: level-ups feel earned and impactful
      this.xpNext = Math.round(this.xpNext * 1.55 + 20);
      this.pendingLevelUps++;
      this.recalculateStats();
      // Generous 50% max HP restoration upon level up
      this.hp = Math.min(this.maxHp, this.hp + Math.round(this.maxHp * 0.50));
      leveledUp = true;
    }
    return leveledUp;
  }

  public move(dx: number, dy: number, dt: number, room: DungeonRoom): void {
    const len = Math.hypot(dx, dy);
    this.isMoving = len > 0.1;

    if (this.isMoving) {
      this.moveX = dx / len;
      this.moveY = dy / len;
    }

    // Determine movement speed (dash or normal)
    let moveSpeed = this.stats.speed;
    if (this.dashTimer > 0) {
      this.dashTimer -= dt;
      moveSpeed = this.stats.speed * 2.8;
    }

    const vx = (this.dashTimer > 0 ? this.moveX : dx) * moveSpeed * dt;
    const vy = (this.dashTimer > 0 ? this.moveY : dy) * moveSpeed * dt;

    // Smooth sliding collision against room boundaries & walls
    dungeon.moveEntity(room, this, vx, vy);

    // Face aiming direction or movement direction
    const targetAngle = Math.atan2(this.aimX, this.aimY);
    let diff = targetAngle - this.rot;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.rot += diff * Math.min(1, dt * 16);

    // Update 3D mesh position and animations
    this.mesh.position.set(this.x, 0, this.y);
    this.mesh.rotation.y = this.rot;

    if (this.attackAnimTimer > 0) {
      this.attackAnimTimer -= dt;
    }
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.comboStep = 0;
      }
    }
    if (this.dashCd > 0) this.dashCd -= dt;

    const duration = this.attackDuration || 0.26;
    const attackProgress = this.attackAnimTimer > 0 ? (1.0 - this.attackAnimTimer / duration) : 0;
    this.rig.animate(
      performance.now() * 0.001,
      len,
      attackProgress,
      this.currentAttackType,
      this.dashTimer > 0
    );

    // Timers update
    if (this.attackCd > 0) this.attackCd -= dt;
    if (this.skill1Cd > 0) this.skill1Cd -= dt;
    if (this.skill2Cd > 0) this.skill2Cd -= dt;
    if (this.potionCd > 0) this.potionCd -= dt;
    if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;

    // Update active orbs (orbiting fire/holy orbs)
    for (let i = this.activeOrbs.length - 1; i >= 0; i--) {
      const orb = this.activeOrbs[i];
      orb.timer -= dt;
      orb.angle += dt * 3.6;
      if (orb.timer <= 0) {
        this.activeOrbs.splice(i, 1);
      }
    }

    // Passive regeneration
    if (this.stats.hpRegen > 0 && this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + this.stats.hpRegen * dt);
    }
  }

  public takeDamage(amount: number): number {
    if (this.invulnerableTimer > 0 || this.dashTimer > 0) return 0;

    // Shield absorption from skill augments
    if (this.bonusShield > 0) {
      if (this.bonusShield >= amount) {
        this.bonusShield -= amount;
        return 0;
      } else {
        amount -= this.bonusShield;
        this.bonusShield = 0;
      }
    }

    // D&D armor reduction
    const damageReduction = Math.min(0.65, this.stats.armor / (this.stats.armor + 40));
    const finalDamage = Math.max(1, Math.round(amount * (1 - damageReduction)));

    this.hp -= finalDamage;
    this.invulnerableTimer = 0.45; // I-frames

    // Haptic feedback for mobile
    if ('vibrate' in navigator) {
      try { navigator.vibrate([40, 30, 40]); } catch { /* ignore */ }
    }

    return finalDamage;
  }

  public heal(amount: number): number {
    const prev = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    return this.hp - prev;
  }
}
