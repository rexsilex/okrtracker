import { supabase } from './supabase';
import { Objective, Person, KeyResult, WinLog, ObjectiveType, ObjectiveStatus, Category } from '../types';

// ==================== User ====================

export const ensureUserExists = async (): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Check if user exists in users table
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .single();

  if (existingUser) {
    return existingUser.id;
  }

  // Create user record
  const { data: newUser, error } = await supabase
    .from('users')
    .insert({
      id: user.id,
      email: user.email
    })
    .select()
    .single();

  if (error) throw error;
  return newUser.id;
};

// ==================== People ====================

export const fetchPeople = async (): Promise<Person[]> => {
  const { data, error } = await supabase
    .from('people')
    .select('*')
    .is('deleted_at', null)
    .order('name');

  if (error) throw error;

  return data.map(p => ({
    id: p.id,
    name: p.name,
    initials: p.initials,
    color: p.color
  }));
};

export const createPerson = async (person: Omit<Person, 'id'>): Promise<Person> => {
  // Ensure user exists and get their ID
  const userId = await ensureUserExists();

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
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
};

// ==================== Objectives ====================

export const fetchObjectives = async (type?: ObjectiveType): Promise<Objective[]> => {
  let query = supabase
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
    .is('deleted_at', null);

  if (type) {
    query = query.eq('type', type);
  }

  query = query.order('order', { ascending: true });

  const { data: objectives, error } = await query;

  if (error) throw error;

  return objectives.map(obj => ({
    id: obj.id,
    title: obj.title,
    type: obj.type as ObjectiveType,
    status: (obj.status as ObjectiveStatus) || 'new',
    category: obj.category,
    description: obj.description,
    initiatives: obj.initiatives || [],
    order: obj.order || 0,
    keyResults: obj.key_results?.filter((kr: any) => !kr.deleted_at)
      .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
      .map((kr: any) => ({
        id: kr.id,
        title: kr.title,
        type: kr.type,
        current: kr.current,
        target: kr.target,
        unit: kr.unit,
        order: kr.order ?? 0,
        winLog: kr.winLog?.filter((w: any) => !w.deleted_at).map((w: any) => ({
          id: w.id,
          note: w.note,
          date: new Date(w.date).toLocaleDateString(),
          attributedTo: w.attributions?.filter((a: any) => !a.deleted_at).map((a: any) => a.person_id) || []
        })) || []
      })) || [],
    wins: obj.wins?.filter((w: any) => !w.deleted_at).map((w: any) => ({
      id: w.id,
      note: w.note,
      date: new Date(w.date).toLocaleDateString(),
      attributedTo: w.attributions?.filter((a: any) => !a.deleted_at).map((a: any) => a.person_id) || []
    })) || []
  }));
};

export const createObjective = async (objective: Omit<Objective, 'id' | 'keyResults' | 'wins'>): Promise<Objective> => {
  // Ensure user exists and get their ID
  const userId = await ensureUserExists();

  // Get the highest order value to place new objective at the end (filter by type)
  const { data: maxOrderObj } = await supabase
    .from('objectives')
    .select('order')
    .eq('type', objective.type)
    .is('deleted_at', null)
    .order('order', { ascending: false })
    .limit(1)
    .single();

  const newOrder = (maxOrderObj?.order ?? -1) + 1;

  const { data, error } = await supabase
    .from('objectives')
    .insert({
      user_id: userId,
      title: objective.title,
      type: objective.type,
      status: 'new',
      category: objective.category,
      description: objective.description,
      initiatives: objective.initiatives || [],
      order: newOrder
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    title: data.title,
    type: data.type as ObjectiveType,
    status: (data.status as ObjectiveStatus) || 'new',
    category: data.category,
    description: data.description,
    initiatives: data.initiatives || [],
    order: data.order,
    keyResults: [],
    wins: []
  };
};

export const updateObjective = async (objective: Objective): Promise<void> => {
  const { error } = await supabase
    .from('objectives')
    .update({
      title: objective.title,
      type: objective.type,
      status: objective.status,
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
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
};

// ==================== Key Results ====================

export const createKeyResult = async (objectiveId: string, kr: Omit<KeyResult, 'id'>): Promise<KeyResult> => {
  // Get the highest order value to place new KR at the end
  const { data: maxOrderKr } = await supabase
    .from('key_results')
    .select('order')
    .eq('objective_id', objectiveId)
    .is('deleted_at', null)
    .order('order', { ascending: false })
    .limit(1)
    .single();

  const newOrder = (maxOrderKr?.order ?? -1) + 1;

  const { data, error } = await supabase
    .from('key_results')
    .insert({
      objective_id: objectiveId,
      title: kr.title,
      type: kr.type,
      current: kr.current,
      target: kr.target,
      unit: kr.unit,
      order: newOrder
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
    order: data.order,
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
    .update({ deleted_at: new Date().toISOString() })
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
    .update({ deleted_at: new Date().toISOString() })
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
    .is('deleted_at', null)
    .single();

  if (error) throw error;

  return {
    id: obj.id,
    title: obj.title,
    type: obj.type as ObjectiveType,
    status: (obj.status as ObjectiveStatus) || 'new',
    category: obj.category,
    description: obj.description,
    initiatives: obj.initiatives || [],
    order: obj.order || 0,
    keyResults: obj.key_results?.filter((kr: any) => !kr.deleted_at)
      .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
      .map((kr: any) => ({
        id: kr.id,
        title: kr.title,
        type: kr.type,
        current: kr.current,
        target: kr.target,
        unit: kr.unit,
        order: kr.order ?? 0,
        winLog: kr.winLog?.filter((w: any) => !w.deleted_at).map((w: any) => ({
          id: w.id,
          note: w.note,
          date: new Date(w.date).toLocaleDateString(),
          attributedTo: w.attributions?.filter((a: any) => !a.deleted_at).map((a: any) => a.person_id) || []
        })) || []
      })) || [],
    wins: obj.wins?.filter((w: any) => !w.deleted_at).map((w: any) => ({
      id: w.id,
      note: w.note,
      date: new Date(w.date).toLocaleDateString(),
      attributedTo: w.attributions?.filter((a: any) => !a.deleted_at).map((a: any) => a.person_id) || []
    })) || []
  };
};

// ==================== Update Key Result Progress ====================

export const updateKeyResultProgress = async (krId: string, current: number): Promise<void> => {
  const { error } = await supabase
    .from('key_results')
    .update({ current })
    .eq('id', krId);

  if (error) throw error;
};

// ==================== Update Key Results Order ====================

export const updateKeyResultsOrder = async (keyResultOrders: { id: string; order: number }[]): Promise<void> => {
  const updates = keyResultOrders.map(({ id, order }) =>
    supabase
      .from('key_results')
      .update({ order })
      .eq('id', id)
  );

  const results = await Promise.all(updates);

  const errors = results.filter(r => r.error);
  if (errors.length > 0) {
    throw errors[0].error;
  }
};

// ==================== Update Objectives Order ====================

export const updateObjectivesOrder = async (objectiveOrders: { id: string; order: number; category?: string }[]): Promise<void> => {
  // Update each objective's order (and optionally category) in a batch
  const updates = objectiveOrders.map(({ id, order, category }) => {
    const updateData: any = { order };
    if (category !== undefined) {
      updateData.category = category;
    }
    return supabase
      .from('objectives')
      .update(updateData)
      .eq('id', id)
  });

  const results = await Promise.all(updates);

  const errors = results.filter(r => r.error);
  if (errors.length > 0) {
    throw errors[0].error;
  }
};

// ==================== Categories ====================

export const fetchCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .is('deleted_at', null)
    .order('order', { ascending: true });

  if (error) throw error;

  return data.map(c => ({
    id: c.id,
    name: c.name,
    order: c.order
  }));
};

export const createCategory = async (name: string): Promise<Category> => {
  const userId = await ensureUserExists();

  // Get the highest order value
  const { data: maxOrderCat } = await supabase
    .from('categories')
    .select('order')
    .is('deleted_at', null)
    .order('order', { ascending: false })
    .limit(1)
    .single();

  const newOrder = (maxOrderCat?.order ?? -1) + 1;

  const { data, error } = await supabase
    .from('categories')
    .insert({
      user_id: userId,
      name,
      order: newOrder
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    order: data.order
  };
};

export const deleteCategory = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('categories')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
};

export const updateCategoriesOrder = async (categoryOrders: { id: string; order: number }[]): Promise<void> => {
  const updates = categoryOrders.map(({ id, order }) =>
    supabase
      .from('categories')
      .update({ order })
      .eq('id', id)
  );

  const results = await Promise.all(updates);

  const errors = results.filter(r => r.error);
  if (errors.length > 0) {
    throw errors[0].error;
  }
};
