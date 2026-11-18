// Seeded random numbers, so a ?seed=N run of the game always builds the same city
// and the same traffic. One small mulberry32 generator, nothing else.

// eslint-disable-next-line no-unused-vars
export function createRandom(seed) {
  let value = seed >>> 0;
  return function random() {
    value = (value + 0x6d2b79f5) >>> 0;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick(random, list) {
  return list[Math.floor(random() * list.length)];
}

export function range(random, min, max) {
  return min + random() * (max - min);
}

export function integer(random, min, max) {
  return min + Math.floor(random() * (max - min + 1));
}
