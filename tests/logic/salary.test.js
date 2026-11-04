const { test } = require('node:test');
const assert = require('node:assert/strict');
const { incomeTax, takeHomePay } = require('../../src/logic/salary');

test('국세청 안내 예시: 월 350만 원, 공제대상가족 4명, 8~20세 자녀 2명이면 20,180원', () => {
  assert.equal(incomeTax({ monthlyTaxable: 3500000, family: 4, children: 2 }).incomeTax, 20180);
  assert.equal(incomeTax({ monthlyTaxable: 3500000, family: 1, children: 0 }).incomeTax, 127220);
  assert.equal(incomeTax({ monthlyTaxable: 3500000, family: 6, children: 0 }).incomeTax, 32380);
});

test('간이세액표 구간은 이상·미만으로 찾는다', () => {
  assert.equal(incomeTax({ monthlyTaxable: 3319999, family: 1, children: 0 }).incomeTax, 102770);
  assert.equal(incomeTax({ monthlyTaxable: 3320000, family: 1, children: 0 }).incomeTax !== 102770, true);
  assert.equal(incomeTax({ monthlyTaxable: 4510000, family: 3, children: 0 }).incomeTax, 170850);
});

test('월 77만 원 미만은 소득세가 없다', () => {
  assert.equal(incomeTax({ monthlyTaxable: 765000, family: 1, children: 0 }).incomeTax, 0);
});

test('월 1,000만 원과 그 초과 구간은 국세청 산식을 따른다', () => {
  assert.equal(incomeTax({ monthlyTaxable: 10000000, family: 1, children: 0 }).incomeTax, 1507400);
  // 1,507,400 + 2,000,000 × 98% × 35% + 25,000
  assert.equal(incomeTax({ monthlyTaxable: 12000000, family: 1, children: 0 }).incomeTax, 2218400);
  // 1,507,400 + 1,397,000 + 6,000,000 × 98% × 38%
  assert.equal(incomeTax({ monthlyTaxable: 20000000, family: 1, children: 0 }).incomeTax, 5138800);
  // 1,507,400 + 31,034,600 + 13,000,000 × 45%
  assert.equal(incomeTax({ monthlyTaxable: 100000000, family: 1, children: 0 }).incomeTax, 38392000);
});

test('8~20세 자녀 공제는 1명 12,500원, 2명 29,160원, 그 이상 1명당 25,000원이고 0원 아래로 내려가지 않는다', () => {
  assert.equal(incomeTax({ monthlyTaxable: 4500000, family: 3, children: 1 }).incomeTax, 170850 - 12500);
  assert.equal(incomeTax({ monthlyTaxable: 4500000, family: 5, children: 3 }).incomeTax, 133350 - 54160);
  assert.equal(incomeTax({ monthlyTaxable: 3300000, family: 11, children: 2 }).incomeTax, 0);
});

test('지방소득세는 소득세의 10%이고 10원 미만은 버린다', () => {
  assert.equal(incomeTax({ monthlyTaxable: 3300000, family: 1, children: 0 }).localTax, 10270);
});

test('연봉 4,200만 원, 비과세 20만 원, 본인 1명의 월 실수령액', () => {
  const r = takeHomePay({ annualSalary: 42000000, monthlyNonTaxable: 200000, family: 1, children: 0 });
  assert.equal(r.error, null);
  assert.equal(r.monthlyGross, 3500000);
  assert.equal(r.monthlyTaxable, 3300000);
  assert.equal(r.pension, 156750);
  assert.equal(r.health, 118630);
  assert.equal(r.longTermCare, 15580);
  assert.equal(r.employment, 29700);
  assert.equal(r.incomeTax, 102770);
  assert.equal(r.localTax, 10270);
  assert.equal(r.totalDeduction, 433700);
  assert.equal(r.monthlyNet, 3066300);
  assert.equal(r.annualNet, 3066300 * 12);
});

test('국민연금은 기준소득월액 상한 659만 원, 하한 41만 원을 적용한다', () => {
  assert.equal(takeHomePay({ annualSalary: 98400000, monthlyNonTaxable: 200000, family: 1, children: 0 }).pension, 313020);
  assert.equal(takeHomePay({ annualSalary: 6000000, monthlyNonTaxable: 200000, family: 1, children: 0 }).pension, 19470);
});

test('잘못된 입력은 오류', () => {
  const base = { annualSalary: 42000000, monthlyNonTaxable: 200000, family: 1, children: 0 };
  assert.equal(takeHomePay({ ...base, annualSalary: 0 }).error, 'invalid_salary');
  assert.equal(takeHomePay({ ...base, monthlyNonTaxable: 4000000 }).error, 'invalid_non_taxable');
  assert.equal(takeHomePay({ ...base, family: 0 }).error, 'invalid_family');
  assert.equal(takeHomePay({ ...base, family: 12 }).error, 'invalid_family');
  assert.equal(takeHomePay({ ...base, family: 2, children: 2 }).error, 'invalid_children');
});
