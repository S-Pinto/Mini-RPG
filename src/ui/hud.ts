// Heads-Up Display (HUD) and Minimap Engine
// The Albedo Renegades: Shadow of Elanthria

import type { Player } from '../entities/player.ts';
import type { DungeonRoom } from '../world/dungeonGenerator.ts';
import type { ZoneConfig } from '../types/game.ts';
import type { Enemy } from '../entities/enemy.ts';
import { CLASSES_DATA } from '../types/classesData.ts';

export class HudManager {
  private hpBarFill: HTMLElement | null = null;
  private hpText: HTMLElement | null = null;
  private xpBarFill: HTMLElement | null = null;
  private xpText: HTMLElement | null = null;
  private levelText: HTMLElement | null = null;
  private goldText: HTMLElement | null = null;
  private zoneText: HTMLElement | null = null;
  private characterName: HTMLElement | null = null;
  private bossBar: HTMLElement | null = null;
  private bossNameText: HTMLElement | null = null;
  private bossFill: HTMLElement | null = null;
  private bossHpPctText: HTMLElement | null = null;
  private minimapCanvas: HTMLCanvasElement | null = null;
  private minimapCtx: CanvasRenderingContext2D | null = null;

  // Desktop skill bar elements
  private dskAttackCd: HTMLElement | null = null;
  private dskS1Cd: HTMLElement | null = null;
  private dskS2Cd: HTMLElement | null = null;
  private dskS1Timer: HTMLElement | null = null;
  private dskS2Timer: HTMLElement | null = null;
  private dskS1Icon: HTMLElement | null = null;
  private dskS2Icon: HTMLElement | null = null;
  private dskS1Name: HTMLElement | null = null;
  private dskS2Name: HTMLElement | null = null;
  private dskAttackName: HTMLElement | null = null;
  private dskPotionCount: HTMLElement | null = null;
  private dskPotionCd: HTMLElement | null = null;
  private dskDashCd: HTMLElement | null = null;

  // Mobile skill cooldown indicators
  private mobS1Cd: HTMLElement | null = null;
  private mobS2Cd: HTMLElement | null = null;
  private mobS1Timer: HTMLElement | null = null;
  private mobS2Timer: HTMLElement | null = null;
  private mobS1Icon: HTMLElement | null = null;
  private mobS2Icon: HTMLElement | null = null;
  private mobS1Name: HTMLElement | null = null;
  private mobS2Name: HTMLElement | null = null;
  private mobPotionCount: HTMLElement | null = null;

  // Touch buttons for external access
  public skill1Btn: HTMLElement | null = null;
  public skill2Btn: HTMLElement | null = null;
  public potionBtn: HTMLElement | null = null;

  private lastClassId = '';

  public init(): void {
    this.hpBarFill = document.getElementById('hud-hp-fill');
    this.hpText = document.getElementById('hud-hp-text');
    this.xpBarFill = document.getElementById('hud-xp-fill');
    this.xpText = document.getElementById('hud-xp-text');
    this.levelText = document.getElementById('hud-level-text');
    this.goldText = document.getElementById('hud-gold-text');
    this.zoneText = document.getElementById('hud-zone-text');
    this.characterName = document.getElementById('hud-char-name');
    this.bossBar = document.getElementById('hud-boss-bar');
    this.bossNameText = document.getElementById('hud-boss-name');
    this.bossFill = document.getElementById('hud-boss-fill');
    this.bossHpPctText = document.getElementById('hud-boss-hp-pct');
    this.minimapCanvas = document.getElementById('minimap-canvas') as HTMLCanvasElement;
    if (this.minimapCanvas) this.minimapCtx = this.minimapCanvas.getContext('2d');

    // Desktop skill bar
    this.dskAttackCd = document.getElementById('dsk-attack-cd');
    this.dskS1Cd = document.getElementById('dsk-s1-cd');
    this.dskS2Cd = document.getElementById('dsk-s2-cd');
    this.dskS1Timer = document.getElementById('dsk-s1-timer');
    this.dskS2Timer = document.getElementById('dsk-s2-timer');
    this.dskS1Icon = document.getElementById('dsk-s1-icon');
    this.dskS2Icon = document.getElementById('dsk-s2-icon');
    this.dskS1Name = document.getElementById('dsk-s1-name');
    this.dskS2Name = document.getElementById('dsk-s2-name');
    this.dskAttackName = document.getElementById('dsk-attack-name');
    this.dskPotionCount = document.getElementById('dsk-potion-count');
    this.dskPotionCd = document.getElementById('dsk-potion-cd');
    this.dskDashCd = document.getElementById('dsk-dash-cd');

    // Mobile
    this.mobS1Cd = document.getElementById('mob-s1-cd');
    this.mobS2Cd = document.getElementById('mob-s2-cd');
    this.mobS1Timer = document.getElementById('mob-s1-timer');
    this.mobS2Timer = document.getElementById('mob-s2-timer');
    this.mobS1Icon = document.getElementById('mob-s1-icon');
    this.mobS2Icon = document.getElementById('mob-s2-icon');
    this.mobS1Name = document.getElementById('mob-s1-name');
    this.mobS2Name = document.getElementById('mob-s2-name');
    this.mobPotionCount = document.getElementById('mob-potion-count');

    this.skill1Btn = document.getElementById('btn-skill1');
    this.skill2Btn = document.getElementById('btn-skill2');
    this.potionBtn = document.getElementById('btn-potion');

    // Quick desktop click on potion slot
    const dskPotion = document.getElementById('dsk-potion');
    if (dskPotion) {
      dskPotion.addEventListener('click', () => {
        // Handled via player input if playing
      });
    }
  }

  private updateSkillInfo(player: Player): void {
    if (player.classId === this.lastClassId) return;
    this.lastClassId = player.classId;

    const cfg = CLASSES_DATA[player.classId];
    if (!cfg) return;

    // Desktop
    if (this.dskAttackName) this.dskAttackName.textContent = cfg.basicAttackName;
    if (this.dskS1Icon) this.dskS1Icon.textContent = cfg.skill1.icon;
    if (this.dskS2Icon) this.dskS2Icon.textContent = cfg.skill2.icon;
    if (this.dskS1Name) this.dskS1Name.textContent = cfg.skill1.name;
    if (this.dskS2Name) this.dskS2Name.textContent = cfg.skill2.name;

    // Mobile
    if (this.mobS1Icon) this.mobS1Icon.textContent = cfg.skill1.icon;
    if (this.mobS2Icon) this.mobS2Icon.textContent = cfg.skill2.icon;
    if (this.mobS1Name) this.mobS1Name.textContent = cfg.skill1.name.substring(0, 7).toUpperCase();
    if (this.mobS2Name) this.mobS2Name.textContent = cfg.skill2.name.substring(0, 7).toUpperCase();
  }

  public update(player: Player, currentRoom: DungeonRoom, allRooms: DungeonRoom[], zone: ZoneConfig, enemies: Enemy[]): void {
    this.updateSkillInfo(player);

    // 1. Player Vitals
    const hpPercent = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
    if (this.hpBarFill) {
      this.hpBarFill.style.width = `${hpPercent}%`;
      if (hpPercent > 50) {
        this.hpBarFill.style.background = `linear-gradient(90deg, #ff4d6d, #be123c)`;
      } else if (hpPercent > 25) {
        this.hpBarFill.style.background = `linear-gradient(90deg, #ff8800, #aa4400)`;
      } else {
        this.hpBarFill.style.background = `linear-gradient(90deg, #ff2222, #880000)`;
        this.hpBarFill.style.animation = 'hpPulse 0.8s ease-in-out infinite';
      }
      if (hpPercent > 25) this.hpBarFill.style.animation = '';
    }
    if (this.hpText) this.hpText.textContent = `${Math.ceil(player.hp)} / ${player.maxHp} PV`;

    const xpPercent = Math.max(0, Math.min(100, (player.xp / player.xpNext) * 100));
    if (this.xpBarFill) this.xpBarFill.style.width = `${xpPercent}%`;
    if (this.xpText) this.xpText.textContent = `${player.xp} / ${player.xpNext} EXP (${Math.round(xpPercent)}%)`;
    if (this.levelText) this.levelText.textContent = `Liv. ${player.level}`;
    if (this.goldText) this.goldText.textContent = `${player.gold} Oro`;
    if (this.characterName) this.characterName.textContent = `${player.subclass.name}`;
    if (this.zoneText) this.zoneText.textContent = zone.name;

    // 2. Cooldown Indicators & Countdown Timers
    const cfg = CLASSES_DATA[player.classId];
    const s1MaxCd = cfg?.skill1?.cd ?? 5.5;
    const s2MaxCd = cfg?.skill2?.cd ?? 4.0;

    const s1Progress = player.skill1Cd > 0 ? (player.skill1Cd / s1MaxCd) * 100 : 0;
    const s2Progress = player.skill2Cd > 0 ? (player.skill2Cd / s2MaxCd) * 100 : 0;
    const atkProgress = player.attackCd > 0 ? (player.attackCd / 0.6) * 100 : 0;
    const dashProgress = player.dashTimer > 0 ? 100 : 0;
    const potionProgress = player.potionCd > 0 ? (player.potionCd / 3.5) * 100 : 0;

    // Desktop Overlays & Countdown Numbers
    if (this.dskAttackCd) this.dskAttackCd.style.height = `${atkProgress}%`;
    if (this.dskS1Cd) this.dskS1Cd.style.height = `${s1Progress}%`;
    if (this.dskS2Cd) this.dskS2Cd.style.height = `${s2Progress}%`;
    if (this.dskDashCd) this.dskDashCd.style.height = `${dashProgress}%`;
    if (this.dskPotionCd) this.dskPotionCd.style.height = `${potionProgress}%`;

    if (this.dskS1Timer) {
      this.dskS1Timer.textContent = player.skill1Cd > 0 ? `${player.skill1Cd.toFixed(1)}s` : '';
    }
    if (this.dskS2Timer) {
      this.dskS2Timer.textContent = player.skill2Cd > 0 ? `${player.skill2Cd.toFixed(1)}s` : '';
    }
    if (this.dskPotionCount) {
      this.dskPotionCount.textContent = `x${player.potions}`;
    }

    // Mobile Rings & Timers
    if (this.mobS1Cd) {
      this.mobS1Cd.style.setProperty('--cd', `${s1Progress * 3.6}deg`);
      this.mobS1Cd.style.opacity = s1Progress > 0 ? '1' : '0';
    }
    if (this.mobS2Cd) {
      this.mobS2Cd.style.setProperty('--cd', `${s2Progress * 3.6}deg`);
      this.mobS2Cd.style.opacity = s2Progress > 0 ? '1' : '0';
    }
    if (this.mobS1Timer) {
      this.mobS1Timer.textContent = player.skill1Cd > 0 ? `${Math.ceil(player.skill1Cd)}s` : '';
    }
    if (this.mobS2Timer) {
      this.mobS2Timer.textContent = player.skill2Cd > 0 ? `${Math.ceil(player.skill2Cd)}s` : '';
    }
    if (this.mobPotionCount) {
      this.mobPotionCount.textContent = `x${player.potions}`;
    }

    // 3. Boss Bar
    const boss = enemies.find(e => e.stats.isBoss && !e.isDead);
    if (boss && this.bossBar) {
      this.bossBar.style.display = 'block';
      if (this.bossNameText) this.bossNameText.textContent = boss.stats.name;
      const bossHpPct = Math.max(0, Math.min(100, (boss.hp / boss.maxHp) * 100));
      if (this.bossFill) {
        this.bossFill.style.width = `${bossHpPct}%`;
      }
      if (this.bossHpPctText) {
        this.bossHpPctText.textContent = `${Math.ceil(bossHpPct)}%`;
      }
    } else if (this.bossBar) {
      this.bossBar.style.display = 'none';
    }

    // 4. Minimap rendering
    if (this.minimapCtx && this.minimapCanvas) {
      const ctx = this.minimapCtx;
      ctx.clearRect(0, 0, this.minimapCanvas.width, this.minimapCanvas.height);

      for (const r of allRooms) {
        if (!r.seen && r !== currentRoom) continue;
        const rx = 6 + r.x * 12;
        const ry = 6 + r.y * 12;

        if (r === currentRoom) ctx.fillStyle = '#ffffff';
        else if (r.visited) ctx.fillStyle = '#7a708c';
        else ctx.fillStyle = '#3c3547';
        ctx.fillRect(rx, ry, 9, 9);

        if (r.type === 'boss') {
          ctx.fillStyle = '#ff3355';
          ctx.fillRect(rx + 2, ry + 2, 5, 5);
        } else if (r.type === 'treasure') {
          ctx.fillStyle = '#ffd700';
          ctx.fillRect(rx + 2, ry + 2, 5, 5);
        } else if (r.type === 'shrine') {
          ctx.fillStyle = '#00ffff';
          ctx.fillRect(rx + 2, ry + 2, 5, 5);
        }
      }
    }
  }
}

export const hud = new HudManager();
