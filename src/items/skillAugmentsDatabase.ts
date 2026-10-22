// Skill Augments & Mutations Database
// The Albedo Renegades: Shadow of Elanthria

import type { SkillAugment } from '../types/game.ts';
import type { Player } from '../entities/player.ts';

export const SKILL_AUGMENTS: SkillAugment[] = [
  // ==========================================
  // MAGO (WIZARD)
  // ==========================================
  // Primary: Palla di Fuoco
  {
    id: 'wiz_fireball_aoe',
    name: 'Fuoco Dilagante',
    skillTarget: 'skill1',
    classId: 'wizard',
    icon: '🔥',
    category: 'Alterazione Elementale',
    desc: 'Il raggio di esplosione della Palla di Fuoco aumenta del +80% e lascia un cratere ardente che brucia i nemici per 4 secondi.',
    effectType: 'aoe',
    value: 1.8
  },
  {
    id: 'wiz_fireball_bounce',
    name: 'Fiamme Rimbalzanti',
    skillTarget: 'skill1',
    classId: 'wizard',
    icon: '⚡',
    category: 'Balistica Arcana',
    desc: 'La Palla di Fuoco rimbalza 2 volte contro pareti e nemici, rilasciando una deflagrazione ad ogni impatto!',
    effectType: 'bounce',
    value: 2
  },
  {
    id: 'wiz_fireball_orbit',
    name: 'Comete Orbitanti',
    skillTarget: 'skill1',
    classId: 'wizard',
    icon: '🪐',
    category: 'Cosmologia della Trama',
    desc: 'Lanciare la Palla di Fuoco genera 2 sfere ardenti che orbitano attorno al mago per 10 secondi, bruciando chi si avvicina.',
    effectType: 'orbit',
    value: 10
  },
  // Secondary: Evocazione (Passo Velato)
  {
    id: 'wiz_misty_zero_kelvin',
    name: 'Zero Assoluto',
    skillTarget: 'skill2',
    classId: 'wizard',
    subclassId: 'evocation',
    icon: '❄️',
    category: 'Crio-Magia Superiore',
    desc: 'Il Passo Velato rilascia 8 aghi di ghiaccio a stella che congelano e rallentano i nemici per 3.5 secondi.',
    effectType: 'projectiles',
    value: 8
  },
  {
    id: 'wiz_misty_double_step',
    name: 'Doppio Passo Etereo',
    skillTarget: 'skill2',
    classId: 'wizard',
    subclassId: 'evocation',
    icon: '💨',
    category: 'Manipolazione Temporale',
    desc: 'Il Passo Velato ottiene 2 cariche consecutive con 0 ricarica prima di entrare in cooldown!',
    effectType: 'charges',
    value: 2
  },
  // Secondary: Trama (Singolarità Arcana)
  {
    id: 'wiz_singularity_supermassive',
    name: 'Singolarità Supermassiva',
    skillTarget: 'skill2',
    classId: 'wizard',
    subclassId: 'abjuration',
    icon: '🌀',
    category: 'Fisica Arcana',
    desc: 'Raddoppia il raggio e la forza di risucchio del vortice, rilasciando un’onda d’urto finale da +100% danno.',
    effectType: 'aoe',
    value: 2.0
  },
  {
    id: 'wiz_singularity_shield',
    name: 'Egida della Trama',
    skillTarget: 'skill2',
    classId: 'wizard',
    subclassId: 'abjuration',
    icon: '🛡️',
    category: 'Protezione Assoluta',
    desc: 'Ogni nemico risucchiato nella Singolarità conferisce al Mago 35 PV di barriera assorbente temporanea.',
    effectType: 'shield',
    value: 35
  },

  // ==========================================
  // GUERRIERO (FIGHTER)
  // ==========================================
  // Primary: Vortice di Lame
  {
    id: 'fgt_whirl_duration',
    name: 'Ciclone Furioso',
    skillTarget: 'skill1',
    classId: 'fighter',
    icon: '🌪️',
    category: 'Furia Inarrestabile',
    desc: 'Il Vortice dura 3.5 secondi (anziché 1.5s) e risucchia i nemici nell’occhio della tempesta d’acciaio.',
    effectType: 'duration',
    value: 3.5
  },
  {
    id: 'fgt_whirl_charges',
    name: 'Vortici Consecutivi',
    skillTarget: 'skill1',
    classId: 'fighter',
    icon: '⚔️',
    category: 'Maestria Bellica',
    desc: 'Puoi lanciare il Vortice di Lame 2 volte consecutive prima che entri in ricarica!',
    effectType: 'charges',
    value: 2
  },
  {
    id: 'fgt_whirl_wind_blades',
    name: 'Lame di Vento Trancianti',
    skillTarget: 'skill1',
    classId: 'fighter',
    icon: '🪓',
    category: 'Onda d’Urto',
    desc: 'Ogni rotazione del vortice scaglia lame d’aria taglienti a distanza verso tutti i nemici nella stanza.',
    effectType: 'projectiles',
    value: 6
  },
  // Secondary: Berserker (Danza delle Lame)
  {
    id: 'fgt_flurry_crit',
    name: 'Frenesia dei Critici',
    skillTarget: 'skill2',
    classId: 'fighter',
    subclassId: 'champion',
    icon: '🩸',
    category: 'Sete di Sangue',
    desc: 'La Danza delle Lame Gemelle conferisce il 100% di probabilità di Colpo Critico per i successivi 4 secondi.',
    effectType: 'crit_boost',
    value: 4.0
  },
  // Secondary: Colosso (Schiacciata Sismica)
  {
    id: 'fgt_seismic_fissure',
    name: 'Cataclisma Terrestre',
    skillTarget: 'skill2',
    classId: 'fighter',
    subclassId: 'battle_master',
    icon: '🌋',
    category: 'Forza Tellurica',
    desc: 'La Schiacciata Sismica apre 3 fenditure sismiche ardenti che si propagano in avanti spazzando i nemici.',
    effectType: 'aoe',
    value: 2.2
  },

  // ==========================================
  // LADRO (ROGUE)
  // ==========================================
  // Primary: Colpo Furtivo
  {
    id: 'rog_backstab_poison',
    name: 'Veleno della Manticora',
    skillTarget: 'skill1',
    classId: 'rogue',
    icon: '🧪',
    category: 'Alchimia Oscura',
    desc: 'I colpi applicano un veleno corrosivo che infligge il 60% dei danni nel tempo e riduce la velocità dei bersagli.',
    effectType: 'lingering',
    value: 0.6
  },
  {
    id: 'rog_backstab_triple',
    name: 'Lancio Rapido a Ventaglio',
    skillTarget: 'skill1',
    classId: 'rogue',
    icon: '🎯',
    category: 'Precisione Letale',
    desc: 'Il Colpo lancia 3 proiettili a ventaglio contemporaneamente, perforando tutti i bersagli in linea di tiro!',
    effectType: 'projectiles',
    value: 3
  },
  {
    id: 'rog_backstab_smoke',
    name: 'Cortina Fumogena Furtiva',
    skillTarget: 'skill1',
    classId: 'rogue',
    icon: '💨',
    category: 'Tattica d’Ombra',
    desc: 'Colpire un nemico rilascia una densa nube di fumo che acceca i nemici per 3.5 secondi rendendoli incapaci di attaccare.',
    effectType: 'aoe',
    value: 3.5
  },
  // Secondary: Assassino (Passo d'Ombra)
  {
    id: 'rog_shadow_fan_16',
    name: 'Tempesta di 16 Pugnali',
    skillTarget: 'skill2',
    classId: 'rogue',
    subclassId: 'assassin',
    icon: '🗡️',
    category: 'Danza delle Lame',
    desc: 'Il Passo d’Ombra scaglia 16 pugnali rotanti a 360° (anziché 8) ed estende l’invulnerabilità a 1 intero secondo!',
    effectType: 'projectiles',
    value: 16
  },
  // Secondary: Cacciatore (Pioggia di Frecce)
  {
    id: 'rog_arrow_cluster',
    name: 'Frecce a Frammentazione',
    skillTarget: 'skill2',
    classId: 'rogue',
    subclassId: 'thief',
    icon: '🏹',
    category: 'Balistica Elfica',
    desc: 'Ogni freccia della Pioggia si divide in 3 frammenti perforanti all’impatto, moltiplicando i colpi.',
    effectType: 'projectiles',
    value: 3
  },

  // ==========================================
  // PALADINO (PALADIN)
  // ==========================================
  // Primary: Punizione Divina (Smite)
  {
    id: 'pal_smite_radiant_nova',
    name: 'Nova Solare del Giudizio',
    skillTarget: 'skill1',
    classId: 'paladin',
    icon: '☀️',
    category: 'Luce Primordiale',
    desc: 'Il fendente sacro sprigiona una titanica nova solare che abbaglia e spazza via tutti i nemici nel raggio di 6 metri.',
    effectType: 'aoe',
    value: 6.0
  },
  {
    id: 'pal_smite_double_charge',
    name: 'Doppia Punizione Consacrata',
    skillTarget: 'skill1',
    classId: 'paladin',
    icon: '✨',
    category: 'Fervore Sacro',
    desc: 'Attivare lo Smite carica la tua lama per 2 colpi consecutivi potenziati con danno sacro radioso!',
    effectType: 'charges',
    value: 2
  },
  {
    id: 'pal_smite_holy_chains',
    name: 'Fulmini del Giudizio a Catena',
    skillTarget: 'skill1',
    classId: 'paladin',
    icon: '⛓️',
    category: 'Retribuzione',
    desc: 'Il fendente scatena archi di fulmini sacri che rimbalzano automaticamente su 4 nemici vicini!',
    effectType: 'chain',
    value: 4
  },
  // Secondary: Protezione (Carica Scudo)
  {
    id: 'pal_charge_bastion',
    name: 'Bastione Radioso Etereo',
    skillTarget: 'skill2',
    classId: 'paladin',
    subclassId: 'devotion',
    icon: '🛡️',
    category: 'Scudo Celestiale',
    desc: 'La Carica crea una cupola dorata che riduce del 75% tutti i danni subiti per 4 secondi.',
    effectType: 'shield',
    value: 4.0
  },
  // Secondary: Vendetta (Fendente del Castigo)
  {
    id: 'pal_vengeance_crater',
    name: 'Cratere della Redenzione',
    skillTarget: 'skill2',
    classId: 'paladin',
    subclassId: 'vengeance',
    icon: '💥',
    category: 'Castigo Eterno',
    desc: 'Il fendente a due mani apre un cratere consacrato che cura il paladino per il 35% del danno inflitto.',
    effectType: 'heal',
    value: 0.35
  },

  // ==========================================
  // CHIERICO (CLERIC)
  // ==========================================
  // Primary: Fiamma Sacra
  {
    id: 'clr_flame_pillar',
    name: 'Colonna Solare Dilatata',
    skillTarget: 'skill1',
    classId: 'cleric',
    icon: '🔥',
    category: 'Potere del Sole',
    desc: 'Il raggio d’impatto della Fiamma Sacra raddoppia (+100%) e proietta i nemici a terra storditi.',
    effectType: 'aoe',
    value: 2.0
  },
  {
    id: 'clr_flame_orbs',
    name: 'Globi di Grazia Orbitanti',
    skillTarget: 'skill1',
    classId: 'cleric',
    icon: '🌟',
    category: 'Benedizione Angelica',
    desc: '3 globi di pura luce girano per 12 secondi attorno al chierico, curandolo e fulminando i nemici vicini.',
    effectType: 'orbit',
    value: 12
  },
  // Secondary: Vita (Parola di Guarigione)
  {
    id: 'clr_heal_sanctuary',
    name: 'Santuario Vivente Permanente',
    skillTarget: 'skill2',
    classId: 'cleric',
    subclassId: 'life',
    icon: '🌿',
    category: 'Miracolo della Rinascita',
    desc: 'Il cerchio di cura permane sul pavimento per 6 secondi donando continua rigenerazione vitale!',
    effectType: 'lingering',
    value: 6.0
  },
  // Secondary: Luce (Giudizio del Tuono)
  {
    id: 'clr_thunder_triple',
    name: 'Tempesta dei Tre Tuoni',
    skillTarget: 'skill2',
    classId: 'cleric',
    subclassId: 'light',
    icon: '⚡',
    category: 'Ira dei Cieli',
    desc: 'Scatena 3 fulmini celesti consecutivi in rapida sequenza sull’area bersaglio!',
    effectType: 'projectiles',
    value: 3
  }
];

export function getAugmentChoicesForPlayer(player: Player): SkillAugment[] {
  // Filter augments compatible with player's class and current subclass
  const available = SKILL_AUGMENTS.filter(a => {
    if (a.classId !== player.classId) return false;
    if (a.subclassId && a.subclassId !== player.subclass.id) return false;
    // Don't show already owned augments
    if (player.hasAugment && player.hasAugment(a.id)) return false;
    return true;
  });

  // Shuffle and pick 3 unique augments
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}
