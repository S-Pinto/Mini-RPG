// Modal Overlays: Clean 4-Button Intro Menu, Leaderboard, Settings, Controls Guide,
// Class Selection, D&D Level-Up Feats, and Modern User-Friendly Inventory
// The Albedo Renegades: Shadow of Elanthria

import { CLASSES_DATA } from '../types/classesData.ts';
import { getRandomFeatChoices } from '../items/featsDatabase.ts';
import { RARITIES, STAT_LABELS_IT } from '../items/itemDatabase.ts';
import type { ClassId, FeatUpgrade, Item, CharacterStats } from '../types/game.ts';
import type { Player } from '../entities/player.ts';
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

  public settings: GameSettings = { ...DEFAULT_SETTINGS };
  private selectedBagIndex: number = 0;

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
      this.messagePanel
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
            <div><b>Attacco:</b> ${c.basicAttackName}</div>
            <div><b>Abilità 1:</b> ${c.skill1.icon} ${c.skill1.name} <span class="skill-cd">(CD: ${c.skill1.cd}s)</span></div>
            <div><b>Abilità 2:</b> ${c.skill2.icon} ${c.skill2.name} <span class="skill-cd">(CD: ${c.skill2.cd}s)</span></div>
          </div>

          <div class="subclass-pickers">
            <button class="btn-subclass" data-class="${c.id}" data-sub="0">
              <b>${sub0.name}</b>
              <small>${sub0.bonusDesc}</small>
            </button>
            <button class="btn-subclass" data-class="${c.id}" data-sub="1">
              <b>${sub1.name}</b>
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

  // --- 2. D&D Feats Level-Up Card Selection (Class-Filtered) ---
  public showLevelUp(level: number, classId?: ClassId): void {
    this.hideAll();
    if (!this.overlay || !this.levelUpPanel) return;

    sound.levelUp();
    this.overlay.classList.add('active');
    this.levelUpPanel.style.display = 'flex';

    const title = document.getElementById('level-up-title');
    if (title) title.textContent = `AVANZAMENTO AL LIVELLO ${level}`;

    const container = document.getElementById('feat-cards-container');
    if (!container) return;

    const feats = getRandomFeatChoices(3, classId);
    container.innerHTML = feats.map((f, i) => `
      <div class="feat-card" data-index="${i}" style="--accent:${f.color}">
        <span class="feat-category">${f.category}</span>
        <h3 class="feat-name">${f.name}</h3>
        <p class="feat-desc">${f.desc}</p>
        <button class="btn-choose-feat">Scegli Talento</button>
      </div>
    `).join('');

    container.querySelectorAll('.feat-card').forEach((card, i) => {
      card.addEventListener('click', () => {
        sound.levelUp();
        this.hideAll();
        if (this.onFeatChosen) this.onFeatChosen(feats[i]);
      });
    });
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

  public close(): void {
    this.hideAll();
  }
}

export const modals = new ModalManager();
