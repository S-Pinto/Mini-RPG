// Dark Pacts & Demonic Bargains (Patti con l'Ombra - Risk/Reward)
// The Albedo Renegades: Shadow of Elanthria

import type { DarkPact } from '../types/game.ts';
import type { Player } from '../entities/player.ts';

export const DARK_PACTS: (DarkPact & { applyCurse: (p: Player) => void; applyBoon: (p: Player) => void })[] = [
  {
    id: 'blood_power',
    name: 'Patto di Sangue dei Dannati',
    icon: '🩸',
    curseTitle: 'Sacrificio Vitale',
    curseDesc: 'Perdi il 25% dei tuoi Punti Ferita massimi.',
    boonTitle: 'Potenza Abissale',
    boonDesc: '+10 Danno da Attacco e +20% Potere Magico perenne per tutta la run.',
    applyCurse: (p: Player) => {
      p.maxHp = Math.max(20, Math.round(p.maxHp * 0.75));
      p.hp = Math.min(p.hp, p.maxHp);
      p.stats.maxHp = p.maxHp;
    },
    applyBoon: (p: Player) => {
      p.stats.damage += 10;
      p.stats.spellPower += 20;
    }
  },
  {
    id: 'frenzy_greed',
    name: 'Avarizia di Mephistis',
    icon: '🪙',
    curseTitle: 'Brama Pericolosa',
    curseDesc: 'Tutti i mostri diventano più aggressivi ed infliggono il +30% di danno.',
    boonTitle: 'Forziere del Reietto',
    boonDesc: '+150 Monete d’Oro istantanee e l’oro trovato viene triplicato!',
    applyCurse: (p: Player) => {
      (p as any).enemyDamageMultiplier = 1.3;
    },
    applyBoon: (p: Player) => {
      p.gold += 150;
      (p as any).goldMultiplier = ((p as any).goldMultiplier || 1.0) * 3.0;
    }
  },
  {
    id: 'reckless_haste',
    name: 'Fretta del Senzasole',
    icon: '⚡',
    curseTitle: 'Riflessi Esausti',
    curseDesc: 'Il tempo di ricarica della Schivata aumenta del +40%.',
    boonTitle: 'Trama Fluida',
    boonDesc: 'I tempi di ricarica delle Abilità [1] e [2] sono ridotti del -45%!',
    applyCurse: (p: Player) => {
      p.dashMaxCd *= 1.4;
    },
    applyBoon: (p: Player) => {
      p.stats.cooldownReduction = Math.min(60, p.stats.cooldownReduction + 45);
    }
  },
  {
    id: 'glass_cannon',
    name: 'Lama del Giudizio Cieco',
    icon: '🗡️',
    curseTitle: 'Carne Vulnerabile',
    curseDesc: 'La tua Classe Armatura viene ridotta a zero.',
    boonTitle: 'Fendente Mortale',
    boonDesc: '+25% Probabilità di Colpo Critico e +75% Danno da Critico!',
    applyCurse: (p: Player) => {
      p.stats.armor = 0;
    },
    applyBoon: (p: Player) => {
      p.stats.critChance += 25;
      p.stats.critDamage += 75;
    }
  }
];

export function getRandomPacts(count = 3): typeof DARK_PACTS {
  const shuffled = [...DARK_PACTS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
