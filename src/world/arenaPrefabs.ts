// Prefab Arena Architecture, Tactical Cover Points & Spawn Waves
// The Albedo Renegades: Shadow of Elanthria - Hades Roguelike Arenas

import { ROOM_WIDTH, ROOM_HEIGHT, DOOR_X, DOOR_Y, TILE_SIZE } from './dungeonConstants.ts';
import type { DestructibleProp } from '../types/game.ts';

export interface TacticalCoverPoint {
  x: number; // World X coordinate
  y: number; // World Z/Y coordinate
  normalX: number; // Direction facing away from the cover
  normalY: number;
  type: 'pillar' | 'wall' | 'barricade';
}

export interface ArenaPrefab {
  id: string;
  name: string;
  subtitle: string;
  shape: string;
  tiles: number[][]; // 13x19 grid (0: floor, 1: wall, 2: pillar, 3: door, 4: chasm)
  coverPoints: TacticalCoverPoint[];
  wave1Spawns: { x: number; y: number }[];
  wave2Spawns: { x: number; y: number }[];
  wave3Spawns?: { x: number; y: number }[];
  presetProps: DestructibleProp[];
}

function createEmptyGrid(): number[][] {
  const grid: number[][] = [];
  for (let y = 0; y < ROOM_HEIGHT; y++) {
    const row: number[] = [];
    for (let x = 0; x < ROOM_WIDTH; x++) {
      row.push(x === 0 || y === 0 || x === ROOM_WIDTH - 1 || y === ROOM_HEIGHT - 1 ? 1 : 0);
    }
    grid.push(row);
  }
  return grid;
}

// Ensure door paths and room center are always walkable
function ensureSafePassages(tiles: number[][]): void {
  for (let y = DOOR_Y - 2; y <= DOOR_Y + 2; y++) {
    for (let x = DOOR_X - 2; x <= DOOR_X + 2; x++) {
      tiles[y][x] = 0;
    }
  }
  // Clear North-South spine
  for (let y = 1; y < ROOM_HEIGHT - 1; y++) {
    tiles[y][DOOR_X] = 0;
    tiles[y][DOOR_X - 1] = 0;
  }
  // Clear East-West spine
  for (let x = 1; x < ROOM_WIDTH - 1; x++) {
    tiles[DOOR_Y][x] = 0;
    tiles[DOOR_Y - 1][x] = 0;
  }
}

// ══════════════════════════════════════════════════════════════════════════
// 1. PREFAB ARENA: COLOSSEO DELLE ANIME (Tartarus Arena Colosseum)
// ══════════════════════════════════════════════════════════════════════════
function buildColosseumPrefab(): ArenaPrefab {
  const tiles = createEmptyGrid();

  // Corner bastions
  tiles[1][1] = 1; tiles[1][2] = 1; tiles[2][1] = 1;
  tiles[1][ROOM_WIDTH - 2] = 1; tiles[1][ROOM_WIDTH - 3] = 1; tiles[2][ROOM_WIDTH - 2] = 1;
  tiles[ROOM_HEIGHT - 2][1] = 1; tiles[ROOM_HEIGHT - 2][2] = 1; tiles[ROOM_HEIGHT - 3][1] = 1;
  tiles[ROOM_HEIGHT - 2][ROOM_WIDTH - 2] = 1; tiles[ROOM_HEIGHT - 2][ROOM_WIDTH - 3] = 1; tiles[ROOM_HEIGHT - 3][ROOM_WIDTH - 2] = 1;

  // Ring of 8 colossal gladiatorial pillars providing full tactical cover
  const pillars = [
    [5, 3], [13, 3],
    [4, 6], [14, 6],
    [5, 9], [13, 9],
    [9, 2], [9, 10]
  ];
  for (const [px, py] of pillars) {
    tiles[py][px] = 2;
  }
  ensureSafePassages(tiles);

  const coverPoints: TacticalCoverPoint[] = [
    { x: 5 * TILE_SIZE + 1.0, y: (3 - 1) * TILE_SIZE + 1.0, normalX: 0, normalY: -1, type: 'pillar' },
    { x: 13 * TILE_SIZE + 1.0, y: (3 - 1) * TILE_SIZE + 1.0, normalX: 0, normalY: -1, type: 'pillar' },
    { x: (4 - 1) * TILE_SIZE + 1.0, y: 6 * TILE_SIZE + 1.0, normalX: -1, normalY: 0, type: 'pillar' },
    { x: (14 + 1) * TILE_SIZE + 1.0, y: 6 * TILE_SIZE + 1.0, normalX: 1, normalY: 0, type: 'pillar' },
    { x: 5 * TILE_SIZE + 1.0, y: (9 + 1) * TILE_SIZE + 1.0, normalX: 0, normalY: 1, type: 'pillar' },
    { x: 13 * TILE_SIZE + 1.0, y: (9 + 1) * TILE_SIZE + 1.0, normalX: 0, normalY: 1, type: 'pillar' }
  ];

  const wave1Spawns = [
    { x: 6 * TILE_SIZE, y: 3.5 * TILE_SIZE },
    { x: 12 * TILE_SIZE, y: 3.5 * TILE_SIZE },
    { x: 6 * TILE_SIZE, y: 8.5 * TILE_SIZE },
    { x: 12 * TILE_SIZE, y: 8.5 * TILE_SIZE }
  ];

  const wave2Spawns = [
    { x: 3.5 * TILE_SIZE, y: 6 * TILE_SIZE },
    { x: 14.5 * TILE_SIZE, y: 6 * TILE_SIZE },
    { x: 9 * TILE_SIZE, y: 3 * TILE_SIZE },
    { x: 9 * TILE_SIZE, y: 9 * TILE_SIZE },
    { x: 7 * TILE_SIZE, y: 6 * TILE_SIZE }
  ];

  const presetProps: DestructibleProp[] = [
    { id: 101, type: 'explosive_barrel', x: 7 * TILE_SIZE, y: 3 * TILE_SIZE, hp: 1, maxHp: 1 },
    { id: 102, type: 'explosive_barrel', x: 11 * TILE_SIZE, y: 3 * TILE_SIZE, hp: 1, maxHp: 1 },
    { id: 103, type: 'sarcophagus', x: 4 * TILE_SIZE, y: 9 * TILE_SIZE, hp: 20, maxHp: 20 },
    { id: 104, type: 'sarcophagus', x: 14 * TILE_SIZE, y: 9 * TILE_SIZE, hp: 20, maxHp: 20 }
  ];

  return {
    id: 'colosseum_of_souls',
    name: 'Colosseo delle Anime',
    subtitle: 'Arena circolare con colonnato monumentale e coperture tattiche',
    shape: 'dragon_colosseum',
    tiles,
    coverPoints,
    wave1Spawns,
    wave2Spawns,
    presetProps
  };
}

// ══════════════════════════════════════════════════════════════════════════
// 2. PREFAB ARENA: IL PONTE SUL BARATRO (Grand Bridge Chasm)
// ══════════════════════════════════════════════════════════════════════════
function buildBridgeChasmPrefab(): ArenaPrefab {
  const tiles = createEmptyGrid();

  // Bottomless abyssal chasm running across rows 4 and 8
  for (const cy of [4, 8]) {
    for (let x = 1; x < ROOM_WIDTH - 1; x++) {
      if (!(x >= 7 && x <= 11) && !(x >= 2 && x <= 3) && !(x >= 15 && x <= 16)) {
        tiles[cy][x] = 4; // Abyss chasm
      }
    }
  }

  // Guard pillars flanking the bridgeheads
  tiles[3][6] = 2; tiles[3][12] = 2;
  tiles[9][6] = 2; tiles[9][12] = 2;
  ensureSafePassages(tiles);

  const coverPoints: TacticalCoverPoint[] = [
    { x: 6 * TILE_SIZE + 1.0, y: 2.5 * TILE_SIZE, normalX: -1, normalY: -1, type: 'pillar' },
    { x: 12 * TILE_SIZE + 1.0, y: 2.5 * TILE_SIZE, normalX: 1, normalY: -1, type: 'pillar' },
    { x: 6 * TILE_SIZE + 1.0, y: 9.5 * TILE_SIZE, normalX: -1, normalY: 1, type: 'pillar' },
    { x: 12 * TILE_SIZE + 1.0, y: 9.5 * TILE_SIZE, normalX: 1, normalY: 1, type: 'pillar' }
  ];

  const wave1Spawns = [
    { x: 9 * TILE_SIZE, y: 2.5 * TILE_SIZE },
    { x: 2.5 * TILE_SIZE, y: 6 * TILE_SIZE },
    { x: 15.5 * TILE_SIZE, y: 6 * TILE_SIZE }
  ];

  const wave2Spawns = [
    { x: 7 * TILE_SIZE, y: 6 * TILE_SIZE },
    { x: 11 * TILE_SIZE, y: 6 * TILE_SIZE },
    { x: 9 * TILE_SIZE, y: 9.5 * TILE_SIZE },
    { x: 2.5 * TILE_SIZE, y: 2.5 * TILE_SIZE },
    { x: 15.5 * TILE_SIZE, y: 9.5 * TILE_SIZE }
  ];

  const presetProps: DestructibleProp[] = [
    { id: 201, type: 'explosive_barrel', x: 5 * TILE_SIZE, y: 3.5 * TILE_SIZE, hp: 1, maxHp: 1 },
    { id: 202, type: 'explosive_barrel', x: 13 * TILE_SIZE, y: 3.5 * TILE_SIZE, hp: 1, maxHp: 1 },
    { id: 203, type: 'toxic_barrel', x: 6 * TILE_SIZE, y: 8.5 * TILE_SIZE, hp: 1, maxHp: 1 },
    { id: 204, type: 'weapon_rack', x: 9 * TILE_SIZE, y: 2.0 * TILE_SIZE, hp: 20, maxHp: 20 }
  ];

  return {
    id: 'grand_bridge_chasm',
    name: 'Il Passo del Baratro',
    subtitle: 'Chasm abissale attraversato da ponti di pietra e strozzature',
    shape: 'grand_bridge_chasm',
    tiles,
    coverPoints,
    wave1Spawns,
    wave2Spawns,
    presetProps
  };
}

// ══════════════════════════════════════════════════════════════════════════
// 3. PREFAB ARENA: SANTUARIO DEI QUATTRO ALTARI (Quadrant Sanctuary)
// ══════════════════════════════════════════════════════════════════════════
function buildQuadrantSanctuaryPrefab(): ArenaPrefab {
  const tiles = createEmptyGrid();

  // Internal stone partition walls forming 4 distinct sub-rooms with arched doorways
  for (let y = 1; y < ROOM_HEIGHT - 1; y++) {
    if (y !== 2 && y !== 6 && y !== 10) {
      tiles[y][5] = 1;
      tiles[y][13] = 1;
    }
  }
  for (let x = 1; x < ROOM_WIDTH - 1; x++) {
    if (x !== 3 && x !== 9 && x !== 15) {
      tiles[4][x] = 1;
      tiles[8][x] = 1;
    }
  }

  // 4 Central Altar Pillars
  tiles[3][3] = 2;
  tiles[3][15] = 2;
  tiles[9][3] = 2;
  tiles[9][15] = 2;
  ensureSafePassages(tiles);

  const coverPoints: TacticalCoverPoint[] = [
    { x: 3 * TILE_SIZE + 1.0, y: 2.2 * TILE_SIZE, normalX: 0, normalY: -1, type: 'pillar' },
    { x: 15 * TILE_SIZE + 1.0, y: 2.2 * TILE_SIZE, normalX: 0, normalY: -1, type: 'pillar' },
    { x: 3 * TILE_SIZE + 1.0, y: 9.8 * TILE_SIZE, normalX: 0, normalY: 1, type: 'pillar' },
    { x: 15 * TILE_SIZE + 1.0, y: 9.8 * TILE_SIZE, normalX: 0, normalY: 1, type: 'pillar' }
  ];

  const wave1Spawns = [
    { x: 3 * TILE_SIZE, y: 2.5 * TILE_SIZE },
    { x: 15 * TILE_SIZE, y: 2.5 * TILE_SIZE },
    { x: 3 * TILE_SIZE, y: 9.5 * TILE_SIZE },
    { x: 15 * TILE_SIZE, y: 9.5 * TILE_SIZE }
  ];

  const wave2Spawns = [
    { x: 9 * TILE_SIZE, y: 2.5 * TILE_SIZE },
    { x: 9 * TILE_SIZE, y: 9.5 * TILE_SIZE },
    { x: 2.5 * TILE_SIZE, y: 6 * TILE_SIZE },
    { x: 15.5 * TILE_SIZE, y: 6 * TILE_SIZE }
  ];

  const presetProps: DestructibleProp[] = [
    { id: 301, type: 'sarcophagus', x: 2.5 * TILE_SIZE, y: 2.5 * TILE_SIZE, hp: 20, maxHp: 20 },
    { id: 302, type: 'sarcophagus', x: 15.5 * TILE_SIZE, y: 9.5 * TILE_SIZE, hp: 20, maxHp: 20 },
    { id: 303, type: 'explosive_barrel', x: 7 * TILE_SIZE, y: 6 * TILE_SIZE, hp: 1, maxHp: 1 },
    { id: 304, type: 'toxic_barrel', x: 11 * TILE_SIZE, y: 6 * TILE_SIZE, hp: 1, maxHp: 1 }
  ];

  return {
    id: 'quadrant_sanctuary',
    name: 'Santuario dei Quattro Altari',
    subtitle: 'Quattro cappelle cerimoniali con varchi ad arco e linee di tiro divise',
    shape: 'quadrant_sanctuary',
    tiles,
    coverPoints,
    wave1Spawns,
    wave2Spawns,
    presetProps
  };
}

// ══════════════════════════════════════════════════════════════════════════
// 4. PREFAB ARENA: LABIRINTO DELLE CATACOMBE (Catacomb Labyrinth)
// ══════════════════════════════════════════════════════════════════════════
function buildCatacombLabyrinthPrefab(): ArenaPrefab {
  const tiles = createEmptyGrid();

  // Winding stone partitions
  for (let x = 3; x <= 7; x++) tiles[3][x] = 1;
  for (let x = 11; x <= 15; x++) tiles[3][x] = 1;
  for (let x = 3; x <= 7; x++) tiles[9][x] = 1;
  for (let x = 11; x <= 15; x++) tiles[9][x] = 1;

  for (let y = 4; y <= 8; y++) {
    if (y !== 6) {
      tiles[y][4] = 1;
      tiles[y][14] = 1;
    }
  }
  tiles[6][3] = 2;
  tiles[6][15] = 2;
  ensureSafePassages(tiles);

  const coverPoints: TacticalCoverPoint[] = [
    { x: 3 * TILE_SIZE + 1.0, y: 6 * TILE_SIZE + 1.0, normalX: 0, normalY: -1, type: 'pillar' },
    { x: 15 * TILE_SIZE + 1.0, y: 6 * TILE_SIZE + 1.0, normalX: 0, normalY: 1, type: 'pillar' },
    { x: 9 * TILE_SIZE, y: 4.2 * TILE_SIZE, normalX: 0, normalY: -1, type: 'wall' },
    { x: 9 * TILE_SIZE, y: 7.8 * TILE_SIZE, normalX: 0, normalY: 1, type: 'wall' }
  ];

  const wave1Spawns = [
    { x: 5 * TILE_SIZE, y: 6 * TILE_SIZE },
    { x: 13 * TILE_SIZE, y: 6 * TILE_SIZE },
    { x: 9 * TILE_SIZE, y: 2.5 * TILE_SIZE },
    { x: 9 * TILE_SIZE, y: 9.5 * TILE_SIZE }
  ];

  const wave2Spawns = [
    { x: 2.5 * TILE_SIZE, y: 2.5 * TILE_SIZE },
    { x: 15.5 * TILE_SIZE, y: 2.5 * TILE_SIZE },
    { x: 2.5 * TILE_SIZE, y: 9.5 * TILE_SIZE },
    { x: 15.5 * TILE_SIZE, y: 9.5 * TILE_SIZE },
    { x: 9 * TILE_SIZE, y: 6 * TILE_SIZE }
  ];

  const presetProps: DestructibleProp[] = [
    { id: 401, type: 'sarcophagus', x: 2.5 * TILE_SIZE, y: 3.5 * TILE_SIZE, hp: 20, maxHp: 20 },
    { id: 402, type: 'sarcophagus', x: 15.5 * TILE_SIZE, y: 3.5 * TILE_SIZE, hp: 20, maxHp: 20 },
    { id: 403, type: 'explosive_barrel', x: 4.5 * TILE_SIZE, y: 6 * TILE_SIZE, hp: 1, maxHp: 1 },
    { id: 404, type: 'explosive_barrel', x: 13.5 * TILE_SIZE, y: 6 * TILE_SIZE, hp: 1, maxHp: 1 }
  ];

  return {
    id: 'catacomb_labyrinth',
    name: 'Labirinto delle Catacombe',
    subtitle: 'Corridoi tortuosi e cripte per imboscate ravvicinate e coperture YUKA',
    shape: 'catacomb_labyrinth',
    tiles,
    coverPoints,
    wave1Spawns,
    wave2Spawns,
    presetProps
  };
}

// ══════════════════════════════════════════════════════════════════════════
// 5. PREFAB ARENA: ROTONDA DEI VIGILANTI (Rotunda Colonnade)
// ══════════════════════════════════════════════════════════════════════════
function buildRotundaPrefab(): ArenaPrefab {
  const tiles = createEmptyGrid();

  tiles[1][1] = 1; tiles[1][2] = 1; tiles[2][1] = 1;
  tiles[1][ROOM_WIDTH - 2] = 1; tiles[1][ROOM_WIDTH - 3] = 1; tiles[2][ROOM_WIDTH - 2] = 1;
  tiles[ROOM_HEIGHT - 2][1] = 1; tiles[ROOM_HEIGHT - 2][2] = 1; tiles[ROOM_HEIGHT - 3][1] = 1;
  tiles[ROOM_HEIGHT - 2][ROOM_WIDTH - 2] = 1; tiles[ROOM_HEIGHT - 2][ROOM_WIDTH - 3] = 1; tiles[ROOM_HEIGHT - 3][ROOM_WIDTH - 2] = 1;

  // 6 pillars forming an elliptical courtyard
  const pillarSpots = [[5, 3], [13, 3], [4, 6], [14, 6], [5, 9], [13, 9]];
  for (const [px, py] of pillarSpots) {
    tiles[py][px] = 2;
  }
  ensureSafePassages(tiles);

  const coverPoints: TacticalCoverPoint[] = [
    { x: 5 * TILE_SIZE + 1.0, y: 3 * TILE_SIZE + 1.0, normalX: 0, normalY: -1, type: 'pillar' },
    { x: 13 * TILE_SIZE + 1.0, y: 3 * TILE_SIZE + 1.0, normalX: 0, normalY: -1, type: 'pillar' },
    { x: 4 * TILE_SIZE + 1.0, y: 6 * TILE_SIZE + 1.0, normalX: -1, normalY: 0, type: 'pillar' },
    { x: 14 * TILE_SIZE + 1.0, y: 6 * TILE_SIZE + 1.0, normalX: 1, normalY: 0, type: 'pillar' },
    { x: 5 * TILE_SIZE + 1.0, y: 9 * TILE_SIZE + 1.0, normalX: 0, normalY: 1, type: 'pillar' },
    { x: 13 * TILE_SIZE + 1.0, y: 9 * TILE_SIZE + 1.0, normalX: 0, normalY: 1, type: 'pillar' }
  ];

  const wave1Spawns = [
    { x: 6 * TILE_SIZE, y: 3.5 * TILE_SIZE },
    { x: 12 * TILE_SIZE, y: 3.5 * TILE_SIZE },
    { x: 6 * TILE_SIZE, y: 8.5 * TILE_SIZE },
    { x: 12 * TILE_SIZE, y: 8.5 * TILE_SIZE }
  ];

  const wave2Spawns = [
    { x: 4 * TILE_SIZE, y: 6 * TILE_SIZE },
    { x: 14 * TILE_SIZE, y: 6 * TILE_SIZE },
    { x: 9 * TILE_SIZE, y: 3 * TILE_SIZE },
    { x: 9 * TILE_SIZE, y: 9 * TILE_SIZE }
  ];

  const presetProps: DestructibleProp[] = [
    { id: 501, type: 'explosive_barrel', x: 5 * TILE_SIZE, y: 4.5 * TILE_SIZE, hp: 1, maxHp: 1 },
    { id: 502, type: 'explosive_barrel', x: 13 * TILE_SIZE, y: 4.5 * TILE_SIZE, hp: 1, maxHp: 1 },
    { id: 503, type: 'weapon_rack', x: 9 * TILE_SIZE, y: 2.2 * TILE_SIZE, hp: 20, maxHp: 20 }
  ];

  return {
    id: 'rotunda_colonnade',
    name: 'Rotonda dei Vigilanti',
    subtitle: 'Piazza d\'armi ellittica con ampi cerchi di manovra per scatti e dash',
    shape: 'rotunda_colonnade',
    tiles,
    coverPoints,
    wave1Spawns,
    wave2Spawns,
    presetProps
  };
}

// ══════════════════════════════════════════════════════════════════════════
// ARENA PREFAB REGISTRY & SELECTION
// ══════════════════════════════════════════════════════════════════════════
export const ARENA_PREFABS: ArenaPrefab[] = [
  buildColosseumPrefab(),
  buildBridgeChasmPrefab(),
  buildQuadrantSanctuaryPrefab(),
  buildCatacombLabyrinthPrefab(),
  buildRotundaPrefab()
];

export function getRandomArenaPrefab(): ArenaPrefab {
  return ARENA_PREFABS[Math.floor(Math.random() * ARENA_PREFABS.length)];
}

export function getArenaPrefabById(id: string): ArenaPrefab | undefined {
  return ARENA_PREFABS.find(p => p.id === id);
}
