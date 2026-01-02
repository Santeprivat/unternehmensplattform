CREATE TABLE wz_node (
  code TEXT PRIMARY KEY,
  level INTEGER,
  title TEXT,
  parent_code TEXT,
  path TEXT
);

CREATE TABLE wz_synonym (
  id TEXT PRIMARY KEY,
  term TEXT,
  normalized_term TEXT,
  language TEXT,
  wz_code TEXT,
  weight INTEGER,
  source TEXT
);

CREATE TABLE requirement (
  id TEXT PRIMARY KEY,
  kind TEXT,
  name TEXT,
  description TEXT,
  severity TEXT,
  when_stage TEXT
);

CREATE TABLE wz_requirement (
  wz_code TEXT,
  requirement_id TEXT,
  applies_to_all_descendants BOOLEAN
);

CREATE TABLE hint_rule (
  id TEXT PRIMARY KEY,
  requirement_id TEXT,
  wz_scope TEXT,
  condition_json TEXT,
  explain TEXT
);
