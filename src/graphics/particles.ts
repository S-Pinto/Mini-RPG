// Particle System & Floating Combat Text Engine
// The Albedo Renegades: Shadow of Elanthria

import * as THREE from 'three';
import { GEO, getBasic } from './proceduralModels.ts';

interface Particle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  initialScale: number;
}

interface ShockwaveRing {
  mesh: THREE.Mesh;
  targetRadius: number;
  duration: number;
  elapsed: number;
}

interface FloatingTextItem {
  el: HTMLElement;
  x: number;
  y: number;
  z: number;
  life: number;
  maxLife: number;
}

export class ParticleEngine {
  public group = new THREE.Group();
  private particles: Particle[] = [];
  private shockwaves: ShockwaveRing[] = [];
  private pool: THREE.Mesh[] = [];
  private floatingTexts: FloatingTextItem[] = [];
  private textContainer: HTMLElement | null = null;
  private camera: THREE.Camera | null = null;
  private projVec = new THREE.Vector3();

  public init(textContainer: HTMLElement, camera: THREE.Camera): void {
    this.textContainer = textContainer;
    this.camera = camera;
  }

  public spawnBurst(x: number, y: number, z: number, count: number, color: number, speed = 5, size = 0.22): void {
    for (let i = 0; i < count; i++) {
      let mesh = this.pool.pop();
      if (!mesh) {
        mesh = new THREE.Mesh(GEO.box, getBasic(color));
        this.group.add(mesh);
      } else {
        mesh.material = getBasic(color);
        mesh.visible = true;
      }

      mesh.position.set(x, y, z);
      const angle = Math.random() * Math.PI * 2;
      const spd = (0.3 + Math.random() * 0.7) * speed;

      this.particles.push({
        mesh,
        vx: Math.cos(angle) * spd,
        vy: 2 + Math.random() * 5,
        vz: Math.sin(angle) * spd,
        life: 0,
        maxLife: 0.35 + Math.random() * 0.45,
        initialScale: size
      });
    }
  }

  public spawnShockwave(x: number, z: number, radius: number, color: number, duration = 0.35): void {
    const mesh = new THREE.Mesh(GEO.ring, getBasic(color, 0.8, true));
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.1, z);
    mesh.scale.set(0.1, 0.1, 0.1);
    this.group.add(mesh);

    this.shockwaves.push({
      mesh,
      targetRadius: radius,
      duration,
      elapsed: 0
    });
  }

  public spawnFloatingText(x: number, y: number, z: number, text: string, color = '#ffffff', isCrit = false): void {
    if (!this.textContainer) return;

    const el = document.createElement('div');
    el.className = `combat-text ${isCrit ? 'crit' : ''}`;
    el.textContent = text;
    el.style.color = color;
    this.textContainer.appendChild(el);

    this.floatingTexts.push({
      el,
      x,
      y,
      z,
      life: 0,
      maxLife: isCrit ? 1.1 : 0.85
    });
  }

  public update(dt: number, screenWidth: number, screenHeight: number): void {
    // Update individual particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        p.mesh.visible = false;
        this.pool.push(p.mesh);
        this.particles.splice(i, 1);
        continue;
      }

      p.vy -= 14 * dt; // Gravity
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y = Math.max(0.05, p.mesh.position.y + p.vy * dt);
      p.mesh.position.z += p.vz * dt;

      const progress = p.life / p.maxLife;
      const s = (1 - progress) * p.initialScale;
      p.mesh.scale.set(s, s, s);
    }

    // Update shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const w = this.shockwaves[i];
      w.elapsed += dt;
      const k = w.elapsed / w.duration;
      if (k >= 1) {
        this.group.remove(w.mesh);
        w.mesh.geometry.dispose();
        this.shockwaves.splice(i, 1);
        continue;
      }

      const curRadius = 0.1 + (w.targetRadius - 0.1) * Math.sin(k * (Math.PI / 2));
      w.mesh.scale.set(curRadius, curRadius, curRadius);
    }

    // Update floating texts
    if (this.camera) {
      for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
        const ft = this.floatingTexts[i];
        ft.life += dt;
        if (ft.life >= ft.maxLife) {
          ft.el.remove();
          this.floatingTexts.splice(i, 1);
          continue;
        }

        this.projVec.set(ft.x, ft.y + ft.life * 1.5, ft.z);
        this.projVec.project(this.camera);

        const screenX = (this.projVec.x * 0.5 + 0.5) * screenWidth;
        const screenY = (-this.projVec.y * 0.5 + 0.5) * screenHeight;

        ft.el.style.transform = `translate(-50%, -50%) translate(${screenX}px, ${screenY}px)`;
        const alpha = Math.min(1, (1 - ft.life / ft.maxLife) * 2);
        ft.el.style.opacity = String(alpha);
      }
    }
  }

  public clear(): void {
    for (const p of this.particles) {
      this.group.remove(p.mesh);
    }
    this.particles = [];

    for (const w of this.shockwaves) {
      this.group.remove(w.mesh);
    }
    this.shockwaves = [];

    for (const ft of this.floatingTexts) {
      ft.el.remove();
    }
    this.floatingTexts = [];
  }
}

export const particles = new ParticleEngine();
