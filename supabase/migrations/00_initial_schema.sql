-- Enums
CREATE TYPE "KeyResultType" AS ENUM ('leading', 'lagging', 'win_condition');
CREATE TYPE "ObjectiveType" AS ENUM ('okr', 'goal');

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- People table
CREATE TABLE people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  initials VARCHAR(10) NOT NULL,
  color VARCHAR(50) NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);
CREATE INDEX people_user_id_idx ON people(user_id);
CREATE INDEX people_name_idx ON people(name);
CREATE INDEX people_deleted_at_idx ON people(deleted_at);

-- Objectives table
CREATE TABLE objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type "ObjectiveType" NOT NULL DEFAULT 'okr',
  status TEXT DEFAULT 'new',
  category VARCHAR(100),
  description TEXT,
  initiatives TEXT[],
  "order" INT NOT NULL DEFAULT 0,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);
CREATE INDEX objectives_user_id_idx ON objectives(user_id);
CREATE INDEX objectives_type_idx ON objectives(type);
CREATE INDEX objectives_category_idx ON objectives(category);
CREATE INDEX objectives_created_at_idx ON objectives(created_at);
CREATE INDEX objectives_deleted_at_idx ON objectives(deleted_at);
CREATE INDEX objectives_order_idx ON objectives("order");

-- Key Results table
CREATE TABLE key_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type "KeyResultType" NOT NULL,
  current FLOAT NOT NULL DEFAULT 0,
  target FLOAT NOT NULL,
  unit VARCHAR(50) NOT NULL,
  objective_id UUID NOT NULL REFERENCES objectives(id) ON DELETE CASCADE,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);
CREATE INDEX key_results_objective_id_idx ON key_results(objective_id);
CREATE INDEX key_results_type_idx ON key_results(type);
CREATE INDEX key_results_deleted_at_idx ON key_results(deleted_at);

-- Win Logs table
CREATE TABLE win_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note TEXT NOT NULL,
  date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  objective_id UUID REFERENCES objectives(id) ON DELETE CASCADE,
  key_result_id UUID REFERENCES key_results(id) ON DELETE CASCADE
);
CREATE INDEX win_logs_objective_id_idx ON win_logs(objective_id);
CREATE INDEX win_logs_key_result_id_idx ON win_logs(key_result_id);
CREATE INDEX win_logs_date_idx ON win_logs(date);
CREATE INDEX win_logs_deleted_at_idx ON win_logs(deleted_at);

-- Win Attributions table
CREATE TABLE win_attributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  win_log_id UUID NOT NULL REFERENCES win_logs(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  UNIQUE(win_log_id, person_id)
);
CREATE INDEX win_attributions_win_log_id_idx ON win_attributions(win_log_id);
CREATE INDEX win_attributions_person_id_idx ON win_attributions(person_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE win_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE win_attributions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for authenticated users
CREATE POLICY "Authenticated users can view all" ON users FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert" ON users FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update" ON users FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view objectives" ON objectives FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert objectives" ON objectives FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update objectives" ON objectives FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete objectives" ON objectives FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view people" ON people FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert people" ON people FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update people" ON people FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete people" ON people FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view key_results" ON key_results FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert key_results" ON key_results FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update key_results" ON key_results FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete key_results" ON key_results FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view win_logs" ON win_logs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert win_logs" ON win_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update win_logs" ON win_logs FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete win_logs" ON win_logs FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view win_attributions" ON win_attributions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert win_attributions" ON win_attributions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update win_attributions" ON win_attributions FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete win_attributions" ON win_attributions FOR DELETE USING (auth.role() = 'authenticated');
