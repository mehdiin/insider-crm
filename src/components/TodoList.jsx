import React, { useState, useRef, useEffect } from 'react';
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
  const [focusIdx, setFocusIdx] = useState(0);
  const ref = useRef(null);
  const listRef = useRef(null);

  const selected = options.find(o => o.id === value) ?? null;
  const filtered  = options.filter(o => o.name.toLowerCase().includes(search.toLowerCase()));

  // Reset focus index when search changes — always default to first item
  useEffect(() => { setFocusIdx(0); }, [search]);

  useEffect(() => {
    if (!open) return;
    function onDown(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // Scroll focused item into view
  useEffect(() => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll('.todo-chip-opt:not(.todo-chip-clear)');
    if (items[focusIdx]) items[focusIdx].scrollIntoView({ block: 'nearest' });
  }, [focusIdx]);

  function handleKeyDown(e) {
    if (e.key === 'Escape') { setOpen(false); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusIdx(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[focusIdx]) { onChange(filtered[focusIdx].id); setOpen(false); }
    }
  }

  return (
    <div ref={ref} className={`todo-filter-picker todo-filter-${type}`}>
      <button
        className={`todo-filter-btn${selected ? ' active' : ''}`}
        onClick={() => { setOpen(v => !v); setSearch(''); setFocusIdx(0); }}
      >
        {type === 'org' ? <OrgIcon /> : <TalentIcon />}
        <span>{selected ? selected.name : placeholder}</span>
      </button>
      {selected && (
        <span className="todo-filter-x"
          onMouseDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onChange(null); setOpen(false); }}>×</span>
      )}
      {open && (
        <div className="todo-chip-dropdown">
          <input autoFocus className="todo-chip-search" value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Rechercher…" onMouseDown={e => e.stopPropagation()} />
          <div className="todo-chip-list" ref={listRef}>
            {value && <div className="todo-chip-opt todo-chip-clear" onClick={() => { onChange(null); setOpen(false); }}>✕ Effacer</div>}
            {filtered.map((opt, i) => (
              <div key={opt.id} className={`todo-chip-opt${opt.id === value ? ' todo-chip-selected' : ''}${i === focusIdx ? ' todo-chip-focused' : ''}`}
                onClick={() => { onChange(opt.id); setOpen(false); }}
                onMouseEnter={() => setFocusIdx(i)}>{opt.name}</div>
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
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateStart  = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays   = Math.round((dateStart - todayStart) / 86400000);

  if (diffDays === 0) return 'auj.';
  if (diffDays === 1) return 'dem.';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }).replace('.', '');
}
function isPast(iso) { return iso && new Date(iso) < new Date(); }

// ── Component ─────────────────────────────────────────────────────────────────
export default function TodoList({ projectFilter = null, orgFilter = null, talentFilter = null }) {
  const { state, dispatch } = useApp();
  const [focusedIndex,   setFocusedIndex]   = useState(-1);
  const [anchorIndex,    setAnchorIndex]    = useState(null);
  const [cmdSet,         setCmdSet]         = useState(new Set());
  const [hiddenStatuses,   setHiddenStatuses]   = useState(new Set());
  const [hiddenPriorities, setHiddenPriorities] = useState(new Set());
  const [newTaskText,      setNewTaskText]      = useState('');
  const [collapsedIds,   setCollapsedIds]   = useState(new Set());
  const [collapsedSections, setCollapsedSections] = useState(new Set());
  const [draggedId,   setDraggedId]   = useState(null);
  const [dragOverId,  setDragOverId]  = useState(null);
  const [dragOverPos, setDragOverPos] = useState(null); // 'before' | 'after'
  const dragOverRef   = useRef({ id: null, pos: null });
  const dragRaf       = useRef(null);
  const dragRowRects  = useRef([]);   // snapshot of row positions at drag start
  const [suggest,       setSuggest]       = useState(null);
  // suggest = { todoId, matches: [{type:'org'|'talent', item}], selIdx: 0 }
  const [suggestTop,   setSuggestTop]   = useState(null);
  const [topOrgIds,    setTopOrgIds]    = useState([]);
  const [topTalentIds, setTopTalentIds] = useState([]);
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
  const dragSelectRef  = useRef(false);
  const detailRef      = useRef(null);

  // Auto-collapse sections when statuses are deselected
  useEffect(() => {
    setCollapsedSections(new Set(hiddenStatuses));
  }, [hiddenStatuses.size]); // eslint-disable-line

  // Status filter pills
  const STATUS_PILLS = [
    { status: 'pending',     label: 'À faire',    cls: 'todo-status-flag-pending'     },
    { status: 'in-progress', label: 'En cours',   cls: 'todo-status-flag-in-progress' },
    { status: 'done',        label: 'Terminées',  cls: 'todo-status-flag-done'        },
  ];

  // todos = base list (all, or filtered by project)
  const todos = projectFilter
    ? state.todos.filter(t => t.projectId === projectFilter)
    : state.todos;

  // Has-subtasks helper (uses full state.todos for correctness)
  function getHasSubtasks(id) {
    const idx = state.todos.findIndex(t => t.id === id);
    return idx >= 0 && idx < state.todos.length - 1 && state.todos[idx + 1].indent > state.todos[idx].indent;
  }

  // Expand IDs to include subtasks of any parent in the set
  function expandWithSubtasks(ids) {
    const idSet = new Set(ids);
    for (let i = 0; i < state.todos.length; i++) {
      if (idSet.has(state.todos[i].id) && state.todos[i].indent === 0) {
        for (let j = i + 1; j < state.todos.length && state.todos[j].indent > 0; j++) {
          idSet.add(state.todos[j].id);
        }
      }
    }
    return [...idSet];
  }

  // Helper: get the parent status for each task (subtasks inherit their parent's status for filtering)
  function getParentStatus(todo, idx) {
    if (todo.indent === 0) return todo.status;
    // Walk backwards to find the parent (first task with lower indent)
    const todoIdx = todos.indexOf(todo);
    for (let i = todoIdx - 1; i >= 0; i--) {
      if (todos[i].indent < todo.indent) return todos[i].indent === 0 ? todos[i].status : getParentStatus(todos[i], i);
    }
    return todo.status;
  }

  const [sortMode, setSortMode] = useState('manual'); // 'manual' | 'priority' | 'date' | 'status' | 'alpha'
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const sortRef = useRef(null);

  // visibleTodos: all filtered todos in one list — hidden statuses appended at the bottom
  // sectionHeaders: map of visibleTodos index → header info (rendered before that index)
  const [visibleTodos, sectionHeaders] = (() => {
    // Apply priority + org/talent filters to all todos
    let base = [...todos];
    if (hiddenPriorities.size > 0) {
      // Only filter root tasks by priority — subtasks follow their parent
      const filtered = [];
      let keepChildren = true;
      for (const t of base) {
        if (t.indent === 0) {
          keepChildren = !hiddenPriorities.has(t.priority ?? null);
          if (keepChildren) filtered.push(t);
        } else {
          if (keepChildren) filtered.push(t);
        }
      }
      base = filtered;
    }
    if (filterOrgId)    base = base.filter(t => (t.organizationIds || []).includes(filterOrgId));
    if (filterTalentId) base = base.filter(t => (t.talentIds || []).includes(filterTalentId));

    // Split into main (not hidden) and hidden-status groups
    const main   = hiddenStatuses.size > 0 ? base.filter(t => !hiddenStatuses.has(getParentStatus(t))) : base;
    const hidden = hiddenStatuses.size > 0 ? base.filter(t =>  hiddenStatuses.has(getParentStatus(t))) : [];

    // Sort main tasks (by blocks: parent + children stay together)
    let sorted = main;
    if (sortMode !== 'manual') {
      const mainBlocks = [];
      let cur = null;
      for (const t of main) {
        if (t.indent === 0) { cur = { parent: t, children: [] }; mainBlocks.push(cur); }
        else if (cur) { cur.children.push(t); }
        else { mainBlocks.push({ parent: t, children: [] }); }
      }
      const PRIO_ORDER = { high: 0, medium: 1, low: 2 };
      mainBlocks.sort((a, b) => {
        if (sortMode === 'priority') {
          const pa = PRIO_ORDER[a.parent.priority] ?? 3;
          const pb = PRIO_ORDER[b.parent.priority] ?? 3;
          return pa - pb;
        }
        if (sortMode === 'date') {
          const da = a.parent.dueDate || '9999';
          const db = b.parent.dueDate || '9999';
          return da < db ? -1 : da > db ? 1 : 0;
        }
        if (sortMode === 'status') {
          const STATUS_ORDER = { 'pending': 0, 'in-progress': 1, 'done': 2 };
          const sa = STATUS_ORDER[a.parent.status] ?? 3;
          const sb = STATUS_ORDER[b.parent.status] ?? 3;
          return sa - sb;
        }
        if (sortMode === 'alpha') {
          return (a.parent.text || '').localeCompare(b.parent.text || '', 'fr', { sensitivity: 'base' });
        }
        return 0;
      });
      sorted = mainBlocks.flatMap(b => [b.parent, ...b.children]);
    }

    // Apply collapse
    const result = [];
    let hideAbove = null;
    for (const todo of sorted) {
      if (hideAbove !== null) { if (todo.indent > hideAbove) continue; hideAbove = null; }
      result.push(todo);
      if (collapsedIds.has(todo.id)) hideAbove = todo.indent;
    }

    // Append hidden statuses grouped by status (pending → in-progress → done)
    const headers = []; // array of { atIndex, status, label, count }
    if (hidden.length > 0) {
      const STATUS_ORDER = { pending: 0, 'in-progress': 1, done: 2 };
      const STATUS_LABELS = { pending: 'À faire', 'in-progress': 'En cours', done: 'Terminées' };
      const blocks = [];
      let currentBlock = null;
      for (const t of hidden) {
        if (t.indent === 0) { currentBlock = { parent: t, children: [] }; blocks.push(currentBlock); }
        else if (currentBlock) { currentBlock.children.push(t); }
        else { blocks.push({ parent: t, children: [] }); }
      }
      blocks.sort((a, b) => (STATUS_ORDER[a.parent.status] ?? 0) - (STATUS_ORDER[b.parent.status] ?? 0));

      // Count tasks per status group (only indent-0 parents count)
      const statusCounts = {};
      for (const block of blocks) {
        statusCounts[block.parent.status] = (statusCounts[block.parent.status] || 0) + 1;
      }

      let lastStatus = null;
      for (const block of blocks) {
        const st = block.parent.status;
        if (st !== lastStatus) {
          const count = statusCounts[st] || 0;
          headers.push({ atIndex: result.length, status: st, label: STATUS_LABELS[st] || st, count });
          lastStatus = st;
        }
        if (collapsedSections.has(st)) continue;
        result.push(block.parent);
        if (!collapsedIds.has(block.parent.id)) {
          result.push(...block.children);
        }
      }
    }

    return [result, headers];
  })();
  // Keep focus on same task when it moves in the list (e.g. status change)
  const focusedIdRef = useRef(null);

  // Store focused ID on every user-driven focus change
  useEffect(() => {
    if (focusedIndex >= 0 && visibleTodos[focusedIndex]) {
      focusedIdRef.current = visibleTodos[focusedIndex].id;
    } else if (focusedIndex < 0) {
      focusedIdRef.current = null;
    }
  }, [focusedIndex]); // eslint-disable-line

  // When todos reorder (status/priority change), follow the task by ID
  const visibleIdsStr = visibleTodos.map(t => t.id).join(',');
  useEffect(() => {
    if (!focusedIdRef.current || focusedIndex < 0) return;
    const currentId = visibleTodos[focusedIndex]?.id;
    if (currentId === focusedIdRef.current) return;
    const newIdx = visibleTodos.findIndex(t => t.id === focusedIdRef.current);
    if (newIdx !== -1) {
      setFocusedIndex(newIdx);
      setAnchorIndex(null);
      setCmdSet(new Set());
    }
  }, [visibleIdsStr]); // eslint-disable-line — only re-run when the list order changes

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

  // ── Click outside → deselect ─────────────────────────────────────────────
  const layoutRef = useRef(null);
  useEffect(() => {
    function onDown(e) {
      // Keep selection when clicking inside the task list, detail panel, or divider
      if (e.target.closest('.todo-list')) return;
      if (e.target.closest('.todo-detail-col')) return;
      if (e.target.closest('.todo-divider')) return;
      setFocusedIndex(-1);
      setAnchorIndex(null);
      setCmdSet(new Set());
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);
  function handleLayoutMouseDown() { /* kept for future use */ }

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
    // Manual move overrides any active sort
    if (sortMode !== 'manual') setSortMode('manual');
    const selIds = getSelectedIds();
    if (!selIds.size) return;
    const arr = [...visibleTodos];
    const focusedId = visibleTodos[focusedIndex]?.id;

    // Expand selection to include subtasks of selected parents
    const expandedSelIds = new Set(selIds);
    for (let i = 0; i < arr.length; i++) {
      if (selIds.has(arr[i].id) && arr[i].indent === 0) {
        for (let j = i + 1; j < arr.length && arr[j].indent > 0; j++) {
          expandedSelIds.add(arr[j].id);
        }
      }
    }

    const selected = arr.filter(t => expandedSelIds.has(t.id));
    const others   = arr.filter(t => !expandedSelIds.has(t.id));
    if (!others.length) return;

    if (dir === 'up') {
      const firstSelIdx = arr.findIndex(t => expandedSelIds.has(t.id));
      if (firstSelIdx <= 0) return;
      // Find the start of the block just above (walk up past subtasks to parent)
      let aboveIdx = firstSelIdx - 1;
      while (aboveIdx > 0 && arr[aboveIdx].indent > 0) aboveIdx--;
      // Insert selected just before that block in the others array
      const aboveId = arr[aboveIdx].id;
      const insertAt = others.findIndex(t => t.id === aboveId);
      if (insertAt === -1) return;
      const next = [...others];
      next.splice(insertAt, 0, ...selected);

      dispatch({ type: 'REORDER_TODOS', todos: mergeReorderedVisible(state.todos, next) });
      const newFocusIdx = next.findIndex(t => t.id === focusedId);
      if (newFocusIdx !== -1) setFocusedIndex(newFocusIdx);
    } else {
      const lastSelIdx = arr.reduce((a, t, i) => expandedSelIds.has(t.id) ? i : a, -1);
      if (lastSelIdx >= arr.length - 1) return;
      // Find the end of the block just below (walk down past subtasks)
      let belowIdx = lastSelIdx + 1;
      if (arr[belowIdx].indent === 0) {
        while (belowIdx + 1 < arr.length && arr[belowIdx + 1].indent > 0) belowIdx++;
      }
      // Insert selected just after that block in the others array
      const belowId = arr[belowIdx].id;
      const insertAfter = others.findIndex(t => t.id === belowId);
      if (insertAfter === -1) return;
      const next = [...others];
      next.splice(insertAfter + 1, 0, ...selected);

      dispatch({ type: 'REORDER_TODOS', todos: mergeReorderedVisible(state.todos, next) });
      const newFocusIdx = next.findIndex(t => t.id === focusedId);
      if (newFocusIdx !== -1) setFocusedIndex(newFocusIdx);
    }

    if (selIds.size > 1) setCmdSet(new Set(selIds));
    else if (cmdSet.size > 0) setCmdSet(new Set());
    setAnchorIndex(null);
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
      dispatch({ type: 'ADD_TODO', id: newId, text: '', indent: todo.indent, insertAt: globalIdx + 1, projectId: projectFilter, priority: todo.priority });
      setTimeout(() => {
        setFocusedIndex(idx + 1); setAnchorIndex(null); setCmdSet(new Set());
        if (inputRefs.current[newId]) inputRefs.current[newId].focus();
      }, 0);
      return;
    }
    if (key === 'Backspace' && shiftKey) {
      e.preventDefault();
      const ids = expandWithSubtasks([...getSelectedIds()]);
      const firstIdx = visibleTodos.findIndex(t => ids.includes(t.id));
      dispatch({ type: 'DELETE_TODOS', ids });
      setFocusedIndex(Math.max(0, firstIdx - 1)); setAnchorIndex(null); setCmdSet(new Set());
      return;
    }
    if (key === 'Backspace' && todo.text === '') {
      e.preventDefault();
      dispatch({ type: 'DELETE_TODOS', ids: expandWithSubtasks([todo.id]) });
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
        priority: todo.priority,
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
    setBottomFocusedId(null);
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

  // ── Top-input autocomplete ───────────────────────────────────────────────
  function handleTopInputChange(newText) {
    setNewTaskText(newText);
    const nextOrgIds    = new Set(topOrgIds);
    const nextTalentIds = new Set(topTalentIds);
    for (const org of state.organizations) {
      if (nextOrgIds.has(org.id)) continue;
      const re = new RegExp(`(^|\\s)${escRe(org.name)}(\\s|$)`, 'i');
      if (re.test(newText)) { nextOrgIds.add(org.id); break; }
    }
    for (const talent of state.talents) {
      if (nextTalentIds.has(talent.id)) continue;
      const re = new RegExp(`(^|\\s)${escRe(talent.name)}(\\s|$)`, 'i');
      if (re.test(newText)) { nextTalentIds.add(talent.id); break; }
    }
    setTopOrgIds([...nextOrgIds]);
    setTopTalentIds([...nextTalentIds]);
    const lastWord = newText.trimEnd().split(/\s+/).pop() ?? '';
    if (lastWord.length >= 3) {
      const q = lastWord.toLowerCase();
      const matches = [
        ...state.organizations.filter(o => !nextOrgIds.has(o.id) && o.name.toLowerCase().startsWith(q)).map(o => ({ type: 'org', item: o })),
        ...state.talents.filter(t => !nextTalentIds.has(t.id) && t.name.toLowerCase().startsWith(q)).map(t => ({ type: 'talent', item: t })),
      ];
      setSuggestTop(matches.length > 0 ? { matches, selIdx: 0 } : null);
    } else {
      setSuggestTop(null);
    }
  }

  function applyTopSuggest(match) {
    const trimmed   = newTaskText.trimEnd();
    const lastSpace = trimmed.lastIndexOf(' ');
    const prefix    = lastSpace >= 0 ? trimmed.slice(0, lastSpace + 1) : '';
    const newText   = prefix + match.item.name + ' ';
    setNewTaskText(newText);
    if (match.type === 'org') {
      setTopOrgIds(prev => [...new Set([...prev, match.item.id])]);
    } else {
      setTopTalentIds(prev => [...new Set([...prev, match.item.id])]);
    }
    setSuggestTop(null);
    setTimeout(() => {
      const el = document.querySelector('.todo-add-top-input');
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
    // Snapshot row positions before any margins are added
    if (listRef.current) {
      const rows = listRef.current.querySelectorAll('.todo-row');
      const allSelIds = new Set(getSelectedIds());
      allSelIds.add(id);
      dragRowRects.current = Array.from(rows).map(r => {
        const rect = r.getBoundingClientRect();
        const rowId = r.dataset.todoId;
        return { id: rowId, top: rect.top, bottom: rect.bottom, mid: rect.top + rect.height / 2, skip: allSelIds.has(rowId) };
      }).filter(r => !r.skip);
    }
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  }
  function handleGripDragEnd() {
    if (dragRaf.current) cancelAnimationFrame(dragRaf.current);
    dragOverRef.current = { id: null, pos: null };
    setDraggedId(null);
    setDragOverId(null);
    setDragOverPos(null);
  }
  function handleListDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!draggedId || dragRowRects.current.length === 0) return;
    const y = e.clientY;
    // Find which original row the cursor is closest to
    let targetId = null;
    let pos = 'after';
    for (let i = 0; i < dragRowRects.current.length; i++) {
      const r = dragRowRects.current[i];
      if (y < r.mid) {
        targetId = r.id;
        pos = 'before';
        break;
      }
      targetId = r.id;
      pos = 'after';
    }
    if (!targetId) return;
    if (dragOverRef.current.id === targetId && dragOverRef.current.pos === pos) return;
    dragOverRef.current = { id: targetId, pos };
    if (dragRaf.current) cancelAnimationFrame(dragRaf.current);
    dragRaf.current = requestAnimationFrame(() => {
      setDragOverId(targetId);
      setDragOverPos(pos);
    });
  }
  function handleListDragLeave(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      dragOverRef.current = { id: null, pos: null };
      setDragOverId(null);
      setDragOverPos(null);
    }
  }
  function handleRowDrop(e, targetId) {
    e.preventDefault();
    // Manual move overrides any active sort
    if (sortMode !== 'manual') setSortMode('manual');
    // Use the tracked dragOverId instead of the event target (may differ due to margins)
    const effectiveTarget = dragOverId || targetId;
    const effectivePos = dragOverPos || 'after';
    if (!draggedId || draggedId === effectiveTarget) { handleGripDragEnd(); return; }
    targetId = effectiveTarget;
    if (!draggedId || draggedId === targetId) { handleGripDragEnd(); return; }

    const arr        = [...visibleTodos];
    const draggedPos = arr.findIndex(t => t.id === draggedId);
    const targetPos  = arr.findIndex(t => t.id === targetId);
    if (draggedPos === -1 || targetPos === -1) { setDraggedId(null); setDragOverId(null); setDragOverPos(null); return; }

    // Déplacer tout le groupe sélectionné
    const selIds   = new Set(getSelectedIds());
    selIds.add(draggedId);
    const selected = arr.filter(t => selIds.has(t.id));
    const others   = arr.filter(t => !selIds.has(t.id));

    const targetInOthers = others.findIndex(t => t.id === targetId);
    if (targetInOthers === -1) { setDraggedId(null); setDragOverId(null); setDragOverPos(null); return; }

    const insertAt = effectivePos === 'before' ? targetInOthers : targetInOthers + 1;
    const next = [...others];
    next.splice(insertAt, 0, ...selected);

    // Reset drag state first so the re-render from dispatch doesn't show stale drag indicators
    if (dragRaf.current) cancelAnimationFrame(dragRaf.current);
    dragOverRef.current = { id: null, pos: null };
    setDraggedId(null);
    setDragOverId(null);
    setDragOverPos(null);
    // Then reorder
    dispatch({ type: 'REORDER_TODOS', todos: mergeReorderedVisible(state.todos, next) });
    const newFocusIdx = next.findIndex(t => t.id === draggedId);
    if (newFocusIdx !== -1) setFocusedIndex(newFocusIdx);
    if (selIds.size > 1) setCmdSet(new Set(selIds));
    else if (cmdSet.size > 0) setCmdSet(new Set());
    setAnchorIndex(null);
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

  const visibleCount   = visibleTodos.filter(t => t.status !== 'done').length;
  const completedCount = todos.filter(t => t.status === 'done').length;
  const filterProject  = projectFilter ? state.projects.find(p => p.id === projectFilter) : null;
  const defaultTitle   = filterProject ? `📊 ${filterProject.number}` : '✅ Toutes les tâches';
  const [customTitle, setCustomTitle] = useState(() => localStorage.getItem('crm_list_title') || '');
  const [editingTitle, setEditingTitle] = useState(false);
  const pageTitle = customTitle || defaultTitle;

  // Close sort menu on outside click
  useEffect(() => {
    if (!sortMenuOpen) return;
    function onDown(e) { if (sortRef.current && !sortRef.current.contains(e.target)) setSortMenuOpen(false); }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [sortMenuOpen]);

  function handleTitleSave(val) {
    const trimmed = val.trim();
    setCustomTitle(trimmed);
    if (trimmed) localStorage.setItem('crm_list_title', trimmed);
    else localStorage.removeItem('crm_list_title');
    setEditingTitle(false);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="todo-layout" onMouseDown={handleLayoutMouseDown}>

      {/* ── Left column: list ──────────────────────────────────────────── */}
      <div className="todo-list-col" style={{ flex: 1, minWidth: 250 }}>

        {/* Header */}
        <div className="todo-col-header">
          <div className="todo-col-title-row">
            <div className="todo-title-left">
              {editingTitle ? (
                <input
                  autoFocus
                  className="page-title-input"
                  defaultValue={pageTitle}
                  onBlur={e => handleTitleSave(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleTitleSave(e.target.value);
                    if (e.key === 'Escape') setEditingTitle(false);
                  }}
                />
              ) : (
                <h1 className="page-title" onClick={() => setEditingTitle(true)} title="Cliquer pour renommer">
                  {pageTitle}
                </h1>
              )}
              <span className="page-count">{visibleCount}</span>
            </div>
            <div className="todo-title-actions">
            {/* Sort button */}
            <div className="todo-sort-wrap" ref={sortRef}>
              <button
                className={`todo-sort-btn${sortMode !== 'manual' ? ' active' : ''}`}
                onClick={() => setSortMenuOpen(v => !v)}
                title="Trier"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 4h12"/>
                  <path d="M4 8h8"/>
                  <path d="M6 12h4"/>
                </svg>
                <span className="todo-sort-label">
                  {sortMode === 'priority' ? 'Priorité' : sortMode === 'date' ? 'Date' : sortMode === 'status' ? 'Statut' : 'Manuel'}
                </span>
              </button>
              {sortMenuOpen && (
                <div className="todo-sort-menu">
                  {[
                    { mode: 'priority', label: 'Priorité', icon: (
                      <svg width="12" height="14" viewBox="0 0 10 12" fill="none">
                        <path d="M1.5 11V1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        <path d="M1.5 2H8.5L6.5 5L8.5 8H1.5V2Z" fill="currentColor"/>
                      </svg>
                    )},
                    { mode: 'date', label: "Date d'échéance", icon: (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" d="M3,8L3,16C3,18.761423999999998,5.2385762,21,8,21L16,21C18.761423999999998,21,21,18.761423999999998,21,16L21,8C21,5.2385762,18.761423999999998,3,16,3L8,3C5.2385762,3,3,5.2385762,3,8ZM5.5251262,18.474871999999998Q4.5,17.449745,4.5,16L4.5,8L19.5,8L19.5,16Q19.5,17.449742999999998,18.474871999999998,18.474871999999998Q17.449742999999998,19.5,16,19.5L8,19.5Q6.550254600000001,19.5,5.5251262,18.474871999999998ZM19.174026,6.5Q18.921929,5.9721839,18.474871999999998,5.5251262Q17.449745,4.5,16,4.5L8,4.5Q6.5502524,4.5,5.5251262,5.5251262Q5.0780674999999995,5.9721849,4.8259716,6.5L19.174026,6.5ZM7.583333,10.5L8.4166665,10.5L8.4166665,12.166666L7.583333,12.166666ZM11.583333,10.5L12.416666,10.5L12.416666,12.166666L11.583333,12.166666ZM15.583333,10.5L16.416666,10.5L16.416666,12.166666L15.583333,12.166666ZM7.583333,14.5L8.4166665,14.5L8.4166665,16.166666L7.583333,16.166666ZM11.583333,14.5L12.416666,14.5L12.416666,16.166666L11.583333,16.166666Z"/>
                      </svg>
                    )},
                    { mode: 'status', label: 'Statut', icon: (
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="1.5" y="1.5" width="13" height="13" rx="3"/>
                        <path d="M5 8.5L7 10.5L11 5.5"/>
                      </svg>
                    )},
                    { mode: 'manual', label: 'Manuel', icon: (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2"/>
                        <path d="M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v6"/>
                        <path d="M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8"/>
                        <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-5.9-2.4L3.3 16.8a2 2 0 0 1 3-2.5L8 16"/>
                      </svg>
                    )},
                  ].map(opt => (
                    <button
                      key={opt.mode}
                      className={`todo-sort-opt${sortMode === opt.mode ? ' selected' : ''}`}
                      onClick={() => { setSortMode(opt.mode); setSortMenuOpen(false); }}
                    >
                      <span className="todo-sort-opt-icon">{opt.icon}</span>
                      <span>{opt.label}</span>
                      {sortMode === opt.mode && (
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ marginLeft: 'auto', flexShrink: 0 }}>
                          <path d="M2 6.5L4.5 9L10 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {parentTodos.length > 0 && (
              <button className="todo-expand-all-btn" onClick={toggleAll} title={allCollapsed ? 'Développer tout' : 'Réduire tout'}>
                {allCollapsed ? (
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 6L8 2L12 6"/>
                    <path d="M4 10L8 14L12 10"/>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 2L8 6L12 2"/>
                    <path d="M4 14L8 10L12 14"/>
                  </svg>
                )}
              </button>
            )}
            </div>
          </div>
          <div className="todo-col-header-bottom">
            <div className="todo-status-pills">
              {/* Filtres priorité */}
              {[
                { priority: 'high',   color: '#D52B25', cls: 'prio-high',   label: 'Priorité élevée' },
                { priority: 'medium', color: '#FAA80C', cls: 'prio-medium', label: 'Priorité moyenne' },
                { priority: 'low',    color: '#4772FB', cls: 'prio-low',    label: 'Priorité faible'  },
                { priority: null,     color: '#888',    cls: 'prio-none',   label: 'Sans priorité'    },
              ].map(({ priority, color, cls, label }) => (
                <button
                  key={String(priority)}
                  className={`todo-priority-flag ${cls}${!hiddenPriorities.has(priority) ? ' active' : ''}`}
                  style={{ color }}
                  title={label}
                  onClick={() => setHiddenPriorities(prev => {
                    const next = new Set(prev);
                    next.has(priority) ? next.delete(priority) : next.add(priority);
                    return next;
                  })}
                >
                  <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
                    <path d="M1.5 11V1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M1.5 2H8.5L6.5 5L8.5 8H1.5V2Z" fill="currentColor"/>
                  </svg>
                </button>
              ))}
              <div className="todo-priority-sep" />
              {/* Filtre statut — pastilles toggle */}
              {STATUS_PILLS.map(({ status, label, cls }) => (
                <button
                  key={status}
                  className={`todo-status-flag ${cls}${!hiddenStatuses.has(status) ? ' active' : ''}`}
                  title={label}
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
            </div>
          </div>
        </div>

        {/* Task list */}
        <div className="todo-list" ref={listRef} onDragOver={handleListDragOver} onDragLeave={handleListDragLeave} onDrop={e => { if (dragOverId) handleRowDrop(e, dragOverId); }}>
          {/* Inline add field */}
          <div className="todo-add-top">
            <span className="todo-add-top-icon">+</span>
            <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
              <input
                className="todo-add-top-input"
                placeholder="Ajouter une tâche…"
                value={newTaskText}
                onChange={e => handleTopInputChange(e.target.value)}
                onBlur={() => setTimeout(() => setSuggestTop(null), 150)}
                onKeyDown={e => {
                  if (suggestTop) {
                    if (e.key === 'ArrowDown') { e.preventDefault(); setSuggestTop(s => ({ ...s, selIdx: Math.min(s.selIdx + 1, s.matches.length - 1) })); return; }
                    if (e.key === 'ArrowUp')   { e.preventDefault(); setSuggestTop(s => ({ ...s, selIdx: Math.max(s.selIdx - 1, 0) })); return; }
                    if (e.key === 'Enter')     { e.preventDefault(); applyTopSuggest(suggestTop.matches[suggestTop.selIdx]); return; }
                    if (e.key === 'Escape')    { setSuggestTop(null); return; }
                  }
                  if (e.key === 'Enter' && newTaskText.trim()) {
                    const newId = genId();
                    dispatch({
                      type: 'ADD_TODO', id: newId, text: newTaskText.trim(), indent: 0, insertAt: 0, projectId: projectFilter,
                      organizationIds: topOrgIds.length > 0 ? topOrgIds : undefined,
                      talentIds: topTalentIds.length > 0 ? topTalentIds : undefined,
                    });
                    setNewTaskText(''); setTopOrgIds([]); setTopTalentIds([]); setSuggestTop(null);
                    setTimeout(() => {
                      setFocusedIndex(0);
                      setAnchorIndex(null); setCmdSet(new Set());
                      if (inputRefs.current[newId]) inputRefs.current[newId].focus();
                    }, 0);
                  }
                  if (e.key === 'Escape') { setNewTaskText(''); setTopOrgIds([]); setTopTalentIds([]); setSuggestTop(null); e.target.blur(); }
                }}
              />
              {suggestTop && (
                <div className="todo-autocomplete">
                  {suggestTop.matches.map((m, i) => (
                    <div key={m.item.id} className={`todo-ac-opt${i === suggestTop.selIdx ? ' todo-ac-active' : ''}`}
                      onMouseDown={e => e.preventDefault()} onClick={() => applyTopSuggest(m)}>
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
          </div>

          {visibleTodos.length === 0 && !newTaskText && (
            <p className="todo-empty">Aucune tâche.</p>
          )}

          {visibleTodos.map((todo, idx) => {
            const hdrsAtIdx = sectionHeaders.filter(h => h.atIndex === idx);
            const chips    = getChips(todo);
            const dateChip = shortDate(todo.dueDate);
            const past     = isPast(todo.dueDate) && todo.status !== 'done';
            const dateTomorrow = (() => {
              if (!todo.dueDate) return false;
              const d = new Date(todo.dueDate), now = new Date();
              const ds = new Date(d.getFullYear(), d.getMonth(), d.getDate());
              const ns = new Date(now.getFullYear(), now.getMonth(), now.getDate());
              return Math.round((ds - ns) / 86400000) === 1;
            })();
            const dateFuture = (() => {
              if (!todo.dueDate) return false;
              const d = new Date(todo.dueDate), now = new Date();
              const ds = new Date(d.getFullYear(), d.getMonth(), d.getDate());
              const ns = new Date(now.getFullYear(), now.getMonth(), now.getDate());
              return Math.round((ds - ns) / 86400000) > 1;
            })();

            const row = (
              <div
                key={todo.id}
                className={[
                  'todo-row',
                  isHighlighted(idx) ? 'todo-selected' : '',
                  focusedIndex === idx ? 'todo-focused' : '',
                  todo.status === 'done' ? 'todo-done' : todo.status === 'in-progress' ? 'todo-in-progress' : '',
                  draggedId  === todo.id ? 'todo-dragging'  : '',
                  (dragOverId === todo.id && dragOverPos === 'before') ? 'todo-drag-before' : '',
                  (dragOverId === todo.id && dragOverPos === 'after')  ? 'todo-drag-after'  : '',
                  todo.indent > 0 ? 'todo-subtask' : '',
                  (todo.indent === 0 && getHasSubtasks(todo.id) && !collapsedIds.has(todo.id)) ? 'todo-parent-expanded' : '',
                  (todo.indent > 0 && (!visibleTodos[idx + 1] || visibleTodos[idx + 1].indent === 0)) ? 'todo-subtask-last' : '',
                ].filter(Boolean).join(' ')}
                style={{ paddingLeft: `${28 + todo.indent * 28}px` }}
                data-todo-id={todo.id}
                onMouseDown={e => handleTaskMouseDown(e, idx)}
                onMouseEnter={() => handleRowMouseEnter(idx)}
                onDrop={e => handleRowDrop(e, todo.id)}
              >
                {/* Line number */}
                <span className="todo-line-num">{idx + 1}</span>

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
                    {collapsedIds.has(todo.id) ? (
                      /* Réduit : chevron pointe vers la droite */
                      <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 3L11 8L6 13"/>
                      </svg>
                    ) : (
                      /* Développé : chevron pointe vers le bas */
                      <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6L8 11L13 6"/>
                      </svg>
                    )}
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
                    onBlur={() => {
                      setTimeout(() => setSuggest(null), 150);
                      // Auto-delete empty tasks (unless parent with non-empty subtasks)
                      setTimeout(() => {
                        if (todo.text.trim() !== '') return;
                        if (todo.indent === 0) {
                          // Check if has non-empty subtasks
                          const tIdx = state.todos.findIndex(t => t.id === todo.id);
                          if (tIdx !== -1) {
                            for (let i = tIdx + 1; i < state.todos.length && state.todos[i].indent > 0; i++) {
                              if (state.todos[i].text.trim() !== '') return; // keep parent
                            }
                          }
                        }
                        dispatch({ type: 'DELETE_TODOS', ids: [todo.id] });
                      }, 200);
                    }}
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

                {/* Date label (text only) */}
                {dateChip && (
                  <span className={`todo-date-label${past ? ' todo-date-overdue' : dateTomorrow ? ' todo-date-tomorrow' : dateFuture ? ' todo-date-future' : ''}`}>
                    {dateChip}
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

            if (hdrsAtIdx.length > 0) {
              return (
                <React.Fragment key={todo.id}>
                  {hdrsAtIdx.map(h => (
                    <div
                      key={`section-${h.status}`}
                      className={`todo-section-hdr todo-section-hdr-${h.status}`}
                      onClick={() => setCollapsedSections(prev => {
                        const next = new Set(prev);
                        next.has(h.status) ? next.delete(h.status) : next.add(h.status);
                        return next;
                      })}
                    >
                      {collapsedSections.has(h.status) ? (
                        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 3L11 8L6 13"/>
                        </svg>
                      ) : (
                        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6L8 11L13 6"/>
                        </svg>
                      )}
                      <StatusIcon status={h.status} />
                      <span>{h.label}</span>
                      <span className="todo-section-count">{h.count}</span>
                    </div>
                  ))}
                  {row}
                </React.Fragment>
              );
            }
            return row;
          })}

          {/* Headers for collapsed sections (no tasks rendered after them) */}
          {sectionHeaders
            .filter(h => h.atIndex >= visibleTodos.length)
            .map(hdr => (
              <div
                key={`section-${hdr.status}`}
                className={`todo-section-hdr todo-section-hdr-${hdr.status}`}
                onClick={() => setCollapsedSections(prev => {
                  const next = new Set(prev);
                  next.has(hdr.status) ? next.delete(hdr.status) : next.add(hdr.status);
                  return next;
                })}
              >
                {collapsedSections.has(hdr.status) ? (
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 3L11 8L6 13"/>
                  </svg>
                ) : (
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6L8 11L13 6"/>
                  </svg>
                )}
                <StatusIcon status={hdr.status} />
                <span>{hdr.label}</span>
                <span className="todo-section-count">{hdr.count}</span>
              </div>
            ))}

        </div>


      </div>

      {/* ── Resize divider ────────────────────────────────────────────── */}
      <div className="todo-divider" onMouseDown={handleDividerMouseDown} />

      {/* ── Right column: detail panel ────────────────────────────────── */}
      <div className="todo-detail-col" ref={detailRef} style={{ width: rightWidth, flexShrink: 0 }}>
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
