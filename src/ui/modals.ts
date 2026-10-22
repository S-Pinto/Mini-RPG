// Modal Overlays: Clean 4-Button Intro Menu, Leaderboard, Settings, Controls Guide,
// Class Selection, D&D Level-Up Feats, and Modern User-Friendly Inventory
// The Albedo Renegades: Shadow of Elanthria

import { CLASSES_DATA } from '../types/classesData.ts';
import { getRandomFeatChoices } from '../items/featsDatabase.ts';
import { generateItem, RARITIES, STAT_LABELS_IT } from '../items/itemDatabase.ts';
import { getAugmentChoicesForPlayer } from '../items/skillAugmentsDatabase.ts';
import type { ClassId, FeatUpgrade, Item, ItemSlot, CharacterStats, SkillAugment, ZoneConfig } from '../types/game.ts';
import type { Player } from '../entities/player.ts';
import type { DungeonRoom } from '../world/dungeonGenerator.ts';
import { sound } from '../audio/soundEngine.ts';

export interface LeaderboardEntry {
  name: string;
  className: string;
  subclassName: string;
  level: number;
  zoneName: string;
  gold: number;
  score: number;
  date: string;
}

export interface GameSettings {
  sfxVolume: number; // 0..100
  musicVolume: number; // 0..100
  screenshake: boolean;
  particleQuality: 'high' | 'medium' | 'low';
  damageNumbers: boolean;
}

const DEFAULT_SETTINGS: GameSettings = {
  sfxVolume: 80,
  musicVolume: 50,
  screenshake: true,
  particleQuality: 'high',
  damageNumbers: true
};

const DEFAULT_LEADERBOARD: LeaderboardEntry[] = [
  {
    name: 'Sir Galahad dell’Alba',
    className: 'Paladino',
    subclassName: 'Cavaliere della Corona',
    level: 8,
    zoneName: 'Grotte di Vazark',
    gold: 480,
    score: 1350,
    date: '22/10/2026'
  },
  {
    name: 'Lyra della Trama',
    className: 'Mago',
    subclassName: 'Evocatrice Astrale',
    level: 7,
    zoneName: 'Foresta di Morgen',
    gold: 390,
    score: 1040,
    date: '21/10/2026'
  },
  {
    name: 'Kaelen l’Ombra',
    className: 'Ladro',
    subclassName: 'Assassino dei Vicoli',
    level: 6,
    zoneName: 'Rovine di Elshiff',
    gold: 560,
    score: 920,
    date: '20/10/2026'
  },
  {
    name: 'Thorgar Spaccaossa',
    className: 'Guerriero',
    subclassName: 'Campione dei Renegades',
    level: 5,
    zoneName: 'Macerie di Azren',
    gold: 310,
    score: 710,
    date: '19/10/2026'
  }
];

export class ModalManager {
  private overlay: HTMLElement | null = null;
  private introPanel: HTMLElement | null = null;
  private leaderboardPanel: HTMLElement | null = null;
  private settingsPanel: HTMLElement | null = null;
  private guidePanel: HTMLElement | null = null;
  private classSelectPanel: HTMLElement | null = null;
  private levelUpPanel: HTMLElement | null = null;
  private inventoryPanel: HTMLElement | null = null;
  private messagePanel: HTMLElement | null = null;
  private mapPanel: HTMLElement | null = null;
  private skillAugmentsPanel: HTMLElement | null = null;
  private shopPanel: HTMLElement | null = null;

  public settings: GameSettings = { ...DEFAULT_SETTINGS };
  private selectedBagIndex: number = 0;
  public isShopOpen = false;
  private shopInventory: Item[] = [];
  private shopInventoryZone = 0;

  public onClassSelected: ((classId: ClassId, subclassIndex: number) => void) | null = null;
  public onFeatChosen: ((feat: FeatUpgrade) => void) | null = null;
  public onResumeGame: (() => void) | null = null;
  public onRestartGame: (() => void) | null = null;

  public init(): void {
    this.overlay = document.getElementById('modal-overlay');
    this.introPanel = document.getElementById('panel-intro');
    this.leaderboardPanel = document.getElementById('panel-leaderboard');
    this.settingsPanel = document.getElementById('panel-settings');
    this.guidePanel = document.getElementById('panel-guide');
    this.classSelectPanel = document.getElementById('panel-class-select');
    this.levelUpPanel = document.getElementById('panel-level-up');
    this.inventoryPanel = document.getElementById('panel-inventory');
    this.messagePanel = document.getElementById('panel-message');
    this.mapPanel = document.getElementById('panel-map');
    this.skillAugmentsPanel = document.getElementById('panel-skill-augments');
    this.shopPanel = document.getElementById('panel-shop');

    this.loadSettings();
  }

  public hideAll(): void {
    if (this.overlay) this.overlay.classList.remove('active');
    [
      this.introPanel,
      this.leaderboardPanel,
      this.settingsPanel,
      this.guidePanel,
      this.classSelectPanel,
      this.levelUpPanel,
      this.inventoryPanel,
      this.messagePanel,
      this.mapPanel,
      this.skillAugmentsPanel,
      this.shopPanel
    ].forEach(p => {
      if (p) p.style.display = 'none';
    });
  }

  // --- 0. CLEAN INTRO / MAIN MENU (Strictly 4 requested buttons) ---
  public showIntro(): void {
    this.hideAll();
    if (!this.overlay || !this.introPanel) return;
    this.overlay.classList.add('active');
    this.introPanel.style.display = 'flex';

    const bindClick = (id: string, cb: () => void) => {
      const el = document.getElementById(id);
      if (el) {
        const fresh = el.cloneNode(true) as HTMLElement;
        el.parentNode?.replaceChild(fresh, el);
        fresh.addEventListener('click', () => {
          sound.init();
          sound.coin();
          cb();
        });
      }
    };

    // 1. Nuova Partita
    bindClick('intro-btn-new', () => this.showClassSelect());
    // 2. Classifica
    bindClick('intro-btn-leaderboard', () => this.showLeaderboard());
    // 3. Comandi & Guida
    bindClick('intro-btn-guide', () => this.showGuide());
    // 4. Impostazioni
    bindClick('intro-btn-settings', () => this.showSettings());
  }

  // --- 0B. LEADERBOARD MODAL ---
  public showLeaderboard(): void {
    this.hideAll();
    if (!this.overlay || !this.leaderboardPanel) return;
    this.overlay.classList.add('active');
    this.leaderboardPanel.style.display = 'flex';

    const container = document.getElementById('leaderboard-table-container');
    const entries = this.getLeaderboardEntries();

    if (container) {
      if (entries.length === 0) {
        container.innerHTML = `
          <div class="empty-leaderboard">
            <p>Nessuna impresa registrata. Completa la tua prima discesa per entrare nella leggenda!</p>
          </div>
        `;
      } else {
        container.innerHTML = `
          <table class="leaderboard-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Campione</th>
                <th>Classe</th>
                <th>Livello</th>
                <th>Zona Raggiunta</th>
                <th>Oro</th>
                <th>Punteggio</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              ${entries.map((e, idx) => `
                <tr class="${idx === 0 ? 'rank-gold' : idx === 1 ? 'rank-silver' : idx === 2 ? 'rank-bronze' : ''}">
                  <td class="rank-num">${idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : (idx + 1)}</td>
                  <td class="hero-cell"><b>${e.name}</b></td>
                  <td>${e.className} <small>(${e.subclassName})</small></td>
                  <td><span class="badge-lvl">Liv. ${e.level}</span></td>
                  <td>${e.zoneName}</td>
                  <td>💰 ${e.gold}</td>
                  <td class="score-cell">⭐ ${e.score}</td>
                  <td class="date-cell">${e.date}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      }
    }

    const btnBack = document.getElementById('btn-back-from-leaderboard');
    if (btnBack) {
      const fresh = btnBack.cloneNode(true) as HTMLElement;
      btnBack.parentNode?.replaceChild(fresh, btnBack);
      fresh.addEventListener('click', () => this.showIntro());
    }

    const btnClear = document.getElementById('btn-clear-leaderboard');
    if (btnClear) {
      const fresh = btnClear.cloneNode(true) as HTMLElement;
      btnClear.parentNode?.replaceChild(fresh, btnClear);
      fresh.addEventListener('click', () => {
        if (confirm('Vuoi davvero cancellare la classifica locale?')) {
          localStorage.removeItem('albedo_leaderboard');
          this.showLeaderboard();
        }
      });
    }
  }

  private getLeaderboardEntries(): LeaderboardEntry[] {
    try {
      const saved = localStorage.getItem('albedo_leaderboard');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.sort((a, b) => b.score - a.score);
        }
      }
    } catch {
      // Fallback
    }
    return DEFAULT_LEADERBOARD;
  }

  public recordRunScore(entry: LeaderboardEntry): void {
    try {
      const current = this.getLeaderboardEntries();
      current.push(entry);
      current.sort((a, b) => b.score - a.score);
      const top15 = current.slice(0, 15);
      localStorage.setItem('albedo_leaderboard', JSON.stringify(top15));
    } catch {
      // Ignore localStorage errors
    }
  }

  // --- 0C. SETTINGS MODAL ---
  public showSettings(): void {
    this.hideAll();
    if (!this.overlay || !this.settingsPanel) return;
    this.overlay.classList.add('active');
    this.settingsPanel.style.display = 'flex';

    const sfxInput = document.getElementById('setting-sfx-vol') as HTMLInputElement | null;
    const sfxVal = document.getElementById('setting-sfx-val');
    const musicInput = document.getElementById('setting-music-vol') as HTMLInputElement | null;
    const musicVal = document.getElementById('setting-music-val');
    const shakeInput = document.getElementById('setting-screenshake') as HTMLInputElement | null;
    const particlesSelect = document.getElementById('setting-particles') as HTMLSelectElement | null;
    const dmgInput = document.getElementById('setting-damage-numbers') as HTMLInputElement | null;

    if (sfxInput) {
      sfxInput.value = String(this.settings.sfxVolume);
      if (sfxVal) sfxVal.textContent = `${this.settings.sfxVolume}%`;
      sfxInput.oninput = () => {
        const v = Number(sfxInput.value);
        if (sfxVal) sfxVal.textContent = `${v}%`;
        this.settings.sfxVolume = v;
        sound.setSfxVolume(v / 100);
      };
      sfxInput.onchange = () => sound.swing();
    }

    if (musicInput) {
      musicInput.value = String(this.settings.musicVolume);
      if (musicVal) musicVal.textContent = `${this.settings.musicVolume}%`;
      musicInput.oninput = () => {
        const v = Number(musicInput.value);
        if (musicVal) musicVal.textContent = `${v}%`;
        this.settings.musicVolume = v;
        sound.setMusicVolume(v / 100);
      };
    }

    if (shakeInput) {
      shakeInput.checked = this.settings.screenshake;
      shakeInput.onchange = () => {
        this.settings.screenshake = shakeInput.checked;
      };
    }

    if (particlesSelect) {
      particlesSelect.value = this.settings.particleQuality;
      particlesSelect.onchange = () => {
        this.settings.particleQuality = particlesSelect.value as 'high' | 'medium' | 'low';
      };
    }

    if (dmgInput) {
      dmgInput.checked = this.settings.damageNumbers;
      dmgInput.onchange = () => {
        this.settings.damageNumbers = dmgInput.checked;
      };
    }

    const btnSave = document.getElementById('btn-save-settings');
    if (btnSave) {
      const fresh = btnSave.cloneNode(true) as HTMLElement;
      btnSave.parentNode?.replaceChild(fresh, btnSave);
      fresh.addEventListener('click', () => {
        sound.coin();
        this.saveSettings();
        this.showIntro();
      });
    }
  }

  private loadSettings(): void {
    try {
      const s = localStorage.getItem('albedo_settings');
      if (s) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(s) };
      }
    } catch {
      this.settings = { ...DEFAULT_SETTINGS };
    }
    sound.setSfxVolume(this.settings.sfxVolume / 100);
    sound.setMusicVolume(this.settings.musicVolume / 100);
  }

  private saveSettings(): void {
    try {
      localStorage.setItem('albedo_settings', JSON.stringify(this.settings));
    } catch {
      // Ignore
    }
  }

  // --- 0D. GUIDE MODAL ---
  public showGuide(): void {
    this.hideAll();
    if (!this.overlay || !this.guidePanel) return;
    this.overlay.classList.add('active');
    this.guidePanel.style.display = 'flex';

    const btnBack = document.getElementById('btn-back-from-guide');
    if (btnBack) {
      const fresh = btnBack.cloneNode(true) as HTMLElement;
      btnBack.parentNode?.replaceChild(fresh, btnBack);
      fresh.addEventListener('click', () => this.showIntro());
    }
  }

  // --- 1. Class and Subclass Selection ---
  public showClassSelect(): void {
    this.hideAll();
    if (!this.overlay || !this.classSelectPanel) return;

    this.overlay.classList.add('active');
    this.classSelectPanel.style.display = 'flex';

    const container = document.getElementById('class-cards-container');
    if (!container) return;

    container.innerHTML = Object.values(CLASSES_DATA).map(c => {
      const sub0 = c.subclasses[0];
      const sub1 = c.subclasses[1];

      return `
        <div class="class-card" style="--accent:${c.color}">
          <div class="class-header">
            <h3>${c.name}</h3>
            <span class="dnd-title">${c.dndTitle}</span>
          </div>
          <p class="class-role">${c.role}</p>
          <p class="class-desc">${c.description}</p>
          
          <div class="skill-preview">
            <div><b>Attacco Base:</b> ${c.basicAttackName}</div>
            <div><b>Abilità Primaria:</b> ${c.skill1.icon} ${c.skill1.name} <span class="skill-cd">(CD: ${c.skill1.cd}s)</span></div>
          </div>

          <div class="subclass-pickers">
            <button class="btn-subclass" data-class="${c.id}" data-sub="0">
              <div class="sub-name-row"><b>${sub0.name}</b></div>
              <div class="sub-gear-row">⚔️ <i>${sub0.weaponName}</i></div>
              <div class="sub-skill-row">${sub0.skill2.icon} <b>Abilità 2:</b> ${sub0.skill2.name}</div>
              <small>${sub0.bonusDesc}</small>
            </button>
            <button class="btn-subclass" data-class="${c.id}" data-sub="1">
              <div class="sub-name-row"><b>${sub1.name}</b></div>
              <div class="sub-gear-row">⚔️ <i>${sub1.weaponName}</i></div>
              <div class="sub-skill-row">${sub1.skill2.icon} <b>Abilità 2:</b> ${sub1.skill2.name}</div>
              <small>${sub1.bonusDesc}</small>
            </button>
          </div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.btn-subclass').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = (e.currentTarget as HTMLElement);
        const classId = target.dataset.class as ClassId;
        const subIndex = Number(target.dataset.sub);
        sound.init();
        sound.levelUp();
        this.hideAll();
        if (this.onClassSelected) this.onClassSelected(classId, subIndex);
      });
    });

    const btnBack = document.getElementById('btn-back-from-class-select');
    if (btnBack) {
      const fresh = btnBack.cloneNode(true) as HTMLElement;
      btnBack.parentNode?.replaceChild(fresh, btnBack);
      fresh.addEventListener('click', () => this.showIntro());
    }
  }

  // --- 2. Roguelike Feats Level-Up Card Selection (Class-Filtered & On-Demand) ---
  public showLevelUp(player: Player): void {
    this.hideAll();
    if (!this.overlay || !this.levelUpPanel) return;

    sound.levelUp();
    this.overlay.classList.add('active');
    this.levelUpPanel.style.display = 'flex';

    const title = document.getElementById('level-up-title');
    if (title) title.textContent = `AVANZAMENTO AL LIVELLO ${player.level}`;

    const pointsCount = document.getElementById('levelup-points-count');
    if (pointsCount) pointsCount.textContent = `${Math.max(1, player.pendingLevelUps)}`;

    const container = document.getElementById('feat-cards-container');
    if (!container) return;

    const renderCards = () => {
      const feats = getRandomFeatChoices(3, player.classId);
      const rarityLabels: Record<string, string> = {
        common: 'COMUNE',
        rare: 'RARO',
        epic: 'EPICO',
        legendary: 'LEGGENDARIO'
      };

      container.innerHTML = feats.map((f, i) => `
        <div class="feat-card feat-${f.rarity || 'common'}" data-index="${i}" style="--accent:${f.color}">
          <div class="feat-card-glow-bg"></div>
          <div class="feat-card-top">
            <span class="feat-rarity-badge ${f.rarity || 'common'}">
              <span class="gem-dot"></span>
              ${rarityLabels[f.rarity || 'common']}
            </span>
            <span class="feat-category-pill">${f.category}</span>
          </div>

          <div class="feat-art-alcove">
            <div class="alcove-aura"></div>
            <span class="feat-icon-large">${f.icon || '✨'}</span>
          </div>

          <h3 class="feat-name">${f.name}</h3>
          <div class="feat-divider"></div>
          <p class="feat-desc">${f.desc}</p>
          
          ${f.tags ? `<div class="feat-tags-row">${f.tags.map(t => `<span class="feat-tag">#${t}</span>`).join('')}</div>` : ''}
          <div class="feat-source">📜 ${f.dndSource}</div>
          
          <div class="feat-action-wrap">
            <button class="btn-choose-feat">Consacra Talento</button>
          </div>
        </div>
      `).join('');

      container.querySelectorAll('.feat-card').forEach((card, i) => {
        card.addEventListener('click', () => {
          sound.levelUp();
          if (this.onFeatChosen) this.onFeatChosen(feats[i]);
        });
      });
    };

    renderCards();

    // Re-roll button (50 gold)
    const btnReroll = document.getElementById('btn-reroll-feats');
    if (btnReroll) {
      const fresh = btnReroll.cloneNode(true) as HTMLElement;
      btnReroll.parentNode?.replaceChild(fresh, btnReroll);
      fresh.addEventListener('click', () => {
        if (player.gold >= 50) {
          player.gold -= 50;
          sound.coin();
          renderCards();
        } else {
          sound.playerHurt();
          fresh.textContent = '❌ Oro Insufficiente (50)!';
          setTimeout(() => { fresh.textContent = '🎲 Rilancia Scelte (50 Oro)'; }, 1500);
        }
      });
    }

    // Skip button (+75 gold)
    const btnSkip = document.getElementById('btn-skip-feat-gold');
    if (btnSkip) {
      const fresh = btnSkip.cloneNode(true) as HTMLElement;
      btnSkip.parentNode?.replaceChild(fresh, btnSkip);
      fresh.addEventListener('click', () => {
        player.gold += 75;
        sound.coin();
        player.pendingLevelUps = Math.max(0, player.pendingLevelUps - 1);
        if (player.pendingLevelUps > 0) {
          this.showLevelUp(player);
        } else {
          this.close();
          if (this.onResumeGame) this.onResumeGame();
        }
      });
    }

    // Close and choose later button
    const btnClose = document.getElementById('btn-close-levelup');
    if (btnClose) {
      const fresh = btnClose.cloneNode(true) as HTMLElement;
      btnClose.parentNode?.replaceChild(fresh, btnClose);
      fresh.addEventListener('click', () => {
        this.close();
        if (this.onResumeGame) this.onResumeGame();
      });
    }
  }

  // --- 3. Modern User-Friendly Inventory & Paperdoll Sheet ---
  public showInventory(player: Player): void {
    this.hideAll();
    if (!this.overlay || !this.inventoryPanel) return;

    this.overlay.classList.add('active');
    this.inventoryPanel.style.display = 'flex';

    if (this.selectedBagIndex >= player.bag.length) {
      this.selectedBagIndex = Math.max(0, player.bag.length - 1);
    }

    const slots: ('weapon' | 'armor' | 'helm' | 'ring' | 'relic')[] = ['weapon', 'armor', 'helm', 'ring', 'relic'];
    const slotNames: Record<string, string> = {
      weapon: 'Arma Principale',
      armor: 'Corazza / Tunica',
      helm: 'Elmo / Diadema',
      ring: 'Anello della Trama',
      relic: 'Reliquia Sacra'
    };
    const slotIcons: Record<string, string> = {
      weapon: '🗡️',
      armor: '🛡️',
      helm: '🪖',
      ring: '💍',
      relic: '📜'
    };

    // Paperdoll 5 equipment slots HTML
    const equipHtml = slots.map(s => {
      const item = player.equip[s];
      if (!item) {
        return `
          <div class="equip-slot empty">
            <div class="equip-slot-icon">${slotIcons[s]}</div>
            <div class="equip-slot-info">
              <span class="slot-type">${slotNames[s]}</span>
              <span class="slot-empty-text">Slot Vuoto</span>
            </div>
          </div>
        `;
      }
      const rar = RARITIES[item.rarity];
      const statsList = Object.entries(item.stats)
        .map(([k, v]) => `+${v} ${STAT_LABELS_IT[k as keyof CharacterStats] || k}`)
        .join(' · ');

      return `
        <div class="equip-slot occupied" style="--rar-color:${rar.color}">
          <div class="equip-slot-icon">${item.icon || slotIcons[s]}</div>
          <div class="equip-slot-info">
            <div class="slot-header-row">
              <span class="slot-type">${slotNames[s]}</span>
              <span class="badge-rarity" style="color:${rar.color}">[${rar.name}]</span>
            </div>
            <div class="slot-item-name" style="color:${rar.color}">${item.name}</div>
            <div class="slot-stats-text">${statsList}</div>
          </div>
        </div>
      `;
    }).join('');

    // Bag items grid HTML
    const bagHtml = player.bag.length === 0
      ? '<div class="empty-bag-notice"><p>🎒 Lo zaino è vuoto. Distruggi casse e sconfiggi mostri per raccogliere equipaggiamenti!</p></div>'
      : `<div class="bag-slots-grid">
          ${player.bag.map((item, i) => {
            const rar = RARITIES[item.rarity];
            const isSelected = i === this.selectedBagIndex;
            return `
              <div class="bag-slot-card ${isSelected ? 'selected' : ''}" data-bag-index="${i}" style="--rar-color:${rar.color}">
                <div class="bag-card-top">
                  <span class="bag-item-icon">${item.icon || '📦'}</span>
                  <span class="bag-item-rarity-pill" style="color:${rar.color}">${rar.name}</span>
                </div>
                <div class="bag-card-name" style="color:${rar.color}">${item.name}</div>
                <div class="bag-card-ilvl">Livello ${item.ilvl} · ${slotNames[item.slot]}</div>
              </div>
            `;
          }).join('')}
        </div>`;

    // Item Comparison Preview Box
    const selectedItem: Item | undefined = player.bag[this.selectedBagIndex];
    let comparisonHtml = '';

    if (selectedItem) {
      const currentEquipped = player.equip[selectedItem.slot];
      const selRar = RARITIES[selectedItem.rarity];

      // Compute stat differences
      const allStatKeys = new Set([
        ...Object.keys(selectedItem.stats),
        ...(currentEquipped ? Object.keys(currentEquipped.stats) : [])
      ]) as Set<keyof CharacterStats>;

      const deltasHtml = Array.from(allStatKeys).map(statKey => {
        const newVal = selectedItem.stats[statKey] || 0;
        const oldVal = currentEquipped ? (currentEquipped.stats[statKey] || 0) : 0;
        const diff = Math.round((newVal - oldVal) * 10) / 10;
        const label = STAT_LABELS_IT[statKey] || statKey;

        if (diff > 0) {
          return `<div class="delta-row positive"><span>${label}:</span> <b>+${diff} ▲</b></div>`;
        } else if (diff < 0) {
          return `<div class="delta-row negative"><span>${label}:</span> <b>${diff} ▼</b></div>`;
        } else {
          return `<div class="delta-row neutral"><span>${label}:</span> <b>=${newVal}</b></div>`;
        }
      }).join('');

      comparisonHtml = `
        <div class="item-comparison-card" style="--rar-color:${selRar.color}">
          <div class="comparison-header">
            <h4>CONFRONTO EQUIPAGGIAMENTO</h4>
            <span class="badge-slot">${slotNames[selectedItem.slot]}</span>
          </div>

          <div class="comparison-split">
            <div class="compare-side compare-new">
              <span class="compare-label">OGGETTO NELLO ZAINO</span>
              <div class="compare-item-title" style="color:${selRar.color}">${selectedItem.name}</div>
              <span class="compare-rarity">[${selRar.name}] · Livello ${selectedItem.ilvl}</span>
              <div class="compare-stats-block">
                ${Object.entries(selectedItem.stats).map(([k, v]) => `<div>+${v} ${STAT_LABELS_IT[k as keyof CharacterStats] || k}</div>`).join('')}
              </div>
            </div>

            <div class="compare-side compare-current">
              <span class="compare-label">ATTUALMENTE INDOSSATO</span>
              ${currentEquipped ? `
                <div class="compare-item-title" style="color:${RARITIES[currentEquipped.rarity].color}">${currentEquipped.name}</div>
                <span class="compare-rarity">[${RARITIES[currentEquipped.rarity].name}] · Livello ${currentEquipped.ilvl}</span>
                <div class="compare-stats-block">
                  ${Object.entries(currentEquipped.stats).map(([k, v]) => `<div>+${v} ${STAT_LABELS_IT[k as keyof CharacterStats] || k}</div>`).join('')}
                </div>
              ` : `
                <div class="compare-item-title muted">Nessuno (Slot Vuoto)</div>
                <p class="muted-note">Equipaggiare questo oggetto aggiungerà tutte le sue statistiche.</p>
              `}
            </div>
          </div>

          <div class="comparison-deltas">
            <div class="deltas-title">Variazione Statistiche se Equipaggiato:</div>
            <div class="deltas-grid">${deltasHtml}</div>
          </div>

          <div class="comparison-actions">
            <button id="btn-equip-selected" class="btn-inv-action primary">⚔️ Equipaggia Ora</button>
            <button id="btn-scrap-selected" class="btn-inv-action danger">💰 Smonta per +${selectedItem.goldValue} Oro</button>
          </div>
        </div>
      `;
    }

    this.inventoryPanel.innerHTML = `
      <div class="inventory-modern-layout">
        <!-- TOP STATUS BAR -->
        <div class="inv-top-bar">
          <div class="inv-hero-identity">
            <span class="inv-hero-avatar">🛡️</span>
            <div>
              <div class="inv-hero-name">${player.subclass.name} <span class="inv-hero-lvl">Liv. ${player.level}</span></div>
              <div class="inv-hero-class">${player.classId.toUpperCase()} · Eroe dei Renegades</div>
            </div>
          </div>

          <div class="inv-quick-actions">
            <button id="btn-drink-potion-inv" class="btn-drink-potion-header ${player.potions <= 0 ? 'disabled' : ''}">
              🧪 Bevi Pozione (+45% PV) · Rimanenti: <b>${player.potions}</b>
            </button>
            <div class="inv-gold-counter">💰 <b>${player.gold}</b> Oro</div>
            <button id="btn-close-inv" class="btn-inv-close" title="Chiudi Scheda (ESC / Tab)">✕ Chiudi</button>
          </div>
        </div>

        <!-- TWO BALANCED MAIN COLUMNS -->
        <div class="inv-two-columns">
          <!-- LEFT COLUMN: PAPERDOLL + STATS -->
          <div class="inv-left-pane">
            <div class="inv-section-title">
              <h3>⚔️ Equipaggiamento Indossato</h3>
            </div>
            <div class="paperdoll-list">${equipHtml}</div>

            <div class="inv-section-title" style="margin-top:16px">
              <h3>📊 Statistiche Totali dell’Eroe</h3>
            </div>
            <div class="stats-overview-grid">
              <div class="stat-pill"><span class="stat-lbl">Salute:</span> <b class="stat-val hp">${Math.round(player.hp)} / ${player.maxHp}</b></div>
              <div class="stat-pill"><span class="stat-lbl">Danno Attacco:</span> <b class="stat-val">${player.stats.damage.toFixed(1)}</b></div>
              <div class="stat-pill"><span class="stat-lbl">Armatura:</span> <b class="stat-val">${player.stats.armor}</b></div>
              <div class="stat-pill"><span class="stat-lbl">Velocità:</span> <b class="stat-val">${player.stats.speed.toFixed(1)}</b></div>
              <div class="stat-pill"><span class="stat-lbl">Prob. Critico:</span> <b class="stat-val">${player.stats.critChance}%</b></div>
              <div class="stat-pill"><span class="stat-lbl">Danno Critico:</span> <b class="stat-val">x${player.stats.critDamage.toFixed(1)}</b></div>
              <div class="stat-pill"><span class="stat-lbl">Rigenerazione:</span> <b class="stat-val">${player.stats.hpRegen.toFixed(1)}/s</b></div>
              <div class="stat-pill"><span class="stat-lbl">Vampirismo:</span> <b class="stat-val">${player.stats.lifesteal}%</b></div>
              <div class="stat-pill"><span class="stat-lbl">Potere Magico:</span> <b class="stat-val">${player.stats.spellPower}</b></div>
              <div class="stat-pill"><span class="stat-lbl">Riduz. Ricarica:</span> <b class="stat-val">${player.stats.cooldownReduction}%</b></div>
            </div>
          </div>

          <!-- RIGHT COLUMN: BAG & COMPARISON -->
          <div class="inv-right-pane">
            <div class="inv-section-title">
              <h3>🎒 Zaino (${player.bag.length} oggetti)</h3>
            </div>
            ${bagHtml}
            ${comparisonHtml}
          </div>
        </div>
      </div>
    `;

    // Event listeners
    document.getElementById('btn-close-inv')?.addEventListener('click', () => {
      this.close();
      if (this.onResumeGame) this.onResumeGame();
    });

    // Drink potion
    document.getElementById('btn-drink-potion-inv')?.addEventListener('click', () => {
      if (player.potions > 0 && player.hp < player.maxHp) {
        player.usePotion();
        this.showInventory(player);
      }
    });

    // Select bag item
    this.inventoryPanel.querySelectorAll('.bag-slot-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const idx = Number((e.currentTarget as HTMLElement).dataset.bagIndex);
        this.selectedBagIndex = idx;
        sound.coin();
        this.showInventory(player);
      });
    });

    // Equip selected item
    document.getElementById('btn-equip-selected')?.addEventListener('click', () => {
      const itemToEquip = player.bag[this.selectedBagIndex];
      if (itemToEquip) {
        const oldEquip = player.equip[itemToEquip.slot];
        player.equip[itemToEquip.slot] = itemToEquip;
        player.bag.splice(this.selectedBagIndex, 1);
        if (oldEquip) player.bag.push(oldEquip);

        player.recalculateStats();
        sound.chestOpen();
        this.showInventory(player);
      }
    });

    // Scrap selected item for gold
    document.getElementById('btn-scrap-selected')?.addEventListener('click', () => {
      const itemToScrap = player.bag[this.selectedBagIndex];
      if (itemToScrap) {
        player.gold += itemToScrap.goldValue;
        player.bag.splice(this.selectedBagIndex, 1);
        sound.coin();
        this.showInventory(player);
      }
    });
  }

  // --- 4. Messages Dialog (Death / Victory / Pause) ---
  public showMessage(title: string, message: string, btnText: string, onAction: () => void): void {
    this.hideAll();
    if (!this.overlay || !this.messagePanel) return;

    this.overlay.classList.add('active');
    this.messagePanel.style.display = 'flex';

    this.messagePanel.innerHTML = `
      <div class="message-box">
        <h2 class="message-title">${title}</h2>
        <p class="message-body">${message}</p>
        <button id="msg-btn-action" class="btn-message-action">${btnText}</button>
      </div>
    `;

    document.getElementById('msg-btn-action')?.addEventListener('click', () => {
      this.hideAll();
      onAction();
    });
  }

  public showPauseMenu(onResume: () => void, onQuitToMenu: () => void): void {
    this.hideAll();
    if (!this.overlay || !this.messagePanel) return;

    this.overlay.classList.add('active');
    this.messagePanel.style.display = 'flex';

    this.messagePanel.innerHTML = `
      <div class="message-box" style="max-width: 500px;">
        <h2 class="message-title">⏸️ PAUSA DI GIOCO</h2>
        <p class="message-body">L’avventura è momentaneamente sospesa. Puoi riprendere l'esplorazione oppure abbandonare la spedizione attuale per tornare al Menu Principale e scegliere un'altra classe.</p>
        <div style="display: flex; gap: 14px; margin-top: 12px; flex-wrap: wrap;">
          <button id="pause-btn-resume" class="btn-message-action" style="flex: 1; min-width: 180px;">▶️ Riprendi Partita</button>
          <button id="pause-btn-quit" class="btn-message-action" style="flex: 1; min-width: 180px; background: linear-gradient(135deg, #7a1e28 0%, #4a0d15 100%); border-color: #ff6b7d; color: #ffe6e8;">🚪 Abbandona al Menu</button>
        </div>
      </div>
    `;

    document.getElementById('pause-btn-resume')?.addEventListener('click', () => {
      this.hideAll();
      onResume();
    });

    document.getElementById('pause-btn-quit')?.addEventListener('click', () => {
      this.hideAll();
      onQuitToMenu();
    });
  }

  // --- 5. FAST TRAVEL MAP (Waypoints & Teleport) ---
  public showFastTravelMap(
    rooms: DungeonRoom[],
    currentRoom: DungeonRoom,
    onTeleport: (targetRoom: DungeonRoom) => void
  ): void {
    this.hideAll();
    if (!this.overlay || !this.mapPanel) return;

    this.overlay.classList.add('active');
    this.mapPanel.style.display = 'flex';

    const waypoints = rooms.filter(r => r.waypointName);
    const unlockedWaypoints = waypoints.filter(r => r.waypointUnlocked);

    let html = `
      <div class="map-modal-content">
        <div class="map-header">
          <div>
            <h2 class="map-title">🗺️ RETE DEI PORTALI DI TELETRASPORTO</h2>
            <p class="map-subtitle">Usa la risonanza dei cristalli di Vazark per teletrasportarti istantaneamente tra i nodi sbloccati della mappa (Tasto Rapido: [M]).</p>
          </div>
          <button id="map-btn-close" class="modal-close-btn">&times;</button>
        </div>

        <div class="map-body-layout">
          <!-- Waypoint list -->
          <div class="waypoints-list">
            <h3 class="waypoints-list-title">📡 Nodi di Risonanza (${unlockedWaypoints.length}/${waypoints.length} Sbloccati)</h3>
    `;

    waypoints.forEach(wp => {
      const isCurrent = wp === currentRoom;
      const isUnlocked = wp.waypointUnlocked;
      let badgeClass = 'badge-normal';
      let icon = '🌀';
      if (wp.type === 'start') {
        badgeClass = 'badge-start';
        icon = '🏰';
      } else if (wp.type === 'checkpoint') {
        badgeClass = 'badge-checkpoint';
        icon = '⚔️';
      } else if (wp.type === 'shop') {
        badgeClass = 'badge-shop';
        icon = '🪙';
      }

      html += `
        <div class="waypoint-card ${isCurrent ? 'waypoint-current' : ''} ${!isUnlocked ? 'waypoint-locked' : ''}">
          <div class="wp-icon">${icon}</div>
          <div class="wp-info">
            <div class="wp-title-row">
              <span class="wp-name">${wp.waypointName}</span>
              <span class="wp-badge ${badgeClass}">${wp.type === 'start' ? 'Inizio' : wp.type === 'checkpoint' ? 'Guardiano' : wp.type === 'shop' ? 'Emporio' : 'Portale'}</span>
            </div>
            <div class="wp-status">
              ${isCurrent ? '📌 <span class="text-accent">Posizione Attuale</span>' : isUnlocked ? '✨ Attivo e Risonante' : '🔒 Inesplorato (trova la stanza per attivarlo)'}
            </div>
          </div>
          <div class="wp-actions">
            ${isCurrent ? '<button class="btn-wp-teleport current" disabled>Sei Qui</button>' : isUnlocked ? `<button class="btn-wp-teleport active" data-target-key="${wp.x},${wp.y}">⚡ Teletrasporta</button>` : '<button class="btn-wp-teleport locked" disabled>Bloccato</button>'}
          </div>
        </div>
      `;
    });

    html += `
          </div>
          <!-- Minimap Canvas Container -->
          <div class="map-canvas-container">
            <canvas id="interactive-fast-travel-canvas" width="340" height="340"></canvas>
            <div class="map-canvas-hint">Premi <strong>[M]</strong> per aprire/chiudere o clicca un nodo sbloccato per teletrasportarti.</div>
          </div>
        </div>
      </div>
    `;

    this.mapPanel.innerHTML = html;

    // Close button
    document.getElementById('map-btn-close')?.addEventListener('click', () => {
      this.hideAll();
    });

    // Teleport buttons
    this.mapPanel.querySelectorAll<HTMLButtonElement>('.btn-wp-teleport.active').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetKey = btn.dataset.targetKey;
        const targetRoom = waypoints.find(r => `${r.x},${r.y}` === targetKey);
        if (targetRoom) {
          sound.teleport();
          this.hideAll();
          onTeleport(targetRoom);
        }
      });
    });

    // Draw interactive canvas
    const canvas = document.getElementById('interactive-fast-travel-canvas') as HTMLCanvasElement | null;
    if (canvas) {
      this.drawMinimapCanvas(canvas, rooms, currentRoom, onTeleport);
    }
  }

  private drawMinimapCanvas(
    canvas: HTMLCanvasElement,
    rooms: DungeonRoom[],
    currentRoom: DungeonRoom,
    onTeleport: (targetRoom: DungeonRoom) => void
  ): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    rooms.forEach(r => {
      if (r.x < minX) minX = r.x;
      if (r.x > maxX) maxX = r.x;
      if (r.y < minY) minY = r.y;
      if (r.y > maxY) maxY = r.y;
    });

    const cols = maxX - minX + 1;
    const rows = maxY - minY + 1;
    const cellW = Math.min(canvas.width / (cols + 1), 48);
    const cellH = Math.min(canvas.height / (rows + 1), 48);
    const cellSize = Math.min(cellW, cellH);

    const offsetX = (canvas.width - cols * cellSize) / 2;
    const offsetY = (canvas.height - rows * cellSize) / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw hallway connections between rooms
    ctx.strokeStyle = 'rgba(100, 150, 255, 0.25)';
    ctx.lineWidth = 3;
    rooms.forEach(r => {
      const rx = offsetX + (r.x - minX + 0.5) * cellSize;
      const ry = offsetY + (r.y - minY + 0.5) * cellSize;
      for (const neighbor of Object.values(r.doors)) {
        if (!neighbor) continue;
        const nx = offsetX + (neighbor.x - minX + 0.5) * cellSize;
        const ny = offsetY + (neighbor.y - minY + 0.5) * cellSize;
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(nx, ny);
        ctx.stroke();
      }
    });

    // Draw rooms
    rooms.forEach(r => {
      const rx = offsetX + (r.x - minX) * cellSize + 4;
      const ry = offsetY + (r.y - minY) * cellSize + 4;
      const rw = cellSize - 8;
      const rh = cellSize - 8;

      const isCurrent = r === currentRoom;
      const hasWp = !!r.waypointName;

      if (!r.seen) {
        ctx.fillStyle = 'rgba(25, 28, 45, 0.4)';
        ctx.strokeStyle = 'rgba(50, 60, 90, 0.4)';
      } else if (r.type === 'boss') {
        ctx.fillStyle = '#4a0d18';
        ctx.strokeStyle = '#ff3366';
      } else if (r.type === 'shop') {
        ctx.fillStyle = '#3a2e0a';
        ctx.strokeStyle = '#ffd700';
      } else if (r.type === 'treasure') {
        ctx.fillStyle = '#3b2505';
        ctx.strokeStyle = '#ffaa00';
      } else if (r.type === 'start') {
        ctx.fillStyle = '#0f2f25';
        ctx.strokeStyle = '#00ffaa';
      } else if (r.type === 'checkpoint') {
        ctx.fillStyle = '#1e1c3e';
        ctx.strokeStyle = '#8a5cf6';
      } else {
        ctx.fillStyle = r.cleared ? 'rgba(30, 42, 65, 0.9)' : 'rgba(45, 30, 30, 0.9)';
        ctx.strokeStyle = r.cleared ? '#3d639b' : '#883333';
      }

      ctx.lineWidth = isCurrent ? 3 : 1.5;
      ctx.beginPath();
      ctx.roundRect(rx, ry, rw, rh, 6);
      ctx.fill();
      ctx.stroke();

      // Waypoint icon on canvas
      if (hasWp && r.waypointUnlocked) {
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.arc(rx + rw / 2, ry + rh / 2, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      if (isCurrent) {
        ctx.fillStyle = '#ffea00';
        ctx.beginPath();
        ctx.arc(rx + rw / 2, ry + rh / 2, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Clicking on canvas teleport node
    canvas.onclick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      rooms.forEach(r => {
        if (!r.waypointName || !r.waypointUnlocked || r === currentRoom) return;
        const rx = offsetX + (r.x - minX) * cellSize + 4;
        const ry = offsetY + (r.y - minY) * cellSize + 4;
        const rw = cellSize - 8;
        const rh = cellSize - 8;
        if (clickX >= rx && clickX <= rx + rw && clickY >= ry && clickY <= ry + rh) {
          sound.teleport();
          this.hideAll();
          onTeleport(r);
        }
      });
    };
  }

  // --- 6. SKILL AUGMENTS (Treasure Room Crucible) ---
  public showSkillAugments(
    player: Player,
    onSelected: (augment: SkillAugment) => void
  ): void {
    this.hideAll();
    if (!this.overlay || !this.skillAugmentsPanel) return;

    this.overlay.classList.add('active');
    this.skillAugmentsPanel.style.display = 'flex';

    const choices = getAugmentChoicesForPlayer(player);
    const classData = CLASSES_DATA[player.classId];
    const sub = player.subclass;

    let html = `
      <div class="skill-augments-modal-content">
        <div class="augments-header">
          <div class="crucible-badge">🔮 CROGIOLO DELLA MAESTRIA ARCANA</div>
          <h2 class="augments-title">Consacra una Mutazione di Abilità</h2>
          <p class="augments-subtitle">
            L'antico altare canalizza il potere delle profondità. Seleziona un potenziamento per alterare in modo permanente le tue abilità di <strong>${classData.name} (${sub.name})</strong>.
          </p>
        </div>

        <div class="augments-grid">
    `;

    if (choices.length === 0) {
      html += `
        <div class="no-augments-message">
          <h3>Tutte le abilità sono al massimo potenziale!</h3>
          <p>Hai già consacrato tutte le mutazioni disponibili per la tua classe e sottoclasse.</p>
        </div>
      `;
    } else {
      choices.forEach(aug => {
        const isSkill1 = aug.skillTarget === 'skill1';
        const targetSkillName = isSkill1 ? classData.skill1.name : sub.skill2.name;
        const targetSkillKey = isSkill1 ? 'Skill [1] Primaria' : 'Skill [2] Secondaria';

        html += `
          <div class="augment-card">
            <div class="augment-target-badge ${isSkill1 ? 'target-skill1' : 'target-skill2'}">
              ${isSkill1 ? '⚔️' : '✨'} ${targetSkillKey}: ${targetSkillName}
            </div>
            <div class="augment-icon-container">
              <span class="augment-icon">${aug.icon}</span>
            </div>
            <h3 class="augment-name">${aug.name}</h3>
            <p class="augment-desc">${aug.desc}</p>
            <div class="augment-flavor">Risonanza Arcana Permanente</div>
            <button class="btn-choose-augment" data-aug-id="${aug.id}">
              ✨ Consacra Mutazione
            </button>
          </div>
        `;
      });
    }

    html += `
        </div>
      </div>
    `;

    this.skillAugmentsPanel.innerHTML = html;

    this.skillAugmentsPanel.querySelectorAll<HTMLButtonElement>('.btn-choose-augment').forEach(btn => {
      btn.addEventListener('click', () => {
        const augId = btn.dataset.augId;
        const chosen = choices.find(a => a.id === augId);
        if (chosen) {
          player.skillAugments.push(chosen);
          sound.levelUp();
          this.hideAll();
          onSelected(chosen);
        }
      });
    });
  }

  // --- 7. SHOP MODAL (Merchant & Gear Purchases) ---
  private generateShopInventory(player: Player, zone: ZoneConfig): void {
    this.shopInventory = [];
    const slots: ItemSlot[] = ['weapon', 'armor', 'helm', 'ring', 'relic'];
    for (let i = 0; i < 5; i++) {
      const slot = slots[i % slots.length];
      const rar = i === 0 ? 'rare' : i === 1 ? 'epic' : (Math.random() < 0.5 ? 'rare' : 'uncommon');
      const item = generateItem(slot, zone.actNumber + 1, rar, player.classId);
      this.shopInventory.push(item);
    }
  }

  public showShop(
    player: Player,
    zone: ZoneConfig,
    onOpenFastTravel?: () => void
  ): void {
    this.hideAll();
    if (!this.overlay || !this.shopPanel) return;

    this.overlay.classList.add('active');
    this.shopPanel.style.display = 'flex';
    this.isShopOpen = true;

    if (this.shopInventory.length === 0 || this.shopInventoryZone !== zone.actNumber) {
      this.generateShopInventory(player, zone);
      this.shopInventoryZone = zone.actNumber;
    }

    const renderShopContent = () => {
      if (!this.shopPanel) return;

      let html = `
        <div class="shop-modal-content">
          <div class="shop-header">
            <div class="shop-merchant-intro">
              <div class="merchant-avatar">🧙‍♂️</div>
              <div>
                <h2 class="shop-title">Emporio Sotterraneo dei Renegades</h2>
                <p class="shop-subtitle">"Merce rara forgiata negli abissi, viandante. Oro in cambio di potenza!"</p>
              </div>
            </div>
            <div class="shop-header-right">
              <div class="shop-player-gold">
                💰 Oro: <span class="gold-amount">${player.gold}</span>
              </div>
              <button id="shop-btn-fast-travel" class="btn-shop-teleport">🌀 Rete Teletrasporti [M]</button>
              <button id="shop-btn-close" class="modal-close-btn">&times;</button>
            </div>
          </div>

          <div class="shop-main-layout">
            <!-- Merchant Catalog -->
            <div class="shop-catalog-section">
              <h3 class="shop-section-title">📦 Beni in Vendita dal Mercante</h3>

              <!-- Potion row -->
              <div class="shop-item-card potion-card">
                <div class="shop-item-icon">🧪</div>
                <div class="shop-item-details">
                  <div class="shop-item-name rarity-magic">Elisir Vitale Superiore</div>
                  <div class="shop-item-stats">Ripristina istantaneamente 85 Punti Vita</div>
                </div>
                <div class="shop-item-buy">
                  <span class="item-price">💰 40 Oro</span>
                  <button id="btn-buy-potion" class="btn-shop-buy" ${player.gold < 40 ? 'disabled' : ''}>Acquista</button>
                </div>
              </div>

              <!-- Gear Items Grid -->
              <div class="shop-items-grid">
      `;

      if (this.shopInventory.length === 0) {
        html += `<div class="shop-empty-notice">Tutta la merce del mercante per questo piano è stata acquistata!</div>`;
      } else {
        this.shopInventory.forEach((item, idx) => {
          const rarity = RARITIES[item.rarity];
          const canAfford = player.gold >= item.goldValue;
          const statLines = Object.entries(item.stats)
            .filter(([_, v]) => v && v > 0)
            .map(([k, v]) => `+${v} ${STAT_LABELS_IT[k as keyof CharacterStats] || k}`)
            .join(' · ');

          html += `
            <div class="shop-item-card">
              <div class="shop-item-icon" style="color: ${rarity.color}">${item.icon}</div>
              <div class="shop-item-details">
                <div class="shop-item-name" style="color: ${rarity.color}">${item.name}</div>
                <div class="shop-item-type">${item.slot.toUpperCase()} · Livello ${item.ilvl} (${rarity.name})</div>
                <div class="shop-item-stats">${statLines || 'Oggetto speciale'}</div>
              </div>
              <div class="shop-item-buy">
                <span class="item-price">💰 ${item.goldValue} Oro</span>
                <button class="btn-shop-buy" data-shop-idx="${idx}" ${!canAfford ? 'disabled' : ''}>Acquista</button>
              </div>
            </div>
          `;
        });
      }

      html += `
              </div>
            </div>

            <!-- Player Inventory to sell items -->
            <div class="shop-inventory-section">
              <h3 class="shop-section-title">🎒 Il Tuo Zaino (Vendi Oggetti)</h3>
              <div class="shop-player-items">
      `;

      if (player.bag.length === 0) {
        html += `<div class="shop-empty-notice">Lo zaino è vuoto.</div>`;
      } else {
        player.bag.forEach((item, idx) => {
          const rarity = RARITIES[item.rarity];
          const sellPrice = Math.max(5, Math.floor(item.goldValue * 0.45));

          html += `
            <div class="shop-sell-card">
              <span class="sell-icon" style="color: ${rarity.color}">${item.icon}</span>
              <div class="sell-info">
                <span class="sell-name" style="color: ${rarity.color}">${item.name}</span>
                <span class="sell-sub">${item.slot} (Liv. ${item.ilvl})</span>
              </div>
              <button class="btn-shop-sell" data-sell-idx="${idx}">Vendi (+${sellPrice} 💰)</button>
            </div>
          `;
        });
      }

      html += `
              </div>
            </div>
          </div>
        </div>
      `;

      this.shopPanel!.innerHTML = html;

      // Close handler
      document.getElementById('shop-btn-close')?.addEventListener('click', () => {
        this.isShopOpen = false;
        this.hideAll();
      });

      // Fast travel from shop
      document.getElementById('shop-btn-fast-travel')?.addEventListener('click', () => {
        this.isShopOpen = false;
        this.hideAll();
        if (onOpenFastTravel) onOpenFastTravel();
      });

      // Buy potion
      document.getElementById('btn-buy-potion')?.addEventListener('click', () => {
        if (player.gold >= 40) {
          player.gold -= 40;
          player.hp = Math.min(player.maxHp, player.hp + 85);
          sound.coin();
          renderShopContent();
        }
      });

      // Buy item
      this.shopPanel!.querySelectorAll<HTMLButtonElement>('.btn-shop-buy[data-shop-idx]').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.shopIdx || '0', 10);
          const item = this.shopInventory[idx];
          if (item && player.gold >= item.goldValue) {
            player.gold -= item.goldValue;
            player.bag.push(item);
            this.shopInventory.splice(idx, 1);
            sound.coin();
            renderShopContent();
          }
        });
      });

      // Sell item
      this.shopPanel!.querySelectorAll<HTMLButtonElement>('.btn-shop-sell[data-sell-idx]').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.sellIdx || '0', 10);
          const item = player.bag[idx];
          if (item) {
            const sellPrice = Math.max(5, Math.floor(item.goldValue * 0.45));
            player.gold += sellPrice;
            player.bag.splice(idx, 1);
            sound.coin();
            renderShopContent();
          }
        });
      });
    };

    renderShopContent();
  }

  public close(): void {
    this.hideAll();
  }
}

export const modals = new ModalManager();
