const { TOOL_FORMS, CALC_SLUGS, TEXT_SLUGS } = require('./forms');
const { takeHomePay } = require('../../src/logic/salary');
const { dischargeDate, koreanAge } = require('../../src/logic/date');
const { severancePeriod, severancePay, unemploymentBenefit } = require('../../src/logic/finance');

function categoryOf(slug) {
  return CALC_SLUGS.includes(slug) ? 'calc' : 'text';
}

const LOGIC_FILE = {
  'loan-calculator': 'finance',
  severance: 'finance',
  'date-diff': 'date',
  'date-add': 'date',
  'hourly-wage': 'finance',
  'unemployment-benefit': 'finance',
  'take-home-pay': 'salary',
  'annual-leave': 'date',
  'korean-age': 'date',
  'discharge-date': 'date',
  pyeong: 'units',
  percent: 'units',
  bmi: 'health',
  'char-count': 'text',
  'case-convert': 'text',
  'line-cleanup': 'text',
  'dedupe-lines': 'text',
};

let assetVersion = 'dev';
let siteConfig = { adsenseClient: null, contactEmail: null, naverVerification: null };

function setAssetVersion(version) {
  assetVersion = version;
}

function setSiteConfig(config) {
  siteConfig = {
    adsenseClient: config.adsenseClient || null,
    contactEmail: config.contactEmail || null,
    naverVerification: config.naverVerification || null,
  };
}

// Web fonts load without blocking the first paint: the stylesheet starts as a print
// stylesheet and switches to all media once loaded. Only the 400 weight is used.
const FONT_CSS = 'https://fonts.googleapis.com/css2?family=Gowun+Batang&family=Gowun+Dodum&display=swap';

function fontTags() {
  return `  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preload" as="style" href="${FONT_CSS}">
  <link rel="stylesheet" href="${FONT_CSS}" media="print" onload="this.media='all'">
  <noscript><link rel="stylesheet" href="${FONT_CSS}"></noscript>`;
}

function iconTags() {
  return `
  <link rel="icon" href="${asset('/assets/favicon.svg')}" type="image/svg+xml">
  <link rel="icon" href="/favicon.ico" sizes="48x48">
  <link rel="apple-touch-icon" href="${asset('/assets/apple-touch-icon.png')}">`;
}

function verificationTag() {
  if (!siteConfig.naverVerification) return '';
  return `\n  <meta name="naver-site-verification" content="${escapeHtml(siteConfig.naverVerification)}" />`;
}

function adsenseTag() {
  if (!siteConfig.adsenseClient) return '';
  return `\n  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${siteConfig.adsenseClient}" crossorigin="anonymous"></script>`;
}

function asset(url) {
  return `${url}?v=${assetVersion}`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function paragraphs(text) {
  return text
    .split('\n\n')
    .map((part) => `<p>${escapeHtml(part)}</p>`)
    .join('\n');
}

// Open Graph tags drive link previews in KakaoTalk, Naver, and social apps.
function openGraphTags({ lang, title, description, url, origin, siteName, type }) {
  return `
  <meta property="og:type" content="${type}">
  <meta property="og:site_name" content="${escapeHtml(siteName)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(url)}">
  <meta property="og:image" content="${escapeHtml(origin)}/assets/og-${lang}.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:locale" content="${lang === 'ko' ? 'ko_KR' : 'en_US'}">
  <meta name="twitter:card" content="summary_large_image">`;
}

function rssTag(rss) {
  if (!rss) return '';
  return `
  <link rel="alternate" type="application/rss+xml" title="${escapeHtml(rss.title)}" href="${escapeHtml(rss.url)}">`;
}

function rssLink(lang, ui, origin) {
  return { title: `${ui.siteName} ${ui.guidesHeading}`, url: `${origin}/${lang}/guides/rss.xml` };
}

// Schema.org JSON-LD. "<" is escaped so page text can never close the script tag.
function jsonLdTag(data) {
  if (!data) return '';
  return `
  <script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}

const BRAND = { name: 'moatool', alternateName: '모아툴' };

function organizationNode(origin) {
  return {
    '@type': 'Organization',
    '@id': `${origin}/#organization`,
    name: BRAND.name,
    alternateName: BRAND.alternateName,
    url: `${origin}/`,
    logo: `${origin}/assets/apple-touch-icon.png`,
  };
}

function breadcrumbNode(items) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, item], index) => ({ '@type': 'ListItem', position: index + 1, name, item })),
  };
}

function graph(nodes) {
  return { '@context': 'https://schema.org', '@graph': nodes };
}

function head({ lang, title, description, origin, alternates, siteName, type = 'website', rss, jsonLd }) {
  const hreflangs = ['ko', 'en']
    .filter((code) => alternates[code])
    .map((code) => `<link rel="alternate" hreflang="${code}" href="${escapeHtml(origin + alternates[code])}">`)
    .join('\n    ');
  const url = origin + alternates[lang];
  return `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">${verificationTag()}
${fontTags()}
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${escapeHtml(url)}">
    ${hreflangs}
    <link rel="alternate" hreflang="x-default" href="${escapeHtml(origin + (alternates.ko || alternates[lang]))}">${openGraphTags({ lang, title, description, url, origin, siteName, type })}${rssTag(rss)}${jsonLdTag(jsonLd)}
  <link rel="stylesheet" href="${asset('/assets/style.css')}">${iconTags()}${adsenseTag()}
</head>`;
}

function header({ lang, ui, alternates, fallback }) {
  const other = lang === 'ko' ? 'en' : 'ko';
  const links = [[`/${lang}/`, ui.navTools]];
  links.push([`/${lang}/guides/`, ui.navGuides]);
  links.push([`/${lang}/about/`, ui.navAbout]);
  const nav = links.map(([href, label]) => `<a href="${href}">${escapeHtml(label)}</a>`).join('');
  return `<header class="site-header">
  <a class="site-name" href="/${lang}/">${escapeHtml(ui.siteName)}</a>
  <nav class="site-nav" aria-label="${escapeHtml(ui.navLabel)}">${nav}</nav>
  <a class="lang-switch" href="${alternates[other] || fallback || `/${other}/`}" hreflang="${other}" lang="${other}">${escapeHtml(ui.languageSwitch)}</a>
</header>`;
}

function footer(ui, lang) {
  const text = siteConfig.adsenseClient ? `${ui.footer} ${ui.footerAds}` : ui.footer;
  return `<footer class="site-footer">
  <p>${escapeHtml(text)}</p>
  <p><a href="/${lang}/guides/">${escapeHtml(ui.guidesLink)}</a> · <a href="/${lang}/about/">${escapeHtml(ui.aboutLink)}</a> · <a href="/${lang}/contact/">${escapeHtml(ui.contactLink)}</a> · <a href="/${lang}/privacy/">${escapeHtml(ui.privacyLink)}</a></p>
</footer>`;
}

function renderField(field, labels) {
  const label = escapeHtml(labels[field.labelKey]);
  if (field.type === 'checkbox') {
    return `<div class="field field-check">
  <input id="${field.id}" name="${field.id}" type="checkbox"${field.checked ? ' checked' : ''}>
  <label for="${field.id}">${label}</label>
</div>`;
  }
  if (field.type === 'select') {
    const options = field.options
      .map((option) => `<option value="${option.value}"${option.value === field.value ? ' selected' : ''}>${escapeHtml(labels[option.labelKey])}</option>`)
      .join('');
    return `<div class="field">
  <label for="${field.id}">${label}</label>
  <select id="${field.id}" name="${field.id}">${options}</select>
</div>`;
  }
  if (field.type === 'textarea') {
    return `<div class="field">
  <label for="${field.id}">${label}</label>
  <textarea id="${field.id}" name="${field.id}" rows="8"></textarea>
</div>`;
  }
  const unit = field.unitKey ? `<span class="unit">${escapeHtml(labels[field.unitKey])}</span>` : '';
  const inputmode = field.inputmode ? ` inputmode="${field.inputmode}"` : '';
  const type = field.type === 'date' ? 'date' : 'text';
  return `<div class="field">
  <label for="${field.id}">${label}</label>
  <div class="field-row">
    <input id="${field.id}" name="${field.id}" type="${type}"${inputmode}${field.value ? ` value="${escapeHtml(field.value)}"` : ''}${field.noShare ? ' data-no-share' : ''}${field.example ? ' data-example' : ''}>
    ${unit}
  </div>
</div>`;
}

function renderOutput(output, labels, ui) {
  const cls = output.primary ? 'output output-primary' : 'output';
  const copy = output.copy
    ? `\n  <button type="button" class="copy-btn" data-copy="${output.id}" data-label="${escapeHtml(ui.copyLabel)}" data-copied="${escapeHtml(ui.copiedLabel)}">${escapeHtml(ui.copyLabel)}</button>`
    : '';
  return `<div class="${cls}">
  <span class="output-label">${escapeHtml(labels[output.labelKey])}</span>
  <output id="${output.id}"></output>${copy}
</div>`;
}

function renderErrors(keys, labels) {
  return keys
    .map((key) => `<p class="error" data-error="${key}" role="alert" hidden>${escapeHtml(labels[key])}</p>`)
    .join('\n');
}

function renderExplanation(tool, ui) {
  const sections = [];
  if (tool.formula) {
    sections.push(`<section class="formula">
    <h2>${escapeHtml(ui.formulaHeading)}</h2>
    ${paragraphs(tool.formula)}
  </section>`);
  }
  if (tool.example) {
    sections.push(`<section class="example">
    <h2>${escapeHtml(ui.exampleHeading)}</h2>
    ${paragraphs(tool.example)}
  </section>`);
  }
  if (tool.notes && tool.notes.length) {
    sections.push(`<section class="notes">
    <h2>${escapeHtml(ui.notesHeading)}</h2>
    <ul>${tool.notes.map((note) => `<li>${escapeHtml(note)}</li>`).join('')}</ul>
  </section>`);
  }
  return sections.join('\n  ');
}

function renderReferences(tool, ui) {
  const parts = [];
  if (tool.sources && tool.sources.length) {
    const links = tool.sources
      .map((source) => `<li><a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.title)}</a></li>`)
      .join('');
    parts.push(`<section class="sources">
    <h2>${escapeHtml(ui.sourcesHeading)}</h2>
    <ul>${links}</ul>
  </section>`);
  }
  if (tool.updated) {
    parts.push(`<p class="updated">${escapeHtml(ui.updatedLabel)}: ${escapeHtml(tool.updated)}</p>`);
  }
  return parts.join('\n  ');
}

function renderSchedule(labels) {
  const columns = ['colMonth', 'colPayment', 'colPrincipal', 'colInterest', 'colBalance']
    .map((key) => `<th scope="col">${escapeHtml(labels[key])}</th>`)
    .join('');
  return `<details class="schedule" id="schedule">
    <summary>${escapeHtml(labels.scheduleLabel)}</summary>
    <div class="table-wrap">
      <table>
        <thead><tr>${columns}</tr></thead>
        <tbody id="schedule-body"></tbody>
      </table>
    </div>
  </details>`;
}

// Buttons that fill the days field with common values such as +100 and -1000.
function renderPresets(presets, labels) {
  const gap = /^[a-z]/i.test(labels.unitDays) ? ' ' : '';
  const buttons = presets
    .map((days) => `<button type="button" class="preset" data-days="${days}">${days > 0 ? '+' : ''}${days}${gap}${escapeHtml(labels.unitDays)}</button>`)
    .join('');
  return `<div class="presets" role="group" aria-label="${escapeHtml(labels.presetsLabel)}">
      <span class="presets-label">${escapeHtml(labels.presetsLabel)}</span>
      ${buttons}
    </div>`;
}

// Filled in the browser from the start date, so it always shows the visitor's own dates.
function renderMilestones(labels) {
  const columns = ['colPeriod', 'colBefore', 'colAfter']
    .map((key) => `<th scope="col">${escapeHtml(labels[key])}</th>`)
    .join('');
  return `<section class="milestones" id="milestones" hidden>
    <h2>${escapeHtml(labels.milestonesHeading)}</h2>
    <div class="milestones-wrap">
      <table>
        <caption id="milestones-caption"></caption>
        <thead><tr>${columns}</tr></thead>
        <tbody id="milestones-body"></tbody>
      </table>
    </div>
  </section>`;
}

// The share link keeps inputs after "#", which browsers never send to the server.
function renderShare(ui) {
  return `<div class="share">
    <button type="button" class="copy-btn" data-share data-label="${escapeHtml(ui.shareLabel)}" data-copied="${escapeHtml(ui.sharedLabel)}">${escapeHtml(ui.shareLabel)}</button>
    <p class="share-hint">${escapeHtml(ui.shareHint)}</p>
  </div>`;
}

function renderRelatedGuide(relatedGuide, ui, lang) {
  if (!relatedGuide) return '';
  return `<section class="related-guide">
    <h2>${escapeHtml(ui.relatedGuideHeading)}</h2>
    <p><a href="/${lang}/guides/${escapeHtml(relatedGuide.slug)}/">${escapeHtml(relatedGuide.title)}</a></p>
  </section>`;
}

function toolCard(tool, lang) {
  return `<a class="tool-card" data-category="${categoryOf(tool.slug)}" href="/${lang}/${tool.slug}/">
  <span class="tool-card-title">${escapeHtml(tool.h1)}</span>
  <span class="tool-card-desc">${escapeHtml(tool.description)}</span>
</a>`;
}

function renderRelatedTools(tools, ui, lang) {
  if (!tools.length) return '';
  return `<section class="related-tools">
    <h2>${escapeHtml(ui.relatedToolsHeading)}</h2>
    <div class="grid">${tools.map((tool) => toolCard(tool, lang)).join('\n')}</div>
  </section>`;
}

// GitHub Pages serves /404.html for any missing path, in either language.
function renderNotFound({ ui, tools }) {
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>${escapeHtml(ui.ko.notFoundTitle)} | ${escapeHtml(ui.ko.siteName)}</title>
${fontTags()}
  <link rel="stylesheet" href="${asset('/assets/style.css')}">${iconTags()}
</head>
<body>
${header({ lang: 'ko', ui: ui.ko, alternates: { ko: '/ko/', en: '/en/' } })}
<main class="not-found">
  <h1>${escapeHtml(ui.ko.notFoundTitle)}</h1>
  <p class="lead">${escapeHtml(ui.ko.notFoundLead)}</p>
  <p lang="en">${escapeHtml(ui.en.notFoundLead)} <a href="/en/">${escapeHtml(ui.en.notFoundHomeLink)}</a></p>
  <p><a class="cta" href="/ko/">${escapeHtml(ui.ko.notFoundHomeLink)}</a></p>
  <section class="category" data-category="calc">
    <h2>${escapeHtml(ui.ko.notFoundPopular)}</h2>
    <div class="grid">${tools.map((tool) => toolCard(tool, 'ko')).join('\n')}</div>
  </section>
</main>
${footer(ui.ko, 'ko')}
</body>
</html>
`;
}

function renderToolPage({ lang, tool, ui, alternates, origin, relatedGuide, relatedTools = [] }) {
  const form = TOOL_FORMS[tool.slug];
  const labels = tool.labels;
  const inputs = form.inputs.map((field) => renderField(field, labels)).join('\n');
  // Example values show a result on first load; the hint says they are only examples.
  const exampleHint = form.inputs.some((field) => field.example)
    ? `<p class="example-hint">${escapeHtml(ui.exampleHint)}</p>`
    : '';
  const outputs = form.outputs.map((output) => renderOutput(output, labels, ui)).join('\n');
  return `${head({
    lang,
    title: tool.title,
    description: tool.description,
    origin,
    alternates: alternates.paths,
    siteName: ui.siteName,
    jsonLd: graph([
      {
        '@type': 'WebApplication',
        name: tool.h1,
        description: tool.description,
        url: origin + alternates.paths[lang],
        inLanguage: lang,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Any',
        browserRequirements: 'Requires JavaScript',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'KRW' },
        dateModified: tool.updated,
        publisher: { '@id': `${origin}/#organization` },
      },
      organizationNode(origin),
      breadcrumbNode([
        [ui.home, `${origin}/${lang}/`],
        [tool.h1, origin + alternates.paths[lang]],
      ]),
    ]),
  })}
<body>
${header({ lang, ui, alternates: alternates.paths })}
<main class="tool" data-category="${categoryOf(tool.slug)}">
  <h1>${escapeHtml(tool.h1)}</h1>
  <form class="tool-form" id="tool-form">
    ${exampleHint}
    ${inputs}
    ${form.presets ? renderPresets(form.presets, labels) : ''}
    <div class="results" aria-live="polite">
      ${outputs}
    </div>
    ${renderErrors(form.errorKeys, labels)}
  </form>
  ${CALC_SLUGS.includes(tool.slug) ? renderShare(ui) : ''}
  ${form.schedule ? renderSchedule(labels) : ''}
  ${form.milestones ? renderMilestones(labels) : ''}
  ${form.salaryTable ? renderSalaryTable(tool, lang) : ''}
  ${(form.refTables || []).map((name) => renderRefTable(name, tool, lang)).join('\n  ')}
  <div class="intro">${paragraphs(tool.intro)}</div>
  <section class="howto">
    <h2>${escapeHtml(ui.howToHeading)}</h2>
    <ol>${tool.howTo.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ol>
  </section>
  ${renderExplanation(tool, ui)}
  ${renderRelatedGuide(relatedGuide, ui, lang)}
  ${renderRelatedTools(relatedTools, ui, lang)}
  <section class="faq">
    <h2>${escapeHtml(ui.faqHeading)}</h2>
    ${tool.faq.map((item) => `<details><summary>${escapeHtml(item.q)}</summary><p>${escapeHtml(item.a)}</p></details>`).join('\n')}
  </section>
  ${renderReferences(tool, ui)}
</main>
${footer(ui, lang)}
<script type="application/json" id="tool-labels">${JSON.stringify(labels).replace(/</g, '\\u003c')}</script>
<script src="${asset(`/assets/logic/${LOGIC_FILE[tool.slug]}.js`)}"></script>
<script src="${asset('/assets/common.js')}"></script>
<script src="${asset(`/assets/tools/${tool.slug}.js`)}" defer></script>
</body>
</html>
`;
}

function guideCards(guides, lang) {
  return guides
    .map(
      (guide) => `<a class="tool-card" href="/${lang}/guides/${escapeHtml(guide.slug)}/">
  <span class="tool-card-title">${escapeHtml(guide.h1)}</span>
  <span class="tool-card-desc">${escapeHtml(guide.description)}</span>
</a>`
    )
    .join('\n');
}

function renderHome({ lang, ui, tools, alternates, origin, guides = [] }) {
  const bySlug = new Map(tools.map((tool) => [tool.slug, tool]));
  const card = (slug) => {
    const tool = bySlug.get(slug);
    return `<a class="tool-card" href="${alternates.paths[lang]}${slug}/">
  <span class="tool-card-title">${escapeHtml(tool.h1)}</span>
  <span class="tool-card-desc">${escapeHtml(tool.description)}</span>
</a>`;
  };
  const section = (heading, slugs, category) => `<section class="category category-${category}" data-category="${category}">
  <h2>${escapeHtml(heading)}</h2>
  <div class="grid">${slugs.map(card).join('\n')}</div>
</section>`;
  const title = ui.homeTitle;
  const description = ui.homeDescription;
  const jsonLd = graph([
    {
      '@type': 'WebSite',
      '@id': `${origin}/#website`,
      name: BRAND.name,
      alternateName: BRAND.alternateName,
      url: `${origin}/`,
      inLanguage: ['ko', 'en'],
      publisher: { '@id': `${origin}/#organization` },
    },
    organizationNode(origin),
  ]);
  return `${head({ lang, title, description, origin, alternates: alternates.paths, siteName: ui.siteName, jsonLd })}
<body>
${header({ lang, ui, alternates: alternates.paths })}
<main class="home">
  <h1>${escapeHtml(ui.heroTitle)}</h1>
  <p class="lead">${escapeHtml(ui.heroLead)}</p>
  ${section(ui.categoryCalc, CALC_SLUGS, 'calc')}
  ${section(ui.categoryText, TEXT_SLUGS, 'text')}
  ${
    guides.length
      ? `<section class="category category-guide" data-category="guide">
  <h2>${escapeHtml(ui.guidesHeading)}</h2>
  <div class="grid">${guideCards(guides, lang)}</div>
</section>`
      : ''
  }
</main>
${footer(ui, lang)}
</body>
</html>
`;
}

function dataTable(headers, rows) {
  const head = headers.map((h) => `<th scope="col">${escapeHtml(h)}</th>`).join('');
  const body = rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('\n');
  return `<div class="table-wrap"><table class="data-table">
      <thead><tr>${head}</tr></thead>
      <tbody>${body}</tbody>
    </table></div>`;
}

// Take-home pay for common salaries, computed at build time with the calculator's own logic.
const SALARY_TABLE_STEPS = [24, 30, 35, 40, 45, 50, 55, 60, 70, 80, 90, 100].map((n) => n * 1000000);

function renderSalaryTable(tool, lang) {
  const labels = tool.labels;
  const fmt = (n) => new Intl.NumberFormat(lang === 'ko' ? 'ko-KR' : 'en-US').format(n);
  const rows = SALARY_TABLE_STEPS.map((annualSalary) => {
    const r = takeHomePay({ annualSalary, monthlyNonTaxable: 200000, family: 1, children: 0 });
    return [fmt(annualSalary), fmt(r.monthlyNet), fmt(r.totalDeduction), fmt(r.annualNet)];
  });
  return `<section class="salary-table">
    <h2>${escapeHtml(labels.salaryTableHeading)}</h2>
    <p>${escapeHtml(labels.salaryTableNote)}</p>
    ${dataTable([labels.colSalary, labels.colMonthlyNet, labels.colDeduction, labels.colAnnualNet], rows)}
  </section>`;
}

// Reference tables computed at build time with the calculators' own logic,
// so the numbers always match what the calculator shows.
function numberFormat(lang) {
  return new Intl.NumberFormat(lang === 'ko' ? 'ko-KR' : 'en-US');
}

function dateWithWeekday(ymd, lang) {
  const weekday = new Intl.DateTimeFormat(lang, { weekday: 'short', timeZone: 'UTC' }).format(new Date(`${ymd}T00:00:00Z`));
  return `${ymd} (${weekday})`;
}

const REF_TABLES = {
  'discharge-table': (labels, lang) => ({
    prefix: 'dischargeTable',
    headers: [labels.colEnlist, labels.colArmyMarine, labels.colNavy, labels.colAirSocial],
    rows: Array.from({ length: 12 }, (_, i) => {
      const enlist = `2026-${String(i + 1).padStart(2, '0')}-15`;
      return [enlist, ...[18, 20, 21].map((months) => dateWithWeekday(dischargeDate({ enlist, months }), lang))];
    }),
  }),
  'age-table': (labels) => ({
    prefix: 'ageTable',
    headers: [labels.colBirthYear, labels.colManAge2026, labels.colManAge2027, labels.colYearAge2026],
    rows: Array.from({ length: 56 }, (_, i) => 2015 - i).map((year) => {
      const range = (on) => {
        const before = koreanAge({ birth: `${year}-12-31`, on: `${on}-01-01` }).manAge;
        const after = koreanAge({ birth: `${year}-01-01`, on: `${on}-12-31` }).manAge;
        return `${before} / ${after}`;
      };
      return [String(year), range(2026), range(2027), String(koreanAge({ birth: `${year}-01-01`, on: '2026-06-30' }).yearAge)];
    }),
  }),
  'benefit-days-table': (labels) => ({
    prefix: 'daysTable',
    headers: [labels.colInsuredPeriod, labels.colUnder50, labels.colOver50],
    rows: ['under1', '1to3', '3to5', '5to10', '10plus'].map((band) => {
      const days = (olderOrDisabled) =>
        String(unemploymentBenefit({ lastWorkDay: '2026-11-30', wagesLast3Months: 9000000, dailyHours: 8, olderOrDisabled, insuredBand: band }).benefitDays);
      const key = { under1: 'bandUnder1', '1to3': 'band1to3', '3to5': 'band3to5', '5to10': 'band5to10', '10plus': 'band10plus' }[band];
      return [labels[key], days(false), days(true)];
    }),
  }),
  'benefit-floor-table': (labels, lang) => ({
    prefix: 'floorTable',
    headers: [labels.colDailyHours, labels.col2026, labels.col2027],
    rows: [8, 7, 6, 5, 4].map((dailyHours) => {
      const floor = (lastWorkDay) =>
        numberFormat(lang).format(unemploymentBenefit({ lastWorkDay, wagesLast3Months: 1, dailyHours, olderOrDisabled: false, insuredBand: 'under1' }).dailyBenefit);
      return [labels.hoursFormat.replace('{n}', dailyHours), floor('2026-11-30'), floor('2027-06-30')];
    }),
  }),
  'severance-table': (labels, lang) => {
    const years = [1, 3, 5, 10];
    return {
      prefix: 'severanceTable',
      headers: [labels.colMonthlyWage, ...years.map((n) => labels.yearsFormat.replace('{n}', n))],
      rows: [2500000, 3000000, 3500000, 4000000, 5000000].map((monthly) => [
        numberFormat(lang).format(monthly),
        ...years.map((n) => {
          const period = severancePeriod({ hireDate: `${2027 - n}-01-01`, leaveDate: '2027-01-01' });
          const pay = severancePay({ wagesLast3Months: monthly * 3, daysLast3Months: period.daysLast3Months, daysWorked: period.daysWorked });
          return numberFormat(lang).format(pay.severance);
        }),
      ]),
    };
  },
};

function renderRefTable(name, tool, lang) {
  const labels = tool.labels;
  const table = REF_TABLES[name](labels, lang);
  return `<section class="ref-table" id="${name}">
    <h2>${escapeHtml(labels[`${table.prefix}Heading`])}</h2>
    <p>${escapeHtml(labels[`${table.prefix}Note`])}</p>
    ${dataTable(table.headers, table.rows)}
  </section>`;
}

function renderTextSections(sections) {
  return sections
    .map((section) => {
      const paragraphsHtml = section.paragraphs.map((text) => `<p>${escapeHtml(text)}</p>`).join('\n    ');
      const items = section.items
        ? `<ul>${section.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
        : '';
      return `<section>
    <h2>${escapeHtml(section.heading)}</h2>
    ${paragraphsHtml}
    ${items}
    ${section.table ? dataTable(section.table.headers, section.table.rows) : ''}
  </section>`;
    })
    .join('\n  ');
}

function renderGuidePage({ lang, guide, ui, alternates, origin }) {
  const cta = `<p><a class="cta" href="/${lang}/${escapeHtml(guide.toolSlug)}/">${escapeHtml(guide.ctaText)}</a></p>`;
  return `${head({
    lang,
    title: guide.title,
    description: guide.description,
    origin,
    alternates: alternates.paths,
    siteName: ui.siteName,
    type: 'article',
    rss: rssLink(lang, ui, origin),
    jsonLd: graph([
      {
        '@type': 'Article',
        headline: guide.h1,
        description: guide.description,
        url: origin + alternates.paths[lang],
        mainEntityOfPage: origin + alternates.paths[lang],
        inLanguage: lang,
        datePublished: guide.published,
        dateModified: guide.updated,
        image: `${origin}/assets/og-${lang}.png`,
        author: { '@id': `${origin}/#organization` },
        publisher: organizationNode(origin),
        citation: (guide.sources || []).map((source) => source.url),
      },
      breadcrumbNode([
        [ui.home, `${origin}/${lang}/`],
        [ui.guidesHeading, `${origin}/${lang}/guides/`],
        [guide.h1, origin + alternates.paths[lang]],
      ]),
    ]),
  })}
<body>
${header({ lang, ui, alternates: alternates.paths, fallback: `/${lang === 'ko' ? 'en' : 'ko'}/guides/` })}
<main class="guide" data-category="${categoryOf(guide.toolSlug)}">
  <h1>${escapeHtml(guide.h1)}</h1>
  <p class="byline">${escapeHtml(ui.byline.replace('{published}', guide.published).replace('{updated}', guide.updated))}</p>
  <div class="intro">${paragraphs(guide.intro)}</div>
  ${cta}
  ${renderTextSections(guide.sections)}
  ${cta}
  ${renderReferences(guide, ui)}
</main>
${footer(ui, lang)}
</body>
</html>
`;
}

function renderGuidesHub({ lang, hub, guides, ui, alternates, origin }) {
  return `${head({
    lang,
    title: hub.title,
    description: hub.description,
    origin,
    alternates: alternates.paths,
    siteName: ui.siteName,
    rss: rssLink(lang, ui, origin),
    jsonLd: graph([
      breadcrumbNode([
        [ui.home, `${origin}/${lang}/`],
        [ui.guidesHeading, `${origin}/${lang}/guides/`],
      ]),
    ]),
  })}
<body>
${header({ lang, ui, alternates: alternates.paths })}
<main class="guide-hub">
  <h1>${escapeHtml(hub.h1)}</h1>
  <p class="lead">${escapeHtml(hub.intro)}</p>
  <section class="category category-guide" data-category="guide">
    <div class="grid">${guideCards(guides, lang)}</div>
  </section>
</main>
${footer(ui, lang)}
</body>
</html>
`;
}

function renderAboutPage({ lang, page, ui, alternates, origin, schemaType = 'AboutPage' }) {
  const contact = siteConfig.contactEmail
    ? `<section class="contact">
    <h2>${escapeHtml(page.contact.heading)}</h2>
    <p>${escapeHtml(page.contact.text)}</p>
    <p><a href="mailto:${escapeHtml(siteConfig.contactEmail)}">${escapeHtml(siteConfig.contactEmail)}</a></p>
  </section>`
    : '';
  return `${head({
    lang,
    title: page.title,
    description: page.description,
    origin,
    alternates: alternates.paths,
    siteName: ui.siteName,
    jsonLd: graph([
      {
        '@type': schemaType,
        name: page.h1,
        url: origin + alternates.paths[lang],
        inLanguage: lang,
        dateModified: page.updated,
        about: organizationNode(origin),
      },
      breadcrumbNode([
        [ui.home, `${origin}/${lang}/`],
        [page.h1, origin + alternates.paths[lang]],
      ]),
    ]),
  })}
<body>
${header({ lang, ui, alternates: alternates.paths })}
<main class="about">
  <h1>${escapeHtml(page.h1)}</h1>
  <div class="intro">${paragraphs(page.intro)}</div>
  ${renderTextSections(page.sections)}
  ${contact}
  <p class="updated">${escapeHtml(ui.updatedLabel)}: ${escapeHtml(page.updated)}</p>
</main>
${footer(ui, lang)}
</body>
</html>
`;
}

function renderPrivacyPage({ lang, page, ui, alternates, origin }) {
  const sections = page.sections
    .map((section) => {
      const paragraphsHtml = section.paragraphs.map((text) => `<p>${escapeHtml(text)}</p>`).join('\n    ');
      const items = section.items
        ? `<ul>${section.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
        : '';
      const links = section.links
        ? `<ul>${section.links
            .map(
              (link) =>
                `<li><a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.title)}</a></li>`
            )
            .join('')}</ul>`
        : '';
      return `<section>
    <h2>${escapeHtml(section.heading)}</h2>
    ${paragraphsHtml}
    ${items}
    ${links}
  </section>`;
    })
    .join('\n  ');
  const contact = siteConfig.contactEmail
    ? `<section class="contact">
    <h2>${escapeHtml(page.contact.heading)}</h2>
    <p>${escapeHtml(page.contact.text)}</p>
    <p><a href="mailto:${escapeHtml(siteConfig.contactEmail)}">${escapeHtml(siteConfig.contactEmail)}</a></p>
  </section>`
    : '';
  return `${head({
    lang,
    title: page.title,
    description: page.description,
    origin,
    alternates: alternates.paths,
    siteName: ui.siteName,
  })}
<body>
${header({ lang, ui, alternates: alternates.paths })}
<main class="privacy">
  <h1>${escapeHtml(page.h1)}</h1>
  ${sections}
  ${contact}
  ${page.effective ? `<p class="updated">${escapeHtml(ui.effectiveLabel)}: ${escapeHtml(page.effective)}</p>` : ''}
  <p class="updated">${escapeHtml(ui.updatedLabel)}: ${escapeHtml(page.updated)}</p>
</main>
${footer(ui, lang)}
</body>
</html>
`;
}

module.exports = {
  escapeHtml,
  setAssetVersion,
  setSiteConfig,
  renderToolPage,
  renderHome,
  renderAboutPage,
  renderGuidePage,
  renderGuidesHub,
  renderPrivacyPage,
  renderNotFound,
};
