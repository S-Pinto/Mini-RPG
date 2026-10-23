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
import { metaProgression, META_UPGRADES } from '../state/metaProgression.ts';
import { getRandomPacts } from '../items/pactsDatabase.ts';
import { BESTIARY_DATA, WEAPON_COMPENDIUM } from '../items/codexDatabase.ts';
import { item3DViewer } from '../graphics/item3DViewer.ts';
import { hero3DViewer } from '../graphics/hero3DViewer.ts';
import { postProcessing } from '../graphics/postProcessing.ts';

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
  postProcessing: boolean;
}

const DEFAULT_SETTINGS: GameSettings = {
  sfxVolume: 80,
  musicVolume: 50,
  screenshake: true,
  particleQuality: 'high',
  damageNumbers: true,
  postProcessing: true
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
    zoneName: 'Rovine di Ealscylf',
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
  private sanctumPanel: HTMLElement | null = null;
  private pactsPanel: HTMLElement | null = null;
  private codexPanel: HTMLElement | null = null;
  private forgePanel: HTMLElement | null = null;

  public settings: GameSettings = { ...DEFAULT_SETTINGS };
  private selectedBagIndex: number = 0;
  private selectedEquipSlot: ItemSlot | null = null;
  private inventoryTab: 'all' | 'weapon' | 'armor' | 'accessory' = 'all';
  private lastBagClickTime: number = 0;
  private lastBagClickIndex: number = -1;
  public isShopOpen = false;
  private shopInventory: Item[] = [];
  private shopInventoryZone = 0;
  private selectedClassTab: ClassId = 'fighter';
  private forgeTab: 'all' | 'weapon' | 'armor' | 'accessory' = 'all';

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
    this.sanctumPanel = document.getElementById('panel-sanctum');
    this.pactsPanel = document.getElementById('panel-pacts');
    this.codexPanel = document.getElementById('panel-codex');
    this.forgePanel = document.getElementById('panel-forge');

    this.loadSettings();
  }

  public hideAll(): void {
    item3DViewer.stop();
    hero3DViewer.stop();
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
      this.shopPanel,
      this.sanctumPanel,
      this.pactsPanel,
      this.codexPanel,
      this.forgePanel
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
    // 4. Santuario Ancestrale (Meta-Progressione)
    bindClick('intro-btn-sanctum', () => this.showSanctum());
    // 5. Bestiario & Compendio Armi
    bindClick('intro-btn-codex', () => this.showCodex());
    // 6. Impostazioni
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

    const bloomInput = document.getElementById('setting-bloom') as HTMLInputElement | null;
    if (bloomInput) {
      bloomInput.checked = this.settings.postProcessing ?? true;
      bloomInput.onchange = () => {
        this.settings.postProcessing = bloomInput.checked;
        postProcessing.enabled = bloomInput.checked;
        postProcessing.bloomEnabled = bloomInput.checked;
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

  // --- 1. Class and Subclass Selection (Clean Hero Showcase Design) ---
  public showClassSelect(): void {
    this.hideAll();
    if (!this.overlay || !this.classSelectPanel) return;

    this.overlay.classList.add('active');
    this.classSelectPanel.style.display = 'flex';

    const container = document.getElementById('class-cards-container');
    if (!container) return;

    const classIcons: Record<ClassId, string> = {
      fighter: '⚔️',
      wizard: '⚡',
      rogue: '🗡️',
      paladin: '✨',
      cleric: '🛡️'
    };

    const weaponStyleLabels: Record<string, string> = {
      sword_shield: 'Spada & Scudo',
      greatsword_2h: 'Spadone a 2 Mani',
      dual_swords: 'Doppie Lame',
      staff_2h: 'Bastone a 2 Mani',
      wand_tome: 'Bacchetta & Tomo',
      dual_daggers: 'Doppi Pugnali',
      bow: 'Arco & Frecce',
      mace_shield: 'Mazza & Scudo Solare',
      staff_holy: 'Bastone delle Tempeste'
    };

    const classesList = Object.values(CLASSES_DATA);

    // ------------------------------------------------------------------
    // STEP 1: Build static shell ONCE (Header + Tabs + Dynamic Slot)
    // ------------------------------------------------------------------
    container.innerHTML = `
      <div class="class-showcase-wrapper" id="class-showcase-root" style="--accent:${CLASSES_DATA[this.selectedClassTab]?.color || '#ffd700'};">
        <div class="class-modal-top-bar">
          <button id="btn-back-from-class-select" class="btn-back-compact" title="Torna al Menu">
            <span class="btn-back-arrow">⬅️</span>
            <span>Menu</span>
          </button>
          <div class="class-modal-title-group">
            <h2 class="class-modal-title">SCEGLI IL TUO EROE</h2>
            <span class="class-modal-subtitle">Seleziona la Classe e confronta le 2 Specializzazioni</span>
          </div>
          <div class="class-count-chip">5 Classi D&amp;D</div>
        </div>

        <div class="class-tabs-bar no-scrollbar" id="class-tabs-bar">
          ${classesList.map(c => `
            <button class="class-tab-btn ${c.id === this.selectedClassTab ? 'active' : ''}"
                    data-class-tab="${c.id}"
                    style="--tab-color:${c.color};">
              <span class="tab-icon">${classIcons[c.id]}</span>
              <span class="tab-class-name">${c.name.toUpperCase()}</span>
            </button>
          `).join('')}
        </div>

        <div class="class-content-slot" id="class-content-slot"></div>
      </div>
    `;

    // ------------------------------------------------------------------
    // STEP 2: Render Dynamic Content for Selected Class (Direct & User-Friendly)
    // ------------------------------------------------------------------
    const renderClassContent = (isTabSwitch = false) => {
      const activeClass = CLASSES_DATA[this.selectedClassTab] || classesList[0];
      const sub0 = activeClass.subclasses[0];
      const sub1 = activeClass.subclasses[1];
      const slot = document.getElementById('class-content-slot');
      const root = document.getElementById('class-showcase-root');
      if (!slot) return;
      if (root) root.style.setProperty('--accent', activeClass.color);

      const renderSubCard = (sub: typeof sub0, index: number, badgeText: string) => {
        const weaponStyle = weaponStyleLabels[sub.weaponStyle] || sub.weaponStyle;
        return `
          <div class="subclass-duel-card">
            <div class="sdc-header">
              <div class="sdc-badge-pill">${badgeText}</div>
              <h3 class="sdc-name">${sub.name}</h3>
              <p class="sdc-desc-one-line">${sub.desc}</p>
            </div>

            <div class="sdc-main-specs">
              <!-- ARMA CHE IMPUGNI (DIRETTO E PULITO) -->
              <div class="sdc-spec-row weapon">
                <span class="sdc-spec-icon">🗡️</span>
                <div class="sdc-spec-text">
                  <div class="sdc-spec-label">ARMA IMPUGNATA</div>
                  <div class="sdc-spec-val">
                    <b>${sub.weaponName}</b>
                    <span class="sdc-style-badge">${weaponStyle}</span>
                  </div>
                </div>
              </div>

              <!-- SECONDA ABILITÀ [E] (DIRETTA E PULITA) -->
              <div class="sdc-spec-row skill">
                <span class="sdc-spec-icon">${sub.skill2.icon}</span>
                <div class="sdc-spec-text">
                  <div class="sdc-skill-header-line">
                    <span class="sdc-spec-label">SECONDA ABILITÀ [ E ]</span>
                    <span class="sdc-cd-badge">⏱ ${sub.skill2.cd}s Recupero</span>
                  </div>
                  <div class="sdc-spec-val"><b>${sub.skill2.name}</b></div>
                  <p class="sdc-skill-desc">${sub.skill2.desc}</p>
                </div>
              </div>

              <!-- TRATTO PASSIVO -->
              <div class="sdc-spec-row passive">
                <span class="sdc-spec-icon">📜</span>
                <div class="sdc-spec-text">
                  <div class="sdc-spec-label">TRATTO PASSIVO</div>
                  <div class="sdc-passive-desc">${sub.bonusDesc}</div>
                </div>
              </div>
            </div>

            <!-- PULSANTE DIRETTO PER GIOCARE -->
            <button class="btn-play-subclass sdc-play-btn" data-class="${activeClass.id}" data-sub="${index}">
              <span>SCEGLI ${sub.name.toUpperCase()}</span>
              <span class="sdc-play-arrow">➔</span>
            </button>
          </div>
        `;
      };

      const html = `
        <div class="hero-stage-layout">
          <!-- TOP HERO STRIP: Banner Identità & Kit Comune -->
          <div class="hero-header-banner">
            <div class="hhb-left">
              <div class="hero-crest-circle">
                <span class="hero-crest-icon">${classIcons[activeClass.id]}</span>
              </div>
              <div class="hhb-title-group">
                <div class="hhb-name-row">
                  <h2 class="hero-name">${activeClass.name}</h2>
                  <span class="hero-dnd-archetype">${activeClass.dndTitle}</span>
                </div>
                <div class="hhb-role-desc">${activeClass.role} · ${activeClass.description}</div>
              </div>
            </div>

            <div class="hhb-common-kit">
              <span class="hhb-kit-label">KIT BASE CONDIVISO:</span>
              <div class="hhb-kit-pill">
                <span class="hhb-key">[Clic SX]</span>
                <span>${activeClass.basicAttackName}</span>
              </div>
              <div class="hhb-kit-pill primary">
                <span class="hhb-key">[ Q ]</span>
                <span>${activeClass.skill1.name} (⏱ ${activeClass.skill1.cd}s)</span>
              </div>
            </div>
          </div>

          <!-- SUBCLASSES DUEL GRID: Le due specializzazioni a tutto spazio -->
          <div class="subclasses-duel-grid">
            ${renderSubCard(sub0, 0, 'OPZIONE A')}
            ${renderSubCard(sub1, 1, 'OPZIONE B')}
          </div>
        </div>
      `;

      slot.innerHTML = html;
      bindContentEvents();

      if (isTabSwitch) {
        slot.classList.remove('content-tab-swapped');
        void slot.offsetWidth; // force reflow for smooth animation
        slot.classList.add('content-tab-swapped');
      }
    };

    const bindContentEvents = () => {
      const slot = document.getElementById('class-content-slot');
      if (!slot) return;
      slot.querySelectorAll<HTMLButtonElement>('.btn-play-subclass').forEach(btn => {
        btn.addEventListener('click', () => {
          const classId = btn.dataset.class as ClassId;
          const subIndex = Number(btn.dataset.sub);
          sound.init();
          sound.levelUp();
          this.hideAll();
          if (this.onClassSelected) this.onClassSelected(classId, subIndex);
        });
      });
    };

    container.querySelector('#btn-back-from-class-select')?.addEventListener('click', () => {
      sound.btnClick();
      this.showIntro();
    });

    container.querySelectorAll<HTMLButtonElement>('.class-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.dataset.classTab as ClassId;
        if (!tabId || tabId === this.selectedClassTab) return;
        container.querySelectorAll('.class-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedClassTab = tabId;
        sound.btnClick();
        renderClassContent(true);
      });
    });

    renderClassContent(false);
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

    const renderCards = (forceReroll = false) => {
      if (forceReroll || !player.currentFeatChoices || player.currentFeatChoices.length === 0) {
        player.currentFeatChoices = getRandomFeatChoices(3, player.classId);
      }
      const feats = player.currentFeatChoices;
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
          const chosenFeat = feats[i];
          player.currentFeatChoices = []; // Reset after selection
          if (this.onFeatChosen) this.onFeatChosen(chosenFeat);
        });
      });
    };

    renderCards(false);

    // Re-roll button (50 gold)
    const btnReroll = document.getElementById('btn-reroll-feats');
    if (btnReroll) {
      const fresh = btnReroll.cloneNode(true) as HTMLElement;
      btnReroll.parentNode?.replaceChild(fresh, btnReroll);
      fresh.addEventListener('click', () => {
        if (player.gold >= 50) {
          player.gold -= 50;
          sound.coin();
          renderCards(true);
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
        player.currentFeatChoices = []; // Reset after skip
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

    // Close and choose later button (persists choices!)
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

  // Helper to compute a power score for an item
  private getItemPowerScore(item: Item): number {
    let score = item.ilvl * 10;
    for (const val of Object.values(item.stats)) {
      score += (val || 0);
    }
    return score;
  }

  // Helper to check if an item is an upgrade over what's currently equipped
  private isItemUpgrade(item: Item, currentEquipped: Item | undefined): boolean {
    if (!currentEquipped) return true;
    if (item.slot === 'weapon') {
      const newPrimary = (item.stats.damage || 0) + (item.stats.spellPower || 0);
      const oldPrimary = (currentEquipped.stats.damage || 0) + (currentEquipped.stats.spellPower || 0);
      if (newPrimary !== oldPrimary) return newPrimary > oldPrimary;
    } else if (item.slot === 'armor') {
      const newDef = (item.stats.armor || 0) * 10 + (item.stats.maxHp || 0);
      const oldDef = (currentEquipped.stats.armor || 0) * 10 + (currentEquipped.stats.maxHp || 0);
      if (newDef !== oldDef) return newDef > oldDef;
    }
    return this.getItemPowerScore(item) > this.getItemPowerScore(currentEquipped);
  }

  // Quick equip helper
  private equipBagIndex(player: Player, index: number): void {
    const itemToEquip = player.bag[index];
    if (itemToEquip) {
      const oldEquip = player.equip[itemToEquip.slot];
      player.equip[itemToEquip.slot] = itemToEquip;
      player.bag.splice(index, 1);
      if (oldEquip) player.bag.push(oldEquip);

      player.recalculateStats();
      sound.chestOpen();
      this.selectedBagIndex = Math.min(index, Math.max(0, player.bag.length - 1));
      this.selectedEquipSlot = null;
      this.showInventory(player);
    }
  }

  // Unequip helper
  private unequipSlot(player: Player, slot: ItemSlot): void {
    const item = player.equip[slot];
    if (item) {
      if (player.bag.length >= 24) {
        sound.playerHurt();
        return;
      }
      delete player.equip[slot];
      player.bag.push(item);
      player.recalculateStats();
      sound.coin();
      this.selectedEquipSlot = null;
      this.selectedBagIndex = player.bag.length - 1;
      this.showInventory(player);
    }
  }

  // Render the Inspection & Comparison Card HTML
  private renderInspectHtml(player: Player): string {
    const slotNames: Record<string, string> = {
      weapon: 'Arma Principale',
      armor: 'Corazza / Tunica',
      helm: 'Elmo / Diadema',
      ring: 'Anello della Trama',
      relic: 'Reliquia Sacra'
    };

    // Case 1: An equipped item is selected on the paperdoll
    if (this.selectedEquipSlot && player.equip[this.selectedEquipSlot]) {
      const item = player.equip[this.selectedEquipSlot]!;
      const rar = RARITIES[item.rarity];
      const statsHtml = Object.entries(item.stats)
        .map(([k, v]) => `<div class="inspect-stat-row"><span class="stat-name">${STAT_LABELS_IT[k as keyof CharacterStats] || k}:</span> <b class="stat-value">+${v}</b></div>`)
        .join('');

      return `
        <div class="inspect-card equipped-mode" style="--rar-color:${rar.color};">
          <div class="inspect-top-row">
            <div class="inspect-3d-stage">
              <canvas id="inspect-3d-canvas" class="inspect-3d-canvas" width="260" height="170"></canvas>
              <div class="inspect-3d-badge">MODELLO 3D INTERATTIVO</div>
              <div class="inspect-3d-hint">🔄 Trascina per ruotare a 360°</div>
            </div>
            <div class="inspect-card-header-col">
              <div class="inspect-card-header">
                <div class="inspect-icon-wrap" style="border-color:${rar.color};">
                  <span class="inspect-icon">${item.icon || '🛡️'}</span>
                </div>
                <div class="inspect-header-info">
                  <div class="inspect-title" style="color:${rar.color};">${item.name}</div>
                  <div class="inspect-subtitle">[${rar.name}] · ${slotNames[item.slot]} · Livello ${item.ilvl}</div>
                </div>
                <span class="inspect-badge-equipped">INDOSSATO</span>
              </div>
              <div class="inspect-card-body">
                <div class="inspect-col full-width">
                  <div class="inspect-section-label">STATISTICHE ATTUALI:</div>
                  <div class="inspect-stats-list">${statsHtml}</div>
                  <div class="inspect-sell-gold">💰 Valore di vendita: <b>+${item.goldValue} Oro</b></div>
                </div>
              </div>
            </div>
          </div>

          <div class="inspect-card-actions">
            <button id="btn-inspect-unequip" class="btn-inspect-action danger" data-slot="${item.slot}">
              ✕ Rimuovi e Riponi nello Zaino
            </button>
          </div>
        </div>
      `;
    }

    // Case 2: A bag item is selected
    const selectedItem: Item | undefined = player.bag[this.selectedBagIndex];
    if (selectedItem) {
      const currentEquipped = player.equip[selectedItem.slot];
      const selRar = RARITIES[selectedItem.rarity];
      const isUpgrade = this.isItemUpgrade(selectedItem, currentEquipped);

      const allStatKeys = new Set([
        ...Object.keys(selectedItem.stats),
        ...(currentEquipped ? Object.keys(currentEquipped.stats) : [])
      ]) as Set<keyof CharacterStats>;

      const deltasHtml = Array.from(allStatKeys).map(statKey => {
        const newVal = Math.round((selectedItem.stats[statKey] || 0) * 10) / 10;
        const oldVal = Math.round((currentEquipped ? (currentEquipped.stats[statKey] || 0) : 0) * 10) / 10;
        const diff = Math.round((newVal - oldVal) * 10) / 10;
        const label = STAT_LABELS_IT[statKey] || statKey;

        if (diff > 0) {
          return `<div class="delta-badge positive"><span>${label}:</span> <b>+${diff} ▲</b></div>`;
        } else if (diff < 0) {
          return `<div class="delta-badge negative"><span>${label}:</span> <b>${diff} ▼</b></div>`;
        } else {
          return `<div class="delta-badge neutral"><span>${label}:</span> <b>=${newVal}</b></div>`;
        }
      }).join('');

      const itemStatsHtml = Object.entries(selectedItem.stats)
        .map(([k, v]) => `<div class="inspect-stat-row"><span class="stat-name">${STAT_LABELS_IT[k as keyof CharacterStats] || k}:</span> <b class="stat-value">+${v}</b></div>`)
        .join('');

      return `
        <div class="inspect-card ${isUpgrade ? 'card-upgrade' : ''}" style="--rar-color:${selRar.color};">
          <div class="inspect-top-row">
            <div class="inspect-3d-stage">
              <canvas id="inspect-3d-canvas" class="inspect-3d-canvas" width="260" height="170"></canvas>
              <div class="inspect-3d-badge">MODELLO 3D INTERATTIVO</div>
              <div class="inspect-3d-hint">🔄 Trascina per ruotare a 360°</div>
            </div>
            <div class="inspect-card-header-col">
              <div class="inspect-card-header">
                <div class="inspect-icon-wrap" style="border-color:${selRar.color};">
                  <span class="inspect-icon">${selectedItem.icon || '📦'}</span>
                </div>
                <div class="inspect-header-info">
                  <div class="inspect-title" style="color:${selRar.color};">${selectedItem.name}</div>
                  <div class="inspect-subtitle">[${selRar.name}] · ${slotNames[selectedItem.slot]} · Livello ${selectedItem.ilvl}</div>
                </div>
                ${isUpgrade ? '<span class="inspect-badge-upgrade">✨ MIGLIORAMENTO</span>' : ''}
              </div>
              <div class="inspect-card-body">
                <div class="inspect-columns">
                  <div class="inspect-col">
                    <div class="inspect-section-label">STATISTICHE OGGETTO:</div>
                    <div class="inspect-stats-list">${itemStatsHtml}</div>
                    <div class="inspect-sell-gold">💰 Valore vendita: <b>+${selectedItem.goldValue} Oro</b></div>
                  </div>
                  <div class="inspect-col">
                    <div class="inspect-section-label">VARIAZIONE VS INDOSSATO:</div>
                    <div class="inspect-deltas-grid">${deltasHtml}</div>
                    ${currentEquipped ? `<div class="inspect-vs-text">Confrontato con: <i>${currentEquipped.name}</i></div>` : '<div class="inspect-vs-text">Nessun oggetto attualmente in questo slot</div>'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="inspect-card-actions">
            <button id="btn-inspect-equip" class="btn-inspect-action primary" data-bag-index="${this.selectedBagIndex}">
              ⚔️ Equipaggia Oggetto
            </button>
            <button id="btn-inspect-scrap" class="btn-inspect-action danger" data-bag-index="${this.selectedBagIndex}">
              💰 Smonta (+${selectedItem.goldValue} Oro)
            </button>
          </div>
          <div class="inspect-card-hint">💡 Clicca 2 volte, usa il tasto ⚡ o clic destro sulla tessera per equipaggiare all'istante</div>
        </div>
      `;
    }

    // Case 3: Empty bag / no selection
    return `
      <div class="inspect-card empty-mode">
        <div class="inspect-empty-notice">
          <span class="empty-icon">🎒</span>
          <div class="empty-title">Nessun oggetto selezionato</div>
          <p class="empty-desc">Clicca su un oggetto nello zaino o su un pezzo indossato per visualizzarne dettagli, modello 3D e statistiche.</p>
        </div>
      </div>
    `;
  }

  // Bind actions inside the inspection card
  private bindInspectEvents(player: Player): void {
    document.getElementById('btn-inspect-equip')?.addEventListener('click', (e) => {
      const idx = Number((e.currentTarget as HTMLElement).dataset.bagIndex);
      this.equipBagIndex(player, idx);
    });

    document.getElementById('btn-inspect-scrap')?.addEventListener('click', (e) => {
      const idx = Number((e.currentTarget as HTMLElement).dataset.bagIndex);
      const itemToScrap = player.bag[idx];
      if (itemToScrap) {
        player.gold += itemToScrap.goldValue;
        player.bag.splice(idx, 1);
        sound.coin();
        this.selectedBagIndex = Math.max(0, this.selectedBagIndex - 1);
        this.showInventory(player);
      }
    });

    document.getElementById('btn-inspect-unequip')?.addEventListener('click', (e) => {
      const slot = (e.currentTarget as HTMLElement).dataset.slot as ItemSlot;
      if (slot) {
        this.unequipSlot(player, slot);
      }
    });
  }

  // Mount 3D Item Inspector
  private mount3DInspector(player: Player): void {
    const canvas = document.getElementById('inspect-3d-canvas') as HTMLCanvasElement | null;
    if (!canvas) {
      item3DViewer.stop();
      return;
    }
    let itemToInspect: Item | undefined;
    if (this.selectedEquipSlot && player.equip[this.selectedEquipSlot]) {
      itemToInspect = player.equip[this.selectedEquipSlot];
    } else if (this.selectedBagIndex >= 0 && player.bag[this.selectedBagIndex]) {
      itemToInspect = player.bag[this.selectedBagIndex];
    }
    if (itemToInspect) {
      item3DViewer.mount(canvas, itemToInspect);
    } else {
      item3DViewer.stop();
    }
  }

  // Mount 3D Hero Preview Viewer in Paperdoll
  private mount3DHeroViewer(player: Player): void {
    const canvas = document.getElementById('hero-3d-canvas') as HTMLCanvasElement | null;
    if (!canvas) {
      hero3DViewer.stop();
      return;
    }
    hero3DViewer.mount(canvas, player);
  }

  // Update selection without full re-render
  private updateSelectionAndInspect(player: Player): void {
    if (!this.inventoryPanel) return;

    // 1. Update selection on bag tiles
    this.inventoryPanel.querySelectorAll('.bp-slot-tile').forEach(t => {
      const idx = Number((t as HTMLElement).dataset.bagIndex);
      if (this.selectedEquipSlot === null && idx === this.selectedBagIndex) {
        t.classList.add('selected');
      } else {
        t.classList.remove('selected');
      }
    });

    // 2. Update selection on paperdoll slots
    this.inventoryPanel.querySelectorAll('.pd-slot-box').forEach(s => {
      const sl = (s as HTMLElement).dataset.slot;
      if (this.selectedEquipSlot === sl) {
        s.classList.add('selected');
      } else {
        s.classList.remove('selected');
      }
    });

    // 3. Render ONLY the inspect panel
    const inspectPanel = document.getElementById('inv-inspect-panel');
    if (inspectPanel) {
      inspectPanel.innerHTML = this.renderInspectHtml(player);
      this.bindInspectEvents(player);
      this.mount3DInspector(player);
    }
  }

  // --- 3. Modern User-Friendly Inventory & Paperdoll Sheet ---
  public showInventory(player: Player): void {
    this.hideAll();
    if (!this.overlay || !this.inventoryPanel) return;

    this.overlay.classList.add('active');
    this.inventoryPanel.style.display = 'flex';

    const slotNames: Record<ItemSlot, string> = {
      weapon: 'Arma Principale',
      armor: 'Corazza / Tunica',
      helm: 'Elmo / Diadema',
      ring: 'Anello della Trama',
      relic: 'Reliquia Sacra'
    };
    const slotShortNames: Record<ItemSlot, string> = {
      weapon: 'Arma',
      armor: 'Corazza',
      helm: 'Elmo',
      ring: 'Anello',
      relic: 'Reliquia'
    };
    const slotIcons: Record<ItemSlot, string> = {
      weapon: '🗡️',
      armor: '🛡️',
      helm: '🪖',
      ring: '💍',
      relic: '📜'
    };
    const classIcons: Record<ClassId, string> = {
      paladin: '🛡️',
      wizard: '🔮',
      rogue: '🗡️',
      fighter: '⚔️',
      cleric: '✨'
    };

    // Helper to render an anatomical paperdoll slot
    const renderPaperdollSlot = (s: ItemSlot) => {
      const item = player.equip[s];
      const isSelected = this.selectedEquipSlot === s;
      if (!item) {
        return `
          <div class="pd-slot-box empty ${isSelected ? 'selected' : ''}" data-slot="${s}" title="Slot ${slotNames[s]} (Vuoto)">
            <span class="pd-slot-ghost-icon">${slotIcons[s]}</span>
            <span class="pd-slot-tag">${slotShortNames[s]}</span>
          </div>
        `;
      }
      const rar = RARITIES[item.rarity];
      return `
        <div class="pd-slot-box occupied ${isSelected ? 'selected' : ''}" data-slot="${s}" style="--rar-color:${rar.color};" title="${item.name} (${rar.name} Liv. ${item.ilvl})">
          <span class="pd-slot-icon">${item.icon || slotIcons[s]}</span>
          <span class="pd-slot-ilvl">L.${item.ilvl}</span>
          <span class="pd-slot-tag">${slotShortNames[s]}</span>
          <button class="pd-unequip-btn" data-slot="${s}" title="Togli e metti nello zaino">✕</button>
        </div>
      `;
    };

    // Categorized Filtering for Bag
    const filteredBag = player.bag
      .map((item, originalIndex) => ({ item, originalIndex }))
      .filter(({ item }) => {
        if (this.inventoryTab === 'all') return true;
        if (this.inventoryTab === 'weapon') return item.slot === 'weapon';
        if (this.inventoryTab === 'armor') return item.slot === 'armor';
        if (this.inventoryTab === 'accessory') return item.slot === 'helm' || item.slot === 'ring' || item.slot === 'relic';
        return true;
      });

    // Counts by category
    const countAll = player.bag.length;
    const countWeapon = player.bag.filter(it => it.slot === 'weapon').length;
    const countArmor = player.bag.filter(it => it.slot === 'armor').length;
    const countAccessory = player.bag.filter(it => it.slot === 'helm' || it.slot === 'ring' || it.slot === 'relic').length;

    // Common items scrap calculation
    let commonGoldSum = 0;
    let commonCount = 0;
    player.bag.forEach(it => {
      if (it.rarity === 'common') {
        commonGoldSum += it.goldValue;
        commonCount++;
      }
    });

    // Validate selectedBagIndex
    if (filteredBag.length > 0) {
      const existsInFilter = filteredBag.some(f => f.originalIndex === this.selectedBagIndex);
      if (!existsInFilter && this.selectedEquipSlot === null) {
        this.selectedBagIndex = filteredBag[0].originalIndex;
      }
    } else {
      if (this.selectedEquipSlot === null) {
        this.selectedBagIndex = -1;
      }
    }

    // Build RPG Backpack Grid (render items + empty socket tiles up to 20 or more)
    const totalDisplaySlots = Math.max(20, Math.ceil(filteredBag.length / 4) * 4);
    let bagTilesHtml = '';
    for (let slotIdx = 0; slotIdx < totalDisplaySlots; slotIdx++) {
      if (slotIdx < filteredBag.length) {
        const { item, originalIndex } = filteredBag[slotIdx];
        const rar = RARITIES[item.rarity];
        const isSelected = (this.selectedEquipSlot === null && originalIndex === this.selectedBagIndex);
        const isUpgrade = this.isItemUpgrade(item, player.equip[item.slot]);

        bagTilesHtml += `
          <div class="bp-slot-tile occupied ${isSelected ? 'selected' : ''} ${isUpgrade ? 'is-upgrade' : ''}"
               data-bag-index="${originalIndex}"
               style="--rar-color:${rar.color};"
               title="${item.name} · ${rar.name} Liv. ${item.ilvl} · Clic: Dettagli · Doppio Clic: Equipaggia">
            <div class="bp-tile-icon">${item.icon || '📦'}</div>
            <div class="bp-tile-ilvl">L.${item.ilvl}</div>
            ${isUpgrade ? '<div class="bp-tile-upgrade-arrow" title="Miglioramento per il tuo equipaggiamento!">▲</div>' : ''}
            <div class="bp-tile-slot-name">${slotShortNames[item.slot]}</div>
            <button class="bp-quick-equip-btn" data-bag-index="${originalIndex}" title="Equipaggia subito">⚡</button>
          </div>
        `;
      } else {
        bagTilesHtml += `
          <div class="bp-slot-tile empty" title="Slot Zaino Vuoto">
            <span class="bp-empty-dot">·</span>
          </div>
        `;
      }
    }

    // Render full inventory modal layout
    this.inventoryPanel.innerHTML = `
      <div class="inventory-modern-layout">
        <!-- TOP STATUS BAR -->
        <div class="inv-top-bar">
          <div class="inv-hero-identity">
            <div class="inv-hero-avatar-ring">🛡️</div>
            <div class="inv-hero-titles">
              <div class="inv-hero-name">${player.subclass.name} <span class="inv-hero-lvl-badge">Liv. ${player.level}</span></div>
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

        <!-- MAIN 2-COLUMN STAGE -->
        <div class="inv-main-stage">

          <!-- LEFT COLUMN: ANATOMICAL HERO PAPERDOLL + STATS BOARD -->
          <div class="inv-hero-column">
            <div class="paperdoll-showcase">
              <div class="paperdoll-title-bar">
                <div class="pd-title-left">
                  <span class="pd-title-main">🛡️ EQUIPAGGIAMENTO INDOSSATO</span>
                  <span class="paperdoll-hint">Clicca uno slot per ispezionare il pezzo</span>
                </div>
                <div class="pd-hero-badge" title="Specializzazione Attuale">
                  <span class="pd-badge-icon">${classIcons[player.classId] || '⚔️'}</span>
                  <span class="pd-badge-name">${player.subclass.name}</span>
                </div>
              </div>

              <div class="paperdoll-stage">
                <!-- 3D Player Character Live Stage -->
                <div class="hero-3d-stage-wrap">
                  <canvas id="hero-3d-canvas" class="hero-3d-canvas" width="230" height="270"></canvas>
                  <div class="hero-3d-pedestal-glow"></div>
                  <div class="hero-3d-hint">🔄 Ruota l'eroe a 360°</div>
                </div>

                <!-- Anatomical 5 Gear Slots Framing Hero -->
                <div class="pd-slot-pos pd-pos-helm">
                  ${renderPaperdollSlot('helm')}
                </div>
                <div class="pd-slot-pos pd-pos-weapon">
                  ${renderPaperdollSlot('weapon')}
                </div>
                <div class="pd-slot-pos pd-pos-armor">
                  ${renderPaperdollSlot('armor')}
                </div>
                <div class="pd-slot-pos pd-pos-relic">
                  ${renderPaperdollSlot('relic')}
                </div>
                <div class="pd-slot-pos pd-pos-ring">
                  ${renderPaperdollSlot('ring')}
                </div>
              </div>
            </div>

            <!-- HERO STATS CARD -->
            <div class="hero-stats-card">
              <div class="stats-card-header">📊 ATTRIBUTI TOTALI DELL’EROE</div>
              <div class="stats-board-grid">
                <div class="stat-badge hp" title="Punti Vita Attuali / Massimi">
                  <span class="stat-ico">💖</span>
                  <span class="stat-name">Salute</span>
                  <span class="stat-num">${Math.round(player.hp)} / ${player.maxHp}</span>
                </div>
                <div class="stat-badge dmg" title="Danno Base per Colpo">
                  <span class="stat-ico">⚔️</span>
                  <span class="stat-name">Attacco</span>
                  <span class="stat-num">${player.stats.damage % 1 === 0 ? player.stats.damage : player.stats.damage.toFixed(1)}</span>
                </div>
                <div class="stat-badge arm" title="Riduzione Danno Fisico">
                  <span class="stat-ico">🛡️</span>
                  <span class="stat-name">Armatura</span>
                  <span class="stat-num">${player.stats.armor}</span>
                </div>
                <div class="stat-badge spd" title="Velocità di Movimento">
                  <span class="stat-ico">⚡</span>
                  <span class="stat-name">Velocità</span>
                  <span class="stat-num">${player.stats.speed.toFixed(1)}</span>
                </div>
                <div class="stat-badge crit" title="Probabilità di Colpo Critico">
                  <span class="stat-ico">🎯</span>
                  <span class="stat-name">Critico</span>
                  <span class="stat-num">${player.stats.critChance}%</span>
                </div>
                <div class="stat-badge cdmg" title="Moltiplicatore Danno Critico">
                  <span class="stat-ico">💥</span>
                  <span class="stat-name">Danno Crit.</span>
                  <span class="stat-num">x${player.stats.critDamage.toFixed(1)}</span>
                </div>
                <div class="stat-badge rgn" title="Rigenerazione Vita al Secondo">
                  <span class="stat-ico">🌿</span>
                  <span class="stat-name">Rigeneraz.</span>
                  <span class="stat-num">+${player.stats.hpRegen.toFixed(1)}/s</span>
                </div>
                <div class="stat-badge ls" title="Percentuale Danno Convertito in Vita">
                  <span class="stat-ico">🩸</span>
                  <span class="stat-name">Vampirismo</span>
                  <span class="stat-num">${player.stats.lifesteal}%</span>
                </div>
                <div class="stat-badge sp" title="Potenza Magica e Scalare Abilità">
                  <span class="stat-ico">✨</span>
                  <span class="stat-name">Magia</span>
                  <span class="stat-num">${player.stats.spellPower}</span>
                </div>
                <div class="stat-badge cdr" title="Riduzione Tempo di Recupero">
                  <span class="stat-ico">⏳</span>
                  <span class="stat-name">CDR</span>
                  <span class="stat-num">${player.stats.cooldownReduction}%</span>
                </div>
              </div>
            </div>
          </div>

          <!-- RIGHT COLUMN: BACKPACK TILES & INSPECT / COMPARISON PANEL -->
          <div class="inv-backpack-column">
            <!-- Backpack Toolbar & Categories -->
            <div class="backpack-header-bar">
              <div class="backpack-title-row">
                <div class="bp-title">🎒 ZAINO <span class="bp-capacity">(${player.bag.length} / 24)</span></div>
                <div class="bp-bulk-actions">
                  <button id="btn-auto-equip-best" class="btn-bp-action primary" title="Equipaggia automaticamente i pezzi migliori">
                    ⚡ Equipaggia Migliori
                  </button>
                  <button id="btn-scrap-commons" class="btn-bp-action danger ${commonCount === 0 ? 'disabled' : ''}" title="Smonta tutti gli oggetti Comuni per ottenere Oro">
                    💰 Smonta Comuni ${commonCount > 0 ? `(+${commonGoldSum})` : ''}
                  </button>
                </div>
              </div>

              <div class="bp-category-tabs">
                <button class="bp-tab-btn ${this.inventoryTab === 'all' ? 'active' : ''}" data-inv-tab="all">
                  🎒 Tutti (${countAll})
                </button>
                <button class="bp-tab-btn ${this.inventoryTab === 'weapon' ? 'active' : ''}" data-inv-tab="weapon">
                  ⚔️ Armi (${countWeapon})
                </button>
                <button class="bp-tab-btn ${this.inventoryTab === 'armor' ? 'active' : ''}" data-inv-tab="armor">
                  🛡️ Armature (${countArmor})
                </button>
                <button class="bp-tab-btn ${this.inventoryTab === 'accessory' ? 'active' : ''}" data-inv-tab="accessory">
                  💍 Accessori (${countAccessory})
                </button>
              </div>
            </div>

            <!-- RPG Inventory Slots Grid -->
            <div class="backpack-grid-container" id="backpack-grid-container">
              ${bagTilesHtml}
            </div>

            <!-- Bottom Inspect & Comparison Card -->
            <div id="inv-inspect-panel" class="inv-inspect-panel">
              ${this.renderInspectHtml(player)}
            </div>
          </div>
        </div>
      </div>
    `;

    // --- EVENT LISTENERS ---

    // Close button
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

    // Category Tabs click
    this.inventoryPanel.querySelectorAll('.bp-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = (e.currentTarget as HTMLElement).dataset.invTab as 'all' | 'weapon' | 'armor' | 'accessory';
        if (tab) {
          this.inventoryTab = tab;
          sound.coin();
          this.showInventory(player);
        }
      });
    });

    // Auto-Equip Best items
    document.getElementById('btn-auto-equip-best')?.addEventListener('click', () => {
      let equippedCount = 0;
      const slotsList: ItemSlot[] = ['weapon', 'armor', 'helm', 'ring', 'relic'];
      for (const s of slotsList) {
        const candidates = player.bag
          .map((item, index) => ({ item, index }))
          .filter(({ item }) => item.slot === s && this.isItemUpgrade(item, player.equip[s]));

        if (candidates.length > 0) {
          candidates.sort((a, b) => this.getItemPowerScore(b.item) - this.getItemPowerScore(a.item));
          const best = candidates[0];
          const oldEquip = player.equip[s];
          player.equip[s] = best.item;
          player.bag.splice(best.index, 1);
          if (oldEquip) player.bag.push(oldEquip);
          equippedCount++;
        }
      }
      if (equippedCount > 0) {
        player.recalculateStats();
        sound.chestOpen();
        this.showInventory(player);
      }
    });

    // Scrap all common items
    document.getElementById('btn-scrap-commons')?.addEventListener('click', () => {
      if (commonCount > 0) {
        player.bag = player.bag.filter(item => item.rarity !== 'common');
        player.gold += commonGoldSum;
        sound.coin();
        this.selectedBagIndex = 0;
        this.showInventory(player);
      }
    });

    // Paperdoll Slots click & unequip
    this.inventoryPanel.querySelectorAll('.pd-slot-box').forEach(box => {
      box.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const s = (box as HTMLElement).dataset.slot as ItemSlot;
        // Direct unequip button clicked:
        if (target.closest('.pd-unequip-btn')) {
          e.stopPropagation();
          if (s) this.unequipSlot(player, s);
          return;
        }

        // Slot clicked: inspect currently equipped item
        if (s && player.equip[s]) {
          this.selectedEquipSlot = s;
          sound.coin();
          this.updateSelectionAndInspect(player);
        }
      });
    });

    // Backpack Slot Tiles Click, Double-Click, ContextMenu (Right-Click)
    this.inventoryPanel.querySelectorAll('.bp-slot-tile.occupied').forEach(tile => {
      tile.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const idx = Number((tile as HTMLElement).dataset.bagIndex);

        // 1. Quick-equip button on tile
        if (target.closest('.bp-quick-equip-btn')) {
          e.stopPropagation();
          this.equipBagIndex(player, idx);
          return;
        }

        // 2. Timestamp-based double-click detection (100% reliable across all browsers)
        const now = Date.now();
        if (this.lastBagClickIndex === idx && (now - this.lastBagClickTime) < 400) {
          this.lastBagClickTime = 0;
          this.lastBagClickIndex = -1;
          this.equipBagIndex(player, idx);
          return;
        }

        this.lastBagClickTime = now;
        this.lastBagClickIndex = idx;

        // 3. Single click: update selection and inspect card without destroying the DOM!
        this.selectedBagIndex = idx;
        this.selectedEquipSlot = null;
        sound.coin();
        this.updateSelectionAndInspect(player);
      });

      // Native double-click event listener
      tile.addEventListener('dblclick', (e) => {
        e.preventDefault();
        const idx = Number((tile as HTMLElement).dataset.bagIndex);
        this.equipBagIndex(player, idx);
      });

      // Right-click contextmenu event to equip (PC RPG Standard)
      tile.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const idx = Number((tile as HTMLElement).dataset.bagIndex);
        this.equipBagIndex(player, idx);
      });
    });

    // Bind initial inspect card actions & 3D hero viewer
    this.bindInspectEvents(player);
    this.mount3DInspector(player);
    this.mount3DHeroViewer(player);
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
      this.close();
      if (this.onResumeGame) this.onResumeGame();
    });

    // Teleport buttons
    this.mapPanel.querySelectorAll<HTMLButtonElement>('.btn-wp-teleport.active').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetKey = btn.dataset.targetKey;
        const targetRoom = waypoints.find(r => `${r.x},${r.y}` === targetKey);
        if (targetRoom) {
          sound.teleport();
          this.close();
          if (this.onResumeGame) this.onResumeGame();
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
          this.close();
          if (this.onResumeGame) this.onResumeGame();
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

  // --- 8. ANCESTRAL SANCTUM (Meta-Progression & Permanent Upgrades) ---
  public showSanctum(): void {
    this.hideAll();
    if (!this.overlay || !this.sanctumPanel) return;

    this.overlay.classList.add('active');
    this.sanctumPanel.style.display = 'flex';

    const renderSanctum = () => {
      const essence = metaProgression.getEssence();
      const meta = metaProgression.getData();

      let html = `
        <div class="sanctum-modal-content">
          <div class="sanctum-header">
            <div class="sanctum-title-wrap">
              <span class="sanctum-crest">🏛️</span>
              <div>
                <h2 class="sanctum-title">Santuario Ancestrale dei Renegades</h2>
                <p class="sanctum-subtitle">Canalizza l'Essenza Astrale raccolta nelle spedizioni per infondere benedizioni permanenti ai tuoi eroi.</p>
              </div>
            </div>
            <div class="sanctum-essence-badge">
              <span class="essence-sparkle">✨</span>
              <span class="essence-label">Essenza Astrale:</span>
              <span class="essence-value">${essence}</span>
            </div>
          </div>

          <div class="sanctum-grid">
      `;

      META_UPGRADES.forEach(u => {
        const currentRank = meta.upgrades[u.id] || 0;
        const maxLvl = u.maxLevel || u.maxRank;
        const isMax = currentRank >= maxLvl;
        const nextCost = metaProgression.getUpgradeCost(u.id);
        const canBuy = !isMax && essence >= nextCost;
        const currDesc = u.perLevelDesc ? u.perLevelDesc(currentRank) : `Grado ${currentRank}`;
        const nextDesc = u.perLevelDesc ? u.perLevelDesc(currentRank + 1) : `Grado ${currentRank + 1}`;

        html += `
          <div class="sanctum-card ${isMax ? 'sanctum-max' : ''}">
            <div class="sanctum-card-header">
              <span class="sanctum-card-icon">${u.icon}</span>
              <div class="sanctum-card-titles">
                <h3 class="sanctum-card-name">${u.name}</h3>
                <span class="sanctum-card-rank">Grado ${currentRank} / ${maxLvl}</span>
              </div>
            </div>
            <p class="sanctum-card-desc">${u.desc}</p>
            <div class="sanctum-card-stat">
              <span>Effetto Attuale: <b>${currDesc}</b></span>
              ${!isMax ? `<span class="next-stat">Prossimo: <b>${nextDesc}</b></span>` : ''}
            </div>
            <div class="sanctum-card-footer">
              <div class="sanctum-cost-label">
                ${isMax ? '🏆 <span class="text-gold">Grado Massimo</span>' : `Costo: ✨ <b>${nextCost}</b> Essenza`}
              </div>
              <button class="btn-sanctum-buy ${canBuy ? 'active' : 'disabled'}" data-upgrade-id="${u.id}" ${!canBuy ? 'disabled' : ''}>
                ${isMax ? 'Completato' : 'Sblocca Grado'}
              </button>
            </div>
          </div>
        `;
      });

      html += `
          </div>

          <div class="sanctum-stats-footer">
            <div class="sanctum-run-stats">
              Spedizioni Totali: <b>${meta.totalRuns}</b> · Boss Sconfitti: <b>${meta.bossesDefeated}</b> · Nemici Abbattuti: <b>${meta.totalKills}</b>
            </div>
            <button id="btn-back-from-sanctum" class="btn-back">⬅️ Torna al Menu Principale</button>
          </div>
        </div>
      `;

      this.sanctumPanel!.innerHTML = html;

      document.getElementById('btn-back-from-sanctum')?.addEventListener('click', () => {
        this.showIntro();
      });

      this.sanctumPanel!.querySelectorAll<HTMLButtonElement>('.btn-sanctum-buy.active').forEach(btn => {
        btn.addEventListener('click', () => {
          const uId = btn.dataset.upgradeId;
          if (uId && metaProgression.purchaseUpgrade(uId)) {
            sound.levelUp();
            renderSanctum();
          }
        });
      });
    };

    renderSanctum();
  }

  // --- 9. DARK PACTS (Patti con l'Ombra / Altare delle Ombre) ---
  public showDarkPacts(player: Player, onChosen?: (pact: any) => void): void {
    this.hideAll();
    if (!this.overlay || !this.pactsPanel) return;

    this.overlay.classList.add('active');
    this.pactsPanel.style.display = 'flex';

    const pacts = getRandomPacts(3);

    let html = `
      <div class="pacts-modal-content">
        <div class="pacts-header">
          <div class="pacts-crest">🔮</div>
          <h2 class="pacts-title">PATTO OSCURO DELL'ABISSO</h2>
          <p class="pacts-subtitle">L'Altare delle Ombre risponde alla tua brama di potere. Accetta una grave maledizione per ottenere una benedizione proibita per il resto della spedizione.</p>
        </div>

        <div class="pacts-grid">
    `;

    pacts.forEach(pact => {
      html += `
        <div class="pact-card">
          <div class="pact-card-glow"></div>
          <div class="pact-icon-wrap">${pact.icon}</div>
          <h3 class="pact-name">${pact.name}</h3>
          <p class="pact-flavor">"${pact.flavor || pact.curseTitle}"</p>

          <div class="pact-effect-box boon">
            <span class="pact-effect-label">✨ ${pact.boonTitle.toUpperCase()}:</span>
            <span class="pact-effect-text">${pact.boonDesc}</span>
          </div>

          <div class="pact-effect-box curse">
            <span class="pact-effect-label">💀 ${pact.curseTitle.toUpperCase()}:</span>
            <span class="pact-effect-text">${pact.curseDesc}</span>
          </div>

          <button class="btn-seal-pact" data-pact-id="${pact.id}">
            🩸 Sigilla il Patto
          </button>
        </div>
      `;
    });

    html += `
        </div>
        <div class="pacts-footer-actions">
          <button id="btn-reject-pact" class="btn-reject-pact">Allontanati dall'Altare (Rifiuta)</button>
        </div>
      </div>
    `;

    this.pactsPanel.innerHTML = html;

    document.getElementById('btn-reject-pact')?.addEventListener('click', () => {
      this.close();
      if (this.onResumeGame) this.onResumeGame();
    });

    this.pactsPanel.querySelectorAll<HTMLButtonElement>('.btn-seal-pact').forEach(btn => {
      btn.addEventListener('click', () => {
        const pId = btn.dataset.pactId;
        const chosen = pacts.find(p => p.id === pId);
        if (chosen) {
          player.activePacts.push(chosen);
          if (chosen.applyCurse) chosen.applyCurse(player);
          if (chosen.applyBoon) chosen.applyBoon(player);
          player.recalculateStats();
          sound.playerHurt();
          sound.levelUp();
          this.close();
          if (onChosen) onChosen(chosen);
          if (this.onResumeGame) this.onResumeGame();
        }
      });
    });
  }

  // --- 10. BESTIARY & WEAPONS CODEX ---
  public showCodex(fromMenu: boolean = true): void {
    this.hideAll();
    if (!this.overlay || !this.codexPanel) return;

    this.overlay.classList.add('active');
    this.codexPanel.style.display = 'flex';

    let currentTab: 'bestiary' | 'weapons' = 'bestiary';

    const renderCodex = () => {
      let contentHtml = '';

      if (currentTab === 'bestiary') {
        contentHtml = `
          <div class="codex-grid bestiary-grid">
            ${BESTIARY_DATA.map(m => `
              <div class="bestiary-card">
                <div class="bestiary-card-top">
                  <span class="bestiary-avatar">${m.icon}</span>
                  <div class="bestiary-card-titles">
                    <h3 class="bestiary-name">${m.name}</h3>
                    <div class="bestiary-badges">
                      <span class="badge-role">${m.type}</span>
                      <span class="badge-zone">${m.act}</span>
                    </div>
                  </div>
                </div>
                <div class="bestiary-stats-row">
                  <span>❤️ PV: <b>${m.hp}</b></span>
                  <span>⚔️ Danno: <b>${m.damage}</b></span>
                </div>
                <div class="bestiary-weakness">
                  <span class="weak-lbl">🎯 Debolezza:</span>
                  <span class="weak-val">${m.weakness}</span>
                </div>
                <p class="bestiary-lore">"${m.description}"</p>
              </div>
            `).join('')}
          </div>
        `;
      } else {
        contentHtml = `
          <div class="codex-grid weapons-grid">
            ${WEAPON_COMPENDIUM.map(w => `
              <div class="weapon-codex-card">
                <div class="weapon-codex-header">
                  <span class="weapon-codex-icon">${w.icon}</span>
                  <div>
                    <h3 class="weapon-codex-name">${w.name}</h3>
                    <span class="weapon-codex-class">${w.classes} · ${w.style}</span>
                  </div>
                </div>
                <div class="weapon-codex-pattern">
                  <b>Scala Danno & Combo:</b> ${w.damageScale}
                </div>
                <p class="weapon-codex-lore">"${w.description}"</p>
              </div>
            `).join('')}
          </div>
        `;
      }

      this.codexPanel!.innerHTML = `
        <div class="codex-modal-content">
          <div class="codex-header">
            <div class="codex-title-wrap">
              <span class="codex-crest">📖</span>
              <div>
                <h2 class="codex-title">Codex dei Renegades</h2>
                <p class="codex-subtitle">Compendio di studio sulle creature di Okkarn e l'arsenale bellico a disposizione.</p>
              </div>
            </div>
            <div class="codex-tabs">
              <button id="btn-codex-tab-bestiary" class="btn-codex-tab ${currentTab === 'bestiary' ? 'active' : ''}">👹 Bestiario (${BESTIARY_DATA.length})</button>
              <button id="btn-codex-tab-weapons" class="btn-codex-tab ${currentTab === 'weapons' ? 'active' : ''}">⚔️ Arsenale (${WEAPON_COMPENDIUM.length})</button>
            </div>
            <button id="btn-close-codex" class="modal-close-btn">&times;</button>
          </div>

          <div class="codex-body">
            ${contentHtml}
          </div>

          <div class="modal-footer-actions">
            <button id="btn-back-from-codex" class="btn-back">${fromMenu ? '⬅️ Torna al Menu Principale' : '✕ Chiudi e Riprendi'}</button>
          </div>
        </div>
      `;

      document.getElementById('btn-close-codex')?.addEventListener('click', () => {
        if (fromMenu) {
          this.showIntro();
        } else {
          this.close();
          if (this.onResumeGame) this.onResumeGame();
        }
      });

      document.getElementById('btn-back-from-codex')?.addEventListener('click', () => {
        if (fromMenu) {
          this.showIntro();
        } else {
          this.close();
          if (this.onResumeGame) this.onResumeGame();
        }
      });

      document.getElementById('btn-codex-tab-bestiary')?.addEventListener('click', () => {
        currentTab = 'bestiary';
        renderCodex();
      });

      document.getElementById('btn-codex-tab-weapons')?.addEventListener('click', () => {
        currentTab = 'weapons';
        renderCodex();
      });
    };

    renderCodex();
  }

  // --- 11. CELESTIAL FORGE (Forgia Runica di Raffinamento) ---
  public showCelestialForge(player: Player, onUpgrade?: () => void): void {
    this.hideAll();
    if (!this.overlay || !this.forgePanel) return;

    this.overlay.classList.add('active');
    this.forgePanel.style.display = 'flex';

    const renderForge = () => {
      const equipSlots: { slot: ItemSlot; label: string; icon: string }[] = [
        { slot: 'weapon', label: 'Arma Impugnata', icon: '⚔️' },
        { slot: 'armor', label: 'Armatura da Guerra', icon: '🛡️' },
        { slot: 'helm', label: 'Elmo / Copricapo', icon: '🪖' },
        { slot: 'ring', label: 'Anello Runico', icon: '💍' },
        { slot: 'relic', label: 'Reliquia Sacra', icon: '🏺' }
      ];

      const equippedItems = equipSlots
        .map(s => ({ ...s, item: player.equip[s.slot] }))
        .filter(s => s.item !== undefined) as { slot: ItemSlot; label: string; icon: string; item: Item }[];

      const filterItems = equippedItems.filter(({ slot }) => {
        if (this.forgeTab === 'weapon') return slot === 'weapon';
        if (this.forgeTab === 'armor') return slot === 'armor';
        if (this.forgeTab === 'accessory') return slot === 'helm' || slot === 'ring' || slot === 'relic';
        return true;
      });

      let cardsHtml = '';
      if (filterItems.length === 0) {
        cardsHtml = `
          <div class="forge-empty-notice">
            <span class="forge-empty-icon">💎</span>
            <p>Nessun oggetto in questa categoria! Seleziona "Tutti" oppure apri l'inventario per equipaggiare armi o armature.</p>
          </div>
        `;
      } else {
        cardsHtml = filterItems.map(({ slot, label, icon, item }) => {
          const currentLvl = item.upgradeLevel || 0;
          const upgradeCost = Math.max(35, (currentLvl + 1) * 45);
          const canAfford = player.gold >= upgradeCost;
          const rarityCfg = RARITIES[item.rarity] || { color: '#94a3b8' };

          const statPreviews: string[] = [];
          if (slot === 'weapon') {
            const curDmg = item.stats.damage || 0;
            const nextDmg = Math.round(curDmg * 1.25 + 4);
            statPreviews.push(`Danno: <b>${curDmg}</b> ➔ <b class="stat-boost">+${nextDmg}</b>`);
            const curCrit = item.stats.critChance || 0;
            statPreviews.push(`Critico: <b>+${curCrit}%</b> ➔ <b class="stat-boost">+${curCrit + 4}%</b>`);
          } else if (slot === 'armor') {
            const curArm = item.stats.armor || 0;
            const nextArm = Math.round(curArm * 1.30 + 3);
            statPreviews.push(`Armatura: <b>${curArm}</b> ➔ <b class="stat-boost">+${nextArm}</b>`);
            const curHp = item.stats.maxHp || 0;
            statPreviews.push(`Salute Massima: <b>+${curHp}</b> ➔ <b class="stat-boost">+${curHp + 25}</b>`);
          } else {
            for (const [k, v] of Object.entries(item.stats)) {
              if (v && typeof v === 'number') {
                const sLabel = STAT_LABELS_IT[k as keyof CharacterStats] || k;
                const nextVal = Math.round(v * 1.25 + 2);
                statPreviews.push(`${sLabel}: <b>+${v}</b> ➔ <b class="stat-boost">+${nextVal}</b>`);
              }
            }
          }

          return `
            <div class="forge-item-card" style="--card-rarity:${rarityCfg.color}; border-color:${rarityCfg.color}44;">
              <div class="forge-card-header">
                <span class="forge-card-icon" style="background:${rarityCfg.color}22; border-color:${rarityCfg.color}">${item.icon}</span>
                <div class="forge-card-title-group">
                  <h3 class="forge-item-name" style="color:${rarityCfg.color}">
                    ${item.name} ${currentLvl > 0 ? `<span class="forge-lvl-pill">+${currentLvl}</span>` : ''}
                  </h3>
                  <div class="forge-slot-tag">${icon} ${label} · iLvl ${item.ilvl}</div>
                </div>
              </div>

              <div class="forge-stats-preview">
                ${statPreviews.map(p => `<div class="forge-stat-row">${p}</div>`).join('')}
              </div>

              <div class="forge-card-action">
                <div class="forge-cost-badge">
                  <span class="cost-gold-icon">💰</span>
                  <span class="cost-amount ${canAfford ? '' : 'cost-lacking'}">${upgradeCost} Oro</span>
                </div>
                <button class="btn-forge-upgrade ${canAfford ? 'active' : 'disabled'}" data-slot="${slot}" ${!canAfford ? 'disabled' : ''}>
                  🔨 Raffina (+${currentLvl + 1})
                </button>
              </div>
            </div>
          `;
        }).join('');
      }

      this.forgePanel!.innerHTML = `
        <div class="forge-modal-content">
          <div class="forge-header">
            <div class="forge-title-wrap">
              <span class="forge-crest">✨🔨</span>
              <div>
                <h2 class="forge-title">FORGIA RUNICA DEI SUSSURRI CELESTI</h2>
                <p class="forge-subtitle">Infondi il metallo stellare delle tue armi e armature per potenziarne i valori all'estremo.</p>
              </div>
            </div>
            <div class="forge-gold-badge">
              <span class="gold-icon">💰</span>
              <span class="gold-label">Oro:</span>
              <span class="gold-value">${player.gold}</span>
            </div>
            <button id="btn-close-forge-corner" class="modal-close-btn">&times;</button>
          </div>

          <!-- Category Filter Tabs -->
          <div class="forge-filter-tabs">
            <button class="forge-tab-btn ${this.forgeTab === 'all' ? 'active' : ''}" data-forge-tab="all">✨ Tutti (${equippedItems.length})</button>
            <button class="forge-tab-btn ${this.forgeTab === 'weapon' ? 'active' : ''}" data-forge-tab="weapon">⚔️ Armi</button>
            <button class="forge-tab-btn ${this.forgeTab === 'armor' ? 'active' : ''}" data-forge-tab="armor">🛡️ Corazze</button>
            <button class="forge-tab-btn ${this.forgeTab === 'accessory' ? 'active' : ''}" data-forge-tab="accessory">💍 Accessori</button>
          </div>

          <div class="forge-items-grid">
            ${cardsHtml}
          </div>

          <div class="modal-footer-actions">
            <button id="btn-close-forge" class="btn-back">✕ Chiudi e Riprendi</button>
          </div>
        </div>
      `;

      const closeForge = () => {
        this.close();
        if (this.onResumeGame) this.onResumeGame();
      };

      document.getElementById('btn-close-forge-corner')?.addEventListener('click', closeForge);
      document.getElementById('btn-close-forge')?.addEventListener('click', closeForge);

      // Filter tabs binding
      this.forgePanel!.querySelectorAll<HTMLButtonElement>('.forge-tab-btn').forEach(tabBtn => {
        tabBtn.addEventListener('click', () => {
          const tab = tabBtn.dataset.forgeTab as 'all' | 'weapon' | 'armor' | 'accessory' | undefined;
          if (tab && tab !== this.forgeTab) {
            this.forgeTab = tab;
            sound.btnClick();
            renderForge();
          }
        });
      });

      this.forgePanel!.querySelectorAll<HTMLButtonElement>('.btn-forge-upgrade.active').forEach(btn => {
        btn.addEventListener('click', () => {
          const slot = btn.dataset.slot as ItemSlot | undefined;
          if (!slot) return;
          const item = player.equip[slot];
          if (!item) return;

          const currentLvl = item.upgradeLevel || 0;
          const cost = Math.max(35, (currentLvl + 1) * 45);
          if (player.gold < cost) return;

          player.gold -= cost;
          item.upgradeLevel = currentLvl + 1;

          if (slot === 'weapon') {
            item.stats.damage = Math.round((item.stats.damage || 10) * 1.25 + 4);
            item.stats.critChance = Math.min(65, (item.stats.critChance || 5) + 4);
          } else if (slot === 'armor') {
            item.stats.armor = Math.round((item.stats.armor || 2) * 1.30 + 3);
            item.stats.maxHp = (item.stats.maxHp || 0) + 25;
          } else {
            for (const k of Object.keys(item.stats) as (keyof CharacterStats)[]) {
              const val = item.stats[k];
              if (val && typeof val === 'number') {
                item.stats[k] = Math.round(val * 1.25 + 2);
              }
            }
          }

          player.recalculateStats();
          sound.heavyChop();
          sound.levelUp();
          if (onUpgrade) onUpgrade();

          renderForge();
        });
      });
    };

    renderForge();
  }

  public isOpen(): boolean {
    return this.overlay ? this.overlay.classList.contains('active') : false;
  }

  public close(): void {
    this.hideAll();
  }
}

export const modals = new ModalManager();
