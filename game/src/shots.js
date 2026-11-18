// The screenshot scenes behind ?shot=cover|drive|chase|mission. Each one sets the
// real world to a fixed, seeded situation — a real game state, not a mock-up —
// and returns the screen to draw over it, so a headless screenshot is exactly
// what a player sees a few minutes into the game.

import { SCREEN_BRIEFING, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { makeTrafficCar } from './traffic.js';
import { makePoliceCar } from './police.js';

function placePlayerInCar(world, x, y, angle, speed) {
  const car = makeTrafficCar(world.random, x, y);
  car.kind = 'player';
  car.color = '#e63946';
  car.angle = angle;
  car.speed = speed || 0;
  car.hp = 100;
  world.state.player.car = car;
  world.state.player.onFoot = false;
  world.state.player.x = x;
  world.state.player.y = y;
  world.state.player.angle = angle;
  world.state.camera.x = Math.max(640, Math.min(3200 - 640, x));
  world.state.camera.y = Math.max(400, Math.min(2400 - 400, y));
}

function seedTrafficNear(world, x, y) {
  const traffic = world.traffic;
  traffic.cars.length = 0;
  traffic.peds.length = 0;
  const spots = [
    { x: x - 260, y: y - 15, dir: 1 },
    { x: x + 300, y: y + 15, dir: -1 },
    { x: x + 120, y: y - 220, dir: 1 },
    { x: x - 420, y: y + 15, dir: 1 },
    { x: x + 520, y: y - 15, dir: -1 },
  ];
  for (const spot of spots) {
    const car = makeTrafficCar(world.random, spot.x, spot.y);
    car.axis = 'h';
    car.line = spot.y;
    car.pos = spot.x;
    car.dir = spot.dir;
    car.speed = 150;
    traffic.cars.push(car);
  }
}

export function stageShot(name, world) {
  world.reset();
  const s = world.state;
  if (name === 'drive') {
    placePlayerInCar(world, 1400, 1000, 0, 320);
    seedTrafficNear(world, 1400, 1000);
    s.money = 1240;
    s.health = 92;
    s.missionIndex = 0;
    s.stageIndex = 1;
    s.stageStarted = true;
    s.stats.carsStolen = 1;
    s.toast = '';
    s.toastTimer = 0;
    return { screen: SCREEN_PLAY };
  }
  if (name === 'chase') {
    placePlayerInCar(world, 1800, 1400, 0, 420);
    seedTrafficNear(world, 1800, 1400);
    s.money = 2150;
    s.health = 64;
    s.wanted = 3;
    s.wantedTimer = 26;
    s.missionIndex = 3;
    s.stageIndex = 2;
    s.stageStarted = true;
    s.stats.missionsDone = 3;
    for (let i = 0; i < 3; i += 1) {
      const cop = makePoliceCar(world.random, 1800 - 140 - i * 90, 1400 + (i % 2 ? 30 : -30));
      cop.angle = 0;
      cop.speed = 480;
      world.police.cars.push(cop);
    }
    s.toast = 'The whole precinct is on you — lose them!';
    s.toastTimer = 99;
    return { screen: SCREEN_PLAY };
  }
  if (name === 'mission') {
    s.missionIndex = 1;
    s.stageIndex = 1;
    s.stageStarted = true;
    s.carrying = true;
    s.money = 860;
    s.health = 100;
    s.wanted = 2;
    s.wantedTimer = 26;
    s.stats.missionsDone = 1;
    // Driving up the marina avenue toward the delivery marker, one cruiser behind.
    placePlayerInCar(world, 2600, 600, -Math.PI / 2, 300);
    world.state.camera.x = 2500;
    world.state.camera.y = 450;
    const cop = makePoliceCar(world.random, 2600, 780);
    cop.angle = -Math.PI / 2;
    cop.speed = 430;
    world.police.cars.push(cop);
    s.toast = 'Deliver the crate to the Marina Cafe';
    s.toastTimer = 99;
    return { screen: SCREEN_PLAY };
  }
  if (name === 'briefing') {
    s.missionIndex = 2;
    s.stageIndex = 0;
    s.missionBriefing = world.currentMission().briefing;
    placePlayerInCar(world, 1000, 1000, 0, 0);
    return { screen: SCREEN_BRIEFING };
  }
  // Default: the cover — title screen over a living street.
  placePlayerInCar(world, 1400, 1000, 0, 0);
  seedTrafficNear(world, 1400, 1000);
  s.money = 1240;
  return { screen: SCREEN_TITLE };
}
