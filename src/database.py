#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017 - Edoardo Morassutto <edoardo.morassutto@gmail.com>
# Copyright 2017 - Luca Versari <veluca93@gmail.com>
# Copyright 2017 - Massimo Cairo <cairomassimo@gmail.com>

from .schema import Schema
from .config import Config
from .logger import Logger

import sqlite3
from gevent.lock import BoundedSemaphore
import uuid


class Database:
    connected = False

    connection_sem = BoundedSemaphore()

    @staticmethod
    def gen_id():
        return str(uuid.uuid4())

    @staticmethod
    def connect_to_database():
        if Database.connected is True:
            raise RuntimeError("Database already loaded")
        Database.connected = True
        Database.conn = sqlite3.connect(
            Config.db,
            check_same_thread=False,
            isolation_level=None,
            detect_types=sqlite3.PARSE_DECLTYPES
        )
        Database.c = Database.conn.cursor()
        Database.c.executescript(Schema.INIT)
        version = Database.get_meta("schema_version", -1, int)
        if version == -1:
            Logger.info("DB_OPERATION", "Creating database")
        for upd in range(version+1, len(Schema.UPDATERS)):
            Logger.info("DB_OPERATION", "Applying updater %d" % upd)
            Database.c.executescript(Schema.UPDATERS[upd])
            Database.set_meta("schema_version", upd)
            Database.conn.commit()

    @staticmethod
    def disconnect_database():
        Database.conn.close()
        Database.connected = False

    @staticmethod
    def dictify(all=False):
        c = Database.c
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
        Database.c.execute("""SELECT * FROM tasks ORDER BY num ASC""")
        return Database.dictify(all=True)

    @staticmethod
    def get_task(task):
        Database.c.execute("""
            SELECT * FROM tasks WHERE name = :task
        """, {"task": task})
        return Database.dictify()

    @staticmethod
    def get_user(token):
        Database.c.execute("""
            SELECT * FROM users WHERE token=:token
        """, {"token": token})
        return Database.dictify()

    @staticmethod
    def get_users():
        Database.c.execute("""
            SELECT
                users.token AS users_token, users.name AS users_name,
                users.surname AS users_surname,
                ips.first_date AS ips_first_date,
                users.extra_time AS users_extra_time, ips.ip AS ips_ip
            FROM users
            LEFT JOIN ips ON users.token = ips.token
        """)
        users = Database.dictify(all=True)

        users_dict = {}
        for user in users:
            token = user["users_token"]
            if token not in users_dict:
                users_dict[token] = { 'ip': [] }
            ip = {}
            for k, v in user.items():
                if k.startswith("users_"): users_dict[token][k[6:]] = v
                if k.startswith("ips_"):   ip[k[4:]] = v

            if ip["ip"] is not None:
                users_dict[token]["ip"].append(ip)
        return list(users_dict.values())

    @staticmethod
    def get_input(id=None, token=None, task=None, attempt=None):
        if (id is None) and (token is None or task is None or attempt is None):
            raise ValueError("Invalid parameters to get_input")
        c = Database.c
        if id is not None:
            c.execute("""SELECT * FROM inputs WHERE id=:id""", {"id": id})
        else:
            c.execute("""
                SELECT * FROM inputs
                WHERE token=:token AND task=:task AND attempt=:attempt
            """, {"token": token, "task": task, "attempt": attempt})
        return Database.dictify()

    @staticmethod
    def get_source(id):
        Database.c.execute("""
            SELECT * FROM sources WHERE id=:id
        """, {"id": id})
        return Database.dictify()

    @staticmethod
    def get_output(id):
        Database.c.execute("""
            SELECT * FROM outputs WHERE id=:id
        """, {"id": id})
        return Database.dictify()

    @staticmethod
    def get_submission(id):
        Database.c.execute("""
            SELECT
                submissions.id AS id, submissions.token AS token, submissions.task AS task,
                submissions.score AS score, submissions.date AS date,
                inputs.id AS input_id, inputs.attempt AS input_attempt, inputs.date AS input_date,
                inputs.path AS input_path, inputs.size AS input_size,
                outputs.id AS output_id, outputs.date AS output_date, outputs.path AS output_path,
                outputs.size AS output_size, outputs.result AS output_result,
                sources.id AS source_id, sources.date AS source_date, sources.path AS source_path,
                sources.size AS source_size
            FROM submissions
            JOIN inputs ON submissions.input = inputs.id
            JOIN outputs ON submissions.output = outputs.id
            JOIN sources ON submissions.source = sources.id
            WHERE submissions.id=:id
        """, {"id": id})
        return Database.dictify()

    @staticmethod
    def get_submissions(token, task):
        Database.c.execute("""
            SELECT
                submissions.id AS id, submissions.token AS token, submissions.task AS task,
                submissions.score AS score, submissions.date AS date,
                inputs.id AS input_id, inputs.attempt AS input_attempt, inputs.date AS input_date,
                inputs.path AS input_path, inputs.size AS input_size,
                outputs.id AS output_id, outputs.date AS output_date, outputs.path AS output_path,
                outputs.size AS output_size, outputs.result AS output_result,
                sources.id AS source_id, sources.date AS source_date, sources.path AS source_path,
                sources.size AS source_size
            FROM submissions
            JOIN inputs ON submissions.input = inputs.id
            JOIN outputs ON submissions.output = outputs.id
            JOIN sources ON submissions.source = sources.id
            WHERE submissions.token=:token AND submissions.task=:task
            ORDER BY inputs.attempt ASC
        """, {"token": token, "task": task})
        return Database.dictify(all=True)

    @staticmethod
    def get_user_task(token, task=None):
        c = Database.c
        if task is not None:
            c.execute("""
                SELECT * FROM user_tasks
                WHERE token=:token AND task=:task
            """, {"token": token, "task": task})
            return Database.dictify()
        else:
            c.execute("""
                SELECT * FROM user_tasks
                WHERE token=:token
            """, {"token": token})
            return Database.dictify(all=True)

    # This method is not used yet
    # @staticmethod
    # def get_ips(token):
    #     Database.c.execute("""
    #         SELECT * FROM ips WHERE token=:token
    #     """, {"token": token})
    #     return Database.dictify(all=True)

    @staticmethod
    def get_next_attempt(token, task):
        Database.c.execute("""
            SELECT COUNT(*) FROM inputs
            WHERE token=:token AND task=:task
        """, {"token": token, "task": task})
        return Database.c.fetchone()[0]+1

    @staticmethod
    def begin():
        Database.connection_sem.acquire()
        try:
            Database.c.execute("""BEGIN TRANSACTION;""")
        except:
            Database.connection_sem.release()
            raise

    @staticmethod
    def commit():
        try:
            Database.c.execute("""COMMIT;""")
        finally:
            Database.connection_sem.release()

    @staticmethod
    def rollback():
        try:
            Database.c.execute("""ROLLBACK;""")
        finally:
            Database.connection_sem.release()

    @staticmethod
    def do_write(autocommit, query, params):
        if autocommit:
            Database.begin()
            try:
                Database.c.execute(query, params)
                rowcount = Database.c.rowcount
                Database.commit()
                return rowcount
            except:
                Database.rollback()
                raise
        else:
            Database.c.execute(query, params)
            return Database.c.rowcount

    @staticmethod
    def get_meta(key, default=None, type=None):
        c = Database.conn.cursor()
        try:
            c.execute("""
                SELECT value FROM metadata WHERE key = :key
            """, {"key": key})
        except sqlite3.OperationalError:
            return default
        row = c.fetchone()
        if row:
            if type is None:
                return row[0]
            elif type == bool:
                return row[0] == "True"
            else:
                return type(row[0])
        return default

    @staticmethod
    def set_meta(key, value, autocommit=True):
        return 1 == Database.do_write(autocommit, """
            INSERT OR REPLACE INTO metadata(key, value) VALUES (:key, :value)
        """, {"key": key, "value": str(value)})

    @staticmethod
    def del_meta(key, autocommit=True):
        return 1 == Database.do_write(autocommit, """
            DELETE FROM metadata WHERE key = :key
        """, {"key": key})

    @staticmethod
    def add_user(token, name, surname, sso_user=False, autocommit=True):
        return 1 == Database.do_write(autocommit, """
            INSERT INTO users (token, name, surname, sso_user)
            VALUES (:token, :name, :surname, :sso_user)
        """, {"token": token, "name": name, "surname": surname,
              "sso_user": 1 if sso_user else 0})

    @staticmethod
    def add_task(name, title, statement_path, max_score, num, autocommit=True):
        return 1 == Database.do_write(autocommit, """
            INSERT INTO tasks (name, title, statement_path, max_score, num)
            VALUES (:name, :title, :statement_path, :max_score, :num)
        """, {
            "name": name, "title": title, "max_score": max_score,
            "statement_path": statement_path, "num": num
        })

    @staticmethod
    def add_user_task(token, task, autocommit=True):
        return 1 == Database.do_write(autocommit, """
            INSERT INTO user_tasks (token, task)
            VALUES (:token, :task)
        """, {"token": token, "task": task})

    @staticmethod
    def register_ip(token, ip, autocommit=True):
        return 1 == Database.do_write(autocommit, """
            INSERT OR IGNORE INTO ips (token, ip)
            VALUES (:token, :ip)
        """, {"token": token, "ip": ip})

    @staticmethod
    def register_admin_ip(ip, autocommit=True):
        return 1 == Database.do_write(autocommit, """
            INSERT OR IGNORE INTO admin_ips (ip)
            VALUES (:ip)
        """, {"ip": ip})

    @staticmethod
    def add_input(id, token, task, attempt, path, size, autocommit=True):
        return 1 == Database.do_write(autocommit, """
            INSERT INTO inputs (id, token, task, attempt, path, size)
            VALUES (:id, :token, :task, :attempt, :path, :size)
        """, {
            "token": token, "task": task, "attempt": attempt,
            "path": path, "size": size, "id": id
        })

    @staticmethod
    def add_source(id, input, path, size, autocommit=True):
        return 1 == Database.do_write(autocommit, """
            INSERT INTO sources (id, input, path, size)
            VALUES (:id, :input, :path, :size)
        """, {"id": id, "input": input, "path": path, "size": size})

    @staticmethod
    def add_output(id, input, path, size, result, autocommit=True):
        return 1 == Database.do_write(autocommit, """
            INSERT INTO outputs (id, input, path, size, result)
            VALUES (:id, :input, :path, :size, :result)
        """, {"id": id, "input": input, "path": path,
              "size": size, "result": result})

    @staticmethod
    def add_submission(id, input, output, source, score, autocommit=True):
        return 1 == Database.do_write(autocommit, """
            INSERT INTO submissions (id, token, task, input, output, source, score)
            SELECT :id, token, task, :input, :output, :source, :score
            FROM inputs
            WHERE id = :input
        """, {
            "id": id, "output": output, "score": score,
            "input": input, "source": source
        })

    @staticmethod
    def set_user_score(token, task, score, autocommit=True):
        return 1 == Database.do_write(autocommit, """
            UPDATE user_tasks SET score = :score
            WHERE token = :token AND task = :task
        """, {"token": token, "task": task, "score": score})

    @staticmethod
    def set_user_attempt(token, task, attempt, autocommit=True):
        return 1 == Database.do_write(autocommit, """
            UPDATE user_tasks SET current_attempt = :attempt
            WHERE token = :token AND task = :task
        """, {"token": token, "task": task, "attempt": attempt})

    @staticmethod
    def set_extra_time(token, extra_time, autocommit=True):
        return 1 == Database.do_write(autocommit, """
            UPDATE users SET extra_time = :extra_time
            WHERE token = :token
        """, {"token": token, "extra_time": extra_time})
