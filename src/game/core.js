// Simulation uses seconds and logical pixels; browser rendering is a separate adapter.
export const WORLD = Object.freeze({ width: 960, height: 640 });
export const RADII = Object.freeze({ 1: 14, 2: 25, 3: 42 });
const POINTS = { 1: 100, 2: 50, 3: 20 };
const SHIP_RADIUS = 12;
const TAU = Math.PI * 2;

export function validateSettings({ seed, asteroidCount, asteroidSpeed }) {
  if (!Number.isSafeInteger(seed)) throw new TypeError('seed must be a safe integer');
  if (!Number.isInteger(asteroidCount) || asteroidCount < 1 || asteroidCount > 30) {
    throw new RangeError('asteroidCount must be between 1 and 30');
  }
  if (!Number.isFinite(asteroidSpeed) || asteroidSpeed <= 0) {
    throw new RangeError('asteroidSpeed must be finite and positive');
  }
}

export function createGame({ seed = 1, asteroidCount = 5, asteroidSpeed = 1 } = {}) {
  const settings = { seed, asteroidCount, asteroidSpeed };
  validateSettings(settings);
  const state = {
    status: 'playing', score: 0, lives: 3, wave: 1, elapsed: 0,
    settings, rng: seed >>> 0, nextId: 1, ship: newShip(),
    asteroids: [], bullets: [],
  };
  spawnWave(state);
  return state;
}

function newShip() {
  return {
    x: WORLD.width / 2, y: WORLD.height / 2, vx: 0, vy: 0,
    angle: -Math.PI / 2, cooldown: 0, invulnerable: 0,
  };
}

function random(state) {
  state.rng = (Math.imul(state.rng, 1664525) + 1013904223) >>> 0;
  return state.rng / 4294967296;
}

function wrap(value, limit) {
  return ((value % limit) + limit) % limit;
}

export function toroidalDistance(a, b) {
  const dx = Math.abs(wrap(a.x - b.x, WORLD.width));
  const dy = Math.abs(wrap(a.y - b.y, WORLD.height));
  return Math.hypot(Math.min(dx, WORLD.width - dx), Math.min(dy, WORLD.height - dy));
}

function asteroid(state, x, y, size) {
  const direction = random(state) * TAU;
  const speed = (30 + random(state) * 35) * state.settings.asteroidSpeed
    * (1 + (state.wave - 1) * 0.08) * (1 + (3 - size) * 0.25);
  return {
    id: state.nextId++, x, y, size,
    vx: Math.cos(direction) * speed, vy: Math.sin(direction) * speed,
    angle: random(state) * TAU, spin: (random(state) - 0.5) * 1.2,
  };
}

function spawnWave(state) {
  const count = Math.min(30, state.settings.asteroidCount + state.wave - 1);
  for (let i = 0; i < count; i++) {
    let x = random(state) * WORLD.width;
    let y = random(state) * WORLD.height;
    // Translate close spawns instead of retrying an unbounded random loop.
    if (toroidalDistance({ x, y }, state.ship) < 170) {
      x = wrap(x + WORLD.width / 2, WORLD.width);
      y = wrap(y + WORLD.height / 2, WORLD.height);
    }
    state.asteroids.push(asteroid(state, x, y, 3));
  }
}

function move(body, dt) {
  body.x = wrap(body.x + body.vx * dt, WORLD.width);
  body.y = wrap(body.y + body.vy * dt, WORLD.height);
}

function steer(state, input, dt) {
  const ship = state.ship;
  ship.invulnerable = Math.max(0, ship.invulnerable - dt);
  ship.cooldown = Math.max(0, ship.cooldown - dt);
  ship.angle += (Number(Boolean(input.right)) - Number(Boolean(input.left))) * 3.6 * dt;
  if (input.thrust) {
    ship.vx += Math.cos(ship.angle) * 230 * dt;
    ship.vy += Math.sin(ship.angle) * 230 * dt;
  }
  const speed = Math.hypot(ship.vx, ship.vy);
  const scale = speed > 340 ? 340 / speed : 1;
  ship.vx *= scale * Math.exp(-0.12 * dt);
  ship.vy *= scale * Math.exp(-0.12 * dt);
  move(ship, dt);
  if (input.fire && ship.cooldown <= 0) {
    ship.cooldown = 0.18;
    state.bullets.push({
      id: state.nextId++,
      x: wrap(ship.x + Math.cos(ship.angle) * 19, WORLD.width),
      y: wrap(ship.y + Math.sin(ship.angle) * 19, WORLD.height),
      vx: Math.cos(ship.angle) * 550 + ship.vx,
      vy: Math.sin(ship.angle) * 550 + ship.vy,
      ttl: 1.25,
    });
  }
}

function resolveHits(state) {
  const destroyed = new Set();
  const spent = new Set();
  const fragments = [];
  for (const shot of state.bullets) {
    for (const rock of state.asteroids) {
      if (destroyed.has(rock.id)) continue;
      if (toroidalDistance(shot, rock) > RADII[rock.size] + 2) continue;
      destroyed.add(rock.id);
      spent.add(shot.id);
      state.score += POINTS[rock.size];
      if (rock.size > 1) {
        fragments.push(asteroid(state, rock.x, rock.y, rock.size - 1));
        fragments.push(asteroid(state, rock.x, rock.y, rock.size - 1));
      }
      break;
    }
  }
  state.bullets = state.bullets.filter(shot => !spent.has(shot.id));
  state.asteroids = state.asteroids.filter(rock => !destroyed.has(rock.id)).concat(fragments);
  if (state.ship.invulnerable > 0) return;
  const hit = state.asteroids.some(rock =>
    toroidalDistance(state.ship, rock) < SHIP_RADIUS + RADII[rock.size]);
  if (!hit) return;
  state.lives--;
  if (state.lives === 0) {
    state.status = 'gameover';
  } else {
    state.ship = { ...newShip(), invulnerable: 2 };
  }
}

/** Return a new state. dt is in seconds; callers should use a fixed 1/60 step. */
export function stepGame(previous, input = {}, dt = 1 / 60) {
  if (!Number.isFinite(dt) || dt < 0) throw new RangeError('time step must be finite and non-negative');
  if (previous.status !== 'playing' || dt === 0) return previous;
  const state = structuredClone(previous);
  dt = Math.min(dt, 0.05);
  state.elapsed += dt;
  steer(state, input, dt);
  for (const rock of state.asteroids) {
    move(rock, dt);
    rock.angle += rock.spin * dt;
  }
  for (const shot of state.bullets) {
    move(shot, dt);
    shot.ttl -= dt;
  }
  state.bullets = state.bullets.filter(shot => shot.ttl > 0);
  resolveHits(state);
  if (state.status === 'playing' && state.asteroids.length === 0) {
    state.wave++;
    spawnWave(state);
  }
  return state;
}
