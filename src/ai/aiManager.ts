// Tactical Enemy AI with YUKA Steering Behaviors & Autonomous Agents
// The Albedo Renegades: Shadow of Elanthria - Hades Combat AI

import * as YUKA from 'yuka';
import type { Player } from '../entities/player.ts';
import type { Enemy } from '../entities/enemy.ts';
import type { DungeonRoom } from '../world/dungeonGenerator.ts';
import type { TacticalCoverPoint } from '../world/arenaPrefabs.ts';

export interface VehicleRecord {
  vehicle: YUKA.Vehicle;
  enemy: Enemy;
  seekBehavior?: YUKA.SeekBehavior;
  arriveBehavior?: YUKA.ArriveBehavior;
  fleeBehavior?: YUKA.FleeBehavior;
  pursuitBehavior?: YUKA.PursuitBehavior;
  separationBehavior?: YUKA.SeparationBehavior;
  obstacleAvoidanceBehavior?: YUKA.ObstacleAvoidanceBehavior;
}

export class AIManager {
  public entityManager: YUKA.EntityManager;
  public targetVehicle: YUKA.Vehicle;
  private enemyVehicles = new Map<number, VehicleRecord>();
  private obstacles = new Map<number, YUKA.GameEntity>();
  private obstacleList: YUKA.GameEntity[] = [];
  public coverPoints: TacticalCoverPoint[] = [];

  constructor() {
    this.entityManager = new YUKA.EntityManager();

    // Target vehicle representing the Player
    this.targetVehicle = new YUKA.Vehicle();
    this.targetVehicle.maxSpeed = 10;
    this.entityManager.add(this.targetVehicle);
  }

  // --- SYNC ROOM OBSTACLES (Pillars, Statues, Barrels) ---
  public loadRoomObstacles(room: DungeonRoom): void {
    // Clear old obstacles
    for (const obs of this.obstacleList) {
      this.entityManager.remove(obs);
    }
    this.obstacles.clear();
    this.obstacleList = [];
    this.coverPoints = room.coverPoints || [];

    // 1. Register stone pillars from room.tiles as YUKA obstacles
    const tileSize = 2.0;
    const tileRows = room.tiles.length;
    const tileCols = room.tiles[0]?.length || 0;
    for (let ty = 1; ty < tileRows - 1; ty++) {
      for (let tx = 1; tx < tileCols - 1; tx++) {
        if (room.tiles[ty][tx] === 2) {
          const obs = new YUKA.GameEntity();
          obs.position.set(tx * tileSize + tileSize / 2, 0, ty * tileSize + tileSize / 2);
          obs.boundingRadius = 1.1;
          this.entityManager.add(obs);
          this.obstacleList.push(obs);
        }
      }
    }

    // 2. Register solid props as YUKA obstacles
    for (const pr of room.props) {
      if (pr.hp <= 0 && (pr.type === 'explosive_barrel' || pr.type === 'toxic_barrel')) continue;

      const obs = new YUKA.GameEntity();
      obs.position.set(pr.x, 0, pr.y);
      obs.boundingRadius = pr.type === 'sarcophagus' ? 1.0 : (pr.type === 'crate' ? 0.8 : 0.65);
      this.entityManager.add(obs);
      this.obstacles.set(pr.id, obs);
      this.obstacleList.push(obs);
    }
  }

  public removeObstacle(propId: number): void {
    const obs = this.obstacles.get(propId);
    if (obs) {
      this.entityManager.remove(obs);
      this.obstacles.delete(propId);
      this.obstacleList = Array.from(this.obstacles.values());
      for (const [, record] of this.enemyVehicles) {
        if (record.obstacleAvoidanceBehavior) {
          record.obstacleAvoidanceBehavior.obstacles = this.obstacleList;
        }
      }
    }
  }

  // --- SYNCHRONIZE ACTIVE ENEMIES WITH YUKA AUTONOMOUS AGENTS ---
  public syncEnemies(enemies: Enemy[], player: Player): void {
    // 1. Update Player target vehicle
    this.targetVehicle.position.set(player.x, 0, player.y);
    this.targetVehicle.velocity.set(player.moveX * player.stats.speed, 0, player.moveY * player.stats.speed);

    const activeEnemyIds = new Set(enemies.filter(e => !e.isDead).map(e => e.id));

    // 2. Remove dead/despawned enemy vehicles
    for (const [id, record] of this.enemyVehicles) {
      if (!activeEnemyIds.has(id)) {
        this.entityManager.remove(record.vehicle);
        this.enemyVehicles.delete(id);
      }
    }

    // 3. Register or update active enemy vehicles
    for (const e of enemies) {
      if (e.isDead) continue;

      let record = this.enemyVehicles.get(e.id);
      if (!record) {
        const vehicle = new YUKA.Vehicle();
        vehicle.position.set(e.x, 0, e.y);
        vehicle.maxSpeed = e.stats.speed;
        vehicle.maxForce = 35;
        vehicle.boundingRadius = e.radius;
        vehicle.mass = e.stats.isBoss ? 5.0 : 1.0;

        // Configure archetype-specific steering behaviors (Hades AI)
        const isRanged = e.stats.attackType === 'projectile';
        const isAssassin = e.type === 'elven_shadow' || e.type === 'orc_berserker';

        // 1. Separation Behavior: keeps mob swarm naturally spread
        const separation = new YUKA.SeparationBehavior();
        separation.weight = 1.6;
        vehicle.steering.add(separation);

        // 2. Obstacle Avoidance: smoothly steers around room pillars and barrels
        const obstacleAvoidance = new YUKA.ObstacleAvoidanceBehavior(this.obstacleList);
        obstacleAvoidance.weight = 2.2;
        vehicle.steering.add(obstacleAvoidance);

        let arrive: YUKA.ArriveBehavior | undefined;
        let pursuit: YUKA.PursuitBehavior | undefined;
        let flee: YUKA.FleeBehavior | undefined;
        let seek: YUKA.SeekBehavior | undefined;

        if (isRanged) {
          // Ranged kiting: flees when player gets within 4.0 units, seeks if > 9.0 units
          flee = new YUKA.FleeBehavior(this.targetVehicle.position, 4.2);
          flee.weight = 2.5;
          vehicle.steering.add(flee);

          seek = new YUKA.SeekBehavior(this.targetVehicle.position);
          seek.weight = 0.8;
          vehicle.steering.add(seek);

        } else if (isAssassin) {
          // Fast pursuit: predicts player trajectory (leads the target)
          pursuit = new YUKA.PursuitBehavior(this.targetVehicle, 1.8);
          pursuit.weight = 2.0;
          vehicle.steering.add(pursuit);

        } else {
          // Melee bruisers: Arrive behavior (rushes player, smoothly decelerates into attack range)
          arrive = new YUKA.ArriveBehavior(this.targetVehicle.position, e.stats.attackRange * 0.75, 0.4);
          arrive.weight = 2.0;
          vehicle.steering.add(arrive);
        }

        this.entityManager.add(vehicle);
        record = {
          vehicle,
          enemy: e,
          arriveBehavior: arrive,
          pursuitBehavior: pursuit,
          fleeBehavior: flee,
          seekBehavior: seek,
          separationBehavior: separation,
          obstacleAvoidanceBehavior: obstacleAvoidance
        };
        this.enemyVehicles.set(e.id, record);
      } else {
        // Sync vehicle position and dynamic target
        record.vehicle.maxSpeed = e.stats.speed;

        if (record.arriveBehavior) {
          record.arriveBehavior.target = this.targetVehicle.position;
        }
        if (record.fleeBehavior) {
          record.fleeBehavior.target = this.targetVehicle.position;
        }
        if (record.seekBehavior) {
          record.seekBehavior.target = this.targetVehicle.position;
        }
      }
    }
  }

  // --- COMPUTE ENEMY VELOCITY VECTOR VIA YUKA STEERING BEHAVIORS ---
  public getSteeringVelocity(enemyId: number, dt: number): { vx: number; vz: number } | null {
    const record = this.enemyVehicles.get(enemyId);
    if (!record) return null;

    const v = record.vehicle;
    // Flanking encircling offset for melee mobs
    const distToPlayer = v.position.distanceTo(this.targetVehicle.position);
    let flankX = 0;
    let flankZ = 0;

    if (distToPlayer < 7.5 && distToPlayer > 1.8) {
      // Calculate lateral perpendicular flank force
      const toPlayerX = this.targetVehicle.position.x - v.position.x;
      const toPlayerZ = this.targetVehicle.position.z - v.position.z;
      const perpX = -toPlayerZ / (distToPlayer || 1);
      const perpZ = toPlayerX / (distToPlayer || 1);
      const flankDir = (enemyId % 2 === 0 ? 1 : -1);
      flankX = perpX * flankDir * 1.2;
      flankZ = perpZ * flankDir * 1.2;
    }

    // Tactical Cover Evaluation for ranged or low-health enemies
    let coverPullX = 0;
    let coverPullZ = 0;
    const isRanged = record.enemy.stats.attackType === 'projectile';
    const isWounded = record.enemy.hp < record.enemy.maxHp * 0.45;

    if ((isRanged || isWounded) && this.coverPoints.length > 0 && distToPlayer < 6.5) {
      let nearestDist = 999;
      let targetCover: TacticalCoverPoint | null = null;
      for (const cp of this.coverPoints) {
        const d = Math.hypot(cp.x - v.position.x, cp.y - v.position.z);
        if (d < nearestDist && d > 0.4) {
          nearestDist = d;
          targetCover = cp;
        }
      }
      if (targetCover && nearestDist < 5.0) {
        coverPullX = (targetCover.x - v.position.x) * 0.35;
        coverPullZ = (targetCover.y - v.position.z) * 0.35;
      }
    }

    const vx = (v.velocity.x + flankX + coverPullX) * dt;
    const vz = (v.velocity.z + flankZ + coverPullZ) * dt;
    return { vx, vz };
  }

  // --- UPDATE YUKA ENTITY MANAGER SIMULATION ---
  public update(dt: number): void {
    this.entityManager.update(Math.min(dt, 0.05));

    // Update vehicle positions with enemies
    for (const [, record] of this.enemyVehicles) {
      record.vehicle.position.set(record.enemy.x, 0, record.enemy.y);
    }
  }
}

export const aiManager = new AIManager();
