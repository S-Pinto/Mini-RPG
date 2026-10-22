// D&D 5e Classes, Subclasses and Skills
// The Albedo Renegades: Shadow of Elanthria

import type { CharacterClassConfig, ClassId } from './game.ts';

export const CLASSES_DATA: Record<ClassId, CharacterClassConfig> = {
  paladin: {
    id: 'paladin',
    name: 'Paladino',
    dndTitle: 'Campione della Luce Sacra',
    role: 'Mischia Pesante · Armatura e Radiosità',
    description: 'Guerriero consacrato a un solenne giuramento. Protetto da pesanti piastre, canalizza la potenza divina per annientare il male.',
    color: '#ffcc44',
    lightColor: 0xffe680,
    weaponType: 'sword_shield',
    baseStats: {
      hp: 140,
      maxHp: 140,
      armor: 14,
      speed: 5.6,
      damage: 12,
      attackDelay: 0.52,
      critChance: 8,
      critDamage: 160,
      spellPower: 100,
      lifesteal: 0,
      hpRegen: 0.5,
      cooldownReduction: 0,
      luck: 5,
      strength: 16,
      dexterity: 10,
      constitution: 15,
      intelligence: 8,
      wisdom: 14
    },
    basicAttackName: 'Fendente Radioso',
    basicAttackDesc: 'Colpisce in un arco frontale respingendo i nemici e infliggendo danni sacri.',
    skill1: {
      id: 'smite',
      name: 'Punizione Divina (Smite)',
      cd: 5.5,
      desc: 'Canalizza l’energia sacra nell’arma scatenando un boato radioso ad area con forte knockback.',
      damageMultiplier: 2.8,
      icon: '⚔️'
    },
    skill2: {
      id: 'holy_dash',
      name: 'Carica dello Scudo',
      cd: 3.5,
      desc: 'Scatto travolgente con scudo sacro che sbalza i mostri infliggendo danni radiosi.',
      damageMultiplier: 1.6,
      icon: '🛡️'
    },
    subclasses: [
      {
        id: 'devotion',
        name: 'Giuramento di Devozione',
        desc: 'Spada a una mano e scudo sacro con poteri di protezione e carica.',
        weaponStyle: 'sword_shield',
        weaponName: 'Spada Consacrata & Scudo a Croce',
        skill2: {
          id: 'holy_dash',
          name: 'Carica con Scudo Sacro',
          cd: 3.5,
          desc: 'Scatto prorompente con scudo sacro che sbalza i nemici infliggendo danni radiosi e stordimento.',
          damageMultiplier: 1.6,
          icon: '🛡️'
        },
        bonusDesc: '+25 Vita Massima, +4 Armatura e rigenerazione passiva.',
        statBonus: { hp: 25, maxHp: 25, armor: 4, hpRegen: 0.8 },
        passiveEffect: 'Aura di Purezza: rigenera 0.8 PV al secondo costantemente.'
      },
      {
        id: 'vengeance',
        name: 'Giuramento di Vendetta',
        desc: 'Spadone a due mani votato all’annientamento implacabile del male.',
        weaponStyle: 'greatsword_2h',
        weaponName: 'Spadone del Giudizio a Due Mani',
        skill2: {
          id: 'vengeance_slam',
          name: 'Fendente del Castigo',
          cd: 4.5,
          desc: 'Imponente fendente verticale a due mani che squarcia il terreno con un raggio radioso devastante.',
          damageMultiplier: 3.2,
          icon: '⚔️'
        },
        bonusDesc: '+15% Danno e +10% Probabilità di Colpo Critico.',
        statBonus: { damage: 4, critChance: 10, critDamage: 30 },
        passiveEffect: 'Inquisizione Spietata: i colpi critici scatenano un’esplosione radiosa.'
      }
    ]
  },

  wizard: {
    id: 'wizard',
    name: 'Mago',
    dndTitle: 'Maestro dell’Arcano',
    role: 'Distanza · Danno Magico Devastante',
    description: 'Studioso delle forze cosmiche e della manipolazione della trama. Annienta gruppi di nemici con potenti incantesimi.',
    color: '#66a3ff',
    lightColor: 0x80bfff,
    weaponType: 'staff_2h',
    baseStats: {
      hp: 90,
      maxHp: 90,
      armor: 4,
      speed: 6.2,
      damage: 10,
      attackDelay: 0.44,
      critChance: 10,
      critDamage: 150,
      spellPower: 125,
      lifesteal: 0,
      hpRegen: 0.2,
      cooldownReduction: 8,
      luck: 10,
      strength: 8,
      dexterity: 13,
      constitution: 11,
      intelligence: 18,
      wisdom: 12
    },
    basicAttackName: 'Dardi Arcani',
    basicAttackDesc: 'Lancia raffiche di dardi magici ad alta velocità che perforano le linee nemiche.',
    skill1: {
      id: 'fireball',
      name: 'Palla di Fuoco (Fireball)',
      cd: 6.0,
      desc: 'Evoca una massiccia sfera infuocata che esplode all’impatto bruciando i nemici nel tempo.',
      damageMultiplier: 3.2,
      icon: '🔥'
    },
    skill2: {
      id: 'misty_step',
      name: 'Passo Velato & Bufera',
      cd: 4.0,
      desc: 'Teletrasporto istantaneo con fumo arcano che congela i nemici vicini.',
      damageMultiplier: 1.2,
      icon: '❄️'
    },
    subclasses: [
      {
        id: 'evocation',
        name: 'Scuola di Evocazione',
        desc: 'Grande bastone a due mani ed esplosioni elementali devastanti.',
        weaponStyle: 'staff_2h',
        weaponName: 'Bastone Arcano a Due Mani',
        skill2: {
          id: 'misty_step',
          name: 'Passo Velato & Bufera',
          cd: 4.0,
          desc: 'Teletrasporto immediato lasciando una violenta bufera che rallenta e danneggia tutti i nemici.',
          damageMultiplier: 1.5,
          icon: '❄️'
        },
        bonusDesc: '+25% Danno Magico e +20% Raggio delle esplosioni.',
        statBonus: { spellPower: 150, damage: 3 },
        passiveEffect: 'Manipolazione dell’Intensità: le esplosioni ignorano il 30% della resistenza nemica.'
      },
      {
        id: 'abjuration',
        name: 'Scuola della Trama',
        desc: 'Bacchetta di cristallo e tomo antico dei misteri arcani.',
        weaponStyle: 'wand_tome',
        weaponName: 'Bacchetta di Cristallo & Tomo Antico',
        skill2: {
          id: 'arcane_singularity',
          name: 'Singolarità Arcana',
          cd: 4.8,
          desc: 'Apre il tomo creando un vortice gravitazionale oscuro che risucchia e disintegra i mostri vicini.',
          damageMultiplier: 2.9,
          icon: '📖'
        },
        bonusDesc: '+30 Vita Massima, +8 Armatura e potere gravitazionale.',
        statBonus: { hp: 30, maxHp: 30, armor: 8, cooldownReduction: 6 },
        passiveEffect: 'Egida Arcana: assorbe periodicamente il primo colpo nemico subito.'
      }
    ]
  },

  fighter: {
    id: 'fighter',
    name: 'Guerriero',
    dndTitle: 'Veterano delle Guerre di Isargard',
    role: 'Mischia Violenta · Resistente e Travolgente',
    description: 'Esperto supremo di tattiche marziali, in grado di combattere a doppie armi o con colossali armi a due mani.',
    color: '#e65c5c',
    lightColor: 0xff8080,
    weaponType: 'dual_swords',
    baseStats: {
      hp: 150,
      maxHp: 150,
      armor: 12,
      speed: 6.0,
      damage: 14,
      attackDelay: 0.50,
      critChance: 12,
      critDamage: 175,
      spellPower: 90,
      lifesteal: 0,
      hpRegen: 0.4,
      cooldownReduction: 0,
      luck: 4,
      strength: 18,
      dexterity: 12,
      constitution: 16,
      intelligence: 9,
      wisdom: 10
    },
    basicAttackName: 'Fendente Marziale',
    basicAttackDesc: 'Un pesante colpo ad arco che trapassa più nemici adiacenti.',
    skill1: {
      id: 'whirlwind',
      name: 'Vortice d’Acciaio (Action Surge)',
      cd: 5.0,
      desc: 'Ruota a 360° colpendo ripetutamente tutti i mostri nel raggio.',
      damageMultiplier: 2.6,
      icon: '🌪️'
    },
    skill2: {
      id: 'flurry_rush',
      name: 'Danza delle Lame',
      cd: 3.8,
      desc: 'Scatto con doppie lame che lacera tutti i nemici infliggendo sanguinamento.',
      damageMultiplier: 2.4,
      icon: '⚔️'
    },
    subclasses: [
      {
        id: 'champion',
        name: 'Berserker Lame Gemelle',
        desc: 'Combatte impugnando due spade affilate con velocità letale.',
        weaponStyle: 'dual_swords',
        weaponName: 'Doppie Spade di Azren',
        skill2: {
          id: 'flurry_rush',
          name: 'Danza delle Lame',
          cd: 3.8,
          desc: 'Scatto rotante a doppie spade che trapassa i nemici infliggendo colpi multipli e sanguinamento.',
          damageMultiplier: 2.6,
          icon: '⚔️'
        },
        bonusDesc: '+12% Probabilità Critico e +40% Danno Critico.',
        statBonus: { critChance: 12, critDamage: 40 },
        passiveEffect: 'Critico Migliorato: i critici ripristinano 4 PV istantanei.'
      },
      {
        id: 'battle_master',
        name: 'Colosso dello Spadone',
        desc: 'Padroneggia colossali armi a due mani per abbattere schiere intere.',
        weaponStyle: 'greatsword_2h',
        weaponName: 'Spadone Massiccio a Due Mani',
        skill2: {
          id: 'seismic_slam',
          name: 'Schiacciata Sismica',
          cd: 5.5,
          desc: 'Balzo possente che frantuma il terreno all’impatto con onde d’urto sismiche e stordimento.',
          damageMultiplier: 3.5,
          icon: '💥'
        },
        bonusDesc: '+15% Velocità di Attacco e +30% Forza d’Urto.',
        statBonus: { attackDelay: -0.08, speed: 0.5, armor: 3 },
        passiveEffect: 'Fendente Travolgente: ogni colpo rallenta i nemici del 40% per 2 secondi.'
      }
    ]
  },

  rogue: {
    id: 'rogue',
    name: 'Ladro',
    dndTitle: 'Ombra di Azren',
    role: 'Agilità Estrema · Lame Furtive e Critici',
    description: 'Cresciuto nei bassifondi devastati di Azren. Maestro dei doppi pugnali e del tiro con l’arco mortale.',
    color: '#44d98a',
    lightColor: 0x80ffb3,
    weaponType: 'dual_daggers',
    baseStats: {
      hp: 100,
      maxHp: 100,
      armor: 6,
      speed: 7.2,
      damage: 8,
      attackDelay: 0.26,
      critChance: 22,
      critDamage: 190,
      spellPower: 100,
      lifesteal: 2,
      hpRegen: 0.2,
      cooldownReduction: 10,
      luck: 15,
      strength: 10,
      dexterity: 18,
      constitution: 12,
      intelligence: 13,
      wisdom: 11
    },
    basicAttackName: 'Colpo Rapido',
    basicAttackDesc: 'Raffica rapidissima di colpi perforanti a velocità fulminea.',
    skill1: {
      id: 'sneak_attack',
      name: 'Attacco Furtivo (Sneak Attack)',
      cd: 4.5,
      desc: 'Lancia un ventaglio di lame oscure che trapassano i bersagli con colpi critici assicurati.',
      damageMultiplier: 2.2,
      icon: '🗡️'
    },
    skill2: {
      id: 'shadow_roll',
      name: 'Passo d’Ombra & Ventaglio',
      cd: 2.5,
      desc: 'Capriola acrobatica fulminea con totale invulnerabilità temporanea.',
      damageMultiplier: 0.6,
      icon: '💨'
    },
    subclasses: [
      {
        id: 'assassin',
        name: 'Assassino dei Vicoli',
        desc: 'Doppi pugnali avvelenati e letali agguati dall’ombra.',
        weaponStyle: 'dual_daggers',
        weaponName: 'Doppi Pugnali Furtivi',
        skill2: {
          id: 'shadow_roll',
          name: 'Passo d’Ombra & Ventaglio',
          cd: 2.5,
          desc: 'Capriola acrobatica invulnerabile che lancia un ventaglio di 8 pugnali oscuri perforanti.',
          damageMultiplier: 2.0,
          icon: '🗡️'
        },
        bonusDesc: '+10% Velocità di movimento, +15% Critico e +60% Danno Critico.',
        statBonus: { critChance: 15, critDamage: 60, speed: 0.6 },
        passiveEffect: 'Colpo Mortale: infligge doppio danno a nemici con oltre 80% PV.'
      },
      {
        id: 'arcane_trickster',
        name: 'Cacciatore Silvano',
        desc: 'Armato di arco lungo e frecce per abbattere i nemici a lungo raggio.',
        weaponStyle: 'bow',
        weaponName: 'Arco Composito & Frecce',
        skill2: {
          id: 'arrow_rain',
          name: 'Pioggia di Frecce',
          cd: 4.5,
          desc: 'Scocca una raffica di frecce a parabola che si abbattono ad area crivellando i bersagli.',
          damageMultiplier: 3.2,
          icon: '🏹'
        },
        bonusDesc: '+2 Frecce extra per attacco e +15% Ricarica Abilità.',
        statBonus: { cooldownReduction: 15, luck: 10 },
        passiveEffect: 'Frecce Gemelle: ogni freccia ha probabilità di rimbalzare su un bersaglio vicino.'
      }
    ]
  },

  cleric: {
    id: 'cleric',
    name: 'Chierico',
    dndTitle: 'Sacerdote della Tempesta e della Vita',
    role: 'Supporto Tattico · Mazza, Fulmini e Risanamento',
    description: 'Invocatore del favore degli dèi celesti, maestro di mazza e scudo o del grande bastone tonante.',
    color: '#d488ff',
    lightColor: 0xe6b3ff,
    weaponType: 'mace_shield',
    baseStats: {
      hp: 130,
      maxHp: 130,
      armor: 11,
      speed: 5.8,
      damage: 11,
      attackDelay: 0.48,
      critChance: 9,
      critDamage: 155,
      spellPower: 115,
      lifesteal: 0,
      hpRegen: 0.8,
      cooldownReduction: 5,
      luck: 8,
      strength: 14,
      dexterity: 10,
      constitution: 14,
      intelligence: 10,
      wisdom: 17
    },
    basicAttackName: 'Fiamma Sacra / Mazza',
    basicAttackDesc: 'Colpisce in mischia e rilascia scintille radiose che guidano il colpo successivo.',
    skill1: {
      id: 'guiding_bolt',
      name: 'Colonna di Fuoco Sacro',
      cd: 5.2,
      desc: 'Invoca un raggio sacro dal cielo che brucia un’ampia area con danno da fulmine/radioso.',
      damageMultiplier: 2.7,
      icon: '⚡'
    },
    skill2: {
      id: 'healing_word',
      name: 'Santuario Guaritore',
      cd: 6.5,
      desc: 'Onda sacra curativa che risana immediatamente i PV ed emette un’onda repellente.',
      damageMultiplier: 1.0,
      icon: '💖'
    },
    subclasses: [
      {
        id: 'life',
        name: 'Dominio della Vita',
        desc: 'Arma a una mano e scudo sacro con benedizioni di protezione e cura.',
        weaponStyle: 'mace_shield',
        weaponName: 'Mazza Consacrata & Scudo Solare',
        skill2: {
          id: 'healing_word',
          name: 'Santuario Guaritore',
          cd: 6.5,
          desc: 'Onda sacra curativa che risana 45 PV e scatena una barriera luminosa che respinge i nemici.',
          damageMultiplier: 1.0,
          icon: '💖'
        },
        bonusDesc: '+35 Vita Massima e +1.5 Rigenerazione PV al secondo.',
        statBonus: { hp: 35, maxHp: 35, hpRegen: 1.5, armor: 3 },
        passiveEffect: 'Benedizione dei Viventi: raccogliere monete o cuori guarisce istantaneamente 5 PV.'
      },
      {
        id: 'tempest',
        name: 'Dominio della Tempesta',
        desc: 'Grande bastone a due mani che convoglia saette celesti e tuoni.',
        weaponStyle: 'staff_holy',
        weaponName: 'Bastone delle Tempeste a Due Mani',
        skill2: {
          id: 'thunder_judgement',
          name: 'Ira della Tempesta',
          cd: 5.0,
          desc: 'Solleva il bastone e scaglia fulmini a catena celesti che folgorano e stordiscono i mostri.',
          damageMultiplier: 3.2,
          icon: '⚡'
        },
        bonusDesc: '+20% Danno Magico e +15% Probabilità Critico.',
        statBonus: { damage: 3, spellPower: 140, critChance: 12 },
        passiveEffect: 'Ira della Tempesta: subire colpi scatena un lampo di contraccolpo sui nemici vicini.'
      }
    ]
  }
};
