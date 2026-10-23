// Real-Time 60fps Physics Engine with Rapier WebAssembly
// The Albedo Renegades: Shadow of Elanthria - Hades Combat Movement

import RAPIER from '@dimforge/rapier3d-compat';
import type { Player } from '../entities/player.ts';
import type { Enemy } from '../entities/enemy.ts';
import type { DungeonRoom } from '../world/dungeonGenerator.ts';
import { WORLD_W, WORLD_H, DOOR_CX, DOOR_CY } from '../world/dungeonGenerator.ts';

export interface RaycastHitResult {
  hit: boolean;
  distance: number;
  point: { x: number; z: number };
  normal: { x: number; z: number };
  hitType: 'wall' | 'prop' | 'enemy' | 'none';
  entityId?: number;
}

export class PhysicsEngine {
  public isReady = false;
  private rapier: typeof RAPIER | null = null;
  public world: RAPIER.World | null = null;

  // Player physics body & controller
  private playerBody: RAPIER.RigidBody | null = null;
  private playerCollider: RAPIER.Collider | null = null;
  private characterController: RAPIER.KinematicCharacterController | null = null;

  // Active room static colliders & door blockers
  private roomColliders: RAPIER.Collider[] = [];
  private doorColliders: RAPIER.Collider[] = [];
  private propColliderMap = new Map<number, RAPIER.Collider>();

  // Enemy rigidbodies
  private enemyBodies = new Map<number, { body: RAPIER.RigidBody; collider: RAPIER.Collider; enemy: Enemy }>();

  public async init(): Promise<boolean> {
    try {
      await RAPIER.init();
      this.rapier = RAPIER;
      // Top-down 2.5D action plane: zero gravity along vertical axis
      this.world = new RAPIER.World({ x: 0, y: 0, z: 0 });

      // Create Kinematic Character Controller for responsive responsive controls & dash
      this.characterController = this.world.createCharacterController(0.08);
      this.characterController.enableAutostep(0.35, 0.2, true);
      this.characterController.enableSnapToGround(0.2);
      this.characterController.setApplyImpulsesToDynamicBodies(true);

      // Create Player RigidBody
      const bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(WORLD_W / 2, 0.9, WORLD_H / 2);
      this.playerBody = this.world.createRigidBody(bodyDesc);

      // Player capsule collider (radius 0.45, half-height 0.4)
      const colliderDesc = RAPIER.ColliderDesc.capsule(0.4, 0.45).setFriction(0.1).setRestitution(0.0);
      this.playerCollider = this.world.createCollider(colliderDesc, this.playerBody);

      this.isReady = true;
      console.log('⚡ Rapier 3D Physics Engine Initialized Successfully at 60 FPS!');
      return true;
    } catch (err) {
      console.error('⚠️ Rapier Physics init failed, operating with fallback sliding physics:', err);
      this.isReady = false;
      return false;
    }
  }

  // --- IMMEDIATE PLAYER RIGIDBODY POSITION SYNCHRONIZATION ---
  public syncPlayerPosition(x: number, y: number): void {
    if (this.playerBody) {
      this.playerBody.setTranslation({ x, y: 0.9, z: y }, true);
      this.playerBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }
  }

  // --- ROOM STATIC COLLIDERS & ENVIRONMENT ---
  public loadRoomColliders(room: DungeonRoom): void {
    if (!this.world || !this.rapier) return;

    // Clean up previous room colliders & door blockers
    for (const c of this.roomColliders) {
      this.world.removeCollider(c, true);
    }
    for (const c of this.doorColliders) {
      this.world.removeCollider(c, true);
    }
    this.roomColliders = [];
    this.doorColliders = [];
    this.propColliderMap.clear();

    const R = this.rapier;
    const wallThickness = 1.0;
    const wallHeight = 4.0;
    const doorGapHalf = 1.8;

    // 1. North Wall (split if door exists, solid if no door)
    if (room.doors.n) {
      const nw1 = R.ColliderDesc.cuboid((DOOR_CX - doorGapHalf) / 2, wallHeight / 2, wallThickness / 2)
        .setTranslation((DOOR_CX - doorGapHalf) / 2, wallHeight / 2, 0.5);
      const nw2 = R.ColliderDesc.cuboid((WORLD_W - (DOOR_CX + doorGapHalf)) / 2, wallHeight / 2, wallThickness / 2)
        .setTranslation(DOOR_CX + doorGapHalf + (WORLD_W - (DOOR_CX + doorGapHalf)) / 2, wallHeight / 2, 0.5);
      this.roomColliders.push(this.world.createCollider(nw1), this.world.createCollider(nw2));

      // If room is locked / uncleared, block the door opening with a barrier
      if (!room.cleared) {
        const doorCol = R.ColliderDesc.cuboid(doorGapHalf, wallHeight / 2, wallThickness / 2)
          .setTranslation(DOOR_CX, wallHeight / 2, 0.5);
        this.doorColliders.push(this.world.createCollider(doorCol));
      }
    } else {
      const solidNorth = R.ColliderDesc.cuboid(WORLD_W / 2, wallHeight / 2, wallThickness / 2)
        .setTranslation(WORLD_W / 2, wallHeight / 2, 0.5);
      this.roomColliders.push(this.world.createCollider(solidNorth));
    }

    // 2. South Wall
    if (room.doors.s) {
      const sw1 = R.ColliderDesc.cuboid((DOOR_CX - doorGapHalf) / 2, wallHeight / 2, wallThickness / 2)
        .setTranslation((DOOR_CX - doorGapHalf) / 2, wallHeight / 2, WORLD_H - 0.5);
      const sw2 = R.ColliderDesc.cuboid((WORLD_W - (DOOR_CX + doorGapHalf)) / 2, wallHeight / 2, wallThickness / 2)
        .setTranslation(DOOR_CX + doorGapHalf + (WORLD_W - (DOOR_CX + doorGapHalf)) / 2, wallHeight / 2, WORLD_H - 0.5);
      this.roomColliders.push(this.world.createCollider(sw1), this.world.createCollider(sw2));

      if (!room.cleared) {
        const doorCol = R.ColliderDesc.cuboid(doorGapHalf, wallHeight / 2, wallThickness / 2)
          .setTranslation(DOOR_CX, wallHeight / 2, WORLD_H - 0.5);
        this.doorColliders.push(this.world.createCollider(doorCol));
      }
    } else {
      const solidSouth = R.ColliderDesc.cuboid(WORLD_W / 2, wallHeight / 2, wallThickness / 2)
        .setTranslation(WORLD_W / 2, wallHeight / 2, WORLD_H - 0.5);
      this.roomColliders.push(this.world.createCollider(solidSouth));
    }

    // 3. West Wall
    if (room.doors.w) {
      const ww1 = R.ColliderDesc.cuboid(wallThickness / 2, wallHeight / 2, (DOOR_CY - doorGapHalf) / 2)
        .setTranslation(0.5, wallHeight / 2, (DOOR_CY - doorGapHalf) / 2);
      const ww2 = R.ColliderDesc.cuboid(wallThickness / 2, wallHeight / 2, (WORLD_H - (DOOR_CY + doorGapHalf)) / 2)
        .setTranslation(0.5, wallHeight / 2, DOOR_CY + doorGapHalf + (WORLD_H - (DOOR_CY + doorGapHalf)) / 2);
      this.roomColliders.push(this.world.createCollider(ww1), this.world.createCollider(ww2));

      if (!room.cleared) {
        const doorCol = R.ColliderDesc.cuboid(wallThickness / 2, wallHeight / 2, doorGapHalf)
          .setTranslation(0.5, wallHeight / 2, DOOR_CY);
        this.doorColliders.push(this.world.createCollider(doorCol));
      }
    } else {
      const solidWest = R.ColliderDesc.cuboid(wallThickness / 2, wallHeight / 2, WORLD_H / 2)
        .setTranslation(0.5, wallHeight / 2, WORLD_H / 2);
      this.roomColliders.push(this.world.createCollider(solidWest));
    }

    // 4. East Wall
    if (room.doors.e) {
      const ew1 = R.ColliderDesc.cuboid(wallThickness / 2, wallHeight / 2, (DOOR_CY - doorGapHalf) / 2)
        .setTranslation(WORLD_W - 0.5, wallHeight / 2, (DOOR_CY - doorGapHalf) / 2);
      const ew2 = R.ColliderDesc.cuboid(wallThickness / 2, wallHeight / 2, (WORLD_H - (DOOR_CY + doorGapHalf)) / 2)
        .setTranslation(WORLD_W - 0.5, wallHeight / 2, DOOR_CY + doorGapHalf + (WORLD_H - (DOOR_CY + doorGapHalf)) / 2);
      this.roomColliders.push(this.world.createCollider(ew1), this.world.createCollider(ew2));

      if (!room.cleared) {
        const doorCol = R.ColliderDesc.cuboid(wallThickness / 2, wallHeight / 2, doorGapHalf)
          .setTranslation(WORLD_W - 0.5, wallHeight / 2, DOOR_CY);
        this.doorColliders.push(this.world.createCollider(doorCol));
      }
    } else {
      const solidEast = R.ColliderDesc.cuboid(wallThickness / 2, wallHeight / 2, WORLD_H / 2)
        .setTranslation(WORLD_W - 0.5, wallHeight / 2, WORLD_H / 2);
      this.roomColliders.push(this.world.createCollider(solidEast));
    }

    // 5. Internal Walls, Pillars, and Chasms from room.tiles
    const tileSize = 2.0;
    const tileRows = room.tiles.length;
    const tileCols = room.tiles[0]?.length || 0;
    for (let ty = 1; ty < tileRows - 1; ty++) {
      for (let tx = 1; tx < tileCols - 1; tx++) {
        const val = room.tiles[ty][tx];
        if (val === 1 || val === 2 || val === 4) {
          const cx = tx * tileSize + tileSize / 2;
          const cz = ty * tileSize + tileSize / 2;
          const tileCol = R.ColliderDesc.cuboid(tileSize / 2, wallHeight / 2, tileSize / 2)
            .setTranslation(cx, wallHeight / 2, cz);
          this.roomColliders.push(this.world.createCollider(tileCol));
        }
      }
    }

    // 6. Internal Destructible Props (Barrels, Sarcophagi, Weapon Racks, Crates, Tables)
    for (const pr of room.props) {
      if (pr.hp <= 0 && (pr.type === 'explosive_barrel' || pr.type === 'toxic_barrel' || pr.type === 'sarcophagus')) continue;

      let cDesc: RAPIER.ColliderDesc | null = null;
      if (pr.type === 'sarcophagus') {
        cDesc = R.ColliderDesc.cuboid(0.7, 0.6, 0.5).setTranslation(pr.x, 0.6, pr.y);
      } else if (pr.type === 'explosive_barrel' || pr.type === 'toxic_barrel' || pr.type === 'barrel') {
        cDesc = R.ColliderDesc.cylinder(0.6, 0.45).setTranslation(pr.x, 0.6, pr.y);
      } else if (pr.type === 'weapon_rack') {
        cDesc = R.ColliderDesc.cuboid(0.8, 0.6, 0.3).setTranslation(pr.x, 0.6, pr.y);
      } else if (pr.type === 'crate') {
        cDesc = R.ColliderDesc.cuboid(0.5, 0.5, 0.5).setTranslation(pr.x, 0.5, pr.y);
      } else if (pr.type === 'table') {
        cDesc = R.ColliderDesc.cuboid(0.8, 0.5, 0.5).setTranslation(pr.x, 0.5, pr.y);
      }

      if (cDesc && this.world) {
        const c = this.world.createCollider(cDesc);
        this.roomColliders.push(c);
        this.propColliderMap.set(pr.id, c);
      }
    }
  }

  // Open door colliders when room is cleared
  public openDoors(): void {
    if (!this.world) return;
    for (const c of this.doorColliders) {
      this.world.removeCollider(c, true);
    }
    this.doorColliders = [];
  }

  // Remove collider when a prop is destroyed (e.g. explosive barrel)
  public removePropCollider(propId: number): void {
    if (!this.world) return;
    const c = this.propColliderMap.get(propId);
    if (c) {
      this.world.removeCollider(c, true);
      this.propColliderMap.delete(propId);
    }
  }

  // --- PLAYER MOVEMENT & HADES-STYLE DASH ---
  public movePlayer(player: Player, vx: number, vy: number, _dt?: number): void {
    if (!this.world || !this.playerBody || !this.playerCollider || !this.characterController) {
      player.x += vx;
      player.y += vy;
      return;
    }

    // Set kinematic body position to current player coords
    this.playerBody.setTranslation({ x: player.x, y: 0.9, z: player.y }, true);

    // Compute continuous collision movement with wall sliding
    const desiredMove = { x: vx, y: 0, z: vy };
    this.characterController.computeColliderMovement(this.playerCollider, desiredMove, undefined, undefined, (collider) => {
      // Ignore sensor triggers
      return !collider.isSensor();
    });

    const correctedMove = this.characterController.computedMovement();
    player.x += correctedMove.x;
    player.y += correctedMove.z;

    // Keep within world bounds (generous margin allowing full doorway entry)
    player.x = Math.max(0.6, Math.min(WORLD_W - 0.6, player.x));
    player.y = Math.max(0.6, Math.min(WORLD_H - 0.6, player.y));

    // Keep Rapier body synced with resulting position
    this.playerBody.setTranslation({ x: player.x, y: 0.9, z: player.y }, true);
  }

  // --- ENEMY RIGIDBODIES & SEPARATION ---
  public syncEnemies(enemies: Enemy[]): void {
    if (!this.world || !this.rapier) return;
    const R = this.rapier;

    const currentEnemyIds = new Set(enemies.filter(e => !e.isDead).map(e => e.id));

    // Remove dead/unregistered enemies
    for (const [id, data] of this.enemyBodies) {
      if (!currentEnemyIds.has(id)) {
        this.world.removeCollider(data.collider, true);
        this.world.removeRigidBody(data.body);
        this.enemyBodies.delete(id);
      }
    }

    // Create or update active enemy physics bodies
    for (const e of enemies) {
      if (e.isDead) continue;
      let record = this.enemyBodies.get(e.id);
      if (!record) {
        const bodyDesc = R.RigidBodyDesc.dynamic()
          .setTranslation(e.x, 0.8, e.y)
          .setLinearDamping(4.5)
          .lockRotations();
        const body = this.world.createRigidBody(bodyDesc);
        const colDesc = R.ColliderDesc.cylinder(0.8, e.radius)
          .setFriction(0.2)
          .setRestitution(0.1);
        const collider = this.world.createCollider(colDesc, body);

        record = { body, collider, enemy: e };
        this.enemyBodies.set(e.id, record);
      } else {
        const linvel = record.body.linvel();
        const impulseSpeed = Math.hypot(linvel.x, linvel.z);
        if (impulseSpeed > 0.2) {
          // Physics impulse knockback actively in effect: update enemy coordinates from simulation clamped to arena bounds
          const t = record.body.translation();
          e.x = Math.max(e.radius + 1.0, Math.min(WORLD_W - e.radius - 1.0, t.x));
          e.y = Math.max(e.radius + 1.0, Math.min(WORLD_H - e.radius - 1.0, t.z));
        } else {
          // Follow enemy navigation coordinates
          record.body.setTranslation({ x: e.x, y: 0.8, z: e.y }, true);
        }
      }
    }
  }

  public applyKnockbackToEnemy(enemyId: number, impulseX: number, impulseY: number): void {
    const record = this.enemyBodies.get(enemyId);
    if (record) {
      record.body.applyImpulse({ x: impulseX, y: 0, z: impulseY }, true);
    }
  }

  // --- HADES-STYLE MELEE SWEEP HITBOX DETECTION ---
  public castMeleeArc(
    attackerX: number,
    attackerZ: number,
    dirX: number,
    dirZ: number,
    radius: number,
    arcRadian: number,
    enemies: Enemy[]
  ): Enemy[] {
    const hits: Enemy[] = [];
    const len = Math.hypot(dirX, dirZ) || 1;
    const normDirX = dirX / len;
    const normDirZ = dirZ / len;

    for (const e of enemies) {
      if (e.isDead) continue;
      const dx = e.x - attackerX;
      const dz = e.y - attackerZ;
      const dist = Math.hypot(dx, dz);

      if (dist <= radius + e.radius) {
        // Dot product to check if within cone arc
        const dot = (dx * normDirX + dz * normDirZ) / (dist || 1);
        const minDot = Math.cos(arcRadian / 2);

        if (dot >= minDot) {
          hits.push(e);
        }
      }
    }
    return hits;
  }

  // --- CONTINUOUS COLLISION DETECTION (CCD) RAYCAST FOR FAST PROJECTILES ---
  public castRay(startX: number, startZ: number, dirX: number, dirZ: number, maxDist: number): RaycastHitResult {
    const result: RaycastHitResult = {
      hit: false,
      distance: maxDist,
      point: { x: startX + dirX * maxDist, z: startZ + dirZ * maxDist },
      normal: { x: 0, z: 0 },
      hitType: 'none'
    };

    if (!this.world || !this.rapier) return result;

    const len = Math.hypot(dirX, dirZ) || 1;
    const ray = new this.rapier.Ray(
      { x: startX, y: 0.8, z: startZ },
      { x: dirX / len, y: 0, z: dirZ / len }
    );

    const hit = this.world.castRayAndGetNormal(ray, maxDist, true);
    if (hit) {
      result.hit = true;
      result.distance = hit.timeOfImpact;
      const hitPoint = ray.pointAt(hit.timeOfImpact);
      result.point.x = hitPoint.x;
      result.point.z = hitPoint.z;
      result.normal.x = hit.normal.x;
      result.normal.z = hit.normal.z;
      result.hitType = 'wall';
    }

    return result;
  }

  // --- WORLD STEP ---
  public update(dt: number): void {
    if (!this.world || !this.isReady) return;
    // Step Rapier Physics World at fixed or dynamic timestep
    this.world.timestep = Math.min(dt, 0.033);
    this.world.step();
  }
}

export const physics = new PhysicsEngine();
