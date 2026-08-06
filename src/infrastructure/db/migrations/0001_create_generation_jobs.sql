-- Initial schema for generation-job history (FR-13, AC-16). Additive only —
-- CREATE TABLE/INDEX IF NOT EXISTS guards so this can run repeatably from empty
-- without ever dropping or rewriting existing data (CLAUDE.md "existing data must
-- remain valid after schema changes").

CREATE TABLE IF NOT EXISTS generation_jobs (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('processing', 'complete', 'failed')),
  source_image_name TEXT NOT NULL,
  source_image_mime_type TEXT NOT NULL,
  source_image_size_bytes INTEGER NOT NULL,
  glb_file_path TEXT,
  glb_size_bytes INTEGER,
  error_message TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_generation_jobs_created_at
  ON generation_jobs (created_at DESC);
