-- Drop Triggers
DROP TRIGGER IF EXISTS check_submission_dates;
DROP TRIGGER IF EXISTS check_source_dates;
DROP TRIGGER IF EXISTS check_output_dates;
DROP TRIGGER IF EXISTS check_score;

-- Drop Tables
DROP TABLE IF EXISTS user_tasks;
DROP TABLE IF EXISTS submissions;
DROP TABLE IF EXISTS outputs;
DROP TABLE IF EXISTS sources;
DROP TABLE IF EXISTS inputs;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS users;