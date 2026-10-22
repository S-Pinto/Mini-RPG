// Procedural Dungeon Generator with Complex Random Room Shapes
// The Albedo Renegades: Shadow of Elanthria

import * as THREE from 'three';
import type { DestructibleProp, ZoneConfig, RoomType } from '../types/game.ts';
import { GEO, getLambert, getBasic, buildPropModel } from '../graphics/proceduralModels.ts';

export const TILE_SIZE = 2.0;
export const ROOM_WIDTH = 19;
export const ROOM_HEIGHT = 13;
export const WORLD_W = ROOM_WIDTH * TILE_SIZE; // 38 units
export const WORLD_H = ROOM_HEIGHT * TILE_SIZE; // 26 units

export const DOOR_X = 9;
export const DOOR_Y = 6;
export const DOOR_CX = DOOR_X * TILE_SIZE + TILE_SIZE / 2;
export const DOOR_CY = DOOR_Y * TILE_SIZE + TILE_SIZE / 2;

export type RoomShape = 'quadrant_sanctuary' | 'twin_crypts' | 'winding_catacombs' | 'pillared_halls' | 'rotunda_colonnade' | 'split_courtyard';

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
      preBossNeighbor.waypointName = 'Santuario del Boss';
    } else if (available.length > 0) {
      const cp = available.shift()!;
      cp.type = 'checkpoint';
      cp.cleared = true;
      cp.waypointName = 'Santuario della Soglia';
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
    const tiles: number[][] = [];
    for (let y = 0; y < ROOM_HEIGHT; y++) {
      const row: number[] = [];
      for (let x = 0; x < ROOM_WIDTH; x++) {
        // Outer boundary is always wall
        row.push(x === 0 || y === 0 || x === ROOM_WIDTH - 1 || y === ROOM_HEIGHT - 1 ? 1 : 0);
      }
      tiles.push(row);
    }

    const shapes: RoomShape[] = [
      'quadrant_sanctuary',
      'twin_crypts',
      'winding_catacombs',
      'pillared_halls',
      'rotunda_colonnade',
      'split_courtyard'
    ];
    let chosenShape: RoomShape = r.type === 'start' 
      ? 'pillared_halls' 
      : (r.type === 'boss' ? 'rotunda_colonnade' : shapes[Math.floor(Math.random() * shapes.length)]);
    r.shape = chosenShape;

    switch (chosenShape) {
      case 'quadrant_sanctuary': {
        // Internal partition walls forming 4 distinct sub-rooms with arched doorways
        // Vertical partitions at x=5 and x=13
        for (let y = 1; y < ROOM_HEIGHT - 1; y++) {
          if (y !== 2 && y !== 6 && y !== 10) {
            tiles[y][5] = 1;
            tiles[y][13] = 1;
          }
        }
        // Horizontal partitions at y=4 and y=8
        for (let x = 1; x < ROOM_WIDTH - 1; x++) {
          if (x !== 3 && x !== 9 && x !== 15) {
            tiles[4][x] = 1;
            tiles[8][x] = 1;
          }
        }
        break;
      }

      case 'twin_crypts': {
        // Grand central wall with 3 ornate arched openings dividing into East and West Halls
        for (let y = 1; y < ROOM_HEIGHT - 1; y++) {
          if (y !== 2 && y !== 6 && y !== 10) {
            tiles[y][9] = 1;
          }
        }
        // Colonnade of pillars flanking the central hall
        for (const py of [3, 9]) {
          for (const px of [4, 14]) {
            tiles[py][px] = 2;
          }
        }
        break;
      }

      case 'winding_catacombs': {
        // Meandering S-shaped corridors with sub-alcoves
        for (let y = 2; y <= 5; y++) tiles[y][6] = 1;
        for (let y = 7; y <= 10; y++) tiles[y][12] = 1;
        for (let x = 2; x <= 4; x++) tiles[8][x] = 1;
        for (let x = 14; x <= 16; x++) tiles[4][x] = 1;

        tiles[3][3] = 2;
        tiles[9][15] = 2;
        break;
      }

      case 'pillared_halls': {
        // Grand sanctuary with 6 stone pillars and side chapels
        for (const py of [3, 9]) {
          for (const px of [4, 9, 14]) {
            if (!(px === DOOR_X && py === DOOR_Y)) {
              tiles[py][px] = 2;
            }
          }
        }
        // Corner alcove walls
        tiles[2][2] = 1; tiles[2][ROOM_WIDTH - 3] = 1;
        tiles[ROOM_HEIGHT - 3][2] = 1; tiles[ROOM_HEIGHT - 3][ROOM_WIDTH - 3] = 1;
        break;
      }

      case 'rotunda_colonnade': {
        // Diagonal beveled corners
        tiles[1][1] = 1; tiles[1][2] = 1; tiles[2][1] = 1;
        tiles[1][ROOM_WIDTH - 2] = 1; tiles[1][ROOM_WIDTH - 3] = 1; tiles[2][ROOM_WIDTH - 2] = 1;
        tiles[ROOM_HEIGHT - 2][1] = 1; tiles[ROOM_HEIGHT - 2][2] = 1; tiles[ROOM_HEIGHT - 3][1] = 1;
        tiles[ROOM_HEIGHT - 2][ROOM_WIDTH - 2] = 1; tiles[ROOM_HEIGHT - 2][ROOM_WIDTH - 3] = 1; tiles[ROOM_HEIGHT - 3][ROOM_WIDTH - 2] = 1;

        // Octagonal ring of pillars
        const pillarSpots = [[5, 3], [13, 3], [4, 6], [14, 6], [5, 9], [13, 9]];
        for (const [px, py] of pillarSpots) {
          tiles[py][px] = 2;
        }
        break;
      }

      case 'split_courtyard': {
        // Ruined courtyard with broken perimeter walls and central cross-hall
        for (let x = 3; x <= 6; x++) tiles[4][x] = 1;
        for (let x = 12; x <= 15; x++) tiles[8][x] = 1;
        tiles[3][14] = 2;
        tiles[9][4] = 2;
        break;
      }
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

  // Find a guaranteed valid, non-blocked floor tile inside the room
  public findFreeSpot(r: DungeonRoom, minFromPlayerX = 0, minFromPlayerY = 0, minDist = 0): { x: number; y: number } {
    const candidates: { x: number; y: number }[] = [];

    for (let ty = 1; ty < ROOM_HEIGHT - 1; ty++) {
      for (let tx = 1; tx < ROOM_WIDTH - 1; tx++) {
        if (r.tiles[ty][tx] === 0) {
          const worldX = tx * TILE_SIZE + TILE_SIZE / 2;
          const worldY = ty * TILE_SIZE + TILE_SIZE / 2;
          const dist = Math.hypot(worldX - minFromPlayerX, worldY - minFromPlayerY);
          if (dist >= minDist) {
            candidates.push({ x: worldX, y: worldY });
          }
        }
      }
    }

    if (candidates.length > 0) {
      return candidates[Math.floor(Math.random() * candidates.length)];
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
      // Pre-boss / waypoint room teleport pad
      r.props.push({
        id: ++propSeq,
        x: WORLD_W / 2,
        y: WORLD_H / 2,
        type: 'teleport_pad',
        hp: 9999
      });
      for (let i = 0; i < 2; i++) {
        const s = this.findFreeSpot(r, WORLD_W / 2, WORLD_H / 2, 2.5);
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

      // 3. Captive Ally Cage (guaranteed once per floor)
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

      // 4. Clutter in other sub-rooms: crates, barrels, pots
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

    const canvas = document.createElement('canvas');
    canvas.width = ROOM_WIDTH * 32;
    canvas.height = ROOM_HEIGHT * 32;
    const ctx = canvas.getContext('2d')!;

    for (let y = 0; y < ROOM_HEIGHT; y++) {
      for (let x = 0; x < ROOM_WIDTH; x++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? zone.floorColorA : zone.floorColorB;
        ctx.fillRect(x * 32, y * 32, 32, 32);

        // Flagstone mortar lines
        ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        ctx.fillRect(x * 32, y * 32, 32, 2);
        ctx.fillRect(x * 32, y * 32, 2, 32);

        for (let k = 0; k < 4; k++) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
          ctx.fillRect(x * 32 + Math.random() * 28, y * 32 + Math.random() * 28, 2 + Math.random() * 3, 2);
        }
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    this.floorTextureCache.set(zone.id, tex);
    return tex;
  }

  public buildRoomScene(r: DungeonRoom, zone: ZoneConfig, roomGroup: THREE.Group): void {
    for (let i = roomGroup.children.length - 1; i >= 0; i--) {
      roomGroup.remove(roomGroup.children[i]);
    }
    r.bars = [];
    r.torches = [];

    // Floor Mesh
    const floorMat = new THREE.MeshLambertMaterial({ map: this.getFloorTexture(zone) });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(WORLD_W, WORLD_H), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(WORLD_W / 2, 0, WORLD_H / 2);
    roomGroup.add(floor);

    const wallMat = getLambert(zone.wallColor);
    const topMat = getLambert(zone.wallColor + 0x111111);

    // Wall & Obstacle blocks
    for (let y = 0; y < ROOM_HEIGHT; y++) {
      for (let x = 0; x < ROOM_WIDTH; x++) {
        const tileVal = r.tiles[y][x];
        const cx = x * TILE_SIZE + TILE_SIZE / 2;
        const cz = y * TILE_SIZE + TILE_SIZE / 2;

        if (tileVal === 1) {
          const isOuterWall = x === 0 || x === ROOM_WIDTH - 1 || y === 0;
          const isFrontWall = y === ROOM_HEIGHT - 1;
          const wallHeight = isFrontWall ? 1.0 : (isOuterWall ? 3.8 : (y >= ROOM_HEIGHT - 3 ? 1.4 : 2.4));
          const wall = new THREE.Mesh(GEO.box, wallMat);
          wall.position.set(cx, wallHeight / 2, cz);
          wall.scale.set(TILE_SIZE, wallHeight, TILE_SIZE);
          roomGroup.add(wall);

          const topCap = new THREE.Mesh(GEO.box, topMat);
          topCap.position.set(cx, wallHeight + 0.05, cz);
          topCap.scale.set(TILE_SIZE + 0.05, 0.1, TILE_SIZE + 0.05);
          roomGroup.add(topCap);
        } else if (tileVal === 2) {
          // Ancient broken pillar / rock
          const pillar = new THREE.Mesh(GEO.cyl, wallMat);
          pillar.position.set(cx, 1.1, cz);
          pillar.scale.set(0.85, 2.2, 0.85);
          roomGroup.add(pillar);
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
      const archR = archL.clone();
      archR.position.x = 1.1;
      const archTop = new THREE.Mesh(GEO.box, topMat);
      archTop.scale.set(2.5, 0.4, 0.4);
      archTop.position.set(0, 3.2, 0);

      doorGroup.add(archL);
      doorGroup.add(archR);
      doorGroup.add(archTop);

      // Gate Bars that drop when room is not cleared
      const barsGroup = new THREE.Group();
      for (let i = 0; i < 5; i++) {
        const bar = new THREE.Mesh(GEO.cyl, getLambert(0x4a4456));
        bar.scale.set(0.08, 2.8, 0.08);
        bar.position.set(-0.8 + i * 0.4, 1.4, 0);
        barsGroup.add(bar);
      }
      barsGroup.visible = !r.cleared;
      doorGroup.add(barsGroup);
      r.bars.push(barsGroup);

      // Portal color indicator
      let portalColor = 0xa899cc;
      if (targetRoom.type === 'boss') portalColor = 0xff3355;
      else if (targetRoom.type === 'treasure') portalColor = 0xffd700;
      else if (targetRoom.type === 'shrine') portalColor = 0x88ffcc;

      const portalLight = new THREE.Mesh(GEO.sph, getBasic(portalColor));
      portalLight.scale.set(0.25, 0.25, 0.25);
      portalLight.position.set(0, 3.5, 0);
      doorGroup.add(portalLight);

      roomGroup.add(doorGroup);
    }

    // Torches
    for (const tx of [4, 10, 20, 26]) {
      const sconce = new THREE.Mesh(GEO.box, getLambert(0x382c22));
      sconce.scale.set(0.14, 0.6, 0.14);
      sconce.position.set(tx, 2.2, TILE_SIZE + 0.1);
      roomGroup.add(sconce);

      const flame = new THREE.Mesh(GEO.cone, getBasic(zone.torchColor));
      flame.scale.set(0.2, 0.45, 0.2);
      flame.position.set(tx, 2.65, TILE_SIZE + 0.1);
      roomGroup.add(flame);
      r.torches.push(flame);
    }

    // Build 3D models for Props
    for (const p of r.props) {
      const propVis = buildPropModel(p.type);
      propVis.root.position.set(p.x, 0, p.y);
      roomGroup.add(propVis.root);
      p.mesh = propVis.root;
    }
  }

  // Smooth collision check with radius clamping
  public isBlocked(r: DungeonRoom, x: number, y: number, radius = 0.4): boolean {
    const minTx = Math.floor((x - radius) / TILE_SIZE);
    const maxTx = Math.floor((x + radius) / TILE_SIZE);
    const minTy = Math.floor((y - radius) / TILE_SIZE);
    const maxTy = Math.floor((y + radius) / TILE_SIZE);

    for (let ty = minTy; ty <= maxTy; ty++) {
      for (let tx = minTx; tx <= maxTx; tx++) {
        if (tx < 0 || ty < 0 || tx >= ROOM_WIDTH || ty >= ROOM_HEIGHT) return true;
        const val = r.tiles[ty][tx];
        if (val === 1 || val === 2 || (val === 3 && !r.cleared)) {
          return true;
        }
      }
    }
    return false;
  }

  // Slide movement: moves an entity along valid collision axes without getting stuck
  public moveEntity(r: DungeonRoom, ent: { x: number; y: number; radius: number }, vx: number, vy: number): [boolean, boolean] {
    let bx = false;
    let by = false;

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

    return [bx, by];
  }
}

export const dungeon = new DungeonGenerator();
