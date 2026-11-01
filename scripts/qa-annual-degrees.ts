import { chromium, firefox, webkit, expect } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { annualAssessment, healthyChoice } from './annual-fixture';
import { importStudent } from './qa-university';
import {
  assertDecisionViewport,
  clickChoiceWithoutDocumentScroll,
  readGuestRun,
} from './decision-viewport.mjs';
import { activeDefinition, choiceReason } from '../src/engine/engine';
import { storyAction, decisionKey } from '../src/application/story-flow';
import { canonical, parseSave, snapshot } from '../src/persistence/saves';
import { stageTemplate } from '../src/content/academic-stages';
import { currentStudy } from '../src/engine/academics';
const target = process.argv[2] ?? 'http://127.0.0.1:5173/mot-kiep-viet/';
const scope = target.includes('github.io') ? 'live' : 'local';
const results: unknown[] = [];
for (const [browserName, type] of Object.entries({ chromium, firefox, webkit })) {
  const browser = await type.launch();
  try {
    for (const [label, viewport] of Object.entries({
      desktop: { width: 1440, height: 900 },
      mobile: { width: 375, height: 667 },
    })) {
      const context = await browser.newContext({ viewport });
      try {
        const page = await context.newPage();
        await page.goto(target);
        for (const program of ['health', 'korean'] as const) {
          let expected = annualAssessment(program);
          const scenes: string[] = [];
          await importStudent(page, expected);
          await expect(page.locator('#event-heading')).toBeFocused();
          for (let steps = 0; steps < 80 && !expected.academics!.qualifications.length; steps++) {
            const e = activeDefinition(expected)!;
            await assertDecisionViewport(page);
            const study = currentStudy(expected);
            if (expected.academics?.focus && study) scenes.push(stageTemplate(expected, study).id);
            const option = expected.academics?.focus
              ? e.choices.find((c) => c.id === 'project')!
              : healthyChoice(expected);
            const index = e.choices
              .filter((c) => !choiceReason(expected, c))
              .findIndex((c) => c.id === option.id);
            expected = storyAction(
              expected,
              { type: 'choose', eventId: e.id, choiceId: option.id },
              decisionKey(expected),
            );
            await clickChoiceWithoutDocumentScroll(page, index);
            await expect
              .poll(async () => canonical(await readGuestRun(page)) === canonical(expected), {
                timeout: 15000,
              })
              .toBe(true);
          }
          const s = expected.academics!.studies[0];
          expect(s.status).toBe('graduated');
          expect(new Set(scenes).size).toBe(program === 'health' ? 6 : 4);
          expect(parseSave(JSON.stringify(snapshot(await readGuestRun(page)))).run).toEqual(
            expected,
          );
          await page.getByRole('button', { name: 'Nghề nghiệp', exact: true }).click();
          await expect(page.getByTestId('qualifications')).toBeVisible();
          await page.screenshot({
            path: `docs/evidence/yearly-${scope}-degree-${browserName}-${label}-${program}.png`,
            fullPage: true,
          });
          results.push({
            browser: browserName,
            label,
            program,
            status: 'VERIFIED PASS',
            scenes,
            completedYears: s.completedYears,
            paidTerms: s.paidTerms,
            internship: s.internship,
          });
          console.log(`${browserName}/${label}/${program}: VERIFIED PASS`);
        }
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
}
writeFileSync(
  `docs/evidence/yearly-${scope}-degrees.json`,
  JSON.stringify(
    {
      source: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
      status: 'VERIFIED PASS',
      results,
    },
    null,
    2,
  ) + '\n',
);
