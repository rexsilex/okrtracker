import { supabase } from './supabase';
import { Objective, Person, KeyResult, WinLog } from '../types';

// ==================== People ====================

export const fetchPeople = async (userId: string): Promise<Person[]> => {
  const { data, error } = await supabase
    .from('people')
    .select('*')
    .eq('user_id', userId)
    .order('name');

  if (error) throw error;

  return data.map(p => ({
    id: p.id,
    name: p.name,
    initials: p.initials,
    color: p.color
  }));
};

export const createPerson = async (userId: string, person: Omit<Person, 'id'>): Promise<Person> => {
  const { data, error } = await supabase
    .from('people')
    .insert({
      user_id: userId,
      name: person.name,
      initials: person.initials,
      color: person.color
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    initials: data.initials,
    color: data.color
  };
};

export const deletePerson = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('people')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// ==================== Objectives ====================

export const fetchObjectives = async (userId: string): Promise<Objective[]> => {
  const { data: objectives, error } = await supabase
    .from('objectives')
    .select(`
      *,
      key_results (*),
      wins:win_logs!objective_id (
        *,
        attributions:win_attributions (person_id)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return objectives.map(obj => ({
    id: obj.id,
    title: obj.title,
    category: obj.category,
    description: obj.description,
    initiatives: obj.initiatives || [],
    keyResults: obj.key_results?.map((kr: any) => ({
      id: kr.id,
      title: kr.title,
      type: kr.type,
      current: kr.current,
      target: kr.target,
      unit: kr.unit,
      winLog: [] // Will be fetched separately if needed
    })) || [],
    wins: obj.wins?.map((w: any) => ({
      id: w.id,
      note: w.note,
      date: new Date(w.date).toLocaleDateString(),
      attributedTo: w.attributions?.map((a: any) => a.person_id) || []
    })) || []
  }));
};

export const createObjective = async (userId: string, objective: Omit<Objective, 'id' | 'keyResults' | 'wins'>): Promise<Objective> => {
  const { data, error } = await supabase
    .from('objectives')
    .insert({
      user_id: userId,
      title: objective.title,
      category: objective.category,
      description: objective.description,
      initiatives: objective.initiatives || []
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    title: data.title,
    category: data.category,
    description: data.description,
    initiatives: data.initiatives || [],
    keyResults: [],
    wins: []
  };
};

export const updateObjective = async (objective: Objective): Promise<void> => {
  const { error } = await supabase
    .from('objectives')
    .update({
      title: objective.title,
      category: objective.category,
      description: objective.description,
      initiatives: objective.initiatives
    })
    .eq('id', objective.id);

  if (error) throw error;
};

export const deleteObjective = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('objectives')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// ==================== Key Results ====================

export const createKeyResult = async (objectiveId: string, kr: Omit<KeyResult, 'id'>): Promise<KeyResult> => {
  const { data, error } = await supabase
    .from('key_results')
    .insert({
      objective_id: objectiveId,
      title: kr.title,
      type: kr.type,
      current: kr.current,
      target: kr.target,
      unit: kr.unit
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    title: data.title,
    type: data.type,
    current: data.current,
    target: data.target,
    unit: data.unit,
    winLog: []
  };
};

export const updateKeyResult = async (kr: KeyResult): Promise<void> => {
  const { error } = await supabase
    .from('key_results')
    .update({
      title: kr.title,
      type: kr.type,
      current: kr.current,
      target: kr.target,
      unit: kr.unit
    })
    .eq('id', kr.id);

  if (error) throw error;
};

export const deleteKeyResult = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('key_results')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// ==================== Win Logs ====================

export const createWinLog = async (
  note: string,
  attributedTo: string[],
  objectiveId?: string,
  keyResultId?: string
): Promise<WinLog> => {
  // Create win log
  const { data: winLog, error: winError } = await supabase
    .from('win_logs')
    .insert({
      note,
      objective_id: objectiveId || null,
      key_result_id: keyResultId || null
    })
    .select()
    .single();

  if (winError) throw winError;

  // Create attributions
  if (attributedTo.length > 0) {
    const attributions = attributedTo.map(personId => ({
      win_log_id: winLog.id,
      person_id: personId
    }));

    const { error: attrError } = await supabase
      .from('win_attributions')
      .insert(attributions);

    if (attrError) throw attrError;
  }

  return {
    id: winLog.id,
    note: winLog.note,
    date: new Date(winLog.date).toLocaleDateString(),
    attributedTo
  };
};

export const deleteWinLog = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('win_logs')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// ==================== Fetch Full Objective with KR Wins ====================

export const fetchObjectiveWithDetails = async (objectiveId: string): Promise<Objective> => {
  const { data: obj, error } = await supabase
    .from('objectives')
    .select(`
      *,
      key_results (
        *,
        winLog:win_logs!key_result_id (
          *,
          attributions:win_attributions (person_id)
        )
      ),
      wins:win_logs!objective_id (
        *,
        attributions:win_attributions (person_id)
      )
    `)
    .eq('id', objectiveId)
    .single();

  if (error) throw error;

  return {
    id: obj.id,
    title: obj.title,
    category: obj.category,
    description: obj.description,
    initiatives: obj.initiatives || [],
    keyResults: obj.key_results?.map((kr: any) => ({
      id: kr.id,
      title: kr.title,
      type: kr.type,
      current: kr.current,
      target: kr.target,
      unit: kr.unit,
      winLog: kr.winLog?.map((w: any) => ({
        id: w.id,
        note: w.note,
        date: new Date(w.date).toLocaleDateString(),
        attributedTo: w.attributions?.map((a: any) => a.person_id) || []
      })) || []
    })) || [],
    wins: obj.wins?.map((w: any) => ({
      id: w.id,
      note: w.note,
      date: new Date(w.date).toLocaleDateString(),
      attributedTo: w.attributions?.map((a: any) => a.person_id) || []
    })) || []
  };
};
