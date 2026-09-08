CREATE TABLE diagnostic_history (
  id TEXT PRIMARY KEY NOT NULL,
  project TEXT NOT NULL,
  diagnosed_at TEXT NOT NULL,
  saved_at TEXT NOT NULL,
  evaluation TEXT NOT NULL,
  candidate_count INTEGER NOT NULL,
  result_json TEXT NOT NULL
);
CREATE INDEX diagnostic_history_saved_at ON diagnostic_history(saved_at, id);
