// Procedural Dungeon Generator with Complex Random Room Shapes
// The Albedo Renegades: Shadow of Elanthria

import * as THREE from 'three';
import type { DestructibleProp, ZoneConfig, RoomType } from '../types/game.ts';
import { GEO, getLambert, getBasic, buildPropModel } from '../graphics/proceduralModels.ts';
import {
  TILE_SIZE,
  ROOM_WIDTH,
  ROOM_HEIGHT,
  WORLD_W,
  WORLD_H,
  DOOR_X,
  DOOR_Y,
  DOOR_CX,
  DOOR_CY
} from './dungeonConstants.ts';
export * from './dungeonConstants.ts';
import { ARENA_PREFABS, getRandomArenaPrefab, type ArenaPrefab, type TacticalCoverPoint } from './arenaPrefabs.ts';

export type RoomShape = 
  | 'quadrant_sanctuary' 
  | 'twin_crypts' 
  | 'winding_catacombs' 
  | 'pillared_halls' 
  | 'rotunda_colonnade' 
  | 'split_courtyard'
  | 'grand_bridge_chasm'
  | 'elevated_sanctuary'
  | 'catacomb_labyrinth'
  | 'dragon_colosseum';

export interface DungeonRoom {
  x: number;
  y: number;
  type: RoomType;
  shape?: RoomShape;
  doors: Partial<Record<'n' | 's' | 'e' | 'w', DungeonRoom>>;
  cleared: boolean;
  spawned: boolean;
  visited: boolean;
  seen: boolean;
  tiles: number[][]; // 0: floor, 1: wall, 2: obstacle/pillar, 3: door
  props: (DestructibleProp & { mesh?: THREE.Group })[];
  enemiesSpawned: boolean;
  bars: THREE.Group[];
  torches: THREE.Mesh[];
  waypointName?: string;
  waypointUnlocked?: boolean;
  arenaPrefab?: ArenaPrefab;
  coverPoints?: TacticalCoverPoint[];
}

export class DungeonGenerator {
  private floorTextureCache = new Map<string, THREE.CanvasTexture>();

  public generateFloor(_zone: ZoneConfig, roomTarget = 7): DungeonRoom[] {
    const map = new Map<string, DungeonRoom>();
    const key = (x: number, y: number) => `${x},${y}`;

    const start: DungeonRoom = {
      x: 4,
      y: 4,
      type: 'start',
      doors: {},
      cleared: true,
      spawned: true,
      visited: false,
      seen: false,
      tiles: [],
      props: [],
      enemiesSpawned: true,
      bars: [],
      torches: [],
      waypointName: 'Portale Iniziale',
      waypointUnlocked: true
    };

    const rooms: DungeonRoom[] = [start];
    map.set(key(4, 4), start);

    let guard = 0;
    while (rooms.length < roomTarget && guard++ < 1200) {
      const parent = rooms[Math.floor(Math.random() * rooms.length)];
      const dirs: [number, number, 'n' | 's' | 'e' | 'w', 'n' | 's' | 'e' | 'w'][] = [
        [0, -1, 'n', 's'],
        [1, 0, 'e', 'w'],
        [0, 1, 's', 'n'],
        [-1, 0, 'w', 'e']
      ].sort(() => Math.random() - 0.5) as [number, number, 'n' | 's' | 'e' | 'w', 'n' | 's' | 'e' | 'w'][];

      for (const [dx, dy, fromDir, toDir] of dirs) {
        const nx = parent.x + dx;
        const ny = parent.y + dy;
        if (nx < 0 || ny < 0 || nx >= 9 || ny >= 9 || map.has(key(nx, ny))) continue;

        let neighborCount = 0;
        for (const [cx, cy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
          if (map.has(key(nx + cx, ny + cy))) neighborCount++;
        }
        if (neighborCount > 1 && Math.random() < 0.65) continue;

        const newR: DungeonRoom = {
          x: nx,
          y: ny,
          type: 'normal',
          doors: {},
          cleared: false,
          spawned: false,
          visited: false,
          seen: false,
          tiles: [],
          props: [],
          enemiesSpawned: false,
          bars: [],
          torches: []
        };

        parent.doors[fromDir] = newR;
        newR.doors[toDir] = parent;
        rooms.push(newR);
        map.set(key(nx, ny), newR);
        break;
      }
    }

    // Determine special rooms (Boss, Treasure, Shrine)
    const deadEnds = rooms.filter(r => r !== start && Object.keys(r.doors).length === 1);
    const available = deadEnds.length > 0 ? deadEnds : rooms.filter(r => r !== start);
    // 1. Place boss at furthest room from start
    let bossRoom: DungeonRoom = rooms[rooms.length - 1];
    if (available.length > 0) {
      bossRoom = available.shift() || rooms[rooms.length - 1];
      bossRoom.type = 'boss';
    }

    // 2. Pre-Boss Checkpoint / Teleport Room:
    // Always the room directly connected before the boss room (so at least 2 checkpoints: start + pre-boss)
    const preBossNeighbor = Object.values(bossRoom.doors)[0];
    if (preBossNeighbor && preBossNeighbor !== start) {
      preBossNeighbor.type = 'checkpoint';
      preBossNeighbor.cleared = true;
      preBossNeighbor.waypointName = 'Santuario dei Sussurri Celesti';
    } else if (available.length > 0) {
      const cp = available.shift()!;
      cp.type = 'checkpoint';
      cp.cleared = true;
      cp.waypointName = 'Santuario dei Sussurri Celesti';
    }

    // 3. Shop room (has teleport pad & equipment merchant)
    if (available.length > 0) {
      const shopRoom = available.shift()!;
      shopRoom.type = 'shop';
      shopRoom.cleared = true;
      shopRoom.waypointName = 'Emporio del Mercante';
    }

    // 4. Treasure room (Skill Augments Crucible)
    if (available.length > 0) {
      const treasureRoom = available.shift()!;
      treasureRoom.type = 'treasure';
      treasureRoom.cleared = true;
    }

    // 5. Shrine room
    if (available.length > 0) {
      const shrineRoom = available.shift()!;
      shrineRoom.type = 'shrine';
      shrineRoom.cleared = true;
    }

    // 6. Dark Pact room (Altare dei Dannati)
    if (available.length > 0) {
      const pactRoom = available.shift()!;
      pactRoom.type = 'pact';
      pactRoom.cleared = true;
    }

    // Build tile layouts and props with complex shapes for every room
    let cagePlaced = false;
    for (const r of rooms) {
      this.buildComplexRoomTiles(r);
      this.populateProps(r, !cagePlaced && r.type === 'normal');
      if (r.type === 'normal' && !cagePlaced) cagePlaced = true;
    }

    return rooms;
  }

  // Generate complex, organic mini-dungeon room geometries with corridors and sub-rooms
  private buildComplexRoomTiles(r: DungeonRoom): void {
    let tiles: number[][] = [];

    if (r.type === 'normal') {
      const prefab = getRandomArenaPrefab();
      r.arenaPrefab = prefab;
      r.shape = prefab.shape as RoomShape;
      r.coverPoints = prefab.coverPoints;
      tiles = prefab.tiles.map(row => [...row]);
    } else if (r.type === 'boss') {
      const prefab = ARENA_PREFABS[0];
      r.arenaPrefab = prefab;
      r.shape = 'dragon_colosseum';
      r.coverPoints = prefab.coverPoints;
      tiles = prefab.tiles.map(row => [...row]);
    } else {
      tiles = [];
      for (let y = 0; y < ROOM_HEIGHT; y++) {
        const row: number[] = [];
        for (let x = 0; x < ROOM_WIDTH; x++) {
          row.push(x === 0 || y === 0 || x === ROOM_WIDTH - 1 || y === ROOM_HEIGHT - 1 ? 1 : 0);
        }
        tiles.push(row);
      }
      tiles[3][4] = 2; tiles[3][14] = 2;
      tiles[9][4] = 2; tiles[9][14] = 2;
    }

    // GUARANTEED SAFE PATHWAYS FOR DOORS & CENTER:
    // Always clear center area (width 5x5)
    for (let y = DOOR_Y - 2; y <= DOOR_Y + 2; y++) {
      for (let x = DOOR_X - 2; x <= DOOR_X + 2; x++) {
        tiles[y][x] = 0;
      }
    }

    // Always clear 2-tile wide corridors connecting doors to room center
    if (r.doors.n) {
      tiles[0][DOOR_X] = 3;
      for (let y = 1; y <= DOOR_Y; y++) {
        tiles[y][DOOR_X] = 0;
        tiles[y][DOOR_X - 1] = 0;
      }
    }
    if (r.doors.s) {
      tiles[ROOM_HEIGHT - 1][DOOR_X] = 3;
      for (let y = DOOR_Y; y <= ROOM_HEIGHT - 2; y++) {
        tiles[y][DOOR_X] = 0;
        tiles[y][DOOR_X - 1] = 0;
      }
    }
    if (r.doors.w) {
      tiles[DOOR_Y][0] = 3;
      for (let x = 1; x <= DOOR_X; x++) {
        tiles[DOOR_Y][x] = 0;
        tiles[DOOR_Y - 1][x] = 0;
      }
    }
    if (r.doors.e) {
      tiles[DOOR_Y][ROOM_WIDTH - 1] = 3;
      for (let x = DOOR_X; x <= ROOM_WIDTH - 2; x++) {
        tiles[DOOR_Y][x] = 0;
        tiles[DOOR_Y - 1][x] = 0;
      }
    }

    r.tiles = tiles;
  }

  /**
   * Guarantees a completely free, unblocked spawn coordinate for an entity of given radius.
   * If a preferred (x, y) is provided, it tests it first. If valid, uses it.
   * Otherwise, finds the closest valid floor tile that is fully clear of walls, pillars, chasms, props, and doors.
   */
  public findValidSpawnSpot(
    r: DungeonRoom,
    preferredX?: number,
    preferredY?: number,
    radius = 0.75,
    minFromPlayerX = 0,
    minFromPlayerY = 0,
    minDistFromPlayer = 0
  ): { x: number; y: number } {
    const safetyBuffer = radius + 0.35; // Generous safety margin to guarantee no wall clipping

    // 1. If preferred coordinates given, check if they are completely safe
    if (preferredX !== undefined && preferredY !== undefined) {
      const withinRoom =
        preferredX >= safetyBuffer + 1.2 &&
        preferredX <= WORLD_W - safetyBuffer - 1.2 &&
        preferredY >= safetyBuffer + 1.2 &&
        preferredY <= WORLD_H - safetyBuffer - 1.2;

      if (withinRoom && !this.isBlocked(r, preferredX, preferredY, safetyBuffer)) {
        if (minDistFromPlayer <= 0 || Math.hypot(preferredX - minFromPlayerX, preferredY - minFromPlayerY) >= minDistFromPlayer) {
          return { x: preferredX, y: preferredY };
        }
      }
    }

    // 2. Search all room tiles for valid positions
    const doorPositions = [
      { x: DOOR_CX, y: TILE_SIZE * 0.5 },
      { x: DOOR_CX, y: (ROOM_HEIGHT - 0.5) * TILE_SIZE },
      { x: TILE_SIZE * 0.5, y: DOOR_CY },
      { x: (ROOM_WIDTH - 0.5) * TILE_SIZE, y: DOOR_CY }
    ];

    const candidates: { x: number; y: number; score: number }[] = [];
    const targetX = preferredX ?? (WORLD_W / 2);
    const targetY = preferredY ?? (WORLD_H / 2);

    for (let ty = 1; ty < ROOM_HEIGHT - 1; ty++) {
      for (let tx = 1; tx < ROOM_WIDTH - 1; tx++) {
        if (r.tiles && r.tiles[ty] && r.tiles[ty][tx] === 0) {
          const wx = tx * TILE_SIZE + TILE_SIZE / 2;
          const wy = ty * TILE_SIZE + TILE_SIZE / 2;

          // Check against walls, pillars, chasms, and props with full safety buffer
          if (this.isBlocked(r, wx, wy, safetyBuffer)) continue;

          // Do not spawn right in front of any doorway
          if (doorPositions.some(d => Math.hypot(wx - d.x, wy - d.y) < 2.5)) continue;

          // Check player distance if required
          if (minDistFromPlayer > 0 && Math.hypot(wx - minFromPlayerX, wy - minFromPlayerY) < minDistFromPlayer) {
            continue;
          }

          // Score by proximity to preferred position
          const distToPreferred = Math.hypot(wx - targetX, wy - targetY);
          candidates.push({ x: wx, y: wy, score: distToPreferred });
        }
      }
    }

    if (candidates.length > 0) {
      candidates.sort((a, b) => a.score - b.score);
      const topPool = candidates.slice(0, Math.min(3, candidates.length));
      const pick = topPool[Math.floor(Math.random() * topPool.length)];
      return { x: pick.x, y: pick.y };
    }

    // 3. Fallback: Guaranteed safe center of room
    return { x: DOOR_CX, y: DOOR_CY };
  }

  // Find a guaranteed valid, non-blocked floor tile inside the room, avoiding overlapping props and door areas
  public findFreeSpot(r: DungeonRoom, minFromPlayerX = 0, minFromPlayerY = 0, minDist = 0): { x: number; y: number } {
    return this.findValidSpawnSpot(r, undefined, undefined, 0.65, minFromPlayerX, minFromPlayerY, minDist);
  }

  public findFreeSpotLegacy(r: DungeonRoom, minFromPlayerX = 0, minFromPlayerY = 0, minDist = 0): { x: number; y: number } {
    const candidates: { x: number; y: number }[] = [];
    const relaxedCandidates: { x: number; y: number }[] = [];

    const doorPositions = [
      { x: DOOR_CX, y: TILE_SIZE * 0.5 },
      { x: DOOR_CX, y: (ROOM_HEIGHT - 0.5) * TILE_SIZE },
      { x: TILE_SIZE * 0.5, y: DOOR_CY },
      { x: (ROOM_WIDTH - 0.5) * TILE_SIZE, y: DOOR_CY }
    ];

    for (let ty = 1; ty < ROOM_HEIGHT - 1; ty++) {
      for (let tx = 1; tx < ROOM_WIDTH - 1; tx++) {
        if (r.tiles[ty][tx] === 0) {
          const worldX = tx * TILE_SIZE + TILE_SIZE / 2;
          const worldY = ty * TILE_SIZE + TILE_SIZE / 2;
          const dist = Math.hypot(worldX - minFromPlayerX, worldY - minFromPlayerY);
          if (dist >= minDist) {
            relaxedCandidates.push({ x: worldX, y: worldY });

            // Do not spawn right in front of any doorway
            const nearDoor = doorPositions.some(d => Math.hypot(worldX - d.x, worldY - d.y) < 2.2);
            if (nearDoor) continue;

            // Do not spawn on top of or too close to an existing prop
            const nearProp = r.props.some(p => Math.hypot(p.x - worldX, p.y - worldY) < 1.7);
            if (nearProp) continue;

            candidates.push({ x: worldX, y: worldY });
          }
        }
      }
    }

    if (candidates.length > 0) {
      return candidates[Math.floor(Math.random() * candidates.length)];
    }
    if (relaxedCandidates.length > 0) {
      // Pick relaxed candidate with max distance from existing props
      relaxedCandidates.sort((a, b) => {
        const minA = r.props.reduce((acc, p) => Math.min(acc, Math.hypot(p.x - a.x, p.y - a.y)), 999);
        const minB = r.props.reduce((acc, p) => Math.min(acc, Math.hypot(p.x - b.x, p.y - b.y)), 999);
        return minB - minA;
      });
      return relaxedCandidates[0];
    }
    return { x: WORLD_W / 2, y: WORLD_H / 2 };
  }

  private populateProps(r: DungeonRoom, withCage = false): void {
    let propSeq = 0;

    if (r.type === 'start') {
      // Starting room teleport pad
      r.props.push({
        id: ++propSeq,
        x: WORLD_W / 2,
        y: WORLD_H / 2,
        type: 'teleport_pad',
        hp: 9999
      });
    } else if (r.type === 'checkpoint') {
      // Santuario dei Sussurri Celesti: Fonte della Rinascita + Forgia Runica + Portale Rapido
      r.props.push({
        id: ++propSeq,
        x: WORLD_W / 2,
        y: WORLD_H / 2,
        type: 'teleport_pad',
        hp: 9999
      });
      // Fonte della Rinascita Celestiale (curazione completa, pozioni riempite e scudo celestiale)
      r.props.push({
        id: ++propSeq,
        x: WORLD_W / 2 - 3.4,
        y: WORLD_H / 2,
        type: 'celestial_fountain',
        hp: 9999
      });
      // Forgia Runica di Raffinamento (affilatura armi e forgiatura armature per oro)
      r.props.push({
        id: ++propSeq,
        x: WORLD_W / 2 + 3.4,
        y: WORLD_H / 2,
        type: 'celestial_forge',
        hp: 9999
      });
      for (let i = 0; i < 2; i++) {
        const s = this.findFreeSpot(r, WORLD_W / 2, WORLD_H / 2, 3.8);
        r.props.push({ id: ++propSeq, x: s.x, y: s.y, type: 'pot', hp: 10 });
      }
    } else if (r.type === 'shop') {
      // Merchant Shop room: Teleport Pad + Merchant Counter
      r.props.push({
        id: ++propSeq,
        x: WORLD_W / 2 - 2.8,
        y: WORLD_H / 2,
        type: 'teleport_pad',
        hp: 9999
      });
      r.props.push({
        id: ++propSeq,
        x: WORLD_W / 2 + 1.8,
        y: WORLD_H / 2,
        type: 'shop_counter',
        hp: 9999
      });
      const clutter = ['crate', 'barrel', 'pot'] as const;
      for (let i = 0; i < 3; i++) {
        const s = this.findFreeSpot(r, WORLD_W / 2, WORLD_H / 2, 2.2);
        r.props.push({ id: ++propSeq, x: s.x, y: s.y, type: clutter[i % clutter.length], hp: 10 });
      }
    } else if (r.type === 'treasure') {
      // Altare della Maestria delle Abilità (Skill Augments Crucible)
      r.props.push({
        id: ++propSeq,
        x: WORLD_W / 2,
        y: WORLD_H / 2,
        type: 'skill_crucible',
        hp: 9999,
        opened: false
      });
      const clutter = ['crate', 'pot', 'barrel', 'pot'] as const;
      for (let i = 0; i < 4; i++) {
        const s = this.findFreeSpot(r, WORLD_W / 2, WORLD_H / 2, 2.2);
        r.props.push({
          id: ++propSeq,
          x: s.x,
          y: s.y,
          type: clutter[i % clutter.length],
          hp: 10
        });
      }
    } else if (r.type === 'pact') {
      // Altare dei Dannati (Dark Pact Altar)
      const spot = this.findFreeSpot(r, 0, 0, 0);
      r.props.push({
        id: ++propSeq,
        x: spot.x,
        y: spot.y,
        type: 'pact_altar',
        hp: 9999,
        opened: false
      });
      for (let i = 0; i < 3; i++) {
        const s = this.findFreeSpot(r, spot.x, spot.y, 2.0);
        r.props.push({ id: ++propSeq, x: s.x, y: s.y, type: 'pot', hp: 10 });
      }
    } else if (r.type === 'shrine') {
      const spot = this.findFreeSpot(r, 0, 0, 0);
      r.props.push({
        id: ++propSeq,
        x: spot.x,
        y: spot.y,
        type: 'shrine',
        hp: 999,
        shrineUsed: false,
        shrineType: 'radiance'
      });
      const s1 = this.findFreeSpot(r, spot.x, spot.y, 2.0);
      r.props.push({
        id: ++propSeq,
        x: s1.x,
        y: s1.y,
        type: 'table',
        hp: 14
      });
      for (let i = 0; i < 3; i++) {
        const s = this.findFreeSpot(r, spot.x, spot.y, 1.5);
        r.props.push({
          id: ++propSeq,
          x: s.x,
          y: s.y,
          type: 'pot',
          hp: 10
        });
      }
    } else if (r.type === 'normal') {
      // Load preset props if arena prefab defined them
      if (r.arenaPrefab && r.arenaPrefab.presetProps.length > 0) {
        for (const p of r.arenaPrefab.presetProps) {
          r.props.push({ ...p, id: ++propSeq });
        }
      }

      // 1. Dining set (table + 2 chairs)
      const tSpot = this.findFreeSpot(r, 0, 0, 0);
      r.props.push({
        id: ++propSeq,
        x: tSpot.x,
        y: tSpot.y,
        type: 'table',
        hp: 12
      });
      r.props.push({
        id: ++propSeq,
        x: tSpot.x + 0.85,
        y: tSpot.y,
        type: 'chair',
        hp: 8
      });
      r.props.push({
        id: ++propSeq,
        x: tSpot.x - 0.85,
        y: tSpot.y,
        type: 'chair',
        hp: 8
      });

      // 2. Traps and Hazards: Explosive barrel, Toxic barrel, Spike trap
      const expSpot = this.findFreeSpot(r, tSpot.x, tSpot.y, 3.0);
      r.props.push({
        id: ++propSeq,
        x: expSpot.x,
        y: expSpot.y,
        type: 'explosive_barrel',
        hp: 1
      });

      if (Math.random() < 0.65) {
        const toxSpot = this.findFreeSpot(r, expSpot.x, expSpot.y, 3.0);
        r.props.push({
          id: ++propSeq,
          x: toxSpot.x,
          y: toxSpot.y,
          type: 'toxic_barrel',
          hp: 1
        });
      }

      const spikeSpot = this.findFreeSpot(r, tSpot.x, tSpot.y, 2.5);
      r.props.push({
        id: ++propSeq,
        x: spikeSpot.x,
        y: spikeSpot.y,
        type: 'spike_trap',
        hp: 9999,
        trapTimer: Math.random() * 2.5,
        trapActive: false
      });

      // Fire Jet Trap Hazard (50% chance, or higher in fiery/dangerous rooms)
      if (Math.random() < 0.55) {
        const fireSpot = this.findFreeSpot(r, tSpot.x, tSpot.y, 2.8);
        r.props.push({
          id: ++propSeq,
          x: fireSpot.x,
          y: fireSpot.y,
          type: 'fire_jet',
          hp: 9999,
          trapTimer: Math.random() * 3.2,
          trapActive: false
        });
      }

      // Sarcophagus (Crypts, catacombs, or 40% chance in any room)
      if (r.shape === 'twin_crypts' || r.shape === 'winding_catacombs' || Math.random() < 0.4) {
        const sarcSpot = this.findFreeSpot(r, tSpot.x, tSpot.y, 3.2);
        r.props.push({
          id: ++propSeq,
          x: sarcSpot.x,
          y: sarcSpot.y,
          type: 'sarcophagus',
          hp: 35
        });
      }

      // Weapon Rack (Pillared halls, courtyards, or 45% chance in any room)
      if (r.shape === 'pillared_halls' || r.shape === 'split_courtyard' || Math.random() < 0.45) {
        const rackSpot = this.findFreeSpot(r, tSpot.x, tSpot.y, 3.0);
        r.props.push({
          id: ++propSeq,
          x: rackSpot.x,
          y: rackSpot.y,
          type: 'weapon_rack',
          hp: 25
        });
      }

      // Cozy Campfire (occasional adventurer campsite in courtyards or sanctuaries)
      if ((r.shape === 'split_courtyard' || r.shape === 'quadrant_sanctuary') && Math.random() < 0.3) {
        const campSpot = this.findFreeSpot(r, tSpot.x, tSpot.y, 3.5);
        r.props.push({
          id: ++propSeq,
          x: campSpot.x,
          y: campSpot.y,
          type: 'campfire',
          hp: 30
        });
      }

      // 3. Interactive Elemental Rune Puzzle & Sealed Chest (40% chance in normal rooms or elevated sanctuary)
      if (r.shape === 'elevated_sanctuary' || Math.random() < 0.4) {
        const runeTypes: ('fire' | 'frost' | 'arcane')[] = ['fire', 'frost', 'arcane'];
        const numRunes = r.shape === 'elevated_sanctuary' ? 3 : 2;
        for (let i = 0; i < numRunes; i++) {
          const rSpot = this.findFreeSpot(r, tSpot.x, tSpot.y, 2.5);
          r.props.push({
            id: ++propSeq,
            x: rSpot.x,
            y: rSpot.y,
            type: 'rune_puzzle',
            hp: 9999,
            runeType: runeTypes[i],
            runeActive: false
          });
        }
        // Associated Sealed Chest
        const cSpot = this.findFreeSpot(r, tSpot.x, tSpot.y, 2.5);
        r.props.push({
          id: ++propSeq,
          x: cSpot.x,
          y: cSpot.y,
          type: 'sealed_chest',
          hp: 9999,
          sealedChestLocked: true,
          opened: false
        });
      }

      // 4. Secret Wall Alcove (45% chance or guaranteed in catacomb labyrinth)
      if (r.shape === 'catacomb_labyrinth' || Math.random() < 0.45) {
        // Find an internal wall candidate with adjacent floor
        let foundWall = false;
        for (let wy = 2; wy < ROOM_HEIGHT - 2 && !foundWall; wy++) {
          for (let wx = 2; wx < ROOM_WIDTH - 2 && !foundWall; wx++) {
            if (r.tiles[wy][wx] === 1) {
              // Check if it has a floor neighbor
              const hasFloor = (
                r.tiles[wy - 1][wx] === 0 ||
                r.tiles[wy + 1][wx] === 0 ||
                r.tiles[wy][wx - 1] === 0 ||
                r.tiles[wy][wx + 1] === 0
              );
              if (hasFloor) {
                r.props.push({
                  id: ++propSeq,
                  x: wx * TILE_SIZE + TILE_SIZE / 2,
                  y: wy * TILE_SIZE + TILE_SIZE / 2,
                  type: 'secret_wall',
                  hp: 30,
                  tileX: wx,
                  tileY: wy,
                  secretRevealed: false
                });
                foundWall = true;
              }
            }
          }
        }
      }

      // 5. Captive Ally Cage (guaranteed once per floor)
      if (withCage) {
        const cageSpot = this.findFreeSpot(r, tSpot.x, tSpot.y, 3.5);
        r.props.push({
          id: ++propSeq,
          x: cageSpot.x,
          y: cageSpot.y,
          type: 'cage',
          hp: 20,
          cageFreed: false
        });
      }

      // 6. Clutter in other sub-rooms: crates, barrels, pots
      const clutterTypes: ('barrel' | 'pot' | 'crate')[] = ['barrel', 'pot', 'crate'];
      const extraProps = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < extraProps; i++) {
        const spot = this.findFreeSpot(r, tSpot.x, tSpot.y, 2.0);
        r.props.push({
          id: ++propSeq,
          x: spot.x,
          y: spot.y,
          type: clutterTypes[Math.floor(Math.random() * clutterTypes.length)],
          hp: 10
        });
      }
    }
  }

  public getFloorTexture(zone: ZoneConfig): THREE.CanvasTexture {
    if (this.floorTextureCache.has(zone.id)) {
      return this.floorTextureCache.get(zone.id)!;
    }

    const TILE_PX = 64;
    const canvas = document.createElement('canvas');
    canvas.width = ROOM_WIDTH * TILE_PX;
    canvas.height = ROOM_HEIGHT * TILE_PX;
    const ctx = canvas.getContext('2d')!;

    for (let y = 0; y < ROOM_HEIGHT; y++) {
      for (let x = 0; x < ROOM_WIDTH; x++) {
        const ox = x * TILE_PX;
        const oy = y * TILE_PX;

        // Base flagstone color with checker nuance
        const baseColor = (x + y) % 2 === 0 ? zone.floorColorA : zone.floorColorB;
        ctx.fillStyle = baseColor;
        ctx.fillRect(ox, oy, TILE_PX, TILE_PX);

        // 4 sub-slabs per tile with interlocking offset
        const subW = TILE_PX / 2;
        const subH = TILE_PX / 2;
        for (let sy = 0; sy < 2; sy++) {
          for (let sx = 0; sx < 2; sx++) {
            const bx = ox + sx * subW;
            const by = oy + sy * subH;

            // Flagstone slab surface nuance
            const noise = (Math.sin(x * 12.5 + sx * 7 + y * 9.2 + sy * 3) + 1) * 0.5;
            ctx.fillStyle = noise > 0.6 ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)';
            ctx.fillRect(bx + 1, by + 1, subW - 2, subH - 2);

            // Bevel highlights & shadow edges
            ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.fillRect(bx + 1, by + 1, subW - 2, 1);
            ctx.fillRect(bx + 1, by + 1, 1, subH - 2);

            ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
            ctx.fillRect(bx + 1, by + subH - 2, subW - 2, 1);
            ctx.fillRect(bx + subW - 2, by + 1, 1, subH - 2);

            // Deep mortar groove
            ctx.strokeStyle = 'rgba(6, 4, 10, 0.65)';
            ctx.lineWidth = 1;
            ctx.strokeRect(bx + 0.5, by + 0.5, subW - 1, subH - 1);
          }
        }

        // Ancient weathering stone crack / lichen on rare slabs
        const slabSeed = (x * 37 + y * 19) % 11;
        if (slabSeed === 0) {
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(ox + 12, oy + 8);
          ctx.lineTo(ox + 22, oy + 26);
          ctx.lineTo(ox + 35, oy + 32);
          ctx.stroke();
        } else if (slabSeed === 3 && zone.id === 'morgen') {
          // Moss spot
          ctx.fillStyle = 'rgba(34, 120, 60, 0.22)';
          ctx.beginPath();
          ctx.arc(ox + 32, oy + 32, 10, 0, Math.PI * 2);
          ctx.fill();
        } else if (slabSeed === 5 && zone.id === 'elshiff') {
          // Faint glowing arcane rune mark
          ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
          ctx.beginPath();
          ctx.arc(ox + 32, oy + 32, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 4;
    this.floorTextureCache.set(zone.id, tex);
    return tex;
  }

  public buildRoomScene(r: DungeonRoom, zone: ZoneConfig, roomGroup: THREE.Group): void {
    for (let i = roomGroup.children.length - 1; i >= 0; i--) {
      roomGroup.remove(roomGroup.children[i]);
    }
    r.bars = [];
    r.torches = [];

    // Floor Mesh with Physically-Based Rendering & Shadows
    const floorMat = new THREE.MeshStandardMaterial({
      map: this.getFloorTexture(zone),
      roughness: 0.85,
      metalness: 0.12
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(WORLD_W, WORLD_H), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(WORLD_W / 2, 0, WORLD_H / 2);
    floor.receiveShadow = true;
    roomGroup.add(floor);

    // Architectural Enhancements per Room Shape
    if (r.shape === 'elevated_sanctuary') {
      const daisMat = getLambert(zone.wallColor + 0x080808);
      // Dual-tier stepped sanctuary plinth
      const baseDais = new THREE.Mesh(GEO.box, getLambert(zone.wallColor + 0x040404));
      baseDais.scale.set(7.4 * TILE_SIZE, 0.10, 5.4 * TILE_SIZE);
      baseDais.position.set(DOOR_CX, 0.05, DOOR_CY);
      baseDais.receiveShadow = true;

      const upperDais = new THREE.Mesh(GEO.box, daisMat);
      upperDais.scale.set(7 * TILE_SIZE, 0.12, 5 * TILE_SIZE);
      upperDais.position.set(DOOR_CX, 0.15, DOOR_CY);
      upperDais.receiveShadow = true;

      const trimMat = getLambert(0xd4af37, 0x4a3c10);
      const daisTrim = new THREE.Mesh(GEO.box, trimMat);
      daisTrim.scale.set(7.06 * TILE_SIZE, 0.02, 5.06 * TILE_SIZE);
      daisTrim.position.set(DOOR_CX, 0.21, DOOR_CY);

      roomGroup.add(baseDais, upperDais, daisTrim);
    } else if (r.shape === 'dragon_colosseum') {
      const arenaRing = new THREE.Mesh(GEO.torus, getBasic(0xffd700, 0.8, true));
      arenaRing.scale.set(7.2, 7.2, 0.08);
      arenaRing.rotation.x = Math.PI / 2;
      arenaRing.position.set(DOOR_CX, 0.04, DOOR_CY);
      roomGroup.add(arenaRing);
    }

    const wallMat = getLambert(zone.wallColor);
    const topMat = getLambert(zone.wallColor + 0x111111);
    const plinthMat = getLambert(zone.wallColor - 0x080808, 0x08080c);
    const corbelMat = getLambert(zone.wallColor + 0x0a0a0a);

    // Biome-specific wall accent materials
    let biomeAccentMat: THREE.Material | null = null;
    if (zone.id === 'vazark') {
      biomeAccentMat = getBasic(0xff4400, 0.85, true);
    } else if (zone.id === 'elshiff') {
      biomeAccentMat = getBasic(0x38bdf8, 0.8, true);
    } else if (zone.id === 'azren') {
      biomeAccentMat = getLambert(0xd4af37, 0x4a3c10);
    }

    // Wall & Obstacle blocks with multi-layered architectural stonework
    for (let y = 0; y < ROOM_HEIGHT; y++) {
      for (let x = 0; x < ROOM_WIDTH; x++) {
        const tileVal = r.tiles[y][x];
        const cx = x * TILE_SIZE + TILE_SIZE / 2;
        const cz = y * TILE_SIZE + TILE_SIZE / 2;

        if (tileVal === 1) {
          const isSecret = r.props.some(p => p.type === 'secret_wall' && p.tileX === x && p.tileY === y);
          if (isSecret) {
            // Prop model handles rendering the cracked breakable secret wall
            continue;
          }
          const isOuterWall = x === 0 || x === ROOM_WIDTH - 1 || y === 0;
          const isFrontWall = y === ROOM_HEIGHT - 1;
          const wallHeight = isFrontWall ? 1.0 : (isOuterWall ? 3.8 : (y >= ROOM_HEIGHT - 3 ? 1.4 : 2.4));

          // 1. Stepped Heavy Base Plinth (grounds the wall with weight)
          const plinth = new THREE.Mesh(GEO.box, plinthMat);
          plinth.position.set(cx, 0.14, cz);
          plinth.scale.set(TILE_SIZE * 1.04, 0.28, TILE_SIZE * 1.04);
          plinth.castShadow = true;
          plinth.receiveShadow = true;
          roomGroup.add(plinth);

          // 2. Main Wall Column / Body
          const wall = new THREE.Mesh(GEO.box, wallMat);
          wall.position.set(cx, wallHeight / 2, cz);
          wall.scale.set(TILE_SIZE, wallHeight, TILE_SIZE);
          wall.castShadow = true;
          wall.receiveShadow = true;
          roomGroup.add(wall);

          // 3. Overhanging Cornice / Corbel Trim just below the cap
          const cornice = new THREE.Mesh(GEO.box, corbelMat);
          cornice.position.set(cx, wallHeight - 0.08, cz);
          cornice.scale.set(TILE_SIZE * 1.05, 0.16, TILE_SIZE * 1.05);
          cornice.castShadow = true;
          cornice.receiveShadow = true;
          roomGroup.add(cornice);

          // 4. Heavy Top Stone Cap
          const topCap = new THREE.Mesh(GEO.box, topMat);
          topCap.position.set(cx, wallHeight + 0.06, cz);
          topCap.scale.set(TILE_SIZE * 1.08, 0.12, TILE_SIZE * 1.08);
          topCap.castShadow = true;
          topCap.receiveShadow = true;
          roomGroup.add(topCap);

          // 5. Outer Wall Battlements (Crenellations / Merlons)
          if (isOuterWall && wallHeight > 2.0) {
            const merlonA = new THREE.Mesh(GEO.box, topMat);
            merlonA.scale.set(TILE_SIZE * 0.42, 0.36, TILE_SIZE * 0.42);
            merlonA.position.set(cx - TILE_SIZE * 0.26, wallHeight + 0.24, cz);
            merlonA.castShadow = true;

            const merlonB = new THREE.Mesh(GEO.box, topMat);
            merlonB.scale.set(TILE_SIZE * 0.42, 0.36, TILE_SIZE * 0.42);
            merlonB.position.set(cx + TILE_SIZE * 0.26, wallHeight + 0.24, cz);
            merlonB.castShadow = true;

            roomGroup.add(merlonA, merlonB);
          }

          // 6. Biome Decorative Accent Seam
          if (biomeAccentMat && (isOuterWall || (x + y) % 3 === 0)) {
            const accent = new THREE.Mesh(GEO.box, biomeAccentMat);
            accent.scale.set(TILE_SIZE * 0.92, 0.08, TILE_SIZE * 0.06);
            accent.position.set(cx, 0.95, cz + (y === 0 ? TILE_SIZE * 0.48 : -TILE_SIZE * 0.48));
            roomGroup.add(accent);
          }
        } else if (tileVal === 2) {
          // Ancient sculpted architectural column with fluted base, ring band, and sculpted capital
          const pillarBase = new THREE.Mesh(GEO.box, plinthMat);
          pillarBase.position.set(cx, 0.15, cz);
          pillarBase.scale.set(1.25, 0.3, 1.25);
          pillarBase.castShadow = true;
          pillarBase.receiveShadow = true;

          const pillar = new THREE.Mesh(GEO.cyl, wallMat);
          pillar.position.set(cx, 1.15, cz);
          pillar.scale.set(0.82, 2.1, 0.82);
          pillar.castShadow = true;
          pillar.receiveShadow = true;

          const ringBand = new THREE.Mesh(GEO.torus, corbelMat);
          ringBand.scale.set(0.86, 0.86, 0.08);
          ringBand.rotation.x = Math.PI / 2;
          ringBand.position.set(cx, 1.2, cz);

          const cap = new THREE.Mesh(GEO.box, topMat);
          cap.scale.set(1.22, 0.24, 1.22);
          cap.position.set(cx, 2.28, cz);
          cap.castShadow = true;
          cap.receiveShadow = true;

          roomGroup.add(pillarBase, pillar, ringBand, cap);
        } else if (tileVal === 4) {
          // Deep abyss chasm / magma trench below floor level
          const abyssColor = zone.id === 'vazark' ? 0xff4400 : (zone.id === 'morgen' ? 0x1f3d1f : 0x140a24);
          const chasmPit = new THREE.Mesh(GEO.box, getBasic(abyssColor, 0.9, true));
          chasmPit.scale.set(TILE_SIZE, 0.2, TILE_SIZE);
          chasmPit.position.set(cx, -1.3, cz);
          roomGroup.add(chasmPit);

          // Railing along borders facing bridge / floor tiles
          for (const [dy, rz] of [[-1, -TILE_SIZE / 2 + 0.08], [1, TILE_SIZE / 2 - 0.08]]) {
            const ny = y + dy;
            if (ny >= 0 && ny < ROOM_HEIGHT && r.tiles[ny][x] === 0) {
              const rail = new THREE.Mesh(GEO.box, wallMat);
              rail.scale.set(TILE_SIZE, 0.45, 0.14);
              rail.position.set(cx, 0.22, cz + rz);
              rail.castShadow = true;
              roomGroup.add(rail);

              const railCap = new THREE.Mesh(GEO.box, topMat);
              railCap.scale.set(TILE_SIZE, 0.1, 0.18);
              railCap.position.set(cx, 0.48, cz + rz);
              roomGroup.add(railCap);
            }
          }
        }
      }
    }

    // Doors & Portals
    const doorDirs: ('n' | 's' | 'e' | 'w')[] = ['n', 's', 'e', 'w'];
    for (const d of doorDirs) {
      if (!r.doors[d]) continue;
      const targetRoom = r.doors[d]!;
      const px = d === 'n' || d === 's' ? DOOR_CX : (d === 'e' ? WORLD_W - TILE_SIZE / 2 : TILE_SIZE / 2);
      const pz = d === 'e' || d === 'w' ? DOOR_CY : (d === 'n' ? TILE_SIZE / 2 : WORLD_H - TILE_SIZE / 2);

      const doorGroup = new THREE.Group();
      doorGroup.position.set(px, 0, pz);
      if (d === 'e' || d === 'w') doorGroup.rotation.y = Math.PI / 2;

      // Portal frame arch
      const archL = new THREE.Mesh(GEO.box, wallMat);
      archL.scale.set(0.3, 3.2, 0.3);
      archL.position.set(-1.1, 1.6, 0);
      archL.castShadow = true;
      archL.receiveShadow = true;

      const archR = archL.clone();
      archR.position.x = 1.1;

      const archTop = new THREE.Mesh(GEO.box, topMat);
      archTop.scale.set(2.5, 0.4, 0.4);
      archTop.position.set(0, 3.2, 0);
      archTop.castShadow = true;
      archTop.receiveShadow = true;

      doorGroup.add(archL, archR, archTop);

      // Gate Bars that drop when room is not cleared
      const barsGroup = new THREE.Group();
      for (let i = 0; i < 5; i++) {
        const bar = new THREE.Mesh(GEO.cyl, getLambert(0x4a4456));
        bar.scale.set(0.08, 2.8, 0.08);
        bar.position.set(-0.8 + i * 0.4, 1.4, 0);
        bar.castShadow = true;
        barsGroup.add(bar);
      }
      barsGroup.visible = !r.cleared;
      doorGroup.add(barsGroup);
      r.bars.push(barsGroup);

      // Portal color indicator & ambient portal light
      let portalColor = 0xa899cc;
      if (targetRoom.type === 'boss') portalColor = 0xff3355;
      else if (targetRoom.type === 'treasure') portalColor = 0xffd700;
      else if (targetRoom.type === 'shrine') portalColor = 0x88ffcc;

      const portalLight = new THREE.Mesh(GEO.sph, getBasic(portalColor));
      portalLight.scale.set(0.25, 0.25, 0.25);
      portalLight.position.set(0, 3.5, 0);

      const pLight = new THREE.PointLight(portalColor, 0.7, 7, 1.6);
      pLight.position.set(0, 3.2, 0);

      doorGroup.add(portalLight, pLight);
      roomGroup.add(doorGroup);
    }

    // Wall Sconces & Flickering Torch Lights
    for (const tx of [4, 10, 20, 26]) {
      const sconce = new THREE.Mesh(GEO.box, getLambert(0x382c22));
      sconce.scale.set(0.14, 0.6, 0.14);
      sconce.position.set(tx, 2.2, TILE_SIZE + 0.1);
      sconce.castShadow = true;
      roomGroup.add(sconce);

      const flame = new THREE.Mesh(GEO.cone, getBasic(zone.torchColor));
      flame.scale.set(0.2, 0.45, 0.2);
      flame.position.set(tx, 2.65, TILE_SIZE + 0.1);
      roomGroup.add(flame);
      r.torches.push(flame);

      const torchLight = new THREE.PointLight(zone.torchColor, 0.85, 9, 1.8);
      torchLight.position.set(tx, 2.8, TILE_SIZE + 0.35);
      roomGroup.add(torchLight);
    }

    // Build 3D models for Props with proper elevation for dais and platforms
    const sanctuaryHalfW = (7 * TILE_SIZE) / 2;
    const sanctuaryHalfH = (5 * TILE_SIZE) / 2;

    for (const p of r.props) {
      const propVis = buildPropModel(p.type, p);
      let propY = 0;
      if (r.shape === 'elevated_sanctuary') {
        const onSanctuaryDais = Math.abs(p.x - DOOR_CX) <= sanctuaryHalfW && Math.abs(p.y - DOOR_CY) <= sanctuaryHalfH;
        if (onSanctuaryDais) {
          propY = 0.22; // Elevate prop so it sits cleanly on top of the dais without clipping!
        }
      }
      propVis.root.position.set(p.x, propY, p.y);
      roomGroup.add(propVis.root);
      p.mesh = propVis.root;
    }
  }

  // Smooth collision check with radius clamping
  public isBlocked(r: DungeonRoom, x: number, y: number, radius = 0.4, checkProps = true): boolean {
    const minTx = Math.floor((x - radius) / TILE_SIZE);
    const maxTx = Math.floor((x + radius) / TILE_SIZE);
    const minTy = Math.floor((y - radius) / TILE_SIZE);
    const maxTy = Math.floor((y + radius) / TILE_SIZE);

    for (let ty = minTy; ty <= maxTy; ty++) {
      for (let tx = minTx; tx <= maxTx; tx++) {
        if (tx < 0 || ty < 0 || tx >= ROOM_WIDTH || ty >= ROOM_HEIGHT) return true;
        if (!r.tiles || !r.tiles[ty]) return true;
        const val = r.tiles[ty][tx];
        if (val === 1 || val === 2 || val === 4 || (val === 3 && !r.cleared)) {
          return true;
        }
      }
    }

    if (checkProps && r.props) {
      for (const pr of r.props) {
        if (pr.hp <= 0 && (pr.type === 'explosive_barrel' || pr.type === 'toxic_barrel' || pr.type === 'barrel')) continue;
        const propRadius = pr.type === 'sarcophagus' ? 1.0 : (pr.type === 'table' || pr.type === 'weapon_rack' ? 0.85 : 0.65);
        if (Math.hypot(x - pr.x, y - pr.y) < radius + propRadius) {
          return true;
        }
      }
    }

    return false;
  }

  // Depenetrate / Unstuck entity if inside a wall, pillar, chasm or prop
  public resolveEntityStuck(r: DungeonRoom, ent: { x: number; y: number; radius: number }): boolean {
    if (!this.isBlocked(r, ent.x, ent.y, ent.radius)) {
      return false;
    }

    // 1. Try 8 radial directions in increasing steps
    const angles = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4, Math.PI, -(3 * Math.PI) / 4, -Math.PI / 2, -Math.PI / 4];
    const distances = [0.35, 0.7, 1.2, 1.8, 2.6];

    for (const dist of distances) {
      for (const ang of angles) {
        const testX = ent.x + Math.cos(ang) * dist;
        const testY = ent.y + Math.sin(ang) * dist;
        if (
          testX >= ent.radius + 1.2 &&
          testX <= WORLD_W - ent.radius - 1.2 &&
          testY >= ent.radius + 1.2 &&
          testY <= WORLD_H - ent.radius - 1.2 &&
          !this.isBlocked(r, testX, testY, ent.radius)
        ) {
          ent.x = testX;
          ent.y = testY;
          return true;
        }
      }
    }

    // 2. Direct line sample toward guaranteed walkable center
    const toCenterDx = DOOR_CX - ent.x;
    const toCenterDy = DOOR_CY - ent.y;
    const centerDist = Math.hypot(toCenterDx, toCenterDy) || 1;
    const normX = toCenterDx / centerDist;
    const normY = toCenterDy / centerDist;

    for (let step = 0.5; step <= centerDist; step += 0.5) {
      const testX = ent.x + normX * step;
      const testY = ent.y + normY * step;
      if (!this.isBlocked(r, testX, testY, ent.radius)) {
        ent.x = testX;
        ent.y = testY;
        return true;
      }
    }

    // Absolute fallback: safe room center
    ent.x = DOOR_CX;
    ent.y = DOOR_CY;
    return true;
  }

  // Slide movement: moves an entity along valid collision axes without getting stuck
  public moveEntity(r: DungeonRoom, ent: { x: number; y: number; radius: number }, vx: number, vy: number): [boolean, boolean] {
    let bx = false;
    let by = false;

    // If currently stuck, unstuck first
    if (this.isBlocked(r, ent.x, ent.y, ent.radius)) {
      this.resolveEntityStuck(r, ent);
    }

    ent.x += vx;
    if (this.isBlocked(r, ent.x, ent.y, ent.radius)) {
      ent.x -= vx;
      bx = true;
    }

    ent.y += vy;
    if (this.isBlocked(r, ent.x, ent.y, ent.radius)) {
      ent.y -= vy;
      by = true;
    }

    // Keep firmly inside room boundaries
    ent.x = Math.max(ent.radius + 1.0, Math.min(WORLD_W - ent.radius - 1.0, ent.x));
    ent.y = Math.max(ent.radius + 1.0, Math.min(WORLD_H - ent.radius - 1.0, ent.y));

    return [bx, by];
  }
}

export const dungeon = new DungeonGenerator();
