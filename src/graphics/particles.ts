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

interface AmbientMote {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  initialScale: number;
  seed: number;
}

interface GhostTrail {
  mesh: THREE.Group;
  life: number;
  maxLife: number;
  color: number;
}

export class ParticleEngine {
  public group = new THREE.Group();
  private particles: Particle[] = [];
  private shockwaves: ShockwaveRing[] = [];
  private ambientMotes: AmbientMote[] = [];
  private ghostTrails: GhostTrail[] = [];
  private pool: THREE.Mesh[] = [];
  private floatingTexts: FloatingTextItem[] = [];
  private textContainer: HTMLElement | null = null;
  private camera: THREE.Camera | null = null;
  private projVec = new THREE.Vector3();

  public init(textContainer: HTMLElement, camera: THREE.Camera): void {
    this.textContainer = textContainer;
    this.camera = camera;
  }

  public spawnGhostAfterImage(sourceMesh: THREE.Group, color = 0x8a5cf6): void {
    if (this.ghostTrails.length >= 8) return;
    const ghost = new THREE.Group();
    ghost.position.copy(sourceMesh.position);
    ghost.rotation.copy(sourceMesh.rotation);
    ghost.scale.copy(sourceMesh.scale);

    const ghostMat = getBasic(color, 0.45, true);
    sourceMesh.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const m = child as THREE.Mesh;
        const gMesh = new THREE.Mesh(m.geometry, ghostMat);
        gMesh.position.copy(m.position);
        gMesh.rotation.copy(m.rotation);
        gMesh.scale.copy(m.scale);
        ghost.add(gMesh);
      }
    });

    this.group.add(ghost);
    this.ghostTrails.push({ mesh: ghost, life: 0, maxLife: 0.22, color });
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

  public spawnAmbientMote(x: number, y: number, z: number, color: number): void {
    if (this.ambientMotes.length >= 45) return;
    const size = 0.08 + Math.random() * 0.08;
    const mesh = new THREE.Mesh(GEO.sph, getBasic(color, 0.75, true));
    mesh.scale.setScalar(size);
    mesh.position.set(x, y, z);
    this.group.add(mesh);

    this.ambientMotes.push({
      mesh,
      vx: (Math.random() - 0.5) * 0.6,
      vy: 0.35 + Math.random() * 0.45,
      vz: (Math.random() - 0.5) * 0.6,
      life: 0,
      maxLife: 4.5 + Math.random() * 3.5,
      initialScale: size,
      seed: Math.random() * 50
    });
  }

  public spawnFloatingText(
    x: number,
    y: number,
    z: number,
    text: string,
    color = '#ffffff',
    isCrit = false,
    tier: 'small' | 'normal' | 'large' | 'epic' = 'normal',
    duration?: number,
    textType?: 'damage' | 'loot' | 'status'
  ): void {
    if (!this.textContainer) return;

    // Bulletproof: sanitize any accidental long decimal numbers in floating text
    const sanitizedText = text.replace(/(\d+\.\d{3,})/g, (match) => {
      const num = parseFloat(match);
      return Number.isFinite(num) ? String(Math.round(num * 10) / 10) : match;
    });

    // Auto-detect text category if not explicitly provided
    let category = textType;
    if (!category) {
      if (
        sanitizedText.startsWith('+') ||
        sanitizedText.includes('Oro') ||
        sanitizedText.includes('EXP') ||
        sanitizedText.includes('Pozione') ||
        sanitizedText.includes('Equip:') ||
        sanitizedText.includes('Essenza')
      ) {
        category = 'loot';
      } else if (
        sanitizedText.startsWith('-') ||
        /^[\d\s]+/.test(sanitizedText) ||
        sanitizedText.includes('🔥') ||
        sanitizedText.includes('☠️') ||
        sanitizedText.includes('☀️') ||
        sanitizedText.includes('⚡') ||
        sanitizedText.includes('SCUDO') ||
        sanitizedText.includes('DANNO')
      ) {
        category = 'damage';
      } else {
        category = 'status';
      }
    }

    // Default white damage looks bland: enhance standard physical hits with energetic warm ember hue
    let finalColor = color;
    if (category === 'damage' && (color === '#ffffff' || color === '#fff') && !isCrit) {
      finalColor = '#ffb049';
    }

    const el = document.createElement('div');
    el.className = `combat-text ${category}-text ${tier} ${isCrit ? 'crit' : ''}`;
    el.textContent = sanitizedText;
    el.style.color = finalColor;
    this.textContainer.appendChild(el);

    let defaultLife = 0.85;
    if (tier === 'small') defaultLife = 0.6;
    else if (tier === 'large') defaultLife = 1.3;
    else if (tier === 'epic') defaultLife = 1.75;
    else if (isCrit) defaultLife = 1.15;

    this.floatingTexts.push({
      el,
      x,
      y,
      z,
      life: 0,
      maxLife: duration || defaultLife
    });
  }

  public update(dt: number, screenWidth: number, screenHeight: number): void {
    // Update ambient drifting motes
    const tSec = performance.now() * 0.001;
    for (let i = this.ambientMotes.length - 1; i >= 0; i--) {
      const m = this.ambientMotes[i];
      m.life += dt;
      if (m.life >= m.maxLife) {
        this.group.remove(m.mesh);
        m.mesh.geometry.dispose();
        this.ambientMotes.splice(i, 1);
        continue;
      }
      m.mesh.position.x += m.vx * dt + Math.sin(tSec * 1.5 + m.seed) * 0.012;
      m.mesh.position.y += m.vy * dt;
      m.mesh.position.z += m.vz * dt + Math.cos(tSec * 1.5 + m.seed) * 0.012;

      const progress = m.life / m.maxLife;
      const fade = Math.sin(progress * Math.PI);
      const s = m.initialScale * (0.4 + 0.6 * fade);
      m.mesh.scale.set(s, s, s);
    }

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

    // Update Hades-style Ghost Trails
    for (let i = this.ghostTrails.length - 1; i >= 0; i--) {
      const g = this.ghostTrails[i];
      g.life += dt;
      const progress = g.life / g.maxLife;
      if (progress >= 1.0) {
        this.group.remove(g.mesh);
        this.ghostTrails.splice(i, 1);
      } else {
        const alpha = Math.max(0, (1 - progress) * 0.45);
        g.mesh.traverse((c) => {
          if ((c as THREE.Mesh).isMesh) {
            const mat = (c as THREE.Mesh).material as THREE.MeshBasicMaterial;
            if (mat) mat.opacity = alpha;
          }
        });
      }
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

        const floatSpeed = ft.maxLife > 1.2 ? 1.05 : 1.5;
        this.projVec.set(ft.x, ft.y + ft.life * floatSpeed, ft.z);
        this.projVec.project(this.camera);

        const screenX = (this.projVec.x * 0.5 + 0.5) * screenWidth;
        const screenY = (-this.projVec.y * 0.5 + 0.5) * screenHeight;

        const progress = ft.life / ft.maxLife;
        const scale = progress < 0.16 ? 0.75 + (progress / 0.16) * 0.35 : (progress > 0.75 ? 1.0 - (progress - 0.75) * 0.35 : 1.0);
        ft.el.style.transform = `translate(-50%, -50%) translate(${screenX}px, ${screenY}px) scale(${scale.toFixed(2)})`;
        const alpha = Math.min(1, (1 - progress) * 2.2);
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

    for (const g of this.ghostTrails) {
      this.group.remove(g.mesh);
    }
    this.ghostTrails = [];

    for (const ft of this.floatingTexts) {
      ft.el.remove();
    }
    this.floatingTexts = [];

    for (const m of this.ambientMotes) {
      this.group.remove(m.mesh);
      m.mesh.geometry.dispose();
    }
    this.ambientMotes = [];
  }
}

export const particles = new ParticleEngine();
