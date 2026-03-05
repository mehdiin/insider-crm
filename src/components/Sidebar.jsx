import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { genId } from '../utils/id';

// SVG icons (stroke, 20×20 viewBox 0 0 24 24)
const ICONS = {
  contact: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  prospection: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2"/>
      <line x1="12" y1="2" x2="12" y2="6"/>
      <line x1="12" y1="18" x2="12" y2="22"/>
      <line x1="2" y1="12" x2="6" y2="12"/>
      <line x1="18" y1="12" x2="22" y2="12"/>
    </svg>
  ),
  negociation: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m11 17 2 2a1 1 0 1 0 3-3"/>
      <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/>
      <path d="m21 3 1 11h-1"/>
      <path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/>
      <path d="M3 4h8"/>
    </svg>
  ),
  projets: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  ),
  taches: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4"/>
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  ),
};

const SECTIONS = [
  { id: 'contact',     label: 'Contact' },
  { id: 'prospection', label: 'Prospection' },
  { id: 'negociation', label: 'Négociation' },
  { id: 'projets',    label: 'Projets' },
  { id: 'taches',      label: 'Tâches' },
];

const DEFAULT_STAGES = {
  negociation: ['Lead', 'Proposition', 'Négociation', 'Signé'],
  projets:    ['Brief reçu', 'Proposition', 'Accord', 'En cours', 'Livré'],
};

export default function Sidebar({ activeSection, activeSubView, onSectionChange, onSubViewChange, darkMode, onToggleDark }) {
  const { state, dispatch } = useApp();
  const [showAddFor,      setShowAddFor]      = useState(null); // 'negociation' | 'projets'
  const [newBoardName,    setNewBoardName]    = useState('');
  const [openTaches,      setOpenTaches]      = useState(true);
  const [openCollabs,     setOpenCollabs]     = useState(true);

  // ── Create new pipeline ───────────────────────────────────────────────────

  function commitNewBoard(section) {
    const name = newBoardName.trim();
    if (!name) { setShowAddFor(null); return; }
    const id     = genId();
    const stages = DEFAULT_STAGES[section].map(n => ({ id: genId(), name: n }));
    dispatch({ type: 'ADD_BOARD', id, name, section, stages });
    onSubViewChange(id);
    setNewBoardName('');
    setShowAddFor(null);
  }

  // ── Board item with optional delete ──────────────────────────────────────

  function BoardItem({ board, siblings }) {
    const isActive = activeSubView === board.id;
    return (
      <div className={`sp-item-row${isActive ? ' active' : ''}`}>
        <button
          className={`sp-item${isActive ? ' active' : ''}`}
          onClick={() => onSubViewChange(board.id)}
        >
          <span className="sp-item-label">{board.name}</span>
          <span className="sp-count">{state.cards.filter(c => c.boardId === board.id).length}</span>
        </button>
        {siblings.length > 1 && (
          <button
            className="sp-del-btn"
            title="Supprimer"
            onClick={() => {
              dispatch({ type: 'DELETE_BOARD', id: board.id });
              if (isActive) {
                const next = siblings.find(b => b.id !== board.id);
                if (next) onSubViewChange(next.id);
              }
            }}
          >×</button>
        )}
      </div>
    );
  }

  // ── Add pipeline input ────────────────────────────────────────────────────

  function AddPipelineArea({ section }) {
    if (showAddFor === section) {
      return (
        <div className="sp-add-input">
          <input
            autoFocus
            placeholder="Nom du pipeline…"
            value={newBoardName}
            onChange={e => setNewBoardName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter')  commitNewBoard(section);
              if (e.key === 'Escape') { setShowAddFor(null); setNewBoardName(''); }
            }}
            onBlur={() => commitNewBoard(section)}
          />
        </div>
      );
    }
    return (
      <button className="sp-add-btn" onClick={() => { setShowAddFor(section); setNewBoardName(''); }}>
        + Nouveau pipeline
      </button>
    );
  }

  // ── Sub-panel content per section ─────────────────────────────────────────

  function renderContent() {
    // ── Contact ──────────────────────────────────────────────────────────────
    if (activeSection === 'contact') {
      return (
        <>
          <div className="sp-header">Contact</div>
          <div className="sp-nav">
            <button
              className={`sp-item${activeSubView === 'organizations' ? ' active' : ''}`}
              onClick={() => onSubViewChange('organizations')}
            >
              <span className="sp-item-label">Marques</span>
              <span className="sp-count">{state.organizations.length}</span>
            </button>
            <button
              className={`sp-item${activeSubView === 'talents' ? ' active' : ''}`}
              onClick={() => onSubViewChange('talents')}
            >
              <span className="sp-item-label">Talents</span>
              <span className="sp-count">{state.talents.length}</span>
            </button>
          </div>
        </>
      );
    }

    // ── Prospection ──────────────────────────────────────────────────────────
    if (activeSection === 'prospection') {
      const boards = state.boards.filter(b => b.section === 'prospection');
      return (
        <>
          <div className="sp-header">Prospection</div>
          <div className="sp-nav">
            {boards.map(b => (
              <button
                key={b.id}
                className={`sp-item${activeSubView === b.id ? ' active' : ''}`}
                onClick={() => onSubViewChange(b.id)}
              >
                <span className="sp-item-label">{b.name}</span>
                <span className="sp-count">{state.cards.filter(c => c.boardId === b.id).length}</span>
              </button>
            ))}
          </div>
        </>
      );
    }

    // ── Négociation ──────────────────────────────────────────────────────────
    if (activeSection === 'negociation') {
      const boards = state.boards.filter(b => b.section === 'negociation');
      return (
        <>
          <div className="sp-header">Négociation</div>
          <div className="sp-nav">
            {boards.map(b => <BoardItem key={b.id} board={b} siblings={boards} />)}
            <AddPipelineArea section="negociation" />
          </div>
        </>
      );
    }

    // ── Projets ─────────────────────────────────────────────────────────────
    if (activeSection === 'projets') {
      const influenceBoards = state.boards.filter(b => b.section === 'projets');
      return (
        <>
          <div className="sp-header">Projets</div>
          <div className="sp-section-label">Influence</div>
          <div className="sp-nav">
            {influenceBoards.map(b => <BoardItem key={b.id} board={b} siblings={influenceBoards} />)}
            <AddPipelineArea section="projets" />
          </div>
        </>
      );
    }

    // ── Tâches ────────────────────────────────────────────────────────────────
    if (activeSection === 'taches') {
      const pendingCount   = state.todos.filter(t => t.status !== 'done').length;
      const linkedProjIds  = [...new Set(state.todos.filter(t => t.projectId).map(t => t.projectId))];
      const linkedProjects = linkedProjIds.map(id => state.projects.find(p => p.id === id)).filter(Boolean);

      const orgsWithTasks = state.organizations
        .map(o => ({ ...o, _type: 'org', cnt: state.todos.filter(t => (t.organizationIds || []).includes(o.id) && t.status !== 'done').length }))
        .filter(o => o.cnt > 0);
      const talentsWithTasks = state.talents
        .map(t => ({ ...t, _type: 'talent', cnt: state.todos.filter(todo => (todo.talentIds || []).includes(t.id) && todo.status !== 'done').length }))
        .filter(t => t.cnt > 0);
      const collabs = [...orgsWithTasks, ...talentsWithTasks].sort((a, b) => b.cnt - a.cnt);
      const hasCollabs = collabs.length > 0;

      return (
        <>
          <button className="sp-header sp-header-toggle" onClick={() => setOpenTaches(v => !v)}>
            <svg className={`sp-chevron${openTaches ? ' open' : ''}`} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            Tâches
          </button>
          {openTaches && (
            <div className="sp-nav">
              <button
                className={`sp-item${activeSubView === 'all' ? ' active' : ''}`}
                onClick={() => onSubViewChange('all')}
              >
                <span className="sp-item-label">Toutes les tâches</span>
                <span className="sp-count">{pendingCount}</span>
              </button>

              {linkedProjects.length > 0 && (
                <>
                  <div className="sp-section-label">Projets</div>
                  {linkedProjects.map(proj => {
                    const cnt = state.todos.filter(t => t.projectId === proj.id && t.status !== 'done').length;
                    return (
                      <button
                        key={proj.id}
                        className={`sp-item${activeSubView === proj.id ? ' active' : ''}`}
                        onClick={() => onSubViewChange(proj.id)}
                      >
                        <span className="sp-item-label">{proj.number}</span>
                        <span className="sp-count">{cnt}</span>
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          )}

          {hasCollabs && (
            <>
              <button className="sp-header sp-header-toggle" onClick={() => setOpenCollabs(v => !v)}>
                <svg className={`sp-chevron${openCollabs ? ' open' : ''}`} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                Marque <span className="sp-collab-x">×</span> Talent
              </button>
              {openCollabs && (
                <div className="sp-nav">
                  {collabs.map(item => (
                    <button
                      key={item.id}
                      className={`sp-item${activeSubView === item.id ? ' active' : ''}`}
                      onClick={() => onSubViewChange(item.id)}
                    >
                      <span className="sp-item-label">{item.name}</span>
                      <span className="sp-count">{item.cnt}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      );
    }

    return null;
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <aside className="app-sidebar">

      {/* ── Icon bar ──────────────────────────────────────────────────────── */}
      <div className="icon-bar">
        <div className="icon-bar-logo">
          <svg width="36" height="19" viewBox="0 0 1786 916" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M937.165 76.3397C958.961 38.5884 994.463 13.6844 1033.76 4.28447C1109.34 -14.0536 1187.86 27.8503 1213.69 102.866L1315.16 397.564L1315.2 397.498L1349.55 497.353L1327.19 376.74L1500.62 76.3397C1542.73 3.41634 1635.97 -21.5689 1708.9 20.5334C1781.82 62.6357 1806.8 155.882 1764.7 228.806L1412.54 838.773C1405.47 851.008 1396.97 861.893 1387.36 871.339C1371.54 887.102 1351.99 899.617 1329.46 907.377C1249.84 934.791 1163.07 892.472 1135.66 812.856L999.853 418.448L1022.19 538.929L849.08 838.773C806.977 911.696 713.731 936.682 640.807 894.579C567.884 852.477 542.898 759.23 585.001 686.307L937.165 76.3397Z" fill="white"/>
            <path d="M581.591 20.5334C508.668 -21.5689 415.421 3.41633 373.319 76.3397L21.1539 686.307C-20.9484 759.23 4.03702 852.477 76.9604 894.579C149.884 936.682 243.13 911.696 285.233 838.773L637.397 228.806C679.5 155.882 654.514 62.6357 581.591 20.5334Z" fill="white"/>
          </svg>
        </div>
        <nav className="icon-bar-nav">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              className={`icon-bar-item${activeSection === s.id ? ' active' : ''}`}
              onClick={() => onSectionChange(s.id)}
              data-tooltip={s.label}
            >
              {ICONS[s.id]}
            </button>
          ))}
        </nav>

        {/* ── Dark mode toggle ─────────────────────────────────────────── */}
        <div className="icon-bar-bottom">
          <button
            className="icon-bar-item"
            onClick={onToggleDark}
            data-tooltip={darkMode ? 'Mode clair' : 'Mode sombre'}
          >
            {darkMode ? (
              /* Sun icon */
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4"/>
                <line x1="12" y1="2" x2="12" y2="5"/>
                <line x1="12" y1="19" x2="12" y2="22"/>
                <line x1="4.22" y1="4.22" x2="6.34" y2="6.34"/>
                <line x1="17.66" y1="17.66" x2="19.78" y2="19.78"/>
                <line x1="2" y1="12" x2="5" y2="12"/>
                <line x1="19" y1="12" x2="22" y2="12"/>
                <line x1="4.22" y1="19.78" x2="6.34" y2="17.66"/>
                <line x1="17.66" y1="6.34" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              /* Moon icon */
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── Sub-panel ─────────────────────────────────────────────────────── */}
      <div className="sub-panel">
        {renderContent()}
      </div>

    </aside>
  );
}
