-- Migration number: 0001 	 2025-12-07T11:00:00.000Z
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS workouts;

CREATE TABLE workouts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    unit TEXT NOT NULL,
    label_unit TEXT NOT NULL
);

CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    workout_id TEXT NOT NULL,
    value REAL NOT NULL,
    label TEXT,
    successful BOOLEAN NOT NULL DEFAULT TRUE,
    date TEXT NOT NULL,
    FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE
);
