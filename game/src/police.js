// The wanted system and the Solmar Bay police. Stars rise when the player commits
// crimes in front of witnesses and fall when the player keeps clean; police cruisers
// spawn at the edge of the player's view, chase, ram, and at three stars and up try
// to drag the player out of the car.

import { CAR, WANTED, WORLD } from './config.js';
import { range } from './random.js';

export function createPolice() {
  return { cars: [], spawnTimer: 0, sirenOn: false };
}

export function addWanted(state, stars, reason) {
  const before = state.wanted;
  state.wanted = Math.min(WANTED.max, state.wanted + stars);
  state.wantedTimer = WANTED.decaySeconds;
  if (state.wanted > before) {
    state.events.push({ type: 'wanted', stars: state.wanted, reason });
  }
}

export function decayWanted(state, dt) {
  if (state.wanted === 0) return;
  state.wantedTimer -= dt;
  if (state.wantedTimer <= 0) {
    state.wanted -= 1;
    state.wantedTimer = WANTED.decaySeconds;
    if (state.wanted === 0) state.events.push({ type: 'clean' });
  }
}

export function wantedCarCount(wanted) {
  return wanted <= 0 ? 0 : Math.min(wanted, 5);
}

export function makePoliceCar(random, x, y) {
  return {
    id: 1000 + Math.floor(random() * 9000),
    kind: 'police',
    color: '#111827',
    x, y,
    angle: 0,
    speed: 0,
    hp: CAR.health,
    stuck: 0,
    ramCooldown: 0,
  };
}

function spawnPointNear(random, player) {
  const angle = random() * Math.PI * 2;
  const dist = range(random, 620, 780);
  return {
    x: Math.max(80, Math.min(WORLD.width - 80, player.x + Math.cos(angle) * dist)),
    y: Math.max(80, Math.min(WORLD.height - 80, player.y + Math.sin(angle) * dist)),
  };
}

export function maintainPolice(police, state, dt, random) {
  police.spawnTimer -= dt;
  const want = wantedCarCount(state.wanted);
  if (police.cars.length < want && police.spawnTimer <= 0) {
    police.spawnTimer = 2.2;
    const at = spawnPointNear(random, state.player);
    police.cars.push(makePoliceCar(random, at.x, at.y));
    state.events.push({ type: 'siren' });
  }
  // Cops give up once the heat is gone.
  if (state.wanted === 0 && police.cars.length > 0) {
    police.cars.length = 0;
  }
  police.sirenOn = police.cars.length > 0;
}

// Chase steering: aim at the player, accelerate, and ram. Returns the damage the
// cruiser deals to the player this step (0 when it is only closing in).
export function stepPoliceCar(cop, state, dt) {
  const player = state.player;
  const tx = player.car ? player.car.x : player.x;
  const ty = player.car ? player.car.y : player.y;
  const dx = tx - cop.x;
  const dy = ty - cop.y;
  const dist = Math.hypot(dx, dy) || 1;
  const targetAngle = Math.atan2(dy, dx);
  let diff = targetAngle - cop.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  cop.angle += Math.max(-3.2 * dt, Math.min(3.2 * dt, diff));
  const wantSpeed = Math.min(620, 300 + state.wanted * 55);
  cop.speed += (wantSpeed - cop.speed) * Math.min(1, dt * 1.4);
  cop.x += Math.cos(cop.angle) * cop.speed * dt;
  cop.y += Math.sin(cop.angle) * cop.speed * dt;
  cop.x = Math.max(40, Math.min(WORLD.width - 40, cop.x));
  cop.y = Math.max(40, Math.min(WORLD.height - 40, cop.y));
  cop.ramCooldown = Math.max(0, cop.ramCooldown - dt);

  if (dist < 46 && cop.ramCooldown <= 0) {
    cop.ramCooldown = 0.9;
    cop.speed *= 0.4;
    return player.car ? 12 : 18;
  }
  return 0;
}
