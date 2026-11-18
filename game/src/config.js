// Solmar Heat — every tuning number, colour and city constant in one place.
// The city is a fixed 3200 x 2400 world; the camera shows a 1280 x 800 window of it.

export const WORLD = { width: 3200, height: 2400 };
export const VIEW = { width: 1280, height: 800 };
export const STEP = 1 / 60;

export const SAVE_KEY = 'solmar-heat.save.v1';
export const BEST_KEY = 'solmar-heat.best';

// Roads run on a grid: vertical avenues and horizontal streets, 400 px apart.
export const ROADS_X = [200, 600, 1000, 1400, 1800, 2200, 2600, 3000];
export const ROADS_Y = [200, 600, 1000, 1400, 1800, 2200];
export const ROAD_HALF = 34;
export const LANE = 15;

export const PLAYER = {
  radius: 13,
  walkSpeed: 210,
  runSpeed: 330,
  health: 100,
  punchDamage: 25,
  punchRange: 34,
  punchCooldown: 0.38,
};

export const CAR = {
  length: 52,
  width: 26,
  accel: 420,
  brake: 620,
  reverseAccel: 260,
  maxSpeed: 560,
  maxReverse: 180,
  turnRate: 2.6,
  grip: 0.92,
  health: 100,
};

export const PISTOL = { damage: 34, range: 520, cooldown: 0.22, bulletSpeed: 950, startAmmo: 24 };

export const WANTED = {
  max: 5,
  decaySeconds: 26,
  stealStars: 1,
  assaultStars: 1,
  killStars: 2,
  copKillStars: 2,
};

export const TRAFFIC_CARS = 14;
export const PEDESTRIANS = 26;

export const MISSION_REWARDS = [200, 400, 500, 1200, 3000];

export const PALETTE = {
  backdrop: '#0d1526',
  grass: '#3f7d4a',
  park: '#2f6b3a',
  sidewalk: '#9aa0a8',
  road: '#33373f',
  roadLine: '#e8c33a',
  sand: '#e0c98f',
  water: '#1d6f9e',
  building: ['#c96f4a', '#4a7ec9', '#c9a44a', '#7a4ac9', '#4ac9a0', '#b0526b', '#5d6b7a', '#d98a3d'],
  roof: ['#8a4a30', '#33588f', '#8f7430', '#57348f', '#2f8f74', '#7a3a4a'],
  player: '#ffcf3d',
  playerShirt: '#e63946',
  cop: '#1d4ed8',
  copLight: '#ff2d2d',
  text: '#f4f1e8',
  muted: '#b9c0cc',
  panel: 'rgba(10, 16, 30, 0.88)',
  gold: '#f2c94c',
  mission: '#ffd23d',
  danger: '#ff3b30',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

export const DISTRICTS = [
  { name: 'Downtown', x: 1000, y: 200, w: 1200, h: 600 },
  { name: 'Old Town', x: 200, y: 1000, w: 800, h: 800 },
  { name: 'Marina', x: 2200, y: 200, w: 800, h: 600 },
  { name: 'The Docks', x: 2200, y: 1800, w: 800, h: 400 },
  { name: 'Palm Heights', x: 200, y: 200, w: 800, h: 600 },
];
