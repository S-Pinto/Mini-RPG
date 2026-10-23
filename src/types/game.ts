// Types and interfaces for The Albedo Renegades: Shadow of Elanthria

export type ClassId = 'paladin' | 'wizard' | 'fighter' | 'rogue' | 'cleric';

export type WeaponStyle = 
  | 'staff_2h' 
  | 'wand_tome' 
  | 'mace_shield' 
  | 'staff_holy' 
  | 'dual_daggers' 
  | 'bow' 
  | 'dual_swords' 
  | 'greatsword_2h' 
  | 'sword_shield';

export interface SubclassSkill2 {
  id: string;
  name: string;
  cd: number;
  desc: string;
  damageMultiplier: number;
  icon: string;
}

export interface SubclassConfig {
  id: string;
  name: string;
  desc: string;
  weaponStyle: WeaponStyle;
  weaponName: string;
  skill2: SubclassSkill2;
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
  weaponType: WeaponStyle;
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
  skill2: SubclassSkill2;
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

export type WeaponModelType = 
  | 'axe' 
  | 'greataxe' 
  | 'sword' 
  | 'greatsword' 
  | 'dual_swords' 
  | 'dual_daggers' 
  | 'bow' 
  | 'staff' 
  | 'staff_holy' 
  | 'wand_tome' 
  | 'mace' 
  | 'hammer';

export type HelmModelType = 'knight_helm' | 'mage_hat' | 'assassin_hood' | 'crown' | 'horned_helm';
export type ArmorModelType = 'heavy_plate' | 'leather_tunic' | 'mage_robes' | 'chainmail';

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
  weaponStyle?: WeaponStyle;
  modelType?: WeaponModelType;
  helmType?: HelmModelType;
  armorType?: ArmorModelType;
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

export type EliteAffix = 'vampiric' | 'swift' | 'toxic_aura' | 'shielded';

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
  affix?: EliteAffix;
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

export type FeatRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface FeatUpgrade {
  id: string;
  name: string;
  dndSource: string;
  category: 'Combattimento' | 'Magia' | 'Sopravvivenza' | 'Speciale' | 'Maestria';
  desc: string;
  color: string;
  rarity?: FeatRarity;
  icon?: string;
  tags?: string[];
  classRequirement?: ClassId[];
  statBonuses?: Partial<CharacterStats>;
  specialFlag?: string;
}

export type RoomType = 'start' | 'normal' | 'treasure' | 'shrine' | 'boss' | 'checkpoint' | 'shop' | 'pact';

export type SkillAugmentEffect = 
  | 'orbit' 
  | 'bounce' 
  | 'aoe' 
  | 'duration' 
  | 'charges' 
  | 'chain' 
  | 'heal' 
  | 'projectiles' 
  | 'lingering' 
  | 'crit_boost' 
  | 'shield';

export interface SkillAugment {
  id: string;
  name: string;
  skillTarget: 'skill1' | 'skill2';
  classId: ClassId;
  subclassId?: string;
  icon: string;
  category: string;
  desc: string;
  effectType: SkillAugmentEffect;
  value: number;
}

export interface DestructibleProp {
  id: number;
  x: number;
  y: number;
  type: 'barrel' | 'pot' | 'chest' | 'shrine' | 'table' | 'chair' | 'crate' | 'teleport_pad' | 'shop_counter' | 'skill_crucible' | 'explosive_barrel' | 'toxic_barrel' | 'spike_trap' | 'cage' | 'pact_altar' | 'sarcophagus' | 'weapon_rack' | 'campfire' | 'fire_jet';
  hp: number;
  mesh?: any;
  opened?: boolean;
  shrineUsed?: boolean;
  shrineType?: 'blood' | 'radiance' | 'fortune';
  trapTimer?: number;
  trapActive?: boolean;
  cageFreed?: boolean;
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

// --- Status Effects ---
export type StatusEffectType = 'burn' | 'freeze' | 'shock' | 'poison';

export interface StatusEffect {
  type: StatusEffectType;
  duration: number;
  tickTimer?: number;
  damagePerTick?: number;
  slowFactor?: number;
}

// --- Meta Progression (Sanctum) ---
export interface MetaUpgradeDef {
  id: string;
  name: string;
  desc: string;
  icon: string;
  maxRank: number;
  maxLevel?: number;
  perLevelDesc?: (rank: number) => string;
  costs: number[]; // cost in astral essence per rank
}

export interface MetaProgressionData {
  astralEssence: number;
  upgrades: Record<string, number>; // id -> current rank
  totalRuns: number;
  totalKills: number;
  bossesDefeated: number;
}

// --- Dark Pacts (Risk/Reward) ---
export interface DarkPact {
  id: string;
  name: string;
  icon: string;
  flavor?: string;
  curseTitle: string;
  curseDesc: string;
  boonTitle: string;
  boonDesc: string;
}

// --- Allies ---
export type AllyType = 'archer_lyanna' | 'cleric_elidor';

export interface AllyConfig {
  type: AllyType;
  name: string;
  title: string;
  icon: string;
  color: number;
  hp: number;
  maxHp: number;
  damage: number;
}

