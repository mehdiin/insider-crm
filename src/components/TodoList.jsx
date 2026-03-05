import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { genId } from '../utils/id';
import { playCompletionSound, playInProgressSound } from '../utils/sound';
import TodoDetailPanel from './TodoDetailPanel';

// ── SVG icons shared ─────────────────────────────────────────────────────────
const OrgIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="15" rx="1"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
  </svg>
);
const TalentIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>
);

// ── Filter picker (barre de filtre en haut) ───────────────────────────────────
function FilterPicker({ value, options, onChange, type, placeholder }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  const selected = options.find(o => o.id === value) ?? null;
  const filtered  = options.filter(o => o.name.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    if (!open) return;
    function onDown(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div ref={ref} className={`todo-filter-picker todo-filter-${type}`}>
      <button
        className={`todo-filter-btn${selected ? ' active' : ''}`}
        onClick={() => { setOpen(v => !v); setSearch(''); }}
      >
        {type === 'org' ? <OrgIcon /> : <TalentIcon />}
        <span>{selected ? selected.name : placeholder}</span>
        {selected && (
          <span className="todo-filter-x"
            onMouseDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onChange(null); setOpen(false); }}>×</span>
        )}
      </button>
      {open && (
        <div className="todo-chip-dropdown">
          <input autoFocus className="todo-chip-search" value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Escape' && setOpen(false)}
            placeholder="Rechercher…" onMouseDown={e => e.stopPropagation()} />
          <div className="todo-chip-list">
            {value && <div className="todo-chip-opt todo-chip-clear" onClick={() => { onChange(null); setOpen(false); }}>✕ Effacer</div>}
            {filtered.map(opt => (
              <div key={opt.id} className={`todo-chip-opt${opt.id === value ? ' todo-chip-selected' : ''}`}
                onClick={() => { onChange(opt.id); setOpen(false); }}>{opt.name}</div>
            ))}
            {filtered.length === 0 && <div className="todo-chip-empty-msg">Aucun résultat</div>}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Inline chip picker (org / talent) ────────────────────────────────────────
function ChipPicker({ value, options, onChange, type, onFilterClick }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  const selected = options.find(o => o.id === value) ?? null;
  const filtered  = options.filter(o => o.name.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    if (!open) return;
    function onDown(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const isOrg = type === 'org';

  return (
    <div ref={ref} className="todo-chip-picker-wrap">
      <span
        className={`${isOrg ? 'todo-org-chip' : 'todo-talent-chip'}${selected ? '' : ' todo-chip-empty'}`}
        title={selected ? (onFilterClick ? `Filtrer par ${selected.name}` : selected.name) : isOrg ? 'Assigner une marque' : 'Assigner un talent'}
        onMouseDown={e => e.stopPropagation()}
        onClick={e => {
          e.stopPropagation();
          if (selected && onFilterClick) { onFilterClick(value); }
          else { setOpen(v => !v); setSearch(''); }
        }}
      >
        {isOrg ? <OrgIcon /> : <TalentIcon />}
        {selected && <span>{selected.name}</span>}
        {selected && (
          <span
            className="todo-chip-remove"
            onMouseDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onChange(null); }}
            title="Supprimer"
          >×</span>
        )}
      </span>

      {open && (
        <div className="todo-chip-dropdown">
          <input
            autoFocus
            className="todo-chip-search"
            placeholder="Rechercher…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape') setOpen(false); }}
            onMouseDown={e => e.stopPropagation()}
          />
          <div className="todo-chip-list">
            {value && (
              <div className="todo-chip-opt todo-chip-clear"
                onMouseDown={e => e.stopPropagation()}
                onClick={() => { onChange(null); setOpen(false); }}>
                ✕ Effacer
              </div>
            )}
            {filtered.map(opt => (
              <div key={opt.id}
                className={`todo-chip-opt${opt.id === value ? ' todo-chip-selected' : ''}`}
                onMouseDown={e => e.stopPropagation()}
                onClick={() => { onChange(opt.id); setOpen(false); }}>
                {opt.name}
              </div>
            ))}
            {filtered.length === 0 && <div className="todo-chip-empty-msg">Aucun résultat</div>}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Generic stack picker (org & talent) ──────────────────────────────────────
function StackPicker({ ids = [], options, onChange, onFilterClick, type }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  const isOrg      = type === 'org';
  const Icon       = isOrg ? OrgIcon : TalentIcon;
  const chipClass  = isOrg ? 'todo-org-chip' : 'todo-talent-chip';
  const circClass  = isOrg ? 'todo-org-circle' : 'todo-talent-circle';
  const emptyTitle = isOrg ? 'Assigner une marque' : 'Assigner un talent';

  const assigned  = options.filter(o => ids.includes(o.id));
  const available = options.filter(o => !ids.includes(o.id));
  const filtered  = available.filter(o => o.name.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    if (!open) return;
    function onDown(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const remove = (id) => onChange(ids.filter(i => i !== id));
  const add    = (id) => { onChange([...ids, id]); setOpen(false); setSearch(''); };

  return (
    <div ref={ref} className="todo-talent-stack-wrap">
      {assigned.length === 0 ? (
        /* Empty: icon-only chip */
        <span
          className={`${chipClass} todo-chip-empty`}
          title={emptyTitle}
          onMouseDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); setOpen(v => !v); setSearch(''); }}
        >
          <Icon />
        </span>
      ) : assigned.length === 1 ? (
        /* Single: pill style (icon + name + × on hover) */
        <span
          className={chipClass}
          title={onFilterClick ? `Filtrer par ${assigned[0].name}` : assigned[0].name}
          data-tooltip={assigned[0].name}
          onMouseDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); if (onFilterClick) onFilterClick(assigned[0].id); }}
        >
          <Icon />
          <span>{assigned[0].name}</span>
          <span
            className="todo-chip-remove"
            onMouseDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); remove(assigned[0].id); }}
            title="Supprimer"
          >×</span>
        </span>
      ) : (
        /* Multiple: overlapping ovals */
        <div className="todo-talent-stack">
          {assigned.map((item, i) => (
            <span
              key={item.id}
              className={circClass}
              style={{ zIndex: assigned.length - i + 1 }}
              title={item.name + (onFilterClick ? ' — Clic pour filtrer' : '')}
              data-tooltip={item.name}
              onMouseDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); if (onFilterClick) onFilterClick(item.id); }}
            >
              <Icon />
              <span className="todo-talent-circle-label">{item.name.slice(0, 3)}</span>
              <span
                className="todo-chip-remove"
                onMouseDown={e => e.stopPropagation()}
                onClick={e => { e.stopPropagation(); remove(item.id); }}
                title="Supprimer"
              >×</span>
            </span>
          ))}
        </div>
      )}
      {open && (
        <div className="todo-chip-dropdown">
          <input
            autoFocus
            className="todo-chip-search"
            placeholder="Rechercher…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Escape' && setOpen(false)}
            onMouseDown={e => e.stopPropagation()}
          />
          <div className="todo-chip-list">
            {filtered.map(opt => (
              <div key={opt.id} className="todo-chip-opt"
                onMouseDown={e => e.stopPropagation()}
                onClick={() => add(opt.id)}>{opt.name}</div>
            ))}
            {filtered.length === 0 && <div className="todo-chip-empty-msg">Aucun résultat</div>}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Status icon for status pills ─────────────────────────────────────────────
function StatusIcon({ status }) {
  if (status === 'done') return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M4 8l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  if (status === 'in-progress') return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="5" cy="8" r="1.3" fill="currentColor"/>
      <circle cx="8" cy="8" r="1.3" fill="currentColor"/>
      <circle cx="11" cy="8" r="1.3" fill="currentColor"/>
    </svg>
  );
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

// ── Date display helper ───────────────────────────────────────────────────────
function shortDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  const h = d.getHours(), m = d.getMinutes();
  const dateStr = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  return (h || m)
    ? `${dateStr} ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`
    : dateStr;
}
function isPast(iso) { return iso && new Date(iso) < new Date(); }

// ── Component ─────────────────────────────────────────────────────────────────
export default function TodoList({ projectFilter = null, orgFilter = null, talentFilter = null }) {
  const { state, dispatch } = useApp();
  const [focusedIndex,   setFocusedIndex]   = useState(-1);
  const [anchorIndex,    setAnchorIndex]    = useState(null);
  const [cmdSet,         setCmdSet]         = useState(new Set());
  const [hiddenStatuses, setHiddenStatuses] = useState(new Set());
  const [bottomCollapsed, setBottomCollapsed] = useState(false);
  const [collapsedIds,   setCollapsedIds]   = useState(new Set());
  const [draggedId,  setDraggedId]  = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [suggest,       setSuggest]       = useState(null);
  // suggest = { todoId, matches: [{type:'org'|'talent', item}], selIdx: 0 }
  const [filterOrgId,    setFilterOrgId]    = useState(orgFilter);
  const [filterTalentId, setFilterTalentId] = useState(talentFilter);

  // Sync external filters from sidebar
  useEffect(() => { setFilterOrgId(orgFilter); },    [orgFilter]);
  useEffect(() => { setFilterTalentId(talentFilter); }, [talentFilter]);
  const [rightWidth, setRightWidth] = useState(
    () => Math.min(700, Math.max(300, Math.floor((window.innerWidth - 260) / 3)))
  );
  const inputRefs      = useRef({});
  const listRef        = useRef(null);
  const initDone       = useRef(false);
  const dragSelectRef  = useRef(false); // true pendant un cliquer-glisser de sélection

  // todos = base list (all, or filtered by project)
  const todos = projectFilter
    ? state.todos.filter(t => t.projectId === projectFilter)
    : state.todos;

  // Has-subtasks helper (uses full state.todos for correctness)
  function getHasSubtasks(id) {
    const idx = state.todos.findIndex(t => t.id === id);
    return idx >= 0 && idx < state.todos.length - 1 && state.todos[idx + 1].indent > state.todos[idx].indent;
  }

  // visibleTodos: apply status filter + org/talent filters + collapse
  const visibleTodos = (() => {
    let base = hiddenStatuses.size > 0 ? todos.filter(t => !hiddenStatuses.has(t.status)) : todos;
    if (filterOrgId)    base = base.filter(t => (t.organizationIds || []).includes(filterOrgId));
    if (filterTalentId) base = base.filter(t => (t.talentIds || []).includes(filterTalentId));
    const result = [];
    let hideAbove = null;
    for (const todo of base) {
      if (hideAbove !== null) {
        if (todo.indent > hideAbove) continue;
        hideAbove = null;
      }
      result.push(todo);
      if (collapsedIds.has(todo.id)) hideAbove = todo.indent;
    }
    return result;
  })();

  const bottomTodos   = hiddenStatuses.size > 0 ? todos.filter(t => hiddenStatuses.has(t.status)) : [];
  const focusedTodo   = visibleTodos[focusedIndex] ?? null;
  const parentTodos   = todos.filter(t => getHasSubtasks(t.id));
  const allCollapsed  = parentTodos.length > 0 && parentTodos.every(t => collapsedIds.has(t.id));

  function toggleCollapse(id) {
    setCollapsedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleAll() {
    setCollapsedIds(allCollapsed ? new Set() : new Set(parentTodos.map(t => t.id)));
  }

  // ── Selection helpers ─────────────────────────────────────────────────────

  function getSelectedIds() {
    const ids = new Set();
    if (anchorIndex !== null && focusedIndex >= 0) {
      const s = Math.min(anchorIndex, focusedIndex);
      const e = Math.max(anchorIndex, focusedIndex);
      for (let i = s; i <= e && i < visibleTodos.length; i++)
        if (visibleTodos[i]) ids.add(visibleTodos[i].id);
    } else if (focusedIndex >= 0 && visibleTodos[focusedIndex]) {
      ids.add(visibleTodos[focusedIndex].id);
    }
    cmdSet.forEach(id => ids.add(id));
    return ids;
  }

  function isHighlighted(idx) {
    if (cmdSet.has(visibleTodos[idx]?.id)) return true;
    if (anchorIndex !== null && focusedIndex >= 0) {
      const s = Math.min(anchorIndex, focusedIndex);
      const e = Math.max(anchorIndex, focusedIndex);
      return idx >= s && idx <= e;
    }
    return false;
  }

  // ── Focus management ──────────────────────────────────────────────────────

  useEffect(() => {
    if (dragSelectRef.current) return; // pas de focus pendant le drag-select
    if (focusedIndex >= 0 && focusedIndex < visibleTodos.length) {
      const todo = visibleTodos[focusedIndex];
      if (todo) {
        const el = inputRefs.current[todo.id];
        if (el && document.activeElement !== el) el.focus();
      }
    }
  }, [focusedIndex]); // eslint-disable-line

  // ── Move ──────────────────────────────────────────────────────────────────

  function mergeReorderedVisible(allTodos, newVis) {
    const ids = new Set(newVis.map(t => t.id));
    let vi = 0;
    return allTodos.map(t => (ids.has(t.id) ? newVis[vi++] : t));
  }

  function moveSelection(dir) {
    const selIds   = getSelectedIds();
    if (!selIds.size) return;
    const arr      = [...visibleTodos];
    const selected = arr.filter(t => selIds.has(t.id));
    const others   = arr.filter(t => !selIds.has(t.id));
    const focusedId = visibleTodos[focusedIndex]?.id;

    if (dir === 'up') {
      const firstSelIdx = arr.findIndex(t => selIds.has(t.id));
      if (firstSelIdx <= 0) return;
      // L'item juste au-dessus du groupe : on l'insère après le groupe
      const pivot        = arr[firstSelIdx - 1];
      const pivotInOthers = others.findIndex(t => t.id === pivot.id);
      const next = [...others];
      next.splice(pivotInOthers, 0, ...selected);
      dispatch({ type: 'REORDER_TODOS', todos: mergeReorderedVisible(state.todos, next) });
      const newFocusIdx = next.findIndex(t => t.id === focusedId);
      if (newFocusIdx !== -1) setFocusedIndex(newFocusIdx);
      // N'ancre dans cmdSet que si vraie multi-sélection
      if (selIds.size > 1) setCmdSet(new Set(selIds));
      else if (cmdSet.size > 0) setCmdSet(new Set());
      setAnchorIndex(null);
    } else {
      const lastSelIdx = arr.reduce((a, t, i) => selIds.has(t.id) ? i : a, -1);
      if (lastSelIdx >= arr.length - 1) return;
      // L'item juste en-dessous du groupe : on l'insère avant le groupe
      const pivot         = arr[lastSelIdx + 1];
      const pivotInOthers = others.findIndex(t => t.id === pivot.id);
      const next = [...others];
      next.splice(pivotInOthers + 1, 0, ...selected);
      dispatch({ type: 'REORDER_TODOS', todos: mergeReorderedVisible(state.todos, next) });
      const newFocusIdx = next.findIndex(t => t.id === focusedId);
      if (newFocusIdx !== -1) setFocusedIndex(newFocusIdx);
      // N'ancre dans cmdSet que si vraie multi-sélection
      if (selIds.size > 1) setCmdSet(new Set(selIds));
      else if (cmdSet.size > 0) setCmdSet(new Set());
      setAnchorIndex(null);
    }
  }

  // ── Keyboard ──────────────────────────────────────────────────────────────

  function handleKeyDown(e, idx) {
    const { key, shiftKey, metaKey, ctrlKey } = e;
    const cmd  = metaKey || ctrlKey;
    const todo = visibleTodos[idx];
    if (!todo) return;

    // Undo / Redo — géré ici en priorité pour éviter le undo natif du navigateur
    if (cmd && key === 'z' && !shiftKey) { e.preventDefault(); dispatch({ type: 'UNDO' }); return; }
    if (cmd && ((key === 'z' && shiftKey) || key === 'y')) { e.preventDefault(); dispatch({ type: 'REDO' }); return; }

    // Autocomplétion marque/talent
    if (suggest && suggest.todoId === todo.id) {
      if (key === 'ArrowDown') {
        e.preventDefault();
        setSuggest(s => ({ ...s, selIdx: Math.min(s.selIdx + 1, s.matches.length - 1) }));
        return;
      }
      if (key === 'ArrowUp') {
        e.preventDefault();
        setSuggest(s => ({ ...s, selIdx: Math.max(s.selIdx - 1, 0) }));
        return;
      }
      if (key === 'Enter') {
        e.preventDefault();
        applySuggest(todo, suggest.matches[suggest.selIdx]);
        return;
      }
      if (key === 'Escape') { setSuggest(null); return; }
    }

    if (key === 'ArrowDown' && !cmd) {
      e.preventDefault();
      if (shiftKey) { if (anchorIndex === null) setAnchorIndex(idx); setFocusedIndex(Math.min(idx + 1, visibleTodos.length - 1)); }
      else if (idx < visibleTodos.length - 1) { const ni = idx + 1; setFocusedIndex(ni); setAnchorIndex(ni); setCmdSet(new Set()); }
      return;
    }
    if (key === 'ArrowUp' && !cmd) {
      e.preventDefault();
      if (shiftKey) { if (anchorIndex === null) setAnchorIndex(idx); setFocusedIndex(Math.max(idx - 1, 0)); }
      else if (idx > 0) { const ni = idx - 1; setFocusedIndex(ni); setAnchorIndex(ni); setCmdSet(new Set()); }
      return;
    }
    if (key === 'ArrowDown' && cmd) { e.preventDefault(); moveSelection('down'); return; }
    if (key === 'ArrowUp'   && cmd) { e.preventDefault(); moveSelection('up');   return; }

    if (key === 'Tab' && !shiftKey) {
      e.preventDefault();
      if (idx > 0 && todo.indent < 1) dispatch({ type: 'UPDATE_TODO', id: todo.id, updates: { indent: 1 } });
      return;
    }
    if (key === 'Tab' && shiftKey) {
      e.preventDefault();
      if (todo.indent > 0) dispatch({ type: 'UPDATE_TODO', id: todo.id, updates: { indent: 0 } });
      return;
    }
    if (key === 'Enter') {
      e.preventDefault();
      const newId    = genId();
      const globalIdx = state.todos.findIndex(t => t.id === todo.id);
      dispatch({ type: 'ADD_TODO', id: newId, text: '', indent: todo.indent, insertAt: globalIdx + 1, projectId: projectFilter });
      setTimeout(() => {
        setFocusedIndex(idx + 1); setAnchorIndex(null); setCmdSet(new Set());
        if (inputRefs.current[newId]) inputRefs.current[newId].focus();
      }, 0);
      return;
    }
    if (key === 'Backspace' && shiftKey) {
      e.preventDefault();
      const ids = [...getSelectedIds()];
      const firstIdx = visibleTodos.findIndex(t => ids.includes(t.id));
      dispatch({ type: 'DELETE_TODOS', ids });
      setFocusedIndex(Math.max(0, firstIdx - 1)); setAnchorIndex(null); setCmdSet(new Set());
      return;
    }
    if (key === 'Backspace' && todo.text === '') {
      e.preventDefault();
      dispatch({ type: 'DELETE_TODOS', ids: [todo.id] });
      setFocusedIndex(Math.max(0, idx - 1)); setAnchorIndex(null); setCmdSet(new Set());
      return;
    }
  }

  // ── Paste multi-lignes (import tableur) ───────────────────────────────────

  function handlePaste(e, idx) {
    const text  = e.clipboardData.getData('text/plain');
    const lines = text.split(/\r?\n/)
      .map(l => l.split('\t')[0].trim())  // première colonne seulement
      .filter(l => l.length > 0);

    if (lines.length <= 1) return; // paste normal, on laisse faire

    e.preventDefault();
    const todo      = visibleTodos[idx];
    const globalIdx = state.todos.findIndex(t => t.id === todo.id);

    // Remplace la tâche courante par la première ligne
    dispatch({ type: 'UPDATE_TODO', id: todo.id, updates: { text: lines[0] } });

    // Crée une tâche pour chaque ligne suivante
    const newIds = lines.slice(1).map(() => genId());
    lines.slice(1).forEach((lineText, i) => {
      dispatch({
        type: 'ADD_TODO',
        id: newIds[i],
        text: lineText,
        indent: todo.indent,
        insertAt: globalIdx + 1 + i,
        projectId: projectFilter,
      });
    });

    // Focus sur la dernière tâche insérée
    setTimeout(() => {
      const lastIdx = idx + lines.length - 1;
      setFocusedIndex(lastIdx);
      setAnchorIndex(null);
      setCmdSet(new Set());
      const lastId = newIds[newIds.length - 1];
      if (inputRefs.current[lastId]) inputRefs.current[lastId].focus();
    }, 0);
  }

  // ── Checkbox ──────────────────────────────────────────────────────────────

  function handleCheck(todo) {
    const next = todo.status === 'pending'     ? 'in-progress'
               : todo.status === 'in-progress' ? 'done'
               : 'pending';
    dispatch({ type: 'UPDATE_TODO', id: todo.id, updates: { status: next } });
    if (next === 'in-progress') {
      playInProgressSound();
    } else if (next === 'done') {
      playCompletionSound();
    }
  }

  // ── Click ─────────────────────────────────────────────────────────────────

  function handleTaskMouseDown(e, idx) {
    if (e.button !== 0) return;

    if (e.shiftKey && !e.metaKey && !e.ctrlKey) {
      // ── Shift+clic : plage depuis l'ancre vers idx ──────────────────────────
      // L'ancre ne change pas ; si pas encore d'ancre, on prend le focus courant
      if (anchorIndex === null) setAnchorIndex(focusedIndex >= 0 ? focusedIndex : idx);
      setFocusedIndex(idx);
      return;
    }

    if (e.metaKey || e.ctrlKey) {
      // ── Cmd/Ctrl+clic : bascule individuelle ────────────────────────────────
      const id = visibleTodos[idx]?.id;
      if (!id) return;
      // Gèle la plage courante (ancre↔focus) dans cmdSet pour la préserver
      const newSet = new Set(cmdSet);
      if (anchorIndex !== null && focusedIndex >= 0) {
        const lo = Math.min(anchorIndex, focusedIndex);
        const hi = Math.max(anchorIndex, focusedIndex);
        for (let i = lo; i <= hi && i < visibleTodos.length; i++) {
          if (visibleTodos[i]) newSet.add(visibleTodos[i].id);
        }
      } else if (focusedIndex >= 0 && visibleTodos[focusedIndex]) {
        newSet.add(visibleTodos[focusedIndex].id);
      }
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      setCmdSet(newSet);
      setAnchorIndex(idx); // nouvel ancre pour les Shift+clic suivants
      setFocusedIndex(idx);
      return;
    }

    // ── Clic simple : sélection unique + début du drag-select ─────────────────
    dragSelectRef.current = true;
    document.body.style.userSelect = 'none';
    setFocusedIndex(idx);
    setAnchorIndex(idx);
    setCmdSet(new Set());
  }

  // Étend la sélection au survol pendant le drag
  function handleRowMouseEnter(idx) {
    if (!dragSelectRef.current) return;
    setFocusedIndex(idx);
  }

  // Libère le drag-select sur mouseup global
  useEffect(() => {
    const onMouseUp = () => {
      if (!dragSelectRef.current) return;
      dragSelectRef.current = false;
      document.body.style.userSelect = '';
    };
    document.addEventListener('mouseup', onMouseUp);
    return () => document.removeEventListener('mouseup', onMouseUp);
  }, []); // eslint-disable-line

  // ── Link helpers (for detail panel) ──────────────────────────────────────

  const createOrg    = name => { const id = genId(); dispatch({ type: 'ADD_ORGANIZATION', id, name }); return id; };
  const createTalent = name => { const id = genId(); dispatch({ type: 'ADD_TALENT',       id, name }); return id; };

  function getChips(todo) {
    const proj = state.projects.find(p => p.id === todo.projectId);
    return proj ? [proj.number] : [];
  }

  // ── Auto-detect org/talent name in typed text ─────────────────────────────
  function escRe(str) { return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function handleTextChange(todo, newText) {
    const updates = { text: newText };

    // Detect full org name (add to array if not already linked)
    const currentOrgIds = new Set([...(todo.organizationIds || [])]);
    for (const org of state.organizations) {
      if (currentOrgIds.has(org.id)) continue;
      const re = new RegExp(`(^|\\s)${escRe(org.name)}(\\s|$)`, 'i');
      if (re.test(newText)) { updates.organizationIds = [...currentOrgIds, org.id]; break; }
    }

    // Detect full talent name (add to array if not already linked)
    const currentTalentIds = new Set([...(todo.talentIds || [])]);
    for (const talent of state.talents) {
      if (currentTalentIds.has(talent.id)) continue;
      const re = new RegExp(`(^|\\s)${escRe(talent.name)}(\\s|$)`, 'i');
      if (re.test(newText)) { updates.talentIds = [...currentTalentIds, talent.id]; break; }
    }

    // Autocomplete suggestions : dernier mot >= 3 caractères
    const lastWord = newText.trimEnd().split(/\s+/).pop() ?? '';
    if (lastWord.length >= 3) {
      const q = lastWord.toLowerCase();
      const assignedOrgIds    = new Set([...(todo.organizationIds || []), ...(updates.organizationIds || [])]);
      const assignedTalentIds = new Set([...(todo.talentIds || []),       ...(updates.talentIds || [])]);
      const matches = [
        ...state.organizations.filter(o => !assignedOrgIds.has(o.id)    && o.name.toLowerCase().startsWith(q)).map(o => ({ type: 'org',    item: o })),
        ...state.talents      .filter(t => !assignedTalentIds.has(t.id) && t.name.toLowerCase().startsWith(q)).map(t => ({ type: 'talent', item: t })),
      ];
      setSuggest(matches.length > 0 ? { todoId: todo.id, matches, selIdx: 0 } : null);
    } else {
      setSuggest(null);
    }

    dispatch({ type: 'UPDATE_TODO', id: todo.id, updates });
  }

  function applySuggest(todo, match) {
    // Remplace le dernier mot partiel par le nom complet
    const trimmed = todo.text.trimEnd();
    const lastSpace = trimmed.lastIndexOf(' ');
    const prefix  = lastSpace >= 0 ? trimmed.slice(0, lastSpace + 1) : '';
    const newText = prefix + match.item.name + ' ';

    const updates = {
      text: newText,
      ...(match.type === 'org'
        ? { organizationIds: [...new Set([...(todo.organizationIds || []), match.item.id])] }
        : { talentIds: [...new Set([...(todo.talentIds || []), match.item.id])] }),
    };
    dispatch({ type: 'UPDATE_TODO', id: todo.id, updates });
    setSuggest(null);

    // Repositionne le curseur après l'espace ajouté
    setTimeout(() => {
      const el = inputRefs.current[todo.id];
      if (el) { el.focus(); el.setSelectionRange(newText.length, newText.length); }
    }, 0);
  }

  // ── Drag-and-drop reorder ─────────────────────────────────────────────────

  function handleGripDragStart(e, id) {
    // Si la tâche draggée n'est pas dans la sélection, on réduit la sélection à elle seule
    const selIds = getSelectedIds();
    if (!selIds.has(id)) {
      const idx = visibleTodos.findIndex(t => t.id === id);
      setFocusedIndex(idx);
      setCmdSet(new Set());
      setAnchorIndex(null);
    }
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  }
  function handleGripDragEnd() {
    setDraggedId(null);
    setDragOverId(null);
  }
  function handleRowDragOver(e, id) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const selIds = getSelectedIds();
    if (!selIds.has(id)) setDragOverId(id);
  }
  function handleRowDragLeave() {
    setDragOverId(null);
  }
  function handleRowDrop(e, targetId) {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) { setDraggedId(null); setDragOverId(null); return; }

    const arr        = [...visibleTodos];
    const draggedPos = arr.findIndex(t => t.id === draggedId);
    const targetPos  = arr.findIndex(t => t.id === targetId);
    if (draggedPos === -1 || targetPos === -1) { setDraggedId(null); setDragOverId(null); return; }

    // Déplacer tout le groupe sélectionné
    const selIds   = new Set(getSelectedIds());
    selIds.add(draggedId);
    const selected = arr.filter(t => selIds.has(t.id));
    const others   = arr.filter(t => !selIds.has(t.id));

    const targetInOthers = others.findIndex(t => t.id === targetId);
    if (targetInOthers === -1) { setDraggedId(null); setDragOverId(null); return; }

    const insertAt = draggedPos > targetPos ? targetInOthers : targetInOthers + 1;
    const next = [...others];
    next.splice(insertAt, 0, ...selected);

    dispatch({ type: 'REORDER_TODOS', todos: mergeReorderedVisible(state.todos, next) });
    const newFocusIdx = next.findIndex(t => t.id === draggedId);
    if (newFocusIdx !== -1) setFocusedIndex(newFocusIdx);
    if (selIds.size > 1) setCmdSet(new Set(selIds));
    else if (cmdSet.size > 0) setCmdSet(new Set());
    setAnchorIndex(null);
    setDraggedId(null);
    setDragOverId(null);
  }

  // ── Resize ────────────────────────────────────────────────────────────────

  function handleDividerMouseDown(e) {
    e.preventDefault();
    const startX = e.clientX;
    const startW = rightWidth;
    const minW   = 300;
    const maxW   = Math.min(700, window.innerWidth - 220 - 250); // keep ≥250px for task list

    function onMove(ev) {
      const dx = startX - ev.clientX; // drag left = wider right panel
      setRightWidth(Math.max(minW, Math.min(maxW, startW + dx)));
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
      document.body.style.cursor     = '';
      document.body.style.userSelect = '';
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
    document.body.style.cursor     = 'col-resize';
    document.body.style.userSelect = 'none';
  }

  // ── Undo / Redo ───────────────────────────────────────────────────────────

  useEffect(() => {
    const onKeyDown = (e) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      // Déjà géré par handleKeyDown si un input/textarea est focusé
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        dispatch({ type: 'UNDO' });
      } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
        e.preventDefault();
        dispatch({ type: 'REDO' });
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [dispatch]); // eslint-disable-line

  // ── Init ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;
    if (todos.length > 0) setTimeout(() => setFocusedIndex(0), 50);
  }, []); // eslint-disable-line

  // ── Counts ────────────────────────────────────────────────────────────────

  const pendingCount   = todos.filter(t => t.status !== 'done').length;
  const completedCount = todos.filter(t => t.status === 'done').length;
  const filterProject  = projectFilter ? state.projects.find(p => p.id === projectFilter) : null;
  const pageTitle      = filterProject ? `📊 ${filterProject.number}` : '✅ Toutes les tâches';

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="todo-layout">

      {/* ── Left column: list ──────────────────────────────────────────── */}
      <div className="todo-list-col" style={{ flex: 1, minWidth: 250 }}>

        {/* Header */}
        <div className="todo-col-header">
          <div className="todo-col-title-row">
            <h1 className="page-title">{pageTitle}</h1>
            <span className="page-count">{pendingCount}</span>
          </div>
          <div className="todo-col-header-bottom">
            <div className="todo-status-pills">
              {[
                { status: 'pending',     label: 'À faire' },
                { status: 'in-progress', label: 'En cours' },
                { status: 'done',        label: 'Terminées' },
              ].map(({ status, label }) => (
                <button
                  key={status}
                  className={`todo-status-pill todo-status-pill-${status}${!hiddenStatuses.has(status) ? ' active' : ''}`}
                  onClick={() => setHiddenStatuses(prev => {
                    const next = new Set(prev);
                    next.has(status) ? next.delete(status) : next.add(status);
                    return next;
                  })}
                >
                  <StatusIcon status={status} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
            <div className="todo-header-right">
              <FilterPicker type="org"    value={filterOrgId}    options={state.organizations} onChange={setFilterOrgId}    placeholder="Marque" />
              <FilterPicker type="talent" value={filterTalentId} options={state.talents}       onChange={setFilterTalentId} placeholder="Talent" />
              {parentTodos.length > 0 && (
                <button className="todo-expand-all-btn" onClick={toggleAll}>
                  {allCollapsed ? 'Développer tout' : 'Réduire tout'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Task list */}
        <div className="todo-list" ref={listRef}>
          {visibleTodos.length === 0 && (
            <p className="todo-empty">Aucune tâche.</p>
          )}

          {visibleTodos.map((todo, idx) => {
            const chips    = getChips(todo);
            const dateChip = shortDate(todo.dueDate);
            const past     = isPast(todo.dueDate) && todo.status !== 'done';

            return (
              <div
                key={todo.id}
                className={[
                  'todo-row',
                  isHighlighted(idx) ? 'todo-selected' : '',
                  focusedIndex === idx ? 'todo-focused' : '',
                  todo.status === 'done' ? 'todo-done' : '',
                  draggedId  === todo.id ? 'todo-dragging'  : '',
                  dragOverId === todo.id ? 'todo-drag-over' : '',
                  todo.indent > 0 ? 'todo-subtask' : '',
                  (todo.indent === 0 && getHasSubtasks(todo.id) && !collapsedIds.has(todo.id)) ? 'todo-parent-expanded' : '',
                  (todo.indent > 0 && (!visibleTodos[idx + 1] || visibleTodos[idx + 1].indent === 0)) ? 'todo-subtask-last' : '',
                ].filter(Boolean).join(' ')}
                style={{ paddingLeft: `${12 + todo.indent * 28}px` }}
                onMouseDown={e => handleTaskMouseDown(e, idx)}
                onMouseEnter={() => handleRowMouseEnter(idx)}
                onDragOver={e => handleRowDragOver(e, todo.id)}
                onDragLeave={handleRowDragLeave}
                onDrop={e => handleRowDrop(e, todo.id)}
              >
                {/* Drag grip */}
                <span
                  className="todo-drag-handle"
                  draggable
                  onDragStart={e => handleGripDragStart(e, todo.id)}
                  onDragEnd={handleGripDragEnd}
                  onMouseDown={e => e.stopPropagation()}
                  title="Déplacer"
                >
                  <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor">
                    <circle cx="2" cy="2"  r="1.2"/>
                    <circle cx="6" cy="2"  r="1.2"/>
                    <circle cx="2" cy="6"  r="1.2"/>
                    <circle cx="6" cy="6"  r="1.2"/>
                    <circle cx="2" cy="10" r="1.2"/>
                    <circle cx="6" cy="10" r="1.2"/>
                  </svg>
                </span>

                {/* Collapse toggle */}
                {getHasSubtasks(todo.id) ? (
                  <button
                    className="todo-collapse-btn"
                    onMouseDown={e => e.stopPropagation()}
                    onClick={e => { e.stopPropagation(); toggleCollapse(todo.id); }}
                    tabIndex={-1}
                  >
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor"
                      style={{ transform: collapsedIds.has(todo.id) ? 'rotate(0deg)' : 'rotate(90deg)', transition: 'transform 0.15s' }}>
                      <path d="M2 1l4 3-4 3V1z"/>
                    </svg>
                  </button>
                ) : (
                  <span className="todo-collapse-spacer" />
                )}

                <button
                  className={`todo-check${todo.status === 'done' ? ' todo-check-done' : todo.status === 'in-progress' ? ' todo-check-inprogress' : ''}`}
                  style={todo.status === 'pending' && todo.priority ? { borderColor: { high: '#D52B25', medium: '#FAA80C', low: '#4772FB' }[todo.priority] } : {}}
                  onMouseDown={e => e.stopPropagation()}
                  onClick={e => { e.stopPropagation(); handleCheck(todo); }}
                  tabIndex={-1}
                >
                  {todo.status === 'done' && (
                    <svg width="12" height="10" viewBox="0 0 12 10">
                      <path d="M1 5l3.5 3.5L11 1" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  {todo.status === 'in-progress' && (
                    <svg width="12" height="4" viewBox="0 0 12 4">
                      <circle cx="2"  cy="2" r="1.5" fill="currentColor"/>
                      <circle cx="6"  cy="2" r="1.5" fill="currentColor"/>
                      <circle cx="10" cy="2" r="1.5" fill="currentColor"/>
                    </svg>
                  )}
                </button>

                <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
                  <input
                    ref={el => { if (el) inputRefs.current[todo.id] = el; else delete inputRefs.current[todo.id]; }}
                    className="todo-input"
                    type="text"
                    value={todo.text}
                    placeholder={idx === focusedIndex ? 'Nouvelle tâche…' : ''}
                    onChange={e => handleTextChange(todo, e.target.value)}
                    onKeyDown={e => handleKeyDown(e, idx)}
                    onPaste={e => handlePaste(e, idx)}
                    onFocus={() => { if (focusedIndex !== idx) setFocusedIndex(idx); }}
                    onBlur={() => setTimeout(() => setSuggest(null), 150)}
                    tabIndex={0}
                    style={{ width: '100%' }}
                  />
                  {suggest && suggest.todoId === todo.id && (
                    <div className="todo-autocomplete">
                      {suggest.matches.map((m, i) => (
                        <div
                          key={m.item.id}
                          className={`todo-ac-opt${i === suggest.selIdx ? ' todo-ac-active' : ''}`}
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => applySuggest(todo, m)}
                        >
                          <span className={`todo-ac-icon ${m.type}`}>
                            {m.type === 'org'
                              ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="15" rx="1"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
                              : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                            }
                          </span>
                          {m.item.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Chips (date, project) */}
                {dateChip && (
                  <span className={`todo-date-chip ${past ? 'todo-date-overdue' : ''}`}>
                    📅 {dateChip}
                  </span>
                )}
                {chips.map((label, i) => (
                  <span key={i} className="todo-link-tag">{label}</span>
                ))}

                {/* Marque + Talent pickers */}
                <div className="todo-chips-group">
                  <StackPicker
                    type="org"
                    ids={todo.organizationIds || []}
                    options={state.organizations}
                    onChange={ids => dispatch({ type: 'UPDATE_TODO', id: todo.id, updates: { organizationIds: ids } })}
                    onFilterClick={id => setFilterOrgId(id)}
                  />

                  {(todo.organizationIds || []).length > 0 && (todo.talentIds || []).length > 0 && (
                    <span className="todo-collab-x">×</span>
                  )}

                  <StackPicker
                    type="talent"
                    ids={todo.talentIds || []}
                    options={state.talents}
                    onChange={ids => dispatch({ type: 'UPDATE_TODO', id: todo.id, updates: { talentIds: ids } })}
                    onFilterClick={id => setFilterTalentId(id)}
                  />
                </div>
              </div>
            );
          })}

          <button
            className="todo-add-btn"
            onClick={() => {
              const newId = genId();
              dispatch({ type: 'ADD_TODO', id: newId, text: '', indent: 0, insertAt: state.todos.length, projectId: projectFilter });
              setTimeout(() => {
                setFocusedIndex(visibleTodos.length);
                setAnchorIndex(null); setCmdSet(new Set());
                if (inputRefs.current[newId]) inputRefs.current[newId].focus();
              }, 0);
            }}
          >
            + Ajouter une tâche
          </button>
        </div>

        {/* Bottom section: tasks with hidden statuses */}
        {bottomTodos.length > 0 && (
          <div className="todo-bottom-section">
            <button className="todo-bottom-toggle" onClick={() => setBottomCollapsed(v => !v)}>
              <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor"
                style={{ transform: bottomCollapsed ? 'rotate(0deg)' : 'rotate(90deg)', transition: 'transform 0.15s' }}>
                <path d="M2 1l4 3-4 3V1z"/>
              </svg>
              {bottomTodos.length} tâche{bottomTodos.length > 1 ? 's' : ''} masquée{bottomTodos.length > 1 ? 's' : ''}
            </button>
            {!bottomCollapsed && (
              <div className="todo-bottom-list">
                {[
                  { status: 'pending',     label: 'À faire' },
                  { status: 'in-progress', label: 'En cours' },
                  { status: 'done',        label: 'Terminées' },
                ]
                  .filter(g => hiddenStatuses.has(g.status))
                  .map(g => {
                    const group = bottomTodos.filter(t => t.status === g.status);
                    if (group.length === 0) return null;
                    return (
                      <div key={g.status} className="todo-bottom-group">
                        <div className={`todo-bottom-group-hdr todo-bottom-group-hdr-${g.status}`}>
                          <StatusIcon status={g.status} />
                          <span>{g.label}</span>
                        </div>
                        {group.map(todo => (
                          <div
                            key={todo.id}
                            className={`todo-bottom-row${todo.status === 'done' ? ' todo-done' : ''}`}
                            style={{ paddingLeft: `${12 + todo.indent * 28}px` }}
                          >
                            {/* invisible spacers to align checkbox with main list */}
                            <span className="todo-drag-handle" style={{ visibility: 'hidden', pointerEvents: 'none', cursor: 'default' }}>
                              <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor"><circle cx="2" cy="2" r="1.2"/></svg>
                            </span>
                            <span className="todo-collapse-spacer" />
                            <button
                              className={`todo-check${todo.status === 'done' ? ' todo-check-done' : todo.status === 'in-progress' ? ' todo-check-inprogress' : ''}`}
                              onMouseDown={e => e.stopPropagation()}
                              onClick={e => { e.stopPropagation(); handleCheck(todo); }}
                              tabIndex={-1}
                            >
                              {todo.status === 'done' && (
                                <svg width="12" height="10" viewBox="0 0 12 10">
                                  <path d="M1 5l3.5 3.5L11 1" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                              {todo.status === 'in-progress' && (
                                <svg width="12" height="4" viewBox="0 0 12 4">
                                  <circle cx="2"  cy="2" r="1.5" fill="currentColor"/>
                                  <circle cx="6"  cy="2" r="1.5" fill="currentColor"/>
                                  <circle cx="10" cy="2" r="1.5" fill="currentColor"/>
                                </svg>
                              )}
                            </button>
                            <span className="todo-bottom-text">{todo.text || '(sans titre)'}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── Resize divider ────────────────────────────────────────────── */}
      <div className="todo-divider" onMouseDown={handleDividerMouseDown} />

      {/* ── Right column: detail panel ────────────────────────────────── */}
      <div className="todo-detail-col" style={{ width: rightWidth, flexShrink: 0 }}>
        <TodoDetailPanel
          todo={focusedTodo}
          state={state}
          dispatch={dispatch}
          createOrg={createOrg}
          createTalent={createTalent}
        />
      </div>

    </div>
  );
}
