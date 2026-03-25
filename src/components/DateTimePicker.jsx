import { useState } from 'react';

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const DAYS   = ['L','M','M','J','V','S','D'];

// Quick-assign icons
function IconToday() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
    </svg>
  );
}
function IconTomorrow() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
      <path d="M16 4l2 2-2 2" strokeWidth="1.8"/>
    </svg>
  );
}
function IconWeek() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="3"/>
      <path d="M3 9h18"/>
      <text x="12" y="18" textAnchor="middle" fill="currentColor" stroke="none" fontSize="7.5" fontWeight="700" fontFamily="inherit">+7</text>
    </svg>
  );
}
function IconMonth() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

function addDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function DateTimePicker({ value, onChange, onClose }) {
  const today   = new Date();
  const initial = value ? new Date(value) : today;

  const [tab, setTab] = useState('date'); // 'date' | 'duration'
  const [viewYear,  setViewYear]  = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  const [selDate,   setSelDate]   = useState(value ? new Date(value) : null);
  const [timeStr,   setTimeStr]   = useState(() => {
    if (!value) return '';
    const d = new Date(value);
    const h = d.getHours(), m = d.getMinutes();
    return (h || m) ? `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}` : '';
  });
  const [showTime, setShowTime] = useState(!!timeStr);
  const [showReminder, setShowReminder] = useState(false);
  const [showRecurrence, setShowRecurrence] = useState(false);

  // Build the 6×7 grid (Monday start)
  const daysInMonth  = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekday = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
  const prevDays     = new Date(viewYear, viewMonth, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstWeekday; i++)
    cells.push({ day: prevDays - firstWeekday + i + 1, type: 'prev' });
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ day: d, type: 'cur' });
  while (cells.length < 42)
    cells.push({ day: cells.length - firstWeekday - daysInMonth + 1, type: 'next' });

  const isToday = c =>
    c.type === 'cur' && c.day === today.getDate() &&
    viewMonth === today.getMonth() && viewYear === today.getFullYear();

  const isSelected = c => {
    if (!selDate || c.type !== 'cur') return false;
    return c.day === selDate.getDate() &&
           viewMonth === selDate.getMonth() &&
           viewYear  === selDate.getFullYear();
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };
  const goToday = () => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); };

  const clickCell = c => {
    if (c.type === 'prev') prevMonth();
    if (c.type === 'next') nextMonth();
    const y = c.type === 'prev' ? (viewMonth === 0 ? viewYear-1 : viewYear) : (c.type === 'next' ? (viewMonth === 11 ? viewYear+1 : viewYear) : viewYear);
    const m = c.type === 'prev' ? (viewMonth === 0 ? 11 : viewMonth-1) : (c.type === 'next' ? (viewMonth === 11 ? 0 : viewMonth+1) : viewMonth);
    setSelDate(new Date(y, m, c.day));
  };

  const quickAssign = (date) => {
    setSelDate(date);
    setViewYear(date.getFullYear());
    setViewMonth(date.getMonth());
  };

  const handleOK = () => {
    if (!selDate) { onChange(null); onClose(); return; }
    const d = new Date(selDate);
    if (timeStr) {
      const [h, m] = timeStr.split(':').map(Number);
      d.setHours(h, m, 0, 0);
    } else {
      d.setHours(0, 0, 0, 0);
    }
    onChange(d.toISOString());
    onClose();
  };

  return (
    <div className="dp" onMouseDown={e => e.stopPropagation()}>
      {/* Tabs */}
      <div className="dp-tabs">
        <button className={`dp-tab${tab === 'date' ? ' active' : ''}`} onClick={() => setTab('date')}>Date</button>
        <button className={`dp-tab${tab === 'duration' ? ' active' : ''}`} onClick={() => setTab('duration')}>Durée</button>
      </div>

      {tab === 'date' && (
        <>
          {/* Quick assign shortcuts */}
          <div className="dp-shortcuts">
            <button className="dp-shortcut" title="Aujourd'hui" onClick={() => quickAssign(addDays(0))}>
              <IconToday />
            </button>
            <button className="dp-shortcut" title="Demain" onClick={() => quickAssign(addDays(1))}>
              <IconTomorrow />
            </button>
            <button className="dp-shortcut" title="Dans une semaine" onClick={() => quickAssign(addDays(7))}>
              <IconWeek />
            </button>
            <button className="dp-shortcut" title="Dans un mois" onClick={() => quickAssign(addDays(30))}>
              <IconMonth />
            </button>
          </div>

          {/* Month navigation */}
          <div className="dp-nav">
            <span className="dp-month">{MONTHS[viewMonth].toLowerCase()} {viewYear}</span>
            <div className="dp-nav-btns">
              <button className="dp-nav-btn" onClick={prevMonth}>‹</button>
              <button className="dp-nav-btn dp-nav-dot" onClick={goToday}>○</button>
              <button className="dp-nav-btn" onClick={nextMonth}>›</button>
            </div>
          </div>

          {/* Day grid */}
          <div className="dp-grid">
            {DAYS.map((d,i) => <div key={i} className="dp-dn">{d}</div>)}
            {cells.map((c, i) => (
              <div
                key={i}
                onClick={() => clickCell(c)}
                className={[
                  'dp-cell',
                  c.type !== 'cur'  ? 'dp-other'    : '',
                  isToday(c)        ? 'dp-today'     : '',
                  isSelected(c)     ? 'dp-sel'       : '',
                ].filter(Boolean).join(' ')}
              >{c.day}</div>
            ))}
          </div>

          {/* Expandable sections */}
          <div className="dp-sections">
            {/* Horaire prévu */}
            <button className="dp-section-btn" onClick={() => setShowTime(v => !v)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
              </svg>
              <span>Horaire prévu</span>
              <span className="dp-section-chevron">{showTime ? '›' : '›'}</span>
            </button>
            {showTime && (
              <div className="dp-section-content">
                <input
                  type="time"
                  className="dp-time-input"
                  value={timeStr}
                  onChange={e => setTimeStr(e.target.value)}
                />
                {timeStr && (
                  <button className="dp-time-clear" onClick={() => setTimeStr('')}>✕</button>
                )}
              </div>
            )}

            {/* Rappel */}
            <button className="dp-section-btn" onClick={() => setShowReminder(v => !v)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span>Rappel</span>
              <span className="dp-section-chevron">›</span>
            </button>

            {/* Récurrence */}
            <button className="dp-section-btn" onClick={() => setShowRecurrence(v => !v)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
              </svg>
              <span>Récurrence</span>
              <span className="dp-section-chevron">›</span>
            </button>
          </div>
        </>
      )}

      {tab === 'duration' && (
        <div className="dp-duration-placeholder">
          <span className="dp-duration-text">Durée estimée</span>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 8 }}>Bientôt disponible</p>
        </div>
      )}

      {/* Actions */}
      <div className="dp-actions">
        <button className="dp-clear" onClick={() => { onChange(null); onClose(); }}>Effacer</button>
        <button className="btn-primary dp-ok" onClick={handleOK}>OK</button>
      </div>
    </div>
  );
}
