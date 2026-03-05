import { useState, useRef, useEffect } from 'react';
import SearchableSelect from './SearchableSelect';
import DateTimePicker from './DateTimePicker';
import { playCompletionSound, playInProgressSound } from '../utils/sound';
import { genId } from '../utils/id';

// ── Date helpers ───────────────────────────────────────────────────────────────

function formatDueDateShort(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  const hasTime = d.getHours() !== 0 || d.getMinutes() !== 0;
  const dateStr = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  const timeStr = hasTime
    ? ` ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
    : '';
  return dateStr + timeStr;
}

function isOverdue(iso) {
  if (!iso) return false;
  return new Date(iso) < new Date();
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
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M3,8L3,16C3,18.761423999999998,5.2385762,21,8,21L16,21C18.761423999999998,21,21,18.761423999999998,21,16L21,8C21,5.2385762,18.761423999999998,3,16,3L8,3C5.2385762,3,3,5.2385762,3,8ZM5.5251262,18.474871999999998Q4.5,17.449745,4.5,16L4.5,8L19.5,8L19.5,16Q19.5,17.449742999999998,18.474871999999998,18.474871999999998Q17.449742999999998,19.5,16,19.5L8,19.5Q6.550254600000001,19.5,5.5251262,18.474871999999998ZM19.174026,6.5Q18.921929,5.9721839,18.474871999999998,5.5251262Q17.449745,4.5,16,4.5L8,4.5Q6.5502524,4.5,5.5251262,5.5251262Q5.0780674999999995,5.9721849,4.8259716,6.5L19.174026,6.5ZM7.583333,10.5L8.4166665,10.5L8.4166665,12.166666L7.583333,12.166666ZM11.583333,10.5L12.416666,10.5L12.416666,12.166666L11.583333,12.166666ZM15.583333,10.5L16.416666,10.5L16.416666,12.166666L15.583333,12.166666ZM7.583333,14.5L8.4166665,14.5L8.4166665,16.166666L7.583333,16.166666ZM11.583333,14.5L12.416666,14.5L12.416666,16.166666L11.583333,16.166666Z"/>
    </svg>
  );
}

function IconAssign() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M8.1200948,6.1689582000000005Q8.1200938,4.5618536,9.2564893,3.4254578Q10.3928843,2.2890625,11.9999924,2.2890625Q13.607098,2.2890625,14.743494,3.4254581Q15.87989,4.5618527,15.87989,6.1689599Q15.87989,7.7760668,14.743494,8.9124613Q13.607098,10.0488582,11.9999924,10.0488582Q10.3928843,10.0488577,9.2564898,8.9124613Q8.1200943,7.7760663,8.1200948,6.1689582000000005ZM10.2558513,7.9130983Q10.9783001,8.6355448,11.9999924,8.6355448Q13.021681,8.6355448,13.744129,7.9130983Q14.466577,7.1906505,14.466577,6.1689591Q14.466577,5.1472676,13.744129,4.4248209Q13.021683,3.7023753,11.9999924,3.7023754Q10.9782991,3.7023754,10.2558532,4.4248209Q9.5334063,5.1472671000000005,9.5334063,6.1689603Q9.5334063,7.1906514,10.2558513,7.9130983ZM4.803901,13.2931285Q5.7745266,12.3225035,7.032937,11.7902403Q8.3356771,11.2392282,9.7624569,11.2392282L14.237546,11.2392292Q15.664324,11.2392292,16.967063,11.7902403Q18.225472,12.3225035,19.196098,13.2931295Q20.166723,14.2637545,20.698988,15.5221645Q21.25,16.8249065,21.25,18.2516835Q21.25,19.6734235,20.244673,20.6787475Q19.239349,21.6840745,17.817611,21.6840745L6.1823893000000005,21.6840745Q4.7606487,21.6840745,3.7553235000000003,20.6787475Q2.75,19.6734255,2.75,18.2516835Q2.75,16.8249065,3.30101359,15.5221655Q3.8332783,14.2637515,4.803901,13.2931285ZM4.2412109000000004,18.2516995Q4.2412109000000004,19.0558585,4.809836600000001,19.6244855Q5.3784614,20.1931075,6.1826205000000005,20.1931075L17.817842,20.1931075Q18.622004,20.1931075,19.190624,19.6244855Q19.759247,19.0558585,19.759247,18.2516995Q19.759247,15.9646305,18.142046,14.3474285Q16.524843,12.7302245,14.237774,12.7302245L9.7626882,12.7302245Q7.4756174,12.7302245,5.8584142,14.3474285Q4.2412109000000004,15.9646305,4.2412109000000004,18.2516995ZM13.25293,13.5612795L13.263672,13.5612795Q13.571865,13.5612795,13.78125,13.7868655L15.82666,16.0363765Q16.005066,16.2288735,16.015137,16.4907225Q16.015636999999998,16.5039735,16.015625,16.5173335Q16.015625,16.8044245,15.81543,17.010253499999997L13.712402,19.1843265Q13.508365,19.3939915,13.216309,19.3979495L13.205566,19.3979495Q12.918823,19.3979455,12.7133789,19.1977535Q12.5036049,18.9936085,12.4995117,18.7016605L12.4995117,18.6909175Q12.4995136,18.4041745,12.7001953,18.197753499999997L13.630859,17.2238765L9.2061768,17.2238765C8.815896500000001,17.2238765,8.4995117,16.9074915,8.4995117,16.517211500000002C8.4995117,16.126932500000002,8.815896500000001,15.8105465,9.2061768,15.8105465L13.678711,15.8105465L12.7456055,14.7487795Q12.5606441,14.5492115,12.5566406,14.2783205L12.5566406,14.2675785Q12.5566416,13.9593645,12.783203,13.7497555Q12.982334,13.5652005,13.25293,13.5612795Z"/>
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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef  = useRef(null);
  const subInputRefs   = useRef({});

  // Close date picker on outside click
  useEffect(() => {
    if (!showDatePicker) return;
    function handler(e) {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target)) {
        setShowDatePicker(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showDatePicker]);

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

  const dueDateLabel = formatDueDateShort(todo.dueDate);
  const overdue      = isOverdue(todo.dueDate) && todo.status !== 'done';

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

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="detail-panel">

      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <div className="detail-toolbar">

        {/* Left-side group — fixé au bord gauche */}
        <div className="detail-tb-left">

          <button
            className={`detail-check${todo.status === 'done' ? ' detail-check-done' : todo.status === 'in-progress' ? ' detail-check-inprogress' : ''}`}
            style={todo.status === 'pending' && pBorderColor ? { borderColor: pBorderColor } : {}}
            onClick={() => {
              if (nextStatus === 'in-progress') playInProgressSound();
              else if (nextStatus === 'done') playCompletionSound();
              update({ status: nextStatus });
            }}
            title={statusTitle}
          >
            {todo.status === 'done' && (
              <svg width="14" height="12" viewBox="0 0 14 12">
                <path d="M1 6l4 4L13 1" stroke="currentColor" strokeWidth="2.2"
                  fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
            {todo.status === 'in-progress' && (
              <svg width="14" height="5" viewBox="0 0 14 5">
                <circle cx="2.5"  cy="2.5" r="2" fill="currentColor"/>
                <circle cx="7"    cy="2.5" r="2" fill="currentColor"/>
                <circle cx="11.5" cy="2.5" r="2" fill="currentColor"/>
              </svg>
            )}
          </button>

          <span className="detail-toolbar-sep" />

          <button className="detail-tb-btn detail-tb-date" title="Date d'échéance">
            <IconCalendar />
            <span>Date d'échéance</span>
          </button>

        </div>

        {/* Right-side actions — toujours collées au bord droit */}
        <div className="detail-tb-actions">
          <button className="detail-tb-btn detail-tb-icon" title="Assigner">
            <IconAssign />
          </button>
          <button
            className="detail-tb-btn detail-tb-icon"
            onClick={cyclePriority}
            title={todo.priority ? PRIORITY_LABEL[todo.priority] : 'Aucune priorité'}
          >
            <IconFlag priority={todo.priority} />
          </button>
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
        {subtasks.map(sub => {
          const subNext = sub.status === 'pending'     ? 'in-progress'
                        : sub.status === 'in-progress' ? 'done'
                        : 'pending';
          return (
            <div key={sub.id} className="detail-subtask-row">
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
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); addSubtask(); }
                  if (e.key === 'Backspace' && sub.text === '') {
                    e.preventDefault();
                    dispatch({ type: 'DELETE_TODOS', ids: [sub.id] });
                  }
                }}
              />
            </div>
          );
        })}
        {todo.indent === 0 && (
          <button className="detail-subtask-add" onClick={addSubtask}>
            + Ajouter une sous-tâche
          </button>
        )}
      </div>

      {/* ── Notes ─────────────────────────────────────────────────────────── */}
      <AutoTextarea
        className="detail-notes"
        value={todo.notes || ''}
        onChange={e => update({ notes: e.target.value })}
        placeholder="Ajoutez une note…"
        minRows={4}
      />

      {/* ── Divider ───────────────────────────────────────────────────────── */}
      <div className="detail-divider" />

      {/* ── Properties ────────────────────────────────────────────────────── */}
      <div className="detail-props">


        {/* Organisation (multi) */}
        <div className="detail-prop-row">
          <span className="detail-prop-label">🏢 Organisation</span>
          <div className="detail-prop-value" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {(todo.organizationIds || []).map(oid => {
              const o = state.organizations.find(x => x.id === oid);
              if (!o) return null;
              return (
                <div key={oid} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ flex: 1, fontSize: 13 }}>{o.name}</span>
                  {!todo.projectId && (
                    <button
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14, padding: '0 2px' }}
                      onClick={() => update({ organizationIds: (todo.organizationIds || []).filter(id => id !== oid) })}
                      title="Retirer"
                    >×</button>
                  )}
                </div>
              );
            })}
            {!todo.projectId && (
              <SearchableSelect
                options={state.organizations.filter(o => !(todo.organizationIds || []).includes(o.id))}
                value={null}
                onChange={id => { if (id) update({ organizationIds: [...(todo.organizationIds || []), id] }); }}
                onCreate={createOrg}
                placeholder="Ajouter une marque…"
              />
            )}
          </div>
        </div>

        {/* Talent (multi) */}
        <div className="detail-prop-row">
          <span className="detail-prop-label">🎬 Talent</span>
          <div className="detail-prop-value" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {(todo.talentIds || []).map(tid => {
              const t = state.talents.find(x => x.id === tid);
              if (!t) return null;
              return (
                <div key={tid} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ flex: 1, fontSize: 13 }}>{t.name}</span>
                  {!todo.projectId && (
                    <button
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14, padding: '0 2px' }}
                      onClick={() => update({ talentIds: (todo.talentIds || []).filter(id => id !== tid) })}
                      title="Retirer"
                    >×</button>
                  )}
                </div>
              );
            })}
            {!todo.projectId && (
              <SearchableSelect
                options={state.talents.filter(t => !(todo.talentIds || []).includes(t.id))}
                value={null}
                onChange={id => { if (id) update({ talentIds: [...(todo.talentIds || []), id] }); }}
                onCreate={createTalent}
                placeholder="Ajouter un talent…"
              />
            )}
          </div>
        </div>

        {/* Project */}
        <div className="detail-prop-row">
          <span className="detail-prop-label">📊 Projet</span>
          <div className="detail-prop-value">
            <SearchableSelect
              options={state.projects.map(p => ({ id: p.id, name: p.number }))}
              value={todo.projectId}
              onChange={handleProjectChange}
              placeholder="Aucun"
            />
          </div>
        </div>

        {todo.projectId && (
          <p className="detail-prop-note">
            Organisation et talent hérités du projet.
          </p>
        )}
      </div>
    </div>
  );
}
