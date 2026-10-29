const sourceDefinitions = [
  { name: 'LinkedIn', key: 'linkedin', initial: 'in', color: '#eaf1fb', ink: '#376ca7', monthlySpend: 4900 },
  { name: 'Employee referral', key: 'referral', initial: '↗', color: '#f1edfb', ink: '#7862b8', monthlySpend: 1800 },
  { name: 'Company careers page', key: 'careers', initial: 'N', color: '#eaf5ef', ink: '#388365', monthlySpend: 750 },
  { name: 'Indeed', key: 'indeed', initial: 'i', color: '#eaf2fc', ink: '#4270bd', monthlySpend: 1350 },
  { name: 'Recruitment agency', key: 'agency', initial: 'A', color: '#fff1e8', ink: '#bc7747', monthlySpend: 7200 },
  { name: 'Community & events', key: 'community', initial: '✳', color: '#fceef1', ink: '#bd6376', monthlySpend: 950 },
];

const candidateSeeds = [
  ['Olivia Chen', 'Product Designer', 'LinkedIn', 'Interview', 5, 3],
  ['Noah Williams', 'Backend Engineer', 'Employee referral', 'Hired', 5, 6],
  ['Amara Okafor', 'Product Manager', 'Company careers page', 'Screening', 4, 8],
  ['Ethan Patel', 'Data Analyst', 'Indeed', 'Applied', 3, 10],
  ['Sofia Martinez', 'Frontend Engineer', 'Employee referral', 'Offer', 5, 13],
  ['Liam O’Connor', 'Marketing Lead', 'LinkedIn', 'Screening', 4, 16],
  ['Priya Sharma', 'Backend Engineer', 'Recruitment agency', 'Interview', 4, 19],
  ['Lucas Brown', 'UX Researcher', 'Community & events', 'Applied', 4, 22],
  ['Zara Ahmed', 'Product Designer', 'LinkedIn', 'Hired', 5, 25],
  ['Mia Thompson', 'People Partner', 'Indeed', 'Interview', 3, 28],
  ['Kai Nakamura', 'Data Analyst', 'Employee referral', 'Screening', 5, 31],
  ['Isabella Rossi', 'Frontend Engineer', 'Company careers page', 'Applied', 4, 35],
  ['Aarav Gupta', 'Backend Engineer', 'LinkedIn', 'Offer', 5, 39],
  ['Grace Kim', 'Product Manager', 'Community & events', 'Screening', 4, 43],
  ['Mateo Silva', 'Sales Executive', 'Indeed', 'Hired', 4, 47],
  ['Chloe Davis', 'Product Designer', 'Recruitment agency', 'Applied', 3, 51],
  ['Leo Fischer', 'Backend Engineer', 'Employee referral', 'Interview', 5, 55],
  ['Aisha Bello', 'Marketing Lead', 'LinkedIn', 'Applied', 4, 59],
  ['Daniel Kim', 'Data Analyst', 'Company careers page', 'Hired', 5, 64],
  ['Elena Petrova', 'UX Researcher', 'Indeed', 'Screening', 3, 68],
  ['Theo Martin', 'Frontend Engineer', 'Recruitment agency', 'Interview', 4, 73],
  ['Nina Park', 'Product Manager', 'Employee referral', 'Applied', 5, 78],
  ['Jayden Lee', 'Sales Executive', 'Community & events', 'Offer', 4, 84],
  ['Freya Wilson', 'People Partner', 'LinkedIn', 'Hired', 5, 89],
  ['Samira Hassan', 'Data Analyst', 'Indeed', 'Applied', 4, 96],
  ['Ben Carter', 'Backend Engineer', 'Employee referral', 'Hired', 5, 108],
  ['Yuki Tanaka', 'Product Designer', 'Company careers page', 'Interview', 5, 121],
  ['Victor Hugo', 'Marketing Lead', 'Recruitment agency', 'Hired', 4, 139],
  ['Anika Rao', 'Frontend Engineer', 'LinkedIn', 'Screening', 4, 158],
  ['Max Schneider', 'Product Manager', 'Indeed', 'Hired', 4, 183],
  ['Layla Johnson', 'UX Researcher', 'Community & events', 'Interview', 5, 211],
  ['Omar Farouk', 'Backend Engineer', 'Employee referral', 'Hired', 5, 246],
  ['Ella Murphy', 'People Partner', 'LinkedIn', 'Applied', 4, 278],
  ['Arjun Mehta', 'Data Analyst', 'Company careers page', 'Hired', 5, 315],
  ['Ruby Scott', 'Sales Executive', 'Recruitment agency', 'Interview', 4, 348],
  ['Hugo Laurent', 'Product Designer', 'Indeed', 'Hired', 4, 392],
  ['Maya Brooks', 'Marketing Lead', 'Employee referral', 'Hired', 5, 428],
  ['Finn Eriksson', 'Backend Engineer', 'Community & events', 'Applied', 4, 465],
  ['Leila Haddad', 'Product Manager', 'LinkedIn', 'Hired', 5, 511],
  ['Oscar Reed', 'Frontend Engineer', 'Recruitment agency', 'Applied', 3, 568],
  ['Sana Iqbal', 'Data Analyst', 'Indeed', 'Hired', 4, 625],
  ['Emilia Costa', 'UX Researcher', 'Employee referral', 'Hired', 5, 694],
  ['Caleb Young', 'Sales Executive', 'Community & events', 'Applied', 4, 770],
  ['Nora Berg', 'Product Designer', 'LinkedIn', 'Hired', 5, 843],
  ['Ravi Desai', 'Backend Engineer', 'Company careers page', 'Hired', 5, 928],
  ['Talia Green', 'Marketing Lead', 'Indeed', 'Hired', 4, 1018],
];

const candidates = candidateSeeds.map(([name, role, source, stage, quality, daysAgo], index) => {
  const daysToHire = stage === 'Hired' ? Math.min(18 + ((index * 7) % 25), Math.max(1, daysAgo)) : null;
  return {
    id: `seed-${index}`,
    name,
    role,
    source,
    stage,
    quality,
    appliedAt: daysAgo,
    createdAt: new Date(Date.now() - daysAgo * 86400000),
    daysToHire,
  };
});

const rangeSelect = document.querySelector('#dateRange');
const chartElement = document.querySelector('#trendChart');
const toastElement = document.querySelector('#toast');
const candidateDialog = document.querySelector('#candidateDialog');
const candidateForm = document.querySelector('#candidateForm');
const dateInput = candidateForm.elements.date;
let toastTimer;
let showingYearChart = false;
const dayInMs = 86400000;

const formatCurrency = (value) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
}).format(value);

function formatLocalDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function showToast(message) {
  toastElement.textContent = message;
  toastElement.classList.add('visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toastElement.classList.remove('visible'), 2800);
}

function loadSavedCandidates() {
  try {
    const saved = window.localStorage.getItem('talentwise.candidates');
    if (!saved) return [];
    const records = JSON.parse(saved);
    if (!Array.isArray(records)) throw new TypeError('Saved candidate data is not a list.');
    const validSources = new Set(sourceDefinitions.map((source) => source.name));
    const validStages = new Set(['Applied', 'Screening', 'Interview', 'Offer', 'Hired']);
    const loaded = [];
    let skipped = 0;
    records.forEach((record) => {
      if (!record || typeof record.name !== 'string' || typeof record.role !== 'string'
        || !validSources.has(record.source) || !validStages.has(record.stage)
        || !Number.isInteger(record.quality) || record.quality < 1 || record.quality > 5
        || typeof record.createdAt !== 'string'
        || (record.stage === 'Hired' && (!Number.isInteger(record.daysToHire) || record.daysToHire < 0))) {
        skipped += 1;
        return;
      }
      const createdAt = new Date(record.createdAt);
      if (!Number.isFinite(createdAt.getTime()) || createdAt.getTime() > Date.now()) {
        skipped += 1;
        return;
      }
      loaded.push({
        id: typeof record.id === 'string' ? record.id : `saved-${loaded.length}`,
        name: record.name,
        role: record.role,
        source: record.source,
        stage: record.stage,
        quality: record.quality,
        appliedAt: Math.floor((Date.now() - createdAt.getTime()) / 86400000),
        createdAt,
        daysToHire: record.stage === 'Hired' ? record.daysToHire : null,
      });
    });
    if (skipped) showToast(`${skipped} saved candidate record${skipped === 1 ? ' was' : 's were'} invalid and not loaded.`);
    return loaded;
  } catch (error) {
    showToast(`Saved candidates could not be loaded: ${error.message}`);
    return [];
  }
}

function saveAddedCandidates() {
  const saved = candidates.filter((candidate) => !candidate.id.startsWith('seed-')).map((candidate) => ({
    id: candidate.id,
    name: candidate.name,
    role: candidate.role,
    source: candidate.source,
    stage: candidate.stage,
    quality: candidate.quality,
    createdAt: candidate.createdAt.toISOString(),
    daysToHire: candidate.daysToHire,
  }));
  try {
    window.localStorage.setItem('talentwise.candidates', JSON.stringify(saved));
    return true;
  } catch (error) {
    showToast(`Candidate added for this session, but could not be saved: ${error.message}`);
    return false;
  }
}

candidates.push(...loadSavedCandidates());

function selectedCandidates() {
  const days = rangeSelect.value === 'all' ? Infinity : Number(rangeSelect.value);
  return candidates.filter((candidate) => candidate.appliedAt <= days);
}

function sourceStats(applicants) {
  return sourceDefinitions.map((source) => {
    const sourceCandidates = applicants.filter((candidate) => candidate.source === source.name);
    const hires = sourceCandidates.filter((candidate) => candidate.stage === 'Hired');
    const quality = sourceCandidates.length
      ? sourceCandidates.reduce((total, candidate) => total + candidate.quality, 0) / sourceCandidates.length
      : 0;
    const costFactor = rangeSelect.value === 'all'
      ? Math.max(1, Math.ceil(Math.max(0, ...applicants.map((candidate) => candidate.appliedAt)) / 30))
      : Number(rangeSelect.value) / 30;
    const spend = source.monthlySpend * costFactor;
    return {
      ...source,
      applicants: sourceCandidates.length,
      hires: hires.length,
      hireRate: sourceCandidates.length ? hires.length / sourceCandidates.length * 100 : 0,
      quality,
      costPerHire: hires.length ? spend / hires.length : 0,
      spend,
    };
  });
}

function renderMetrics(applicants, stats) {
  const hires = applicants.filter((candidate) => candidate.stage === 'Hired');
  const qualityHires = hires.length
    ? hires.reduce((total, candidate) => total + candidate.quality, 0) / hires.length
    : 0;
  const spend = stats.reduce((total, source) => total + source.spend, 0);
  const timeToHire = hires.length
    ? Math.round(hires.reduce((total, candidate) => total + candidate.daysToHire, 0) / hires.length)
    : 0;
  const periodDays = rangeSelect.value === 'all' ? Infinity : Number(rangeSelect.value);
  const previousApplicants = Number.isFinite(periodDays)
    ? candidates.filter((candidate) => candidate.appliedAt > periodDays && candidate.appliedAt <= periodDays * 2)
    : null;
  const previousHires = previousApplicants?.filter((candidate) => candidate.stage === 'Hired') ?? null;
  const previousTimeToHire = previousHires?.length
    ? Math.round(previousHires.reduce((total, candidate) => total + candidate.daysToHire, 0) / previousHires.length)
    : null;
  const previousSpend = Number.isFinite(periodDays)
    ? sourceDefinitions.reduce((total, source) => total + source.monthlySpend * periodDays / 30, 0)
    : null;

  const setTrend = (id, current, previous, lowerIsBetter = false, unit = '%') => {
    const element = document.querySelector(`#${id}`);
    if (previous === null) {
      element.textContent = '—';
      element.classList.remove('negative');
      return;
    }
    if (previous === 0) {
      element.textContent = current > 0 ? '↗ New' : '→ 0%';
      element.classList.toggle('negative', current > 0 && lowerIsBetter);
      return;
    }
    const difference = current - previous;
    const change = Math.round(Math.abs(difference / previous) * 100);
    element.textContent = `${difference > 0 ? '↗' : difference < 0 ? '↘' : '→'} ${unit === 'days' ? Math.abs(difference) : change}${unit === 'days' ? ' days' : '%'}`;
    element.classList.toggle('negative', difference !== 0 && (lowerIsBetter ? difference > 0 : difference < 0));
  };

  document.querySelector('#applicantMetric').textContent = applicants.length.toLocaleString();
  document.querySelector('#hireMetric').textContent = hires.length.toLocaleString();
  document.querySelector('#timeMetric').textContent = timeToHire.toLocaleString();
  document.querySelector('#costMetric').textContent = hires.length ? formatCurrency(spend / hires.length) : '—';
  document.querySelector('#applicantComparison').textContent = previousApplicants ? 'vs. previous period' : 'all-time total';
  document.querySelector('#hireComparison').textContent = previousApplicants ? 'vs. previous period' : 'all-time total';
  document.querySelector('#timeComparison').textContent = previousApplicants ? 'vs. previous period' : 'all-time total';
  document.querySelector('#costComparison').textContent = previousApplicants ? 'vs. previous period' : 'all-time total';
  setTrend('applicantTrend', applicants.length, previousApplicants?.length ?? null);
  setTrend('hireTrend', hires.length, previousHires?.length ?? null);
  setTrend('timeTrend', timeToHire, previousTimeToHire, true, 'days');
  setTrend('costTrend', hires.length ? spend / hires.length : 0,
    previousHires?.length ? previousSpend / previousHires.length : null, true);
  document.querySelector('#funnelRate').textContent = applicants.length ? `${Math.round(hires.length / applicants.length * 100)}%` : '0%';
  return { hires, qualityHires };
}

function renderFunnel(applicants) {
  const stages = [
    { name: 'Applied', count: applicants.length },
    { name: 'Screening', count: applicants.filter((candidate) => ['Screening', 'Interview', 'Offer', 'Hired'].includes(candidate.stage)).length },
    { name: 'Interview', count: applicants.filter((candidate) => ['Interview', 'Offer', 'Hired'].includes(candidate.stage)).length },
    { name: 'Hired', count: applicants.filter((candidate) => candidate.stage === 'Hired').length },
  ];
  const maximum = Math.max(1, stages[0].count);
  document.querySelector('#funnelList').innerHTML = stages.map((stage) => `
    <div class="funnel-item">
      <span>${stage.name}</span>
      <div class="funnel-track" role="meter" aria-label="${stage.name}" aria-valuenow="${stage.count}" aria-valuemin="0" aria-valuemax="${maximum}">
        <div class="funnel-fill" style="width:${Math.max(stage.count ? 4 : 0, stage.count / maximum * 100)}%"></div>
      </div>
      <span class="funnel-count">${stage.count}</span>
    </div>`).join('');
}

function renderChannelTable(stats) {
  const sortedStats = [...stats].sort((a, b) => b.hires - a.hires || b.quality - a.quality);
  const maxHires = Math.max(1, ...stats.map((source) => source.hires));
  document.querySelector('#channelRows').innerHTML = sortedStats.map((source) => `
    <tr>
      <td><span class="source-name"><span class="source-logo ${source.key}">${escapeHtml(source.initial)}</span>${escapeHtml(source.name)}</span></td>
      <td class="cell-strong">${source.applicants}</td>
      <td class="cell-strong">${source.hires}</td>
      <td class="hire-rate">${source.applicants ? `${source.hireRate.toFixed(1)}%` : '—'}</td>
      <td><span class="quality-cell"><span class="quality-stars" aria-label="${source.quality ? source.quality.toFixed(1) : 'No'} out of 5">${source.quality ? '★★★★★' : '☆☆☆☆☆'}</span><span class="quality-number">${source.quality ? source.quality.toFixed(1) : '—'}</span></span></td>
      <td class="cost-muted">${source.hires ? formatCurrency(source.costPerHire) : '—'}</td>
      <td><div class="performance-track" role="meter" aria-label="${escapeHtml(source.name)} hires" aria-valuenow="${source.hires}" aria-valuemin="0" aria-valuemax="${maxHires}"><div class="performance-fill" style="width:${source.hires / maxHires * 100}%"></div></div></td>
    </tr>`).join('');
  document.querySelector('#channelSummary').textContent = `Showing ${stats.length} recruiting channels`;
}

function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function avatarColors(name) {
  const colors = [
    ['#eaf1fb', '#5073a6'], ['#f3edf9', '#8765aa'], ['#eaf5ef', '#398066'],
    ['#fff0e8', '#b96f48'], ['#fceef1', '#b85f75'], ['#edf2fb', '#5974ae'],
  ];
  const hash = [...name].reduce((total, char) => total + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

function renderCandidateTable(applicants) {
  const search = document.querySelector('#candidateSearch').value.trim().toLowerCase();
  const matches = applicants.filter((candidate) => [candidate.name, candidate.role, candidate.source, candidate.stage]
    .some((value) => value.toLowerCase().includes(search)))
    .sort((a, b) => a.appliedAt - b.appliedAt)
    .slice(0, 6);
  const rows = matches.map((candidate) => {
    const [background, foreground] = avatarColors(candidate.name);
    const stageClass = candidate.stage.toLowerCase();
    return `<tr>
      <td><span class="candidate-name"><span class="candidate-avatar" style="background:${background};color:${foreground}">${escapeHtml(initials(candidate.name))}</span>${escapeHtml(candidate.name)}</span></td>
      <td>${escapeHtml(candidate.role)}</td>
      <td>${escapeHtml(candidate.source)}</td>
      <td><span class="stage-pill stage-${stageClass}">${escapeHtml(candidate.stage)}</span></td>
      <td class="quality-score">${candidate.quality.toFixed(1)} <span class="quality-stars">★</span></td>
      <td>${formatRelativeDate(candidate.appliedAt)}</td>
    </tr>`;
  });
  document.querySelector('#candidateRows').innerHTML = rows.length
    ? rows.join('')
    : `<tr><td class="empty-cell" colspan="6">${search ? 'No candidates match your search.' : 'No candidates in this period yet.'}</td></tr>`;
  const totalMatches = applicants.filter((candidate) => [candidate.name, candidate.role, candidate.source, candidate.stage]
    .some((value) => value.toLowerCase().includes(search))).length;
  document.querySelector('#candidateSummary').textContent = `Showing ${matches.length ? 1 : 0}–${matches.length} of ${totalMatches} candidates`;
}

function formatRelativeDate(daysAgo) {
  if (daysAgo === 0) return 'Today';
  if (daysAgo === 1) return 'Yesterday';
  if (daysAgo < 30) return `${daysAgo} days ago`;
  if (daysAgo < 365) return `${Math.floor(daysAgo / 30)} mo ago`;
  return `${Math.floor(daysAgo / 365)} yr ago`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}

function renderChart(monthCount) {
  const now = new Date();
  const monthLabels = [];
  for (let offset = monthCount - 1; offset >= 0; offset -= 1) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    monthLabels.push({
      month: monthDate.getMonth(),
      year: monthDate.getFullYear(),
      label: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(monthDate),
    });
  }
  const applicants = selectedCandidates();
  const monthly = monthLabels.map(({ month, year, label }) => {
    const inMonth = applicants.filter((candidate) => {
      const date = candidate.createdAt;
      return date.getMonth() === month && date.getFullYear() === year;
    });
    return {
      label,
      applications: inMonth.length,
      hires: inMonth.filter((candidate) => candidate.stage === 'Hired').length,
    };
  });
  const width = 620;
  const height = 190;
  const left = 32;
  const right = 12;
  const top = 14;
  const bottom = 25;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const maxValue = Math.max(5, Math.ceil(Math.max(...monthly.map((month) => month.applications), 0) / 5) * 5);
  const x = (index) => left + index * plotWidth / Math.max(1, monthly.length - 1);
  const y = (value) => top + plotHeight - value / maxValue * plotHeight;
  const line = (key) => monthly.map((month, index) => `${index ? 'L' : 'M'} ${x(index)} ${y(month[key])}`).join(' ');
  const area = `${line('applications')} L ${x(monthly.length - 1)} ${top + plotHeight} L ${x(0)} ${top + plotHeight} Z`;
  const gridLines = [0, 1, 2, 3].map((step) => {
    const value = Math.round(maxValue * (3 - step) / 3);
    const lineY = top + plotHeight * step / 3;
    return `<line class="chart-grid-line" x1="${left}" y1="${lineY}" x2="${width - right}" y2="${lineY}"/><text class="chart-axis-label" x="${left - 10}" y="${lineY + 3}" text-anchor="end">${value}</text>`;
  }).join('');
  const labels = monthly.map((month, index) => `<text class="chart-axis-label" x="${x(index)}" y="${height - 5}" text-anchor="middle">${month.label}</text>`).join('');
  const points = (key, className) => monthly.map((month, index) => `<circle class="${className}" cx="${x(index)}" cy="${y(month[key])}" r="3.3"><title>${month.label}: ${month[key]} ${key === 'hires' ? 'hires' : 'applications'}</title></circle>`).join('');
  chartElement.innerHTML = `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#8177dc" stop-opacity=".14"/><stop offset="100%" stop-color="#8177dc" stop-opacity="0"/></linearGradient></defs>
    ${gridLines}<path class="chart-area" d="${area}"/><path class="chart-line-apps" d="${line('applications')}"/><path class="chart-line-hires" d="${line('hires')}"/>
    ${points('applications', 'chart-point-apps')}${points('hires', 'chart-point-hires')}${labels}</svg>`;
}

function renderInsight(stats, hires, qualityHires) {
  const qualityLeader = [...stats].sort((a, b) => b.quality - a.quality || b.applicants - a.applicants)[0];
  const conversionLeader = [...stats].filter((source) => source.applicants)
    .sort((a, b) => b.hireRate - a.hireRate || b.hires - a.hires)[0];
  if (!hires.length) {
    document.querySelector('#insightTitle').textContent = 'Build your first source benchmark';
    document.querySelector('#insightCopy').textContent = 'Once candidates move through your pipeline, you’ll see which channels deliver the strongest hires for your team.';
    document.querySelector('#topSource').textContent = 'Not enough data';
    document.querySelector('#topConversion').textContent = 'Not enough data';
    return;
  }
  document.querySelector('#insightTitle').textContent = `${qualityLeader.name} is bringing in your strongest candidates.`;
  document.querySelector('#insightCopy').textContent = `${qualityLeader.name} candidates average ${qualityLeader.quality.toFixed(1)} out of 5 for quality${qualityHires >= 4 ? ', making it a strong source for your next role.' : ' based on current feedback.'}`;
  document.querySelector('#topSource').textContent = `${qualityLeader.name} · ${qualityLeader.quality.toFixed(1)} / 5`;
  document.querySelector('#topConversion').textContent = conversionLeader
    ? `${conversionLeader.name} · ${conversionLeader.hireRate.toFixed(1)}%`
    : 'Not enough data';
}

function render() {
  const applicants = selectedCandidates();
  const stats = sourceStats(applicants);
  const { hires, qualityHires } = renderMetrics(applicants, stats);
  renderFunnel(applicants);
  renderChannelTable(stats);
  renderCandidateTable(applicants);
  renderChart(showingYearChart ? 12 : 6);
  renderInsight(stats, hires, qualityHires);
}

function exportCsv() {
  const applicants = selectedCandidates();
  const header = ['Name', 'Role', 'Source', 'Stage', 'Quality score', 'Applied'];
  const rows = applicants.map((candidate) => [
    candidate.name,
    candidate.role,
    candidate.source,
    candidate.stage,
    candidate.quality,
    formatLocalDateInput(candidate.createdAt),
  ]);
  const csv = [header, ...rows].map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `talentwise-candidates-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast(`Exported ${applicants.length} candidates to CSV.`);
}

function openCandidateDialog() {
  const sourceSelect = candidateForm.elements.source;
  sourceSelect.innerHTML = sourceDefinitions.map((source) => `<option>${escapeHtml(source.name)}</option>`).join('');
  dateInput.value = formatLocalDateInput(new Date());
  candidateForm.elements.hiredOn.value = '';
  document.querySelector('#hiredOnField').hidden = true;
  candidateForm.elements.hiredOn.required = false;
  candidateDialog.showModal();
  candidateForm.elements.name.focus();
}

function addCandidate(event) {
  event.preventDefault();
  if (!candidateForm.reportValidity()) return;
  const formData = new FormData(candidateForm);
  const name = String(formData.get('name')).trim();
  const role = String(formData.get('role')).trim();
  const source = String(formData.get('source'));
  const stage = String(formData.get('stage'));
  const quality = Number(formData.get('quality'));
  const appliedDate = new Date(`${formData.get('date')}T00:00:00`);
  const hiredDate = stage === 'Hired' && formData.get('hiredOn')
    ? new Date(`${formData.get('hiredOn')}T00:00:00`)
    : null;
  const daysToHire = hiredDate ? Math.floor((hiredDate - appliedDate) / dayInMs) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysAgo = Math.floor((today - appliedDate) / dayInMs);
  if (!name || !role || !Number.isFinite(daysAgo) || daysAgo < 0 || !Number.isInteger(quality) || quality < 1 || quality > 5
    || (stage === 'Hired' && (!hiredDate || !Number.isFinite(daysToHire) || daysToHire < 0 || hiredDate > today))) {
    showToast('Check the candidate details, application date, and hire date.');
    return;
  }
  candidates.push({
    id: `added-${Date.now()}`,
    name,
    role,
    source,
    stage,
    quality,
    appliedAt: daysAgo,
    createdAt: appliedDate,
    daysToHire,
  });
  const saved = saveAddedCandidates();
  candidateForm.reset();
  candidateDialog.close();
  render();
  if (saved) showToast(`${name} added to the candidate pipeline.`);
}

rangeSelect.addEventListener('change', () => {
  showingYearChart = false;
  document.querySelector('#chartPeriod').textContent = 'Last 6 months';
  render();
});
document.querySelector('#candidateSearch').addEventListener('input', () => renderCandidateTable(selectedCandidates()));
document.querySelector('#exportButton').addEventListener('click', exportCsv);
document.querySelector('#addCandidateButton').addEventListener('click', openCandidateDialog);
candidateForm.addEventListener('submit', addCandidate);
document.querySelector('#closeDialog').addEventListener('click', () => candidateDialog.close());
document.querySelector('#cancelDialog').addEventListener('click', () => candidateDialog.close());
candidateForm.elements.stage.addEventListener('change', (event) => {
  const isHired = event.currentTarget.value === 'Hired';
  document.querySelector('#hiredOnField').hidden = !isHired;
  candidateForm.elements.hiredOn.required = isHired;
  candidateForm.elements.hiredOn.value = isHired ? formatLocalDateInput(new Date()) : '';
});
document.querySelector('#chartPeriod').addEventListener('click', () => {
  showingYearChart = !showingYearChart;
  document.querySelector('#chartPeriod').innerHTML = showingYearChart
    ? 'Last 12 months <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg>'
    : 'Last 6 months <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg>';
  renderChart(showingYearChart ? 12 : 6);
});
document.querySelector('#funnelInfo').addEventListener('click', () => showToast('Funnel stages include all candidates who reached that stage in the selected period.'));
document.querySelector('#notificationButton').addEventListener('click', () => showToast('You’re all caught up — no new notifications.'));
document.querySelector('#helpButton').addEventListener('click', () => showToast('Tip: use the date filter to compare channel performance across periods.'));
document.querySelector('#profileButton').addEventListener('click', () => showToast('Signed in as Alex Morgan · People lead.'));
document.querySelectorAll('[data-jump]').forEach((button) => {
  button.addEventListener('click', () => document.querySelector(`#${button.dataset.jump}`).scrollIntoView({ behavior: 'smooth' }));
});
document.querySelectorAll('[data-nav]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const target = link.dataset.nav;
    if (target === 'settings') {
      event.preventDefault();
      showToast('Workspace settings are coming soon.');
      return;
    }
    document.querySelectorAll('[data-nav]').forEach((item) => item.classList.toggle('active', item === link));
    document.querySelector('#currentPageLabel').textContent = link.querySelector('span').textContent;
    if (target === 'overview') window.scrollTo({ top: 0, behavior: 'smooth' });
    if (window.matchMedia('(max-width: 700px)').matches) {
      document.querySelector('#sidebar').classList.remove('sidebar-open');
      document.querySelector('#menuButton').setAttribute('aria-expanded', 'false');
    }
  });
});
document.querySelector('#menuButton').addEventListener('click', () => {
  const sidebar = document.querySelector('#sidebar');
  const isOpen = sidebar.classList.toggle('sidebar-open');
  document.querySelector('#menuButton').setAttribute('aria-expanded', String(isOpen));
});

render();
