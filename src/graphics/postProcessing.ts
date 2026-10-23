// Cinematic Post-Processing & Neon Bloom Engine
// The Albedo Renegades: Shadow of Elanthria - Hades Roguelike Visual Pipeline

import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

export class PostProcessingEngine {
  private composer: EffectComposer | null = null;
  private renderPass: RenderPass | null = null;
  private bloomPass: UnrealBloomPass | null = null;
  private outputPass: OutputPass | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private canvas: HTMLCanvasElement | null = null;

  public enabled = true;
  public bloomEnabled = true;

  // Impact chromatic aberration trauma
  private aberrationTrauma = 0.0;

  public init(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    width: number,
    height: number
  ): void {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.canvas = renderer.domElement;

    try {
      // Use standard Three.js EffectComposer with native float precision buffers
      this.composer = new EffectComposer(renderer);

      // 1. Base Scene Render Pass
      this.renderPass = new RenderPass(scene, camera);
      this.composer.addPass(this.renderPass);

      // 2. UnrealBloomPass: Multi-scale HDR Neon Glow
      // Calibrated threshold so only bright emissive runes, magic projectiles,
      // torches, and weapon slashes glow, keeping stone dungeon tiles dark and readable.
      const bloomRes = new THREE.Vector2(width, height);
      this.bloomPass = new UnrealBloomPass(bloomRes, 0.65, 0.42, 0.68);
      this.composer.addPass(this.bloomPass);

      // 3. Output Tone-Mapping & sRGB Color Space Pass
      this.outputPass = new OutputPass();
      this.composer.addPass(this.outputPass);
    } catch (err) {
      console.warn('[PostProcessing] Failed to initialize EffectComposer, falling back to direct WebGL render:', err);
      this.enabled = false;
      this.composer = null;
    }
  }

  public setSize(width: number, height: number): void {
    if (!this.composer) return;
    try {
      this.composer.setSize(width, height);
      if (this.bloomPass) {
        this.bloomPass.setSize(width, height);
      }
    } catch (err) {
      console.warn('[PostProcessing] Error during setSize:', err);
    }
  }

  // Trigger visceral chromatic aberration on critical hit, explosion, or Hades dash
  public triggerAberration(amount = 0.018): void {
    this.aberrationTrauma = Math.min(0.04, this.aberrationTrauma + amount);
  }

  // Set atmospheric zone color temperature via ambient vignette styling
  public setZoneAtmosphere(zoneId: string): void {
    const vignette = document.getElementById('vignette-overlay');
    if (!vignette) return;

    if (zoneId === 'azren') {
      vignette.style.background = 'radial-gradient(circle at 50% 50%, transparent 58%, rgba(26, 16, 6, 0.45) 82%, rgba(12, 6, 2, 0.82) 100%)';
    } else if (zoneId === 'elshiff') {
      vignette.style.background = 'radial-gradient(circle at 50% 50%, transparent 58%, rgba(6, 16, 26, 0.45) 82%, rgba(2, 6, 18, 0.82) 100%)';
    } else if (zoneId === 'morgen') {
      vignette.style.background = 'radial-gradient(circle at 50% 50%, transparent 58%, rgba(6, 26, 12, 0.45) 82%, rgba(2, 14, 6, 0.82) 100%)';
    } else if (zoneId === 'vazark') {
      vignette.style.background = 'radial-gradient(circle at 50% 50%, transparent 58%, rgba(32, 8, 8, 0.48) 82%, rgba(18, 2, 2, 0.85) 100%)';
    } else {
      vignette.style.background = 'radial-gradient(circle at 50% 50%, transparent 58%, rgba(6, 4, 12, 0.45) 82%, rgba(2, 1, 6, 0.82) 100%)';
    }
  }

  public render(dt: number, shakeTrauma = 0): void {
    if (!this.renderer || !this.scene || !this.camera) return;

    // Apply visceral chromatic aberration feedback to canvas during dashes & heavy impacts
    const totalAberration = Math.max(this.aberrationTrauma, shakeTrauma * 0.02);
    if (this.canvas) {
      if (totalAberration > 0.005) {
        const px = Math.round(totalAberration * 120);
        this.canvas.style.filter = `drop-shadow(${px}px 0 0 rgba(255, 40, 80, 0.45)) drop-shadow(-${px}px 0 0 rgba(0, 240, 255, 0.45))`;
      } else if (this.canvas.style.filter !== '') {
        this.canvas.style.filter = '';
      }
    }
    this.aberrationTrauma = Math.max(0, this.aberrationTrauma - dt * 3.8);

    if (!this.enabled || !this.composer) {
      this.renderer.render(this.scene, this.camera);
      return;
    }

    try {
      if (this.bloomPass) {
        this.bloomPass.enabled = this.bloomEnabled;
      }
      this.composer.render(dt);
    } catch (err) {
      console.warn('[PostProcessing] Render pass failed, falling back to direct render:', err);
      this.enabled = false;
      this.renderer.render(this.scene, this.camera);
    }
  }
}

export const postProcessing = new PostProcessingEngine();
