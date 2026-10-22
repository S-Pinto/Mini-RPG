// Meta-Progression Engine: Ancestral Sanctum (Santuario Ancestrale dei Renegades)
// Persistent Astral Essence & Permanent Upgrades across Runs
// The Albedo Renegades: Shadow of Elanthria

import type { MetaProgressionData, MetaUpgradeDef } from '../types/game.ts';
import type { Player } from '../entities/player.ts';

export const META_UPGRADES: MetaUpgradeDef[] = [
  {
    id: 'vigor',
    name: 'Vigore Ancestrale',
    desc: '+12 Punti Ferita (PV) Massimi permanenti all\'inizio di ogni discesa.',
    icon: '❤️',
    maxRank: 5,
    maxLevel: 5,
    perLevelDesc: (lvl: number) => `+${lvl * 12} PV Massimi Iniziali`,
    costs: [15, 30, 55, 90, 140]
  },
  {
    id: 'dash_stride',
    name: 'Passo delle Tempeste',
    desc: 'Riduce il tempo di ricarica della Schivata del 12% e aumenta la distanza coperta.',
    icon: '🌪️',
    maxRank: 3,
    maxLevel: 3,
    perLevelDesc: (lvl: number) => `-${lvl * 12}% Ricarica Schivata`,
    costs: [25, 60, 120]
  },
  {
    id: 'potion_pouch',
    name: 'Cintura dell’Alchimista',
    desc: 'Inizi ogni spedizione con +1 Pozione Curativa aggiuntiva nella borsa.',
    icon: '🧪',
    maxRank: 2,
    maxLevel: 2,
    perLevelDesc: (lvl: number) => `+${lvl} Pozione Iniziale nello Zaino`,
    costs: [35, 80]
  },
  {
    id: 'armory_relic',
    name: 'Forgia dei Renegades',
    desc: 'Affila tutte le tue armi: +3 Danno Base e +4% Probabilità di Colpo Critico.',
    icon: '⚔️',
    maxRank: 3,
    maxLevel: 3,
    perLevelDesc: (lvl: number) => `+${lvl * 3} Danno Base, +${lvl * 4}% Critico`,
    costs: [30, 70, 130]
  },
  {
    id: 'bounty_hunter',
    name: 'Patto della Prosperità',
    desc: 'Aumenta del +15% l\'oro ottenuto da forzieri e nemici sconfitti.',
    icon: '💰',
    maxRank: 4,
    maxLevel: 4,
    perLevelDesc: (lvl: number) => `+${lvl * 15}% Oro Raccolto`,
    costs: [20, 45, 80, 130]
  },
  {
    id: 'astral_attunement',
    name: 'Risonanza Astrale',
    desc: '+6% Potere Magico per le Abilità e +4% Fortuna nel trovare equipaggiamento Epico.',
    icon: '✨',
    maxRank: 4,
    maxLevel: 4,
    perLevelDesc: (lvl: number) => `+${lvl * 6}% Potere Magico, +${lvl * 4}% Fortuna`,
    costs: [25, 50, 95, 150]
  }
];

const STORAGE_KEY = 'albedo_renegades_meta_v1';

class MetaProgressionManager {
  public data: MetaProgressionData = {
    astralEssence: 20, // Start with some initial essence to try the sanctum!
    upgrades: {},
    totalRuns: 0,
    totalKills: 0,
    bossesDefeated: 0
  };

  constructor() {
    this.load();
  }

  public getEssence(): number {
    return this.data.astralEssence;
  }

  public getData(): MetaProgressionData {
    return this.data;
  }

  public purchaseUpgrade(id: string): boolean {
    return this.upgrade(id);
  }

  public recordKill(): void {
    this.data.totalKills++;
    this.save();
  }

  public load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.data = {
          ...this.data,
          ...parsed,
          upgrades: { ...parsed.upgrades }
        };
      }
    } catch {
      // Fallback to default
    }
  }

  public save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      // Storage unavailable
    }
  }

  public getRank(id: string): number {
    return this.data.upgrades[id] || 0;
  }

  public getUpgradeCost(id: string): number {
    const def = META_UPGRADES.find(u => u.id === id);
    if (!def) return 9999;
    const current = this.getRank(id);
    const maxR = def.maxLevel || def.maxRank;
    if (current >= maxR) return 0;
    return def.costs[current] || 9999;
  }

  public canUpgrade(id: string): boolean {
    const def = META_UPGRADES.find(u => u.id === id);
    if (!def) return false;
    const current = this.getRank(id);
    const maxR = def.maxLevel || def.maxRank;
    if (current >= maxR) return false;
    const cost = this.getUpgradeCost(id);
    return this.data.astralEssence >= cost;
  }

  public upgrade(id: string): boolean {
    if (!this.canUpgrade(id)) return false;
    const cost = this.getUpgradeCost(id);
    this.data.astralEssence -= cost;
    this.data.upgrades[id] = (this.data.upgrades[id] || 0) + 1;
    this.save();
    return true;
  }

  public addEssence(amount: number): void {
    this.data.astralEssence += Math.max(0, amount);
    this.save();
  }

  public recordRun(killsOrVictory: number | boolean = false, bossKilled = false, goldEarned = 0): number {
    this.data.totalRuns++;
    let kills = 0;
    let isBossWin = bossKilled;

    if (typeof killsOrVictory === 'boolean') {
      if (killsOrVictory) {
        isBossWin = true;
        this.data.bossesDefeated++;
        kills = 20;
      } else {
        kills = 8;
      }
    } else {
      kills = killsOrVictory;
      if (bossKilled) this.data.bossesDefeated++;
    }

    this.data.totalKills += kills;

    // Convert run achievements to Astral Essence
    const essenceFromGold = Math.floor(goldEarned * 0.12);
    const essenceFromKills = Math.floor(kills * 0.6);
    const bonusBoss = isBossWin ? 25 : 0;
    const totalGained = Math.max(5, essenceFromGold + essenceFromKills + bonusBoss);

    this.addEssence(totalGained);
    return totalGained;
  }

  public applyToPlayer(player: Player): void {
    const vigorRank = this.getRank('vigor');
    if (vigorRank > 0) {
      player.maxHp += vigorRank * 12;
      player.hp = player.maxHp;
      player.stats.maxHp += vigorRank * 12;
    }

    const dashRank = this.getRank('dash_stride');
    if (dashRank > 0) {
      player.dashMaxCd = Math.max(0.65, player.dashMaxCd - dashRank * 0.12);
    }

    const potionRank = this.getRank('potion_pouch');
    if (potionRank > 0) {
      player.potions += potionRank;
    }

    const armoryRank = this.getRank('armory_relic');
    if (armoryRank > 0) {
      player.stats.damage += armoryRank * 3;
      player.stats.critChance += armoryRank * 4;
    }

    const bountyRank = this.getRank('bounty_hunter');
    if (bountyRank > 0) {
      // Store bonus multiplier directly on player
      (player as any).goldMultiplier = 1.0 + bountyRank * 0.15;
    }

    const astralRank = this.getRank('astral_attunement');
    if (astralRank > 0) {
      player.stats.spellPower += astralRank * 6;
      player.stats.luck += astralRank * 4;
    }
  }
}

export const metaProgression = new MetaProgressionManager();
