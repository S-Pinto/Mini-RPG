// Ground Telegraph Warning Indicators (AOE Circles, Cones, Rush Lines)
// The Albedo Renegades: Shadow of Elanthria

import * as THREE from 'three';
import { GEO, getBasic } from '../graphics/proceduralModels.ts';
import type { GroundTelegraph } from '../types/game.ts';

let telegraphSeq = 0;

export class TelegraphManager {
  public group = new THREE.Group();
  private telegraphs: (GroundTelegraph & { mesh: THREE.Mesh; fillMesh: THREE.Mesh })[] = [];

  public createCircle(x: number, y: number, radius: number, duration: number, color = 0xff3b30, onExecute: () => void): void {
    const mesh = new THREE.Mesh(GEO.ring, getBasic(color, 0.45, true));
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.05, y);
    mesh.scale.set(radius, radius, radius);

    const fillMesh = new THREE.Mesh(GEO.circle, getBasic(color, 0.25, true));
    fillMesh.rotation.x = -Math.PI / 2;
    fillMesh.position.set(x, 0.04, y);
    fillMesh.scale.set(0.01, 0.01, 0.01);

    this.group.add(mesh);
    this.group.add(fillMesh);

    this.telegraphs.push({
      id: ++telegraphSeq,
      x,
      y,
      radius,
      type: 'circle',
      duration,
      timeElapsed: 0,
      color,
      mesh,
      fillMesh,
      onExecute
    });
  }

  public update(dt: number): void {
    for (let i = this.telegraphs.length - 1; i >= 0; i--) {
      const t = this.telegraphs[i];
      t.timeElapsed += dt;
      const progress = Math.min(1, t.timeElapsed / t.duration);

      // Animate the fill disk expanding outward to match the telegraph boundary
      const currentFillRadius = t.radius * progress;
      t.fillMesh.scale.set(currentFillRadius, currentFillRadius, currentFillRadius);

      if (progress >= 1) {
        t.onExecute();
        this.group.remove(t.mesh);
        this.group.remove(t.fillMesh);
        t.mesh.geometry.dispose();
        t.fillMesh.geometry.dispose();
        this.telegraphs.splice(i, 1);
      }
    }
  }

  public clear(): void {
    for (const t of this.telegraphs) {
      this.group.remove(t.mesh);
      this.group.remove(t.fillMesh);
    }
    this.telegraphs = [];
  }
}

export const telegraphs = new TelegraphManager();
