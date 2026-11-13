(function () {
  const form = document.getElementById('tool-form');
  const { annualLeave, leavePay } = window.ToolLogic;

  function days(value) {
    return ToolUI.label('daysFormat').replace('{n}', ToolUI.fmt(value));
  }

  function won(value) {
    return ToolUI.label('wonFormat').replace('{n}', ToolUI.fmt(value));
  }

  function update() {
    const hireDate = document.getElementById('hireDate').value;
    const on = document.getElementById('on').value;

    if (!hireDate || !on) {
      ToolUI.clearErrors(form);
      ToolUI.clearOutputs(form);
      return;
    }

    const leave = annualLeave({ hireDate, on });
    if (leave.error) {
      ToolUI.clearOutputs(form);
      ToolUI.showError(form, leave.error === 'hire_after_base' ? 'errorHireAfterBase' : 'errorInvalidDate');
      return;
    }

    const monthlyOrdinaryWage = ToolUI.num('monthlyWage');
    const unusedDays = ToolUI.num('unusedDays');
    let pay = null;
    if (monthlyOrdinaryWage !== null && unusedDays !== null) {
      pay = leavePay({ monthlyOrdinaryWage, unusedDays });
      if (pay.error) {
        ToolUI.clearOutputs(form);
        ToolUI.showError(form, pay.error === 'invalid_wage' ? 'errorInvalidWage' : 'errorInvalidDays');
        return;
      }
    }

    ToolUI.clearErrors(form);
    ToolUI.setOutput(
      'leaveNow',
      leave.yearsCompleted > 0
        ? ToolUI.label('leaveYearFormat').replace('{n}', days(leave.currentGrant)).replace('{date}', leave.currentGrantDate)
        : ToolUI.label('leaveMonthlyFormat').replace('{n}', days(leave.firstYearDays))
    );
    ToolUI.setOutput('yearsCompleted', ToolUI.label('yearsFormat').replace('{n}', ToolUI.fmt(leave.yearsCompleted)));
    ToolUI.setOutput('totalAccrued', days(leave.totalAccrued));
    ToolUI.setOutput(
      'nextGrant',
      ToolUI.label('nextGrantFormat').replace('{date}', leave.nextGrantDate).replace('{n}', days(leave.nextGrantDays))
    );
    ToolUI.setOutput(
      'leavePay',
      pay ? ToolUI.label('leavePayFormat').replace('{pay}', won(pay.pay)).replace('{daily}', won(pay.dailyWage)) : ToolUI.label('leavePayHint')
    );
  }

  ToolUI.defaultToday('on');
  ToolUI.bindAmount('monthlyWage');
  form.addEventListener('input', update);
  form.addEventListener('change', update);
  update();
})();
