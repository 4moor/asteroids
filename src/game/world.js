export const WORLD = Object.freeze({ width: 960, height: 640 });
export const RADII = Object.freeze({ 1: 14, 2: 25, 3: 42 });

export function wrap(value, limit) {
  return ((value % limit) + limit) % limit;
}

export function toroidalDistance(a, b) {
  const dx = Math.abs(wrap(a.x - b.x, WORLD.width));
  const dy = Math.abs(wrap(a.y - b.y, WORLD.height));
  return Math.hypot(Math.min(dx, WORLD.width - dx), Math.min(dy, WORLD.height - dy));
}
