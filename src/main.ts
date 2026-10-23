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
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const camera = new THREE.PerspectiveCamera(42, 1, 0.5, 300);
const PITCH = 56 * (Math.PI / 180);

// Scene Lights & Atmospheric Illumination
const ambLight = new THREE.AmbientLight(0x8a78c8, 0.95);

const dirLight = new THREE.DirectionalLight(0xfff1dc, 1.15);
dirLight.position.set(18, 32, 14);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 120;
dirLight.shadow.camera.left = -24;
dirLight.shadow.camera.right = 24;
dirLight.shadow.camera.top = 20;
dirLight.shadow.camera.bottom = -20;
dirLight.shadow.bias = -0.0006;
dirLight.shadow.radius = 2.0;

// Atmospheric Rim / Silhouette Fill Light
const rimLight = new THREE.DirectionalLight(0x5577bb, 0.45);
rimLight.position.set(-16, 18, -12);

// Dynamic Player Torch with Soft Shadows & Warm Radial Falloff
const playerTorch = new THREE.PointLight(0xffaa55, 1.8, 24, 1.35);
playerTorch.castShadow = true;
playerTorch.shadow.mapSize.width = 1024;
playerTorch.shadow.mapSize.height = 1024;
playerTorch.shadow.bias = -0.002;
playerTorch.shadow.radius = 2.0;

gameState.scene.add(ambLight);
gameState.scene.add(dirLight);
gameState.scene.add(rimLight);
gameState.scene.add(playerTorch);

// Atmospheric Depth Fog
gameState.scene.fog = new THREE.FogExp2(0x181226, 0.016);

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
      modals.showPauseMenu(
        () => { gameState.state = 'play'; },
        () => { gameState.exitToMainMenu(); }
      );
    }
  });
}

const btnLevelUp = document.getElementById('btn-hud-levelup');
if (btnLevelUp) {
  btnLevelUp.addEventListener('click', () => {
    if (gameState.state === 'play' && gameState.player.pendingLevelUps > 0) {
      gameState.state = 'levelup';
      modals.showLevelUp(gameState.player);
    }
  });
}

const btnMap = document.getElementById('btn-open-map');
if (btnMap) {
  btnMap.addEventListener('click', () => {
    if (gameState.state === 'play') {
      gameState.openFastTravelMap();
    }
  });
}

const btnCodex = document.getElementById('btn-open-codex');
if (btnCodex) {
  btnCodex.addEventListener('click', () => {
    if (gameState.state === 'play') {
      modals.showCodex(false);
    }
  });
}

const minimapCanvas = document.getElementById('minimap-canvas');
if (minimapCanvas) {
  minimapCanvas.addEventListener('click', () => {
    if (gameState.state === 'play') {
      gameState.openFastTravelMap();
    }
  });
}

// Connect Desktop Action Bar Clicks
document.getElementById('dsk-attack')?.addEventListener('click', () => {
  if (gameState.state === 'play' && gameState.currentRoom) {
    combat.castBasicAttack(gameState.player, gameState.enemies, gameState.currentRoom);
  }
});
document.getElementById('dsk-skill1')?.addEventListener('click', () => {
  if (gameState.state === 'play') {
    combat.castSkill1(gameState.player, gameState.enemies);
  }
});
document.getElementById('dsk-skill2')?.addEventListener('click', () => {
  if (gameState.state === 'play' && gameState.currentRoom) {
    combat.castSkill2(gameState.player, gameState.currentRoom, gameState.enemies);
  }
});
document.getElementById('dsk-dash')?.addEventListener('click', () => {
  if (gameState.state === 'play') {
    combat.performDodge(gameState.player);
  }
});

// 4. Main Game Loop
let lastTime = performance.now();

function gameLoop(now: number): void {
  const dt = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;

  // Hit-stop impact freeze on heavy impacts
  if (combat.hitStopTimer > 0) {
    combat.hitStopTimer -= dt;
    particles.update(dt * 0.2, window.innerWidth, window.innerHeight);
    renderer.render(gameState.scene, camera);
    requestAnimationFrame(gameLoop);
    return;
  }

  // Global pause toggle check
  if (input.isPauseRequested) {
    input.isPauseRequested = false;
    if (gameState.state === 'play') {
      gameState.state = 'paused';
      modals.showPauseMenu(
        () => { gameState.state = 'play'; },
        () => { gameState.exitToMainMenu(); }
      );
    } else if (gameState.state === 'paused') {
      modals.close();
      gameState.state = 'play';
    }
  }

  if (input.isMapRequested) {
    input.isMapRequested = false;
    if (gameState.state === 'map') {
      modals.close();
      gameState.state = 'play';
    } else if (gameState.state === 'play') {
      gameState.openFastTravelMap();
    }
  }

  if (gameState.state === 'play' && gameState.currentRoom) {
    // 1. Process player inputs
    input.update(gameState.player, gameState.enemies);

    // Keyboard action checks
    if (input.isInventoryRequested) {
      input.isInventoryRequested = false;
      gameState.state = 'inventory';
      modals.showInventory(gameState.player);
    }
    if (input.isLevelUpRequested) {
      input.isLevelUpRequested = false;
      if (gameState.player.pendingLevelUps > 0) {
        gameState.state = 'levelup';
        modals.showLevelUp(gameState.player);
      }
    }
    if (input.isCodexRequested) {
      input.isCodexRequested = false;
      modals.showCodex(false);
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
    if (input.isSkill2Pressed) {
      input.isSkill2Pressed = false;
      combat.castSkill2(gameState.player, gameState.currentRoom, gameState.enemies);
    }
    if (input.isDashPressed) {
      input.isDashPressed = false;
      combat.performDodge(gameState.player);
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

    // 3. Update Scene Lighting & Atmosphere based on Zone
    ambLight.color.setHex(gameState.currentZone.ambientColor);
    dirLight.color.setHex(gameState.currentZone.lightColor);
    playerTorch.color.setHex(gameState.currentZone.torchColor);
    playerTorch.position.set(gameState.player.x, 3.4, gameState.player.y);

    // Organic dual-frequency torch flicker
    playerTorch.intensity = 1.6 + Math.sin(now * 0.014) * 0.18 + Math.cos(now * 0.033) * 0.09;

    // Update atmospheric fog color smoothly per zone
    if (gameState.scene.fog) {
      (gameState.scene.fog as THREE.FogExp2).color.setHex(gameState.currentZone.fogColor);
    }

    // Ambient floating atmospheric motes (embers, spores, wisps, dust)
    if (Math.random() < 0.28) {
      const mx = Math.random() * WORLD_W;
      const my = 0.2 + Math.random() * 1.6;
      const mz = Math.random() * WORLD_H;
      let moteColor = 0xd4b886; // Azren ruins dust
      if (gameState.currentZone.id === 'elshiff') moteColor = 0x00ffee; // Elven mana wisp
      else if (gameState.currentZone.id === 'morgen') moteColor = 0x55ff77; // Swamp spore
      else if (gameState.currentZone.id === 'vazark') moteColor = 0xff6622; // Volcanic ember
      particles.spawnAmbientMote(mx, my, mz, moteColor);
    }

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

  // Dynamic Screen Shake (Game Feel & Impact Juice)
  let shakeX = 0;
  let shakeY = 0;
  let shakeZ = 0;

  if (combat.shakeTrauma > 0) {
    if (modals.settings.screenshake) {
      const traumaSq = combat.shakeTrauma * combat.shakeTrauma;
      const maxShake = 0.55;
      shakeX = (Math.random() * 2 - 1) * maxShake * traumaSq;
      shakeZ = (Math.random() * 2 - 1) * maxShake * traumaSq;
      shakeY = (Math.random() * 2 - 1) * (maxShake * 0.35) * traumaSq;
    }
    combat.shakeTrauma = Math.max(0, combat.shakeTrauma - dt * 2.8);
  }

  camera.position.set(
    camState.tx + shakeX,
    camState.d * Math.sin(PITCH) + shakeY,
    camState.tz + camState.d * Math.cos(PITCH) + shakeZ
  );
  camera.lookAt(camState.tx + shakeX * 0.4, 0, camState.tz + shakeZ * 0.4);

  // Update particles and floating numbers
  particles.update(dt, window.innerWidth, window.innerHeight);

  // Render WebGL Scene
  renderer.render(gameState.scene, camera);

  requestAnimationFrame(gameLoop);
}

// 5. Start Game: Show Intro / Main Menu first
requestAnimationFrame(gameLoop);
modals.showIntro();
