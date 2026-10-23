// Standalone Interactive 3D Hero Preview Viewer for RPG Inventory & Paperdoll
// Live real-time character preview updating with equipped weapons, armor, and helms!

import * as THREE from 'three';
import type { Player } from '../entities/player.ts';
import { buildPlayerModel, type HumanoidRig, GEO, getLambert, getBasic, getStandard } from './proceduralModels.ts';
import { CLASSES_DATA } from '../types/classesData.ts';

export class Hero3DViewer {
  private canvas: HTMLCanvasElement | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private rig: HumanoidRig | null = null;
  private characterGroup: THREE.Group | null = null;
  private pedestalGroup: THREE.Group | null = null;
  private animFrameId: number | null = null;
  private currentClassId: string | null = null;

  // Orbit & interaction state
  private isDragging = false;
  private prevPointerX = 0;
  private rotY = 0.25;
  private targetRotY = 0.25;
  private userInteractedTime = 0;
  private clock = new THREE.Clock();

  // Bound listeners
  private onPointerDownBound: (e: PointerEvent) => void;
  private onPointerMoveBound: (e: PointerEvent) => void;
  private onPointerUpBound: (e: PointerEvent) => void;

  constructor() {
    this.onPointerDownBound = this.onPointerDown.bind(this);
    this.onPointerMoveBound = this.onPointerMove.bind(this);
    this.onPointerUpBound = this.onPointerUp.bind(this);
  }

  public mount(canvas: HTMLCanvasElement, player: Player): void {
    if (this.canvas !== canvas) {
      this.destroy();
      this.canvas = canvas;
      this.initScene();
      this.attachListeners();
    }

    if (!this.scene || !this.renderer || !this.camera) {
      this.initScene();
    }

    this.updatePlayer(player);

    if (!this.animFrameId) {
      this.clock.start();
      this.animate();
    }
  }

  private initScene(): void {
    if (!this.canvas) return;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.updateSize();

    this.scene = new THREE.Scene();

    // Perspective camera positioned to view full hero with generous headroom (no cutoff)
    this.camera = new THREE.PerspectiveCamera(32, this.canvas.clientWidth / (this.canvas.clientHeight || 1), 0.1, 50);
    this.camera.position.set(0, 1.22, 5.2);
    this.camera.lookAt(0, 1.08, 0);

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.25);
    this.scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfffaed, 2.2);
    keyLight.position.set(3, 4, 3.5);
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x7ea8ff, 1.4);
    rimLight.position.set(-3, 2.5, -2.5);
    this.scene.add(rimLight);

    const frontFill = new THREE.DirectionalLight(0xffffff, 0.7);
    frontFill.position.set(0, -0.5, 3);
    this.scene.add(frontFill);

    // Pedestal Group
    this.pedestalGroup = new THREE.Group();
    const stoneBase = new THREE.Mesh(GEO.cyl, getStandard(0x131722, 0.7, 0.3));
    stoneBase.scale.set(1.15, 0.1, 1.15);
    stoneBase.position.set(0, 0.05, 0);

    const goldTrim = new THREE.Mesh(GEO.torus, getLambert(0xd4af37, 0x4a3c10));
    goldTrim.scale.set(1.12, 1.12, 0.04);
    goldTrim.rotation.x = Math.PI / 2;
    goldTrim.position.set(0, 0.1, 0);

    const innerRune = new THREE.Mesh(GEO.torus, getBasic(0x38bdf8, 0.75, true));
    innerRune.name = 'pedestal_rune';
    innerRune.scale.set(0.85, 0.85, 0.03);
    innerRune.rotation.x = Math.PI / 2;
    innerRune.position.set(0, 0.11, 0);

    this.pedestalGroup.add(stoneBase, goldTrim, innerRune);
    this.scene.add(this.pedestalGroup);

    // Character Holder Group
    this.characterGroup = new THREE.Group();
    this.characterGroup.position.set(0, 0.1, 0);
    this.scene.add(this.characterGroup);
  }

  public updatePlayer(player: Player): void {
    if (!this.characterGroup || !this.scene) return;

    // Check if class changed or rig not yet built
    if (!this.rig || this.currentClassId !== player.classId) {
      this.currentClassId = player.classId;
      this.characterGroup.clear();
      this.rig = buildPlayerModel(player.classId);
      this.characterGroup.add(this.rig.root);

      // Tint pedestal rune according to class color
      const classCfg = CLASSES_DATA[player.classId];
      if (classCfg && this.pedestalGroup) {
        const rune = this.pedestalGroup.getObjectByName('pedestal_rune') as THREE.Mesh | undefined;
        if (rune && rune.material instanceof THREE.Material) {
          (rune.material as THREE.MeshBasicMaterial).color.set(classCfg.color);
        }
      }
    }

    // Refresh equipped 3D visuals on the hero rig!
    if (this.rig && this.rig.updateGearVisuals) {
      this.rig.updateGearVisuals(player.equip, player.classId, player.subclass.weaponStyle);
    }
  }

  private attachListeners(): void {
    if (!this.canvas) return;
    this.canvas.addEventListener('pointerdown', this.onPointerDownBound);
    window.addEventListener('pointermove', this.onPointerMoveBound);
    window.addEventListener('pointerup', this.onPointerUpBound);
  }

  private detachListeners(): void {
    if (this.canvas) {
      this.canvas.removeEventListener('pointerdown', this.onPointerDownBound);
    }
    window.removeEventListener('pointermove', this.onPointerMoveBound);
    window.removeEventListener('pointerup', this.onPointerUpBound);
  }

  private onPointerDown(e: PointerEvent): void {
    this.isDragging = true;
    this.prevPointerX = e.clientX;
    this.userInteractedTime = performance.now();
    this.canvas?.setPointerCapture?.(e.pointerId);
  }

  private onPointerMove(e: PointerEvent): void {
    if (!this.isDragging) return;
    const deltaX = e.clientX - this.prevPointerX;
    this.prevPointerX = e.clientX;
    this.targetRotY += deltaX * 0.018;
    this.userInteractedTime = performance.now();
  }

  private onPointerUp(e: PointerEvent): void {
    this.isDragging = false;
    this.canvas?.releasePointerCapture?.(e.pointerId);
  }

  private updateSize(): void {
    if (!this.canvas || !this.renderer) return;
    const width = this.canvas.clientWidth || 230;
    const height = this.canvas.clientHeight || 270;
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.renderer.setSize(width, height, false);
      if (this.camera) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
      }
    }
  }

  private animate(): void {
    this.animFrameId = requestAnimationFrame(() => this.animate());

    const t = this.clock.getElapsedTime();

    // Smooth rotational damping
    this.rotY += (this.targetRotY - this.rotY) * 0.12;

    // Gentle auto-rotation when user hasn't dragged recently
    const timeSinceInteract = (performance.now() - this.userInteractedTime) * 0.001;
    if (!this.isDragging && timeSinceInteract > 2.5) {
      this.targetRotY += 0.0035;
    }

    if (this.characterGroup) {
      this.characterGroup.rotation.y = this.rotY;
    }

    // Breathing idle animation on hero rig
    if (this.rig) {
      this.rig.animate(t, 0);
    }

    // Rotate pedestal rune halo
    if (this.pedestalGroup) {
      const rune = this.pedestalGroup.getObjectByName('pedestal_rune');
      if (rune) {
        rune.rotation.z = t * 0.4;
      }
    }

    this.updateSize();
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  public stop(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  public destroy(): void {
    this.stop();
    this.detachListeners();
    if (this.characterGroup) {
      this.characterGroup.clear();
      this.characterGroup = null;
    }
    if (this.scene) {
      this.scene.clear();
      this.scene = null;
    }
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
    this.canvas = null;
    this.rig = null;
    this.currentClassId = null;
  }
}

export const hero3DViewer = new Hero3DViewer();
