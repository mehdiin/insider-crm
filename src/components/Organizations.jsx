import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { genId } from '../utils/id';

export default function Organizations() {
  const { state, dispatch } = useApp();
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [newName, setNewName] = useState('');

  const startEdit = (org) => { setEditingId(org.id); setEditValue(org.name); };
  const saveEdit = () => {
    if (editValue.trim()) dispatch({ type: 'UPDATE_ORGANIZATION', id: editingId, name: editValue.trim() });
    setEditingId(null);
  };

  const addOrg = () => {
    if (newName.trim()) {
      dispatch({ type: 'ADD_ORGANIZATION', id: genId(), name: newName.trim() });
      setNewName('');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">🏢 Organisations</h1>
        <span className="page-count">{state.organizations.length} organisations</span>
      </div>

      <div className="db-table">
        <div className="db-table-head">
          <span className="col-label">Nom de l'organisation</span>
        </div>

        {state.organizations.map(org => (
          <div key={org.id} className="db-row">
            {editingId === org.id ? (
              <input
                className="db-edit-input"
                value={editValue}
                autoFocus
                onChange={e => setEditValue(e.target.value)}
                onBlur={saveEdit}
                onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingId(null); }}
              />
            ) : (
              <span className="db-cell-name" onDoubleClick={() => startEdit(org)}>{org.name}</span>
            )}
            <div className="db-row-actions">
              <button className="icon-btn" onClick={() => startEdit(org)} title="Modifier">✏️</button>
              <button className="icon-btn danger" onClick={() => dispatch({ type: 'DELETE_ORGANIZATION', id: org.id })} title="Supprimer">🗑️</button>
            </div>
          </div>
        ))}

        <div className="db-add-row">
          <input
            className="db-add-input"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="+ Nouvelle organisation..."
            onKeyDown={e => { if (e.key === 'Enter') addOrg(); }}
          />
          {newName.trim() && (
            <button className="btn-primary" onClick={addOrg}>Ajouter</button>
          )}
        </div>
      </div>
    </div>
  );
}
