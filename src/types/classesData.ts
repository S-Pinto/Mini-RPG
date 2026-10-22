// D&D 5e Classes, Subclasses and Skills
// The Albedo Renegades: Shadow of Elanthria

import type { CharacterClassConfig, ClassId } from './game.ts';

export const CLASSES_DATA: Record<ClassId, CharacterClassConfig> = {
  paladin: {
    id: 'paladin',
    name: 'Paladino',
    dndTitle: 'Campione della Luce Sacra',
    role: 'Mischia Pesante · Armatura e Radiosità',
    description: 'Guerriero consacrato a un solenne giuramento. Protetto da pesanti piastre e armato di spada e scudo, canalizza la potenza divina per annientare il male.',
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
      name: 'Carica della Fede',
      cd: 3.5,
      desc: 'Scatto prorompente schermato da uno scudo dorato che danneggia i mostri attraversati.',
      damageMultiplier: 1.4,
      icon: '🛡️'
    },
    subclasses: [
      {
        id: 'devotion',
        name: 'Giuramento di Devozione',
        desc: 'Dedito alla rettitudine e alla protezione degli innocenti.',
        bonusDesc: '+25 Vita Massima, +4 Armatura e rigenerazione passiva.',
        statBonus: { hp: 25, maxHp: 25, armor: 4, hpRegen: 0.8 },
        passiveEffect: 'Aura di Purezza: rigenera 0.8 PV al secondo costantemente.'
      },
      {
        id: 'vengeance',
        name: 'Giuramento di Vendetta',
        desc: 'Implacabile contro i mostri che hanno distrutto Okkarn.',
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
    description: 'Studioso delle forze cosmiche e della manipolazione della trama. Annienta interi gruppi di nemici a distanza con potenti incantesimi elementali.',
    color: '#66a3ff',
    lightColor: 0x80bfff,
    weaponType: 'staff',
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
      name: 'Passo Velato (Misty Step)',
      cd: 4.0,
      desc: 'Teletrasporto immediato con fumo arcano che dissolve i proiettili e stordisce i nemici vicini.',
      damageMultiplier: 0.8,
      icon: '✨'
    },
    subclasses: [
      {
        id: 'evocation',
        name: 'Scuola di Evocazione',
        desc: 'Specializzato nella distruzione elementale pura con fuoco e fulmini.',
        bonusDesc: '+25% Danno Magico e +20% Raggio di tutte le esplosioni.',
        statBonus: { spellPower: 150, damage: 3 },
        passiveEffect: 'Manipolazione dell’Intensità: le esplosioni ignorano il 30% della resistenza nemica.'
      },
      {
        id: 'abjuration',
        name: 'Scuola di Abiurazione',
        desc: 'Erede delle barriere protettive elfiche di Elshiff.',
        bonusDesc: '+30 Vita Massima, +8 Armatura e uno Scudo Arcano passivo.',
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
    description: 'Esperto nell’uso dello spadone pesante a due mani. Capace di resistere a colpi tremendi e rispondere con fendenti inarrestabili.',
    color: '#e65c5c',
    lightColor: 0xff8080,
    weaponType: 'greatsword',
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
    basicAttackName: 'Fendente con Spadone',
    basicAttackDesc: 'Un pesante colpo ad arco che trapassa più nemici adiacenti.',
    skill1: {
      id: 'whirlwind',
      name: 'Vortice d’Acciaio (Action Surge)',
      cd: 5.0,
      desc: 'Ruota con lo spadone a 360° colpendo ripetutamente tutti i mostri nel raggio.',
      damageMultiplier: 2.6,
      icon: '🌪️'
    },
    skill2: {
      id: 'second_wind',
      name: 'Recupero delle Forze',
      cd: 8.0,
      desc: 'Attiva la tenacia del guerriero ripristinando all’istante 35% dei PV massimi.',
      damageMultiplier: 0,
      icon: '💪'
    },
    subclasses: [
      {
        id: 'champion',
        name: 'Campione',
        desc: 'Sviluppa la perfezione fisica per colpi letali continui.',
        bonusDesc: '+12% Probabilità Critico e +40% Danno Critico.',
        statBonus: { critChance: 12, critDamage: 40 },
        passiveEffect: 'Critico Migliorato: i critici ripristinano 4 PV istantanei.'
      },
      {
        id: 'battle_master',
        name: 'Maestro di Battaglia',
        desc: 'Stratega marziale che comanda il ritmo dello scontro.',
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
    description: 'Cresciuto nei bassifondi devastati di Azren. Agile, silenzioso e letale, lancia lame avvelenate e colpisce con precisione chirurgica nei punti vitali.',
    color: '#44d98a',
    lightColor: 0x80ffb3,
    weaponType: 'daggers',
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
    basicAttackName: 'Lancio di Pugnali',
    basicAttackDesc: 'Raffica rapidissima di stiletti perforanti a media distanza.',
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
      name: 'Azione Scaltra (Shadow Roll)',
      cd: 2.5,
      desc: 'Capriola acrobatica fulminea con totale invulnerabilità temporanea.',
      damageMultiplier: 0.6,
      icon: '💨'
    },
    subclasses: [
      {
        id: 'assassin',
        name: 'Assassino',
        desc: 'Addestrato nell’arte dell’omicidio rapido e invisibile.',
        bonusDesc: '+10% Velocità di movimento, +15% Critico e +60% Danno Critico.',
        statBonus: { critChance: 15, critDamage: 60, speed: 0.6 },
        passiveEffect: 'Colpo Mortale: infligge doppio danno a nemici con oltre 80% PV.'
      },
      {
        id: 'arcane_trickster',
        name: 'Mistificatore Arcano',
        desc: 'Unisce furtività a trucchi di illusione e trasmutazione.',
        bonusDesc: '+2 Lame extra per attacco e +15% Ricarica Abilità.',
        statBonus: { cooldownReduction: 15, luck: 10 },
        passiveEffect: 'Lame Gemelle: ogni pugnale ha probabilità di rimbalzare su un bersaglio vicino.'
      }
    ]
  },

  cleric: {
    id: 'cleric',
    name: 'Chierico',
    dndTitle: 'Sacerdote della Tempesta e della Vita',
    role: 'Supporto Tattico · Mazza, Fulmini e Risanamento',
    description: 'Invocatore del favore degli dèi celesti. Alterna possenti colpi di mazza ferrata a miracoli curativi e saette celesti che inceneriscono i mostri.',
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
      name: 'Parola Guaritrice',
      cd: 7.0,
      desc: 'Onda sacra curativa che risana immediatamente 30 PV ed emette un’onda d’urto repellente.',
      damageMultiplier: 1.0,
      icon: '💖'
    },
    subclasses: [
      {
        id: 'life',
        name: 'Dominio della Vita',
        desc: 'Canale inesauribile di energia rigenerante divina.',
        bonusDesc: '+35 Vita Massima e +1.5 Rigenerazione PV al secondo.',
        statBonus: { hp: 35, maxHp: 35, hpRegen: 1.5, armor: 3 },
        passiveEffect: 'Benedizione dei Viventi: raccogliere monete o cuori guarisce istantaneamente 5 PV.'
      },
      {
        id: 'tempest',
        name: 'Dominio della Tempesta',
        desc: 'Canalizza l’ira dei cieli di Okkarn con tuoni e fulmini.',
        bonusDesc: '+20% Danno Magico e +15% Probabilità Critico.',
        statBonus: { damage: 3, spellPower: 140, critChance: 12 },
        passiveEffect: 'Ira della Tempesta: subire colpi scatena un lampo di contraccolpo sui nemici vicini.'
      }
    ]
  }
};
