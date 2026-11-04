(function () {
  const form = document.getElementById('tool-form');
  const { takeHomePay } = window.ToolLogic;
  const ERRORS = {
    invalid_salary: 'errorInvalidSalary',
    invalid_non_taxable: 'errorInvalidNonTaxable',
    invalid_family: 'errorInvalidFamily',
    invalid_children: 'errorInvalidChildren',
  };
  const AMOUNTS = ['annualNet', 'totalDeduction', 'pension', 'health', 'longTermCare', 'employment', 'incomeTax', 'localTax'];

  function won(value) {
    return ToolUI.label('wonFormat').replace('{n}', ToolUI.fmt(value));
  }

  function update() {
    const annualSalary = ToolUI.num('annualSalary');
    if (annualSalary === null) {
      ToolUI.clearErrors(form);
      ToolUI.clearOutputs(form);
      return;
    }

    const result = takeHomePay({
      annualSalary,
      monthlyNonTaxable: ToolUI.num('nonTaxable') ?? 0,
      family: ToolUI.num('family') ?? 1,
      children: ToolUI.num('children') ?? 0,
    });
    if (result.error) {
      ToolUI.clearOutputs(form);
      ToolUI.showError(form, ERRORS[result.error]);
      return;
    }

    ToolUI.clearErrors(form);
    ToolUI.setOutput('monthlyNet', won(result.monthlyNet));
    for (const id of AMOUNTS) {
      ToolUI.setOutput(id, won(result[id]));
    }
  }

  ToolUI.bindAmount('annualSalary');
  ToolUI.bindAmount('nonTaxable');
  form.addEventListener('input', update);
  form.addEventListener('change', update);
  update();
})();
