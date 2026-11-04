(function () {
  const form = document.getElementById('tool-form');
  const { unemploymentBenefit } = window.ToolLogic;
  const ERRORS = {
    invalid_date: 'errorInvalidDate',
    unsupported_year: 'errorUnsupportedYear',
    invalid_wages: 'errorInvalidWages',
    invalid_hours: 'errorInvalidHours',
  };

  function won(value) {
    return ToolUI.label('wonFormat').replace('{n}', ToolUI.fmt(value));
  }

  function update() {
    const lastWorkDay = document.getElementById('lastWorkDay').value;
    const wagesLast3Months = ToolUI.num('wages');
    const dailyHours = ToolUI.num('dailyHours');

    if (!lastWorkDay || wagesLast3Months === null || dailyHours === null) {
      ToolUI.clearErrors(form);
      ToolUI.clearOutputs(form);
      return;
    }

    const result = unemploymentBenefit({
      lastWorkDay,
      wagesLast3Months,
      dailyHours,
      olderOrDisabled: document.getElementById('olderOrDisabled').checked,
      insuredBand: document.getElementById('insuredBand').value,
    });
    if (result.error) {
      ToolUI.clearOutputs(form);
      ToolUI.showError(form, ERRORS[result.error] || 'errorInvalidWages');
      return;
    }

    ToolUI.clearErrors(form);
    ToolUI.setOutput('dailyBenefit', won(result.dailyBenefit));
    ToolUI.setOutput('benefitDays', ToolUI.label('daysFormat').replace('{n}', ToolUI.fmt(result.benefitDays)));
    ToolUI.setOutput('total', won(result.total));
    ToolUI.setOutput('monthly', won(result.monthly));
    const rule = { rate: 'basisRate', cap: 'basisCap', floor: 'basisFloor' }[result.rule];
    ToolUI.setOutput(
      'basis',
      ToolUI.label(rule)
        .replace('{avg}', won(Math.floor(result.averageDailyWage)))
        .replace('{wage}', won(result.minimumWage))
        .replace('{start}', result.periodStart)
        .replace('{end}', result.periodEnd)
        .replace('{days}', ToolUI.fmt(result.periodDays))
    );
  }

  ToolUI.bindAmount('wages');
  form.addEventListener('input', update);
  form.addEventListener('change', update);
  update();
})();
