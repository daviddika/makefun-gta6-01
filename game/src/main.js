// Solmar Heat — boot and the one loop: input is read every frame, the world
// advances in fixed 1/60 s steps, and the renderer paints what is there. Screens:
// title, mission briefing, play, paused, busted/wasted, and win.
//
// ?seed=N fixes the city. ?shot=cover|drive|chase|mission|briefing (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot. ?test=1 runs a scripted headless
// play-through and writes its results into document.title.

import { BEST_KEY, SAVE_KEY, STEP, VIEW } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_ENTER } from './world.js';
import { createAudio } from './audio.js';
import { spawnEnemy } from './combat.js';
import {
  ACTION_CONFIRM, ACTION_ENTER, ACTION_MELEE, ACTION_NEWGAME, ACTION_PAUSE,
  ACTION_QUIT, ACTION_SAVE, createInput,
} from './input.js';
import {
  SCREEN_BRIEFING, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN, createRenderer,
} from './render.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const testMode = params.get('test') === '1';
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const audio = createAudio();

function readNumber(key) {
  try {
    return Number.parseInt(window.localStorage.getItem(key) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveGame() {
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(world.snapshot()));
    window.localStorage.setItem(BEST_KEY, String(Math.max(readNumber(BEST_KEY), world.state.money)));
    return true;
  } catch {
    return false;
  }
}

function loadSave() {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  world.bestMoney = readNumber(BEST_KEY);
  world.hasSave = !!loadSave();
  let painted = 0;
  function paint() {
    renderer.draw(world, scene.screen);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else {
      window.__shotReady = true;
      document.title = 'SHOT READY: ' + name;
    }
  }
  requestAnimationFrame(paint);
}

// A scripted headless play-through: walk, steal a car, drive, earn wanted stars,
// outrun the police, shoot an enemy, finish mission 1, save and load. Writes
// TEST:JSON to the document title so a headless run can read the verdict.
function runTest() {
  const results = {};
  const input = { up: false, down: false, left: false, right: false, run: false, mouseDown: false, mouseWorld: null };
  function steps(n) {
    for (let i = 0; i < n; i += 1) world.step(STEP, input, 0);
  }
  try {
    // Walk forward for a second.
    input.up = true;
    steps(60);
    input.up = false;
    results.walkMoved = Math.abs(world.state.player.y - 1000) > 50;
    // Teleport next to a parked car and steal it with E.
    const parked = world.state.parked[0];
    world.state.player.x = parked.x - 20;
    world.state.player.y = parked.y;
    world.step(STEP, input, EVENT_ENTER);
    results.stoleCar = !world.state.player.onFoot && !!world.state.player.car;
    results.mission1StageAdvanced = world.state.stageIndex === 1;
    // Put the car on the road and drive east for 6 seconds.
    const car = world.state.player.car;
    car.x = 700;
    car.y = 1000;
    car.angle = 0;
    car.speed = 0;
    world.state.player.x = 700;
    world.state.player.y = 1000;
    input.up = true;
    steps(360);
    input.up = false;
    results.drove = Math.hypot(world.state.player.x - 700, world.state.player.y - 1000) > 200;
    results.wantedAfterSteal = world.state.wanted;
    // Force a chase: 3 stars, let the police spawn and close in.
    world.state.wanted = 3;
    world.state.wantedTimer = 26;
    steps(300);
    results.policeSpawned = world.police.cars.length > 0;
    // Combat: get out of the car, spawn an enemy ahead, aim and shoot until it falls.
    world.step(STEP, input, EVENT_ENTER);
    world.state.player.x = 1000;
    world.state.player.y = 1000;
    const enemyX = world.state.player.x + 120;
    const enemyY = world.state.player.y;
    spawnEnemy(world.combat, enemyX, enemyY, 'thug');
    const ammoBefore = world.state.player.ammo;
    input.mouseDown = true;
    input.mouseWorld = { x: enemyX, y: enemyY };
    let shot = false;
    for (let i = 0; i < 180 && world.combat.enemies.length > 0; i += 1) {
      world.step(STEP, input, 0);
      shot = true;
    }
    input.mouseDown = false;
    input.mouseWorld = null;
    results.enemyShot = shot && world.combat.enemies.length === 0;
    results.ammoUsed = ammoBefore - world.state.player.ammo > 0;
    results.kills = world.state.stats.kills;
    // Drive to the garage marker to finish mission 1.
    const garage = { x: 600, y: 1800 };
    world.state.player.x = garage.x;
    world.state.player.y = garage.y;
    if (world.state.player.car) {
      world.state.player.car.x = garage.x;
      world.state.player.car.y = garage.y;
    }
    steps(5);
    results.mission1Done = world.state.missionIndex === 1 && world.state.stats.missionsDone === 1;
    results.moneyAfterMission1 = world.state.money;
    // Save, reset, load, and confirm the money and mission survive.
    const saved = saveGame();
    const moneyBefore = world.state.money;
    world.reset();
    const save = loadSave();
    if (save) world.restore(save);
    results.saveOk = saved && !!save;
    results.loadRestoresMoney = world.state.money === moneyBefore;
    results.loadRestoresMission = world.state.missionIndex === 1;
    results.ok = results.walkMoved && results.stoleCar && results.drove && results.policeSpawned
      && results.enemyShot && results.ammoUsed && results.mission1Done && results.saveOk
      && results.loadRestoresMoney && results.loadRestoresMission;
  } catch (error) {
    results.ok = false;
    results.error = String(error && error.message ? error.message : error);
  }
  document.title = 'TEST:' + JSON.stringify(results);
  window.__shotReady = true;
  window.__testResults = results;
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let accumulator = 0;
  let last = performance.now();
  const save = loadSave();
  world.hasSave = !!save;
  world.bestMoney = readNumber(BEST_KEY);

  function announce(message) {
    status.textContent = message;
  }

  function drainEvents() {
    for (const event of world.state.events) {
      if (event.type === 'shoot') audio.shoot();
      else if (event.type === 'punch') audio.punch();
      else if (event.type === 'crash') audio.crash();
      else if (event.type === 'pickup') audio.pickup();
      else if (event.type === 'cash') audio.cash();
      else if (event.type === 'steal') audio.steal();
      else if (event.type === 'wanted') audio.wanted();
      else if (event.type === 'mission') { audio.mission(); saveGame(); }
      else if (event.type === 'fail') audio.fail();
      else if (event.type === 'win') { audio.mission(); saveGame(); }
      else if (event.type === 'save') saveGame();
    }
    world.state.events.length = 0;
  }

  function startNewGame() {
    world.reset();
    world.hasSave = false;
    audio.unlock();
    audio.startMusic();
    screen = SCREEN_BRIEFING;
    announce('Mission 1: Wheels Up. Press Enter to start the job.');
  }

  function continueGame() {
    const data = loadSave();
    if (data) {
      world.restore(data);
      audio.unlock();
      audio.startMusic();
      screen = SCREEN_PLAY;
      announce('Save loaded. Playing.');
    } else {
      startNewGame();
    }
  }

  function screenToWorld(sx, sy) {
    const rect = canvas.getBoundingClientRect();
    const vx = (sx / rect.width) * VIEW.width;
    const vy = (sy / rect.height) * VIEW.height;
    return {
      x: world.state.camera.x - VIEW.width / 2 + vx,
      y: world.state.camera.y - VIEW.height / 2 + vy,
    };
  }

  // One frame's actions are taken once here and shared: menu keys go to the
  // screen handler, gameplay keys go to the world step below.
  function stepWorld(dt, actions) {
    const frame = input.frame();
    const mouseWorld = screenToWorld(frame.mouseX, frame.mouseY);
    const worldInput = {
      up: frame.up, down: frame.down, left: frame.left, right: frame.right,
      run: frame.run, mouseDown: frame.mouseDown, mouseWorld,
      melee: (actions & ACTION_MELEE) !== 0,
    };
    let stepActions = 0;
    if (actions & ACTION_ENTER) stepActions |= EVENT_ENTER;
    world.step(dt, worldInput, stepActions);
    audio.setEngine(world.state.player.car ? world.state.player.car.speed : 0);
    audio.setSiren(world.police.cars.length > 0);
    audio.update(dt);
    drainEvents();
  }

  function handleActions(actions) {
    if (screen === SCREEN_TITLE) {
      if (actions & ACTION_NEWGAME) startNewGame();
      else if (actions & ACTION_CONFIRM) {
        if (world.hasSave) continueGame();
        else startNewGame();
      }
      return;
    }
    if (screen === SCREEN_BRIEFING) {
      if (actions & ACTION_CONFIRM) {
        screen = SCREEN_PLAY;
        announce('Playing.');
      }
      return;
    }
    if (screen === SCREEN_PLAY) {
      if (actions & ACTION_PAUSE) {
        screen = SCREEN_PAUSED;
        announce('Paused.');
      } else if (actions & ACTION_SAVE) {
        saveGame();
        world.toast('Progress saved', 2.5);
      }
      return;
    }
    if (screen === SCREEN_PAUSED) {
      if (actions & ACTION_QUIT) {
        world.reset();
        screen = SCREEN_TITLE;
        world.hasSave = !!loadSave();
        announce('Solmar Heat. Press Enter or click to start.');
      } else if (actions & ACTION_PAUSE || actions & ACTION_CONFIRM) {
        screen = SCREEN_PLAY;
        announce('Playing.');
      } else if (actions & ACTION_SAVE) {
        saveGame();
        world.toast('Progress saved', 2.5);
      }
      return;
    }
    if (screen === SCREEN_OVER || screen === SCREEN_WIN) {
      if (actions & ACTION_CONFIRM) {
        if (screen === SCREEN_WIN) {
          screen = SCREEN_PLAY;
          world.state.win = false;
          announce('Free roam. Solmar Bay is yours.');
        } else {
          startNewGame();
        }
      }
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    const actions = input.takeActions();
    handleActions(actions);
    if (screen === SCREEN_PLAY) {
      let firstStep = true;
      while (accumulator >= STEP) {
        stepWorld(STEP, firstStep ? actions : 0);
        firstStep = false;
        accumulator -= STEP;
        if (world.state.busted) {
          screen = SCREEN_OVER;
          saveGame();
          announce(world.state.bustedReason);
          break;
        }
        if (world.state.win) {
          screen = SCREEN_WIN;
          announce('Debt paid. You are free.');
          break;
        }
      }
    } else {
      accumulator = 0;
      if (screen === SCREEN_TITLE) {
        // A living street behind the title.
        world.step(STEP, { up: false, down: false, left: false, right: false, run: false, mouseDown: false }, 0);
        drainEvents();
      }
    }
    renderer.draw(world, screen);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Solmar Heat. Press Enter or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else if (testMode) runTest();
else runGame();
