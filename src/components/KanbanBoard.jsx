import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { genId } from '../utils/id';

// ── KanbanCard ────────────────────────────────────────────────────────────────
function KanbanCard({ card, isDragging, onDragStart, onDragEnd, dispatch, boardId }) {
  const [editing, setEditing] = useState(false);
  const [title,   setTitle]   = useState(card.title);

  function commitEdit() {
    const trimmed = title.trim();
    if (trimmed && trimmed !== card.title) {
      dispatch({ type: 'UPDATE_CARD', id: card.id, updates: { title: trimmed } });
    } else {
      setTitle(card.title);
    }
    setEditing(false);
  }

  return (
    <div
      className={`kb-card${isDragging ? ' is-dragging' : ''}`}
      draggable
      onDragStart={e => { e.stopPropagation(); onDragStart(e, card.id, card.stageId); }}
      onDragEnd={onDragEnd}
    >
      {editing ? (
        <input
          className="kb-card-edit-input"
          value={title}
          autoFocus
          onChange={e => setTitle(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={e => {
            if (e.key === 'Enter')  commitEdit();
            if (e.key === 'Escape') { setTitle(card.title); setEditing(false); }
          }}
          onClick={e => e.stopPropagation()}
        />
      ) : (
        <div className="kb-card-body">
          <span className="kb-card-title" onDoubleClick={() => { setTitle(card.title); setEditing(true); }}>
            {card.title || <span className="kb-card-placeholder">Sans titre</span>}
          </span>
          <button
            className="kb-card-del"
            title="Supprimer"
            onMouseDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); dispatch({ type: 'DELETE_CARD', id: card.id }); }}
          >×</button>
        </div>
      )}
    </div>
  );
}

// ── KanbanColumn ──────────────────────────────────────────────────────────────
function KanbanColumn({
  stage, cards, stageIndex, totalStages,
  isDragOver, dropIndex, draggingCardId,
  onDragStartCard, onDragEndCard,
  onDragOverColumn, onDropOnColumn, onDragLeaveColumn,
  boardId, dispatch,
}) {
  const [editingName, setEditingName] = useState(false);
  const [nameVal,     setNameVal]     = useState(stage.name);
  const [addingCard,  setAddingCard]  = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const bodyRef = useRef(null);

  function commitName() {
    const t = nameVal.trim();
    if (t && t !== stage.name) dispatch({ type: 'UPDATE_STAGE', id: stage.id, updates: { name: t } });
    else setNameVal(stage.name);
    setEditingName(false);
  }

  function commitAddCard() {
    if (newCardTitle.trim()) {
      dispatch({ type: 'ADD_CARD', id: genId(), boardId, stageId: stage.id, title: newCardTitle.trim() });
    }
    setNewCardTitle('');
    setAddingCard(false);
  }

  // Build rendered card list with drop indicator injected
  function renderCards() {
    const items = [];
    for (let i = 0; i <= cards.length; i++) {
      // Drop indicator
      if (isDragOver && dropIndex === i) {
        items.push(<div key={`drop-${i}`} className="kb-drop-indicator" />);
      }
      if (i < cards.length) {
        const card = cards[i];
        items.push(
          <KanbanCard
            key={card.id}
            card={card}
            isDragging={card.id === draggingCardId}
            onDragStart={onDragStartCard}
            onDragEnd={onDragEndCard}
            dispatch={dispatch}
            boardId={boardId}
          />
        );
      }
    }
    return items;
  }

  return (
    <div className={`kb-column${isDragOver ? ' drag-over' : ''}`}>
      {/* Column header */}
      <div className="kb-col-header">
        {editingName ? (
          <input
            className="kb-stage-input"
            value={nameVal}
            autoFocus
            onChange={e => setNameVal(e.target.value)}
            onBlur={commitName}
            onKeyDown={e => {
              if (e.key === 'Enter')  commitName();
              if (e.key === 'Escape') { setNameVal(stage.name); setEditingName(false); }
            }}
          />
        ) : (
          <span className="kb-col-name" onDoubleClick={() => { setNameVal(stage.name); setEditingName(true); }}>
            {stage.name}
          </span>
        )}
        <span className="kb-col-count">{cards.length}</span>
        <div className="kb-col-actions">
          <button
            className="kb-act-btn" title="Déplacer à gauche"
            disabled={stageIndex === 0}
            onClick={() => dispatch({ type: 'MOVE_STAGE', boardId, fromIndex: stageIndex, toIndex: stageIndex - 1 })}
          >‹</button>
          <button
            className="kb-act-btn" title="Déplacer à droite"
            disabled={stageIndex === totalStages - 1}
            onClick={() => dispatch({ type: 'MOVE_STAGE', boardId, fromIndex: stageIndex, toIndex: stageIndex + 1 })}
          >›</button>
          <button
            className="kb-act-btn danger" title="Supprimer l'étape"
            onClick={() => dispatch({ type: 'DELETE_STAGE', id: stage.id, boardId })}
          >×</button>
        </div>
      </div>

      {/* Cards */}
      <div
        ref={bodyRef}
        className="kb-col-body"
        onDragOver={e => onDragOverColumn(e, stage.id, bodyRef)}
        onDrop={e => onDropOnColumn(e, stage.id)}
        onDragLeave={onDragLeaveColumn}
      >
        {renderCards()}
      </div>

      {/* Add card */}
      {addingCard ? (
        <div className="kb-add-card-input">
          <input
            placeholder="Titre de la carte…"
            value={newCardTitle}
            autoFocus
            onChange={e => setNewCardTitle(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter')  commitAddCard();
              if (e.key === 'Escape') { setNewCardTitle(''); setAddingCard(false); }
            }}
            onBlur={commitAddCard}
          />
        </div>
      ) : (
        <button className="kb-add-card-btn" onClick={() => setAddingCard(true)}>
          + Ajouter
        </button>
      )}
    </div>
  );
}

// ── KanbanBoard ───────────────────────────────────────────────────────────────
export default function KanbanBoard({ boardId }) {
  const { state, dispatch } = useApp();

  const [draggingCardId, setDraggingCardId] = useState(null);
  const [dragOverStageId, setDragOverStageId] = useState(null);
  const [dragDropIndex,   setDragDropIndex]   = useState(null);
  const [addingStage,     setAddingStage]     = useState(false);
  const [newStageName,    setNewStageName]    = useState('');

  const board = state.boards.find(b => b.id === boardId);
  if (!board) return <div className="page"><p style={{color:'var(--text-muted)'}}>Aucun tableau sélectionné.</p></div>;

  const stages = board.stageOrder
    .map(sid => state.stages.find(s => s.id === sid))
    .filter(Boolean);

  const cardsForStage = sid =>
    state.cards.filter(c => c.stageId === sid && c.boardId === boardId)
      .sort((a, b) => a.order - b.order);

  // ── Drag handlers ───────────────────────────────────────────────────────────

  function handleCardDragStart(e, cardId, stageId) {
    setDraggingCardId(cardId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', cardId);
  }

  function handleCardDragEnd() {
    setDraggingCardId(null);
    setDragOverStageId(null);
    setDragDropIndex(null);
  }

  function handleColumnDragOver(e, stageId, bodyRef) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStageId(stageId);

    // Compute insert index from mouse Y
    if (bodyRef.current) {
      const cardEls = [...bodyRef.current.querySelectorAll('.kb-card:not(.is-dragging)')];
      let idx = cardEls.length;
      for (let i = 0; i < cardEls.length; i++) {
        const rect = cardEls[i].getBoundingClientRect();
        if (e.clientY < rect.top + rect.height / 2) { idx = i; break; }
      }
      setDragDropIndex(idx);
    }
  }

  function handleColumnDragLeave() {
    // Don't reset immediately (causes flicker); only reset on drop/end
  }

  function handleColumnDrop(e, stageId) {
    e.preventDefault();
    const cardId = draggingCardId || e.dataTransfer.getData('text/plain');
    if (cardId) {
      const insertAt = dragDropIndex ?? 0;
      dispatch({ type: 'MOVE_CARD', cardId, toStageId: stageId, toOrder: insertAt });
    }
    setDraggingCardId(null);
    setDragOverStageId(null);
    setDragDropIndex(null);
  }

  // ── Add stage ───────────────────────────────────────────────────────────────

  function commitAddStage() {
    if (newStageName.trim()) {
      dispatch({ type: 'ADD_STAGE', id: genId(), boardId, name: newStageName.trim() });
    }
    setNewStageName('');
    setAddingStage(false);
  }

  // ── List view ───────────────────────────────────────────────────────────────

  function renderListView() {
    const allCards = stages.flatMap(stage =>
      cardsForStage(stage.id).map(card => ({ ...card, stageName: stage.name }))
    );
    return (
      <div className="kb-list-view">
        <table className="kb-table">
          <thead>
            <tr>
              <th>Titre</th>
              <th>Étape</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {allCards.length === 0 && (
              <tr><td colSpan={3} className="kb-empty">Aucune carte. Passez en vue Kanban pour en ajouter.</td></tr>
            )}
            {allCards.map(card => (
              <tr key={card.id} className="kb-list-row">
                <td className="kb-list-cell">
                  <EditableTitle
                    value={card.title}
                    onSave={v => dispatch({ type: 'UPDATE_CARD', id: card.id, updates: { title: v } })}
                  />
                </td>
                <td className="kb-list-cell">
                  <select
                    className="kb-stage-select"
                    value={card.stageId}
                    onChange={e => dispatch({ type: 'MOVE_CARD', cardId: card.id, toStageId: e.target.value, toOrder: 9999 })}
                  >
                    {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </td>
                <td className="kb-list-cell">
                  <button className="icon-btn danger" onClick={() => dispatch({ type: 'DELETE_CARD', id: card.id })}>🗑</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const isKanban = board.viewMode !== 'list';
  const totalCards = state.cards.filter(c => c.boardId === boardId).length;

  return (
    <div className="kb-wrap">
      {/* Header */}
      <div className="kb-header">
        <h1 className="page-title">{board.name}</h1>
        <span className="page-count">{totalCards}</span>
        <div className="kb-view-toggle">
          <button
            className={`kb-view-btn${isKanban ? ' active' : ''}`}
            onClick={() => dispatch({ type: 'UPDATE_BOARD', id: boardId, updates: { viewMode: 'kanban' } })}
          >⊞ Kanban</button>
          <button
            className={`kb-view-btn${!isKanban ? ' active' : ''}`}
            onClick={() => dispatch({ type: 'UPDATE_BOARD', id: boardId, updates: { viewMode: 'list' } })}
          >☰ Liste</button>
        </div>
      </div>

      {/* Content */}
      {isKanban ? (
        <div className="kb-board">
          {stages.map((stage, idx) => (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              cards={cardsForStage(stage.id)}
              stageIndex={idx}
              totalStages={stages.length}
              isDragOver={dragOverStageId === stage.id}
              dropIndex={dragOverStageId === stage.id ? dragDropIndex : null}
              draggingCardId={draggingCardId}
              onDragStartCard={handleCardDragStart}
              onDragEndCard={handleCardDragEnd}
              onDragOverColumn={handleColumnDragOver}
              onDropOnColumn={handleColumnDrop}
              onDragLeaveColumn={handleColumnDragLeave}
              boardId={boardId}
              dispatch={dispatch}
            />
          ))}

          {/* Add stage */}
          {addingStage ? (
            <div className="kb-add-stage-col">
              <input
                className="kb-stage-input"
                placeholder="Nom de l'étape…"
                value={newStageName}
                autoFocus
                onChange={e => setNewStageName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter')  commitAddStage();
                  if (e.key === 'Escape') { setNewStageName(''); setAddingStage(false); }
                }}
                onBlur={commitAddStage}
              />
            </div>
          ) : (
            <button className="kb-add-stage-btn" onClick={() => setAddingStage(true)}>
              + Étape
            </button>
          )}
        </div>
      ) : renderListView()}
    </div>
  );
}

// ── Inline editable title helper ──────────────────────────────────────────────
function EditableTitle({ value, onSave }) {
  const [editing, setEditing] = useState(false);
  const [val,     setVal]     = useState(value);
  function commit() {
    const t = val.trim();
    if (t && t !== value) onSave(t);
    else setVal(value);
    setEditing(false);
  }
  if (editing) {
    return (
      <input
        className="kb-edit-input"
        value={val}
        autoFocus
        onChange={e => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setVal(value); setEditing(false); } }}
      />
    );
  }
  return <span onDoubleClick={() => { setVal(value); setEditing(true); }}>{value}</span>;
}
