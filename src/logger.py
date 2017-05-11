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
                level INTEGER,
                message TEXT)
        """)
        Logger.conn.commit()

    @staticmethod
    def log(level, message):
        c = Logger.conn.cursor()
        c.execute("""
            INSERT INTO logs (level, message)
            VALUES (:level, :message)
        """, {"level": level, "message": message})
        Logger.conn.commit()

    @staticmethod
    def debug(message):
        Logger.log(Logger.DEBUG, message)

    @staticmethod
    def info(message):
        Logger.log(Logger.INFO, message)

    @staticmethod
    def warning(message):
        Logger.log(Logger.WARNING, message)

    @staticmethod
    def get_logs(level, begin, end):
        c = Logger.conn.cursor()
        ret = []
        c.execute("""
            SELECT date, level, message FROM logs
            WHERE level >= :level AND date >= :begin AND date <= :end
            ORDER BY date DESC
        """, {"level": level, "begin": begin, "end": end})
        for row in c.fetchall():
            ret.append({
                "date": row[0],
                "level": Logger.HUMAN_MESSAGES[row[1]],
                "message": row[2]})
        return ret
