import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { validateMission, loadMissions } from '../../src/missions/schema.js';
import { createGame } from '../../src/game/core.js';

const fixture = { id: 'example', title: 'Пример', description: 'Учебный сектор', seed: 42, asteroidCount: 5, asteroidSpeed: 1 };
const presets = () => readdirSync(new URL('../../src/missions/presets/', import.meta.url))
  .filter(name => name.endsWith('.json'))
  .map(name => JSON.parse(readFileSync(new URL('../../src/missions/presets/' + name, import.meta.url), 'utf8')));

test('all checked-in missions satisfy the contract and start a game', () => {
  const missions = loadMissions(presets());
  assert.ok(missions.length >= 2);
  for (const mission of missions) {
    const game = createGame(mission);
    assert.equal(game.asteroids.length, mission.asteroidCount);
    assert.equal(game.settings.seed, mission.seed);
    assert.equal(game.settings.asteroidSpeed, mission.asteroidSpeed);
  }
});

test('a new preset joins the sorted catalog without a hand-maintained index', () => {
  const missions = loadMissions([
    { ...fixture, id: 'zeta' }, { ...fixture, id: 'alpha' }, { ...fixture, id: 'third' },
  ]);
  assert.deepEqual(missions.map(m => m.id), ['alpha', 'third', 'zeta']);
});

test('empty catalogs and duplicate identifiers are rejected', () => {
  assert.throws(() => loadMissions([]), /empty/i);
  assert.throws(() => loadMissions([fixture, { ...fixture, title: 'Другое имя' }]), /duplicate/i);
});

test('invalid mission metadata and numeric settings are rejected', () => {
  for (const changed of [
    { id: '' }, { id: '../bad' }, { title: ' ' }, { description: '' },
    { seed: 1.5 }, { seed: Infinity }, { asteroidCount: 0 },
    { asteroidCount: 31 }, { asteroidCount: 2.5 }, { asteroidSpeed: 0 },
    { asteroidSpeed: -1 }, { asteroidSpeed: NaN }, { asteroidSpeed: Infinity },
  ]) assert.throws(() => validateMission({ ...fixture, ...changed }));
  for (const value of [null, [], 'mission']) assert.throws(() => validateMission(value));
});
