-- Add role to users table
ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'Contestant';

-- Create announcements table
CREATE TABLE announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    severity TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    creator TEXT NOT NULL,
    date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(creator) REFERENCES users(token)
);

-- Create questions table
CREATE TABLE questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    creator TEXT NOT NULL,
    date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    answer TEXT,
    answerer TEXT,
    answer_date DATETIME,
    FOREIGN KEY(creator) REFERENCES users(token),
    FOREIGN KEY(answerer) REFERENCES users(token)
);