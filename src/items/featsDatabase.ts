// D&D 5e Feats and Roguelike Talents Database
// The Albedo Renegades: Shadow of Elanthria

import type { FeatUpgrade, ClassId } from '../types/game.ts';

export const DND_FEATS: FeatUpgrade[] = [
  // --- COMMON TALENTS (Fondamenta di Build) ---
  {
    id: 'weapon_training',
    name: 'Affilatura da Guerra',
    dndSource: 'Manuale del Giocatore (D&D 5e)',
    category: 'Combattimento',
    desc: '+3 Danno base e +5% Probabilità di colpo critico.',
    color: '#90a4ae',
    rarity: 'common',
    icon: '⚔️',
    tags: ['Attacco', 'Critico'],
    statBonuses: { damage: 3, critChance: 5 }
  },
  {
    id: 'iron_vitality',
    name: 'Vitalità Ferrea',
    dndSource: 'Manuale del Giocatore (D&D 5e)',
    category: 'Sopravvivenza',
    desc: '+25 Punti Ferita massimi e cura istantanea di 20 PV.',
    color: '#90a4ae',
    rarity: 'common',
    icon: '❤️',
    tags: ['Salute', 'Sopravvivenza'],
    statBonuses: { maxHp: 25, hp: 20 }
  },
  {
    id: 'hardened_armor',
    name: 'Piastre Rinforzate',
    dndSource: 'Manuale del Giocatore (D&D 5e)',
    category: 'Sopravvivenza',
    desc: '+8 Classe Armatura per mitigare i danni fisici nemici.',
    color: '#90a4ae',
    rarity: 'common',
    icon: '🛡️',
    tags: ['Difesa', 'Armatura'],
    statBonuses: { armor: 8 }
  },
  {
    id: 'fleet_foot',
    name: 'Passo Felino',
    dndSource: 'Manuale del Giocatore (D&D 5e)',
    category: 'Speciale',
    desc: '+0.6 Velocità di movimento e -6% Tempo di ricarica abilità.',
    color: '#90a4ae',
    rarity: 'common',
    icon: '👟',
    tags: ['Velocità', 'Mobilità'],
    statBonuses: { speed: 0.6, cooldownReduction: 6 }
  },

  // --- RARE TALENTS (Sinergie & Passivi Dinamici) ---
  {
    id: 'great_weapon_master',
    name: 'Maestro d’Armi Possenti',
    dndSource: 'Manuale del Giocatore (D&D 5e)',
    category: 'Combattimento',
    desc: '+5 Danno d’impatto e +30% Danno da colpo critico.',
    color: '#29b6f6',
    rarity: 'rare',
    icon: '🪓',
    tags: ['Pesante', 'Critico'],
    classRequirement: ['fighter', 'paladin'],
    statBonuses: { damage: 5, critDamage: 30 }
  },
  {
    id: 'sharpshooter',
    name: 'Tiratore Scelto di Shiff',
    dndSource: 'Manuale del Giocatore (D&D 5e)',
    category: 'Combattimento',
    desc: '+4 Danno, +14% Probabilità di colpo critico e ricarica rapida.',
    color: '#29b6f6',
    rarity: 'rare',
    icon: '🎯',
    tags: ['Distanza', 'Precisione'],
    classRequirement: ['rogue'],
    statBonuses: { damage: 4, critChance: 14 }
  },
  {
    id: 'shield_master',
    name: 'Baluardo Inviolabile',
    dndSource: 'Manuale del Giocatore (D&D 5e)',
    category: 'Sopravvivenza',
    desc: '+10 Armatura e +20 Punti Ferita massimi.',
    color: '#29b6f6',
    rarity: 'rare',
    icon: '🛡️',
    tags: ['Difesa', 'Scudo'],
    classRequirement: ['paladin', 'fighter', 'cleric'],
    statBonuses: { armor: 10, maxHp: 20 }
  },
  {
    id: 'blood_drinker',
    name: 'Patto di Sangue di Okkarn',
    dndSource: 'Tomo delle Ombre di Okkarn',
    category: 'Speciale',
    desc: '+4.5% Vampirismo: ogni colpo rigenera salute proporzionalmente al danno.',
    color: '#29b6f6',
    rarity: 'rare',
    icon: '🩸',
    tags: ['Vampirismo', 'Sostegno'],
    classRequirement: ['fighter', 'rogue', 'paladin'],
    statBonuses: { lifesteal: 4.5 }
  },
  {
    id: 'war_caster',
    name: 'Incantatore da Guerra',
    dndSource: 'Manuale del Giocatore (D&D 5e)',
    category: 'Magia',
    desc: '+25 Potere Magico e -15% Tempo di ricarica per tutte le abilità.',
    color: '#29b6f6',
    rarity: 'rare',
    icon: '⚡',
    tags: ['Magia', 'Cooldown'],
    classRequirement: ['wizard', 'cleric', 'paladin'],
    statBonuses: { spellPower: 25, cooldownReduction: 15 }
  },
  {
    id: 'divine_grace',
    name: 'Grazia Divina dell’Alba',
    dndSource: 'Manuale del Giocatore (D&D 5e)',
    category: 'Magia',
    desc: '+1.6 Rigenerazione salute al secondo e +20 PV massimi.',
    color: '#29b6f6',
    rarity: 'rare',
    icon: '✨',
    tags: ['Cura', 'Sacro'],
    classRequirement: ['paladin', 'cleric'],
    statBonuses: { hpRegen: 1.6, maxHp: 20 }
  },
  {
    id: 'lucky',
    name: 'Baciato dalla Sorte',
    dndSource: 'Manuale del Giocatore (D&D 5e)',
    category: 'Speciale',
    desc: '+30% Fortuna nel trovare equipaggiamento raro ed epico e +10% Critico.',
    color: '#29b6f6',
    rarity: 'rare',
    icon: '🍀',
    tags: ['Fortuna', 'Loot'],
    statBonuses: { luck: 30, critChance: 10 }
  },

  // --- EPIC TALENTS (Build-Defining & Abilità Modificanti) ---
  {
    id: 'elemental_adept',
    name: 'Signore del Fuoco e del Gelo',
    dndSource: 'Tasha’s Cauldron of Everything',
    category: 'Magia',
    desc: '+35 Potere Magico, +4 Danno base e gli incantesimi incendiano i nemici.',
    color: '#ab47bc',
    rarity: 'epic',
    icon: '🔥',
    tags: ['Elementale', 'Bruciatura'],
    classRequirement: ['wizard'],
    statBonuses: { spellPower: 35, damage: 4 }
  },
  {
    id: 'elusive_shadow',
    name: 'Danza Spettrale delle Ombre',
    dndSource: 'Tomo dei Renegades',
    category: 'Combattimento',
    desc: '+1.2 Velocità di movimento, +15% Critico e lo scatto ha cooldown dimezzato.',
    color: '#ab47bc',
    rarity: 'epic',
    icon: '💨',
    tags: ['Ombra', 'Agilità'],
    classRequirement: ['rogue'],
    statBonuses: { speed: 1.2, critChance: 15, cooldownReduction: 15 }
  },
  {
    id: 'holy_wrath',
    name: 'Ira dei Sette Templari',
    dndSource: 'Tomo di Elanthria',
    category: 'Maestria',
    desc: '+6 Danno base, +25 PV e la Punizione Divina ricarica il 25% più in fretta.',
    color: '#ab47bc',
    rarity: 'epic',
    icon: '☀️',
    tags: ['Paladino', 'Punizione'],
    classRequirement: ['paladin'],
    statBonuses: { damage: 6, maxHp: 25, cooldownReduction: 12 }
  },
  {
    id: 'berserker_rage',
    name: 'Furor Barbarico Indomito',
    dndSource: 'Manuale del Giocatore (D&D 5e)',
    category: 'Combattimento',
    desc: '+8 Danno d’attacco, +40 PV Massimi e +3% Vampirismo.',
    color: '#ab47bc',
    rarity: 'epic',
    icon: '🩸',
    tags: ['Guerriero', 'Furia'],
    classRequirement: ['fighter'],
    statBonuses: { damage: 8, maxHp: 40, lifesteal: 3.0 }
  },
  {
    id: 'divine_sanctuary',
    name: 'Santuario del Sole Eterno',
    dndSource: 'Tomo dei Santi di Elshiff',
    category: 'Sopravvivenza',
    desc: '+2.8 Rigenerazione vita al secondo, +45 PV massimi e +12 Armatura.',
    color: '#ab47bc',
    rarity: 'epic',
    icon: '🕊️',
    tags: ['Chierico', 'Rigenerazione'],
    classRequirement: ['cleric'],
    statBonuses: { hpRegen: 2.8, maxHp: 45, armor: 12 }
  },
  {
    id: 'tough',
    name: 'Corazza di Titanio di Okkarn',
    dndSource: 'Manuale del Giocatore (D&D 5e)',
    category: 'Sopravvivenza',
    desc: '+60 Punti Ferita massimi, cura completa e +1.5 Rigenerazione PV/s.',
    color: '#ab47bc',
    rarity: 'epic',
    icon: '🏰',
    tags: ['Salute', 'Mitigazione'],
    statBonuses: { maxHp: 60, hp: 60, hpRegen: 1.5, armor: 6 }
  },

  // --- LEGENDARY TALENTS (Poteri Trascendenti dei Campioni) ---
  {
    id: 'archon_ascension',
    name: 'Ascensione dell’Arcimago Arconte',
    dndSource: 'Grimorio Supremo di Elanthria',
    category: 'Maestria',
    desc: '+50 Potere Magico, -25% Ricarica abilità, e i missili magici perforano e bruciano.',
    color: '#ffa726',
    rarity: 'legendary',
    icon: '🔮',
    tags: ['Leggendario', 'Potere Supremo'],
    classRequirement: ['wizard'],
    statBonuses: { spellPower: 50, cooldownReduction: 25, damage: 6 }
  },
  {
    id: 'immortal_colossus',
    name: 'Colosso Imperituro di Okkarn',
    dndSource: 'Reliquiario delle Ere',
    category: 'Maestria',
    desc: '+90 Punti Ferita massimi, +18 Armatura e +6% Vampirismo sui colpi.',
    color: '#ffa726',
    rarity: 'legendary',
    icon: '👑',
    tags: ['Leggendario', 'Immortale'],
    classRequirement: ['fighter', 'paladin'],
    statBonuses: { maxHp: 90, armor: 18, lifesteal: 6.0 }
  },
  {
    id: 'shadow_reaper',
    name: 'Mietitore delle Ombre di Isargard',
    dndSource: 'Tomo Proibito di Vazark',
    category: 'Maestria',
    desc: '+10 Danno, +25% Probabilità Critico e +60% Danno Critico mortale.',
    color: '#ffa726',
    rarity: 'legendary',
    icon: '🗡️',
    tags: ['Leggendario', 'Colpo Mortale'],
    classRequirement: ['rogue'],
    statBonuses: { damage: 10, critChance: 25, critDamage: 60 }
  },
  {
    id: 'avatar_of_radiance',
    name: 'Avatar della Luce Divina',
    dndSource: 'Codice dei Santi dell’Alba',
    category: 'Maestria',
    desc: '+4.0 Rigenerazione vita al secondo, +70 PV e tutte le abilità infliggono +30% danno sacro.',
    color: '#ffa726',
    rarity: 'legendary',
    icon: '☀️',
    tags: ['Leggendario', 'Divino'],
    classRequirement: ['paladin', 'cleric'],
    statBonuses: { hpRegen: 4.0, maxHp: 70, damage: 8, spellPower: 40 }
  }
];

export function getRandomFeatChoices(count = 3, classId?: ClassId): FeatUpgrade[] {
  // Filter feats that match the player's class
  const classPool = DND_FEATS.filter(f => {
    if (!classId || !f.classRequirement) return true;
    return f.classRequirement.includes(classId);
  });

  // Roll rarities with weighted roguelike distribution:
  // Common: 45%, Rare: 35%, Epic: 15%, Legendary: 5%
  const rollRarity = (): 'common' | 'rare' | 'epic' | 'legendary' => {
    const roll = Math.random() * 100;
    if (roll < 5) return 'legendary';
    if (roll < 20) return 'epic';
    if (roll < 55) return 'rare';
    return 'common';
  };

  const selected: FeatUpgrade[] = [];
  const usedIds = new Set<string>();

  for (let i = 0; i < count; i++) {
    const targetRarity = rollRarity();
    // Try to find a matching rarity in the class pool
    let matching = classPool.filter(f => f.rarity === targetRarity && !usedIds.has(f.id));

    // Fallback if none found with target rarity
    if (matching.length === 0) {
      matching = classPool.filter(f => !usedIds.has(f.id));
    }

    if (matching.length > 0) {
      const pick = matching[Math.floor(Math.random() * matching.length)];
      selected.push(pick);
      usedIds.add(pick.id);
    }
  }

  // Fallback if still under count
  if (selected.length < count) {
    const remaining = classPool.filter(f => !usedIds.has(f.id));
    for (const r of remaining) {
      if (selected.length >= count) break;
      selected.push(r);
      usedIds.add(r.id);
    }
  }

  return selected;
}
