import { describe, expect, it } from 'vitest';
import { eligibleHeadlines, HEADLINES, pickHeadline } from '../src/lib/headlines.js';

const phone = { purchaseDate: '2022-10-20', purchasePrice: 899, maintenance: [], reasons: ['battery', 'updates'], securityEndDate: '2027-10-01' };

describe('eligible headlines', () => {
  it('offers all four when reasons and the security end date are known', () => {
    expect(eligibleHeadlines(phone)).toEqual(HEADLINES);
  });

  it('leaves out own_rule without reasons and support without an end date', () => {
    expect(eligibleHeadlines({ ...phone, reasons: [] })).toEqual(['cost', 'support', 'time_held']);
    expect(eligibleHeadlines({ ...phone, securityEndDate: undefined })).toEqual(['own_rule', 'cost', 'time_held']);
    expect(eligibleHeadlines({ ...phone, reasons: [], securityEndDate: undefined })).toEqual(['cost', 'time_held']);
  });
});

describe('the headline pick', () => {
  // HANDOFF section 12: over 10,000 simulated showings, each eligible headline lands within
  // 2 percentage points of its expected share, and ineligible headlines never appear.
  it.each([[HEADLINES], [['cost', 'support', 'time_held']], [['cost', 'time_held']]])(
    'spreads 10,000 showings evenly over %j',
    (eligible) => {
      const counts = Object.fromEntries(HEADLINES.map((id) => [id, 0]));
      for (let i = 0; i < 10_000; i++) counts[pickHeadline(eligible)]++;
      for (const id of HEADLINES) {
        if (eligible.includes(id)) expect(Math.abs(counts[id] / 10_000 - 1 / eligible.length)).toBeLessThan(0.02);
        else expect(counts[id]).toBe(0);
      }
    },
  );

  it('draws again rather than favour the first headlines', () => {
    // With three headlines, 2^32 - 1 is in the uneven tail and must be redrawn.
    const draws = [2 ** 32 - 1, 4];
    expect(pickHeadline(['a', 'b', 'c'], () => draws.shift())).toBe('b');
    expect(draws).toEqual([]);
  });
});
