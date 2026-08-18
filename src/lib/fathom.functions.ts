import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const bootstrapProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { ensureProfile } = await import("./pipeline.server");
    const claims = context.claims as Record<string, unknown> | undefined;
    const meta = (claims?.["user_metadata"] as Record<string, unknown> | undefined) ?? {};
    return ensureProfile(context.supabase, {
      id: context.userId,
      email: (claims?.["email"] as string | undefined) ?? null,
      full_name: (meta["full_name"] as string | undefined) ?? (meta["name"] as string | undefined) ?? null,
      avatar_url: (meta["avatar_url"] as string | undefined) ?? null,
    });
  });

export const buildPath = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      rawInput: string;
      desiredOutcome: string;
      currentLevel: string;
      minutesPerDay: number;
      daysPerWeek: number;
      deadline: string | null;
      budget: string;
      formats: string[];
    }) => data,
  )
  .handler(async ({ data, context }) => {
    const { stageBlueprint } = await import("./pipeline.server");
    return stageBlueprint(context.supabase, context.userId, data);
  });

export const buildRoadmapStage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { goalId: string }) => data)
  .handler(async ({ data, context }) => {
    const { stageRoadmap } = await import("./pipeline.server");
    return stageRoadmap(context.supabase, context.userId, data.goalId);
  });

export const buildResourcesStage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { goalId: string }) => data)
  .handler(async ({ data, context }) => {
    const { stageResources } = await import("./pipeline.server");
    return stageResources(context.supabase, context.userId, data.goalId);
  });

export const getDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { goalId?: string | null }) => data)
  .handler(async ({ data, context }) => {
    const { loadDashboard } = await import("./pipeline.server");
    return loadDashboard(context.supabase, context.userId, data.goalId ?? null);
  });

export const getGoalDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { goalId: string }) => data)
  .handler(async ({ data, context }) => {
    const db = context.supabase;
    const [{ data: goal }, { data: modules }, { data: mastery }, { data: skills }] = await Promise.all([
      db.from("learning_goals").select("*").eq("id", data.goalId).single(),
      db.from("modules").select("*").eq("goal_id", data.goalId).order("week_number").order("sort_order"),
      db.from("concept_mastery").select("*").eq("goal_id", data.goalId),
      db.from("skills").select("*").eq("goal_id", data.goalId).order("sort_order"),
    ]);
    const moduleIds = (modules ?? []).map((m) => m.id);
    const { data: moduleResources } = moduleIds.length
      ? await db
          .from("module_resources")
          .select("*, resources(*)")
          .in("module_id", moduleIds)
          .order("sort_order")
      : { data: [] };
    return { goal, modules: modules ?? [], mastery: mastery ?? [], skills: skills ?? [], moduleResources: moduleResources ?? [] };
  });

export const getTodaySession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { goalId: string }) => data)
  .handler(async ({ data, context }) => {
    const { getOrCreateTodaySession } = await import("./pipeline.server");
    const session = await getOrCreateTodaySession(context.supabase, context.userId, data.goalId);
    const db = context.supabase;
    const { data: moduleResources } = session.module_id
      ? await db.from("module_resources").select("*, resources(*)").eq("module_id", session.module_id).order("sort_order")
      : { data: [] };
    const { data: module } = session.module_id
      ? await db.from("modules").select("*").eq("id", session.module_id).maybeSingle()
      : { data: null };
    return { session, moduleResources: moduleResources ?? [], module };
  });

export const finishSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { sessionId: string; minutes: number; confidence: number; notes: string; concepts: string[]; goalId: string }) => data,
  )
  .handler(async ({ data, context }) => {
    const db = context.supabase;
    const { bumpMastery, refreshGoalMastery } = await import("./pipeline.server");
    await db
      .from("learning_sessions")
      .update({
        actual_minutes: data.minutes,
        confidence: data.confidence,
        notes: data.notes,
        status: "complete",
        completed_at: new Date().toISOString(),
      })
      .eq("id", data.sessionId);
    for (const concept of data.concepts.slice(0, 12)) {
      await bumpMastery(db, context.userId, data.goalId, concept, {
        exposure: 1,
        confidence: data.confidence / 5,
      });
    }
    await refreshGoalMastery(db, data.goalId);
    await db.from("activity_log").insert({
      user_id: context.userId,
      goal_id: data.goalId,
      kind: "session_completed",
      minutes: data.minutes,
    });
    return { ok: true };
  });

export const startAssessment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { goalId: string; moduleId?: string | null; sessionId?: string | null; concepts?: string[] }) => data)
  .handler(async ({ data, context }) => {
    const { createAssessment } = await import("./pipeline.server");
    return createAssessment(context.supabase, context.userId, data);
  });

export const submitAnswers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { assessmentId: string; responses: Array<{ questionId: string; response: string }> }) => data)
  .handler(async ({ data, context }) => {
    const { submitAssessment } = await import("./pipeline.server");
    return submitAssessment(context.supabase, context.userId, data);
  });

export const makeNotes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { goalId: string; concepts: string[]; material?: string }) => data)
  .handler(async ({ data, context }) => {
    const { writeNotes } = await import("./pipeline.server");
    return writeNotes(context.supabase, context.userId, data);
  });

export const listNotes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { goalId: string }) => data)
  .handler(async ({ data, context }) => {
    const { data: notes } = await context.supabase
      .from("notes")
      .select("*")
      .eq("goal_id", data.goalId)
      .order("updated_at", { ascending: false });
    return notes ?? [];
  });

export const saveUserNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { noteId: string; userNotes: string; confidence?: number }) => data)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("notes")
      .update({ user_notes: data.userNotes, confidence: data.confidence ?? null })
      .eq("id", data.noteId);
    if (error) throw error;
    return { ok: true };
  });

export const tutor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { goalId: string; question: string; history: Array<{ role: "user" | "assistant"; content: string }> }) => data)
  .handler(async ({ data, context }) => {
    const { askTutor } = await import("./pipeline.server");
    return { reply: await askTutor(context.supabase, data) };
  });

export const newProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { goalId: string }) => data)
  .handler(async ({ data, context }) => {
    const { createProject } = await import("./pipeline.server");
    return createProject(context.supabase, context.userId, data.goalId);
  });

export const completeProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { projectId: string; submission: string; goalId: string; skills: string[] }) => data)
  .handler(async ({ data, context }) => {
    const db = context.supabase;
    const { bumpMastery, refreshGoalMastery } = await import("./pipeline.server");
    await db
      .from("projects")
      .update({ status: "complete", submission: data.submission })
      .eq("id", data.projectId);
    for (const skill of data.skills.slice(0, 12)) {
      await bumpMastery(db, context.userId, data.goalId, skill, { application: 0.9, practice: 0.9, exposure: 1 });
    }
    await refreshGoalMastery(db, data.goalId);
    await db.from("activity_log").insert({ user_id: context.userId, goal_id: data.goalId, kind: "project_completed" });
    return { ok: true };
  });

export const adaptPath = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { goalId: string }) => data)
  .handler(async ({ data, context }) => {
    const { adapt } = await import("./pipeline.server");
    return adapt(context.supabase, data.goalId);
  });

export const updateGoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      goalId: string;
      patch: Partial<{
        status: string;
        minutes_per_day: number;
        days_per_week: number;
        deadline: string | null;
        desired_outcome: string;
      }>;
    }) => data,
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("learning_goals").update(data.patch).eq("id", data.goalId);
    if (error) throw error;
    const { adapt } = await import("./pipeline.server");
    if (data.patch.deadline !== undefined || data.patch.minutes_per_day || data.patch.days_per_week) {
      await adapt(context.supabase, data.goalId);
    }
    return { ok: true };
  });

export const listResources = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { goalId: string }) => data)
  .handler(async ({ data, context }) => {
    const db = context.supabase;
    const { data: modules } = await db.from("modules").select("id, title, week_number").eq("goal_id", data.goalId);
    const ids = (modules ?? []).map((m) => m.id);
    if (!ids.length) return { modules: [], items: [] };
    const { data: items } = await db
      .from("module_resources")
      .select("*, resources(*)")
      .in("module_id", ids)
      .order("sort_order");
    return { modules: modules ?? [], items: items ?? [] };
  });

export const markResourceDone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { moduleResourceId: string; completed: boolean }) => data)
  .handler(async ({ data, context }) => {
    await context.supabase
      .from("module_resources")
      .update({ completed: data.completed })
      .eq("id", data.moduleResourceId);
    return { ok: true };
  });

export const getProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { goalId: string }) => data)
  .handler(async ({ data, context }) => {
    const db = context.supabase;
    const [{ data: goal }, { data: mastery }, { data: sessions }, { data: assessments }, { data: projects }, { data: skills }] =
      await Promise.all([
        db.from("learning_goals").select("*").eq("id", data.goalId).single(),
        db.from("concept_mastery").select("*").eq("goal_id", data.goalId).order("mastery", { ascending: false }),
        db.from("learning_sessions").select("session_date, actual_minutes, planned_minutes, status").eq("goal_id", data.goalId).order("session_date"),
        db.from("assessments").select("id, score, created_at, status").eq("goal_id", data.goalId).order("created_at"),
        db.from("projects").select("id, title, status").eq("goal_id", data.goalId),
        db.from("skills").select("id, name, importance, parent_id").eq("goal_id", data.goalId),
      ]);
    return {
      goal,
      mastery: mastery ?? [],
      sessions: sessions ?? [],
      assessments: assessments ?? [],
      projects: projects ?? [],
      skills: skills ?? [],
    };
  });

export const exportData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = context.supabase;
    const [goals, modules, notes, mastery, sessions, projects, assessments] = await Promise.all([
      db.from("learning_goals").select("*"),
      db.from("modules").select("*"),
      db.from("notes").select("*"),
      db.from("concept_mastery").select("*"),
      db.from("learning_sessions").select("*"),
      db.from("projects").select("*"),
      db.from("assessments").select("*"),
    ]);
    return {
      exported_at: new Date().toISOString(),
      goals: goals.data ?? [],
      modules: modules.data ?? [],
      notes: notes.data ?? [],
      concept_mastery: mastery.data ?? [],
      sessions: sessions.data ?? [],
      projects: projects.data ?? [],
      assessments: assessments.data ?? [],
    };
  });

export const deleteGoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { goalId: string }) => data)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("learning_goals").delete().eq("id", data.goalId);
    if (error) throw error;
    return { ok: true };
  });

export const deleteAllData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = context.supabase;
    await db.from("learning_goals").delete().eq("user_id", context.userId);
    await db.from("notes").delete().eq("user_id", context.userId);
    await db.from("activity_log").delete().eq("user_id", context.userId);
    await db.from("profiles").update({ onboarded: false }).eq("id", context.userId);
    return { ok: true };
  });
