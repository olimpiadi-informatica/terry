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

class Database:
    connected = False

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
        c.execute(Schema.INIT)
        version = Database.get_meta("schema_version", -1, int)
        if version == -1:
            Logger.info("DB_OPERATION", "Creating database")
        for upd in range(version+1, len(Schema.UPDATERS)):
            Logger.info("DB_OPERATION", "Applying updater %d" % upd)
            c.executescript(Schema.UPDATERS[upd])
            Database.set_meta("schema_version", upd)
            Database.conn.commit()
