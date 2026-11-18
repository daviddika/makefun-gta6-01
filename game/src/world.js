// Solmar Heat — the world: the player on foot and in cars, stealing, driving,
// wanted heat, missions, combat wiring, pickups and the camera. Rules only; the
// renderer draws this state and main.js turns its events into sound and toasts.

import {
  CAR, LANE, MISSION_REWARDS, PISTOL, PLAYER, ROADS_X, ROADS_Y, SAVE_KEY, WANTED, WORLD,
} from './config.js';
import { createCity, LOCATIONS } from './city.js';
import { createRandom, range } from './random.js';
import { createTraffic, maintainTraffic, makePedestrian, makeTrafficCar, stepPedestrian, stepTrafficCar, syncCarPosition } from './traffic.js';
import { addWanted, createPolice, decayWanted, maintainPolice, stepPoliceCar } from './police.js';
import { MISSIONS, missionPlace } from './missions.js';
import {
  createCombat, fireBullet, punch, spawnEnemy, spawnParticles, spawnPickup,
  stepBullets, stepEnemies, stepParticles, stepPickups,
} from './combat.js';

export const EVENT_ENTER = 1;

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function createWorld(random) {
  const city = createCity(random);
  const traffic = createTraffic(random);
  const police = createPolice();
  const combat = createCombat();

  const player = {
    x: 600, y: 1000, angle: 0,
    onFoot: true, car: null,
    weapon: 'pistol', ammo: PISTOL.startAmmo,
    punchCooldown: 0, shootCooldown: 0, invulnerable: 0,
    speed: 0,
  };

  const state = {
    time: 0,
    money: 50,
    health: PLAYER.health,
    wanted: 0,
    wantedTimer: WANTED.decaySeconds,
    player,
    camera: { x: 600, y: 1000 },
    missionIndex: 0,
    stageIndex: 0,
    stageStarted: false,
    stageProgress: 0,
    stageKills: 0,
    carrying: false,
    missionBriefing: '',
    toast: '',
    toastTimer: 0,
    stats: { carsStolen: 0, kills: 0, assaults: 0, missionsDone: 0, shotsFired: 0, pedsDown: 0 },
    events: [],
    busted: false,
    bustedReason: '',
    win: false,
    lastHurt: 99,
    parked: [],
  };

  function toast(message, seconds) {
    state.toast = message;
    state.toastTimer = seconds || 4;
  }

  function currentMission() {
    return MISSIONS[state.missionIndex] || null;
  }

  function currentStage() {
    const mission = currentMission();
    return mission ? mission.stages[state.stageIndex] : null;
  }

  function playerPos() {
    return player.car ? { x: player.car.x, y: player.car.y } : { x: player.x, y: player.y };
  }

  function placeParkedCars() {
    const spots = [
      { x: 600 + 52, y: 1000 - 52, color: '#d94f3d' },
      { x: 1000 - 52, y: 600 + 52, color: '#3d7bd9' },
      { x: 1800 + 52, y: 1800 - 52, color: '#e8b73d' },
      { x: 2200 - 52, y: 1000 + 52, color: '#4fae62' },
    ];
    for (const spot of spots) {
      const car = makeTrafficCar(random, spot.x, spot.y);
      car.kind = 'parked';
      car.color = spot.color;
      car.speed = 0;
      state.parked.push(car);
    }
  }

  function scatterPickups() {
    const spots = [
      { x: 1000, y: 200, kind: 'cash', amount: 25 },
      { x: 2200, y: 1400, kind: 'cash', amount: 25 },
      { x: 600, y: 2200, kind: 'cash', amount: 40 },
      { x: 2600, y: 1000, kind: 'cash', amount: 25 },
      { x: 1400, y: 600, kind: 'cash', amount: 25 },
      { x: 600, y: 1800, kind: 'health', amount: 50 },
      { x: 1800, y: 1400, kind: 'health', amount: 50 },
      { x: 600, y: 1800, kind: 'ammo', amount: 24 },
    ];
    for (const spot of spots) spawnPickup(combat, spot.x, spot.y, spot.kind, spot.amount);
  }

  function reset() {
    player.x = 600;
    player.y = 1000;
    player.angle = 0;
    player.onFoot = true;
    player.car = null;
    player.ammo = PISTOL.startAmmo;
    player.punchCooldown = 0;
    player.shootCooldown = 0;
    player.invulnerable = 0;
    state.time = 0;
    state.money = 50;
    state.health = PLAYER.health;
    state.wanted = 0;
    state.wantedTimer = WANTED.decaySeconds;
    state.camera.x = 600;
    state.camera.y = 1000;
    state.missionIndex = 0;
    state.stageIndex = 0;
    state.stageStarted = false;
    state.stageProgress = 0;
    state.stageKills = 0;
    state.carrying = false;
    state.stats = { carsStolen: 0, kills: 0, assaults: 0, missionsDone: 0, shotsFired: 0, pedsDown: 0 };
    state.events.length = 0;
    state.busted = false;
    state.bustedReason = '';
    state.win = false;
    state.lastHurt = 99;
    state.parked.length = 0;
    combat.bullets.length = 0;
    combat.enemies.length = 0;
    combat.pickups.length = 0;
    combat.particles.length = 0;
    traffic.cars.length = 0;
    traffic.peds.length = 0;
    police.cars.length = 0;
    for (let i = 0; i < 14; i += 1) traffic.cars.push(makeTrafficCar(random));
    for (let i = 0; i < 26; i += 1) traffic.peds.push(makePedestrian(random));
    placeParkedCars();
    scatterPickups();
    const mission = currentMission();
    state.missionBriefing = mission ? mission.briefing : '';
    toast('Welcome to Solmar Bay — follow the yellow marker', 5);
  }

  function hurtPlayer(amount, reason) {
    if (player.invulnerable > 0 || state.busted) return;
    state.health -= amount;
    state.lastHurt = 0;
    player.invulnerable = 0.4;
    if (state.health <= 0) {
      state.health = 0;
      state.busted = true;
      state.bustedReason = reason || (state.wanted > 0 ? 'BUSTED by the Solmar Bay police' : 'WASTED on the streets of Solmar Bay');
      state.events.push({ type: 'fail' });
    }
  }

  function damagePlayerCar(amount) {
    const car = player.car;
    if (!car) return;
    car.hp -= amount;
    if (car.hp <= 0) {
      spawnParticles(combat, car.x, car.y, '#ff7b00', 30, 320);
      spawnParticles(combat, car.x, car.y, '#333333', 20, 160);
      state.events.push({ type: 'crash' });
      toast('Your car is wrecked!', 3);
      ejectPlayer();
    }
  }

  function ejectPlayer() {
    const car = player.car;
    if (!car) return;
    player.x = car.x + 40;
    player.y = car.y;
    player.onFoot = true;
    player.car = null;
    city.collideCircle(player, PLAYER.radius);
  }

  function nearestStealableCar() {
    const pos = { x: player.x, y: player.y };
    let best = null;
    let bestDist = 78;
    const all = traffic.cars.concat(state.parked);
    for (const car of all) {
      const d = dist(pos, car);
      if (d < bestDist) {
        bestDist = d;
        best = car;
      }
    }
    return best;
  }

  function enterCar() {
    if (!player.onFoot) {
      ejectPlayer();
      return;
    }
    const car = nearestStealableCar();
    if (!car) {
      toast('No car close enough — walk up to one and press E', 2.5);
      return;
    }
    // Pull it out of traffic / the parked row and make it the player's ride.
    const ti = traffic.cars.indexOf(car);
    if (ti >= 0) traffic.cars.splice(ti, 1);
    const pi = state.parked.indexOf(car);
    if (pi >= 0) state.parked.splice(pi, 1);
    if (car.kind === 'traffic') {
      const driver = makePedestrian(random);
      driver.x = car.x + 30;
      driver.y = car.y + 10;
      driver.state = 'flee';
      driver.fleeTimer = 3;
      traffic.peds.push(driver);
      state.stats.carsStolen += 1;
      addWanted(state, WANTED.stealStars, 'Grand theft auto');
      state.events.push({ type: 'steal' });
      toast('Car stolen! The owner called the cops — +1 star', 3.5);
    } else {
      state.events.push({ type: 'steal' });
      toast('You took the car. Nice wheels.', 2.5);
    }
    car.kind = 'player';
    car.speed = 0;
    car.hp = car.hp > 0 ? car.hp : CAR.health;
    player.car = car;
    player.onFoot = false;
    player.x = car.x;
    player.y = car.y;
    state.events.push({ type: 'enteredCar' });
  }

  function stepOnFoot(dt, input) {
    let mx = 0;
    let my = 0;
    if (input.up) my -= 1;
    if (input.down) my += 1;
    if (input.left) mx -= 1;
    if (input.right) mx += 1;
    const len = Math.hypot(mx, my) || 1;
    const speed = input.run ? PLAYER.runSpeed : PLAYER.walkSpeed;
    player.x += (mx / len) * speed * dt * (mx || my ? 1 : 0);
    player.y += (my / len) * speed * dt * (mx || my ? 1 : 0);
    player.speed = (mx || my) ? speed : 0;
    if (input.mouseWorld) {
      player.angle = Math.atan2(input.mouseWorld.y - player.y, input.mouseWorld.x - player.x);
    } else if (mx || my) {
      player.angle = Math.atan2(my, mx);
    }
    player.x = clamp(player.x, 24, WORLD.width - 24);
    player.y = clamp(player.y, 24, WORLD.height - 24);
    city.collideCircle(player, PLAYER.radius);
    // Bumped by a passing car.
    for (const car of traffic.cars) {
      if (dist(player, car) < 34) {
        hurtPlayer(10, 'WASTED on the streets of Solmar Bay');
        player.x += (player.x - car.x) * 0.4;
        player.y += (player.y - car.y) * 0.4;
      }
    }
    player.punchCooldown = Math.max(0, player.punchCooldown - dt);
    player.shootCooldown = Math.max(0, player.shootCooldown - dt);
    if (input.melee && player.punchCooldown <= 0) {
      player.punchCooldown = PLAYER.punchCooldown;
      const hit = punch(state, combat, player.angle);
      state.events.push({ type: 'punch' });
      if (hit) addWanted(state, WANTED.assaultStars, 'Assault');
    }
    if (input.mouseDown && player.shootCooldown <= 0 && input.mouseWorld) {
      if (player.ammo > 0) {
        player.shootCooldown = PISTOL.cooldown;
        player.ammo -= 1;
        state.stats.shotsFired += 1;
        const angle = Math.atan2(input.mouseWorld.y - player.y, input.mouseWorld.x - player.x);
        fireBullet(combat, player.x + Math.cos(angle) * 20, player.y + Math.sin(angle) * 20, angle);
        state.events.push({ type: 'shoot' });
      } else if (player.punchCooldown <= 0) {
        player.punchCooldown = PLAYER.punchCooldown;
        punch(state, combat, player.angle);
        state.events.push({ type: 'punch' });
      }
    }
  }

  function stepDriving(dt, input) {
    const car = player.car;
    if (!car) {
      player.onFoot = true;
      return;
    }
    if (input.up) car.speed += CAR.accel * dt;
    else if (input.down) {
      if (car.speed > 20) car.speed -= CAR.brake * dt;
      else car.speed -= CAR.reverseAccel * dt;
    } else {
      car.speed -= car.speed * 0.6 * dt;
    }
    if (input.left || input.right) {
      const steer = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      const grip = clamp(Math.abs(car.speed) / CAR.maxSpeed, 0.25, 1);
      car.angle += steer * CAR.turnRate * grip * dt * (car.speed >= 0 ? 1 : -1);
    }
    car.speed = clamp(car.speed, -CAR.maxReverse, CAR.maxSpeed);
    const nx = car.x + Math.cos(car.angle) * car.speed * dt;
    const ny = car.y + Math.sin(car.angle) * car.speed * dt;
    car.x = nx;
    car.y = ny;
    player.x = car.x;
    player.y = car.y;
    player.angle = car.angle;
    player.speed = Math.abs(car.speed);
    const hitBuilding = city.collideCircle(car, 22);
    if (hitBuilding && Math.abs(car.speed) > 140) {
      damagePlayerCar(6);
      car.speed *= 0.55;
      spawnParticles(combat, car.x, car.y, '#c8c8c8', 6, 140);
      state.events.push({ type: 'crash' });
    }
    if (hitBuilding) car.speed *= 0.92;
    car.x = clamp(car.x, 30, WORLD.width - 30);
    car.y = clamp(car.y, 30, WORLD.height - 30);
    // Run over pedestrians: costly, and witnesses call it in.
    for (const ped of traffic.peds) {
      if (ped.state !== 'down' && dist(car, ped) < 30 && Math.abs(car.speed) > 60) {
        ped.state = 'down';
        ped.downTimer = 8;
        state.stats.pedsDown += 1;
        addWanted(state, WANTED.assaultStars, 'Hit and run');
        spawnParticles(combat, ped.x, ped.y, '#e63946', 10, 200);
        state.events.push({ type: 'crash' });
        toast('You hit a pedestrian! +1 star', 3);
        car.speed *= 0.7;
      }
    }
    // Smash into traffic.
    for (let i = traffic.cars.length - 1; i >= 0; i -= 1) {
      const other = traffic.cars[i];
      const d = dist(car, other);
      if (d < 46 && d > 0.01) {
        const push = (46 - d) / 2;
        const ux = (car.x - other.x) / d;
        const uy = (car.y - other.y) / d;
        car.x += ux * push;
        car.y += uy * push;
        other.x -= ux * push;
        other.y -= uy * push;
        if (other.axis === 'h') other.pos = other.x;
        else other.pos = other.y;
        if (Math.abs(car.speed) > 120) {
          damagePlayerCar(5);
          other.hp -= 18;
          spawnParticles(combat, other.x, other.y, '#ffd23d', 8, 180);
          state.events.push({ type: 'crash' });
          car.speed *= 0.55;
          if (other.hp <= 0) {
            spawnParticles(combat, other.x, other.y, '#ff7b00', 24, 300);
            traffic.cars.splice(i, 1);
            addWanted(state, WANTED.assaultStars, 'Wrecked a car');
          }
        }
      }
    }
  }

  function bulletHit(bullet) {
    // Enemies first.
    for (const e of combat.enemies) {
      if (Math.hypot(e.x - bullet.x, e.y - bullet.y) < 20) {
        e.hp -= PISTOL.damage;
        spawnParticles(combat, bullet.x, bullet.y, '#e63946', 6, 160);
        if (e.hp <= 0) {
          state.stats.kills += 1;
          state.stageKills += 1;
          state.money += 20;
        }
        return true;
      }
    }
    for (const ped of traffic.peds) {
      if (ped.state !== 'down' && Math.hypot(ped.x - bullet.x, ped.y - bullet.y) < 16) {
        ped.state = 'down';
        ped.downTimer = 8;
        state.stats.pedsDown += 1;
        addWanted(state, WANTED.killStars, 'Shot a civilian');
        spawnParticles(combat, bullet.x, bullet.y, '#e63946', 8, 180);
        return true;
      }
    }
    for (const cop of police.cars) {
      if (Math.hypot(cop.x - bullet.x, cop.y - bullet.y) < 26) {
        cop.hp -= PISTOL.damage;
        spawnParticles(combat, bullet.x, bullet.y, '#9db8ff', 6, 160);
        addWanted(state, WANTED.copKillStars, 'Shot at police');
        if (cop.hp <= 0) {
          spawnParticles(combat, cop.x, cop.y, '#ff7b00', 26, 300);
          police.cars.splice(police.cars.indexOf(cop), 1);
        }
        return true;
      }
    }
    for (const car of traffic.cars) {
      if (Math.hypot(car.x - bullet.x, car.y - bullet.y) < 26) {
        car.hp -= PISTOL.damage;
        if (car.hp <= 0) {
          spawnParticles(combat, car.x, car.y, '#ff7b00', 24, 300);
          traffic.cars.splice(traffic.cars.indexOf(car), 1);
          addWanted(state, WANTED.assaultStars, 'Destroyed a car');
        }
        return true;
      }
    }
    return false;
  }

  function startStage() {
    const stage = currentStage();
    if (!stage) return;
    state.stageStarted = true;
    state.stageProgress = 0;
    if (stage.type === 'defeat') {
      const place = missionPlace(stage);
      const kind = state.missionIndex === 4 ? 'guard' : 'thug';
      for (let i = 0; i < stage.count; i += 1) {
        spawnEnemy(combat, place.x + range(random, -90, 90), place.y + range(random, -90, 90), kind);
      }
      toast(`${stage.count} ${kind === 'guard' ? 'guards' : 'Vultures'} are waiting for you`, 4);
    }
    if (stage.type === 'collect') {
      const place = missionPlace(stage);
      const kind = state.missionIndex === 4 ? 'case' : 'crate';
      spawnPickup(combat, place.x, place.y, kind, 0);
    }
    if (stage.type === 'deliver' && state.missionIndex === 1) {
      state.wanted = Math.max(state.wanted, 2);
      state.wantedTimer = WANTED.decaySeconds;
      toast('Harbour police are onto you — 2 stars!', 4);
    }
    if (stage.type === 'wait' && state.missionIndex === 3) {
      state.wanted = 3;
      state.wantedTimer = WANTED.decaySeconds;
      toast('ALARM! The bank job is hot — 3 stars!', 4);
    }
  }

  function advanceStage() {
    state.stageIndex += 1;
    state.stageStarted = false;
    state.stageProgress = 0;
    state.stageKills = 0;
    const mission = currentMission();
    if (mission && state.stageIndex >= mission.stages.length) {
      completeMission();
    }
  }

  function completeMission() {
    const reward = MISSION_REWARDS[state.missionIndex] || 0;
    state.money += reward;
    state.stats.missionsDone += 1;
    state.carrying = false;
    state.events.push({ type: 'mission', reward });
    toast(`Mission complete! +$${reward}`, 5);
    state.missionIndex += 1;
    state.stageIndex = 0;
    state.stageStarted = false;
    if (state.missionIndex >= MISSIONS.length) {
      state.win = true;
      state.events.push({ type: 'win' });
      return;
    }
    const next = currentMission();
    state.missionBriefing = next.briefing;
    toast(`New mission: ${next.title}`, 5);
    state.events.push({ type: 'save' });
  }

  function updateMission(dt) {
    const mission = currentMission();
    if (!mission || state.win) return;
    const stage = currentStage();
    if (!stage) return;
    if (!state.stageStarted) startStage();
    const pos = playerPos();
    if (stage.type === 'stealCar') {
      if (state.stats.carsStolen > 0 || player.car) advanceStage();
    } else if (stage.type === 'goto' || stage.type === 'deliver') {
      const place = missionPlace(stage);
      if (place && dist(pos, place) < 80) advanceStage();
    } else if (stage.type === 'wait') {
      const place = missionPlace(stage);
      if (place && dist(pos, place) < 80) {
        state.stageProgress += dt;
        if (state.stageProgress >= stage.seconds) {
          state.money += 150;
          toast('Cash grabbed! +$150', 3);
          advanceStage();
        }
      }
    } else if (stage.type === 'collect') {
      // The pickup's onTake handler advances the stage.
    } else if (stage.type === 'defeat') {
      if (combat.enemies.length === 0) advanceStage();
    }
  }

  function takePickup(p) {
    if (p.kind === 'cash') {
      state.money += p.amount;
      state.events.push({ type: 'cash', amount: p.amount });
      toast(`+$${p.amount}`, 2);
    } else if (p.kind === 'health') {
      state.health = Math.min(PLAYER.health, state.health + p.amount);
      state.events.push({ type: 'pickup' });
      toast(`Health +${p.amount}`, 2);
    } else if (p.kind === 'ammo') {
      player.ammo += p.amount;
      state.events.push({ type: 'pickup' });
      toast(`Ammo +${p.amount}`, 2);
    } else if (p.kind === 'crate' || p.kind === 'case') {
      state.carrying = true;
      state.events.push({ type: 'pickup' });
      toast(p.kind === 'case' ? 'Cash case secured!' : 'Crate secured — deliver it!', 3.5);
      advanceStage();
    }
  }

  function step(dt, input, actions) {
    if (state.busted || state.win) {
      stepParticles(combat, dt);
      return;
    }
    state.time += dt;
    state.lastHurt += dt;
    state.toastTimer = Math.max(0, state.toastTimer - dt);
    player.invulnerable = Math.max(0, player.invulnerable - dt);

    if (actions & EVENT_ENTER) enterCar();
    if (player.onFoot) stepOnFoot(dt, input);
    else stepDriving(dt, input);

    // Traffic and pedestrians keep the city alive.
    for (const car of traffic.cars) stepTrafficCar(car, dt, random);
    for (let i = traffic.peds.length - 1; i >= 0; i -= 1) {
      const ped = traffic.peds[i];
      if (ped.state === 'down') {
        ped.downTimer = (ped.downTimer || 8) - dt;
        if (ped.downTimer <= 0) traffic.peds.splice(i, 1);
        continue;
      }
      const threat = player.car
        ? (dist(player.car, ped) < 130 && Math.abs(player.car.speed) > 120 ? player.car : null)
        : (dist(player, ped) < 60 ? player : null);
      stepPedestrian(ped, dt, random, threat);
    }
    maintainTraffic(traffic, dt, random, playerPos());

    // Wanted heat and the police response.
    decayWanted(state, dt);
    maintainPolice(police, state, dt, random);
    for (const cop of police.cars.slice()) {
      city.collideCircle(cop, 20);
      const damage = stepPoliceCar(cop, state, dt);
      if (damage > 0) {
        if (player.car) {
          damagePlayerCar(damage);
          cop.speed *= 0.3;
        } else {
          hurtPlayer(damage, 'BUSTED by the Solmar Bay police');
        }
        spawnParticles(combat, cop.x, cop.y, '#ffd23d', 6, 160);
        state.events.push({ type: 'crash' });
      }
      // A cruiser ramming the player's car also shoves it.
      if (player.car && dist(cop, player.car) < 48) {
        player.car.speed *= 0.85;
      }
    }

    // Combat: bullets, enemies, pickups, particles.
    stepBullets(combat, dt, city, bulletHit);
    const enemiesBefore = combat.enemies.length;
    stepEnemies(combat, dt, player, city, (damage) => hurtPlayer(damage, 'WASTED on the streets of Solmar Bay'));
    if (combat.enemies.length < enemiesBefore && currentStage() && currentStage().type === 'defeat') {
      state.stageKills += enemiesBefore - combat.enemies.length;
    }
    stepPickups(combat, dt, player, takePickup);
    stepParticles(combat, dt);

    // Slow health regen once the player has been calm for a while.
    if (state.lastHurt > 8 && state.health > 0 && state.health < PLAYER.health) {
      state.health = Math.min(PLAYER.health, state.health + 3 * dt);
    }

    updateMission(dt);

    // Camera follows the player (or the car), clamped to the city.
    const focus = playerPos();
    state.camera.x = clamp(focus.x, 640, WORLD.width - 640);
    state.camera.y = clamp(focus.y, 400, WORLD.height - 400);
  }

  function snapshot() {
    return {
      money: state.money,
      health: state.health,
      missionIndex: state.missionIndex,
      stageIndex: state.stageIndex,
      x: player.x,
      y: player.y,
      ammo: player.ammo,
      stats: state.stats,
      time: state.time,
    };
  }

  function restore(save) {
    reset();
    state.money = save.money ?? 50;
    state.health = save.health ?? PLAYER.health;
    state.missionIndex = Math.min(save.missionIndex ?? 0, MISSIONS.length - 1);
    state.stageIndex = save.stageIndex ?? 0;
    state.stageStarted = false;
    player.x = save.x ?? 600;
    player.y = save.y ?? 1000;
    player.ammo = save.ammo ?? PISTOL.startAmmo;
    state.stats = { ...state.stats, ...(save.stats || {}) };
    state.time = save.time ?? 0;
    state.camera.x = clamp(player.x, 640, WORLD.width - 640);
    state.camera.y = clamp(player.y, 400, WORLD.height - 400);
    const mission = currentMission();
    state.missionBriefing = mission ? mission.briefing : '';
    toast(`Save loaded — ${mission ? mission.title : 'free roam'}`, 4);
  }

  reset();
  return {
    state, city, traffic, police, combat, random,
    reset, step, enterCar, currentMission, currentStage, playerPos, missionPlace,
    snapshot, restore, toast,
  };
}
