import { describe, expect, it } from 'vitest';
import { currentMilestone, milestoneKey, milestones } from '../src/lib/milestones.js';

const phone = { id: 'p1', purchaseDate: '2022-10-20', securityEndDate: '2027-10-01' };

describe('milestones', () => {
  it('lists 2 to 5 years and the end of security updates, by date', () => {
    expect(milestones(phone).map((m) => [m.id, m.date])).toEqual([
      ['years2', '2024-10-20'],
      ['years3', '2025-10-20'],
      ['years4', '2026-10-20'],
      ['updatesEnded', '2027-10-01'],
      ['years5', '2027-10-20'],
    ]);
  });

  it('handles a phone bought on 29 February', () => {
    expect(milestones({ purchaseDate: '2024-02-29' })[0].date).toBe('2026-03-01');
  });

  it('shows a milestone from the day it is reached, for 30 days', () => {
    expect(currentMilestone(phone, '2026-10-19')).toBeNull();
    expect(currentMilestone(phone, '2026-10-20').id).toBe('years4');
    expect(currentMilestone(phone, '2026-11-18').id).toBe('years4');
    expect(currentMilestone(phone, '2026-11-19')).toBeNull();
  });

  it('does not bring up an old milestone on the first day', () => {
    expect(currentMilestone(phone, '2026-09-23')).toBeNull();
  });

  it('shows the newest when two fall close together', () => {
    expect(currentMilestone(phone, '2027-10-25').id).toBe('years5');
  });

  it('stays away once seen', () => {
    const years4 = milestones(phone)[2];
    expect(currentMilestone(phone, '2026-10-21', [milestoneKey(phone, years4)])).toBeNull();
    expect(currentMilestone({ ...phone, id: 'p2' }, '2026-10-21', [milestoneKey(phone, years4)]).id).toBe('years4');
  });

  it('marks the end of security updates', () => {
    expect(currentMilestone(phone, '2027-10-05').id).toBe('updatesEnded');
    expect(currentMilestone({ ...phone, securityEndDate: undefined }, '2027-10-05')).toBeNull();
  });
});
