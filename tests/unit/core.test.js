import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, stepGame, WORLD } from '../../src/game/core.js';

const rock = (id, x, y, size = 1) => ({ id, x, y, vx: 0, vy: 0, size, angle: 0, spin: 0 });
const bullet = (id, x, y) => ({ id, x, y, vx: 0, vy: 0, ttl: 1 });
function scene() {
  const game = createGame({ seed: 42 });
  game.asteroids = [rock(100, 100, 100), rock(101, 800, 500)];
  game.nextId = 200;
  return game;
}

test('same seed produces the same initial world and trajectory', () => {
  let a = createGame({ seed: 42 });
  let b = createGame({ seed: 42 });
  assert.deepEqual(a, b);
  for (let i = 0; i < 120; i++) {
    a = stepGame(a, { thrust: true, right: true, fire: true }, 1 / 60);
    b = stepGame(b, { thrust: true, right: true, fire: true }, 1 / 60);
  }
  assert.deepEqual(a, b);
  assert.notDeepEqual(createGame({ seed: 41 }).asteroids, b.asteroids);
});

test('thrust changes velocity and releasing it preserves inertia', () => {
  const initial = scene();
  const moving = stepGame(initial, { thrust: true }, 0.05);
  assert.ok(moving.ship.vy < 0);
  const coasting = stepGame(moving, {}, 0.05);
  assert.ok(coasting.ship.y < moving.ship.y);
  assert.equal(initial.ship.vy, 0, 'updates must not mutate the input state');
});

test('ship wraps around the world', () => {
  const game = scene();
  game.ship.x = WORLD.width - 1;
  game.ship.vx = 200;
  assert.ok(stepGame(game, {}, 0.02).ship.x < 10);
});

test('firing has a cooldown and expired bullets disappear', () => {
  let game = stepGame(scene(), { fire: true }, 0.01);
  assert.equal(game.bullets.length, 1);
  game = stepGame(game, { fire: true }, 0.01);
  assert.equal(game.bullets.length, 1);
  game.bullets[0].ttl = 0.001;
  assert.equal(stepGame(game, {}, 0.01).bullets.length, 0);
});

test('a large asteroid splits into two medium ones and gives 20 points', () => {
  const game = scene();
  game.asteroids[0].size = 3;
  game.bullets = [bullet(50, 100, 100)];
  const next = stepGame(game, {}, 0.01);
  assert.equal(next.score, 20);
  assert.equal(next.asteroids.filter(a => a.size === 2).length, 2);
  assert.equal(next.bullets.length, 0);
});

test('medium and small asteroids give 50 and 100 points', () => {
  for (const [size, score] of [[2, 50], [1, 100]]) {
    const game = scene();
    game.asteroids[0].size = size;
    game.bullets = [bullet(50, 100, 100)];
    const next = stepGame(game, {}, 0.01);
    assert.equal(next.score, score);
    assert.equal(next.asteroids.filter(a => a.id >= 200 && a.size === size - 1).length, size === 2 ? 2 : 0);
  }
});

test('two bullets cannot score the same asteroid twice', () => {
  const game = scene();
  game.bullets = [bullet(50, 100, 100), bullet(51, 100, 100)];
  assert.equal(stepGame(game, {}, 0.01).score, 100);
});

test('collisions account for opposite world edges', () => {
  const game = scene();
  game.asteroids[0].x = WORLD.width - 2;
  game.bullets = [bullet(50, 2, 100)];
  assert.equal(stepGame(game, {}, 0.01).score, 100);
});

test('one contact costs one life and respawn is briefly invulnerable', () => {
  const game = scene();
  game.asteroids[0].x = game.ship.x;
  game.asteroids[0].y = game.ship.y;
  const hit = stepGame(game, {}, 0.01);
  assert.equal(hit.lives, 2);
  assert.ok(hit.ship.invulnerable > 0);
  assert.equal(stepGame(hit, {}, 0.01).lives, 2);
});

test('last life ends the game and further updates do nothing', () => {
  const game = scene();
  game.lives = 1;
  game.asteroids[0].x = game.ship.x;
  game.asteroids[0].y = game.ship.y;
  const ended = stepGame(game, {}, 0.01);
  assert.equal(ended.status, 'gameover');
  assert.equal(ended.lives, 0);
  assert.deepEqual(stepGame(ended, { thrust: true, fire: true }, 0.05), ended);
  assert.equal(createGame().lives, 3);
  assert.equal(createGame().score, 0);
});

test('clearing a wave spawns the next one away from the ship', () => {
  const game = scene();
  game.asteroids = [rock(100, 100, 100)];
  game.bullets = [bullet(50, 100, 100)];
  const next = stepGame(game, {}, 0.01);
  assert.equal(next.wave, 2);
  assert.equal(next.asteroids.length, next.settings.asteroidCount + 1);
  assert.equal(next.score, 100);
});

test('invalid time steps fail and zero time does not advance the game', () => {
  const game = scene();
  assert.throws(() => stepGame(game, {}, NaN), /time/i);
  assert.throws(() => stepGame(game, {}, -1), /time/i);
  assert.deepEqual(stepGame(game, { fire: true }, 0), game);
});

test('long frame gaps are bounded', () => {
  const game = scene();
  assert.deepEqual(stepGame(game, { thrust: true }, 10), stepGame(game, { thrust: true }, 0.05));
});

test('game parameters reject non-finite and invalid values', () => {
  for (const options of [{ seed: NaN }, { asteroidCount: 0 }, { asteroidCount: 31 }, { asteroidSpeed: 0 }]) {
    assert.throws(() => createGame(options));
  }
});
