#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017 - Luca Versari <veluca93@gmail.com>

class Schema:
    INIT = """PRAGMA foreign_keys = ON;"""
    UPDATERS = [
        # Creates the database
        """
            CREATE TABLE metadata (
                key TEXT PRIMARY KEY,
                value TEXT
            );

            CREATE TABLE users (
                token TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                surname TEXT NOT NULL,
                extratime INTEGER NOT NULL DEFAULT 0,
                first_login TIMESTAMP
            );

            CREATE TABLE tasks (
                name TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                statement_path TEXT NOT NULL,
                max_score REAL NOT NULL,
                CHECK (max_score > 0)
            );

            CREATE TABLE ips (
                token TEXT NOT NULL,
                ip TEXT NOT NULL,
                first_date TIMESTAMP NOT NULL,
                PRIMARY KEY (token, ip),
                FOREIGN KEY (token) REFERENCES users(token)
            );

            CREATE TABLE admin_ips (
                ip TEXT PRIMARY KEY,
                first_date TIMESTAMP NOT NULL
            );

            CREATE TABLE inputs (
                id TEXT PRIMARY KEY,
                token TEXT NOT NULL,
                task TEXT NOT NULL,
                attempt INTEGER NOT NULL,
                date TIMESTAMP NOT NULL,
                path TEXT NOT NULL,
                size INTEGER NOT NULL,
                FOREIGN KEY (token) REFERENCES users(token),
                FOREIGN KEY (task) REFERENCES tasks(name)
            );

            CREATE TABLE sources (
                id TEXT PRIMARY KEY,
                input TEXT NOT NULL,
                date TIMESTAMP NOT NULL,
                path TEXT NOT NULL,
                size INTEGER DEFAULT NULL,
                FOREIGN KEY (input) REFERENCES inputs(id)
            );

            CREATE TABLE outputs (
                id TEXT PRIMARY KEY,
                input TEXT NOT NULL,
                date TIMESTAMP NOT NULL,
                path TEXT NOT NULL,
                size INTEGER DEFAULT NULL,
                validation_result TEXT DEFAULT NULL,
                submission_result TEXT DEFAULT NULL,
                FOREIGN KEY (input) REFERENCES inputs(id)
                CHECK (
                    (submission_result IS NULL AND validation_result IS NULL) OR
                    (submission_result IS NOT NULL AND validation_result IS NOT NULL)
                )
            );

            CREATE TABLE submissions (
                id TEXT PRIMARY KEY,
                token TEXT NOT NULL,
                task TEXT NOT NULL,
                input TEXT UNIQUE NOT NULL,
                output TEXT NOT NULL,
                source TEXT NOT NULL,
                FOREIGN KEY (input, token, task) REFERENCES inputs(id, token, task),
                FOREIGN KEY (output, input) REFERENCES outputs(id, input),
                FOREIGN KEY (source, input) REFERENCES sources(id, input)
            );

            CREATE TABLE user_tasks (
                token TEXT NOT NULL,
                task TEXT NOT NULL,
                score REAL NOT NULL DEFAULT 0,
                current_attempt INTEGER DEFAULT NULL,
                FOREIGN KEY (token) REFERENCES users(token),
                FOREIGN KEY (task) REFERENCES tasks(id),
                FOREIGN KEY (token, task, current_attempt) REFERENCES inputs(token, task, attempt),
                CHECK (score >= 0)
            );

            CREATE TRIGGER check_score BEFORE UPDATE OF score ON user_tasks
            BEGIN
                SELECT RAISE(FAIL, "Invalid score")
                FROM tasks
                WHERE tasks.id = NEW.task
                  AND tasks.max_score < NEW.score;
            END;
        """
    ]
