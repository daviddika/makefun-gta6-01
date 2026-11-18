// Combat: the pistol, fists, bullets, the thugs and guards missions spawn, cash
// and health pickups, and the particle bursts that make hits feel like hits.

import { PISTOL, PLAYER } from './config.js';
import { range } from './random.js';

export function createCombat() {
  return { bullets: [], enemies: [], pickups: [], particles: [] };
}

export function spawnEnemy(combat, x, y, kind) {
  combat.enemies.push({
    kind: kind || 'thug',
    x, y,
    angle: 0,
    hp: kind === 'guard' ? 90 : 60,
    maxHp: kind === 'guard' ? 90 : 60,
    speed: kind === 'guard' ? 150 : 120,
    punchCooldown: 0,
    state: 'chase',
    bob: 0,
  });
}

export function spawnPickup(combat, x, y, kind, amount) {
  combat.pickups.push({ x, y, kind, amount: amount || 0, bob: 0, taken: false });
}

export function spawnParticles(combat, x, y, color, count, speed) {
  for (let i = 0; i < count; i += 1) {
    const a = range(Math.random, 0, Math.PI * 2);
    combat.particles.push({
      x, y,
      vx: Math.cos(a) * range(Math.random, speed * 0.3, speed),
      vy: Math.sin(a) * range(Math.random, speed * 0.3, speed),
      life: range(Math.random, 0.3, 0.7),
      maxLife: 0.7,
      color,
      size: range(Math.random, 2, 5),
    });
  }
}

export function fireBullet(combat, x, y, angle) {
  combat.bullets.push({
    x, y,
    vx: Math.cos(angle) * PISTOL.bulletSpeed,
    vy: Math.sin(angle) * PISTOL.bulletSpeed,
    life: PISTOL.range / PISTOL.bulletSpeed,
  });
}

export function stepBullets(combat, dt, city, onHit) {
  for (let i = combat.bullets.length - 1; i >= 0; i -= 1) {
    const b = combat.bullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    let dead = b.life <= 0 || b.x < 0 || b.y < 0 || b.x > 3200 || b.y > 2400;
    if (!dead && city.insideBuilding(b.x, b.y)) {
      spawnParticles(combat, b.x, b.y, '#c8c8c8', 4, 120);
      dead = true;
    }
    if (!dead) dead = onHit(b);
    if (dead) combat.bullets.splice(i, 1);
  }
}

export function stepEnemies(combat, dt, player, city, onPlayerHit) {
  for (let i = combat.enemies.length - 1; i >= 0; i -= 1) {
    const e = combat.enemies[i];
    e.bob += dt * 8;
    e.punchCooldown = Math.max(0, e.punchCooldown - dt);
    const px = player.car ? player.car.x : player.x;
    const py = player.car ? player.car.y : player.y;
    const dx = px - e.x;
    const dy = py - e.y;
    const dist = Math.hypot(dx, dy) || 1;
    e.angle = Math.atan2(dy, dx);
    if (dist > 34) {
      e.x += (dx / dist) * e.speed * dt;
      e.y += (dy / dist) * e.speed * dt;
      city.collideCircle(e, 13);
    } else if (e.punchCooldown <= 0) {
      e.punchCooldown = 0.8;
      onPlayerHit(12, e);
    }
    if (e.hp <= 0) {
      spawnParticles(combat, e.x, e.y, '#e63946', 14, 220);
      combat.enemies.splice(i, 1);
    }
  }
}

export function stepParticles(combat, dt) {
  for (let i = combat.particles.length - 1; i >= 0; i -= 1) {
    const p = combat.particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.92;
    p.vy *= 0.92;
    p.life -= dt;
    if (p.life <= 0) combat.particles.splice(i, 1);
  }
}

export function stepPickups(combat, dt, player, onTake) {
  for (let i = combat.pickups.length - 1; i >= 0; i -= 1) {
    const p = combat.pickups[i];
    p.bob += dt * 4;
    const px = player.car ? player.car.x : player.x;
    const py = player.car ? player.car.y : player.y;
    if (Math.hypot(px - p.x, py - p.y) < 34) {
      onTake(p);
      combat.pickups.splice(i, 1);
    }
  }
}

// The player's punch: hits the nearest enemy or pedestrian in front of the player.
export function punch(state, combat, angle) {
  const px = state.player.x;
  const py = state.player.y;
  let hitSomething = false;
  for (const e of combat.enemies) {
    const d = Math.hypot(e.x - px, e.y - py);
    if (d < PLAYER.punchRange + 14) {
      e.hp -= PLAYER.punchDamage;
      spawnParticles(combat, e.x, e.y, '#ffd23d', 6, 160);
      hitSomething = true;
    }
  }
  for (const ped of state.traffic.peds) {
    const d = Math.hypot(ped.x - px, ped.y - py);
    if (d < PLAYER.punchRange + 12 && ped.state !== 'down') {
      ped.state = 'down';
      ped.hp = 0;
      spawnParticles(combat, ped.x, ped.y, '#e63946', 8, 180);
      hitSomething = true;
      state.stats.assaults += 1;
    }
  }
  return hitSomething;
}
