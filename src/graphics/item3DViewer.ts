// Standalone Interactive 3D Item Showcase Viewer for RPG Inventory & Codex
// High-fidelity WebGL Studio Renderer with 360-degree orbit interaction and rarity lighting

import * as THREE from 'three';
import type { Item } from '../types/game.ts';
import { buildStandaloneItem3D, RARITY_COLORS } from './itemModels3D.ts';

export class Item3DViewer {
  private canvas: HTMLCanvasElement | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private itemRoot: THREE.Group | null = null;
  private pedestalGroup: THREE.Group | null = null;
  private rarityPointLight: THREE.PointLight | null = null;
  private animFrameId: number | null = null;

  // Orbit & interaction state
  private isDragging = false;
  private prevPointerX = 0;
  private prevPointerY = 0;
  private rotY = -Math.PI / 6;
  private rotX = 0.2;
  private targetRotY = -Math.PI / 6;
  private targetRotX = 0.2;
  private userInteractedTime = 0;
  private clock = new THREE.Clock();

  // Bound event listeners for cleanup
  private onPointerDownBound: (e: PointerEvent) => void;
  private onPointerMoveBound: (e: PointerEvent) => void;
  private onPointerUpBound: (e: PointerEvent) => void;

  constructor() {
    this.onPointerDownBound = this.onPointerDown.bind(this);
    this.onPointerMoveBound = this.onPointerMove.bind(this);
    this.onPointerUpBound = this.onPointerUp.bind(this);
  }

  public mount(canvas: HTMLCanvasElement, item: Item): void {
    if (this.canvas !== canvas) {
      this.destroy();
      this.canvas = canvas;
      this.initScene();
      this.attachListeners();
    }

    if (!this.scene || !this.renderer || !this.camera) {
      this.initScene();
    }

    this.displayItem(item);

    if (!this.animFrameId) {
      this.clock.start();
      this.animate();
    }
  }

  private initScene(): void {
    if (!this.canvas) return;

    // 1. Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.updateSize();

    // 2. Scene
    this.scene = new THREE.Scene();

    // 3. Camera
    this.camera = new THREE.PerspectiveCamera(40, this.canvas.clientWidth / (this.canvas.clientHeight || 1), 0.1, 50);
    this.camera.position.set(0, 0.4, 4.2);
    this.camera.lookAt(0, 0, 0);

    // 4. Studio Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    this.scene.add(ambientLight);

    // Key Light (warm gold/white top-right)
    const keyLight = new THREE.DirectionalLight(0xfffaed, 2.2);
    keyLight.position.set(3, 4, 3.5);
    this.scene.add(keyLight);

    // Rim / Back Light (cool cyan/violet back-left)
    const rimLight = new THREE.DirectionalLight(0x7ea8ff, 1.4);
    rimLight.position.set(-3, 2, -2.5);
    this.scene.add(rimLight);

    // Front soft light
    const frontFill = new THREE.DirectionalLight(0xffffff, 0.6);
    frontFill.position.set(0, -1, 3);
    this.scene.add(frontFill);

    // Dynamic Rarity Point Light
    this.rarityPointLight = new THREE.PointLight(0xffd700, 2.5, 6, 1.2);
    this.rarityPointLight.position.set(0, 0.2, 1.2);
    this.scene.add(this.rarityPointLight);

    // 5. Studio Pedestal & Glowing Arcane Rune Base
    this.pedestalGroup = new THREE.Group();
    this.pedestalGroup.position.set(0, -1.35, 0);

    // Obsidian base ring
    const baseGeo = new THREE.CylinderGeometry(1.4, 1.6, 0.14, 32);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x12101a,
      roughness: 0.35,
      metalness: 0.8
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    this.pedestalGroup.add(baseMesh);

    // Glowing Inner Ring
    const runeRingGeo = new THREE.RingGeometry(0.8, 1.15, 32);
    const runeMat = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65
    });
    const runeMesh = new THREE.Mesh(runeRingGeo, runeMat);
    runeMesh.rotation.x = -Math.PI / 2;
    runeMesh.position.y = 0.08;
    this.pedestalGroup.add(runeMesh);

    this.scene.add(this.pedestalGroup);
  }

  public displayItem(item: Item): void {
    if (!this.scene) return;

    // Remove existing item root
    if (this.itemRoot) {
      this.scene.remove(this.itemRoot);
      this.disposeObject(this.itemRoot);
      this.itemRoot = null;
    }

    // Update rarity point light & pedestal rune color
    const rarTheme = RARITY_COLORS[item.rarity] || RARITY_COLORS.common;
    if (this.rarityPointLight) {
      this.rarityPointLight.color.setHex(rarTheme.main);
    }
    if (this.pedestalGroup && this.pedestalGroup.children[1]) {
      const runeMesh = this.pedestalGroup.children[1] as THREE.Mesh;
      if (runeMesh.material && 'color' in runeMesh.material) {
        (runeMesh.material as THREE.MeshBasicMaterial).color.setHex(rarTheme.glow);
      }
    }

    // Build standalone 3D mesh
    const modelGroup = buildStandaloneItem3D(item);

    // Compute bounding box to normalize scale and center model
    const bbox = new THREE.Box3().setFromObject(modelGroup);
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    bbox.getCenter(center);
    bbox.getSize(size);

    // Re-center model relative to its pivot
    modelGroup.position.sub(center);

    // Create wrapper root for rotation & floating bobbing
    this.itemRoot = new THREE.Group();
    this.itemRoot.add(modelGroup);

    // Scale so that maximum dimension fits comfortably (target height approx ~1.9)
    const maxDim = Math.max(size.x, size.y, size.z, 0.01);
    let targetSize = 2.0;
    if (item.slot === 'ring') targetSize = 1.35;
    else if (item.slot === 'armor') targetSize = 2.1;
    else if (item.slot === 'relic') targetSize = 1.7;

    const scale = targetSize / maxDim;
    this.itemRoot.scale.setScalar(scale);
    this.itemRoot.position.set(0, 0.05, 0);

    // Reset rotation smoothly
    this.targetRotY = -Math.PI / 6;
    this.targetRotX = 0.15;
    this.rotY = this.targetRotY;
    this.rotX = this.targetRotX;
    this.userInteractedTime = 0;

    this.scene.add(this.itemRoot);
    this.updateSize();
  }

  private updateSize(): void {
    if (!this.canvas || !this.renderer || !this.camera) return;
    const width = this.canvas.clientWidth || 280;
    const height = this.canvas.clientHeight || 180;
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.renderer.setSize(width, height, false);
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }
  }

  private attachListeners(): void {
    if (!this.canvas) return;
    this.canvas.addEventListener('pointerdown', this.onPointerDownBound);
    window.addEventListener('pointermove', this.onPointerMoveBound);
    window.addEventListener('pointerup', this.onPointerUpBound);
    window.addEventListener('pointercancel', this.onPointerUpBound);
  }

  private detachListeners(): void {
    if (this.canvas) {
      this.canvas.removeEventListener('pointerdown', this.onPointerDownBound);
    }
    window.removeEventListener('pointermove', this.onPointerMoveBound);
    window.removeEventListener('pointerup', this.onPointerUpBound);
    window.removeEventListener('pointercancel', this.onPointerUpBound);
  }

  private onPointerDown(e: PointerEvent): void {
    this.isDragging = true;
    this.prevPointerX = e.clientX;
    this.prevPointerY = e.clientY;
    this.userInteractedTime = Date.now();
    if (this.canvas) {
      this.canvas.style.cursor = 'grabbing';
    }
  }

  private onPointerMove(e: PointerEvent): void {
    if (!this.isDragging) return;
    const deltaX = e.clientX - this.prevPointerX;
    const deltaY = e.clientY - this.prevPointerY;
    this.prevPointerX = e.clientX;
    this.prevPointerY = e.clientY;

    this.targetRotY += deltaX * 0.015;
    this.targetRotX = Math.max(-0.6, Math.min(0.7, this.targetRotX + deltaY * 0.012));
    this.userInteractedTime = Date.now();
  }

  private onPointerUp(): void {
    if (this.isDragging) {
      this.isDragging = false;
      if (this.canvas) {
        this.canvas.style.cursor = 'grab';
      }
    }
  }

  private animate = (): void => {
    this.animFrameId = requestAnimationFrame(this.animate);

    if (!this.renderer || !this.scene || !this.camera) return;

    const dt = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // Smooth auto-rotation when user is not manually dragging
    const idleSeconds = (Date.now() - this.userInteractedTime) / 1000;
    if (!this.isDragging && idleSeconds > 0.8) {
      this.targetRotY += dt * 0.75;
    }

    // Smooth damping / interpolation towards target rotations
    this.rotY += (this.targetRotY - this.rotY) * Math.min(1, dt * 10);
    this.rotX += (this.targetRotX - this.rotX) * Math.min(1, dt * 10);

    if (this.itemRoot) {
      this.itemRoot.rotation.y = this.rotY;
      this.itemRoot.rotation.x = this.rotX;

      // Gentle floating bob
      this.itemRoot.position.y = 0.08 + Math.sin(elapsedTime * 2.2) * 0.06;
    }

    // Pedestal slow counter-rotation for magical studio aesthetic
    if (this.pedestalGroup) {
      this.pedestalGroup.rotation.y = -elapsedTime * 0.2;
    }

    this.updateSize();
    this.renderer.render(this.scene, this.camera);
  };

  public stop(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  public destroy(): void {
    this.stop();
    this.detachListeners();

    if (this.itemRoot && this.scene) {
      this.scene.remove(this.itemRoot);
      this.disposeObject(this.itemRoot);
      this.itemRoot = null;
    }

    if (this.pedestalGroup && this.scene) {
      this.scene.remove(this.pedestalGroup);
      this.disposeObject(this.pedestalGroup);
      this.pedestalGroup = null;
    }

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }

    this.scene = null;
    this.camera = null;
    this.canvas = null;
  }

  private disposeObject(obj: THREE.Object3D): void {
    obj.traverse(child => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(m => m.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      }
    });
  }
}

export const item3DViewer = new Item3DViewer();
