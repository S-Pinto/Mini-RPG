// Main Application Entry Point & Game Loop
// The Albedo Renegades: Shadow of Elanthria

import * as THREE from 'three';
import { gameState } from './state/gameState.ts';
import { input } from './input/inputManager.ts';
import { sound } from './audio/soundEngine.ts';
import { particles } from './graphics/particles.ts';
import { combat } from './combat/combatSystem.ts';
import { hud } from './ui/hud.ts';
import { modals } from './ui/modals.ts';
import { WORLD_W, WORLD_H } from './world/dungeonGenerator.ts';

// 1. Initialize Three.js Renderer & Camera
const canvas = document.getElementById('stage-canvas') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance'
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

const camera = new THREE.PerspectiveCamera(42, 1, 0.5, 300);
const PITCH = 56 * (Math.PI / 180);

// Scene Lights
const ambLight = new THREE.AmbientLight(0x8a78c8, 1.1);
const dirLight = new THREE.DirectionalLight(0xffedd4, 0.85);
dirLight.position.set(16, 28, 12);
const playerTorch = new THREE.PointLight(0xffaa55, 1.4, 22, 1.4);

gameState.scene.add(ambLight);
gameState.scene.add(dirLight);
gameState.scene.add(playerTorch);

// 2. Camera Positioning & Responsive Resizing
const camState = {
  d: 30,
  tx: WORLD_W / 2,
  tz: WORLD_H / 2,
  isPortrait: false
};

function resizeCamera(): void {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();

  camState.isPortrait = camera.aspect < 1.05;
  const vfov = camera.fov * (Math.PI / 180);
  const tanHalf = Math.tan(vfov / 2);

  const desiredViewW = camState.isPortrait ? 22 : 32;
  const dh = (desiredViewW / 2 * 1.05) / (tanHalf * camera.aspect);
  const dv = ((WORLD_H + 5) / 2 * Math.sin(PITCH)) / tanHalf;

  camState.d = camState.isPortrait ? dh : Math.max(dh, dv) * 1.05;
}

window.addEventListener('resize', resizeCamera);
window.addEventListener('orientationchange', () => setTimeout(resizeCamera, 200));
resizeCamera();

// 3. Initialize Game Subsystems
const textContainer = document.getElementById('combat-text-container') as HTMLElement;
particles.init(textContainer, camera);
hud.init();
modals.init();
input.init(canvas, camera);
gameState.init(gameState.scene);

// Connect UI Modal callbacks
modals.onClassSelected = (classId, subIndex) => {
  gameState.startNewRun(classId, subIndex);
};

modals.onFeatChosen = (feat) => {
  gameState.applyFeat(feat);
};

modals.onResumeGame = () => {
  gameState.state = 'play';
};

// Connect HUD Quick Action Buttons
const btnInv = document.getElementById('btn-open-inv');
if (btnInv) {
  btnInv.addEventListener('click', () => {
    if (gameState.state === 'play') {
      gameState.state = 'inventory';
      modals.showInventory(gameState.player);
    } else if (gameState.state === 'inventory') {
      modals.close();
      gameState.state = 'play';
    }
  });
}

const btnSnd = document.getElementById('btn-toggle-sound');
if (btnSnd) {
  btnSnd.addEventListener('click', () => {
    const isMuted = sound.toggleMute();
    btnSnd.textContent = isMuted ? '🔇 Muto' : '🔊 Suono';
  });
}

const btnPause = document.getElementById('btn-toggle-pause');
if (btnPause) {
  btnPause.addEventListener('click', () => {
    if (gameState.state === 'play') {
      gameState.state = 'paused';
      modals.showMessage(
        'PAUSA DI GIOCO',
        'L’avventura è momentaneamente sospesa. Riprendi quando sei pronto a proseguire a Okkarn.',
        'Riprendi Partita',
        () => {
          gameState.state = 'play';
        }
      );
    }
  });
}

// 4. Main Game Loop
let lastTime = performance.now();

function gameLoop(now: number): void {
  const dt = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;

  if (gameState.state === 'play' && gameState.currentRoom) {
    // 1. Process player inputs
    input.update(gameState.player, gameState.enemies);

    // Keyboard action checks
    if (input.isInventoryRequested) {
      input.isInventoryRequested = false;
      gameState.state = 'inventory';
      modals.showInventory(gameState.player);
    }
    if (input.isPauseRequested) {
      input.isPauseRequested = false;
      gameState.state = 'paused';
      modals.showMessage('PAUSA DI GIOCO', 'Partita in pausa.', 'Riprendi', () => { gameState.state = 'play'; });
    }

    // Move player
    gameState.player.move(input.moveDirX, input.moveDirY, dt, gameState.currentRoom);

    // Attack triggers
    if (input.isAttackPressed) {
      combat.castBasicAttack(gameState.player, gameState.enemies, gameState.currentRoom);
    }
    if (input.isSkill1Pressed) {
      input.isSkill1Pressed = false;
      combat.castSkill1(gameState.player, gameState.enemies);
    }
    if (input.isSkill2Pressed || input.isDashPressed) {
      input.isSkill2Pressed = false;
      input.isDashPressed = false;
      combat.castSkill2(gameState.player, gameState.currentRoom);
    }
    if (input.isPotionRequested) {
      input.isPotionRequested = false;
      if (gameState.player.usePotion()) {
        sound.heal();
        particles.spawnShockwave(gameState.player.x, gameState.player.y, 2.5, 0x55ff77);
        particles.spawnFloatingText(gameState.player.x, 2.0, gameState.player.y, '+Pozione Curativa!', '#55ff77');
      }
    }

    // 2. Update Game State (enemies, loots, doors, level progression)
    gameState.update(dt);

    // 3. Update Scene Lighting based on Zone
    ambLight.color.setHex(gameState.currentZone.ambientColor);
    dirLight.color.setHex(gameState.currentZone.lightColor);
    playerTorch.color.setHex(gameState.currentZone.torchColor);
    playerTorch.position.set(gameState.player.x, 3.5, gameState.player.y);

    // Torch light flicker
    playerTorch.intensity = 1.3 + Math.sin(now * 0.015) * 0.15;

    // 4. Update HUD
    hud.update(
      gameState.player,
      gameState.currentRoom,
      gameState.rooms,
      gameState.currentZone,
      gameState.enemies
    );
  }

  // Camera tracking
  let targetCamX = WORLD_W / 2;
  let targetCamZ = WORLD_H / 2;

  if (gameState.state !== 'menu' && gameState.player) {
    if (camState.isPortrait) {
      targetCamX = THREE.MathUtils.clamp(gameState.player.x, 9, WORLD_W - 9);
      targetCamZ = THREE.MathUtils.clamp(gameState.player.y, 6, WORLD_H - 4);
    } else {
      // Soft panoramic follow
      targetCamX = WORLD_W / 2 + (gameState.player.x - WORLD_W / 2) * 0.15;
      targetCamZ = WORLD_H / 2 + (gameState.player.y - WORLD_H / 2) * 0.12;
    }
  }

  camState.tx += (targetCamX - camState.tx) * Math.min(1, dt * 6);
  camState.tz += (targetCamZ - camState.tz) * Math.min(1, dt * 6);

  camera.position.set(
    camState.tx,
    camState.d * Math.sin(PITCH),
    camState.tz + camState.d * Math.cos(PITCH)
  );
  camera.lookAt(camState.tx, 0, camState.tz);

  // Update particles and floating numbers
  particles.update(dt, window.innerWidth, window.innerHeight);

  // Render WebGL Scene
  renderer.render(gameState.scene, camera);

  requestAnimationFrame(gameLoop);
}

// 5. Start Game: Show Intro / Main Menu first
requestAnimationFrame(gameLoop);
modals.showIntro();
