// Shared Dungeon Geometry Constants
// Decoupled to eliminate circular dependency between dungeonGenerator and arenaPrefabs

export const TILE_SIZE = 2.0;
export const ROOM_WIDTH = 19;
export const ROOM_HEIGHT = 13;
export const WORLD_W = ROOM_WIDTH * TILE_SIZE; // 38 units
export const WORLD_H = ROOM_HEIGHT * TILE_SIZE; // 26 units

export const DOOR_X = 9;
export const DOOR_Y = 6;
export const DOOR_CX = DOOR_X * TILE_SIZE + TILE_SIZE / 2;
export const DOOR_CY = DOOR_Y * TILE_SIZE + TILE_SIZE / 2;
