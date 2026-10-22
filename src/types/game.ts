// Types and interfaces for The Albedo Renegades: Shadow of Elanthria

export type ClassId = 'paladin' | 'wizard' | 'fighter' | 'rogue' | 'cleric';

export interface SubclassConfig {
  id: string;
  name: string;
  desc: string;
  bonusDesc: string;
  statBonus: Partial<CharacterStats>;
  passiveEffect: string;
}

export interface CharacterClassConfig {
  id: ClassId;
  name: string;
  dndTitle: string;
  role: string;
  description: string;
  color: string;
  lightColor: number;
  subclasses: SubclassConfig[];
  baseStats: CharacterStats;
  weaponType: 'sword_shield' | 'staff' | 'greatsword' | 'daggers' | 'mace_shield';
  basicAttackName: string;
  basicAttackDesc: string;
  skill1: {
    id: string;
    name: string;
    cd: number;
    desc: string;
    damageMultiplier: number;
    icon: string;
  };
  skill2: {
    id: string;
    name: string;
    cd: number;
    desc: string;
    damageMultiplier: number;
    icon: string;
  };
}

export interface CharacterStats {
  hp: number;
  maxHp: number;
  armor: number; // Flat damage reduction calculation
  speed: number;
  damage: number;
  attackDelay: number;
  critChance: number; // In %
  critDamage: number; // In % (e.g. 150 = 1.5x)
  spellPower: number; // In % multiplier
  lifesteal: number;  // In %
  hpRegen: number;    // HP per second
  cooldownReduction: number; // In % (max 50%)
  luck: number;       // % boost to rare loot
  // Attributes (D&D 5e)
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
}

export type ItemSlot = 'weapon' | 'armor' | 'helm' | 'ring' | 'relic';
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface Item {
  id: number;
  name: string;
  slot: ItemSlot;
  rarity: ItemRarity;
  ilvl: number;
  stats: Partial<Record<keyof CharacterStats, number>>;
  specialEffect?: string;
  icon: string;
  goldValue: number;
  isNew?: boolean;
}

export type EnemyType = 
  // Azren
  | 'orc_warrior' | 'orc_berserker' | 'orc_shaman' | 'boss_grummak'
  // Elshiff
  | 'elven_shadow' | 'corrupted_golem' | 'spectral_archer' | 'boss_vaeloria'
  // Morgen & Isargard
  | 'marsh_troll' | 'dire_beast' | 'spore_spitter' | 'boss_troll_warlord'
  // Vazark Caverns
  | 'kobold_spearman' | 'kobold_bomber' | 'dragon_shaman' | 'boss_dragon_vermithrax';

export interface EnemyStats {
  name: string;
  hp: number;
  maxHp: number;
  damage: number;
  speed: number;
  radius: number;
  xpReward: number;
  isBoss?: boolean;
  isElite?: boolean;
  color: number;
  attackRange: number;
  attackCooldown: number;
  attackType: 'melee' | 'projectile' | 'charge' | 'aoe' | 'dragon_breath' | 'meteor_storm';
}

export type ZoneId = 'azren' | 'elshiff' | 'morgen' | 'vazark';

export interface ZoneConfig {
  id: ZoneId;
  name: string;
  subtitle: string;
  lore: string;
  actNumber: number;
  bossName: string;
  bossType: EnemyType;
  wallColor: number;
  floorColorA: string;
  floorColorB: string;
  fogColor: number;
  ambientColor: number;
  lightColor: number;
  torchColor: number;
  particleTheme: 'dust' | 'fairy' | 'spores' | 'embers';
  enemyPool: EnemyType[];
  eliteEnemy: EnemyType;
}

export interface FeatUpgrade {
  id: string;
  name: string;
  dndSource: string;
  category: 'Combattimento' | 'Magia' | 'Sopravvivenza' | 'Speciale';
  desc: string;
  color: string;
  classRequirement?: ClassId[];
  statBonuses?: Partial<CharacterStats>;
  specialFlag?: string;
}

export interface DestructibleProp {
  id: number;
  x: number;
  y: number;
  type: 'barrel' | 'pot' | 'chest' | 'shrine' | 'table' | 'chair' | 'crate';
  hp: number;
  opened?: boolean;
  shrineUsed?: boolean;
  shrineType?: 'blood' | 'radiance' | 'fortune';
}

export interface GroundTelegraph {
  id: number;
  x: number;
  y: number;
  radius: number;
  angle?: number;
  spread?: number; // for cone
  type: 'circle' | 'cone' | 'line';
  duration: number;
  timeElapsed: number;
  color: number;
  onExecute: () => void;
}
