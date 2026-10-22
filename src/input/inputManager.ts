// Input Manager for Mobile Touch & PC Keyboard/Mouse with Smart Auto-Aim
// The Albedo Renegades: Shadow of Elanthria

import * as THREE from 'three';
import type { Enemy } from '../entities/enemy.ts';
import type { Player } from '../entities/player.ts';

export class InputManager {
  public moveDirX = 0;
  public moveDirY = 0;
  public isAttackPressed = false;
  public isSkill1Pressed = false;
  public isSkill2Pressed = false;
  public isDashPressed = false;
  public isPotionRequested = false;
  public isInventoryRequested = false;
  public isPauseRequested = false;
  public isLevelUpRequested = false;
  public isMapRequested = false;

  private activeKeys = new Set<string>();
  private raycaster = new THREE.Raycaster();
  private mouseCoords = new THREE.Vector2();
  private groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private rayHit = new THREE.Vector3();
  private camera: THREE.Camera | null = null;
  private canvas: HTMLCanvasElement | null = null;

  // Touch joystick tracking
  private joystickActive = false;
  private joystickId: number | null = null;
  private joystickCenter = { x: 0, y: 0 };
  private joystickRadius = 50;

  public init(canvas: HTMLCanvasElement, camera: THREE.Camera): void {
    this.canvas = canvas;
    this.camera = camera;

    // --- PC Keyboard Listeners ---
    window.addEventListener('keydown', (e) => {
      this.activeKeys.add(e.code);
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) {
        e.preventDefault();
      }
      if (e.code === 'Space') this.isAttackPressed = true;
      if (e.code === 'KeyQ' || e.code === 'Digit1') this.isSkill1Pressed = true;
      if (e.code === 'KeyE' || e.code === 'Digit2') this.isSkill2Pressed = true;
      if (e.code === 'KeyR') this.isPotionRequested = true;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.isDashPressed = true;
      if (e.code === 'KeyI' || e.code === 'Tab') this.isInventoryRequested = true;
      if (e.code === 'KeyP' || e.code === 'Escape') this.isPauseRequested = true;
      if (e.code === 'KeyL') this.isLevelUpRequested = true;
      if (e.code === 'KeyM') this.isMapRequested = true;
    });

    window.addEventListener('keyup', (e) => {
      this.activeKeys.delete(e.code);
      if (e.code === 'Space') this.isAttackPressed = false;
    });

    // --- PC Mouse Listeners ---
    window.addEventListener('pointermove', (e) => {
      if (!this.canvas || e.pointerType !== 'mouse') return;
      const rect = this.canvas.getBoundingClientRect();
      this.mouseCoords.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouseCoords.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    });

    window.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse') {
        if (e.button === 0) this.isAttackPressed = true;
        if (e.button === 2) {
          e.preventDefault();
          this.isSkill1Pressed = true;
        }
      }
    });

    window.addEventListener('pointerup', (e) => {
      if (e.pointerType === 'mouse' && e.button === 0) {
        this.isAttackPressed = false;
      }
    });

    window.addEventListener('contextmenu', (e) => e.preventDefault());

    // --- Mobile Virtual Touch Controls ---
    this.setupTouchControls();
  }

  private setupTouchControls(): void {
    const stickZone = document.getElementById('touch-stick-zone');
    const knob = document.getElementById('touch-knob');

    if (stickZone && knob) {
      stickZone.addEventListener('pointerdown', (e) => {
        this.joystickActive = true;
        this.joystickId = e.pointerId;
        stickZone.setPointerCapture(e.pointerId);

        const rect = stickZone.getBoundingClientRect();
        this.joystickCenter = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        };
        this.handleJoystickMove(e.clientX, e.clientY, knob);
        e.preventDefault();
      });

      stickZone.addEventListener('pointermove', (e) => {
        if (this.joystickActive && e.pointerId === this.joystickId) {
          this.handleJoystickMove(e.clientX, e.clientY, knob);
        }
      });

      const endStick = (e: PointerEvent) => {
        if (e.pointerId === this.joystickId) {
          this.joystickActive = false;
          this.joystickId = null;
          this.moveDirX = 0;
          this.moveDirY = 0;
          knob.style.transform = 'translate(0px, 0px)';
        }
      };

      stickZone.addEventListener('pointerup', endStick);
      stickZone.addEventListener('pointercancel', endStick);
    }

    // Touch Action Buttons
    const bindBtn = (id: string, onPress: () => void, onRelease?: () => void) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.addEventListener('pointerdown', (e) => {
        btn.classList.add('active');
        onPress();
        e.preventDefault();
      });
      const release = () => {
        btn.classList.remove('active');
        if (onRelease) onRelease();
      };
      btn.addEventListener('pointerup', release);
      btn.addEventListener('pointercancel', release);
    };

    bindBtn('btn-attack', () => { this.isAttackPressed = true; }, () => { this.isAttackPressed = false; });
    bindBtn('btn-skill1', () => { this.isSkill1Pressed = true; });
    bindBtn('btn-skill2', () => { this.isSkill2Pressed = true; });
    bindBtn('btn-dash', () => { this.isDashPressed = true; });
    bindBtn('btn-potion', () => { this.isPotionRequested = true; });

    document.getElementById('dsk-potion')?.addEventListener('click', () => {
      this.isPotionRequested = true;
    });
  }

  private handleJoystickMove(clientX: number, clientY: number, knob: HTMLElement): void {
    const dx = clientX - this.joystickCenter.x;
    const dy = clientY - this.joystickCenter.y;
    const dist = Math.hypot(dx, dy);
    const clampedDist = Math.min(this.joystickRadius, dist);
    const angle = Math.atan2(dy, dx);

    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;
    knob.style.transform = `translate(${knobX}px, ${knobY}px)`;

    const intensity = clampedDist / this.joystickRadius;
    this.moveDirX = Math.cos(angle) * intensity;
    this.moveDirY = Math.sin(angle) * intensity;
  }

  public update(player: Player, enemies: Enemy[]): void {
    // 1. Calculate PC movement input
    let kx = 0;
    let ky = 0;
    if (this.activeKeys.has('KeyA') || this.activeKeys.has('ArrowLeft')) kx -= 1;
    if (this.activeKeys.has('KeyD') || this.activeKeys.has('ArrowRight')) kx += 1;
    if (this.activeKeys.has('KeyW') || this.activeKeys.has('ArrowUp')) ky -= 1;
    if (this.activeKeys.has('KeyS') || this.activeKeys.has('ArrowDown')) ky += 1;

    let finalMx = kx;
    let finalMy = ky;

    if (this.joystickActive) {
      finalMx = this.moveDirX;
      finalMy = this.moveDirY;
    }

    const mLen = Math.hypot(finalMx, finalMy);
    if (mLen > 1) {
      finalMx /= mLen;
      finalMy /= mLen;
    }

    this.moveDirX = finalMx;
    this.moveDirY = finalMy;

    // 2. Mouse Aiming Raycast
    let aimed = false;
    if (this.camera && this.canvas) {
      this.raycaster.setFromCamera(this.mouseCoords, this.camera);
      if (this.raycaster.ray.intersectPlane(this.groundPlane, this.rayHit)) {
        const dx = this.rayHit.x - player.x;
        const dy = this.rayHit.z - player.y;
        const d = Math.hypot(dx, dy);
        if (d > 0.1) {
          player.aimX = dx / d;
          player.aimY = dy / d;
          aimed = true;
        }
      }
    }

    // 3. Smart Auto-Aim (for Mobile or gamepad when no mouse aim)
    if (!aimed || this.joystickActive) {
      let closestEnemy: Enemy | null = null;
      let closestDist = 999;

      for (const e of enemies) {
        if (e.isDead) continue;
        const dist = Math.hypot(e.x - player.x, e.y - player.y);
        if (dist < closestDist) {
          closestDist = dist;
          closestEnemy = e;
        }
      }

      if (closestEnemy && closestDist < 14) {
        const dx = closestEnemy.x - player.x;
        const dy = closestEnemy.y - player.y;
        const d = Math.hypot(dx, dy);
        player.aimX = dx / d;
        player.aimY = dy / d;
      } else if (mLen > 0.1) {
        player.aimX = finalMx;
        player.aimY = finalMy;
      }
    }
  }
}

export const input = new InputManager();
