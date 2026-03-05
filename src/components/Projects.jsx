import { useApp } from '../context/AppContext';
import { genId } from '../utils/id';
import SearchableSelect from './SearchableSelect';

export default function Projects() {
  const { state, dispatch } = useApp();

  const addProject = () => {
    dispatch({ type: 'ADD_PROJECT', id: genId(), organizationId: null, talentId: null });
  };

  const createOrg = (name) => {
    const id = genId();
    dispatch({ type: 'ADD_ORGANIZATION', id, name });
    return id;
  };

  const createTalent = (name) => {
    const id = genId();
    dispatch({ type: 'ADD_TALENT', id, name });
    return id;
  };

  const updateProject = (id, updates) => dispatch({ type: 'UPDATE_PROJECT', id, updates });
  const deleteProject = (id) => dispatch({ type: 'DELETE_PROJECT', id });

  const getOrgName = (id) => state.organizations.find(o => o.id === id)?.name || '—';
  const getTalentName = (id) => state.talents.find(t => t.id === id)?.name || '—';

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">📊 Projets influence</h1>
        <button className="btn-primary" onClick={addProject}>+ Nouveau projet</button>
      </div>

      <div className="projects-table">
        <div className="projects-head">
          <div className="proj-col proj-col-num">N° Projet</div>
          <div className="proj-col proj-col-org">Organisation</div>
          <div className="proj-col proj-col-talent">Talent</div>
          <div className="proj-col proj-col-actions"></div>
        </div>

        {state.projects.length === 0 && (
          <div className="empty-state">
            <p>Aucun projet pour l'instant.</p>
            <button className="btn-primary" onClick={addProject}>Créer le premier projet</button>
          </div>
        )}

        {state.projects.map(project => (
          <div key={project.id} className="projects-row">
            <div className="proj-col proj-col-num">
              <span className="project-number">{project.number}</span>
            </div>
            <div className="proj-col proj-col-org">
              <SearchableSelect
                options={state.organizations}
                value={project.organizationId}
                onChange={id => updateProject(project.id, { organizationId: id })}
                onCreate={createOrg}
                placeholder="Sélectionner une org..."
              />
            </div>
            <div className="proj-col proj-col-talent">
              <SearchableSelect
                options={state.talents}
                value={project.talentId}
                onChange={id => updateProject(project.id, { talentId: id })}
                onCreate={createTalent}
                placeholder="Sélectionner un talent..."
              />
            </div>
            <div className="proj-col proj-col-actions">
              <button className="icon-btn danger" onClick={() => deleteProject(project.id)} title="Supprimer">🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
