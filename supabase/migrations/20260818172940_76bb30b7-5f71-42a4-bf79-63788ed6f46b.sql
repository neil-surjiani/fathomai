
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  onboarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER t_profiles_upd BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- learning_goals
CREATE TABLE public.learning_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  raw_input TEXT,
  desired_outcome TEXT,
  current_level TEXT,
  minutes_per_day INTEGER NOT NULL DEFAULT 45,
  days_per_week INTEGER NOT NULL DEFAULT 5,
  deadline DATE,
  budget TEXT NOT NULL DEFAULT 'free_only',
  preferred_formats TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active',
  estimated_total_hours NUMERIC NOT NULL DEFAULT 0,
  estimated_completion_date DATE,
  mastery_score NUMERIC NOT NULL DEFAULT 0,
  blueprint JSONB,
  generation_state TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_goals_user ON public.learning_goals(user_id, status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learning_goals TO authenticated;
GRANT ALL ON public.learning_goals TO service_role;
ALTER TABLE public.learning_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own goals" ON public.learning_goals FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER t_goals_upd BEFORE UPDATE ON public.learning_goals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- skills
CREATE TABLE public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.learning_goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  parent_id UUID REFERENCES public.skills(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  summary TEXT,
  importance TEXT NOT NULL DEFAULT 'essential',
  estimated_minutes INTEGER NOT NULL DEFAULT 60,
  sort_order INTEGER NOT NULL DEFAULT 0,
  mastery NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_skills_goal ON public.skills(goal_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.skills TO authenticated;
GRANT ALL ON public.skills TO service_role;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own skills" ON public.skills FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.skill_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  prerequisite_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.skill_dependencies TO authenticated;
GRANT ALL ON public.skill_dependencies TO service_role;
ALTER TABLE public.skill_dependencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own deps" ON public.skill_dependencies FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- modules
CREATE TABLE public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.learning_goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  skill_id UUID REFERENCES public.skills(id) ON DELETE SET NULL,
  week_number INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  objective TEXT,
  concepts TEXT[] NOT NULL DEFAULT '{}',
  importance TEXT NOT NULL DEFAULT 'essential',
  estimated_minutes INTEGER NOT NULL DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'not_started',
  mastery NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_modules_goal ON public.modules(goal_id, week_number, sort_order);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.modules TO authenticated;
GRANT ALL ON public.modules TO service_role;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own modules" ON public.modules FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER t_modules_upd BEFORE UPDATE ON public.modules FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- resources (shared catalog)
CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  provider TEXT,
  resource_type TEXT NOT NULL DEFAULT 'article',
  author TEXT,
  duration_minutes INTEGER,
  price TEXT NOT NULL DEFAULT 'free',
  difficulty TEXT NOT NULL DEFAULT 'beginner',
  topics TEXT[] NOT NULL DEFAULT '{}',
  description TEXT,
  quality_score NUMERIC NOT NULL DEFAULT 0,
  relevance_score NUMERIC NOT NULL DEFAULT 0,
  recency_score NUMERIC NOT NULL DEFAULT 0,
  hands_on_score NUMERIC NOT NULL DEFAULT 0,
  beginner_friendliness NUMERIC NOT NULL DEFAULT 0,
  source TEXT,
  source_metadata JSONB,
  verified BOOLEAN NOT NULL DEFAULT false,
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_resources_topics ON public.resources USING GIN(topics);
GRANT SELECT ON public.resources TO authenticated;
GRANT ALL ON public.resources TO service_role;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "resources readable" ON public.resources FOR SELECT TO authenticated USING (true);

CREATE TABLE public.module_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reason TEXT,
  coverage NUMERIC,
  sort_order INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_modres_module ON public.module_resources(module_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.module_resources TO authenticated;
GRANT ALL ON public.module_resources TO service_role;
ALTER TABLE public.module_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own module resources" ON public.module_resources FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- sessions
CREATE TABLE public.learning_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  goal_id UUID NOT NULL REFERENCES public.learning_goals(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.modules(id) ON DELETE SET NULL,
  session_date DATE NOT NULL DEFAULT (now()::date),
  objective TEXT,
  plan JSONB NOT NULL DEFAULT '[]'::jsonb,
  planned_minutes INTEGER NOT NULL DEFAULT 45,
  actual_minutes INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  confidence INTEGER,
  status TEXT NOT NULL DEFAULT 'planned',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sessions_user_date ON public.learning_sessions(user_id, session_date DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learning_sessions TO authenticated;
GRANT ALL ON public.learning_sessions TO service_role;
ALTER TABLE public.learning_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sessions" ON public.learning_sessions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER t_sessions_upd BEFORE UPDATE ON public.learning_sessions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- concept mastery
CREATE TABLE public.concept_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  goal_id UUID NOT NULL REFERENCES public.learning_goals(id) ON DELETE CASCADE,
  concept TEXT NOT NULL,
  module_id UUID REFERENCES public.modules(id) ON DELETE SET NULL,
  exposure NUMERIC NOT NULL DEFAULT 0,
  practice NUMERIC NOT NULL DEFAULT 0,
  assessment_score NUMERIC NOT NULL DEFAULT 0,
  recall NUMERIC NOT NULL DEFAULT 0,
  application NUMERIC NOT NULL DEFAULT 0,
  confidence NUMERIC NOT NULL DEFAULT 0,
  mastery NUMERIC NOT NULL DEFAULT 0,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (goal_id, concept)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.concept_mastery TO authenticated;
GRANT ALL ON public.concept_mastery TO service_role;
ALTER TABLE public.concept_mastery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own mastery" ON public.concept_mastery FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER t_mastery_upd BEFORE UPDATE ON public.concept_mastery FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- assessments
CREATE TABLE public.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  goal_id UUID NOT NULL REFERENCES public.learning_goals(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.modules(id) ON DELETE SET NULL,
  session_id UUID REFERENCES public.learning_sessions(id) ON DELETE SET NULL,
  kind TEXT NOT NULL DEFAULT 'practice',
  concepts TEXT[] NOT NULL DEFAULT '{}',
  score NUMERIC,
  status TEXT NOT NULL DEFAULT 'in_progress',
  summary_feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assessments TO authenticated;
GRANT ALL ON public.assessments TO service_role;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own assessments" ON public.assessments FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  concept TEXT,
  question_type TEXT NOT NULL DEFAULT 'multiple_choice',
  prompt TEXT NOT NULL,
  options TEXT[],
  correct_answer TEXT,
  rubric TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.questions TO authenticated;
GRANT ALL ON public.questions TO service_role;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own questions" ON public.questions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  response TEXT,
  correct BOOLEAN,
  score NUMERIC,
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.answers TO authenticated;
GRANT ALL ON public.answers TO service_role;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own answers" ON public.answers FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- knowledge base
CREATE TABLE public.knowledge_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  goal_id UUID REFERENCES public.learning_goals(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.knowledge_nodes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'concept',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.knowledge_nodes TO authenticated;
GRANT ALL ON public.knowledge_nodes TO service_role;
ALTER TABLE public.knowledge_nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own nodes" ON public.knowledge_nodes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  goal_id UUID REFERENCES public.learning_goals(id) ON DELETE CASCADE,
  node_id UUID REFERENCES public.knowledge_nodes(id) ON DELETE SET NULL,
  concept TEXT NOT NULL,
  explanation TEXT,
  key_points TEXT[] NOT NULL DEFAULT '{}',
  examples TEXT[] NOT NULL DEFAULT '{}',
  common_mistakes TEXT[] NOT NULL DEFAULT '{}',
  related_concepts TEXT[] NOT NULL DEFAULT '{}',
  source_links TEXT[] NOT NULL DEFAULT '{}',
  user_notes TEXT,
  confidence INTEGER,
  revision_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, goal_id, concept)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notes TO authenticated;
GRANT ALL ON public.notes TO service_role;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notes" ON public.notes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER t_notes_upd BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- projects
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  goal_id UUID NOT NULL REFERENCES public.learning_goals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  brief TEXT,
  skills_practiced TEXT[] NOT NULL DEFAULT '{}',
  requirements TEXT[] NOT NULL DEFAULT '{}',
  estimated_minutes INTEGER NOT NULL DEFAULT 120,
  difficulty TEXT NOT NULL DEFAULT 'beginner',
  status TEXT NOT NULL DEFAULT 'available',
  submission TEXT,
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own projects" ON public.projects FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER t_projects_upd BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- activity
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  goal_id UUID REFERENCES public.learning_goals(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  detail JSONB,
  minutes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_activity_user ON public.activity_log(user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_log TO authenticated;
GRANT ALL ON public.activity_log TO service_role;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own activity" ON public.activity_log FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, resource_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookmarks TO authenticated;
GRANT ALL ON public.bookmarks TO service_role;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own bookmarks" ON public.bookmarks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
