import { describe, expect, it } from 'vitest';
import { needQuestions, needResult } from '../src/lib/needtest.js';

const today = '2026-09-19';
const phone = { purchaseDate: '2022-10-20', securityEndDate: '2027-10-01', reasons: ['battery', 'updates'] };
const result = (device, answers) => needResult(device, answers, today);

describe('need test questions', () => {
  it('asks everyone about the apps', () => {
    expect(needQuestions({ reasons: [] })).toEqual(['apps']);
  });

  it('answers "slow" with the battery check first', () => {
    expect(needQuestions({ reasons: ['slow'] })).toEqual(['apps', 'battery']);
    expect(needQuestions({ reasons: ['camera', 'slow', 'screen'] })).toEqual(['apps', 'battery', 'screen', 'camera']);
  });

  it('never asks about updates or "something else"', () => {
    expect(needQuestions({ reasons: ['updates', 'other'] })).toEqual(['apps']);
  });
});

describe('need test result', () => {
  it('says keep when everything still does the job, as in the reference', () => {
    const r = result(phone, { apps: true, battery: 81 });
    expect(r.result).toBe('keep');
    expect(r.checks.map((c) => [c.id, c.status])).toEqual([
      ['updates', 'ok'],
      ['apps', 'ok'],
      ['battery', 'warn'],
    ]);
    expect([r.passed, r.known]).toEqual([3, 3]);
  });

  it('says upgrade once security updates have ended, whatever else is fine', () => {
    const r = result({ ...phone, securityEndDate: '2026-08-01' }, { apps: true, battery: 95 });
    expect(r.result).toBe('upgrade');
    expect(r.checks[0]).toMatchObject({ id: 'updates', status: 'bad', ended: true });
  });

  it('says upgrade when banking, ID or work apps no longer run, even with a worn battery', () => {
    expect(result(phone, { apps: false, battery: 60 }).result).toBe('upgrade');
  });

  it('says upgrade even when the user gave no reasons', () => {
    expect(result({ ...phone, reasons: [] }, { apps: false }).result).toBe('upgrade');
  });

  it('says repair below the 80% battery line', () => {
    const r = result(phone, { apps: true, battery: 79 });
    expect(r.result).toBe('repair');
    expect(r.checks.find((c) => c.id === 'battery')).toMatchObject({ status: 'bad', note: 'below' });
  });

  it('puts "slow" down to the battery when it is worn, and not otherwise', () => {
    const slow = { ...phone, reasons: ['slow'] };
    expect(result(slow, { apps: true, battery: 72 }).checks.find((c) => c.id === 'slow').note).toBe('battery');
    const fine = result(slow, { apps: true, battery: 92 });
    expect(fine.result).toBe('keep');
    expect(fine.checks.find((c) => c.id === 'slow')).toMatchObject({ status: 'ok', note: 'notBattery' });
    expect(result(slow, { apps: true, battery: null }).checks.find((c) => c.id === 'slow').note).toBe('checkBattery');
  });

  it('says repair for a broken screen, damage or a camera that no longer works', () => {
    expect(result({ ...phone, reasons: ['screen'] }, { apps: true, screen: true }).result).toBe('repair');
    expect(result({ ...phone, reasons: ['damage'] }, { apps: true, damage: true }).result).toBe('repair');
    expect(result({ ...phone, reasons: ['camera'] }, { apps: true, camera: false }).result).toBe('repair');
    expect(result({ ...phone, reasons: ['camera'] }, { apps: true, camera: true }).result).toBe('keep');
  });

  it('keeps a phone whose storage is full: clearing it out costs nothing', () => {
    const r = result({ ...phone, reasons: ['storage'] }, { apps: true, storage: true });
    expect(r.result).toBe('keep');
    expect(r.checks.find((c) => c.id === 'storage')).toMatchObject({ status: 'warn', note: 'full' });
  });

  it('treats an unanswered question as unknown, the camera included', () => {
    const r = result({ ...phone, reasons: ['camera', 'screen'] }, { apps: true });
    expect(r.checks.filter((c) => c.id === 'camera' || c.id === 'screen').map((c) => c.status)).toEqual(['unknown', 'unknown']);
  });

  it('leaves out of the count what it does not know', () => {
    const r = result({ ...phone, securityEndDate: undefined }, { apps: true, battery: null });
    expect(r.checks.map((c) => c.status)).toEqual(['unknown', 'ok', 'unknown']);
    expect([r.passed, r.known]).toEqual([1, 1]);
    expect(r.result).toBe('keep');
  });

  it('explains the end of Android versions only to people who picked "updates ending"', () => {
    const galaxy = { ...phone, securityEndDate: '2027-02-25', androidEndDate: '2026-02-25' };
    expect(result(galaxy, { apps: true }).checks[0].androidEndDate).toBe('2026-02-25');
    expect(result({ ...galaxy, reasons: ['battery'] }, { apps: true }).checks[0].androidEndDate).toBeUndefined();
  });
});
