// earth676.js v1.0.0 - 2026-03-27

const RANK_ORDER = [
  'Shift 0','Feeble','Poor','Typical','Good',
  'Excellent','Remarkable','Incredible','Amazing','Monstrous','Unearthly'
];

const RANK_COLORS = {
  'Shift 0':   '#aaa',
  'Feeble':    '#b0b0b0',
  'Poor':      '#8a8a8a',
  'Typical':   '#5a8a3a',
  'Good':      '#3a8a3a',
  'Excellent': '#2a6ab0',
  'Remarkable':'#1a4a9a',
  'Incredible':'#7a2ab0',
  'Amazing':   '#c07000',
  'Monstrous': '#c00020',
  'Unearthly': '#8b0000'
};

let DATA = {};
let calCurrentYear = 1976;
let calCurrentMonth = 11; // 0-based: 10=Nov

async function loadData() {
  const [chars, team, timeline, npcs] = await Promise.all([
    fetch('data/characters.json').then(r => r.json()),
    fetch('data/team.json').then(r => r.json()),
    fetch('data/timeline.json').then(r => r.json()),
    fetch('data/npcs.json').then(r => r.json())
  ]);
  DATA = { chars, team, timeline, npcs };
}

// ── NAVIGATION ──────────────────────────────────────────────────────────────

function setupNav() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('view-' + btn.dataset.view).classList.add('active');
    });
  });
}

// ── CHARACTERS ──────────────────────────────────────────────────────────────

function rankColor(rankName) {
  return RANK_COLORS[rankName] || '#333';
}

function renderCharCard(ch) {
  const stats = ch.stats;
  const statKeys = ['F','A','S','E','R','I','P'];
  const statLabels = { F:'Fgt', A:'Agi', S:'Str', E:'End', R:'Rsn', I:'Int', P:'Psy' };

  const statCells = statKeys.map(k => {
    const s = stats[k];
    const color = rankColor(s.rank);
    return `<div class="stat-cell">
      <span class="stat-label">${statLabels[k]}</span>
      <span class="stat-value" style="color:${color}">${s.value}</span>
      <span class="stat-rank" style="color:${color}">${s.rank}</span>
    </div>`;
  }).join('');

  const note = ch.note ? `<div class="char-note">${ch.note}</div>` : '';
  const joined = ch.joined ? `<div class="char-note">Joined: ${ch.joined}</div>` : '';

  return `<div class="char-card char-status-${ch.status}" data-id="${ch.id}">
    <div class="char-card-header">
      <div class="char-hero-name">${ch.hero}</div>
      <div class="char-real-name">${ch.real}${ch.age ? `, age ${ch.age}` : ''}</div>
      <span class="char-origin-badge">${ch.origin}</span>
    </div>
    <div class="char-card-body">
      <div class="stat-grid">${statCells}</div>
      <div class="char-bars">
        <div class="char-bar-item">
          <span class="char-bar-label">Health</span>
          <span class="char-bar-val">${ch.health}</span>
        </div>
        <div class="char-bar-item">
          <span class="char-bar-label">Karma</span>
          <span class="char-bar-val">${ch.karma}</span>
        </div>
      </div>
      ${joined}${note}
    </div>
  </div>`;
}

function buildCharacters(filter = 'active') {
  const grid = document.getElementById('character-grid');
  const filtered = filter === 'all'
    ? DATA.chars
    : DATA.chars.filter(c => c.status === filter);
  grid.innerHTML = filtered.map(renderCharCard).join('');

  grid.querySelectorAll('.char-card').forEach(card => {
    card.addEventListener('click', () => {
      const ch = DATA.chars.find(c => c.id === card.dataset.id);
      openCharModal(ch);
    });
  });
}

function setupCharFilter() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      buildCharacters(btn.dataset.filter);
    });
  });
}

// ── CHARACTER MODAL ──────────────────────────────────────────────────────────

function openCharModal(ch) {
  const modal = document.getElementById('char-modal');
  const content = document.getElementById('char-modal-content');
  const statKeys = ['F','A','S','E','R','I','P'];
  const statLabels = { F:'Fighting', A:'Agility', S:'Strength', E:'Endurance', R:'Reason', I:'Intuition', P:'Psyche' };

  const statCells = statKeys.map(k => {
    const s = ch.stats[k];
    const color = rankColor(s.rank);
    return `<div class="modal-stat-cell">
      <span class="modal-stat-label">${statLabels[k]}</span>
      <span class="modal-stat-rank" style="color:${color}">${s.rank}</span>
      <span class="modal-stat-value" style="color:${color}">${s.value}</span>
    </div>`;
  }).join('');

  const powers = ch.powers.map(p => `
    <li class="modal-power-item">
      <span class="modal-power-name">${p.name}</span>
      ${p.rank !== '—' ? `<span class="modal-power-rank"> — ${p.rank} ${p.value !== null ? p.value : ''}</span>` : ''}
    </li>`).join('');

  const talents = ch.talents.map(t => `<span class="talent-chip">${t}</span>`).join('');

  const joined = ch.joined ? `<p style="font-size:0.85em;color:#888;font-style:italic;margin-top:8px;">Joined: ${ch.joined}</p>` : '';
  const note = ch.note ? `<p style="font-size:0.85em;color:#888;font-style:italic;">${ch.note}</p>` : '';

  content.innerHTML = `
    <div class="modal-char-header">
      <div class="modal-hero-name">${ch.hero}</div>
      <div class="modal-real-name">${ch.real}${ch.age ? ` &mdash; Age ${ch.age}` : ''} &mdash; ${ch.origin}</div>
      ${joined}
    </div>
    <div class="modal-body">
      <div class="modal-hpkarma">
        <div class="hpkarma-block">
          <span class="hpkarma-label">Health</span>
          <span class="hpkarma-value">${ch.health}</span>
        </div>
        <div class="hpkarma-block">
          <span class="hpkarma-label">Karma</span>
          <span class="hpkarma-value">${ch.karma}</span>
        </div>
      </div>
      <div class="modal-stat-grid">${statCells}</div>
      <div class="modal-section-title">Powers</div>
      <ul class="modal-power-list">${powers}</ul>
      <div class="modal-section-title">Talents</div>
      <div class="modal-talent-list">${talents}</div>
      ${note}
    </div>`;

  modal.classList.add('open');
}

function setupModal() {
  const modal = document.getElementById('char-modal');
  document.querySelector('.modal-close').addEventListener('click', () => modal.classList.remove('open'));
  modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('open'); });
}

// ── TEAM ────────────────────────────────────────────────────────────────────

function threatBar(level, max = 5) {
  const pips = Array.from({length: max}, (_, i) =>
    `<div class="threat-pip${i < level ? ' filled' : ''}"></div>`).join('');
  return `<div class="threat-bar">${pips}</div>`;
}

function statusBadge(s) {
  const cls = s === 'active' ? 'status-active' : s === 'arrested' ? 'status-arrested' : 'status-unknown';
  return `<span class="${cls}">${s.charAt(0).toUpperCase() + s.slice(1)}</span>`;
}

function buildTeam() {
  const t = DATA.team;
  const rooms = t.hq.rooms.map(r => `
    <div class="hq-room">
      <div class="hq-room-name">${r.id}. ${r.name}</div>
      ${r.rank ? `<div class="hq-room-rank">${r.rank}</div>` : ''}
      <div class="hq-room-notes">${r.notes}</div>
    </div>`).join('');

  const missions = t.missions.map(m => `
    <tr>
      <td>${m.world_date_display || m.date}</td>
      <td>${m.title}</td>
      <td>${statusBadge(m.status)}</td>
      <td>${m.summary}</td>
    </tr>`).join('');

  const allies = t.allies.map(a => `
    <tr>
      <td>${a.name}</td>
      <td>${a.type}</td>
      <td>${statusBadge(a.status)}</td>
      <td>${a.notes}</td>
    </tr>`).join('');

  const enemies = t.enemies.map(e => `
    <tr>
      <td>${e.name}</td>
      <td>${e.affiliation}</td>
      <td>${threatBar(e.threat)}</td>
      <td>${statusBadge(e.status)}</td>
      <td>${e.notes}</td>
    </tr>`).join('');

  document.getElementById('team-content').innerHTML = `
    <div class="team-header">
      <div class="team-name">${t.name} <span class="team-status-badge">${t.status}</span></div>
      <div class="team-meta">Founded: ${t.founded} &nbsp;&bull;&nbsp; HQ: ${t.hq.name}, ${t.hq.location}</div>
    </div>

    <div class="team-section">
      <div class="team-section-title">History</div>
      <div class="team-section-body"><p>${t.history}</p></div>
    </div>

    <div class="team-section">
      <div class="team-section-title">Headquarters — ${t.hq.name}</div>
      <div class="team-section-body">
        <p style="margin-bottom:12px;font-size:0.9em;">${t.hq.description}</p>
        <div class="hq-grid">${rooms}</div>
      </div>
    </div>

    <div class="team-section">
      <div class="team-section-title">Mission Log</div>
      <div class="team-section-body">
        <table class="data-table">
          <thead><tr><th>Date</th><th>Mission</th><th>Status</th><th>Summary</th></tr></thead>
          <tbody>${missions}</tbody>
        </table>
      </div>
    </div>

    <div class="team-section">
      <div class="team-section-title">Allies &amp; Affiliations</div>
      <div class="team-section-body">
        <table class="data-table">
          <thead><tr><th>Name</th><th>Type</th><th>Status</th><th>Notes</th></tr></thead>
          <tbody>${allies}</tbody>
        </table>
      </div>
    </div>

    <div class="team-section">
      <div class="team-section-title">Threat Board</div>
      <div class="team-section-body">
        <table class="data-table">
          <thead><tr><th>Name</th><th>Affiliation</th><th>Threat</th><th>Status</th><th>Notes</th></tr></thead>
          <tbody>${enemies}</tbody>
        </table>
      </div>
    </div>`;
}

// ── SESSIONS ────────────────────────────────────────────────────────────────

function buildSessions() {
  const entries = [...DATA.timeline].sort((a, b) => b.world_date.localeCompare(a.world_date));
  const list = document.getElementById('sessions-list');

  list.innerHTML = entries.map(e => {
    const sections = e.sections
      ? e.sections.map(s => `
          <div class="timeline-section">
            <div class="timeline-section-heading">${s.heading}</div>
            <p>${s.text}</p>
          </div>`).join('')
      : `<p>${e.body}</p>`;

    const participants = e.participants
      ? e.participants.map(id => {
          const ch = DATA.chars.find(c => c.id === id);
          return ch ? `<span class="talent-chip">${ch.hero}</span>` : '';
        }).join('')
      : '';

    return `<div class="session-card">
      <div class="session-header">
        <div class="session-title">${e.title}</div>
        <div class="session-dates">
          <div>${e.world_date_display}</div>
          ${e.session_date ? `<div style="font-size:0.85em;opacity:0.7;">Played: ${e.session_date}</div>` : ''}
        </div>
      </div>
      <div class="session-body">
        <p class="timeline-summary">${e.summary}</p>
        ${sections}
        ${participants ? `<div style="margin-top:12px;"><span style="font-size:0.78em;font-weight:bold;color:#888;text-transform:uppercase;letter-spacing:1px;">Participants:</span><div style="margin-top:4px;display:flex;flex-wrap:wrap;gap:4px;">${participants}</div></div>` : ''}
      </div>
    </div>`;
  }).join('');

  list.querySelectorAll('.session-header').forEach(h => {
    h.addEventListener('click', () => {
      h.nextElementSibling.classList.toggle('open');
    });
  });
}

// ── TIMELINE + CALENDAR ──────────────────────────────────────────────────────

function eventsByDate() {
  const map = {};
  DATA.timeline.forEach(e => {
    map[e.world_date] = map[e.world_date] || [];
    map[e.world_date].push(e);
  });
  return map;
}

function buildCalendar(year, month) {
  const eventMap = eventsByDate();
  const monthNames = ['January','February','March','April','May','June',
                      'July','August','September','October','November','December'];
  const dayHeaders = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    .map(d => `<div class="cal-day-header">${d}</div>`).join('');

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();

  let cells = '';
  for (let i = 0; i < firstDay; i++) {
    cells += `<div class="cal-day other-month">${prevDays - firstDay + 1 + i}</div>`;
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const hasEvent = eventMap[dateStr];
    const dot = hasEvent ? '<div class="cal-event-dot"></div>' : '';
    cells += `<div class="cal-day${hasEvent ? ' has-event' : ''}" data-date="${dateStr}">${d}${dot}</div>`;
  }
  const remaining = 42 - firstDay - daysInMonth;
  for (let i = 1; i <= remaining; i++) {
    cells += `<div class="cal-day other-month">${i}</div>`;
  }

  const cal = document.getElementById('timeline-calendar');
  cal.innerHTML = `
    <div class="cal-nav">
      <button id="cal-prev">&#9664; Prev</button>
      <div class="cal-month-label">${monthNames[month]} ${year}</div>
      <button id="cal-next">Next &#9654;</button>
    </div>
    <div class="cal-grid">
      ${dayHeaders}
      ${cells}
    </div>`;

  cal.querySelectorAll('.cal-day.has-event').forEach(cell => {
    cell.addEventListener('click', () => {
      cal.querySelectorAll('.cal-day').forEach(c => c.classList.remove('selected'));
      cell.classList.add('selected');
      highlightTimelineEntry(cell.dataset.date);
    });
  });

  document.getElementById('cal-prev').addEventListener('click', () => {
    calCurrentMonth--;
    if (calCurrentMonth < 0) { calCurrentMonth = 11; calCurrentYear--; }
    buildCalendar(calCurrentYear, calCurrentMonth);
  });

  document.getElementById('cal-next').addEventListener('click', () => {
    calCurrentMonth++;
    if (calCurrentMonth > 11) { calCurrentMonth = 0; calCurrentYear++; }
    buildCalendar(calCurrentYear, calCurrentMonth);
  });
}

function highlightTimelineEntry(dateStr) {
  document.querySelectorAll('.timeline-card').forEach(c => c.classList.remove('highlighted'));
  const target = document.querySelector(`.timeline-card[data-date="${dateStr}"]`);
  if (target) {
    target.classList.add('highlighted');
    target.querySelector('.timeline-card-body').classList.add('open');
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function buildTimeline() {
  const entries = [...DATA.timeline].sort((a, b) => a.world_date.localeCompare(b.world_date));
  const list = document.getElementById('timeline-list');

  list.innerHTML = entries.map(e => {
    const sections = e.sections
      ? e.sections.map(s => `
          <div class="timeline-section">
            <div class="timeline-section-heading">${s.heading}</div>
            <p>${s.text}</p>
          </div>`).join('')
      : `<p>${e.body}</p>`;

    const typeBadge = `<span class="timeline-type-badge badge-${e.type}">${e.type}</span>`;

    return `<div class="timeline-entry">
      <div class="timeline-spine">
        <div class="spine-dot"></div>
        <div class="spine-line"></div>
      </div>
      <div class="timeline-card" data-date="${e.world_date}">
        <div class="timeline-card-header">
          <div class="timeline-title">${e.title} ${typeBadge}</div>
          <div class="timeline-date">${e.world_date_display}</div>
        </div>
        <div class="timeline-card-body">
          <p class="timeline-summary">${e.summary}</p>
          ${sections}
        </div>
      </div>
    </div>`;
  }).join('');

  list.querySelectorAll('.timeline-card-header').forEach(h => {
    h.addEventListener('click', () => {
      h.nextElementSibling.classList.toggle('open');
    });
  });

  // Set calendar to first event month
  if (entries.length) {
    const first = new Date(entries[0].world_date);
    calCurrentYear = first.getFullYear();
    calCurrentMonth = first.getMonth();
  }
  buildCalendar(calCurrentYear, calCurrentMonth);
}

// ── NPCS ────────────────────────────────────────────────────────────────────

function buildNPCs(filter = 'all') {
  const filtered = filter === 'all' ? DATA.npcs : DATA.npcs.filter(n => n.type === filter);

  const rows = filtered.map(n => `
    <tr>
      <td><strong>${n.name}</strong></td>
      <td>${n.type.charAt(0).toUpperCase() + n.type.slice(1)}</td>
      <td>${n.affiliation || '—'}</td>
      ${n.threat !== undefined ? `<td>${threatBar(n.threat)}</td>` : '<td>—</td>'}
      <td>${statusBadge(n.status)}</td>
      <td>${n.notes}</td>
    </tr>`).join('');

  document.getElementById('npc-content').innerHTML = `
    <table class="data-table">
      <thead><tr><th>Name</th><th>Type</th><th>Affiliation</th><th>Threat</th><th>Status</th><th>Notes</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;

  document.querySelectorAll('[data-npc-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-npc-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      buildNPCs(btn.dataset.npcFilter);
    });
  });
}

// ── INIT ────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  setupNav();
  setupModal();
  setupCharFilter();
  buildCharacters('active');
  buildTeam();
  buildSessions();
  buildTimeline();
  buildNPCs();
});
