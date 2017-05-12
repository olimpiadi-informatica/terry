#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017 - Luca Versari <veluca93@gmail.com>

from .config import Config

from . import gevent_sqlite3 as sqlite3

class Logger:
    """A logger class that stores stuff on a database"""

    connected = False
    DEBUG = 0
    INFO = 1
    WARNING = 2
    HUMAN_MESSAGES = ["DEBUG", "INFO", "WARNING"]

    @staticmethod
    def connect_to_database():
        if Logger.connected is True:
            raise RuntimeError("Database already loaded")
        Logger.connected = True
        Logger.conn = sqlite3.connect(Config.logfile, detect_types=sqlite3.PARSE_DECLTYPES)
        c = Logger.conn.cursor()
        c.execute("""
            CREATE TABLE IF NOT EXISTS logs (
                date INTEGER DEFAULT (strftime('%s','now')),
                category TEXT NOT NULL,
                level INTEGER NOT NULL,
                message TEXT NOT NULL)
        """)
        c.execute("""
            CREATE INDEX IF NOT EXISTS log_date_level ON logs (date, level)
        """)
        Logger.conn.commit()

    @staticmethod
    def log(level, category, message):
        c = Logger.conn.cursor()
        c.execute("""
            INSERT INTO logs (level, category, message)
            VALUES (:level, :category, :message)
        """, {"level": level, "category": category, "message": message})
        Logger.conn.commit()

    @staticmethod
    def debug(*args, **kwargs):
        Logger.log(Logger.DEBUG, *args, **kwargs)

    @staticmethod
    def info(*args, **kwargs):
        Logger.log(Logger.INFO, *args, **kwargs)

    @staticmethod
    def warning(*args, **kwargs):
        Logger.log(Logger.WARNING, *args, **kwargs)

    @staticmethod
    def get_logs(level, category, begin, end):
        c = Logger.conn.cursor()
        ret = []
        if category is None:
            c.execute("""
                SELECT date, category, level, message FROM logs
                WHERE level >= :level AND date >= :begin AND date <= :end
                ORDER BY date DESC
            """, {"level": level, "begin": begin, "end": end})
        else:
            c.execute("""
                SELECT date, category, level, message FROM logs
                WHERE level >= :level AND date >= :begin AND date <= :end AND category = :category
                ORDER BY date DESC
            """, {"level": level, "category": category, "begin": begin, "end": end})
        for row in c.fetchall():
            ret.append({
                "date": row[0],
                "category": row[1],
                "level": Logger.HUMAN_MESSAGES[row[2]],
                "message": row[3]})
        return ret
