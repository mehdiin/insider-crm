import { useState, useEffect } from 'react';
import { useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Organizations from './components/Organizations';
import Talents from './components/Talents';
import KanbanBoard from './components/KanbanBoard';
import TodoList from './components/TodoList';

export default function App() {
  const { state } = useApp();

  const [activeSection, setActiveSection] = useState('taches');
  const [activeSubView, setActiveSubView] = useState('all');
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem('crm_dark') === 'true'
  );

  // Apply / remove the "dark" class on <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('crm_dark', String(darkMode));
  }, [darkMode]);

  // ── Section change: reset sub-view to section default ────────────────────
  function handleSectionChange(section) {
    setActiveSection(section);
    switch (section) {
      case 'contact':
        setActiveSubView('organizations');
        break;
      case 'prospection': {
        const first = state.boards.find(b => b.section === 'prospection');
        setActiveSubView(first?.id ?? null);
        break;
      }
      case 'negociation': {
        const first = state.boards.find(b => b.section === 'negociation');
        setActiveSubView(first?.id ?? null);
        break;
      }
      case 'projets': {
        const first = state.boards.find(b => b.section === 'projets');
        setActiveSubView(first?.id ?? null);
        break;
      }
      case 'taches':
      default:
        setActiveSubView('all');
        break;
    }
  }

  // ── Render main content ──────────────────────────────────────────────────
  function renderContent() {
    if (activeSection === 'contact') {
      if (activeSubView === 'talents') return <Talents />;
      return <Organizations />;
    }

    if (activeSection === 'prospection' || activeSection === 'negociation' || activeSection === 'projets') {
      const board = activeSubView
        ? state.boards.find(b => b.id === activeSubView)
        : state.boards.find(b => b.section === activeSection);
      if (board) return <KanbanBoard boardId={board.id} />;
      return (
        <div className="page">
          <p style={{ color: 'var(--text-muted)', marginTop: 40 }}>
            Aucun tableau. Créez un pipeline dans le menu de gauche.
          </p>
        </div>
      );
    }

    if (activeSection === 'taches') {
      const isOrg    = activeSubView?.startsWith('org-');
      const isTalent = activeSubView?.startsWith('tal-');
      const projectFilter = (!isOrg && !isTalent && activeSubView && activeSubView !== 'all') ? activeSubView : null;
      return (
        <TodoList
          projectFilter={projectFilter}
          orgFilter={isOrg ? activeSubView : null}
          talentFilter={isTalent ? activeSubView : null}
        />
      );
    }

    return null;
  }

  const isTodoMode   = activeSection === 'taches';
  const isKanbanMode = ['prospection','negociation','projets'].includes(activeSection);
  const fullHeight   = isTodoMode || isKanbanMode;

  return (
    <div className="app-layout">
      <Sidebar
        activeSection={activeSection}
        activeSubView={activeSubView}
        onSectionChange={handleSectionChange}
        onSubViewChange={setActiveSubView}
        darkMode={darkMode}
        onToggleDark={() => setDarkMode(d => !d)}
      />
      <main className={`app-main${fullHeight ? ' app-main-full' : ''}`}>
        {renderContent()}
      </main>
    </div>
  );
}
