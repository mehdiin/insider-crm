import React, { createContext, useContext, useReducer, useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const AppContext = createContext(null);
const STORAGE_KEY = 'crm_v1'; // kept for localStorage backup

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

const INITIAL_BOARDS = [
  { id: 'brd-pc', name: 'Marques ciblées',      section: 'prospection', viewMode: 'kanban', stageOrder: ['sp1','sp2','sp3','sp4'] },
  { id: 'brd-pr', name: 'Marques à recontacter', section: 'prospection', viewMode: 'kanban', stageOrder: ['sr1','sr2','sr3'] },
  { id: 'brd-n1', name: 'Pipeline de vente 1',  section: 'negociation', viewMode: 'kanban', stageOrder: ['sn1','sn2','sn3','sn4'] },
  { id: 'brd-a1', name: 'Influence',             section: 'projets',   viewMode: 'kanban', stageOrder: ['sa1','sa2','sa3','sa4','sa5'] },
];

const INITIAL_STAGES = [
  { id: 'sp1', boardId: 'brd-pc', name: 'À identifier' },
  { id: 'sp2', boardId: 'brd-pc', name: 'À contacter' },
  { id: 'sp3', boardId: 'brd-pc', name: 'Contacté' },
  { id: 'sp4', boardId: 'brd-pc', name: 'Répondu' },
  { id: 'sr1', boardId: 'brd-pr', name: 'À recontacter' },
  { id: 'sr2', boardId: 'brd-pr', name: 'Relance 1' },
  { id: 'sr3', boardId: 'brd-pr', name: 'Relance 2' },
  { id: 'sn1', boardId: 'brd-n1', name: 'Lead' },
  { id: 'sn2', boardId: 'brd-n1', name: 'Proposition' },
  { id: 'sn3', boardId: 'brd-n1', name: 'Négociation' },
  { id: 'sn4', boardId: 'brd-n1', name: 'Signé' },
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

// -- Reducer (unchanged) ------------------------------------------------------
function reducer(state, action) {
  switch (action.type) {

    case 'ADD_ORGANIZATION':
      return { ...state, organizations: [...state.organizations, { id: action.id, name: action.name }] };
    case 'UPDATE_ORGANIZATION':
      return { ...state, organizations: state.organizations.map(o => o.id === action.id ? { ...o, name: action.name } : o) };
    case 'DELETE_ORGANIZATION':
      return { ...state, organizations: state.organizations.filter(o => o.id !== action.id) };

    case 'ADD_TALENT':
      return { ...state, talents: [...state.talents, { id: action.id, name: action.name }] };
    case 'UPDATE_TALENT':
      return { ...state, talents: state.talents.map(t => t.id === action.id ? { ...t, name: action.name } : t) };
    case 'DELETE_TALENT':
      return { ...state, talents: state.talents.filter(t => t.id !== action.id) };

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

    case 'ADD_TODO': {
      const newTodo = {
        id:              action.id,
        text:            action.text || '',
        status:          'pending',
        indent:          action.indent !== undefined ? action.indent : 0,
        organizationIds: action.organizationIds || [],
        talentIds:       action.talentIds       || [],
        projectId:       action.projectId       || null,
        dueDate:         null,
        notes:           '',
        priority:        action.priority || null,
      };
      const todos = [...state.todos];
      todos.splice(action.insertAt !== undefined ? action.insertAt : todos.length, 0, newTodo);
      return { ...state, todos };
    }
    case 'UPDATE_TODO': {
      let todos = state.todos.map(t => t.id === action.id ? { ...t, ...action.updates } : t);
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

    case 'ADD_BOARD': {
      const newBoard = { id: action.id, name: action.name, section: action.section, viewMode: 'kanban', stageOrder: [] };
      const newStages = (action.stages || []).map(s => ({ id: s.id, boardId: action.id, name: s.name }));
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

    case 'ADD_STAGE': {
      const newStage = { id: action.id, boardId: action.boardId, name: action.name };
      return {
        ...state,
        boards: state.boards.map(b => b.id === action.boardId ? { ...b, stageOrder: [...b.stageOrder, action.id] } : b),
        stages: [...state.stages, newStage],
      };
    }
    case 'UPDATE_STAGE':
      return { ...state, stages: state.stages.map(s => s.id === action.id ? { ...s, ...action.updates } : s) };
    case 'DELETE_STAGE':
      return {
        ...state,
        boards: state.boards.map(b => b.id === action.boardId ? { ...b, stageOrder: b.stageOrder.filter(sid => sid !== action.id) } : b),
        stages: state.stages.filter(s => s.id !== action.id),
        cards:  state.cards.filter(c => c.stageId !== action.id),
      };
    case 'MOVE_STAGE':
      return {
        ...state,
        boards: state.boards.map(b => {
          if (b.id !== action.boardId) return b;
          const order = [...b.stageOrder];
          const [moved] = order.splice(action.fromIndex, 1);
          order.splice(action.toIndex, 0, moved);
          return { ...b, stageOrder: order };
        }),
      };

    case 'ADD_CARD': {
      const stageCards = state.cards.filter(c => c.stageId === action.stageId);
      const maxOrder   = stageCards.reduce((m, c) => Math.max(m, c.order), -1);
      const newCard = {
        id: action.id, boardId: action.boardId, stageId: action.stageId,
        title: action.title || '', description: '', organizationId: null, order: maxOrder + 1,
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
      const cardMap = new Map(state.cards.map(c => [c.id, { ...c }]));
      cardMap.set(card.id, { ...card, stageId: toStageId });
      const targetCards = [...cardMap.values()].filter(c => c.stageId === toStageId && c.id !== card.id).sort((a, b) => a.order - b.order);
      targetCards.splice(toOrder, 0, { ...card, stageId: toStageId });
      targetCards.forEach((c, i) => cardMap.set(c.id, { ...c, order: i }));
      if (fromStageId !== toStageId) {
        const sourceCards = [...cardMap.values()].filter(c => c.stageId === fromStageId).sort((a, b) => a.order - b.order);
        sourceCards.forEach((c, i) => cardMap.set(c.id, { ...c, order: i }));
      }
      return { ...state, cards: [...cardMap.values()] };
    }

    default:
      return state;
  }
}

// -- History wrapper (unchanged) ----------------------------------------------
const MAX_HISTORY = 100;

function historyReducer(hist, action) {
  if (action.type === '__INIT__') {
    return { past: [], present: action.state, future: [], _last: null };
  }
  if (action.type === 'UNDO') {
    if (hist.past.length === 0) return hist;
    const previous = hist.past[hist.past.length - 1];
    return { past: hist.past.slice(0, -1), present: previous, future: [hist.present, ...hist.future].slice(0, MAX_HISTORY), _last: null };
  }
  if (action.type === 'REDO') {
    if (hist.future.length === 0) return hist;
    const [next, ...rest] = hist.future;
    return { past: [...hist.past, hist.present].slice(-MAX_HISTORY), present: next, future: rest, _last: null };
  }

  const next = reducer(hist.present, action);
  if (next === hist.present) return hist;

  const isTyping = action.type === 'UPDATE_TODO' &&
    Object.keys(action.updates || {}).length === 1 &&
    ('text' in action.updates || 'notes' in action.updates);

  if (isTyping && hist._last?.id === action.id) {
    return { ...hist, present: next, future: [] };
  }
  return {
    past:  [...hist.past, hist.present].slice(-MAX_HISTORY),
    present: next,
    future: [],
    _last:  isTyping ? { id: action.id } : null,
  };
}

// -- Migration des anciennes donnees ------------------------------------------
function migrateData(init, parsed) {
  if (parsed.todos) {
    parsed.todos = parsed.todos.map(t => {
      let todo = t;
      if (todo.status === undefined) {
        const { completed, ...rest } = todo;
        todo = { ...rest, status: completed ? 'done' : 'pending' };
      }
      if ('organizationId' in todo && !('organizationIds' in todo)) {
        const { organizationId, ...rest } = todo;
        todo = { ...rest, organizationIds: organizationId ? [organizationId] : [] };
      }
      if (!Array.isArray(todo.organizationIds)) todo = { ...todo, organizationIds: [] };
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

// -- Helpers: compute parent_id from indent -----------------------------------
function computeParentId(todos, index) {
  const todo = todos[index];
  if (!todo || todo.indent === 0) return null;
  for (let i = index - 1; i >= 0; i--) {
    if (todos[i].indent < todo.indent) return todos[i].id;
  }
  return null;
}

// -- Seed default data for a new user -----------------------------------------
async function seedDefaultData(userId) {
  // Organizations
  const orgRows = INITIAL_ORGANIZATIONS.map(o => ({ id: o.id, owner_id: userId, name: o.name }));
  await supabase.from('organizations').insert(orgRows);

  // Talents
  const talRows = INITIAL_TALENTS.map(t => ({ id: t.id, owner_id: userId, name: t.name }));
  await supabase.from('talents').insert(talRows);

  // Boards
  const boardRows = INITIAL_BOARDS.map(b => ({
    id: b.id, owner_id: userId, name: b.name, section: b.section,
    view_mode: b.viewMode, stage_order: b.stageOrder,
  }));
  await supabase.from('boards').insert(boardRows);

  // Stages
  const stageRows = INITIAL_STAGES.map(s => ({ id: s.id, board_id: s.boardId, name: s.name }));
  await supabase.from('stages').insert(stageRows);

  // Create a default todo list
  const listId = 'list-default';
  await supabase.from('todo_lists').insert({ id: listId, owner_id: userId, name: 'Default' });

  return listId;
}

// -- Load normalized data from Supabase ---------------------------------------
async function loadFromSupabase(userId) {
  // 1. Organizations
  const { data: orgRows } = await supabase
    .from('organizations').select('id, name').eq('owner_id', userId);

  // 2. Talents
  const { data: talRows } = await supabase
    .from('talents').select('id, name').eq('owner_id', userId);

  // 3. Todo list
  let { data: lists } = await supabase
    .from('todo_lists').select('id').eq('owner_id', userId).limit(1);

  let listId = lists?.[0]?.id || null;
  let isNewUser = false;

  if (!listId && (!orgRows || orgRows.length === 0)) {
    // New user: seed default data
    isNewUser = true;
    listId = await seedDefaultData(userId);
    return {
      state: { ...initialState },
      listId,
    };
  }

  // If we have orgs but no list, just create the list
  if (!listId) {
    listId = 'list-default';
    await supabase.from('todo_lists').insert({ id: listId, owner_id: userId, name: 'Default' });
  }

  // 4. Todos
  const { data: todoRows } = await supabase
    .from('todos').select('*').eq('list_id', listId).order('sort_order', { ascending: true });

  // 5. Todo M2M: organizations and talents
  const todoIds = (todoRows || []).map(t => t.id);
  let todoOrgMap = {};
  let todoTalMap = {};

  if (todoIds.length > 0) {
    const { data: todoOrgs } = await supabase
      .from('todo_organizations').select('todo_id, organization_id').in('todo_id', todoIds);
    for (const row of (todoOrgs || [])) {
      if (!todoOrgMap[row.todo_id]) todoOrgMap[row.todo_id] = [];
      todoOrgMap[row.todo_id].push(row.organization_id);
    }

    const { data: todoTals } = await supabase
      .from('todo_talents').select('todo_id, talent_id').in('todo_id', todoIds);
    for (const row of (todoTals || [])) {
      if (!todoTalMap[row.todo_id]) todoTalMap[row.todo_id] = [];
      todoTalMap[row.todo_id].push(row.talent_id);
    }
  }

  const todos = (todoRows || []).map(t => ({
    id:              t.id,
    text:            t.text || '',
    status:          t.status || 'pending',
    indent:          t.parent_id ? 1 : 0,
    organizationIds: todoOrgMap[t.id] || [],
    talentIds:       todoTalMap[t.id] || [],
    projectId:       t.project_id || null,
    dueDate:         t.due_date || null,
    notes:           t.notes || '',
    priority:        t.priority || null,
  }));

  // 6. Boards
  const { data: boardRows } = await supabase
    .from('boards').select('*').eq('owner_id', userId);

  const boards = (boardRows || []).map(b => ({
    id:         b.id,
    name:       b.name,
    section:    b.section,
    viewMode:   b.view_mode || 'kanban',
    stageOrder: b.stage_order || [],
  }));

  const boardIds = boards.map(b => b.id);

  // 7. Stages
  let stages = [];
  if (boardIds.length > 0) {
    const { data: stageRows } = await supabase
      .from('stages').select('*').in('board_id', boardIds);
    stages = (stageRows || []).map(s => ({
      id:      s.id,
      boardId: s.board_id,
      name:    s.name,
    }));
  }

  // 8. Cards
  let cards = [];
  if (boardIds.length > 0) {
    const { data: cardRows } = await supabase
      .from('cards').select('*').in('board_id', boardIds);
    cards = (cardRows || []).map(c => ({
      id:             c.id,
      boardId:        c.board_id,
      stageId:        c.stage_id,
      title:          c.title || '',
      description:    c.description || '',
      organizationId: c.organization_id || null,
      order:          c.sort_order ?? 0,
    }));
  }

  return {
    state: {
      organizations: (orgRows || []).map(o => ({ id: o.id, name: o.name })),
      talents:       (talRows || []).map(t => ({ id: t.id, name: t.name })),
      projects:      [],
      todos,
      nextProjectNumber: 1,
      boards,
      stages,
      cards,
    },
    listId,
  };
}

// -- Sync action to Supabase --------------------------------------------------
async function syncActionToSupabase(action, state, userId, listId) {
  if (!userId || !listId) return;

  try {
    switch (action.type) {

      // -- Organizations --
      case 'ADD_ORGANIZATION':
        await supabase.from('organizations').insert({ id: action.id, owner_id: userId, name: action.name });
        break;
      case 'UPDATE_ORGANIZATION':
        await supabase.from('organizations').update({ name: action.name }).eq('id', action.id);
        break;
      case 'DELETE_ORGANIZATION':
        await supabase.from('organizations').delete().eq('id', action.id);
        break;

      // -- Talents --
      case 'ADD_TALENT':
        await supabase.from('talents').insert({ id: action.id, owner_id: userId, name: action.name });
        break;
      case 'UPDATE_TALENT':
        await supabase.from('talents').update({ name: action.name }).eq('id', action.id);
        break;
      case 'DELETE_TALENT':
        await supabase.from('talents').delete().eq('id', action.id);
        break;

      // -- Todos --
      case 'ADD_TODO': {
        const insertAt = action.insertAt !== undefined ? action.insertAt : state.todos.length - 1;
        const parentId = computeParentId(state.todos, state.todos.findIndex(t => t.id === action.id));

        await supabase.from('todos').insert({
          id:         action.id,
          list_id:    listId,
          text:       action.text || '',
          status:     'pending',
          parent_id:  parentId,
          project_id: action.projectId || null,
          due_date:   null,
          notes:      '',
          priority:   action.priority || null,
          sort_order: insertAt,
        });

        // Insert M2M relationships
        const orgIds = action.organizationIds || [];
        if (orgIds.length > 0) {
          await supabase.from('todo_organizations').insert(
            orgIds.map(oid => ({ todo_id: action.id, organization_id: oid }))
          );
        }
        const talIds = action.talentIds || [];
        if (talIds.length > 0) {
          await supabase.from('todo_talents').insert(
            talIds.map(tid => ({ todo_id: action.id, talent_id: tid }))
          );
        }

        // Update sort_order for all todos after insert
        const sortUpdates = state.todos.map((t, i) => ({ id: t.id, sort_order: i }));
        if (sortUpdates.length > 0) {
          await supabase.from('todos').upsert(
            sortUpdates.map(u => ({ id: u.id, list_id: listId, sort_order: u.sort_order })),
            { onConflict: 'id', ignoreDuplicates: false }
          );
        }
        break;
      }

      case 'UPDATE_TODO': {
        const updates = action.updates || {};
        const dbUpdates = {};

        if ('text' in updates) dbUpdates.text = updates.text;
        if ('status' in updates) dbUpdates.status = updates.status;
        if ('notes' in updates) dbUpdates.notes = updates.notes;
        if ('dueDate' in updates) dbUpdates.due_date = updates.dueDate;
        if ('priority' in updates) dbUpdates.priority = updates.priority;
        if ('projectId' in updates) dbUpdates.project_id = updates.projectId;
        if ('indent' in updates) {
          const idx = state.todos.findIndex(t => t.id === action.id);
          dbUpdates.parent_id = computeParentId(state.todos, idx);
        }

        if (Object.keys(dbUpdates).length > 0) {
          await supabase.from('todos').update(dbUpdates).eq('id', action.id);
        }

        // Sync parent status changes (the reducer may have auto-updated a parent)
        if ('status' in updates) {
          const idx = state.todos.findIndex(t => t.id === action.id);
          const todo = state.todos[idx];
          if (todo && todo.indent > 0) {
            for (let pi = idx - 1; pi >= 0; pi--) {
              if (state.todos[pi].indent < todo.indent) {
                await supabase.from('todos').update({ status: state.todos[pi].status }).eq('id', state.todos[pi].id);
                break;
              }
            }
          }
        }

        // Sync M2M if organizationIds changed
        if ('organizationIds' in updates) {
          await supabase.from('todo_organizations').delete().eq('todo_id', action.id);
          const orgIds = updates.organizationIds || [];
          if (orgIds.length > 0) {
            await supabase.from('todo_organizations').insert(
              orgIds.map(oid => ({ todo_id: action.id, organization_id: oid }))
            );
          }
        }

        // Sync M2M if talentIds changed
        if ('talentIds' in updates) {
          await supabase.from('todo_talents').delete().eq('todo_id', action.id);
          const talIds = updates.talentIds || [];
          if (talIds.length > 0) {
            await supabase.from('todo_talents').insert(
              talIds.map(tid => ({ todo_id: action.id, talent_id: tid }))
            );
          }
        }
        break;
      }

      case 'DELETE_TODOS': {
        const ids = action.ids || [];
        if (ids.length > 0) {
          // M2M rows will cascade-delete if FK is set, otherwise delete explicitly
          await supabase.from('todo_organizations').delete().in('todo_id', ids);
          await supabase.from('todo_talents').delete().in('todo_id', ids);
          await supabase.from('todos').delete().in('id', ids);
        }
        break;
      }

      case 'REORDER_TODOS': {
        const sortUpdates = state.todos.map((t, i) => ({
          id: t.id,
          list_id: listId,
          sort_order: i,
          parent_id: computeParentId(state.todos, i),
        }));
        if (sortUpdates.length > 0) {
          await supabase.from('todos').upsert(sortUpdates, { onConflict: 'id', ignoreDuplicates: false });
        }
        break;
      }

      // -- Boards --
      case 'ADD_BOARD': {
        const stageOrder = (action.stages || []).map(s => s.id);
        await supabase.from('boards').insert({
          id: action.id, owner_id: userId, name: action.name,
          section: action.section, view_mode: 'kanban', stage_order: stageOrder,
        });
        const newStages = (action.stages || []).map(s => ({ id: s.id, board_id: action.id, name: s.name }));
        if (newStages.length > 0) {
          await supabase.from('stages').insert(newStages);
        }
        break;
      }
      case 'UPDATE_BOARD': {
        const bu = action.updates || {};
        const dbBu = {};
        if ('name' in bu) dbBu.name = bu.name;
        if ('section' in bu) dbBu.section = bu.section;
        if ('viewMode' in bu) dbBu.view_mode = bu.viewMode;
        if ('stageOrder' in bu) dbBu.stage_order = bu.stageOrder;
        if (Object.keys(dbBu).length > 0) {
          await supabase.from('boards').update(dbBu).eq('id', action.id);
        }
        break;
      }
      case 'DELETE_BOARD':
        await supabase.from('cards').delete().eq('board_id', action.id);
        await supabase.from('stages').delete().eq('board_id', action.id);
        await supabase.from('boards').delete().eq('id', action.id);
        break;

      // -- Stages --
      case 'ADD_STAGE': {
        await supabase.from('stages').insert({ id: action.id, board_id: action.boardId, name: action.name });
        // Update board's stage_order
        const board = state.boards.find(b => b.id === action.boardId);
        if (board) {
          await supabase.from('boards').update({ stage_order: board.stageOrder }).eq('id', action.boardId);
        }
        break;
      }
      case 'UPDATE_STAGE': {
        const su = action.updates || {};
        const dbSu = {};
        if ('name' in su) dbSu.name = su.name;
        if (Object.keys(dbSu).length > 0) {
          await supabase.from('stages').update(dbSu).eq('id', action.id);
        }
        break;
      }
      case 'DELETE_STAGE':
        await supabase.from('cards').delete().eq('stage_id', action.id);
        await supabase.from('stages').delete().eq('id', action.id);
        // Update board's stage_order
        if (action.boardId) {
          const board = state.boards.find(b => b.id === action.boardId);
          if (board) {
            await supabase.from('boards').update({ stage_order: board.stageOrder }).eq('id', action.boardId);
          }
        }
        break;
      case 'MOVE_STAGE': {
        const board = state.boards.find(b => b.id === action.boardId);
        if (board) {
          await supabase.from('boards').update({ stage_order: board.stageOrder }).eq('id', action.boardId);
        }
        break;
      }

      // -- Cards --
      case 'ADD_CARD': {
        const newCard = state.cards.find(c => c.id === action.id);
        if (newCard) {
          await supabase.from('cards').insert({
            id: newCard.id, board_id: newCard.boardId, stage_id: newCard.stageId,
            title: newCard.title, description: newCard.description,
            organization_id: newCard.organizationId, sort_order: newCard.order,
          });
        }
        break;
      }
      case 'UPDATE_CARD': {
        const cu = action.updates || {};
        const dbCu = {};
        if ('title' in cu) dbCu.title = cu.title;
        if ('description' in cu) dbCu.description = cu.description;
        if ('organizationId' in cu) dbCu.organization_id = cu.organizationId;
        if ('stageId' in cu) dbCu.stage_id = cu.stageId;
        if ('boardId' in cu) dbCu.board_id = cu.boardId;
        if ('order' in cu) dbCu.sort_order = cu.order;
        if (Object.keys(dbCu).length > 0) {
          await supabase.from('cards').update(dbCu).eq('id', action.id);
        }
        break;
      }
      case 'DELETE_CARD':
        await supabase.from('cards').delete().eq('id', action.id);
        break;
      case 'MOVE_CARD': {
        // Batch update all cards whose order/stageId changed
        const updates = state.cards.map(c => ({
          id: c.id, board_id: c.boardId, stage_id: c.stageId, sort_order: c.order,
        }));
        if (updates.length > 0) {
          await supabase.from('cards').upsert(updates, { onConflict: 'id', ignoreDuplicates: false });
        }
        break;
      }

      // UNDO/REDO: full resync handled below
      default:
        break;
    }
  } catch (err) {
    console.error('[AppContext] Supabase sync error:', action.type, err);
  }
}

// -- Full state resync (used for UNDO/REDO) -----------------------------------
async function fullResync(state, userId, listId) {
  if (!userId || !listId) return;
  try {
    // Orgs: delete all then re-insert
    await supabase.from('organizations').delete().eq('owner_id', userId);
    if (state.organizations.length > 0) {
      await supabase.from('organizations').insert(
        state.organizations.map(o => ({ id: o.id, owner_id: userId, name: o.name }))
      );
    }

    // Talents
    await supabase.from('talents').delete().eq('owner_id', userId);
    if (state.talents.length > 0) {
      await supabase.from('talents').insert(
        state.talents.map(t => ({ id: t.id, owner_id: userId, name: t.name }))
      );
    }

    // Todos: clear M2M first, then todos, then re-insert
    const { data: existingTodos } = await supabase
      .from('todos').select('id').eq('list_id', listId);
    const existingIds = (existingTodos || []).map(t => t.id);
    if (existingIds.length > 0) {
      await supabase.from('todo_organizations').delete().in('todo_id', existingIds);
      await supabase.from('todo_talents').delete().in('todo_id', existingIds);
    }
    await supabase.from('todos').delete().eq('list_id', listId);

    if (state.todos.length > 0) {
      const todoRows = state.todos.map((t, i) => ({
        id: t.id, list_id: listId, text: t.text, status: t.status,
        parent_id: computeParentId(state.todos, i),
        project_id: t.projectId, due_date: t.dueDate, notes: t.notes,
        priority: t.priority, sort_order: i,
      }));
      await supabase.from('todos').insert(todoRows);

      // M2M
      const orgM2M = [];
      const talM2M = [];
      for (const t of state.todos) {
        for (const oid of (t.organizationIds || [])) orgM2M.push({ todo_id: t.id, organization_id: oid });
        for (const tid of (t.talentIds || [])) talM2M.push({ todo_id: t.id, talent_id: tid });
      }
      if (orgM2M.length > 0) await supabase.from('todo_organizations').insert(orgM2M);
      if (talM2M.length > 0) await supabase.from('todo_talents').insert(talM2M);
    }

    // Boards: clear cards, stages, boards then re-insert
    const boardIds = state.boards.map(b => b.id);
    // Delete old boards for this user
    await supabase.from('cards').delete().eq('board_id', boardIds.length > 0 ? undefined : '__none__'); // handled below
    const { data: existingBoards } = await supabase
      .from('boards').select('id').eq('owner_id', userId);
    const existingBoardIds = (existingBoards || []).map(b => b.id);
    if (existingBoardIds.length > 0) {
      await supabase.from('cards').delete().in('board_id', existingBoardIds);
      await supabase.from('stages').delete().in('board_id', existingBoardIds);
    }
    await supabase.from('boards').delete().eq('owner_id', userId);

    if (state.boards.length > 0) {
      await supabase.from('boards').insert(
        state.boards.map(b => ({
          id: b.id, owner_id: userId, name: b.name, section: b.section,
          view_mode: b.viewMode, stage_order: b.stageOrder,
        }))
      );
    }
    if (state.stages.length > 0) {
      await supabase.from('stages').insert(
        state.stages.map(s => ({ id: s.id, board_id: s.boardId, name: s.name }))
      );
    }
    if (state.cards.length > 0) {
      await supabase.from('cards').insert(
        state.cards.map(c => ({
          id: c.id, board_id: c.boardId, stage_id: c.stageId,
          title: c.title, description: c.description,
          organization_id: c.organizationId, sort_order: c.order,
        }))
      );
    }
  } catch (err) {
    console.error('[AppContext] Full resync error:', err);
  }
}

// -- Provider -----------------------------------------------------------------
export function AppProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id;

  const [hist, dispatch] = useReducer(historyReducer, null, () => ({
    past: [], present: initialState, future: [], _last: null,
  }));
  const [loaded, setLoaded] = useState(false);

  const state = hist.present;

  // Ref to track the last dispatched action for targeted Supabase sync
  const lastActionRef = useRef(null);
  // Ref to store the todo_list id
  const listIdRef = useRef(null);

  const wrappedDispatch = useCallback((action) => {
    lastActionRef.current = action;
    dispatch(action);
  }, []);

  // -- Load from normalized Supabase tables on mount / user change ------------
  useEffect(() => {
    if (!userId) {
      setLoaded(true);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const result = await loadFromSupabase(userId);
        if (cancelled) return;
        listIdRef.current = result.listId;
        dispatch({ type: '__INIT__', state: migrateData(initialState, result.state) });
      } catch (err) {
        console.error('[AppContext] Load error, falling back to localStorage:', err);
        // Supabase inaccessible: fallback localStorage
        try {
          const local = localStorage.getItem(STORAGE_KEY);
          if (local && !cancelled) {
            dispatch({ type: '__INIT__', state: migrateData(initialState, JSON.parse(local)) });
          }
        } catch {}
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }

    setLoaded(false);
    load();

    return () => { cancelled = true; };
  }, [userId]);

  // -- Persist: targeted Supabase sync + localStorage backup ------------------
  useEffect(() => {
    if (!loaded) return;

    // Immediate localStorage backup
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

    const action = lastActionRef.current;
    if (!action || !userId) return;

    // Clear the ref so we don't re-process the same action
    lastActionRef.current = null;

    // For UNDO/REDO, do a debounced full resync
    if (action.type === 'UNDO' || action.type === 'REDO') {
      const timer = setTimeout(() => {
        fullResync(state, userId, listIdRef.current);
      }, 600);
      return () => clearTimeout(timer);
    }

    // For normal actions, sync immediately (fire-and-forget)
    syncActionToSupabase(action, state, userId, listIdRef.current);

  }, [state, loaded, userId]);

  if (!loaded) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#111', color: '#666', fontSize: 14 }}>
        Chargement...
      </div>
    );
  }

  return (
    <AppContext.Provider value={{ state, dispatch: wrappedDispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
