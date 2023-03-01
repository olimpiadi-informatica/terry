#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017-2018 - Edoardo Morassutto <edoardo.morassutto@gmail.com>
# Copyright 2017-2018 - Luca Versari <veluca93@gmail.com>

import datetime
import sqlite3
import sys

from colorama import Fore, Style

from terry.config import Config


class Logger:
    """A logger class that stores stuff on a database"""

    connected = False
    num_logs = 0
    c = None
    conn = None

    DEBUG = 0
    INFO = 1
    WARNING = 2
    ERROR = 3
    HUMAN_MESSAGES = ["DEBUG", "INFO", "WARNING", "ERROR"]
    LOG_LEVEL = INFO
    COLOR = [
        Style.BRIGHT,
        Fore.BLUE + Style.BRIGHT,
        Fore.YELLOW + Style.BRIGHT,
        Fore.RED + Style.BRIGHT,
    ]
    FMT = "%% %ds" % max(map(len, HUMAN_MESSAGES))

    @staticmethod
    def connect_to_database():
        """
        Connect to the log database, create the schema if needed. This method
        MUST be called once and only once.
        """
        if Logger.connected is True:
            raise RuntimeError("Database already loaded")
        Logger.connected = True
        Logger.conn = sqlite3.connect(
            Config.logfile,
            check_same_thread=False,
            isolation_level=None,
            detect_types=sqlite3.PARSE_DECLTYPES,
        )
        Logger.c = Logger.conn.cursor()
        Logger.c.executescript(
            """
            PRAGMA JOURNAL_MODE = WAL;
            PRAGMA SYNCHRONOUS = NORMAL;
            CREATE TABLE IF NOT EXISTS logs (
                date INTEGER DEFAULT (strftime('%s','now')) NOT NULL,
                category TEXT NOT NULL,
                level INTEGER NOT NULL,
                message TEXT NOT NULL);

            CREATE INDEX IF NOT EXISTS log_date_level ON logs (date, level);
        """
        )

    @staticmethod
    def disconnect_database():
        Logger.conn.close()
        Logger.connected = False

    @staticmethod
    def set_log_level(lvl):
        """
        Set the minimum level of the messages to be printed on console and
        stored in the database.
        :param lvl: Minimum level, can be an int or a str with the log level
        name
        """
        if isinstance(lvl, int):
            Logger.LOG_LEVEL = lvl
        else:
            if lvl not in Logger.HUMAN_MESSAGES:
                Logger.log_console(
                    Logger.ERROR, "LOGGER", "Invalid log level: %s" % lvl
                )
            else:
                Logger.LOG_LEVEL = Logger.HUMAN_MESSAGES.index(lvl)

    @staticmethod
    def log(level, category, message):
        """
        Add an entry to the log database and print it to the console
        :param level: Level of the message, like Logger.DEBUG, Logger.INFO,
        Logger.WARNING
        :param category: A string with the category of the event
        :param message: What really happened, it is converted to string using
        str()
        """
        if level < Logger.LOG_LEVEL:
            return
        Logger.log_console(level, category, message)
        c = Logger.c
        c.execute(
            """
            INSERT INTO logs (level, category, message)
            VALUES (:level, :category, :message)
        """,
            {"level": level, "category": category, "message": str(message)},
        )
        Logger.conn.commit()

    @staticmethod
    def log_console(level, category, message):
        tag = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S") + " "
        tag += Logger.FMT % Logger.HUMAN_MESSAGES[level]
        cat = "[" + Fore.GREEN + ("%s" % category) + Style.RESET_ALL + "]"
        print(
            Logger.COLOR[level] + tag + Style.RESET_ALL,
            "%s %s" % (cat, message),
            file=sys.stderr,
        )
        sys.stderr.flush()

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
    def error(*args, **kwargs):
        Logger.log(Logger.ERROR, *args, **kwargs)

    @staticmethod
    def get_logs(level, category, begin, end):
        """
        Filter the logs with the specified parameters
        :param level: All the events with level greater or equal
        :param category: All the event with the specified category
        :param begin: All the events from this date
        :param end: All the events until this date
        :return: A list of events
        """
        c = Logger.conn.cursor()
        ret = []
        if category is None:
            c.execute(
                """
                SELECT date, category, level, message FROM logs
                WHERE level >= :level AND date >= :begin AND date <= :end
                ORDER BY date DESC
                LIMIT 50
            """,
                {"level": level, "begin": begin, "end": end},
            )
        else:
            c.execute(
                """
                SELECT date, category, level, message FROM logs
                WHERE level >= :level AND date >= :begin AND date <= :end AND 
                category = :category
                ORDER BY date DESC
                LIMIT 50
            """,
                {"level": level, "category": category, "begin": begin, "end": end},
            )
        for row in c.fetchall():
            ret.append(
                {
                    "date": row[0],
                    "category": row[1],
                    "level": Logger.HUMAN_MESSAGES[row[2]],
                    "message": row[3],
                }
            )
        return ret
