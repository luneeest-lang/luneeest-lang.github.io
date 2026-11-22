(function () {
  const form = document.getElementById('tool-form');
  const { addDays, milestones } = window.ToolLogic;
  const lang = document.documentElement.lang;
  const dateFormat = new Intl.DateTimeFormat(lang, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
  const weekdayFormat = new Intl.DateTimeFormat(lang, { weekday: 'long', timeZone: 'UTC' });
  const shortWeekday = new Intl.DateTimeFormat(lang, { weekday: 'short', timeZone: 'UTC' });
  const section = document.getElementById('milestones');
  const caption = document.getElementById('milestones-caption');
  const body = document.getElementById('milestones-body');

  function cell(value) {
    const date = new Date(`${value.date}T00:00:00Z`);
    const td = document.createElement('td');
    td.textContent = `${dateFormat.format(date)} (${shortWeekday.format(date)})`;
    return td;
  }

  function updateMilestones(start, includeStart) {
    const table = milestones({ start, includeStart });
    if (table.error) {
      section.hidden = true;
      return;
    }
    const base = dateFormat.format(new Date(`${start}T00:00:00Z`));
    let text = ToolUI.label('milestonesCaption').replace('{date}', base);
    if (includeStart) text += ` · ${ToolUI.label('includeStartLabel')}`;
    caption.textContent = text;
    const gap = /^[a-z]/i.test(ToolUI.label('unitDays')) ? ' ' : '';
    body.replaceChildren(...table.rows.map((row) => {
      const tr = document.createElement('tr');
      const th = document.createElement('th');
      th.scope = 'row';
      th.textContent = `${row.days}${gap}${ToolUI.label('unitDays')}`;
      tr.append(th, cell(row.before), cell(row.after));
      return tr;
    }));
    section.hidden = false;
  }

  function update() {
    const start = document.getElementById('start').value;
    const days = ToolUI.num('days');
    const includeStart = document.getElementById('includeStart').checked;
    if (start) updateMilestones(start, includeStart);

    if (!start || days === null) {
      ToolUI.clearErrors(form);
      ToolUI.clearOutputs(form);
      return;
    }

    const result = addDays({ start, days, includeStart });
    if (result.error) {
      ToolUI.clearOutputs(form);
      ToolUI.showError(form, result.error === 'invalid_date' ? 'errorInvalidDate' : 'errorInvalidDays');
      return;
    }

    const date = new Date(`${result.date}T00:00:00Z`);
    ToolUI.clearErrors(form);
    ToolUI.setOutput('resultDate', dateFormat.format(date));
    ToolUI.setOutput('weekday', weekdayFormat.format(date));
  }

  form.addEventListener('click', (event) => {
    const preset = event.target.closest('[data-days]');
    if (!preset) return;
    document.getElementById('days').value = preset.dataset.days;
    update();
  });

  ToolUI.defaultToday('start');
  form.addEventListener('input', update);
  form.addEventListener('change', update);
  update();
})();
