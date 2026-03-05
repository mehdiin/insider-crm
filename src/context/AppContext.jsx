import React, { createContext, useContext, useReducer, useEffect } from 'react';

const AppContext = createContext(null);
const STORAGE_KEY = 'crm_v1';

const INITIAL_ORGANIZATIONS = [
  'MYHERITAGE','GYMSHARK','LELO','HOLZKERN','LEGAL PLACE','HOLY','DEBLOCK',
  'SHOKZ','HOSTINGER','CYBERGHOST','FITNESSPARK','MANSCAPED','ROSETTA STONE',
  'ARCAD','CHAINATION','WINAMAX','NORDVPN','YAZIO','EMMA','SAILY','UNIBET',
  'HONKAI','FRANCE VERIF','BIOTECH','FIXTER','VEETMEN','MAX HAVELAAR','MACIF',
].map((name, i) => ({ id: `org-${i+1}`, name }));

const INITIAL_TALENTS = [
  'DANIIL','YASMINE','MORGAN VS','NOHOLITO','IBRATV','KARATE BUSHIDO','SKINRA',
  'LA SUEUR','NAJBFIT','MICHOU','FATCHE','WHAT A FAIL','FUZE III','SORA',
  'MUSIC FEELINGS','QIN HUI','NINO','VALOUZZ','ZACK NANI','MATHY KL',
  '7 JOURS SUR TERRE','STUNDZOW','RAYTON','LIL MCQUEEN','DHM','VINCENT LAPIERRE',
  'UNCHAINED_OFF','FRERE CASTOR','DAVID LAFARGE','LE JOURNAL DE L\'ESPACE',
  'LE ROUTIN','XAVIER PINCEMIN','HIT THE ROAD','KEVKO','DOBBY','YOUYOU',
  'LA.SWEETY','CKO','H5 MOTIVATION','FABI1','VAL FOOT','LE BAZAR DE LAUPOK',
  'MATHIEU PASSION POKER','CHOCOH','LUDOVIK','HUGOTOUTSEUL','TIM','KEMAR',
  'JAIHNO','ENFANTDEL\'EST','LASTELLA','MOUS','AMISTORY','BABOR','LEO URBAN',
  'CHRIS','KADER','BALOO','LEGEND','ROADTOSAIYAN','SIXELA','AMAZON','KEVIN RAZY',
].map((name, i) => ({ id: `tal-${i+1}`, name }));

// ── Seed boards ──────────────────────────────────────────────────────────────
const INITIAL_BOARDS = [
  { id: 'brd-pc', name: 'Marques ciblées',      section: 'prospection', viewMode: 'kanban', stageOrder: ['sp1','sp2','sp3','sp4'] },
  { id: 'brd-pr', name: 'Marques à recontacter', section: 'prospection', viewMode: 'kanban', stageOrder: ['sr1','sr2','sr3'] },
  { id: 'brd-n1', name: 'Pipeline de vente 1',  section: 'negociation', viewMode: 'kanban', stageOrder: ['sn1','sn2','sn3','sn4'] },
  { id: 'brd-a1', name: 'Influence',             section: 'projets',   viewMode: 'kanban', stageOrder: ['sa1','sa2','sa3','sa4','sa5'] },
];

const INITIAL_STAGES = [
  // Prospection — Marques ciblées
  { id: 'sp1', boardId: 'brd-pc', name: 'À identifier' },
  { id: 'sp2', boardId: 'brd-pc', name: 'À contacter' },
  { id: 'sp3', boardId: 'brd-pc', name: 'Contacté' },
  { id: 'sp4', boardId: 'brd-pc', name: 'Répondu' },
  // Prospection — Marques à recontacter
  { id: 'sr1', boardId: 'brd-pr', name: 'À recontacter' },
  { id: 'sr2', boardId: 'brd-pr', name: 'Relance 1' },
  { id: 'sr3', boardId: 'brd-pr', name: 'Relance 2' },
  // Négociation — Pipeline 1
  { id: 'sn1', boardId: 'brd-n1', name: 'Lead' },
  { id: 'sn2', boardId: 'brd-n1', name: 'Proposition' },
  { id: 'sn3', boardId: 'brd-n1', name: 'Négociation' },
  { id: 'sn4', boardId: 'brd-n1', name: 'Signé' },
  // Projets — Influence
  { id: 'sa1', boardId: 'brd-a1', name: 'Brief reçu' },
  { id: 'sa2', boardId: 'brd-a1', name: 'Proposition' },
  { id: 'sa3', boardId: 'brd-a1', name: 'Accord' },
  { id: 'sa4', boardId: 'brd-a1', name: 'En cours' },
  { id: 'sa5', boardId: 'brd-a1', name: 'Livré' },
];

const initialState = {
  organizations:     INITIAL_ORGANIZATIONS,
  talents:           INITIAL_TALENTS,
  projects:          [],
  todos:             [],
  nextProjectNumber: 1,
  boards:            INITIAL_BOARDS,
  stages:            INITIAL_STAGES,
  cards:             [],
};

// ── Reducer ──────────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {

    // ── Organisations ────────────────────────────────────────────────────────
    case 'ADD_ORGANIZATION':
      return { ...state, organizations: [...state.organizations, { id: action.id, name: action.name }] };
    case 'UPDATE_ORGANIZATION':
      return { ...state, organizations: state.organizations.map(o => o.id === action.id ? { ...o, name: action.name } : o) };
    case 'DELETE_ORGANIZATION':
      return { ...state, organizations: state.organizations.filter(o => o.id !== action.id) };

    // ── Talents ──────────────────────────────────────────────────────────────
    case 'ADD_TALENT':
      return { ...state, talents: [...state.talents, { id: action.id, name: action.name }] };
    case 'UPDATE_TALENT':
      return { ...state, talents: state.talents.map(t => t.id === action.id ? { ...t, name: action.name } : t) };
    case 'DELETE_TALENT':
      return { ...state, talents: state.talents.filter(t => t.id !== action.id) };

    // ── Projects ─────────────────────────────────────────────────────────────
    case 'ADD_PROJECT': {
      const num = String(state.nextProjectNumber).padStart(4, '0');
      return {
        ...state,
        projects: [...state.projects, {
          id: action.id,
          number: `PRJ-${num}`,
          organizationId: action.organizationId || null,
          talentId: action.talentId || null,
        }],
        nextProjectNumber: state.nextProjectNumber + 1,
      };
    }
    case 'UPDATE_PROJECT':
      return { ...state, projects: state.projects.map(p => p.id === action.id ? { ...p, ...action.updates } : p) };
    case 'DELETE_PROJECT':
      return { ...state, projects: state.projects.filter(p => p.id !== action.id) };

    // ── Todos ────────────────────────────────────────────────────────────────
    case 'ADD_TODO': {
      const newTodo = {
        id:             action.id,
        text:           action.text || '',
        status:         'pending',
        indent:         action.indent !== undefined ? action.indent : 0,
        organizationIds: action.organizationIds || [],
        talentIds:       action.talentIds      || [],
        projectId:      action.projectId      || null,
        dueDate:        null,
        notes:          '',
        priority:       null,
      };
      const todos = [...state.todos];
      todos.splice(action.insertAt !== undefined ? action.insertAt : todos.length, 0, newTodo);
      return { ...state, todos };
    }
    case 'UPDATE_TODO': {
      let todos = state.todos.map(t => t.id === action.id ? { ...t, ...action.updates } : t);
      // Auto-propagate subtask status change to parent
      if ('status' in (action.updates || {})) {
        const idx = todos.findIndex(t => t.id === action.id);
        if (idx >= 0 && todos[idx].indent > 0) {
          for (let pi = idx - 1; pi >= 0; pi--) {
            if (todos[pi].indent < todos[idx].indent) {
              const parent = todos[pi];
              const siblings = [];
              for (let si = pi + 1; si < todos.length; si++) {
                if (todos[si].indent <= parent.indent) break;
                if (todos[si].indent === parent.indent + 1) siblings.push(todos[si]);
              }
              if (siblings.length > 0) {
                const newStatus = siblings.every(s => s.status === 'done')   ? 'done'
                                : siblings.some(s => s.status !== 'pending') ? 'in-progress'
                                : 'pending';
                if (newStatus !== parent.status)
                  todos = todos.map((t, i) => i === pi ? { ...t, status: newStatus } : t);
              }
              break;
            }
          }
        }
      }
      return { ...state, todos };
    }
    case 'DELETE_TODOS':
      return { ...state, todos: state.todos.filter(t => !action.ids.includes(t.id)) };
    case 'REORDER_TODOS':
      return { ...state, todos: action.todos };

    // ── Boards ───────────────────────────────────────────────────────────────
    case 'ADD_BOARD': {
      const newBoard = {
        id:         action.id,
        name:       action.name,
        section:    action.section,
        viewMode:   'kanban',
        stageOrder: [],
      };
      // Also add default stages if provided
      const newStages = (action.stages || []).map((s, i) => ({
        id:      s.id,
        boardId: action.id,
        name:    s.name,
      }));
      const stageOrder = newStages.map(s => s.id);
      return {
        ...state,
        boards: [...state.boards, { ...newBoard, stageOrder }],
        stages: [...state.stages, ...newStages],
      };
    }
    case 'UPDATE_BOARD':
      return { ...state, boards: state.boards.map(b => b.id === action.id ? { ...b, ...action.updates } : b) };
    case 'DELETE_BOARD':
      return {
        ...state,
        boards: state.boards.filter(b => b.id !== action.id),
        stages: state.stages.filter(s => s.boardId !== action.id),
        cards:  state.cards.filter(c => c.boardId !== action.id),
      };

    // ── Stages ───────────────────────────────────────────────────────────────
    case 'ADD_STAGE': {
      const newStage = { id: action.id, boardId: action.boardId, name: action.name };
      return {
        ...state,
        boards: state.boards.map(b =>
          b.id === action.boardId ? { ...b, stageOrder: [...b.stageOrder, action.id] } : b
        ),
        stages: [...state.stages, newStage],
      };
    }
    case 'UPDATE_STAGE':
      return { ...state, stages: state.stages.map(s => s.id === action.id ? { ...s, ...action.updates } : s) };
    case 'DELETE_STAGE':
      return {
        ...state,
        boards: state.boards.map(b =>
          b.id === action.boardId
            ? { ...b, stageOrder: b.stageOrder.filter(sid => sid !== action.id) }
            : b
        ),
        stages: state.stages.filter(s => s.id !== action.id),
        cards:  state.cards.filter(c => c.stageId !== action.id),
      };
    case 'MOVE_STAGE': {
      return {
        ...state,
        boards: state.boards.map(b => {
          if (b.id !== action.boardId) return b;
          const order = [...b.stageOrder];
          const from = action.fromIndex;
          const to   = action.toIndex;
          if (from < 0 || to < 0 || from >= order.length || to >= order.length) return b;
          const [moved] = order.splice(from, 1);
          order.splice(to, 0, moved);
          return { ...b, stageOrder: order };
        }),
      };
    }

    // ── Cards ────────────────────────────────────────────────────────────────
    case 'ADD_CARD': {
      const stageCards = state.cards.filter(c => c.stageId === action.stageId);
      const maxOrder   = stageCards.reduce((m, c) => Math.max(m, c.order), -1);
      const newCard = {
        id:             action.id,
        boardId:        action.boardId,
        stageId:        action.stageId,
        title:          action.title || '',
        description:    '',
        organizationId: null,
        order:          maxOrder + 1,
      };
      return { ...state, cards: [...state.cards, newCard] };
    }
    case 'UPDATE_CARD':
      return { ...state, cards: state.cards.map(c => c.id === action.id ? { ...c, ...action.updates } : c) };
    case 'DELETE_CARD':
      return { ...state, cards: state.cards.filter(c => c.id !== action.id) };
    case 'MOVE_CARD': {
      const card = state.cards.find(c => c.id === action.cardId);
      if (!card) return state;
      const { toStageId, toOrder } = action;
      const fromStageId = card.stageId;

      // Build a map for fast update
      const cardMap = new Map(state.cards.map(c => [c.id, { ...c }]));

      // Update the moved card's stageId
      cardMap.set(card.id, { ...card, stageId: toStageId });

      // Re-index target stage
      const targetCards = [...cardMap.values()]
        .filter(c => c.stageId === toStageId && c.id !== card.id)
        .sort((a, b) => a.order - b.order);
      targetCards.splice(toOrder, 0, { ...card, stageId: toStageId });
      targetCards.forEach((c, i) => cardMap.set(c.id, { ...c, order: i }));

      // Re-index source stage if different
      if (fromStageId !== toStageId) {
        const sourceCards = [...cardMap.values()]
          .filter(c => c.stageId === fromStageId)
          .sort((a, b) => a.order - b.order);
        sourceCards.forEach((c, i) => cardMap.set(c.id, { ...c, order: i }));
      }

      return { ...state, cards: [...cardMap.values()] };
    }

    default:
      return state;
  }
}

// ── History wrapper (undo / redo) ─────────────────────────────────────────────
const MAX_HISTORY = 100;

function historyReducer(hist, action) {
  if (action.type === 'UNDO') {
    if (hist.past.length === 0) return hist;
    const previous = hist.past[hist.past.length - 1];
    return {
      past:    hist.past.slice(0, -1),
      present: previous,
      future:  [hist.present, ...hist.future].slice(0, MAX_HISTORY),
      _last:   null,
    };
  }
  if (action.type === 'REDO') {
    if (hist.future.length === 0) return hist;
    const [next, ...rest] = hist.future;
    return {
      past:    [...hist.past, hist.present].slice(-MAX_HISTORY),
      present: next,
      future:  rest,
      _last:   null,
    };
  }

  const next = reducer(hist.present, action);
  if (next === hist.present) return hist;

  // Fusionne les frappes consécutives sur le même champ texte en un seul undo step
  const isTyping = action.type === 'UPDATE_TODO' &&
    Object.keys(action.updates || {}).length === 1 &&
    ('text' in action.updates || 'notes' in action.updates);

  if (isTyping && hist._last?.id === action.id) {
    return { ...hist, present: next, future: [] };
  }

  return {
    past:    [...hist.past, hist.present].slice(-MAX_HISTORY),
    present: next,
    future:  [],
    _last:   isTyping ? { id: action.id } : null,
  };
}

function loadState(init) {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.todos) {
        parsed.todos = parsed.todos.map(t => {
          let todo = t;
          // Migrate old 'completed' boolean → status
          if (todo.status === undefined) {
            const { completed, ...rest } = todo;
            todo = { ...rest, status: completed ? 'done' : 'pending' };
          }
          // Migrate old single organizationId → organizationIds array
          if ('organizationId' in todo && !('organizationIds' in todo)) {
            const { organizationId, ...rest } = todo;
            todo = { ...rest, organizationIds: organizationId ? [organizationId] : [] };
          }
          if (!Array.isArray(todo.organizationIds)) todo = { ...todo, organizationIds: [] };
          // Migrate old single talentId → talentIds array
          if ('talentId' in todo && !('talentIds' in todo)) {
            const { talentId, ...rest } = todo;
            todo = { ...rest, talentIds: talentId ? [talentId] : [] };
          }
          if (!Array.isArray(todo.talentIds)) todo = { ...todo, talentIds: [] };
          return todo;
        });
      }
      return {
        ...init,
        ...parsed,
        boards: parsed.boards !== undefined ? parsed.boards : init.boards,
        stages: parsed.stages !== undefined ? parsed.stages : init.stages,
        cards:  parsed.cards  !== undefined ? parsed.cards  : init.cards,
      };
    }
  } catch {}
  return init;
}

// ── Provider ─────────────────────────────────────────────────────────────────
export function AppProvider({ children }) {
  const [hist, dispatch] = useReducer(historyReducer, null, () => ({
    past: [], present: loadState(initialState), future: [], _last: null,
  }));

  const state = hist.present;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
