import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Avatar } from '../src/ui/Avatar';
import { appearance, avatarState, ageStage } from '../src/ui/appearance';
import { createRun } from '../src/engine/engine';
import { parseSave, snapshot } from '../src/persistence/saves';
describe('original living avatar', () => {
  it('keeps identity through every age stage without consuming simulation RNG', () => {
    const run = createRun('portrait-fixture'),
      rng = { ...run.rng },
      identity = appearance(run.seed);
    const drawings = new Set();
    for (const [i, age] of [0, 7, 15, 25, 45, 70].entries()) {
      const visual = { ...run, month: age * 12 };
      expect(avatarState(visual).identity).toEqual(identity);
      expect(ageStage(age)).toBe(i);
      const svg = renderToStaticMarkup(createElement(Avatar, { run: visual }));
      expect(svg).toContain(`data-stage="${i}"`);
      for (const layer of ['body', 'head', 'face', 'top'])
        expect(svg).toContain(`data-layer="${layer}"`);
      drawings.add(svg.replace(/id="[^"]+"/g, ''));
    }
    expect(drawings.size).toBe(6);
    expect(run.rng).toEqual(rng);
  });
  it('derives the same face after strict save/replay and supports independent biological age', () => {
    const run = createRun('portrait-persistence'),
      loaded = parseSave(JSON.stringify(snapshot(run))).run;
    expect(avatarState(loaded)).toEqual(avatarState(run));
    expect(avatarState({ ...run, month: 900 }, 25).stage).toBe(3);
    expect(avatarState({ ...run, month: 900 }).stage).toBe(5);
  });
  it('reacts to actual mood, stress and health, independently from appearance', () => {
    const r = createRun('expressions');
    r.player.stats.health = 20;
    expect(avatarState(r).expression).toBe('Mệt mỏi');
    r.player.stats.health = 80;
    r.player.stats.stress = 80;
    expect(avatarState(r).expression).toBe('Lo lắng');
    r.player.stats.stress = 0;
    r.player.stats.mood = 90;
    expect(avatarState(r).expression).toBe('Vui vẻ');
    expect(new Set(Array.from({ length: 30 }, (_, i) => appearance('skin-' + i).skin)).size).toBe(
      5,
    );
  });
});
