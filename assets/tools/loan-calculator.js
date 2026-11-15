(function () {
  const form = document.getElementById('tool-form');
  const scheduleBody = document.getElementById('schedule-body');
  const { loanSchedule } = window.ToolLogic;
  const decimals = document.documentElement.lang === 'ko' ? 0 : 2;

  function money(value) {
    return ToolUI.fmtMoney(value, decimals);
  }

  const schedule = document.getElementById('schedule');
  let pendingRows = [];

  // Up to 1,200 rows: only draw them while the schedule is open, so typing stays responsive.
  function renderRows(rows) {
    pendingRows = rows;
    if (!schedule.open) {
      scheduleBody.innerHTML = '';
      return;
    }
    scheduleBody.innerHTML = rows
      .map(
        (row) =>
          `<tr><td>${row.month}</td><td>${money(row.payment)}</td><td>${money(row.principal)}</td><td>${money(row.interest)}</td><td>${money(row.balance)}</td></tr>`
      )
      .join('');
  }

  function update() {
    const principal = ToolUI.num('principal');
    const rate = ToolUI.num('rate');
    const months = ToolUI.num('months');
    const method = document.getElementById('method').value;

    scheduleBody.innerHTML = '';
    pendingRows = [];

    if (principal === null && rate === null && months === null) {
      ToolUI.clearErrors(form);
      ToolUI.clearOutputs(form);
      return;
    }

    const valid =
      ToolUI.isNumber(principal) && principal > 0 &&
      ToolUI.isNumber(rate) && rate >= 0 &&
      ToolUI.isNumber(months) && months > 0 && Number.isInteger(months) && months <= 1200;

    if (!valid) {
      ToolUI.clearOutputs(form);
      ToolUI.showError(form, 'errorInvalid');
      return;
    }

    const result = loanSchedule({ principal, annualRatePercent: rate, months, method, decimals });
    ToolUI.clearErrors(form);
    ToolUI.setOutput('payment', money(result.firstPayment));
    ToolUI.setOutput('lastPayment', money(result.lastPayment));
    ToolUI.setOutput('totalInterest', money(result.totalInterest));
    ToolUI.setOutput('totalPayment', money(result.totalPayment));
    renderRows(result.rows);
  }

  ToolUI.bindAmount('principal');
  form.addEventListener('input', update);
  form.addEventListener('change', update);
  schedule.addEventListener('toggle', () => renderRows(pendingRows));
  update();
})();
