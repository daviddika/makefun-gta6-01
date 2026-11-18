// The city of Solmar Bay: a road grid, the buildings inside every block, a park,
// a beach and the water, and every named place the missions use. Built once from a
// seeded random, so the same seed always builds the same city.

import { PALETTE, ROADS_X, ROADS_Y, ROAD_HALF, WORLD } from './config.js';
import { integer, pick, range } from './random.js';

// Named places, all on road intersections so a car can reach them.
export const LOCATIONS = {
  garage: { x: 600, y: 1800, name: "Rosa's Garage" },
  docks: { x: 3000, y: 2200, name: 'Solmar Docks' },
  marina: { x: 2600, y: 200, name: 'Marina Cafe' },
  alley: { x: 1400, y: 1400, name: 'Back Alley' },
  bank: { x: 1800, y: 600, name: 'Solmar Bank' },
  safehouse: { x: 600, y: 600, name: 'Safehouse' },
  yacht: { x: 3000, y: 200, name: 'Yacht Club' },
  plaza: { x: 1800, y: 1400, name: 'Plaza del Sol' },
};

export function createCity(random) {
  const buildings = [];
  const trees = [];
  const palms = [];

  // One or two buildings per block, inset from the roads around it.
  for (let bx = 0; bx < ROADS_X.length - 1; bx += 1) {
    for (let by = 0; by < ROADS_Y.length - 1; by += 1) {
      const x0 = ROADS_X[bx] + ROAD_HALF + 14;
      const y0 = ROADS_Y[by] + ROAD_HALF + 14;
      const x1 = ROADS_X[bx + 1] - ROAD_HALF - 14;
      const y1 = ROADS_Y[by + 1] - ROAD_HALF - 14;
      // The block between 1400-1800 / 1000-1400 is the park, not buildings.
      if (ROADS_X[bx] === 1400 && ROADS_Y[by] === 1000) {
        for (let t = 0; t < 26; t += 1) {
          trees.push({ x: range(random, x0, x1), y: range(random, y0, y1), r: range(random, 10, 18) });
        }
        continue;
      }
      // The plaza block stays open.
      if (ROADS_X[bx] === 1800 && ROADS_Y[by] === 1400) continue;
      const count = integer(random, 1, 2);
      for (let b = 0; b < count; b += 1) {
        const w = range(random, 90, 170);
        const h = range(random, 80, 150);
        const x = range(random, x0, Math.max(x0, x1 - w));
        const y = range(random, y0, Math.max(y0, y1 - h));
        buildings.push({
          x, y, w, h,
          color: pick(random, PALETTE.building),
          roof: pick(random, PALETTE.roof),
          floors: integer(random, 1, 5),
        });
      }
    }
  }
  // Palm trees line the beach and the marina.
  for (let i = 0; i < 40; i += 1) {
    palms.push({ x: range(random, 60, WORLD.width - 60), y: range(random, 2260, 2310), r: 12 });
  }
  for (let i = 0; i < 12; i += 1) {
    palms.push({ x: range(random, 2300, 3100), y: range(random, 60, 160), r: 12 });
  }

  const park = { x: 1400 + ROAD_HALF, y: 1000 + ROAD_HALF, w: 400 - ROAD_HALF * 2, h: 400 - ROAD_HALF * 2 };
  const plaza = { x: 1800 + ROAD_HALF, y: 1400 + ROAD_HALF, w: 400 - ROAD_HALF * 2, h: 400 - ROAD_HALF * 2 };
  const beach = { x: 0, y: 2260, w: WORLD.width, h: 80 };
  const water = { x: 0, y: 2340, w: WORLD.width, h: 60 };

  function onRoad(x, y) {
    for (const rx of ROADS_X) if (Math.abs(x - rx) <= ROAD_HALF) return true;
    for (const ry of ROADS_Y) if (Math.abs(y - ry) <= ROAD_HALF) return true;
    return false;
  }

  function nearestRoadPoint(x, y) {
    let bestX = ROADS_X[0];
    let bestY = ROADS_Y[0];
    let best = Infinity;
    for (const rx of ROADS_X) {
      const d = Math.abs(x - rx);
      if (d < best) { best = d; bestX = rx; }
    }
    best = Infinity;
    for (const ry of ROADS_Y) {
      const d = Math.abs(y - ry);
      if (d < best) { best = d; bestY = ry; }
    }
    return Math.abs(x - bestX) < Math.abs(y - bestY) ? { x: bestX, y } : { x, y: bestY };
  }

  // Push a circle out of every building it overlaps; returns true when it hit one.
  function collideCircle(body, radius) {
    let hit = false;
    for (const b of buildings) {
      const cx = Math.max(b.x, Math.min(body.x, b.x + b.w));
      const cy = Math.max(b.y, Math.min(body.y, b.y + b.h));
      const dx = body.x - cx;
      const dy = body.y - cy;
      const d2 = dx * dx + dy * dy;
      if (d2 < radius * radius && d2 > 0.0001) {
        const d = Math.sqrt(d2);
        body.x = cx + (dx / d) * radius;
        body.y = cy + (dy / d) * radius;
        hit = true;
      } else if (d2 <= 0.0001) {
        body.y = b.y - radius;
        hit = true;
      }
    }
    return hit;
  }

  function insideBuilding(x, y) {
    for (const b of buildings) if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return true;
    return false;
  }

  return {
    buildings, trees, palms, park, plaza, beach, water,
    onRoad, nearestRoadPoint, collideCircle, insideBuilding,
  };
}
