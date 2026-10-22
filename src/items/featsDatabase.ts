// D&D 5e Feats and Talents for Roguelike Level-Up Progression
// The Albedo Renegades: Shadow of Elanthria

import type { FeatUpgrade, ClassId } from '../types/game.ts';

export const DND_FEATS: FeatUpgrade[] = [
  {
    id: 'great_weapon_master',
    name: 'Maestro d’Armi Possenti',
    dndSource: 'Manuale del Giocatore (D&D 5e)',
    category: 'Combattimento',
    desc: '+25% Danno con armi pesanti e i colpi critici scatenano un’onda d’urto devastante.',
    color: '#e65c5c',
    classRequirement: ['fighter', 'paladin'],
    statBonuses: { damage: 5, critDamage: 25 }
  },
  {
    id: 'heavy_armor_master',
    name: 'Maestro delle Corazze Pesanti',
    dndSource: 'Manuale del Giocatore (D&D 5e)',
    category: 'Sopravvivenza',
    desc: '+12 Classe Armatura e riduce tutti i danni fisici subiti del 15%.',
    color: '#a0aab8',
    classRequirement: ['fighter', 'paladin'],
    statBonuses: { armor: 12, maxHp: 20 }
  },
  {
    id: 'shield_master',
    name: 'Maestro degli Scudi',
    dndSource: 'Manuale del Giocatore (D&D 5e)',
    category: 'Sopravvivenza',
    desc: '+8 Armatura e +20% Resistenza ai danni di area.',
    color: '#b0a8c0',
    classRequirement: ['paladin', 'fighter', 'cleric'],
    statBonuses: { armor: 8, maxHp: 15 }
  },
  {
    id: 'sharpshooter',
    name: 'Tiratore Scelto',
    dndSource: 'Manuale del Giocatore (D&D 5e)',
    category: 'Combattimento',
    desc: '+20% Danno a distanza e i colpi hanno +12% probabilità di colpo critico.',
    color: '#44d98a',
    classRequirement: ['rogue'],
    statBonuses: { damage: 4, critChance: 12 }
  },
  {
    id: 'elusive_shadow',
    name: 'Ombra Elusiva',
    dndSource: 'Tomo dei Renegades',
    category: 'Combattimento',
    desc: '+18% Velocità di movimento, +10% Critico e lo scatto ricarica il 30% più in fretta.',
    color: '#38e0a0',
    classRequirement: ['rogue'],
    statBonuses: { speed: 1.0, critChance: 10, cooldownReduction: 12 }
  },
  {
    id: 'war_caster',
    name: 'Incantatore da Guerra',
    dndSource: 'Manuale del Giocatore (D&D 5e)',
    category: 'Magia',
    desc: '+30% Potere degli Incantesimi e -15% Ricarica di tutte le abilità.',
    color: '#66a3ff',
    classRequirement: ['wizard', 'cleric', 'paladin'],
    statBonuses: { spellPower: 30, cooldownReduction: 15 }
  },
  {
    id: 'elemental_adept',
    name: 'Iniziato agli Elementi',
    dndSource: 'Manuale del Giocatore (D&D 5e)',
    category: 'Magia',
    desc: 'Tutti gli incantesimi bruciano e folgorano i nemici con onde ad area addizionali.',
    color: '#ff66aa',
    classRequirement: ['wizard'],
    statBonuses: { spellPower: 25, damage: 3 }
  },
  {
    id: 'metamagic_adept',
    name: 'Adepto Metamagico',
    dndSource: 'Tasha’s Cauldron of Everything',
    category: 'Magia',
    desc: '-20% Ricarica di tutte le abilità magiche e raggio d’impatto degli incantesimi +30%.',
    color: '#a866ff',
    classRequirement: ['wizard'],
    statBonuses: { cooldownReduction: 20, spellPower: 15 }
  },
  {
    id: 'arcane_ward',
    name: 'Barriera Arcana Protettiva',
    dndSource: 'Manuale del Giocatore (D&D 5e)',
    category: 'Sopravvivenza',
    desc: '+35 PV Massimi e +6 Armatura mistica contro gli attacchi nemici.',
    color: '#44ccee',
    classRequirement: ['wizard'],
    statBonuses: { maxHp: 35, armor: 6 }
  },
  {
    id: 'divine_grace',
    name: 'Grazia Divina dell’Alba',
    dndSource: 'Manuale del Giocatore (D&D 5e)',
    category: 'Magia',
    desc: '+1.5 Rigenerazione PV al secondo e +20 Potere Sacro per cure e punizioni.',
    color: '#ffd700',
    classRequirement: ['paladin', 'cleric'],
    statBonuses: { hpRegen: 1.5, spellPower: 20, maxHp: 20 }
  },
  {
    id: 'divine_restoration',
    name: 'Restaurazione Divina',
    dndSource: 'Tomo dei Santi di Elshiff',
    category: 'Sopravvivenza',
    desc: '+2.0 Rigenerazione vita al secondo e +35 Punti Ferita massimi.',
    color: '#e0c0ff',
    classRequirement: ['cleric'],
    statBonuses: { hpRegen: 2.0, maxHp: 35 }
  },
  {
    id: 'tough',
    name: 'Robusto',
    dndSource: 'Manuale del Giocatore (D&D 5e)',
    category: 'Sopravvivenza',
    desc: '+45 Punti Ferita massimi e +1.0 Rigenerazione vita al secondo.',
    color: '#ffaa44',
    statBonuses: { maxHp: 45, hp: 45, hpRegen: 1.0 }
  },
  {
    id: 'alert',
    name: 'Allerta Istintiva',
    dndSource: 'Manuale del Giocatore (D&D 5e)',
    category: 'Speciale',
    desc: '+12% Velocità di movimento e +10% Probabilità di colpo critico.',
    color: '#44e6cc',
    statBonuses: { speed: 0.7, critChance: 10 }
  },
  {
    id: 'lucky',
    name: 'Fortunato degli Dei',
    dndSource: 'Manuale del Giocatore (D&D 5e)',
    category: 'Speciale',
    desc: '+25% Fortuna (loot migliore da forzieri e boss) e +25% Oro guadagnato.',
    color: '#ffd700',
    statBonuses: { luck: 25 }
  },
  {
    id: 'mobile',
    name: 'Rapido e Letale',
    dndSource: 'Manuale del Giocatore (D&D 5e)',
    category: 'Sopravvivenza',
    desc: '+15% Velocità di movimento e ricarica dello scatto ridotta del 25%.',
    color: '#55e677',
    statBonuses: { speed: 0.9, cooldownReduction: 8 }
  },
  {
    id: 'blood_drinker',
    name: 'Patto di Sangue di Okkarn',
    dndSource: 'Tomo delle Ombre di Okkarn',
    category: 'Speciale',
    desc: '+4.5% Vampirismo: rigenera vita proporzionalmente ai danni inflitti.',
    color: '#e62e49',
    classRequirement: ['fighter', 'rogue', 'paladin'],
    statBonuses: { lifesteal: 4.5 }
  }
];

export function getRandomFeatChoices(count = 3, classId?: ClassId): FeatUpgrade[] {
  // Filter feats that match the player's class
  const pool = DND_FEATS.filter(f => {
    if (!classId || !f.classRequirement) return true;
    return f.classRequirement.includes(classId);
  });

  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
