import { describe, expect, it } from 'vitest';
import { ownRule } from '../src/lib/rule.js';

const phone = { purchaseDate: '2022-10-20', reasons: ['battery', 'updates'], securityEndDate: '2027-10-01', batteryHealthPct: 81 };
const today = '2026-09-19';

describe('the own-rule card', () => {
  it('is null without reasons', () => {
    expect(ownRule({ ...phone, reasons: [] }, today)).toBeNull();
  });

  it('shows a tile for each reason with data, as in the reference', () => {
    const rule = ownRule(phone, today);
    expect(rule.tiles).toEqual([
      { id: 'battery', pct: 81, status: 'warn', note: 'near' },
      { id: 'updates', days: 377, date: '2027-10-01', status: 'ok', ended: false },
    ]);
    expect(rule.advice).toBe('notYetMany');
  });

  it('asks about reasons without data but shows no tile for them', () => {
    const rule = ownRule({ ...phone, reasons: ['camera', 'screen'] }, today);
    expect(rule.tiles).toEqual([]);
    expect(rule.reasons).toEqual(['camera', 'screen']);
    expect(rule.advice).toBe('noData');
  });

  it('puts the battery first and says so when the phone feels slow', () => {
    const rule = ownRule({ ...phone, reasons: ['updates', 'slow'] }, today);
    expect(rule.tiles.map((tile) => tile.id)).toEqual(['battery', 'updates']);
    expect(rule.advice).toBe('slow');
  });

  it('never hides that security updates have ended', () => {
    const rule = ownRule({ ...phone, reasons: ['updates', 'slow'], batteryHealthPct: 70 }, '2027-11-01');
    expect(rule.tiles[1]).toMatchObject({ id: 'updates', ended: true, status: 'warn' });
    expect(rule.advice).toBe('updatesEnded');
  });

  it('points at the battery once it is below the 80% line', () => {
    expect(ownRule({ ...phone, batteryHealthPct: 76 }, today).advice).toBe('batteryWorn');
  });

  it('leaves out tiles for data that is unknown', () => {
    const rule = ownRule({ ...phone, batteryHealthPct: undefined, securityEndDate: undefined }, today);
    expect(rule.tiles).toEqual([]);
  });
});
