// Game State Coordinator and Island of Okkarn Campaign Progression
// The Albedo Renegades: Shadow of Elanthria

import * as THREE from 'three';
import { Player } from '../entities/player.ts';
import { Enemy } from '../entities/enemy.ts';
import { dungeon, type DungeonRoom, WORLD_W, WORLD_H, DOOR_CX, DOOR_CY, TILE_SIZE } from '../world/dungeonGenerator.ts';
import { ZONES, ZONE_ORDER } from '../world/zones.ts';
import type { ClassId, FeatUpgrade, Item, ZoneConfig } from '../types/game.ts';
import { generateItem, rollRandomRarity, RARITIES } from '../items/itemDatabase.ts';
import { particles } from '../graphics/particles.ts';
import { sound } from '../audio/soundEngine.ts';
import { combat } from '../combat/combatSystem.ts';
import { telegraphs } from '../combat/telegraphs.ts';
import { modals } from '../ui/modals.ts';
import { GEO, getLambert, getBasic, buildGrandPortalModel } from '../graphics/proceduralModels.ts';

export interface GroundLoot {
  mesh: THREE.Group;
  type: 'coin' | 'heart' | 'exp' | 'item';
  x: number;
  y: number;
  value?: number;
  item?: Item;
  baseY: number;
  rotSpeed: number;
  bobOffset: number;
}

function createLootSprite(title: string, sub: string, color: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 72;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = 'rgba(10, 8, 18, 0.85)';
    ctx.beginPath();
    ctx.roundRect(6, 6, 244, 60, 10);
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = color;
    ctx.stroke();

    ctx.font = 'bold 20px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = color;
    ctx.fillText(title, 128, 30);

    if (sub) {
      ctx.font = '13px Outfit, sans-serif';
      ctx.fillStyle = '#d0c4e8';
      ctx.fillText(sub, 128, 52);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(1.7, 0.48, 1);
  sprite.position.y = 1.05;
  return sprite;
}

export class GameState {
  public state: 'menu' | 'play' | 'levelup' | 'inventory' | 'paused' | 'over' | 'victory' = 'menu';
  public currentZoneIndex = 0;
  public currentZone: ZoneConfig;
  public player: Player;
  public rooms: DungeonRoom[] = [];
  public currentRoom: DungeonRoom | null = null;
  public enemies: Enemy[] = [];
  public groundLoots: GroundLoot[] = [];
  public bossPortal: {
    x: number;
    y: number;
    mesh: THREE.Group;
    update: (t: number) => void;
  } | null = null;

  public scene = new THREE.Scene();
  public dynamicGroup = new THREE.Group();
  public roomGroup = new THREE.Group();
  public cameraShake = 0;
  private nearShopCounter = false;
  private onTeleportPad = false;

  constructor() {
    this.currentZone = ZONES[ZONE_ORDER[this.currentZoneIndex]];
    this.player = new Player('paladin', 0);
  }

  public init(scene: THREE.Scene): void {
    this.scene = scene;
    this.scene.add(this.roomGroup);
    this.scene.add(this.dynamicGroup);
    this.scene.add(combat.group);
    this.scene.add(telegraphs.group);
    this.scene.add(particles.group);
  }

  public startNewRun(classId: ClassId, subclassIndex: number): void {
    this.currentZoneIndex = 0;
    this.currentZone = ZONES[ZONE_ORDER[this.currentZoneIndex]];

    // Create player with matching subclass weapon
    this.dynamicGroup.clear();
    this.player = new Player(classId, subclassIndex);
    const starterWeapon = generateItem('weapon', 1, 'common', classId);
    starterWeapon.name = this.player.subclass.weaponName;
    starterWeapon.weaponStyle = this.player.subclass.weaponStyle;
    if (this.player.subclass.weaponStyle === 'bow') starterWeapon.modelType = 'bow';
    else if (this.player.subclass.weaponStyle === 'wand_tome') starterWeapon.modelType = 'wand_tome';
    else if (this.player.subclass.weaponStyle === 'dual_swords') starterWeapon.modelType = 'dual_swords';
    else if (this.player.subclass.weaponStyle === 'greatsword_2h') starterWeapon.modelType = 'greatsword';
    else if (this.player.subclass.weaponStyle === 'dual_daggers') starterWeapon.modelType = 'dual_daggers';
    else if (this.player.subclass.weaponStyle === 'staff_holy') starterWeapon.modelType = 'staff_holy';
    else if (this.player.subclass.weaponStyle === 'staff_2h') starterWeapon.modelType = 'staff';
    else if (this.player.subclass.weaponStyle === 'mace_shield') starterWeapon.modelType = 'mace';
    else starterWeapon.modelType = 'sword';
    this.player.equip.weapon = starterWeapon;

    this.player.recalculateStats();
    this.player.hp = this.player.maxHp;
    this.dynamicGroup.add(this.player.mesh);

    // Build first floor in Azren
    this.loadZone(this.currentZone);
    this.state = 'play';
    sound.startDungeonMusic();
  }

  public loadZone(zone: ZoneConfig): void {
    this.currentZone = zone;
    // More rooms per level as requested: Act 1: 10 rooms, Act 2: 13 rooms, Act 3: 15 rooms, Act 4: 18 rooms
    const targetRooms = Math.round(8 + zone.actNumber * 2.5);
    this.rooms = dungeon.generateFloor(zone, targetRooms);
    const startRoom = this.rooms.find(r => r.type === 'start') || this.rooms[0];
    this.enterRoom(startRoom);
  }

  public enterRoom(r: DungeonRoom): void {
    this.currentRoom = r;
    r.visited = true;
    r.seen = true;

    if (r.waypointName && !r.waypointUnlocked) {
      r.waypointUnlocked = true;
      sound.levelUp();
      particles.spawnShockwave(WORLD_W / 2, WORLD_H / 2, 4.0, 0x00ffff);
      particles.spawnFloatingText(this.player.x, 2.5, this.player.y, `✨ Portale Attivato: ${r.waypointName}! (Tasto M)`, '#00ffee', true);
    }

    for (const neighbor of Object.values(r.doors)) {
      if (neighbor) neighbor.seen = true;
    }

    // Build 3D meshes for room
    dungeon.buildRoomScene(r, this.currentZone, this.roomGroup);

    // Clear dynamic room objects
    this.clearRoomEntities();

    // Re-add player to dynamic group
    this.dynamicGroup.add(this.player.mesh);

    // Spawn enemies if room was never spawned
    if (!r.cleared && !r.spawned) {
      r.spawned = true;
      this.spawnRoomEnemies(r);
    }
  }

  public openFastTravelMap(): void {
    if (this.state !== 'play' || !this.currentRoom) return;
    modals.showFastTravelMap(this.rooms, this.currentRoom, (target) => {
      this.teleportPlayerToRoom(target);
    });
  }

  public teleportPlayerToRoom(destRoom: DungeonRoom): void {
    if (!destRoom || this.currentRoom === destRoom) return;
    sound.skill();
    particles.spawnShockwave(this.player.x, this.player.y, 3.5, 0x00ffff);
    particles.spawnBurst(this.player.x, 1.2, this.player.y, 25, 0x00ffff, 7);

    this.player.x = WORLD_W / 2;
    this.player.y = WORLD_H / 2;
    this.enterRoom(destRoom);

    particles.spawnShockwave(this.player.x, this.player.y, 4.0, 0x8a5cf6);
    particles.spawnBurst(this.player.x, 1.2, this.player.y, 30, 0xa78bfa, 7);
    particles.spawnFloatingText(this.player.x, 2.6, this.player.y, `Teletrasportato in: ${destRoom.waypointName || 'Stanza'}`, '#c084fc', true);
  }

  private clearRoomEntities(): void {
    for (const e of this.enemies) {
      this.dynamicGroup.remove(e.mesh);
    }
    this.enemies = [];

    for (const l of this.groundLoots) {
      this.dynamicGroup.remove(l.mesh);
    }
    this.groundLoots = [];

    combat.clear();
    telegraphs.clear();
  }

  private spawnRoomEnemies(r: DungeonRoom): void {
    // Tougher enemies that scale more aggressively per act (+70% stats per act)
    const actMult = 1.0 + (this.currentZone.actNumber - 1) * 0.70;

    if (r.type === 'boss') {
      const boss = new Enemy(this.currentZone.bossType, WORLD_W / 2, WORLD_H * 0.35, actMult * 1.45);
      this.enemies.push(boss);
      this.dynamicGroup.add(boss.mesh);
      sound.dragonRoar();
      return;
    }

    if (r.type === 'normal') {
      // More enemies per room (4 to 9 enemies)
      const enemyCount = 4 + Math.floor(Math.random() * 3) + this.currentZone.actNumber * 2;
      for (let i = 0; i < enemyCount; i++) {
        const pool = this.currentZone.enemyPool;
        const eType = pool[Math.floor(Math.random() * pool.length)];

        // Guaranteed free spot inside complex room shape
        const spot = dungeon.findFreeSpot(r, this.player.x, this.player.y, 6.0);
        const isElite = Math.random() < (0.15 + this.currentZone.actNumber * 0.08);
        const enemy = new Enemy(eType, spot.x, spot.y, actMult * (isElite ? 1.35 : 1.0));
        this.enemies.push(enemy);
        this.dynamicGroup.add(enemy.mesh);
      }
    }
  }

  public update(dt: number): void {
    if (this.state !== 'play' || !this.currentRoom) return;

    // Check player death
    if (this.player.hp <= 0) {
      this.state = 'over';
      sound.playerHurt();
      modals.recordRunScore({
        name: 'Campione dei Renegades',
        className: this.player.classId.toUpperCase(),
        subclassName: this.player.subclass.name,
        level: this.player.level,
        zoneName: this.currentZone.name,
        gold: this.player.gold,
        score: this.player.level * 150 + this.player.gold * 2,
        date: new Date().toLocaleDateString('it-IT')
      });
      modals.showMessage(
        'SEI CADUTO A OKKARN',
        `La tua avventura si è interrotta a ${this.currentZone.name} al Livello ${this.player.level}. Il tuo punteggio è stato registrato nella Classifica!`,
        'Ricomincia la Discesa',
        () => modals.showClassSelect()
      );
      return;
    }

    // Update Enemies
    for (const e of this.enemies) {
      e.update(dt, this.player.x, this.player.y, this.currentRoom, (enemy, tx, ty) => {
        combat.handleEnemyAttack(enemy, tx, ty, this.player);
      });
    }

    // Check Enemy Deaths & Loot Drops
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.isDead) {
        sound.killEnemy();
        particles.spawnBurst(e.x, 1.2, e.y, 20, e.stats.color, 6);

        // 1. Guaranteed EXP Crystal Drop
        this.spawnGroundLoot('exp', e.x, e.y, e.stats.xpReward);

        // 2. Gold Coins Drop
        this.spawnGroundLoot('coin', e.x + 0.4, e.y + 0.3, 1 + Math.floor(Math.random() * 3));

        // 3. Healing Potion Drop (higher chance when player wounded)
        const potionChance = this.player.hp < this.player.maxHp * 0.5 ? 0.6 : 0.3;
        if (Math.random() < potionChance) {
          this.spawnGroundLoot('heart', e.x - 0.4, e.y - 0.3);
        }

        // 4. Equipment drop (weapons, armor, helm, ring, relic)
        if (e.stats.isBoss || Math.random() < 0.28) {
          const slots: ('weapon' | 'armor' | 'helm' | 'ring' | 'relic')[] = ['weapon', 'armor', 'helm', 'ring', 'relic'];
          const slot = slots[Math.floor(Math.random() * slots.length)];
          const rarity = rollRandomRarity(this.currentZone.actNumber, this.player.stats.luck);
          const item = generateItem(slot, this.currentZone.actNumber, rarity, this.player.classId);
          this.spawnGroundLoot('item', e.x + (Math.random() - 0.5) * 0.8, e.y + (Math.random() - 0.5) * 0.8, undefined, item);
        }

        this.dynamicGroup.remove(e.mesh);
        this.enemies.splice(i, 1);
      }
    }

    // Check Room Clearance
    if (!this.currentRoom.cleared && this.currentRoom.spawned && this.enemies.length === 0) {
      this.currentRoom.cleared = true;
      sound.doorUnlock();
      for (const bar of this.currentRoom.bars) {
        bar.visible = false;
      }

      // If boss room was cleared, spawn grand teleport portal gate!
      if (this.currentRoom.type === 'boss') {
        this.spawnBossTeleportPortal(WORLD_W / 2, WORLD_H * 0.4);
      }
    }

    // Update Ground Loots: spin, bob, and vacuum pickup
    const now = performance.now() * 0.001;

    // Update Boss Teleport Portal (if active)
    if (this.bossPortal) {
      this.bossPortal.update(now);
      const portalDist = Math.hypot(this.player.x - this.bossPortal.x, this.player.y - this.bossPortal.y);
      if (portalDist < 1.6) {
        sound.dash();
        sound.levelUp();
        particles.spawnShockwave(this.bossPortal.x, this.bossPortal.y, 4.5, 0x00ffff, 0.4);
        particles.spawnBurst(this.bossPortal.x, 2.0, this.bossPortal.y, 30, 0x00e5ff, 8);
        this.roomGroup.remove(this.bossPortal.mesh);
        this.bossPortal = null;
        this.handleZoneVictory();
        return;
      }
    }
    for (let i = this.groundLoots.length - 1; i >= 0; i--) {
      const l = this.groundLoots[i];
      l.mesh.rotation.y += l.rotSpeed * dt;
      l.mesh.position.y = l.baseY + Math.sin(now * 3.5 + l.bobOffset) * 0.06;

      const dist = Math.hypot(l.x - this.player.x, l.y - this.player.y);

      // Vacuum pickup effect when close
      if (dist < 3.2) {
        l.x += (this.player.x - l.x) * dt * 8;
        l.y += (this.player.y - l.y) * dt * 8;
        l.mesh.position.x = l.x;
        l.mesh.position.z = l.y;
      }

      if (dist < 1.0) {
        if (l.type === 'coin') {
          sound.coin();
          this.player.gold += l.value || 1;
          particles.spawnFloatingText(l.x, 1.8, l.y, `+${l.value || 1} Oro`, '#ffd700');
        } else if (l.type === 'exp') {
          sound.levelUp();
          const xpGained = l.value || 20;
          this.player.addXp(xpGained);
          particles.spawnBurst(l.x, 1.0, l.y, 16, 0x00ffee, 5);
          particles.spawnFloatingText(l.x, 2.0, l.y, `+${xpGained} EXP`, '#00ffee', true);
        } else if (l.type === 'heart') {
          sound.heal();
          this.player.potions++;
          const healed = this.player.heal(Math.round(this.player.maxHp * 0.45));
          particles.spawnShockwave(l.x, l.y, 2.5, 0xff3355);
          particles.spawnFloatingText(l.x, 2.0, l.y, `+1 Pozione Cura (+${healed} PV)`, '#55ff77', true);
        } else if (l.type === 'item' && l.item) {
          sound.chestOpen();
          this.player.bag.push(l.item);
          const rar = RARITIES[l.item.rarity];
          particles.spawnBurst(l.x, 1.5, l.y, 25, rar.hex, 6);
          particles.spawnFloatingText(l.x, 2.4, l.y, `Equip: ${l.item.name} (${rar.name})`, rar.color, true);
        }

        this.dynamicGroup.remove(l.mesh);
        this.groundLoots.splice(i, 1);
      }
    }

    // Check Door Transitions
    this.checkDoorTransitions();

    // Check Chest & Shrine Interactions
    this.checkPropInteractions();

    // Update Projectiles and Combat
    combat.update(dt, this.player, this.enemies, this.currentRoom);
    telegraphs.update(dt);
  }

  private spawnGroundLoot(
    type: 'coin' | 'heart' | 'exp' | 'item',
    x: number,
    y: number,
    value?: number,
    item?: Item
  ): void {
    const mesh = new THREE.Group();
    const baseY = 0.4;
    const rotSpeed = 1.6 + Math.random() * 1.4;
    const bobOffset = Math.random() * Math.PI * 2;

    if (type === 'exp') {
      // Glowing Cyan/Emerald Crystal with rotating ring
      const gem = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.24, 0),
        getLambert(0x00ffcc, 0x008877)
      );
      const ring = new THREE.Mesh(GEO.torus, getBasic(0x44ffee, 0.6, true));
      ring.scale.set(0.28, 0.28, 0.04);
      ring.rotation.x = Math.PI / 3;
      gem.add(ring);
      gem.position.y = 0.35;
      mesh.add(gem);

      const label = createLootSprite(`✨ +${value || 15} EXP`, 'Sfera di Saggezza', '#00ffee');
      mesh.add(label);
    } else if (type === 'heart') {
      // 3D Glass Health Potion Flask with Glowing Red Elixir & Cross
      const bottle = new THREE.Mesh(GEO.sph, getLambert(0xe62e49, 0x660a18));
      bottle.scale.set(0.24, 0.26, 0.24);
      const neck = new THREE.Mesh(GEO.cyl, getLambert(0x8a1a28));
      neck.scale.set(0.09, 0.16, 0.09);
      neck.position.set(0, 0.22, 0);
      const cork = new THREE.Mesh(GEO.cyl, getLambert(0x5a3820));
      cork.scale.set(0.1, 0.08, 0.1);
      cork.position.set(0, 0.32, 0);

      // Glowing red cross above bottle
      const crossV = new THREE.Mesh(GEO.box, getBasic(0xff3355));
      crossV.scale.set(0.04, 0.18, 0.02);
      crossV.position.set(0, 0.48, 0);
      const crossH = new THREE.Mesh(GEO.box, getBasic(0xff3355));
      crossH.scale.set(0.14, 0.04, 0.02);
      crossH.position.set(0, 0.48, 0);

      bottle.add(neck, cork, crossV, crossH);
      bottle.position.y = 0.3;
      mesh.add(bottle);

      const label = createLootSprite('🧪 Pozione Curativa', 'Recupera 45% PV (Tasto R)', '#ff4466');
      mesh.add(label);
    } else if (type === 'coin') {
      // Golden Coin
      const coin = new THREE.Mesh(GEO.cyl, getLambert(0xffd700, 0x443300));
      coin.scale.set(0.22, 0.04, 0.22);
      coin.rotation.x = Math.PI / 4;
      coin.position.y = 0.3;
      mesh.add(coin);

      const label = createLootSprite(`💰 +${value || 1} Oro`, 'Monete di Okkarn', '#ffd700');
      mesh.add(label);
    } else if (type === 'item' && item) {
      const rar = RARITIES[item.rarity];
      const rarHex = rar.hex;

      // Vertical Light Pillar reaching into the sky!
      const beam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.18, 3.5, 12, 1, true),
        getBasic(rarHex, 0.28, true)
      );
      beam.position.y = 1.75;
      mesh.add(beam);

      // Ground glow ring
      const groundGlow = new THREE.Mesh(GEO.circle, getBasic(rarHex, 0.5, true));
      groundGlow.scale.set(0.5, 0.5, 0.5);
      groundGlow.rotation.x = -Math.PI / 2;
      groundGlow.position.y = 0.02;
      mesh.add(groundGlow);

      // 3D Item Model tailored to its specific type and glowing with rarity color!
      const itemGroup = new THREE.Group();
      if (item.slot === 'weapon') {
        const n = item.name.toLowerCase();
        if (n.includes('bastone') || n.includes('verga') || n.includes('bacchetta') || n.includes('scettro')) {
          // Mage Staff / Wand with glowing crystal head in rarity color
          const staff = new THREE.Group();
          const shaft = new THREE.Mesh(GEO.cyl, getLambert(0x3e2816));
          shaft.scale.set(0.06, 1.3, 0.06);
          shaft.position.y = 0.45;
          const headProngs = new THREE.Mesh(GEO.box, getLambert(0xffd700));
          headProngs.scale.set(0.2, 0.12, 0.2);
          headProngs.position.y = 1.05;
          const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.18), getBasic(rarHex, 0.95, true));
          crystal.position.y = 1.25;
          staff.add(shaft, headProngs, crystal);
          itemGroup.add(staff);
        } else if (n.includes('pugnal') || n.includes('dagh') || n.includes('stocco') || n.includes('arco')) {
          // Rogue Twin Daggers crossed
          const d1 = new THREE.Mesh(GEO.box, getLambert(rarHex, 0x222222));
          d1.scale.set(0.06, 0.65, 0.03);
          d1.rotation.z = Math.PI / 4;
          d1.position.y = 0.35;
          const d2 = new THREE.Mesh(GEO.box, getLambert(rarHex, 0x222222));
          d2.scale.set(0.06, 0.65, 0.03);
          d2.rotation.z = -Math.PI / 4;
          d2.position.y = 0.35;
          itemGroup.add(d1, d2);
        } else if (n.includes('mazza') || n.includes('maglio') || n.includes('martello') || n.includes('flagello')) {
          // Cleric/Fighter Heavy Warhammer / Mace
          const handle = new THREE.Mesh(GEO.cyl, getLambert(0x4a2e18));
          handle.scale.set(0.07, 0.9, 0.07);
          handle.position.y = 0.4;
          const hammerHead = new THREE.Mesh(GEO.box, getLambert(rarHex, 0x332211));
          hammerHead.scale.set(0.38, 0.24, 0.24);
          hammerHead.position.y = 0.8;
          itemGroup.add(handle, hammerHead);
        } else {
          // Paladin / Fighter Gleaming Greatsword
          const sword = new THREE.Group();
          const blade = new THREE.Mesh(GEO.box, getLambert(rarHex, 0x333333));
          blade.scale.set(0.1, 1.1, 0.04);
          blade.position.set(0, 0.55, 0);
          const guard = new THREE.Mesh(GEO.box, getLambert(0xffd700));
          guard.scale.set(0.38, 0.06, 0.1);
          guard.position.set(0, 0.05, 0);
          const grip = new THREE.Mesh(GEO.cyl, getLambert(0x2a1c12));
          grip.scale.set(0.04, 0.24, 0.04);
          grip.position.set(0, -0.12, 0);
          sword.add(blade, guard, grip);
          itemGroup.add(sword);
        }
      } else if (item.slot === 'armor') {
        // 3D Cuirass / Robe on armor pedestal in rarity color
        const armorGroup = new THREE.Group();
        const chest = new THREE.Mesh(GEO.box, getLambert(rarHex, 0x222222));
        chest.scale.set(0.5, 0.62, 0.3);
        chest.position.y = 0.45;
        const trimL = new THREE.Mesh(GEO.box, getLambert(0xffd700));
        trimL.scale.set(0.18, 0.12, 0.34);
        trimL.position.set(-0.3, 0.65, 0);
        const trimR = trimL.clone();
        trimR.position.x = 0.3;
        armorGroup.add(chest, trimL, trimR);
        itemGroup.add(armorGroup);
      } else if (item.slot === 'helm') {
        // 3D Helmet with visor in rarity color
        const helmGroup = new THREE.Group();
        const crown = new THREE.Mesh(GEO.box, getLambert(rarHex, 0x222222));
        crown.scale.set(0.48, 0.42, 0.48);
        crown.position.y = 0.4;
        const visor = new THREE.Mesh(GEO.box, getBasic(rarHex, 0.9, true));
        visor.scale.set(0.38, 0.08, 0.06);
        visor.position.set(0, 0.38, 0.25);
        helmGroup.add(crown, visor);
        itemGroup.add(helmGroup);
      } else if (item.slot === 'ring') {
        // Signet Ring with glowing elevated gemstone in rarity color
        const ringGroup = new THREE.Group();
        const band = new THREE.Mesh(GEO.torus, getLambert(0xffd700));
        band.scale.set(0.24, 0.24, 0.05);
        band.position.y = 0.35;
        const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.12), getBasic(rarHex, 0.95, true));
        gem.position.set(0, 0.58, 0);
        ringGroup.add(band, gem);
        itemGroup.add(ringGroup);
      } else {
        // Ancient Arcane Grimoire / Relic floating open
        const bookGroup = new THREE.Group();
        const cover = new THREE.Mesh(GEO.box, getLambert(rarHex, 0x221133));
        cover.scale.set(0.52, 0.1, 0.68);
        cover.position.y = 0.35;
        const pages = new THREE.Mesh(GEO.box, getLambert(0xf0e6d2));
        pages.scale.set(0.48, 0.08, 0.62);
        pages.position.y = 0.36;
        const runeOrb = new THREE.Mesh(GEO.sph, getBasic(rarHex, 0.9, true));
        runeOrb.scale.setScalar(0.12);
        runeOrb.position.y = 0.55;
        bookGroup.add(cover, pages, runeOrb);
        itemGroup.add(bookGroup);
      }

      mesh.add(itemGroup);

      const label = createLootSprite(`${item.icon || '✨'} ${item.name}`, `[${rar.name}] · Livello ${item.ilvl}`, rar.color);
      mesh.add(label);
    }

    mesh.position.set(x, baseY, y);
    this.dynamicGroup.add(mesh);
    this.groundLoots.push({ mesh, type, x, y, value, item, baseY, rotSpeed, bobOffset });
  }

  private checkDoorTransitions(): void {
    if (!this.currentRoom || !this.currentRoom.cleared) return;

    const r = this.currentRoom;
    // North Door
    if (r.doors.n && this.player.y < 1.2 && Math.abs(this.player.x - DOOR_CX) < 1.8) {
      this.player.y = WORLD_H - TILE_SIZE * 1.5;
      this.player.x = DOOR_CX;
      this.enterRoom(r.doors.n);
    }
    // South Door
    else if (r.doors.s && this.player.y > WORLD_H - 1.2 && Math.abs(this.player.x - DOOR_CX) < 1.8) {
      this.player.y = TILE_SIZE * 1.5;
      this.player.x = DOOR_CX;
      this.enterRoom(r.doors.s);
    }
    // East Door
    else if (r.doors.e && this.player.x > WORLD_W - 1.2 && Math.abs(this.player.y - DOOR_CY) < 1.8) {
      this.player.x = TILE_SIZE * 1.5;
      this.player.y = DOOR_CY;
      this.enterRoom(r.doors.e);
    }
    // West Door
    else if (r.doors.w && this.player.x < 1.2 && Math.abs(this.player.y - DOOR_CY) < 1.8) {
      this.player.x = WORLD_W - TILE_SIZE * 1.5;
      this.player.y = DOOR_CY;
      this.enterRoom(r.doors.w);
    }
  }

  private checkPropInteractions(): void {
    if (!this.currentRoom) return;

    for (const p of this.currentRoom.props) {
      const dist = Math.hypot(p.x - this.player.x, p.y - this.player.y);

      if (p.type === 'shop_counter') {
        if (dist < 2.2 && !this.nearShopCounter) {
          this.nearShopCounter = true;
          modals.showShop(this.player, this.currentZone, () => this.openFastTravelMap());
        } else if (dist >= 3.2) {
          this.nearShopCounter = false;
        }
      } else if (p.type === 'teleport_pad') {
        if (dist < 1.6 && !this.onTeleportPad) {
          this.onTeleportPad = true;
          this.openFastTravelMap();
        } else if (dist >= 2.6) {
          this.onTeleportPad = false;
        }
      } else if (p.type === 'skill_crucible') {
        if (dist < 2.0 && !p.opened) {
          p.opened = true;
          sound.chestOpen();
          particles.spawnShockwave(p.x, p.y, 4.5, 0xd946ef);
          particles.spawnBurst(p.x, 1.4, p.y, 30, 0xa855f7, 8);
          modals.showSkillAugments(this.player, (aug) => {
            particles.spawnFloatingText(this.player.x, 2.5, this.player.y, `MUTAZIONE CONSACRATA: ${aug.name}!`, '#f43f5e', true);
          });
        }
      } else if (dist < 1.8) {
        if (p.type === 'chest' && !p.opened) {
          p.opened = true;
          sound.chestOpen();
          particles.spawnBurst(p.x, 1.0, p.y, 25, 0xffd700, 6);
          const item = generateItem('weapon', this.currentZone.actNumber, 'rare', this.player.classId);
          this.spawnGroundLoot('item', p.x, p.y, undefined, item);
          this.spawnGroundLoot('exp', p.x, p.y - 0.5, 45);
          this.spawnGroundLoot('heart', p.x, p.y + 0.5);
          this.spawnGroundLoot('coin', p.x - 0.5, p.y, 8);
          this.spawnGroundLoot('coin', p.x + 0.5, p.y, 8);
        } else if (p.type === 'shrine' && !p.shrineUsed) {
          p.shrineUsed = true;
          sound.heal();
          particles.spawnShockwave(p.x, p.y, 5.0, 0x00ffff);
          this.player.heal(this.player.maxHp);
          this.player.stats.damage += 3;
          particles.spawnFloatingText(p.x, 2.5, p.y, 'BENEDIZIONE DEGLI DEI: CURA TOTALE & +3 DANNO!', '#00ffff', true);
        }
      }
    }
  }

  private handleZoneVictory(): void {
    const isFinalZone = this.currentZoneIndex >= ZONE_ORDER.length - 1;

    if (isFinalZone) {
      this.state = 'victory';
      sound.levelUp();
      modals.recordRunScore({
        name: 'Salvatore di Okkarn',
        className: this.player.classId.toUpperCase(),
        subclassName: this.player.subclass.name,
        level: this.player.level,
        zoneName: 'Drago Vermithrax (Vittoria)',
        gold: this.player.gold,
        score: this.player.level * 200 + this.player.gold * 3 + 2000,
        date: new Date().toLocaleDateString('it-IT')
      });
      modals.showMessage(
        'VITTORIA! L’ISOLA DI OKKARN È LIBERA',
        'Hai sconfitto Vermithrax l’Antico Drago nelle viscere di Vazark! I popoli di Azren, Elshiff e Morgen possono finalmente ricostruire le terre di Elanthria. Gloria a te, Campione dei Renegades! Il tuo punteggio è al vertice della Classifica!',
        'Nuova Campagna D&D',
        () => modals.showClassSelect()
      );
    } else {
      const nextIndex = this.currentZoneIndex + 1;
      const nextZone = ZONES[ZONE_ORDER[nextIndex]];
      this.currentZoneIndex = nextIndex;

      modals.showMessage(
        `VITTORIA AD ATTO ${this.currentZone.actNumber}`,
        `Hai liberato ${this.currentZone.name}! Il sentiero ti conduce verso ${nextZone.name}.`,
        `Avanza a ${nextZone.name}`,
        () => {
          this.loadZone(nextZone);
          this.state = 'play';
        }
      );
    }
  }

  public spawnBossTeleportPortal(x: number, y: number): void {
    if (this.bossPortal) return;
    const model = buildGrandPortalModel();
    model.root.position.set(x, 0, y);
    this.roomGroup.add(model.root);
    this.bossPortal = {
      x,
      y,
      mesh: model.root,
      update: model.update
    };

    sound.doorUnlock();
    sound.levelUp();
    particles.spawnShockwave(x, y, 6.0, 0x00ffff, 0.5);
    particles.spawnBurst(x, 2.0, y, 35, 0x00e5ff, 8);
    particles.spawnFloatingText(x, 3.8, y, '🌀 PORTALE TELETRASPORTO APERTO!', '#00e5ff', true);
  }

  public applyFeat(feat: FeatUpgrade): void {
    this.player.feats.push(feat);
    this.player.pendingLevelUps = Math.max(0, this.player.pendingLevelUps - 1);
    this.player.recalculateStats();

    if (this.player.pendingLevelUps > 0) {
      modals.showLevelUp(this.player);
    } else {
      modals.close();
      this.state = 'play';
    }
  }

  public exitToMainMenu(): void {
    this.state = 'menu';
    if (this.bossPortal) {
      this.roomGroup.remove(this.bossPortal.mesh);
      this.bossPortal = null;
    }
    this.dynamicGroup.clear();
    this.roomGroup.clear();
    combat.clear();
    telegraphs.clear();
    this.enemies = [];
    this.groundLoots = [];
    this.currentRoom = null;
    this.rooms = [];
    modals.showIntro();
  }
}

export const gameState = new GameState();
