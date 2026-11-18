// Drawing only: the world state and the current screen in, pixels out. The camera
// shows a 1280 x 800 window of the city, scaled to fit the browser window. Flat
// vector art with a warm sunset palette, drawn fresh every frame — no images.

import { FONT, PALETTE, ROADS_X, ROADS_Y, ROAD_HALF, VIEW, WORLD } from './config.js';
import { LOCATIONS } from './city.js';
import { MISSIONS } from './missions.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';
export const SCREEN_BRIEFING = 'briefing';

const MINIMAP = { x: 1052, y: 16, w: 212, h: 160 };

function drawCarShape(ctx, x, y, angle, length, width, color, kind) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(-length / 2 + 3, -width / 2 + 4, length, width);
  ctx.fillStyle = color;
  roundRect(ctx, -length / 2, -width / 2, length, width, 7);
  ctx.fill();
  ctx.fillStyle = 'rgba(180,220,255,0.85)';
  ctx.fillRect(-length * 0.18, -width / 2 + 4, length * 0.28, width - 8);
  ctx.fillStyle = '#111827';
  ctx.fillRect(length / 2 - 10, -width / 2 + 3, 5, 6);
  ctx.fillRect(length / 2 - 10, width / 2 - 9, 5, 6);
  ctx.fillStyle = '#ffe9a8';
  ctx.fillRect(length / 2 - 3, -width / 2 + 3, 3, 6);
  ctx.fillRect(length / 2 - 3, width / 2 - 9, 3, 6);
  if (kind === 'police') {
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-length * 0.32, -width / 2 + 2, length * 0.22, width - 4);
    ctx.fillStyle = '#1d4ed8';
    ctx.font = 'bold 9px ' + FONT;
    ctx.textAlign = 'center';
    ctx.fillText('POLICE', 0, 3);
  }
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawPerson(ctx, x, y, angle, color, bob, down) {
  ctx.save();
  ctx.translate(x, y);
  if (down) {
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, 0, 14, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }
  ctx.rotate(angle);
  const swing = Math.sin(bob) * 3;
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 4, 9, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(-6, -8 + swing * 0.4, 5, 12);
  ctx.fillRect(1, -8 - swing * 0.4, 5, 12);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f2c89b';
  ctx.beginPath();
  ctx.arc(8, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };
  const fonts = new Map();

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.max(320, Math.round(window.innerWidth * ratio));
    const height = Math.max(240, Math.round(window.innerHeight * ratio));
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / VIEW.width, height / VIEW.height);
    view.x = (width - VIEW.width * view.scale) / 2;
    view.y = (height - VIEW.height * view.scale) / 2;
  }

  function text(value, x, y, size, color, align, weight) {
    const key = size + (weight || '');
    if (!fonts.has(key)) fonts.set(key, `${weight || ''} ${size}px ${FONT}`.trim());
    ctx.font = fonts.get(key);
    ctx.fillStyle = color;
    ctx.textAlign = align || 'left';
    ctx.fillText(value, x, y);
  }

  function drawCity(world) {
    const city = world.city;
    // Ground: grass, then the beach and the water at the south edge.
    ctx.fillStyle = PALETTE.grass;
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);
    ctx.fillStyle = PALETTE.park;
    ctx.fillRect(city.park.x, city.park.y, city.park.w, city.park.h);
    ctx.fillStyle = '#d9c48a';
    ctx.fillRect(city.plaza.x, city.plaza.y, city.plaza.w, city.plaza.h);
    ctx.fillStyle = PALETTE.sand;
    ctx.fillRect(city.beach.x, city.beach.y, city.beach.w, city.beach.h);
    ctx.fillStyle = PALETTE.water;
    ctx.fillRect(city.water.x, city.water.y, city.water.w, city.water.h);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(0, 2336, WORLD.width, 3);
    // Sidewalks and roads.
    ctx.fillStyle = PALETTE.sidewalk;
    for (const rx of ROADS_X) ctx.fillRect(rx - ROAD_HALF - 10, 0, ROAD_HALF * 2 + 20, WORLD.height);
    for (const ry of ROADS_Y) ctx.fillRect(0, ry - ROAD_HALF - 10, WORLD.width, ROAD_HALF * 2 + 20);
    ctx.fillStyle = PALETTE.road;
    for (const rx of ROADS_X) ctx.fillRect(rx - ROAD_HALF, 0, ROAD_HALF * 2, WORLD.height);
    for (const ry of ROADS_Y) ctx.fillRect(0, ry - ROAD_HALF, WORLD.width, ROAD_HALF * 2);
    // Centre dashes.
    ctx.fillStyle = PALETTE.roadLine;
    for (const rx of ROADS_X) {
      for (let y = 0; y < WORLD.height; y += 64) ctx.fillRect(rx - 2, y, 4, 30);
    }
    for (const ry of ROADS_Y) {
      for (let x = 0; x < WORLD.width; x += 64) ctx.fillRect(x, ry - 2, 30, 4);
    }
    // Park trees and beach palms.
    for (const t of city.trees) {
      ctx.fillStyle = '#1e5c2a';
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2f7d3d';
      ctx.beginPath();
      ctx.arc(t.x - 3, t.y - 3, t.r * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const p of city.palms) {
      ctx.strokeStyle = '#7a5230';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + 6, p.y - 16);
      ctx.stroke();
      ctx.fillStyle = '#3f9e4d';
      ctx.beginPath();
      ctx.arc(p.x + 8, p.y - 18, 9, 0, Math.PI * 2);
      ctx.fill();
    }
    // Buildings with a sunlit roof and a shadow.
    for (const b of city.buildings) {
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(b.x + 6, b.y + 8, b.w, b.h);
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = b.roof;
      ctx.fillRect(b.x + 6, b.y + 6, b.w - 12, b.h - 12);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      for (let wy = b.y + 16; wy < b.y + b.h - 10; wy += 22) {
        for (let wx = b.x + 12; wx < b.x + b.w - 14; wx += 20) {
          ctx.fillRect(wx, wy, 10, 12);
        }
      }
    }
    // District labels painted on the ground.
    ctx.textAlign = 'center';
    text('DOWNTOWN', 1600, 420, 34, 'rgba(255,255,255,0.20)', 'center', 'bold');
    text('MARINA', 2600, 420, 30, 'rgba(255,255,255,0.20)', 'center', 'bold');
    text('OLD TOWN', 600, 1200, 30, 'rgba(255,255,255,0.20)', 'center', 'bold');
    text('THE DOCKS', 2600, 2000, 30, 'rgba(255,255,255,0.20)', 'center', 'bold');
    text('PLAZA DEL SOL', 2000, 1600, 26, 'rgba(255,255,255,0.22)', 'center', 'bold');
  }

  function drawMissionMarker(world) {
    const mission = world.currentMission();
    const stage = world.currentStage();
    if (!mission || !stage || world.state.win) return;
    const place = world.missionPlace(stage);
    if (!place) return;
    const pulse = 1 + Math.sin(world.state.time * 4) * 0.12;
    ctx.save();
    ctx.translate(place.x, place.y);
    ctx.strokeStyle = PALETTE.mission;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 46 * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,210,61,0.18)';
    ctx.beginPath();
    ctx.arc(0, 0, 46 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.mission;
    ctx.beginPath();
    ctx.moveTo(0, -64 - Math.sin(world.state.time * 4) * 6);
    ctx.lineTo(-12, -38);
    ctx.lineTo(12, -38);
    ctx.closePath();
    ctx.fill();
    text(place.name, 0, 78, 17, PALETTE.mission, 'center', 'bold');
    ctx.restore();
    // A wait-stage progress ring.
    if (stage.type === 'wait' && world.state.stageProgress > 0) {
      ctx.save();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(place.x, place.y, 58, -Math.PI / 2, -Math.PI / 2 + (world.state.stageProgress / stage.seconds) * Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawWorld(world) {
    drawCity(world);
    // Pickups.
    for (const p of world.combat.pickups) {
      const bobY = Math.sin(p.bob) * 3;
      ctx.save();
      ctx.translate(p.x, p.y + bobY);
      if (p.kind === 'cash') {
        ctx.fillStyle = '#2fae5f';
        ctx.fillRect(-12, -8, 24, 16);
        ctx.fillStyle = '#ffffff';
        text('$', 0, 6, 15, '#ffffff', 'center', 'bold');
      } else if (p.kind === 'health') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-11, -11, 22, 22);
        ctx.fillStyle = '#e63946';
        ctx.fillRect(-3, -8, 6, 16);
        ctx.fillRect(-8, -3, 16, 6);
      } else if (p.kind === 'ammo') {
        ctx.fillStyle = '#f2c94c';
        ctx.fillRect(-10, -6, 20, 12);
        ctx.fillStyle = '#111827';
        text('AMMO', 0, 4, 9, '#111827', 'center', 'bold');
      } else {
        ctx.fillStyle = PALETTE.mission;
        ctx.strokeStyle = '#7a5b00';
        ctx.lineWidth = 2;
        ctx.fillRect(-13, -9, 26, 18);
        ctx.strokeRect(-13, -9, 26, 18);
        ctx.fillStyle = '#111827';
        text(p.kind === 'case' ? 'CASE' : 'CRATE', 0, 4, 9, '#111827', 'center', 'bold');
      }
      ctx.restore();
    }
    // Parked cars, traffic, police, then the player's car.
    for (const car of world.state.parked) drawCarShape(ctx, car.x, car.y, car.angle, 52, 26, car.color, 'parked');
    for (const car of world.traffic.cars) drawCarShape(ctx, car.x, car.y, car.angle, 52, 26, car.color, 'traffic');
    for (const cop of world.police.cars) {
      drawCarShape(ctx, cop.x, cop.y, cop.angle, 54, 27, cop.color, 'police');
      const phase = Math.floor(world.state.time * 6) % 2 === 0;
      ctx.fillStyle = phase ? '#ff2d2d' : '#2d7bff';
      ctx.beginPath();
      ctx.arc(cop.x - 8, cop.y - 12, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = phase ? '#2d7bff' : '#ff2d2d';
      ctx.beginPath();
      ctx.arc(cop.x + 8, cop.y - 12, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    if (world.state.player.car) {
      const car = world.state.player.car;
      drawCarShape(ctx, car.x, car.y, car.angle, 54, 27, '#e63946', 'player');
      if (car.hp < 45) {
        ctx.fillStyle = 'rgba(60,60,60,0.7)';
        ctx.beginPath();
        ctx.arc(car.x - 14, car.y - 8, 8 + Math.sin(world.state.time * 9) * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Pedestrians, enemies, the player on foot.
    for (const ped of world.traffic.peds) {
      drawPerson(ctx, ped.x, ped.y, ped.angle, ped.color, ped.bob, ped.state === 'down');
    }
    for (const e of world.combat.enemies) {
      drawPerson(ctx, e.x, e.y, e.angle, e.kind === 'guard' ? '#111827' : '#7a1f1f', e.bob, false);
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(e.x - 16, e.y - 26, 32, 5);
      ctx.fillStyle = '#ff3b30';
      ctx.fillRect(e.x - 16, e.y - 26, 32 * (e.hp / e.maxHp), 5);
      text(e.kind === 'guard' ? 'GUARD' : 'VULTURE', e.x, e.y - 32, 10, '#ffffff', 'center', 'bold');
    }
    if (world.state.player.onFoot) {
      const p = world.state.player;
      if (p.invulnerable === 0 || Math.floor(p.invulnerable * 10) % 2 === 1) {
        drawPerson(ctx, p.x, p.y, p.angle, PALETTE.playerShirt, world.state.time * 8, false);
        ctx.fillStyle = PALETTE.player;
        ctx.beginPath();
        ctx.arc(p.x, p.y - 2, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      // Aim line while the pistol is out.
      if (p.ammo > 0) {
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + Math.cos(p.angle) * 46, p.y + Math.sin(p.angle) * 46);
        ctx.stroke();
      }
    }
    // Bullets and particles.
    ctx.fillStyle = '#ffe9a8';
    for (const b of world.combat.bullets) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const p of world.combat.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    drawMissionMarker(world);
  }

  function drawMinimap(world) {
    const s = world.state;
    const mx = MINIMAP.x;
    const my = MINIMAP.y;
    const mw = MINIMAP.w;
    const mh = MINIMAP.h;
    const sx = mw / WORLD.width;
    const sy = mh / WORLD.height;
    ctx.fillStyle = 'rgba(10,16,30,0.85)';
    ctx.fillRect(mx - 4, my - 4, mw + 8, mh + 8);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(mx - 4, my - 4, mw + 8, mh + 8);
    ctx.fillStyle = '#2f6b3a';
    ctx.fillRect(mx, my, mw, mh);
    ctx.strokeStyle = '#9aa0a8';
    ctx.lineWidth = 2;
    for (const rx of ROADS_X) {
      ctx.beginPath();
      ctx.moveTo(mx + rx * sx, my);
      ctx.lineTo(mx + rx * sx, my + mh);
      ctx.stroke();
    }
    for (const ry of ROADS_Y) {
      ctx.beginPath();
      ctx.moveTo(mx, my + ry * sy);
      ctx.lineTo(mx + mw, my + ry * sy);
      ctx.stroke();
    }
    ctx.fillStyle = '#1d6f9e';
    ctx.fillRect(mx, my + 2260 * sy, mw, 80 * sy);
    const mission = world.currentMission();
    const stage = world.currentStage();
    if (mission && stage) {
      const place = world.missionPlace(stage);
      if (place) {
        ctx.fillStyle = PALETTE.mission;
        ctx.beginPath();
        ctx.arc(mx + place.x * sx, my + place.y * sy, 5 + Math.sin(s.time * 5) * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.fillStyle = '#c8c8c8';
    for (const car of world.traffic.cars) ctx.fillRect(mx + car.x * sx - 1, my + car.y * sy - 1, 2, 2);
    ctx.fillStyle = '#ff3b30';
    for (const cop of world.police.cars) {
      ctx.beginPath();
      ctx.arc(mx + cop.x * sx, my + cop.y * sy, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    const focus = world.playerPos();
    // View rectangle.
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.strokeRect(mx + (s.camera.x - 640) * sx, my + (s.camera.y - 400) * sy, 1280 * sx, 800 * sy);
    // Player arrow.
    ctx.save();
    ctx.translate(mx + focus.x * sx, my + focus.y * sy);
    ctx.rotate(s.player.angle);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(7, 0);
    ctx.lineTo(-5, -5);
    ctx.lineTo(-5, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    text('SOLMAR BAY', mx + mw / 2, my + mh + 18, 11, 'rgba(255,255,255,0.75)', 'center', 'bold');
  }

  function drawHud(world) {
    const s = world.state;
    const mission = world.currentMission();
    const stage = world.currentStage();
    // Top-left cluster: money, health, ammo.
    ctx.fillStyle = 'rgba(10,16,30,0.72)';
    roundRect(ctx, 14, 14, 250, 108, 10);
    ctx.fill();
    text(`$${s.money.toLocaleString('en-US')}`, 28, 46, 30, '#7CFC9A', 'left', 'bold');
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(28, 58, 180, 12);
    ctx.fillStyle = s.health > 40 ? '#4ade80' : '#ff3b30';
    ctx.fillRect(28, 58, 180 * (s.health / 100), 12);
    text('HEALTH', 214, 70, 11, PALETTE.text, 'left', 'bold');
    text(s.player.onFoot ? `PISTOL  ${s.player.ammo} rounds` : `CAR  ${Math.max(0, Math.round(s.player.car ? s.player.car.hp : 0))}%`, 28, 96, 15, PALETTE.text, 'left', 'bold');
    text(s.player.onFoot ? 'F punch  •  click shoot  •  E car' : 'W/S drive  •  A/D steer  •  E exit', 28, 116, 12, PALETTE.muted, 'left');
    // Wanted stars, top centre.
    ctx.fillStyle = 'rgba(10,16,30,0.72)';
    roundRect(ctx, VIEW.width / 2 - 130, 14, 260, 44, 10);
    ctx.fill();
    text('WANTED', VIEW.width / 2 - 116, 42, 14, PALETTE.text, 'left', 'bold');
    for (let i = 0; i < 5; i += 1) {
      text('★', VIEW.width / 2 - 30 + i * 26, 44, 26, i < s.wanted ? '#ffd23d' : 'rgba(255,255,255,0.22)', 'left');
    }
    // Mission objective banner.
    if (mission && stage && !s.win) {
      ctx.fillStyle = 'rgba(10,16,30,0.72)';
      const label = `${mission.title}  —  ${stage.text}`;
      roundRect(ctx, VIEW.width / 2 - 330, 66, 660, 34, 8);
      ctx.fill();
      text(label, VIEW.width / 2, 89, 16, PALETTE.mission, 'center', 'bold');
      if (stage.type === 'defeat') {
        text(`Left: ${world.combat.enemies.length}`, VIEW.width / 2, 89, 16, PALETTE.mission, 'center');
      }
    }
    // Toast.
    if (s.toastTimer > 0) {
      ctx.globalAlpha = Math.min(1, s.toastTimer);
      ctx.fillStyle = 'rgba(10,16,30,0.85)';
      const w = Math.min(720, 24 + s.toast.length * 8.4);
      roundRect(ctx, VIEW.width / 2 - w / 2, VIEW.height - 96, w, 40, 8);
      ctx.fill();
      text(s.toast, VIEW.width / 2, VIEW.height - 69, 17, PALETTE.text, 'center', 'bold');
      ctx.globalAlpha = 1;
    }
    // Speedometer while driving.
    if (!s.player.onFoot && s.player.car) {
      const mph = Math.round(Math.abs(s.player.car.speed) * 0.12);
      ctx.fillStyle = 'rgba(10,16,30,0.72)';
      roundRect(ctx, VIEW.width - 170, VIEW.height - 64, 156, 50, 10);
      ctx.fill();
      text(`${mph}`, VIEW.width - 92, VIEW.height - 26, 30, PALETTE.text, 'center', 'bold');
      text('MPH', VIEW.width - 40, VIEW.height - 26, 13, PALETTE.muted, 'center', 'bold');
    }
    drawMinimap(world);
    // Bottom-left: save + pause hints.
    text('P pause   •   Q save   •   Missions: ' + s.stats.missionsDone + '/5 done', 16, VIEW.height - 14, 13, 'rgba(255,255,255,0.65)', 'left');
  }

  function drawPanel(title, lines, prompt, accent) {
    const height = 150 + lines.length * 34 + 60;
    const w = 680;
    const x = (VIEW.width - w) / 2;
    const y = (VIEW.height - height) / 2;
    ctx.fillStyle = PALETTE.panel;
    roundRect(ctx, x, y, w, height, 16);
    ctx.fill();
    ctx.strokeStyle = accent || PALETTE.gold;
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 2, y + 2, w - 4, height - 4);
    text(title, VIEW.width / 2, y + 72, 44, accent || PALETTE.gold, 'center', 'bold');
    ctx.textBaseline = 'alphabetic';
    for (let i = 0; i < lines.length; i += 1) {
      text(lines[i], VIEW.width / 2, y + 128 + i * 34, 19, PALETTE.text, 'center');
    }
    text(prompt, VIEW.width / 2, y + height - 28, 20, PALETTE.gold, 'center', 'bold');
  }

  function drawTitle(world) {
    drawPanel(
      'SOLMAR HEAT',
      [
        'An open-world crime story in Solmar Bay.',
        'Steal cars, outrun the police, run five jobs for Mama Rosa,',
        'and walk away free — or get busted trying.',
        '',
        'WASD move / drive   •   Mouse aim, click shoot   •   F punch',
        'E steal / exit car   •   P pause   •   Q save   •   Shift run',
        '',
        `Best haul so far: $${world.bestMoney.toLocaleString('en-US')}`,
      ],
      world.hasSave ? 'ENTER — Continue your story      •      N — New game' : 'Press ENTER or click to start',
      '#ff9d3d',
    );
    text('A completely original game. No Rockstar, no GTA — just Solmar Bay.', VIEW.width / 2, VIEW.height - 40, 14, 'rgba(255,255,255,0.6)', 'center');
  }

  function drawBriefing(world) {
    const mission = world.currentMission();
    if (!mission) return;
    const words = mission.briefing.split(' ');
    const lines = [];
    let line = '';
    for (const word of words) {
      if ((line + ' ' + word).length > 62) {
        lines.push(line.trim());
        line = word;
      } else line += ' ' + word;
    }
    if (line.trim()) lines.push(line.trim());
    drawPanel(mission.title, lines, 'Press ENTER to start the job', '#ffd23d');
  }

  function drawPaused(world) {
    drawPanel(
      'PAUSED',
      [
        `${world.currentMission() ? world.currentMission().title : 'Free roam'}  •  $${world.state.money}  •  ${world.state.stats.missionsDone}/5 missions`,
        'Your progress saves with Q — or automatically after each mission.',
        '',
        'WASD move / drive   •   Mouse aim, click shoot   •   F punch   •   E car',
      ],
      'P — resume      •      Q — save now      •      R — quit to title',
      '#9db8ff',
    );
  }

  function drawOver(world) {
    drawPanel(
      world.state.bustedReason.startsWith('BUSTED') ? 'BUSTED' : 'WASTED',
      [
        world.state.bustedReason,
        '',
        `You made $${world.state.money} and finished ${world.state.stats.missionsDone} of 5 missions.`,
        `Cars stolen: ${world.state.stats.carsStolen}   •   Takedowns: ${world.state.stats.kills}`,
      ],
      'Press ENTER to try again',
      '#ff3b30',
    );
  }

  function drawWin(world) {
    drawPanel(
      'DEBT PAID. FREE.',
      [
        'Leo delivers the case. Rosa burns the ledger.',
        '"Solmar Bay is yours now, kid. Drive careful."',
        '',
        `Final haul: $${world.state.money.toLocaleString('en-US')}  •  Cars stolen: ${world.state.stats.carsStolen}`,
        `Takedowns: ${world.state.stats.kills}  •  Time: ${Math.floor(world.state.time / 60)}:${String(Math.floor(world.state.time % 60)).padStart(2, '0')}`,
      ],
      'Press ENTER to play free roam',
      '#7CFC9A',
    );
  }

  function draw(world, screen) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = PALETTE.backdrop;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    // Sunset wash over the world.
    ctx.save();
    const cam = world.state.camera;
    ctx.translate(-(cam.x - VIEW.width / 2), -(cam.y - VIEW.height / 2));
    drawWorld(world);
    ctx.restore();
    if (screen === SCREEN_TITLE) {
      ctx.fillStyle = 'rgba(10,16,30,0.45)';
      ctx.fillRect(0, 0, VIEW.width, VIEW.height);
      drawTitle(world);
      return;
    }
    if (screen === SCREEN_BRIEFING) {
      drawHud(world);
      drawBriefing(world);
      return;
    }
    drawHud(world);
    if (screen === SCREEN_PAUSED) drawPaused(world);
    else if (screen === SCREEN_OVER) drawOver(world);
    else if (screen === SCREEN_WIN) drawWin(world);
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw, view };
}
