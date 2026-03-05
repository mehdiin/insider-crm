import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { genId } from '../utils/id';

export default function Talents() {
  const { state, dispatch } = useApp();
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [newName, setNewName] = useState('');

  const startEdit = (t) => { setEditingId(t.id); setEditValue(t.name); };
  const saveEdit = () => {
    if (editValue.trim()) dispatch({ type: 'UPDATE_TALENT', id: editingId, name: editValue.trim() });
    setEditingId(null);
  };

  const addTalent = () => {
    if (newName.trim()) {
      dispatch({ type: 'ADD_TALENT', id: genId(), name: newName.trim() });
      setNewName('');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">🎬 Talents</h1>
        <span className="page-count">{state.talents.length} talents</span>
      </div>

      <div className="db-table">
        <div className="db-table-head">
          <span className="col-label">Nom du talent</span>
        </div>

        {state.talents.map(talent => (
          <div key={talent.id} className="db-row">
            {editingId === talent.id ? (
              <input
                className="db-edit-input"
                value={editValue}
                autoFocus
                onChange={e => setEditValue(e.target.value)}
                onBlur={saveEdit}
                onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingId(null); }}
              />
            ) : (
              <span className="db-cell-name" onDoubleClick={() => startEdit(talent)}>{talent.name}</span>
            )}
            <div className="db-row-actions">
              <button className="icon-btn" onClick={() => startEdit(talent)} title="Modifier">✏️</button>
              <button className="icon-btn danger" onClick={() => dispatch({ type: 'DELETE_TALENT', id: talent.id })} title="Supprimer">🗑️</button>
            </div>
          </div>
        ))}

        <div className="db-add-row">
          <input
            className="db-add-input"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="+ Nouveau talent..."
            onKeyDown={e => { if (e.key === 'Enter') addTalent(); }}
          />
          {newName.trim() && (
            <button className="btn-primary" onClick={addTalent}>Ajouter</button>
          )}
        </div>
      </div>
    </div>
  );
}
