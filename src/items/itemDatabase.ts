// D&D 5e Classic Equipment, Rarities and Procedural Generation
// The Albedo Renegades: Shadow of Elanthria

import type { Item, ItemRarity, ItemSlot, CharacterStats, ClassId, WeaponModelType, HelmModelType, ArmorModelType, RingModelType, RelicModelType, WeaponStyle } from '../types/game.ts';

export const RARITIES: Record<ItemRarity, { name: string; color: string; hex: number; affixCount: number; mult: number }> = {
  common: { name: 'Comune', color: '#b0a8c0', hex: 0xb0a8c0, affixCount: 0, mult: 1.0 },
  uncommon: { name: 'Non comune', color: '#44d98a', hex: 0x44d98a, affixCount: 1, mult: 1.25 },
  rare: { name: 'Raro', color: '#44aaff', hex: 0x44aaff, affixCount: 2, mult: 1.55 },
  epic: { name: 'Molto raro', color: '#b366ff', hex: 0xb366ff, affixCount: 3, mult: 1.9 },
  legendary: { name: 'Leggendario', color: '#ffaa33', hex: 0xffaa33, affixCount: 4, mult: 2.3 }
};

export const STAT_LABELS_IT: Record<keyof CharacterStats, string> = {
  hp: 'Punti Ferita',
  maxHp: 'PV Massimi',
  damage: 'Danno d’Attacco',
  armor: 'Classe Armatura',
  speed: 'Velocità di Movimento',
  attackDelay: 'Intervallo Attacco',
  critChance: 'Prob. Colpo Critico',
  critDamage: 'Danno Critico',
  hpRegen: 'Rigenerazione PV',
  lifesteal: 'Vampirismo / Rubavita',
  cooldownReduction: 'Riduzione Ricarica',
  spellPower: 'Potere Magico',
  luck: 'Fortuna nel Bottino',
  strength: 'Forza',
  dexterity: 'Destrezza',
  constitution: 'Costituzione',
  intelligence: 'Intelligenza',
  wisdom: 'Saggezza'
};

const CLASS_BASE_NAMES: Record<ClassId, Record<ItemSlot, string[]>> = {
  wizard: {
    weapon: [
      'Bastone dell’Arcimago',
      'Bacchetta di Cristallo & Tomo Antico',
      'Verga del Fuoco Arcano',
      'Scettro della Trama di Ealscylf',
      'Bastone delle Tempeste Astrali',
      'Falce Spettrale dell’Oltretomba',
      'Scettro della Luce Arcana',
      'Scettro dei Serpenti dell’Oltretomba',
      'Lama Prismatica di Cristallo'
    ],
    armor: [
      'Veste della Trama di Ealscylf',
      'Tonaca della Meditazione Arcana',
      'Mantello delle Ombre di Vazark',
      'Robe Tessute di Stelle',
      'Paramenti Celestiali della Grazia',
      'Pettorale della Calotta Glaciale',
      'Veste della Fenice Ardente'
    ],
    helm: [
      'Cappello a Punta dell’Arcano',
      'Diadema Astrale di Ealscylf',
      'Cerchietto di Zaffiro Arcano',
      'Corona della Mente Chiara',
      'Corona di Spine dell’Abisso'
    ],
    ring: [
      'Anello Sigillo di Rubino Ardente',
      'Fascia di Zaffiro Astrale',
      'Spirale di Smeraldo dei Boschi',
      'Sigillo della Concentrazione Arcana',
      'Sigillo del Vuoto Cosmico'
    ],
    relic: [
      'Antico Grimorio delle Ombre',
      'Clessidra Celestiale del Tempo',
      'Pietra di Ioun dell’Intelletto',
      'Frammento Cuore di Drago di Vazark',
      'Frammento di Cometa Caduta'
    ]
  },
  fighter: {
    weapon: [
      'Grande Ascia da Battaglia di Azren',
      'Bipenne Gigante del Berserker',
      'Spadone a Due Mani dei Renegades',
      'Spadone di Cristallo dei Titani',
      'Katana d’Acciaio Nero di Ealscylf',
      'Alabarda da Guerra di Okkarn',
      'Falce Pesante dei Mietitori',
      'Doppie Spade di Acciaio Valiriano',
      'Flagello Pesante Chiodato',
      'Maglio Frantuma-Ossa',
      'Balestra da Guerra di Azren'
    ],
    armor: [
      'Corazza a Piastre del Cavaliere',
      'Corazza in Scaglie di Drago Dorato',
      'Armatura di Piastre Pesanti di Azren',
      'Finimento del Gladiatore dell’Arena',
      'Corazza di Gelo Eterno',
      'Cotta di Maglia Rinforzata'
    ],
    helm: [
      'Grande Elmo di Ferro',
      'Elmo Alato delle Valchirie',
      'Elmo Cornuto del Guerriero',
      'Visiera di Ferro del Crociato',
      'Corona di Spine Sanguigne',
      'Maschera Cornuta del Demone',
      'Celata Alata di Okkarn'
    ],
    ring: [
      'Anello del Teschio della Notte',
      'Anello Occhio di Drago di Vazark',
      'Anello Sigillo di Rubino Ardente',
      'Fascia del Berserker di Azren',
      'Spirale di Smeraldo Frantumante'
    ],
    relic: [
      'Cuore di Drago di Vazark',
      'Piuma della Fenice Rinata',
      'Stendardo di Guerra della Milizia',
      'Clessidra Celestiale da Battaglia',
      'Santo Graal dei Guerrieri Caduti'
    ]
  },
  paladin: {
    weapon: [
      'Spada Lunga Benedetta',
      'Spadone Sacro del Giudizio',
      'Spadone di Cristallo della Redenzione',
      'Stocco Benedetto da Duellante',
      'Flagello Divino dell’Alba',
      'Alabarda della Luce Consacrata',
      'Martello Radioso dell’Alba',
      'Ascia Sacra della Giustizia',
      'Spada Radiosa dei Renegades'
    ],
    armor: [
      'Armatura a Piastre Consacrata',
      'Cotta della Fenice Consacrata',
      'Corazza in Scaglie di Drago Dorato',
      'Pettorale della Calotta Glaciale',
      'Paramenti Celestiali della Grazia',
      'Pettorale della Giustizia Divina'
    ],
    helm: [
      'Maschera del Crociato dei Giusti',
      'Elmo Alato delle Valchirie',
      'Elmo del Guardiano Divino',
      'Celata d’Oro dei Renegades',
      'Corona della Luce Divina'
    ],
    ring: [
      'Sigillo della Grazia Divina',
      'Sigillo dello Sguardo Draconico',
      'Anello Sigillo di Rubino Ardente',
      'Fascia di Zaffiro Astrale',
      'Anello della Luce Incorruttibile'
    ],
    relic: [
      'Santo Graal dell’Alba Radiosa',
      'Piuma della Fenice Rinata',
      'Scheggia Astrale di Cometa',
      'Croce Ansata della Luce Eterna',
      'Icona Sacra dell’Alba',
      'Reliquiario della Fede Incrollabile'
    ]
  },
  rogue: {
    weapon: [
      'Doppi Pugnali di Mithral',
      'Daghe Avvelenate della Notte',
      'Katana dell’Ombra Fulminea',
      'Stocco da Duellante dei Renegades',
      'Striscia di Mithral Trafiggente',
      'Falce delle Ombre Furtive',
      'Arco Composito del Predatore',
      'Balestra a Ripetizione di Azren',
      'Balestra Pesante da Assedio',
      'Stiletti Gemelli dell’Ombra'
    ],
    armor: [
      'Giustacuore di Cuoio Borchiato',
      'Finimento del Gladiatore dell’Ombra',
      'Cotta della Fenice Nera',
      'Mantello delle Ombre di Azren',
      'Corazza in Scaglie di Drago Scuro',
      'Veste del Predatore Furtivo'
    ],
    helm: [
      'Cappuccio dell’Assassino',
      'Corona di Spine dell’Assassino',
      'Maschera del Teschio della Notte',
      'Maschera Cornuta del Demone',
      'Cerchietto d’Ombra di Vazark'
    ],
    ring: [
      'Anello del Teschio della Notte',
      'Anello Occhio di Drago di Vazark',
      'Sigillo del Vuoto Cosmico',
      'Spirale di Smeraldo dei Boschi',
      'Anello del Passo Silenzioso',
      'Fascia del Ladro Letale'
    ],
    relic: [
      'Clessidra Celestiale del Tempo',
      'Piuma della Fenice Rinata',
      'Cuore di Drago di Vazark',
      'Fiala del Veleno Primordiale',
      'Antico Grimorio dei Segreti'
    ]
  },
  cleric: {
    weapon: [
      'Mazza Ferrata del Tempio',
      'Mazzafrusto Sacro della Giustizia',
      'Bastone dei Due Serpenti Smeraldini',
      'Grande Bastone delle Tempeste Sacre',
      'Alabarda Benedetta dell’Aurora',
      'Maglio Sacro dei Giusti',
      'Flagello Divino dell’Alba'
    ],
    armor: [
      'Paramenti Celestiali della Grazia',
      'Corazza di Gelo Eterno della Cattedrale',
      'Cotta della Fenice Sacra',
      'Vestimento Consacrato della Trama',
      'Corazza in Scaglie di Drago Dorato',
      'Cotta Benedetta della Fede'
    ],
    helm: [
      'Visiera del Crociato dell’Alba',
      'Diadema Astrale di Ealscylf',
      'Elmo Alato delle Valchirie',
      'Corona del Sacerdote di Guerra',
      'Cerchietto della Grazia Spirituale'
    ],
    ring: [
      'Spirale di Smeraldo dei Boschi',
      'Sigillo del Vuoto Cosmico',
      'Fascia di Zaffiro Astrale',
      'Anello della Preghiera Eterna',
      'Sigillo della Vita Rinnovata'
    ],
    relic: [
      'Santo Graal dell’Alba Radiosa',
      'Frammento di Cometa Caduta',
      'Piuma della Fenice Rinata',
      'Croce Ansata della Luce Eterna',
      'Icona Sacra di Ealscylf',
      'Calice Benedetto delle Anime Salve'
    ]
  }
};

const DND_AFFIX_SUFFIXES: Record<string, string> = {
  damage: 'della Furia Inarrestabile',
  armor: 'del Bastione di Pietra',
  maxHp: 'del Vigore della Quercia',
  speed: 'del Vento Rapido',
  critChance: 'del Cacciatore Letale',
  critDamage: 'della Decapitazione',
  hpRegen: 'della Fenice Rinascente',
  lifesteal: 'del Vampiro dell’Abisso',
  cooldownReduction: 'della Padronanza Rapida',
  spellPower: 'dell’Antica Trama Arcana',
  luck: 'della Fortuna degli Dei'
};

const LEGENDARY_TITLES = [
  'di Khloron Goldenhorn',
  'della Regina Vaeloria',
  'dei Renegades di Okkarn',
  'dell’Antica Elanthria',
  'del Campione Risvegliato'
];

let nextItemId = 1;

export function generateItem(slot: ItemSlot, ilvl: number, rarity: ItemRarity, classId: ClassId = 'paladin'): Item {
  const rar = RARITIES[rarity];
  const classBases = CLASS_BASE_NAMES[classId] || CLASS_BASE_NAMES.paladin;
  const bases = classBases[slot];
  const baseName = bases[Math.floor(Math.random() * bases.length)];
  const stats: Partial<Record<keyof CharacterStats, number>> = {};

  // Base Stats tailored directly to the class archetype!
  if (slot === 'weapon') {
    if (classId === 'wizard') {
      stats.damage = Math.round((3 + ilvl * 1.8) * rar.mult);
      stats.spellPower = Math.round((8 + ilvl * 4) * rar.mult);
      stats.cooldownReduction = Math.min(25, Math.round((4 + ilvl * 1.2) * rar.mult));
    } else if (classId === 'rogue') {
      stats.damage = Math.round((4 + ilvl * 2.0) * rar.mult);
      stats.critChance = Math.round((6 + ilvl * 0.8) * (rar.mult > 1.4 ? 1.3 : 1));
      stats.critDamage = Math.round((14 + ilvl * 3.5) * rar.mult);
    } else if (classId === 'cleric') {
      stats.damage = Math.round((4 + ilvl * 1.9) * rar.mult);
      stats.spellPower = Math.round((6 + ilvl * 3) * rar.mult);
      stats.hpRegen = Math.round((0.5 + ilvl * 0.15) * 10) / 10;
    } else {
      // fighter / paladin
      stats.damage = Math.round((5 + ilvl * 2.5) * rar.mult);
      stats.critChance = Math.round((4 + ilvl * 0.5) * (rar.mult > 1.4 ? 1.3 : 1));
      if (classId === 'paladin') {
        stats.spellPower = Math.round((5 + ilvl * 2) * rar.mult);
      }
    }
  } else if (slot === 'armor') {
    if (classId === 'wizard') {
      stats.armor = Math.round((2 + ilvl * 1.0) * rar.mult);
      stats.maxHp = Math.round((14 + ilvl * 5) * rar.mult);
      stats.spellPower = Math.round((6 + ilvl * 3) * rar.mult);
    } else if (classId === 'rogue') {
      stats.armor = Math.round((3 + ilvl * 1.2) * rar.mult);
      stats.maxHp = Math.round((12 + ilvl * 4.5) * rar.mult);
      stats.speed = Math.round((0.3 + ilvl * 0.08) * 10) / 10;
    } else {
      stats.armor = Math.round((4 + ilvl * 1.8) * rar.mult);
      stats.maxHp = Math.round((16 + ilvl * 6) * rar.mult);
    }
  } else if (slot === 'helm') {
    if (classId === 'wizard') {
      stats.armor = Math.round((1 + ilvl * 0.8) * rar.mult);
      stats.spellPower = Math.round((5 + ilvl * 2.5) * rar.mult);
      stats.cooldownReduction = Math.min(20, Math.round((2 + ilvl * 0.8) * rar.mult));
    } else {
      stats.armor = Math.round((2 + ilvl * 1.1) * rar.mult);
      stats.maxHp = Math.round((8 + ilvl * 3.5) * rar.mult);
    }
  } else if (slot === 'ring') {
    stats.critDamage = Math.round((15 + ilvl * 4) * rar.mult);
    stats.cooldownReduction = Math.min(25, Math.round((3 + ilvl * 1.2) * rar.mult));
    if (classId === 'wizard' || classId === 'cleric') {
      stats.spellPower = Math.round((6 + ilvl * 3) * rar.mult);
    }
  } else if (slot === 'relic') {
    stats.spellPower = Math.round((10 + ilvl * 5) * rar.mult);
    stats.hpRegen = Math.round((0.4 + ilvl * 0.15) * 10) / 10;
    if (classId === 'fighter' || classId === 'rogue') {
      stats.damage = Math.round((3 + ilvl * 1.2) * rar.mult);
    }
  }

  // Bonus Random Affixes filtered by Class suitability!
  const classAffixPool: Record<ClassId, (keyof CharacterStats)[]> = {
    wizard: ['spellPower', 'cooldownReduction', 'maxHp', 'armor', 'critChance', 'speed', 'hpRegen', 'luck'],
    fighter: ['damage', 'armor', 'maxHp', 'critDamage', 'critChance', 'lifesteal', 'speed', 'luck'],
    paladin: ['damage', 'armor', 'maxHp', 'spellPower', 'hpRegen', 'critDamage', 'cooldownReduction', 'luck'],
    rogue: ['critChance', 'critDamage', 'speed', 'lifesteal', 'damage', 'cooldownReduction', 'luck'],
    cleric: ['hpRegen', 'spellPower', 'armor', 'maxHp', 'cooldownReduction', 'damage', 'luck']
  };

  const pool = classAffixPool[classId] || classAffixPool.paladin;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  let mainAffix: string | null = null;

  for (let i = 0; i < rar.affixCount && i < shuffled.length; i++) {
    const affixKey = shuffled[i];
    if (!mainAffix) mainAffix = affixKey;

    let value = 0;
    if (affixKey === 'damage') value = Math.round((2 + ilvl * 1.1) * rar.mult);
    else if (affixKey === 'spellPower') value = Math.round((4 + ilvl * 2.2) * rar.mult);
    else if (affixKey === 'armor') value = Math.round((2 + ilvl * 0.9) * rar.mult);
    else if (affixKey === 'maxHp') value = Math.round((10 + ilvl * 4) * rar.mult);
    else if (affixKey === 'speed') value = Math.round((0.3 + ilvl * 0.08) * 10) / 10;
    else if (affixKey === 'critChance') value = Math.min(25, Math.round((3 + ilvl * 0.8) * rar.mult));
    else if (affixKey === 'critDamage') value = Math.round((12 + ilvl * 3) * rar.mult);
    else if (affixKey === 'hpRegen') value = Math.round((0.3 + ilvl * 0.1) * 10) / 10;
    else if (affixKey === 'lifesteal') value = Math.min(10, Math.round((1.5 + ilvl * 0.3) * 10) / 10);
    else if (affixKey === 'cooldownReduction') value = Math.min(20, Math.round((2 + ilvl * 0.6) * rar.mult));
    else if (affixKey === 'luck') value = Math.round((4 + ilvl * 1.2) * rar.mult);

    stats[affixKey] = (stats[affixKey] || 0) + value;
  }

  let finalName = baseName;
  if (rarity === 'legendary') {
    finalName += ' ' + LEGENDARY_TITLES[Math.floor(Math.random() * LEGENDARY_TITLES.length)];
  } else if (mainAffix && DND_AFFIX_SUFFIXES[mainAffix]) {
    finalName += ' ' + DND_AFFIX_SUFFIXES[mainAffix];
  }

  let modelType: WeaponModelType | undefined;
  let helmType: HelmModelType | undefined;
  let armorType: ArmorModelType | undefined;
  let ringType: RingModelType | undefined;
  let relicType: RelicModelType | undefined;
  let weaponStyle: WeaponStyle | undefined;

  let icon = '📦';
  if (slot === 'weapon') {
    if (finalName.includes('Katana')) {
      modelType = 'katana';
      weaponStyle = 'dual_swords';
      icon = '🗡️';
    } else if (finalName.includes('Stocco') || finalName.includes('Striscia')) {
      modelType = 'rapier';
      weaponStyle = 'sword_shield';
      icon = '🤺';
    } else if (finalName.includes('Cristallo') || finalName.includes('Prismatica')) {
      modelType = 'crystal_greatsword';
      weaponStyle = 'greatsword_2h';
      icon = '💎';
    } else if (finalName.includes('Serpenti')) {
      modelType = 'serpent_staff';
      weaponStyle = 'staff_2h';
      icon = '🐍';
    } else if (finalName.includes('Flagello') || finalName.includes('Mazzafrusto')) {
      modelType = 'flail';
      weaponStyle = 'mace_shield';
      icon = '⛓️';
    } else if (finalName.includes('Falce')) {
      modelType = 'scythe';
      weaponStyle = 'greatsword_2h';
      icon = '🌾';
    } else if (finalName.includes('Alabarda') || finalName.includes('Lancia') || finalName.includes('Falcione')) {
      modelType = 'halberd';
      weaponStyle = 'greatsword_2h';
      icon = '🔱';
    } else if (finalName.includes('Balestra')) {
      modelType = 'crossbow';
      weaponStyle = 'bow';
      icon = '🏹';
    } else if (finalName.includes('Bipenne') || finalName.includes('Grande Ascia')) {
      modelType = 'greataxe';
      weaponStyle = 'greatsword_2h';
      icon = '🪓';
    } else if (finalName.includes('Ascia')) {
      modelType = 'axe';
      weaponStyle = 'sword_shield';
      icon = '🪓';
    } else if (finalName.includes('Doppie Spade')) {
      modelType = 'dual_swords';
      weaponStyle = 'dual_swords';
      icon = '⚔️';
    } else if (finalName.includes('Spadone')) {
      modelType = 'greatsword';
      weaponStyle = 'greatsword_2h';
      icon = '🗡️';
    } else if (finalName.includes('Pugnal') || finalName.includes('Dagh') || finalName.includes('Stilett')) {
      modelType = 'dual_daggers';
      weaponStyle = 'dual_daggers';
      icon = '🗡️';
    } else if (finalName.includes('Arco')) {
      modelType = 'bow';
      weaponStyle = 'bow';
      icon = '🏹';
    } else if (finalName.includes('Bacchetta') || finalName.includes('Tomo')) {
      modelType = 'wand_tome';
      weaponStyle = 'wand_tome';
      icon = '🪄';
    } else if (finalName.includes('Bastone') && (classId === 'cleric' || finalName.includes('Tempeste'))) {
      modelType = 'staff_holy';
      weaponStyle = 'staff_holy';
      icon = '⚡';
    } else if (finalName.includes('Bastone') || finalName.includes('Verga') || finalName.includes('Scettro')) {
      modelType = 'staff';
      weaponStyle = 'staff_2h';
      icon = '🔮';
    } else if (finalName.includes('Maglio') || finalName.includes('Martello')) {
      modelType = 'hammer';
      weaponStyle = 'greatsword_2h';
      icon = '🔨';
    } else if (finalName.includes('Mazza')) {
      modelType = 'mace';
      weaponStyle = 'mace_shield';
      icon = '🔨';
    } else {
      modelType = 'sword';
      weaponStyle = 'sword_shield';
      icon = '⚔️';
    }
  } else if (slot === 'helm') {
    if (finalName.includes('Crociato') || finalName.includes('Visiera')) {
      helmType = 'crusader_visage';
      icon = '⛑️';
    } else if (finalName.includes('Spine')) {
      helmType = 'crown_of_thorns';
      icon = '🥀';
    } else if (finalName.includes('Alato') || finalName.includes('Valchirie')) {
      helmType = 'winged_helm';
      icon = '🪽';
    } else if (finalName.includes('Demone') || finalName.includes('Teschio')) {
      helmType = 'demon_mask';
      icon = '👹';
    } else if (finalName.includes('Diadema') || finalName.includes('Cerchietto')) {
      helmType = 'circlet';
      icon = '✨';
    } else if (finalName.includes('Cappello')) {
      helmType = 'mage_hat';
      icon = '🧙';
    } else if (finalName.includes('Cappuccio') || finalName.includes('Maschera')) {
      helmType = 'assassin_hood';
      icon = '🥷';
    } else if (finalName.includes('Corona')) {
      helmType = 'crown';
      icon = '👑';
    } else if (finalName.includes('Cornuto')) {
      helmType = 'horned_helm';
      icon = '🪖';
    } else {
      helmType = 'knight_helm';
      icon = '🪖';
    }
  } else if (slot === 'armor') {
    if (finalName.includes('Gladiatore') || finalName.includes('Finimento')) {
      armorType = 'gladiator_harness';
      icon = '🥋';
    } else if (finalName.includes('Gelo') || finalName.includes('Glaciale')) {
      armorType = 'frost_cuirass';
      icon = '🧊';
    } else if (finalName.includes('Fenice')) {
      armorType = 'phoenix_mail';
      icon = '🔥';
    } else if (finalName.includes('Scaglie') || finalName.includes('Drago') || finalName.includes('Khloron')) {
      armorType = 'dragon_scale';
      icon = '🐉';
    } else if (finalName.includes('Mantello') || finalName.includes('Ombre')) {
      armorType = 'shadow_mantle';
      icon = '🌑';
    } else if (finalName.includes('Paramenti') || finalName.includes('Celestiali')) {
      armorType = 'celestial_vestment';
      icon = '✨';
    } else if (finalName.includes('Veste') || finalName.includes('Tonaca') || finalName.includes('Robe')) {
      armorType = 'mage_robes';
      icon = '🥋';
    } else if (finalName.includes('Cuoio') || finalName.includes('Garb')) {
      armorType = 'leather_tunic';
      icon = '🦺';
    } else if (finalName.includes('Cotta')) {
      armorType = 'chainmail';
      icon = '🛡️';
    } else {
      armorType = 'heavy_plate';
      icon = '🛡️';
    }
  } else if (slot === 'ring') {
    if (finalName.includes('Occhio di Drago') || finalName.includes('Sguardo Draconico')) {
      ringType = 'dragon_eye_ring';
      icon = '👁️';
    } else if (finalName.includes('Vuoto')) {
      ringType = 'void_seal';
      icon = '🪐';
    } else if (finalName.includes('Rubino') || finalName.includes('Ardente') || finalName.includes('Sangue')) {
      ringType = 'ruby_signet';
      icon = '🔴';
    } else if (finalName.includes('Zaffiro') || finalName.includes('Astrale') || finalName.includes('Mente')) {
      ringType = 'sapphire_band';
      icon = '🔷';
    } else if (finalName.includes('Smeraldo') || finalName.includes('Giada') || finalName.includes('Boschi')) {
      ringType = 'emerald_coil';
      icon = '🟢';
    } else if (finalName.includes('Teschio') || finalName.includes('Notte')) {
      ringType = 'skull_ring';
      icon = '💀';
    } else {
      ringType = 'ruby_signet';
      icon = '💍';
    }
  } else if (slot === 'relic') {
    if (finalName.includes('Piuma')) {
      relicType = 'phoenix_feather';
      icon = '🪶';
    } else if (finalName.includes('Cometa') || finalName.includes('Scheggia Astrale')) {
      relicType = 'comet_shard';
      icon = '☄️';
    } else if (finalName.includes('Graal') || finalName.includes('Calice')) {
      relicType = 'holy_grail';
      icon = '🏆';
    } else if (finalName.includes('Grimorio') || finalName.includes('Tomo')) {
      relicType = 'ancient_grimoire';
      icon = '📖';
    } else if (finalName.includes('Clessidra') || finalName.includes('Tempo')) {
      relicType = 'celestial_hourglass';
      icon = '⏳';
    } else if (finalName.includes('Drago') || finalName.includes('Pietra di Ioun')) {
      relicType = 'dragon_heart_stone';
      icon = '🔮';
    } else if (finalName.includes('Croce') || finalName.includes('Ankh') || finalName.includes('Icona')) {
      relicType = 'sacred_ankh';
      icon = '⚱️';
    } else {
      relicType = 'holy_grail';
      icon = '📜';
    }
  }

  const goldValue = Math.round((12 + ilvl * 8) * rar.mult);

  return {
    id: nextItemId++,
    name: finalName,
    slot,
    rarity,
    ilvl,
    stats,
    icon,
    goldValue,
    isNew: true,
    modelType,
    weaponStyle,
    helmType,
    armorType,
    ringType,
    relicType
  };
}

export function rollRandomRarity(actNumber: number, luckBonus = 0): ItemRarity {
  const roll = Math.random() * 100 - luckBonus;
  if (roll < 1.5 + actNumber * 1.2) return 'legendary';
  if (roll < 8 + actNumber * 3) return 'epic';
  if (roll < 25 + actNumber * 4) return 'rare';
  if (roll < 60) return 'uncommon';
  return 'common';
}
