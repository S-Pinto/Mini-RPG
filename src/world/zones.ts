// Zones and Lore of the Island of Okkarn
// Based on the DnD campaign 'The Albedo Renegades: Shadow of Elanthria'

import type { ZoneConfig, ZoneId } from '../types/game.ts';

export const ZONES: Record<ZoneId, ZoneConfig> = {
  azren: {
    id: 'azren',
    name: 'Azren · Le Macerie della Milizia',
    subtitle: 'La vecchia città distrutta popolata da orchi e milizie spietate',
    lore: 'Un tempo fiorente capitale commerciale di Okkarn, Azren è ora un dedalo di rovine e case sventrate dove la milizia degli orchi governa con il pugno di ferro. La periferia è un campo di battaglia disseminato di barricate e macerie.',
    actNumber: 1,
    bossName: 'Capitano Grummak il Frantumatore',
    bossType: 'boss_grummak',
    wallColor: 0x54473e,
    floorColorA: '#2c221e',
    floorColorB: '#372a24',
    fogColor: 0x18100e,
    ambientColor: 0xaa8268,
    lightColor: 0xffddaa,
    torchColor: 0xff6b35,
    particleTheme: 'dust',
    enemyPool: ['orc_warrior', 'orc_berserker', 'orc_shaman'],
    eliteEnemy: 'orc_berserker'
  },

  elshiff: {
    id: 'elshiff',
    name: 'Elshiff · La Città Elfica Abbandonata',
    subtitle: 'Antiche guglie di marmo bianco ora infestate da ombre e costrutti corrotti',
    lore: 'Costruita secoli fa dagli elfi alti di Elanthria, Elshiff fu abbandonata dopo la caduta del velo magico. Tra le colonne di marmo e i rampicanti bioluminescenti vagano ora anime perdute e sentinelle meccaniche impazzite.',
    actNumber: 2,
    bossName: 'Regina Spettrale Vaeloria',
    bossType: 'boss_vaeloria',
    wallColor: 0x3d505c,
    floorColorA: '#1c2830',
    floorColorB: '#22323c',
    fogColor: 0x0a141c,
    ambientColor: 0x76a8c4,
    lightColor: 0xa8e8ff,
    torchColor: 0x48e0e4,
    particleTheme: 'fairy',
    enemyPool: ['elven_shadow', 'corrupted_golem', 'spectral_archer'],
    eliteEnemy: 'elven_shadow'
  },

  morgen: {
    id: 'morgen',
    name: 'Foresta di Morgen & Isargard',
    subtitle: 'La foresta tossica e il cuore in rovina di Isargard, dominio dei Troll',
    lore: 'La fitta e velenosa Foresta di Morgen circonda ciò che resta di Isargard, la maestosa città rasa al suolo dal risveglio dell’antico drago. Ora è presidiata da feroci troll e aberrazioni mostruose fedeli alla bestia.',
    actNumber: 3,
    bossName: 'Vorrash, Signore dei Troll',
    bossType: 'boss_troll_warlord',
    wallColor: 0x2b4231,
    floorColorA: '#1a291f',
    floorColorB: '#213327',
    fogColor: 0x0a160e,
    ambientColor: 0x70b884,
    lightColor: 0xb5ffb8,
    torchColor: 0x88ff44,
    particleTheme: 'spores',
    enemyPool: ['marsh_troll', 'dire_beast', 'spore_spitter'],
    eliteEnemy: 'marsh_troll'
  },

  vazark: {
    id: 'vazark',
    name: 'Grotte di Vazark · La Tana del Drago',
    subtitle: 'Caverne vulcaniche sature di magma, koboldi fanatici e il drago antico',
    lore: 'Nelle viscere della Montagna Vazark arde il fuoco primordiale. Tribù di koboldi verdi devoti al drago hanno eretto templi di teschi e oro grezzo per venerare il loro sovrano alato: l’Antico Drago Vermithrax.',
    actNumber: 4,
    bossName: 'Vermithrax, Terrore di Elanthria',
    bossType: 'boss_dragon_vermithrax',
    wallColor: 0x5a2822,
    floorColorA: '#281210',
    floorColorB: '#361814',
    fogColor: 0x140504,
    ambientColor: 0xc46045,
    lightColor: 0xffaa66,
    torchColor: 0xff4422,
    particleTheme: 'embers',
    enemyPool: ['kobold_spearman', 'kobold_bomber', 'dragon_shaman'],
    eliteEnemy: 'dragon_shaman'
  }
};

export const ZONE_ORDER: ZoneId[] = ['azren', 'elshiff', 'morgen', 'vazark'];
