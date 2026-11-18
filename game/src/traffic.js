// Traffic cars that drive the road grid and pedestrians who walk the sidewalks.
// Traffic follows one road at a time and turns at intersections; pedestrians stroll,
// and both scatter when the player causes trouble nearby.

import { CAR, LANE, PEDESTRIANS, ROADS_X, ROADS_Y, TRAFFIC_CARS, WORLD } from './config.js';
import { integer, pick, range } from './random.js';

const CAR_COLORS = ['#d94f3d', '#3d7bd9', '#e8e8e8', '#2b2b2b', '#e8b73d', '#4fae62', '#8a5fd0', '#d97fb0', '#c8c8c8'];
const PED_COLORS = ['#e63946', '#2a9d8f', '#e9c46a', '#6d28d9', '#f4a261', '#90be6d', '#577590', '#f15bb5', '#00bbf9'];
const PED_NAMES = ['Marta', 'Jo', 'Kiko', 'Ana', 'Ben', 'Luz', 'Tomas', 'Rita', 'Sam', 'Nina', 'Omar', 'Paz'];

let nextCarId = 1;
let nextPedId = 1;

function randomRoadPoint(random) {
  if (random() < 0.5) {
    return { axis: 'h', line: pick(random, ROADS_Y), pos: range(random, 100, WORLD.width - 100), dir: random() < 0.5 ? 1 : -1 };
  }
  return { axis: 'v', line: pick(random, ROADS_X), pos: range(random, 100, WORLD.height - 100), dir: random() < 0.5 ? 1 : -1 };
}

export function makeTrafficCar(random, x, y) {
  const road = randomRoadPoint(random);
  const car = {
    id: nextCarId,
    kind: 'traffic',
    color: pick(random, CAR_COLORS),
    axis: road.axis,
    line: road.line,
    pos: road.pos,
    dir: road.dir,
    speed: range(random, 110, 190),
    x: 0, y: 0, angle: 0,
    hp: CAR.health,
    honk: 0,
  };
  nextCarId += 1;
  if (x !== undefined) {
    car.x = x;
    car.y = y;
    car.axis = 'h';
    car.line = y;
    car.pos = x;
  } else {
    syncCarPosition(car);
  }
  return car;
}

export function syncCarPosition(car) {
  if (car.axis === 'h') {
    car.x = car.pos;
    car.y = car.line + (car.dir > 0 ? LANE : -LANE);
    car.angle = car.dir > 0 ? 0 : Math.PI;
  } else {
    car.x = car.line + (car.dir > 0 ? LANE : -LANE);
    car.y = car.pos;
    car.angle = car.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
  }
}

function atIntersection(car) {
  const list = car.axis === 'h' ? ROADS_X : ROADS_Y;
  for (const line of list) if (Math.abs(car.pos - line) < 6) return line;
  return null;
}

export function stepTrafficCar(car, dt, random) {
  car.pos += car.dir * car.speed * dt;
  const cross = atIntersection(car);
  if (cross !== null && random() < 0.35) {
    // Turn onto the crossing road.
    if (car.axis === 'h') {
      car.axis = 'v';
      car.line = cross;
      car.pos = car.y;
      car.dir = random() < 0.5 ? 1 : -1;
    } else {
      car.axis = 'h';
      car.line = cross;
      car.pos = car.x;
      car.dir = random() < 0.5 ? 1 : -1;
    }
  }
  const limit = car.axis === 'h' ? WORLD.width : WORLD.height;
  if (car.pos < 60 || car.pos > limit - 60) {
    car.dir *= -1;
    car.pos = Math.max(60, Math.min(limit - 60, car.pos));
  }
  syncCarPosition(car);
}

export function makePedestrian(random) {
  const road = randomRoadPoint(random);
  const onSidewalk = random() < 0.7;
  const ped = {
    id: nextPedId,
    name: pick(random, PED_NAMES),
    color: pick(random, PED_COLORS),
    x: 0, y: 0,
    angle: 0,
    speed: range(random, 45, 85),
    dir: random() < 0.5 ? 1 : -1,
    axis: road.axis,
    line: road.line,
    pos: road.pos,
    state: 'walk',
    fleeTimer: 0,
    hp: 50,
    bob: random() * Math.PI * 2,
  };
  nextPedId += 1;
  const off = (onSidewalk ? 46 : 15) * (random() < 0.5 ? 1 : -1);
  if (road.axis === 'h') {
    ped.x = ped.pos;
    ped.y = road.line + off;
  } else {
    ped.x = road.line + off;
    ped.y = ped.pos;
  }
  return ped;
}

export function stepPedestrian(ped, dt, random, threat) {
  ped.bob += dt * 8;
  if (threat) {
    ped.state = 'flee';
    ped.fleeTimer = 1.6;
  }
  if (ped.fleeTimer > 0) {
    ped.fleeTimer -= dt;
    if (ped.fleeTimer <= 0) ped.state = 'walk';
  }
  const speed = ped.state === 'flee' ? ped.speed * 2.6 : ped.speed;
  if (ped.state === 'flee' && threat) {
    const dx = ped.x - threat.x;
    const dy = ped.y - threat.y;
    const d = Math.hypot(dx, dy) || 1;
    ped.x += (dx / d) * speed * dt;
    ped.y += (dy / d) * speed * dt;
    ped.angle = Math.atan2(dy, dx);
  } else {
    ped.pos += ped.dir * speed * dt;
    const limit = ped.axis === 'h' ? WORLD.width : WORLD.height;
    if (ped.pos < 60 || ped.pos > limit - 60) {
      ped.dir *= -1;
      ped.pos = Math.max(60, Math.min(limit - 60, ped.pos));
    }
    if (ped.axis === 'h') {
      ped.x = ped.pos;
      ped.angle = ped.dir > 0 ? 0 : Math.PI;
    } else {
      ped.y = ped.pos;
      ped.angle = ped.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    }
  }
  ped.x = Math.max(30, Math.min(WORLD.width - 30, ped.x));
  ped.y = Math.max(30, Math.min(WORLD.height - 30, ped.y));
}

export function createTraffic(random) {
  const cars = [];
  const peds = [];
  for (let i = 0; i < TRAFFIC_CARS; i += 1) cars.push(makeTrafficCar(random));
  for (let i = 0; i < PEDESTRIANS; i += 1) peds.push(makePedestrian(random));
  return { cars, peds, nextSpawn: 2 };
}

export function maintainTraffic(traffic, dt, random, player) {
  traffic.nextSpawn -= dt;
  if (traffic.nextSpawn > 0) return;
  traffic.nextSpawn = 1.5;
  if (traffic.cars.length < TRAFFIC_CARS) {
    const car = makeTrafficCar(random);
    // Keep new traffic away from the player's face.
    if (Math.hypot(car.x - player.x, car.y - player.y) > 500) traffic.cars.push(car);
  }
  if (traffic.peds.length < PEDESTRIANS) {
    const ped = makePedestrian(random);
    if (Math.hypot(ped.x - player.x, ped.y - player.y) > 350) traffic.peds.push(ped);
  }
}
