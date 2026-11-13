const { test } = require('node:test');
const assert = require('node:assert/strict');
const { dateDiff, addDays } = require('../../src/logic/date');

test('윤년 2월 28일에서 3월 1일까지는 2일', () => {
  const r = dateDiff({ start: '2024-02-28', end: '2024-03-01' });
  assert.equal(r.error, null);
  assert.equal(r.days, 2);
});

test('주수와 남은 일수를 나눠 준다', () => {
  const r = dateDiff({ start: '2025-01-01', end: '2025-01-18' });
  assert.equal(r.days, 17);
  assert.equal(r.weeks, 2);
  assert.equal(r.remainderDays, 3);
});

test('종료일이 시작일보다 앞이면 end_before_start', () => {
  const r = dateDiff({ start: '2025-03-01', end: '2025-02-01' });
  assert.equal(r.error, 'end_before_start');
});

test('존재하지 않는 날짜면 invalid_date', () => {
  const r = dateDiff({ start: '2025-13-01', end: '2025-02-01' });
  assert.equal(r.error, 'invalid_date');
});

test('날짜에 일수를 더하고 요일을 알려 준다', () => {
  const r = addDays({ start: '2026-01-01', days: 100 });
  assert.equal(r.error, null);
  assert.equal(r.date, '2026-04-11');
  assert.equal(r.weekday, 6);
});

test('시작일을 1일로 세면 하루 앞당겨진다', () => {
  const r = addDays({ start: '2026-01-01', days: 100, includeStart: true });
  assert.equal(r.date, '2026-04-10');
  assert.equal(r.weekday, 5);
});

test('음수 일수는 과거 날짜를 구한다', () => {
  assert.equal(addDays({ start: '2026-01-01', days: -100 }).date, '2025-09-23');
  assert.equal(addDays({ start: '2026-01-01', days: -100, includeStart: true }).date, '2025-09-24');
});

test('윤년 2월 28일에 하루를 더하면 2월 29일', () => {
  assert.equal(addDays({ start: '2024-02-28', days: 1 }).date, '2024-02-29');
});

test('날짜나 일수가 올바르지 않으면 오류', () => {
  assert.equal(addDays({ start: '2025-02-30', days: 1 }).error, 'invalid_date');
  assert.equal(addDays({ start: '2025-01-01', days: 1.5 }).error, 'invalid_days');
  assert.equal(addDays({ start: '2025-01-01', days: 1000000 }).error, 'invalid_days');
});

const { koreanAge, dischargeDate, militaryService } = require('../../src/logic/date');

test('만 나이, 연 나이, 세는 나이와 다음 생일까지 남은 날', () => {
  const before = koreanAge({ birth: '2000-05-10', on: '2026-05-09' });
  assert.equal(before.error, null);
  assert.equal(before.manAge, 25);
  assert.equal(before.yearAge, 26);
  assert.equal(before.countingAge, 27);
  assert.equal(before.daysToBirthday, 1);
  const on = koreanAge({ birth: '2000-05-10', on: '2026-05-10' });
  assert.equal(on.manAge, 26);
  assert.equal(on.daysToBirthday, 0);
});

test('2월 29일생은 평년에 3월 1일에 나이가 바뀐다', () => {
  assert.equal(koreanAge({ birth: '2000-02-29', on: '2025-02-28' }).manAge, 24);
  assert.equal(koreanAge({ birth: '2000-02-29', on: '2025-02-28' }).daysToBirthday, 1);
  assert.equal(koreanAge({ birth: '2000-02-29', on: '2025-03-01' }).manAge, 25);
  const leap = koreanAge({ birth: '2000-02-29', on: '2028-02-28' });
  assert.equal(leap.manAge, 27);
  assert.equal(leap.daysToBirthday, 1);
});

test('생년월일이 기준일보다 늦거나 올바르지 않으면 오류', () => {
  assert.equal(koreanAge({ birth: '2030-01-01', on: '2026-01-01' }).error, 'birth_after_base');
  assert.equal(koreanAge({ birth: '2000-02-30', on: '2026-01-01' }).error, 'invalid_date');
});

test('전역일은 입영일의 복무개월 뒤 해당일 전날', () => {
  assert.equal(dischargeDate({ enlist: '2026-03-15', months: 18 }), '2027-09-14');
  assert.equal(dischargeDate({ enlist: '2024-03-04', months: 18 }), '2025-09-03');
});

test('마지막 달에 해당일이 없으면 그 달 말일이 전역일', () => {
  assert.equal(dischargeDate({ enlist: '2026-08-31', months: 18 }), '2028-02-29');
  assert.equal(dischargeDate({ enlist: '2025-08-31', months: 18 }), '2027-02-28');
});

test('군별 복무기간으로 전역일, 복무일수, 남은 날, 진행률을 계산한다', () => {
  const r = militaryService({ enlist: '2026-03-15', branch: 'army', on: '2026-03-15' });
  assert.equal(r.error, null);
  assert.equal(r.months, 18);
  assert.equal(r.discharge, '2027-09-14');
  assert.equal(r.totalDays, 549);
  assert.equal(r.servedDays, 1);
  assert.equal(r.remainingDays, 548);
  assert.equal(militaryService({ enlist: '2026-03-15', branch: 'airforce', on: '2026-03-15' }).months, 21);
  assert.equal(militaryService({ enlist: '2026-03-15', branch: 'navy', on: '2026-03-15' }).months, 20);
  const done = militaryService({ enlist: '2026-03-15', branch: 'army', on: '2028-01-01' });
  assert.equal(done.servedDays, 549);
  assert.equal(done.remainingDays, 0);
  assert.equal(done.percent, 100);
  const early = militaryService({ enlist: '2026-03-15', branch: 'army', on: '2026-03-01' });
  assert.equal(early.servedDays, 0);
  assert.equal(early.percent, 0);
});

test('알 수 없는 군 종류나 잘못된 날짜는 오류', () => {
  assert.equal(militaryService({ enlist: '2026-03-15', branch: 'space', on: '2026-03-15' }).error, 'invalid_branch');
  assert.equal(militaryService({ enlist: '2026-13-15', branch: 'army', on: '2026-03-15' }).error, 'invalid_date');
});

const { annualLeave, leavePay } = require('../../src/logic/date');

test('입사 1년 미만은 1개월 개근마다 1일씩 생긴다', () => {
  const r = annualLeave({ hireDate: '2026-01-02', on: '2026-05-10' });
  assert.equal(r.error, null);
  assert.equal(r.yearsCompleted, 0);
  assert.equal(r.firstYearDays, 4);
  assert.equal(r.currentGrant, 0);
  assert.equal(r.totalAccrued, 4);
  assert.equal(r.nextGrantDate, '2026-06-02');
  assert.equal(r.nextGrantDays, 1);
});

test('첫해 월차는 최대 11일이고, 1년을 마친 다음 날 15일이 생긴다', () => {
  const before = annualLeave({ hireDate: '2026-01-02', on: '2027-01-01' });
  assert.equal(before.firstYearDays, 11);
  assert.equal(before.nextGrantDate, '2027-01-02');
  assert.equal(before.nextGrantDays, 15);
  const after = annualLeave({ hireDate: '2026-01-02', on: '2027-01-02' });
  assert.equal(after.yearsCompleted, 1);
  assert.equal(after.currentGrant, 15);
  assert.equal(after.currentGrantDate, '2027-01-02');
  assert.equal(after.totalAccrued, 26);
});

test('3년차부터 2년마다 1일씩 늘고 최대 25일이다', () => {
  assert.equal(annualLeave({ hireDate: '2023-01-02', on: '2026-01-02' }).currentGrant, 16);
  assert.equal(annualLeave({ hireDate: '2023-01-02', on: '2026-01-02' }).totalAccrued, 11 + 15 + 15 + 16);
  assert.equal(annualLeave({ hireDate: '2021-01-02', on: '2026-01-02' }).currentGrant, 17);
  assert.equal(annualLeave({ hireDate: '2000-01-03', on: '2026-06-01' }).currentGrant, 25);
  assert.equal(annualLeave({ hireDate: '2000-01-03', on: '2026-06-01' }).nextGrantDays, 25);
});

test('말일 입사는 민법 기간 계산대로 해당일이 없는 달의 다음 날 생긴다', () => {
  assert.equal(annualLeave({ hireDate: '2026-01-31', on: '2026-02-28' }).firstYearDays, 0);
  assert.equal(annualLeave({ hireDate: '2026-01-31', on: '2026-02-28' }).nextGrantDate, '2026-03-01');
  assert.equal(annualLeave({ hireDate: '2026-01-31', on: '2026-03-01' }).firstYearDays, 1);
});

test('입사일이 기준일보다 늦거나 날짜가 잘못되면 오류', () => {
  assert.equal(annualLeave({ hireDate: '2026-02-01', on: '2026-01-01' }).error, 'hire_after_base');
  assert.equal(annualLeave({ hireDate: '2026-02-30', on: '2026-03-01' }).error, 'invalid_date');
});

test('연차수당은 월 통상임금 ÷ 209 × 8시간 × 미사용 일수', () => {
  const r = leavePay({ monthlyOrdinaryWage: 2236300, unusedDays: 5 });
  assert.equal(r.error, null);
  assert.equal(r.dailyWage, 85600);
  assert.equal(r.pay, 428000);
  assert.equal(leavePay({ monthlyOrdinaryWage: 3000000, unusedDays: 3 }).pay, Math.floor((3000000 / 209) * 8 * 3));
  assert.equal(leavePay({ monthlyOrdinaryWage: 0, unusedDays: 3 }).error, 'invalid_wage');
  assert.equal(leavePay({ monthlyOrdinaryWage: 2236300, unusedDays: 2.5 }).pay, 214000);
  assert.equal(leavePay({ monthlyOrdinaryWage: 3000000, unusedDays: 1.25 }).error, 'invalid_days');
});
