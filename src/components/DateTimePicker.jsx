import { useState } from 'react';

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const DAYS   = ['L','M','M','J','V','S','D'];

export default function DateTimePicker({ value, onChange, onClose }) {
  const today   = new Date();
  const initial = value ? new Date(value) : today;

  const [viewYear,  setViewYear]  = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  const [selDate,   setSelDate]   = useState(value ? new Date(value) : null);
  const [timeStr,   setTimeStr]   = useState(() => {
    if (!value) return '';
    const d = new Date(value);
    const h = d.getHours(), m = d.getMinutes();
    return (h || m) ? `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}` : '';
  });

  // Build the 6×7 grid (Monday start)
  const daysInMonth  = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekday = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // Mon=0
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

  const clickCell = c => {
    if (c.type === 'prev') prevMonth();
    if (c.type === 'next') nextMonth();
    const y = c.type === 'prev' ? (viewMonth === 0 ? viewYear-1 : viewYear) : (c.type === 'next' ? (viewMonth === 11 ? viewYear+1 : viewYear) : viewYear);
    const m = c.type === 'prev' ? (viewMonth === 0 ? 11 : viewMonth-1) : (c.type === 'next' ? (viewMonth === 11 ? 0 : viewMonth+1) : viewMonth);
    setSelDate(new Date(y, m, c.day));
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
      {/* Month navigation */}
      <div className="dp-nav">
        <button className="dp-nav-btn" onClick={prevMonth}>‹</button>
        <span className="dp-month">{MONTHS[viewMonth]} {viewYear}</span>
        <button className="dp-nav-btn" onClick={nextMonth}>›</button>
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

      {/* Time picker — only when a date is selected */}
      {selDate && (
        <div className="dp-time">
          <span className="dp-time-icon">🕐</span>
          <input
            type="time"
            className="dp-time-input"
            value={timeStr}
            onChange={e => setTimeStr(e.target.value)}
            placeholder="--:--"
          />
          {timeStr && (
            <button className="dp-time-clear" onClick={() => setTimeStr('')}>✕</button>
          )}
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
