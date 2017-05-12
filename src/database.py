#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017 - Luca Versari <veluca93@gmail.com>

from .schema import Schema
from .config import Config
from .logger import Logger

from . import gevent_sqlite3 as sqlite3
from gevent.lock import BoundedSemaphore
import uuid


class Database:
    connected = False

    connection_sem = BoundedSemaphore()

    @staticmethod
    def gen_id():
        return str(uuid.uuid4())

    @staticmethod
    def get_meta(key, default=None, type=str):
        c = Database.conn.cursor()
        try:
            c.execute("""
                SELECT value FROM metadata WHERE key = :key
            """, {"key": key})
        except sqlite3.OperationalError:
            return default
        row = c.fetchone()
        return type(row[0]) if row is not None else default

    @staticmethod
    def set_meta(key, value):
        c = Database.conn.cursor()
        c.execute("""
            INSERT OR REPLACE INTO metadata(key, value) VALUES (:key, :value)
        """, {"key": key, "value": str(value)})

    @staticmethod
    def connect_to_database():
        if Database.connected is True:
            raise RuntimeError("Database already loaded")
        Database.connected = True
        Database.conn = sqlite3.connect(Config.db, detect_types=sqlite3.PARSE_DECLTYPES)
        c = Database.conn.cursor()
        c.executescript(Schema.INIT)
        version = Database.get_meta("schema_version", -1, int)
        if version == -1:
            Logger.info("DB_OPERATION", "Creating database")
        for upd in range(version+1, len(Schema.UPDATERS)):
            Logger.info("DB_OPERATION", "Applying updater %d" % upd)
            c.executescript(Schema.UPDATERS[upd])
            Database.set_meta("schema_version", upd)
            Database.conn.commit()

    @staticmethod
    def dictify(c, all=False):
        if all is False:
            res = c.fetchone()
            if res is None:
                return None
            return dict(zip(next(zip(*c.description)), res))
        else:
            descr = next(zip(*c.description))
            return [dict(zip(descr, row)) for row in c.fetchall()]

    @staticmethod
    def get_tasks():
        c = Database.conn.cursor()
        c.execute("""SELECT * FROM tasks""")
        return Database.dictify(c, all=True)

    @staticmethod
    def get_user(token):
        c = Database.conn.cursor()
        c.execute("""SELECT * FROM users WHERE token=:token""", {"token": token})
        return Database.dictify(c)

    @staticmethod
    def get_input(id=None, token=None, task=None, attempt=None):
        if (id is None) and (token is None or task is None or attempt is None):
            raise ValueError("Invalid parameters to get_input")
        c = Database.conn.cursor()
        if id is not None:
            c.execute("""SELECT * FROM inputs WHERE id=:id""", {"id": id})
        else:
            c.execute("""
                SELECT * FROM inputs
                WHERE token=:token AND task=:task AND attempt=:attempt
            """, {"token": token, "task": task, "attempt": attempt})
        return Database.dictify(c)

    @staticmethod
    def get_source(id):
        c = Database.conn.cursor()
        c.execute("""SELECT * FROM sources WHERE id=:id""", {"id": id})
        return Database.dictify(c)

    @staticmethod
    def get_output(id):
        c = Database.conn.cursor()
        c.execute("""SELECT * FROM outputs WHERE id=:id""", {"id": id})
        return Database.dictify(c)

    @staticmethod
    def get_submission(id):
        c = Database.conn.cursor()
        c.execute("""SELECT * FROM submissions WHERE id=:id""", {"id": id})
        return Database.dictify(c)

    @staticmethod
    def get_submissions(token, task):
        c = Database.conn.cursor()
        c.execute("""
            SELECT * FROM submissions
            JOIN inputs ON submissions.input = inputs.id,
            JOIN outputs ON submissions.output = outputs.id
            JOIN sources ON submissions.source = sources.id
            WHERE token=:token AND task=:task
            ORDER BY inputs.attempt ASC
        """, {"token": token, "task": task})
        return Database.dictify(c, all=True)

    @staticmethod
    def get_user_task(token, task):
        c = Database.conn.cursor()
        c.execute("""
            SELECT * FROM user_tasks
            WHERE token=:token AND task=:task
        """, {"token": token, "task": task})
        return Database.dictify(c)

    @staticmethod
    def has_ip(token, ip):
        c = Database.conn.cursor()
        c.execute("""
            SELECT * FROM ips
            WHERE token=:token AND ip=:ip
        """, {"token": token, "ip": ip})
        return c.fetchone() is not None

    @staticmethod
    def get_ips(token):
        c = Database.conn.cursor()
        c.execute("""
            SELECT * FROM ips WHERE token=:token
        """, {"token": token})
        return Database.dictify(c, all=True)

    @staticmethod
    def get_next_attempt(token, task):
        c = Database.conn.cursor()
        c.execute("""
            SELECT COUNT(*) FROM inputs
            WHERE token=:token AND task=:task
        """, {"token": token, "task": task})
        return c.fetchone()[0]+1

    @staticmethod
    def begin():
        Database.connection_sem.acquire()

    @staticmethod
    def commit():
        Database.conn.commit()
        Database.connection_sem.release()

    @staticmethod
    def rollback():
        Database.conn.rollback()
        Database.connection_sem.release()

    @staticmethod
    def do_write(autocommit, query, params):
        c = Database.conn.cursor()
        if autocommit:
            Database.begin()
            try:
                c.execute(query, params)
                Database.commit()
                return c.rowcount
            except:
                Database.rollback()
                raise
        else:
            c.execute(query, params)
            return c.rowcount

    @staticmethod
    def add_user(token, name, surname, autocommit=True):
        Database.do_write(autocommit, """
            INSERT INTO users (token, name, surname)
            VALUES (:token, :name, :surname)
        """, {"token": token, "name": name, "surname": surname})

    @staticmethod
    def add_input(id, token, task, attempt, path, size, autocommit=True):
        Database.do_write(autocommit, """
            INSERT INTO inputs (id, token, task, attempt, path, size)
            VALUES (:id, :token, :task, :attempt, :path, :size)
        """, {
            "token": token, "task": task, "attempt": attempt,
            "path": path, "size": size, "id": id
        })
