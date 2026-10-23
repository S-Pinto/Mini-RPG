// Codex & Bestiary of Elanthria: Monsters, Lore & Weapons Compendium
// The Albedo Renegades: Shadow of Elanthria

export interface BestiaryEntry {
  id: string;
  name: string;
  act: string;
  icon: string;
  hp: number;
  damage: number;
  type: string;
  weakness: string;
  description: string;
}

export interface WeaponEntry {
  id: string;
  name: string;
  icon: string;
  style: string;
  classes: string;
  damageScale: string;
  description: string;
}

export const BESTIARY_DATA: BestiaryEntry[] = [
  {
    id: 'orc_warrior',
    name: 'Orco Soldato di Azren',
    act: 'Atto 1 · Macerie di Azren',
    icon: '🧌',
    hp: 40,
    damage: 12,
    type: 'Mischia Standard',
    weakness: 'Vulnerabile al Fuoco e ai tagli alle spalle',
    description: 'Fanti della milizia orca caduta. Attaccano con sciabole arrugginite in carica frontale.'
  },
  {
    id: 'orc_berserker',
    name: 'Orco Berserker Furente',
    act: 'Atto 1 · Macerie di Azren',
    icon: '🪓',
    hp: 65,
    damage: 18,
    type: 'Carica Furente',
    weakness: 'Stordimento e Schivata laterale prima dell’impatto',
    description: 'Giganteschi orchi che entrano in frenesia quando feriti, caricando a velocità raddoppiata.'
  },
  {
    id: 'orc_shaman',
    name: 'Sciamano delle Macerie',
    act: 'Atto 1 · Macerie di Azren',
    icon: '🔮',
    hp: 35,
    damage: 14,
    type: 'Distanza / Incantatore',
    weakness: 'Pochi Punti Vita; interrompibile durante il cast',
    description: 'Canalizza dardi di fango e rocce infuse di magia caotica dalle distanze.'
  },
  {
    id: 'boss_grummak',
    name: 'Capitano Grummak il Frantumatore',
    act: 'Atto 1 · BOSS FINALE',
    icon: '👑',
    hp: 280,
    damage: 26,
    type: 'Boss Pesante',
    weakness: 'Finestra di contrattacco dopo il suo schianto sismico a terra',
    description: 'Il despota delle macerie di Azren. Il suo martello titanico spacca il pavimento generando onde d’urto radiali.'
  },
  {
    id: 'marsh_troll',
    name: 'Troll della Palude',
    act: 'Atto 3 · Paludi di Morgen',
    icon: '🧟',
    hp: 110,
    damage: 22,
    type: 'Bruto Rigenerante',
    weakness: 'Danno da Bruciatura per bloccare la rigenerazione naturale',
    description: 'Pelle coperta di muschio velenoso e ossa dense come pietra di palude.'
  },
  {
    id: 'kobold_bomber',
    name: 'Koboldo Bombarolo Suicida',
    act: 'Atto 4 · Grotte di Vazark',
    icon: '💣',
    hp: 20,
    damage: 28,
    type: 'Esplosivo Rapido',
    weakness: 'Colpiscilo a distanza prima che raggiunga il giocatore',
    description: 'Si lancia a perdifiato con barili incendiari legati alla schiena per detonare all’impatto.'
  },
  {
    id: 'boss_dragon_vermithrax',
    name: 'Khloron Goldenhorn',
    act: 'Atto 4 · SIGILLO SUPREMO',
    icon: '🐉',
    hp: 680,
    damage: 38,
    type: 'Boss Supremo',
    weakness: 'Schivare l’alito conico e colpire le giunture della corazza d’oro tra un ruggito e l’altro',
    description: 'Il maestoso drago verde primordiale dalle corna splendenti e corazzato con pesanti piastre d’oro battuto. Scatena fiammate coniche, piogge di meteoriti e onde telluriche.'
  }
];

export const WEAPON_COMPENDIUM: WeaponEntry[] = [
  {
    id: 'greatsword',
    name: 'Spadone a Due Mani dei Cavalieri',
    icon: '🗡️',
    style: 'Spadone a Due Mani',
    classes: 'Guerriero · Paladino',
    damageScale: 'Alta Forza · Spazzata ad Arco Ampio',
    description: 'Lama pesante con guardia alata. Ogni colpo sferra una combo spazzata-taglio-affondo che respinge interi gruppi.'
  },
  {
    id: 'greataxe',
    name: 'Grande Ascia Bipenne Nanica',
    icon: '🪓',
    style: 'Bipenne Colossale',
    classes: 'Guerriero',
    damageScale: 'Massimo Danno da Impatto · Stordimento',
    description: 'Forgiata nel bronzo e nell’acciaio temperato. Frantuma gli scudi dei nemici ed infligge colpi critici brutali.'
  },
  {
    id: 'dual_swords',
    name: 'Doppie Spade Elementali',
    icon: '⚔️',
    style: 'Doppia Impugnatura',
    classes: 'Guerriero · Ladro',
    damageScale: 'Velocità Fulminea · Danni Gelo & Fuoco',
    description: 'Una lama morde con il gelo, l’altra brucia con la brace. Permette concatenazioni di attacchi rapidissimi.'
  },
  {
    id: 'dual_daggers',
    name: 'Doppi Pugnali dell’Assassino',
    icon: '🗡️',
    style: 'Doppi Pugnali Veloci',
    classes: 'Ladro',
    damageScale: 'Altissimo Critico · Sfondamento Spalle',
    description: 'Dorso seghettato da sventramento e filo intriso di veleno tossico che riduce l’armatura dei nemici.'
  },
  {
    id: 'bow',
    name: 'Arco Ricurvo dei Guardiani Elfici',
    icon: '🏹',
    style: 'Tiro a Distanza',
    classes: 'Ladro',
    damageScale: 'Distanza Illimitata · Perforazione',
    description: 'Teso con fibra di seta lunare. Scocca frecce composite che trafiggono bersagli multipli.'
  },
  {
    id: 'staff_archmage',
    name: 'Bastone Runico dell’Arcimago',
    icon: '🔮',
    style: 'Bastone a Due Mani',
    classes: 'Mago',
    damageScale: 'Potere Magico Supremo · Sfere Rotanti',
    description: 'Incanalatore di trama arcana con cristallo fluttuante. Scaglia proiettili magici con rinculo fisico.'
  },
  {
    id: 'wand_tome',
    name: 'Bacchetta di Cristallo & Tomo Antico',
    icon: '🪄',
    style: 'Bacchetta & Grimoire',
    classes: 'Mago',
    damageScale: 'Velocità di Cast · Riduzione Cooldown',
    description: 'Un frammento di cristallo puro nella mano dominante ed il libro degli incantesimi aperto a mezz’aria.'
  },
  {
    id: 'staff_holy',
    name: 'Bastone Solare della Fede',
    icon: '⚡',
    style: 'Bastone Sacro',
    classes: 'Chierico',
    damageScale: 'Danno Sacro · Onde Curative',
    description: 'Testa a raggiera solare che proietta punizioni celesti e cura gli alleati vicini.'
  }
];
