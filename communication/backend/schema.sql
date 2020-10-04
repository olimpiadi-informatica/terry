PRAGMA foreign_keys = ON;

CREATE TABLE users (
    token TEXT PRIMARY KEY,
    isAdmin INTEGER NOT NULL CHECK (
        isAdmin = 0
        OR isAdmin = 1
    )
);

CREATE TABLE announcements (
    id INTEGER PRIMARY KEY,
    severity TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    creator TEXT NOT NULL REFERENCES users(token)
);

CREATE TABLE questions (
    id INTEGER PRIMARY KEY,
    content TEXT NOT NULL,
    date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    creator TEXT NOT NULL REFERENCES users(token),
    answer TEXT NULL,
    answerDate TIMESTAMP NULL,
    answerer TEXT NULL REFERENCES users(token)
)