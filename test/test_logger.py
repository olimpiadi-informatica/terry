#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017-2018 - Edoardo Morassutto <edoardo.morassutto@gmail.com>

import datetime
import unittest

from terry.config import Config
from terry.logger import Logger
from test.utils import Utils


class TestLogger(unittest.TestCase):
    VERY_FAR_IN_TIME = 2524608000  # Gen 1st, 2050

    def setUp(self):
        Utils.prepare_test(connect_logger=False)

    def test_connect_to_database(self):
        Logger.connected = False
        Logger.connect_to_database()

    def test_double_connect_to_database(self):
        Logger.connected = False
        Logger.connect_to_database()
        with self.assertRaises(RuntimeError) as ex:
            Logger.connect_to_database()
        self.assertEqual("Database already loaded", ex.exception.args[0])

    def test_invalid_db_path(self):
        Config.logfile = '/path/that/not/exists'
        Logger.connected = False
        with self.assertRaises(Exception):
            Logger.connect_to_database()

    def test_set_log_level(self):
        backup = Logger.LOG_LEVEL

        Logger.set_log_level('ERROR')
        self.assertEqual(Logger.LOG_LEVEL, Logger.ERROR)

        Logger.LOG_LEVEL = backup

    def test_set_log_level_numeric(self):
        backup = Logger.LOG_LEVEL

        Logger.set_log_level(Logger.ERROR)
        self.assertEqual(Logger.LOG_LEVEL, Logger.ERROR)

        Logger.LOG_LEVEL = backup

    def test_log(self):
        Utils.prepare_test(connect_logger=True)

        Logger.log(Logger.DEBUG, 'FOO_CAT', 'Log message')

        Logger.c.execute("SELECT * FROM logs WHERE category = 'FOO_CAT'")
        row = Logger.c.fetchone()
        self.assertEqual('FOO_CAT', row[1])
        self.assertEqual(Logger.DEBUG, int(row[2]))
        self.assertEqual('Log message', row[3])

    def test_log_stderr(self):
        Utils.prepare_test(connect_logger=True)

        with Utils.nostderr() as err:
            Logger.error('FOO_CAT', 'Log message')
        self.assertIn("FOO_CAT", err.buffer)
        self.assertIn("Log message", err.buffer)

    def test_get_logs_by_level(self):
        Utils.prepare_test(connect_logger=True)
        TestLogger.load_logs()

        start_date = datetime.datetime.now().timestamp() - 10
        end_date = datetime.datetime.now().timestamp() + 10

        logs = Logger.get_logs(Logger.DEBUG, None, start_date, end_date)
        self.assertEqual(4, len(logs))
        logs = Logger.get_logs(Logger.WARNING, None, start_date, end_date)
        self.assertEqual(2, len(logs))

    def test_get_logs_by_category(self):
        Utils.prepare_test(connect_logger=True)
        TestLogger.load_logs()

        start_date = datetime.datetime.now().timestamp() - 10
        end_date = datetime.datetime.now().timestamp() + 10

        logs = Logger.get_logs(Logger.DEBUG, 'CATEGORY', start_date, end_date)
        self.assertEqual(2, len(logs))

    def test_get_logs_by_date(self):
        Utils.prepare_test(connect_logger=True)
        TestLogger.load_logs()

        start_date = TestLogger.VERY_FAR_IN_TIME - 10
        end_date = TestLogger.VERY_FAR_IN_TIME + 10

        logs = Logger.get_logs(Logger.DEBUG, None, start_date, end_date)
        self.assertEqual(1, len(logs))

    @staticmethod
    def load_logs():
        logs = [
            (Logger.DEBUG, 'CATEGORY', 'Log message'),
            (Logger.DEBUG, 'CATEGORY', 'An other log message'),
            (Logger.WARNING, 'OPS', 'Something strange'),
            (Logger.ERROR, 'WTF', 'Something is wrong')
        ]
        Logger.c.execute("DELETE FROM logs")
        for log in logs:
            Logger.c.execute(
                "INSERT INTO logs (level, category, message) VALUES (%d, "
                "'%s', '%s')" % log)

        Logger.c.execute(
            "INSERT INTO logs (date, level, category, message) VALUES (%d, "
            "%d, '%s', '%s')" %
            (TestLogger.VERY_FAR_IN_TIME, Logger.INFO, 'FUTURE',
             'This message comes from the future'))
