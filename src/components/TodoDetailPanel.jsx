import { useState, useRef, useEffect } from 'react';
import SearchableSelect from './SearchableSelect';
import DateTimePicker from './DateTimePicker';
import { playCompletionSound, playInProgressSound } from '../utils/sound';
import { genId } from '../utils/id';

// ── Date helpers ───────────────────────────────────────────────────────────────

function formatDueDateShort(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateStart  = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays   = Math.round((dateStart - todayStart) / 86400000);
  const dateFmt    = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

  if (diffDays === 0) return `Aujourd'hui, ${dateFmt}`;
  if (diffDays === 1) return `Demain, ${dateFmt}`;
  if (diffDays > 1)   return `${dateFmt} (dans ${diffDays} jours)`;
  return `${dateFmt} (en retard de ${Math.abs(diffDays)} jour${Math.abs(diffDays) > 1 ? 's' : ''})`;
}

function dueDateUrgency(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateStart  = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays   = Math.round((dateStart - todayStart) / 86400000);
  if (diffDays < 0)  return 'overdue';
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'tomorrow';
  return 'future';
}

// ── Auto-grow textarea ─────────────────────────────────────────────────────────

function AutoTextarea({ className, value, onChange, placeholder, minRows = 1 }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.style.height = 'auto';
    ref.current.style.height = ref.current.scrollHeight + 'px';
  }, [value]);
  return (
    <textarea
      ref={ref}
      className={className}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={minRows}
    />
  );
}

// ── Priority config ────────────────────────────────────────────────────────────

const PRIORITIES     = [null, 'high', 'medium', 'low'];
const PRIORITY_COLOR = { high: '#D52B25', medium: '#FAA80C', low: '#4772FB' };
const PRIORITY_LABEL = { high: 'Priorité élevée', medium: 'Priorité moyenne', low: 'Priorité faible' };

// Shared flag path (same shape for all priority levels)
const FLAG_PATH = 'M3.7035399526355683,3.231521962132568L3.707084536532568,3.1918340921325683Q3.731945305632568,2.9134738421325683,3.937491949632568,2.7079277021325683Q4.1714335096325685,2.4739867299795684,4.502276599632569,2.4739867299795684Q4.833119429632569,2.4739867299795684,5.067061229632568,2.707927642132568Q5.272607829632569,2.9134736021325685,5.297468629632569,3.191834272132568L5.311301129632568,3.3467112821325684L19.522284529632568,3.3467112821325684Q19.99092452963257,3.3467115121325683,20.219533529632567,3.7558236421325684Q20.447728529632567,4.164189342132568,20.203469529632567,4.562515942132569L20.20167452963257,4.565438742132568L17.65959252963257,9.111411142132567Q17.50839152963257,9.38180594213257,17.659598529632568,9.652194042132567L20.201714529632568,14.198111342132568L20.203496529632567,14.201018342132569Q20.446734529632568,14.597713342132568,20.21086052963257,15.00689334213257Q19.97450952963257,15.416891342132569,19.50392152963257,15.416894342132569L5.300994429632569,15.416894342132569L5.301003929632568,20.72725634213257Q5.3010041296325685,21.05810334213257,5.067061829632569,21.292045342132567Q4.833122729632568,21.525985342132568,4.502275819632568,21.525985342132568Q4.1714311796325685,21.52598734213257,3.9374911196325684,21.292045342132567Q3.7035492807625685,21.05810334213257,3.7035492211575685,20.72725634213257L3.7035492807625685,15.490892342132568L3.7035399526355683,3.272710982132568L3.7035399526355683,3.231521962132568Z';
// Inner cutout path for priority-0 (outline flag)
const FLAG_INNER = 'M18.08605752963257,4.944165442132569L5.3010025296325685,4.944165442132569L5.3010025296325685,4.9941654421325685L5.300994529632568,13.819438342132567L18.086083529632567,13.819438342132567L15.866020529632568,9.811073342132568Q15.628264529632569,9.381798242132568,15.866019529632569,8.952529442132569L18.08605752963257,4.944165442132569Z';

// ── SVG Icons ──────────────────────────────────────────────────────────────────

function IconCalendar() {
  return (
    <svg width="20" height="20" viewBox="2 2 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M3,8L3,16C3,18.761423999999998,5.2385762,21,8,21L16,21C18.761423999999998,21,21,18.761423999999998,21,16L21,8C21,5.2385762,18.761423999999998,3,16,3L8,3C5.2385762,3,3,5.2385762,3,8ZM5.5251262,18.474871999999998Q4.5,17.449745,4.5,16L4.5,8L19.5,8L19.5,16Q19.5,17.449742999999998,18.474871999999998,18.474871999999998Q17.449742999999998,19.5,16,19.5L8,19.5Q6.550254600000001,19.5,5.5251262,18.474871999999998ZM19.174026,6.5Q18.921929,5.9721839,18.474871999999998,5.5251262Q17.449745,4.5,16,4.5L8,4.5Q6.5502524,4.5,5.5251262,5.5251262Q5.0780674999999995,5.9721849,4.8259716,6.5L19.174026,6.5ZM7.583333,10.5L8.4166665,10.5L8.4166665,12.166666L7.583333,12.166666ZM11.583333,10.5L12.416666,10.5L12.416666,12.166666L11.583333,12.166666ZM15.583333,10.5L16.416666,10.5L16.416666,12.166666L15.583333,12.166666ZM7.583333,14.5L8.4166665,14.5L8.4166665,16.166666L7.583333,16.166666ZM11.583333,14.5L12.416666,14.5L12.416666,16.166666L11.583333,16.166666Z"/>
    </svg>
  );
}

function IconAssign() {
  return (
    <svg width="20" height="18" viewBox="1490 490 1150 1110" fill="none" stroke="currentColor" strokeWidth="73" strokeLinecap="butt" strokeLinejoin="miter">
      <path d="M2065.25 569.5C2210.23 569.5 2327.75 688.779 2327.75 835.917 2327.75 927.879 2281.84 1008.96 2212.02 1056.83L2191.6 1066.11C2382.67 1122.49 2541.1 1293.37 2561.77 1499.95 2562.62 1517.13 2565.04 1551.48 2562.04 1551.5L1568.47 1551.5C1566.33 1551.5 1568.35 1510.29 1568.74 1501.11 1589.41 1294.53 1744.4 1121.33 1935.47 1064.95L1918.49 1056.83C1848.67 1008.96 1802.76 927.879 1802.76 835.917 1802.76 688.779 1920.28 569.5 2065.25 569.5Z" fill="none"/>
      <path d="M1856.5 1278.83 2276.74 1278.83C2296.99 1278.83 2313.41 1295.25 2313.41 1315.5 2313.41 1335.75 2296.99 1352.17 2276.74 1352.17L1856.5 1352.17C1836.25 1352.17 1819.83 1335.75 1819.83 1315.5 1819.83 1295.25 1836.25 1278.83 1856.5 1278.83ZM2154.22 1159.57 2332.42 1315.5 2154.22 1471.43C2138.98 1484.76 2115.81 1483.22 2102.48 1467.98 2089.14 1452.74 2090.69 1429.57 2105.93 1416.24L2252.59 1287.91 2252.59 1343.09 2105.93 1214.76C2090.69 1201.43 2089.14 1178.26 2102.48 1163.02 2115.81 1147.78 2138.98 1146.24 2154.22 1159.57Z" fill="currentColor" stroke="none"/>
    </svg>
  );
}

function IconFlag({ priority }) {
  if (!priority) {
    // Priority-0: outline flag (grey, adapts to theme via currentColor)
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d={FLAG_PATH + FLAG_INNER}/>
      </svg>
    );
  }
  const fill = PRIORITY_COLOR[priority];
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path fillRule="evenodd" d={FLAG_PATH} fill={fill}/>
    </svg>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function TodoDetailPanel({ todo, state, dispatch, createOrg, createTalent }) {
  const [showDatePicker,  setShowDatePicker]  = useState(false);
  const [showStatusMenu,  setShowStatusMenu]  = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [subSelectedIds, setSubSelectedIds] = useState(new Set());
  const datePickerRef   = useRef(null);
  const statusMenuRef   = useRef(null);
  const priorityMenuRef = useRef(null);
  const subInputRefs    = useRef({});

  // Close date picker on outside click
  useEffect(() => {
    if (!showDatePicker) return;
    function handler(e) {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target)) setShowDatePicker(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showDatePicker]);

  // Close status menu on outside click
  useEffect(() => {
    if (!showStatusMenu) return;
    function handler(e) {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target)) setShowStatusMenu(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showStatusMenu]);

  // Close priority menu on outside click
  useEffect(() => {
    if (!showPriorityMenu) return;
    function handler(e) {
      if (priorityMenuRef.current && !priorityMenuRef.current.contains(e.target)) setShowPriorityMenu(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showPriorityMenu]);

  // ── Empty state ─────────────────────────────────────────────────────────────

  if (!todo) {
    return (
      <div className="detail-panel detail-panel-empty">
        <div className="detail-empty-icon">☑</div>
        <p className="detail-empty-text">Sélectionnez une tâche<br/>pour voir ses détails</p>
      </div>
    );
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const update = (updates) => dispatch({ type: 'UPDATE_TODO', id: todo.id, updates });

  const handleProjectChange = (projectId) => {
    const updates = { projectId };
    if (projectId) {
      const proj = state.projects.find(p => p.id === projectId);
      if (proj) { updates.organizationIds = proj.organizationId ? [proj.organizationId] : []; updates.talentIds = proj.talentId ? [proj.talentId] : []; }
    }
    update(updates);
  };

  const dueDateLabel  = formatDueDateShort(todo.dueDate);
  const dateUrgency   = dueDateUrgency(todo.dueDate);
  const overdue       = (dateUrgency === 'overdue' || dateUrgency === 'today') && todo.status !== 'done';

  const nextStatus  = todo.status === 'pending'     ? 'in-progress'
                    : todo.status === 'in-progress' ? 'done'
                    : 'pending';
  const statusTitle = todo.status === 'pending'     ? 'Marquer en cours'
                    : todo.status === 'in-progress' ? 'Marquer comme terminée'
                    : 'Réinitialiser';

  // Priority
  const pBorderColor = todo.priority ? PRIORITY_COLOR[todo.priority] : undefined;
  const cyclePriority = () => {
    const idx = PRIORITIES.indexOf(todo.priority ?? null);
    update({ priority: PRIORITIES[(idx + 1) % PRIORITIES.length] });
  };

  // Subtasks: todos immediately following this one with indent > 0
  const todoIdx  = state.todos.findIndex(t => t.id === todo.id);
  const subtasks = [];
  for (let i = todoIdx + 1; i < state.todos.length; i++) {
    if (state.todos[i].indent <= todo.indent) break; // stoppe sur un pair ou ancêtre
    subtasks.push(state.todos[i]);
  }

  const addSubtask = () => {
    const id = genId();
    dispatch({ type: 'ADD_TODO', id, text: '', indent: todo.indent + 1, insertAt: todoIdx + subtasks.length + 1 });
    setTimeout(() => { if (subInputRefs.current[id]) subInputRefs.current[id].focus(); }, 0);
  };

  // Insert subtask after a specific subtask
  const addSubtaskAfter = (afterId) => {
    const id = genId();
    const afterIdx = state.todos.findIndex(t => t.id === afterId);
    if (afterIdx === -1) return;
    dispatch({ type: 'ADD_TODO', id, text: '', indent: todo.indent + 1, insertAt: afterIdx + 1 });
    setTimeout(() => { if (subInputRefs.current[id]) subInputRefs.current[id].focus(); }, 0);
  };

  const moveSubtask = (subId, dir) => {
    const idx = subtasks.findIndex(s => s.id === subId);
    if (idx === -1) return;
    if (dir === 'up' && idx === 0) return;
    if (dir === 'down' && idx === subtasks.length - 1) return;
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    const globalA = state.todos.findIndex(t => t.id === subtasks[idx].id);
    const globalB = state.todos.findIndex(t => t.id === subtasks[swapIdx].id);
    if (globalA === -1 || globalB === -1) return;
    const newTodos = [...state.todos];
    [newTodos[globalA], newTodos[globalB]] = [newTodos[globalB], newTodos[globalA]];
    dispatch({ type: 'REORDER_TODOS', todos: newTodos });
    setTimeout(() => { if (subInputRefs.current[subId]) subInputRefs.current[subId].focus(); }, 0);
  };

  const handleSubKeyDown = (e, sub, subIdx) => {
    const isMeta = e.metaKey || e.ctrlKey;

    // Enter — create new subtask after this one (only if current has text)
    if (e.key === 'Enter') {
      e.preventDefault();
      if (sub.text.trim() !== '') addSubtaskAfter(sub.id);
      return;
    }
    // Backspace on empty — delete
    if (e.key === 'Backspace' && sub.text === '') {
      e.preventDefault();
      const prevSub = subtasks[subIdx - 1];
      dispatch({ type: 'DELETE_TODOS', ids: [sub.id] });
      if (prevSub) setTimeout(() => { if (subInputRefs.current[prevSub.id]) subInputRefs.current[prevSub.id].focus(); }, 0);
      return;
    }
    // Shift+Delete — delete selected or current
    if (e.key === 'Delete' && e.shiftKey) {
      e.preventDefault();
      const ids = subSelectedIds.size > 0 ? [...subSelectedIds] : [sub.id];
      dispatch({ type: 'DELETE_TODOS', ids });
      setSubSelectedIds(new Set());
      return;
    }
    // Arrow Up/Down — navigate between subtasks
    if (e.key === 'ArrowUp' && !isMeta) {
      if (subIdx > 0) {
        e.preventDefault();
        const prev = subtasks[subIdx - 1];
        if (subInputRefs.current[prev.id]) subInputRefs.current[prev.id].focus();
        if (e.shiftKey) setSubSelectedIds(prev => { const n = new Set(prev); n.add(sub.id); n.add(prev.id); return n; });
        else setSubSelectedIds(new Set());
      }
      return;
    }
    if (e.key === 'ArrowDown' && !isMeta) {
      if (subIdx < subtasks.length - 1) {
        e.preventDefault();
        const next = subtasks[subIdx + 1];
        if (subInputRefs.current[next.id]) subInputRefs.current[next.id].focus();
        if (e.shiftKey) setSubSelectedIds(prev => { const n = new Set(prev); n.add(sub.id); n.add(next.id); return n; });
        else setSubSelectedIds(new Set());
      }
      return;
    }
    // Cmd+Arrow Up/Down — move subtask
    if (e.key === 'ArrowUp' && isMeta) { e.preventDefault(); moveSubtask(sub.id, 'up'); return; }
    if (e.key === 'ArrowDown' && isMeta) { e.preventDefault(); moveSubtask(sub.id, 'down'); return; }
  };

  // Helper: compute fixed position for popup menus (align right edge to button right)
  function getPopupPos(ref) {
    if (!ref?.current) return {};
    const rect = ref.current.getBoundingClientRect();
    const menuWidth = 170;
    let left = rect.left;
    // If menu would overflow right edge, align to right side of button
    if (left + menuWidth > window.innerWidth) {
      left = rect.right - menuWidth;
    }
    return { top: rect.bottom + 4, left };
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="detail-panel">

      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <div className="detail-toolbar">

        {/* Left-side group — fixé au bord gauche */}
        <div className="detail-tb-left">

          {/* Status menu */}
          <div className="detail-popup-wrap" ref={statusMenuRef}>
            <div
              className="detail-check-wrap"
              onClick={() => setShowStatusMenu(v => !v)}
              title={statusTitle}
            >
              <span
                className={`detail-check${todo.status === 'done' ? ' detail-check-done' : todo.status === 'in-progress' ? ' detail-check-inprogress' : ''}`}
                style={todo.status === 'pending' && pBorderColor ? { borderColor: pBorderColor } : {}}
              >
                {todo.status === 'done' && (
                  <svg width="12" height="10" viewBox="0 0 12 10">
                    <path d="M1 5l3.5 3.5L11 1" stroke="currentColor" strokeWidth="2"
                      fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
                {todo.status === 'in-progress' && (
                  <svg width="12" height="4" viewBox="0 0 12 4">
                    <circle cx="2"  cy="2" r="1.5" fill="currentColor"/>
                    <circle cx="6"  cy="2" r="1.5" fill="currentColor"/>
                    <circle cx="10" cy="2" r="1.5" fill="currentColor"/>
                  </svg>
                )}
              </span>
            </div>
            {showStatusMenu && (
              <div className="detail-popup-menu" style={getPopupPos(statusMenuRef)}>
                {[
                  { status: 'pending',     label: 'À faire',   icon: (
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <rect x="1.5" y="1.5" width="13" height="13" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                  )},
                  { status: 'in-progress', label: 'En cours',  icon: (
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <rect x="1.5" y="1.5" width="13" height="13" rx="3" stroke="#f97316" strokeWidth="1.5" fill="#f97316"/>
                      <circle cx="5" cy="8" r="1.2" fill="#fff"/><circle cx="8" cy="8" r="1.2" fill="#fff"/><circle cx="11" cy="8" r="1.2" fill="#fff"/>
                    </svg>
                  )},
                  { status: 'done',        label: 'Terminée',  icon: (
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <rect x="1.5" y="1.5" width="13" height="13" rx="3" stroke="#22c55e" strokeWidth="1.5" fill="#22c55e"/>
                      <path d="M4.5 8.5l2.5 2.5L11.5 5.5" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )},
                ].map(opt => (
                  <button
                    key={opt.status}
                    className={`detail-popup-opt${todo.status === opt.status ? ' selected' : ''}`}
                    onClick={() => {
                      if (opt.status === 'in-progress') playInProgressSound();
                      else if (opt.status === 'done') playCompletionSound();
                      update({ status: opt.status });
                      setShowStatusMenu(false);
                    }}
                  >
                    {opt.icon}
                    <span>{opt.label}</span>
                    {todo.status === opt.status && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginLeft: 'auto', flexShrink: 0 }}>
                        <path d="M2 6.5L4.5 9L10 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Priority menu */}
          <div className="detail-popup-wrap" ref={priorityMenuRef}>
            <button
              className="detail-tb-btn detail-tb-icon"
              onClick={() => setShowPriorityMenu(v => !v)}
              title={todo.priority ? PRIORITY_LABEL[todo.priority] : 'Aucune priorité'}
            >
              <IconFlag priority={todo.priority} />
            </button>
            {showPriorityMenu && (
              <div className="detail-popup-menu" style={getPopupPos(priorityMenuRef)}>
                {[
                  { priority: 'high',   label: 'Priorité élevée',  color: '#D52B25' },
                  { priority: 'medium', label: 'Priorité moyenne', color: '#FAA80C' },
                  { priority: 'low',    label: 'Priorité faible',  color: '#4772FB' },
                  { priority: null,     label: 'Sans priorité',    color: '#888'    },
                ].map(opt => (
                  <button
                    key={String(opt.priority)}
                    className={`detail-popup-opt${todo.priority === opt.priority ? ' selected' : ''}`}
                    onClick={() => {
                      update({ priority: opt.priority });
                      setShowPriorityMenu(false);
                    }}
                  >
                    <svg width="12" height="14" viewBox="0 0 10 12" fill="none" style={{ color: opt.color }}>
                      <path d="M1.5 11V1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      <path d="M1.5 2H8.5L6.5 5L8.5 8H1.5V2Z" fill="currentColor"/>
                    </svg>
                    <span>{opt.label}</span>
                    {todo.priority === opt.priority && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginLeft: 'auto', flexShrink: 0 }}>
                        <path d="M2 6.5L4.5 9L10 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="detail-tb-btn detail-tb-icon" title="Assigner">
            <IconAssign />
          </button>

          <div ref={datePickerRef} style={{ position: 'relative' }}>
            <div className={`detail-tb-btn detail-tb-date${todo.dueDate ? ` has-date date-${dateUrgency}` : ''}`} title="Date d'échéance">
              <span style={{ display: 'flex', cursor: 'pointer' }} onClick={() => {
                // Cycle: none → today → tomorrow → +7d → +30d → none
                const now = new Date(); now.setHours(0,0,0,0);
                const addD = n => { const d = new Date(now); d.setDate(d.getDate() + n); return d; };
                const toISO = d => d.toISOString();
                const sameDay = (a, b) => a && b && new Date(a).toDateString() === b.toDateString();

                if (!todo.dueDate) { update({ dueDate: toISO(now) }); }
                else if (sameDay(todo.dueDate, now))       { update({ dueDate: toISO(addD(1)) }); }
                else if (sameDay(todo.dueDate, addD(1)))   { update({ dueDate: toISO(addD(7)) }); }
                else if (sameDay(todo.dueDate, addD(7)))   { update({ dueDate: toISO(addD(30)) }); }
                else { update({ dueDate: null }); }
              }}>
                <IconCalendar />
              </span>
              <span
                onClick={() => setShowDatePicker(v => !v)}
                style={{ cursor: 'pointer' }}
              >{todo.dueDate ? dueDateLabel : "Date d'échéance"}</span>
            </div>
            {showDatePicker && (
              <div className="dp-portal">
                <DateTimePicker
                  value={todo.dueDate}
                  onChange={val => update({ dueDate: val })}
                  onClose={() => setShowDatePicker(false)}
                />
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── Title ─────────────────────────────────────────────────────────── */}
      <AutoTextarea
        className={`detail-title${todo.status === 'done' ? ' detail-title-done' : ''}`}
        value={todo.text}
        onChange={e => update({ text: e.target.value })}
        placeholder="Ajoutez un titre"
        minRows={1}
      />

      {/* ── Subtasks ──────────────────────────────────────────────────────── */}
      <div className="detail-subtasks">
        {subtasks.map((sub, subIdx) => {
          const subNext = sub.status === 'pending'     ? 'in-progress'
                        : sub.status === 'in-progress' ? 'done'
                        : 'pending';
          return (
            <div key={sub.id} className={`detail-subtask-row${subSelectedIds.has(sub.id) ? ' detail-subtask-selected' : ''}`}>
              <button
                className={`detail-subtask-check${sub.status === 'done' ? ' done' : sub.status === 'in-progress' ? ' in-progress' : ''}`}
                onClick={() => {
                  if (subNext === 'in-progress') playInProgressSound();
                  else if (subNext === 'done') playCompletionSound();
                  dispatch({ type: 'UPDATE_TODO', id: sub.id, updates: { status: subNext } });
                }}
                title={sub.status === 'pending' ? 'Marquer en cours' : sub.status === 'in-progress' ? 'Marquer terminée' : 'Réinitialiser'}
              >
                {sub.status === 'done' && (
                  <svg width="8" height="7" viewBox="0 0 12 10">
                    <path d="M1 5l3.5 3.5L11 1" stroke="currentColor" strokeWidth="2"
                      fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
                {sub.status === 'in-progress' && (
                  <svg width="10" height="3" viewBox="0 0 12 4">
                    <circle cx="2"  cy="2" r="1.5" fill="currentColor"/>
                    <circle cx="6"  cy="2" r="1.5" fill="currentColor"/>
                    <circle cx="10" cy="2" r="1.5" fill="currentColor"/>
                  </svg>
                )}
              </button>
              <input
                ref={el => { if (el) subInputRefs.current[sub.id] = el; else delete subInputRefs.current[sub.id]; }}
                className={`detail-subtask-text${sub.status === 'done' ? ' done' : ''}`}
                value={sub.text}
                placeholder="Sous-tâche…"
                onChange={e => dispatch({ type: 'UPDATE_TODO', id: sub.id, updates: { text: e.target.value } })}
                onBlur={() => { if (sub.text.trim() === '') dispatch({ type: 'DELETE_TODOS', ids: [sub.id] }); }}
                onFocus={() => setSubSelectedIds(new Set())}
                onKeyDown={e => handleSubKeyDown(e, sub, subIdx)}
              />
            </div>
          );
        })}
        {todo.indent === 0 && (
          <div className="detail-subtask-row detail-subtask-add-row" onClick={addSubtask} style={{ cursor: 'pointer' }}>
            <span className="detail-subtask-plus">
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M6 1v10M1 6h10"/>
              </svg>
            </span>
            <span className="detail-subtask-add-label">Ajouter une sous-tâche…</span>
          </div>
        )}
      </div>

      {/* ── Notes ─────────────────────────────────────────────────────────── */}
      <AutoTextarea
        className="detail-notes"
        value={todo.notes || ''}
        onChange={e => update({ notes: e.target.value })}
        placeholder="Ajoutez une note…"
        minRows={1}
      />

    </div>
  );
}
