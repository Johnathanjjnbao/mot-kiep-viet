import { hasAnnualRules, hasEnterpriseRules, discretionaryCount } from '../domain/rules';
import { creatorReason, monetizationReady, creatorPolicyReason } from '../engine/creator-economy';
import { businessReason } from '../engine/business';
import { designMoney } from '../domain/currency';
import { socialEligible, requestSocial } from '../engine/social';
import type { GameRun, RunSetup } from '../domain/model';
import { CAREERS, ageOf, careerReason, currentCareer } from '../content/world';
import {
  dispatch,
  activeDefinition,
  advance,
  choiceReason,
  choose,
  createRun,
  manage,
} from '../engine/engine';
import { assertRun } from '../engine/invariants';
import { hashSeed, nextRandom } from '../engine/random';
import { PROGRAMS } from '../content/programs';
import { admissionReason, currentStudy, studyCosts } from '../engine/academics';
export function simulateLife(
  seed: string,
  setup: RunSetup,
  policy = 0,
  onStep?: (run: GameRun) => void,
) {
  let run = createRun(seed, setup),
    rng = hashSeed(seed + ':test-policy'),
    steps = 0;
  const random = () => {
    const [n, next] = nextRandom(rng);
    rng = next;
    return n;
  };
  while (
    run.status !== 'ended' &&
    steps++ < (run.employment ? 512 : run.family ? 480 : run.social ? 320 : 180)
  ) {
    assertRun(run);
    onStep?.(run);
    const managementAvailable = hasEnterpriseRules(run)
      ? discretionaryCount(run) < 108
      : !run.employment ||
        !run.family ||
        run.actions.filter((a) =>
          ['manage', 'wardrobe', 'social', 'family-talk', 'academic'].includes(a.type),
        ).length < 114;
    if (run.creator && managementAvailable && !creatorReason(run)) {
      const channels = run.creator.channels,
        total = channels.length + (run.enterprise?.ventures.length ?? 0);
      const count = run.actions.filter((a) => a.type === 'creator').length;
      const platform = policy % 2 ? 'tiktok' : 'youtube';
      if (
        !channels.length &&
        total < 4 &&
        !['business', 'freelance'].includes(currentCareer(run)?.id ?? '') &&
        run.world.year >= (platform === 'youtube' ? 2014 : 2018) &&
        run.finance.cash >= designMoney(run, 40)
      ) {
        run = dispatch(run, {
          type: 'creator',
          operation: 'start',
          platform,
          policy: {
            format: 'video',
            rhythm: policy === 3 ? 'intense' : 'light',
            focus: policy % 2 ? 'community' : 'craft',
            niche: policy === 4 ? 'gaming' : 'education',
          },
          expected: run.actions.length,
        });
        continue;
      }
      const c = channels.find((c) => c.status !== 'closed');
      const last = run.actions.filter((a) => a.type === 'creator').length;
      if (c && count < 16) {
        const id = c.id as 'creator:0';
        if (
          c.status === 'paused' &&
          c.burnout <= 60 &&
          !creatorPolicyReason(run, c, c.policy) &&
          run.finance.cash >= designMoney(run, 30) &&
          last < 12
        ) {
          run = dispatch(run, {
            type: 'creator',
            operation: 'resume',
            id,
            expected: run.actions.length,
          });
          continue;
        }
        if (
          monetizationReady(run, c) &&
          !['pending', 'approved'].includes(c.monetization) &&
          (c.appliedMonth === null || run.month - c.appliedMonth >= 12)
        ) {
          run = dispatch(run, {
            type: 'creator',
            operation: 'apply',
            id,
            expected: run.actions.length,
          });
          continue;
        }
        if (
          c.platform === 'tiktok' &&
          c.audience >= 1000 &&
          run.world.year >= 2023 &&
          c.policy.format === 'video' &&
          c.policy.niche !== 'gaming'
        ) {
          run = dispatch(run, {
            type: 'creator',
            operation: 'policy',
            id,
            policy: { ...c.policy, format: 'live', rhythm: 'light' },
            expected: run.actions.length,
          });
          continue;
        }
      }
    }
    if (run.enterprise && managementAvailable && !businessReason(run)) {
      const books = run.enterprise.ventures;
      const count = run.actions.filter((a) => a.type === 'enterprise').length;
      const incompatible = ['business', 'freelance'].includes(currentCareer(run)?.id ?? '');
      if (
        !incompatible &&
        books.length + (run.creator?.channels.length ?? 0) < 4 &&
        books.length < (policy === 4 ? 4 : 1) &&
        run.finance.cash >= designMoney(run, 40 + policy * 10)
      ) {
        run = dispatch(run, {
          type: 'enterprise',
          operation: 'found',
          category: (['clothing', 'household', 'handmade'] as const)[policy % 3],
          capital: designMoney(run, 40 + policy * 10),
          policy: {
            price: (['budget', 'balanced', 'premium'] as const)[policy % 3],
            marketing: policy % 2 === 0,
            reorderTarget: policy === 3 ? 0 : 20,
          },
          expected: run.actions.length,
        });
        continue;
      }
      const book = books.find((e) => e.status !== 'closed');
      const previous = [...run.actions].reverse().find((a) => a.type === 'enterprise');
      const lastMonth = previous
        ? (run.journal.filter((j) => j.title === 'Một quyết định với cửa hàng').at(-1)?.month ??
          book?.foundedMonth ??
          0)
        : 0;
      if (book && count < 14 && run.month - lastMonth >= 36) {
        if (book.status === 'suspended' && run.finance.cash >= designMoney(run, 40)) {
          run = dispatch(run, {
            type: 'enterprise',
            operation: 'fund',
            id: book.id as 'enterprise:0',
            amount: designMoney(run, 40),
            expected: run.actions.length,
          });
          continue;
        }
        const price = book.policy.price === 'balanced' ? 'premium' : 'balanced';
        run = dispatch(run, {
          type: 'enterprise',
          operation: 'policy',
          id: book.id as 'enterprise:0',
          policy: { ...book.policy, price },
          expected: run.actions.length,
        });
        continue;
      }
    }
    if (
      run.academics &&
      managementAvailable &&
      !run.activeEvent &&
      !run.academics.focus &&
      !run.social?.focus &&
      !run.family?.focus &&
      ageOf(run) >= 18 &&
      ageOf(run) < 60
    ) {
      const study = currentStudy(run);
      if (
        study?.status === 'paused' &&
        (!hasAnnualRules(run) || run.month - study.pausedMonth! >= 6) &&
        run.finance.cash >= studyCosts(run, study.programId).required + designMoney(run, 20) &&
        run.actions.filter((a) => a.type === 'academic').length < 35
      ) {
        if (currentCareer(run)) run = manage(run, 'quit-job');
        run = dispatch(run, {
          type: 'academic',
          operation: 'resume',
          expected: run.actions.length,
        });
        continue;
      }
      if (
        !study &&
        !currentCareer(run) &&
        run.academics.applications.length < 3 &&
        !run.academics.qualifications.length
      ) {
        const programs = PROGRAMS.filter((p) => !admissionReason(run, p.id));
        if (programs.length) {
          run = dispatch(run, {
            type: 'academic',
            operation: 'apply',
            program: programs[Math.floor(random() * programs.length)].id,
            expected: run.actions.length,
          });
          continue;
        }
      }
    }
    if (
      run.social &&
      managementAvailable &&
      !run.social.focus &&
      !run.family?.focus &&
      !run.academics?.focus &&
      ageOf(run) >= 18 &&
      run.actions.filter((a) => a.type === 'social').length < (run.family ? 32 : 60)
    ) {
      const ids =
        policy === 3
          ? [
              'soc-meet',
              'soc-listen',
              'soc-book',
              'soc-boundary',
              'soc-date',
              'soc-exclusive',
              'soc-cohabit',
              'soc-proposal',
              'soc-temptation',
              'soc-secret',
              'soc-confession',
              'soc-separate',
              'soc-divorce',
              'soc-new-start',
            ]
          : [
              'soc-meet',
              'soc-listen',
              'soc-book',
              'soc-boundary',
              'soc-date',
              'soc-exclusive',
              'soc-cohabit',
              'soc-proposal',
              'soc-budget',
              'soc-study',
              'soc-child-plan',
              'soc-repair',
            ];
      const candidate = run.social.people
        .flatMap((p) => ids.map((id) => ({ id, npcId: p.npcId })))
        .find((x) => socialEligible(run, x.id, x.npcId, true));
      if (candidate) {
        run = requestSocial(run, {
          type: 'social',
          templateId: candidate.id,
          npcId: candidate.npcId,
          expected: run.actions.length,
        });
        continue;
      }
    }
    if (run.activeEvent) {
      const e = activeDefinition(run)!,
        choices = e.choices.filter((c) => !choiceReason(run, c));
      if (!choices.length) throw new Error(`Dead end ${seed}/${e.id}`);
      const preferred =
        policy === 4
          ? choices.find((c) =>
              [
                'invest',
                'review',
                'friendship',
                'support',
                'near',
                'talk',
                'network',
                'course',
                'trade',
              ].includes(c.id),
            )
          : undefined;
      const academicChoice = run.academics?.focus
        ? choices.find((c) => c.id === ['steady', 'project', 'work', 'rest', 'steady'][policy % 5])
        : undefined;
      const option = academicChoice ?? preferred ?? choices[Math.floor(random() * choices.length)];
      run = choose(run, e.id, option.id);
    } else {
      const clothing = policy % 2 ? 'linen-shirt' : 'sport-top';
      if (
        run.wardrobe &&
        managementAvailable &&
        ageOf(run) >= 18 &&
        !run.wardrobe.owned.includes(clothing) &&
        run.finance.cash >= designMoney(run, 24)
      ) {
        run = dispatch(run, {
          type: 'wardrobe',
          operation: 'buy',
          item: clothing,
          expected: run.actions.length,
        });
        run = dispatch(run, {
          type: 'wardrobe',
          operation: 'equip',
          item: clothing,
          expected: run.actions.length,
        });
      }
      if (
        managementAvailable &&
        policy !== 3 &&
        ageOf(run) >= 18 &&
        ageOf(run) < 65 &&
        !currentCareer(run)
      ) {
        const jobs = CAREERS.filter((j) => !careerReason(run, j.id));
        if (jobs.length)
          run = manage(run, 'apply-job', jobs[Math.floor(random() * jobs.length)].id);
      }
      if (
        ageOf(run) >= 30 &&
        managementAvailable &&
        run.finance.cash > designMoney(run, 950) &&
        !run.finance.assets.length &&
        policy % 2 === 0
      )
        run = manage(run, 'buy-home');
      if (
        managementAvailable &&
        ageOf(run) >= 18 &&
        run.finance.cash > designMoney(run, 150) &&
        policy === 1
      )
        run = manage(run, 'save-money');
      if (
        ageOf(run) >= 18 &&
        managementAvailable &&
        run.finance.liability.principal > 0 &&
        run.finance.cash > designMoney(run, 80) &&
        policy === 2
      )
        run = manage(run, 'repay');
      run = advance(run);
    }
  }
  assertRun(run);
  onStep?.(run);
  if (run.status !== 'ended') throw new Error(`Unbounded life ${seed}`);
  return run;
}
