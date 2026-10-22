// Allied Companion NPC Entity (Lyanna the Archer & Brother Elidor the Cleric)
// The Albedo Renegades: Shadow of Elanthria

import * as THREE from 'three';
import type { AllyType } from '../types/game.ts';
import { buildAllyModel } from '../graphics/proceduralModels.ts';
import type { Player } from './player.ts';
import type { Enemy } from './enemy.ts';
import { dungeon, type DungeonRoom } from '../world/dungeonGenerator.ts';
import { sound } from '../audio/soundEngine.ts';
import { particles } from '../graphics/particles.ts';
import { combat } from '../combat/combatSystem.ts';

export class Ally {
  public type: AllyType;
  public name: string;
  public x: number;
  public y: number;
  public hp: number;
  public maxHp: number;
  public damage: number;
  public radius = 0.45;
  public isDead = false;

  public mesh: THREE.Group;
  private updateModel: (t: number, moving: boolean) => void;
  private attackTimer = 1.0;
  private healTimer = 6.0;

  constructor(type: AllyType, x: number, y: number) {
    this.type = type;
    this.name = type === 'archer_lyanna' ? 'Lyanna la Cacciatrice' : 'Frate Elidor il Devoto';
    this.x = x;
    this.y = y;
    this.maxHp = type === 'archer_lyanna' ? 120 : 160;
    this.hp = this.maxHp;
    this.damage = type === 'archer_lyanna' ? 22 : 16;

    const modelObj = buildAllyModel(type);
    this.mesh = modelObj.root;
    this.updateModel = modelObj.update;
    this.mesh.position.set(x, 0, y);
  }

  public update(dt: number, player: Player, enemies: Enemy[], room: DungeonRoom): void {
    if (this.isDead) return;

    // Follow player logic
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distToPlayer = Math.hypot(dx, dy);

    let isMoving = false;
    if (distToPlayer > 2.2) {
      isMoving = true;
      const speed = 4.2;
      const moveX = (dx / distToPlayer) * speed * dt;
      const moveY = (dy / distToPlayer) * speed * dt;
      dungeon.moveEntity(room, this, moveX, moveY);
      this.mesh.rotation.y = Math.atan2(dx, dy);
    }

    this.mesh.position.set(this.x, 0, this.y);
    this.updateModel(performance.now() * 0.001, isMoving);

    // Combat AI: Find closest alive enemy
    let closestEnemy: Enemy | null = null;
    let closestDist = 8.5;

    for (const e of enemies) {
      if (e.isDead) continue;
      const dist = Math.hypot(e.x - this.x, e.y - this.y);
      if (dist < closestDist) {
        closestDist = dist;
        closestEnemy = e;
      }
    }

    this.attackTimer -= dt;
    if (this.attackTimer <= 0 && closestEnemy) {
      this.attackTimer = this.type === 'archer_lyanna' ? 1.3 : 1.8;
      this.attackEnemy(closestEnemy);
    }

    // Cleric healing pulse every 7.5 seconds
    if (this.type === 'cleric_elidor') {
      this.healTimer -= dt;
      if (this.healTimer <= 0) {
        this.healTimer = 7.5;
        if (player.hp < player.maxHp) {
          const healAmount = Math.round(player.maxHp * 0.22);
          player.heal(healAmount);
          sound.heal();
          particles.spawnShockwave(this.x, this.y, 4.0, 0x55ff77);
          particles.spawnFloatingText(player.x, 2.4, player.y, `ELIDOR: +${healAmount} PV!`, '#55ff77', true);
        }
      }
    }
  }

  private attackEnemy(target: Enemy): void {
    const edx = target.x - this.x;
    const edy = target.y - this.y;
    const edist = Math.hypot(edx, edy) || 1;
    const dirX = edx / edist;
    const dirY = edy / edist;

    this.mesh.rotation.y = Math.atan2(dirX, dirY);

    if (this.type === 'archer_lyanna') {
      sound.shootArrow();
      combat.spawnProjectile(
        this.x + dirX * 0.5,
        this.y + dirY * 0.5,
        dirX * 16,
        dirY * 16,
        0.25,
        this.damage,
        true,
        0x44ff88,
        1
      );
      particles.spawnBurst(this.x, 0.8, this.y, 6, 0x44ff88, 3);
    } else {
      sound.smite();
      combat.spawnProjectile(
        this.x + dirX * 0.5,
        this.y + dirY * 0.5,
        dirX * 12,
        dirY * 12,
        0.35,
        this.damage,
        true,
        0xffea00,
        0,
        'smite'
      );
      particles.spawnBurst(this.x, 1.0, this.y, 8, 0xffea00, 3);
    }
  }

  public takeDamage(amount: number): void {
    this.hp -= amount;
    particles.spawnFloatingText(this.x, 1.8, this.y, `-${amount}`, '#ff5555');
    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
      particles.spawnBurst(this.x, 1.0, this.y, 25, 0x888888, 5);
      particles.spawnFloatingText(this.x, 2.2, this.y, `${this.name} è caduto!`, '#ff4444', true);
    }
  }
}
