#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017 - Edoardo Morassutto <edoardo.morassutto@gmail.com>

import unittest

import datetime
from werkzeug.exceptions import Forbidden, BadRequest
from unittest.mock import patch

from src.config import Config
from src.contest_manager import ContestManager
from src.database import Database
from src.handlers.admin_handler import AdminHandler
from src.logger import Logger
from test.test_logger import TestLogger
from test.utils import Utils


class TestAdminHandler(unittest.TestCase):

    def setUp(self):
        Utils.prepare_test()
        self.admin_handler = AdminHandler()

        self.token_backup = Config.admin_token
        Config.admin_token = 'admin token'

        self.log_backup = Logger.LOG_LEVEL
        Logger.LOG_LEVEL = 9001 # disable the logs

    def tearDown(self):
        Logger.LOG_LEVEL = self.log_backup
        Config.admin_token = self.token_backup

    def test_validate_token(self):
        self.admin_handler._validate_token('admin token', '1.2.3.4')

    def test_validate_invalid_token(self):
        with self.assertRaises(Forbidden) as ex:
            self.admin_handler._validate_token('wrong token', '1.2.3.4')

        self.assertTrue(ex.exception.response.data.decode().find("Invalid admin token") >= 0)

        Logger.c.execute("SELECT * FROM logs WHERE category = 'LOGIN_ADMIN'")
        row = Logger.c.fetchone()
        self.assertTrue(row[3].find('login failed') >= 0)
        self.assertTrue(row[3].find('1.2.3.4') >= 0)

    def test_validate_token_log_ip(self):
        self.admin_handler._validate_token('admin token', '1.2.3.4')

        Logger.c.execute("SELECT * FROM logs WHERE category = 'LOGIN_ADMIN'")
        row = Logger.c.fetchone()
        self.assertTrue(row[3].find('new ip') >= 0)
        self.assertTrue(row[3].find('1.2.3.4') >= 0)

    @patch('zipfile.ZipFile.__init__', return_value=None)
    @patch('zipfile.ZipFile.extractall', return_value=None)
    @patch('src.contest_manager.ContestManager.read_from_disk')
    @patch('src.contest_manager.ContestManager.start')
    def test_extract(self, start_mock, read_mock, extract_mock, zip_mock):
        ContestManager.has_contest = False
        self.admin_handler.extract('admin token', '/foo/bar.zip', 'passwd', '1.2.3.4')

        read_mock.assert_called_once_with()
        start_mock.assert_called_once_with()

    def test_already_extracted(self):
        ContestManager.has_contest = True
        with self.assertRaises(Forbidden) as ex:
            self.admin_handler.extract('admin token', '/foo/bar.zip', 'passwd', '1.2.3.4')

        self.assertTrue(ex.exception.response.data.decode().find("Contest already loaded") >= 0)

    def test_extract_invalid_token(self):
        with self.assertRaises(Forbidden) as ex:
            self.admin_handler.extract('invalid token', '/foo/bar.zip', 'passwd', '1.2.3.4')

        self.assertTrue(ex.exception.response.data.decode().find("Invalid admin token") >= 0)

    def test_extract_file_not_found(self):
        ContestManager.has_contest = False
        with self.assertRaises(FileNotFoundError):
            self.admin_handler.extract('admin token', '/foo/bar.zip', 'passwd', '1.2.3.4')

    def test_extract_wrong_password(self):
        # TODO implement this test
        pass

    def test_log_invalid_token(self):
        with self.assertRaises(Forbidden) as ex:
            self.admin_handler.log(None, None, None, 'invalid token', None, None)

        self.assertTrue(ex.exception.response.data.decode().find("Invalid admin token") >= 0)

    def test_log_get_dates(self):
        TestLogger.load_logs()

        start_date = datetime.datetime.fromtimestamp(datetime.datetime.now().timestamp() - 10).isoformat()
        end_date = datetime.datetime.fromtimestamp(datetime.datetime.now().timestamp() + 10).isoformat()

        res = self.admin_handler.log(start_date, end_date, 'WARNING', 'admin token', '1.2.3.4')
        self.assertEqual(3, len(res["items"])) # NOTE: there is also the LOGIN_ADMIN row

    def test_log_category(self):
        TestLogger.load_logs()

        start_date = datetime.datetime.fromtimestamp(datetime.datetime.now().timestamp() - 10).isoformat()
        end_date = datetime.datetime.fromtimestamp(datetime.datetime.now().timestamp() + 10).isoformat()

        res = self.admin_handler.log(start_date, end_date, 'DEBUG', 'admin token', '1.2.3.4', 'CATEGORY')
        self.assertEqual(2, len(res["items"]))

    def test_log_invalid_level(self):
        with self.assertRaises(BadRequest):
            self.admin_handler.log(None, None, 'NOT-EXISTING-LEVEL', 'admin token', '1.2.3.4')

    def test_start_invalid_token(self):
        with self.assertRaises(Forbidden) as ex:
            self.admin_handler.start('invalid token', None)

        self.assertTrue(ex.exception.response.data.decode().find("Invalid admin token") >= 0)

    def test_start_already_started(self):
        Database.set_meta('start_time', 12345)

        with self.assertRaises(Forbidden) as ex:
            self.admin_handler.start('admin token', '1.2.3.4')

        self.assertTrue(ex.exception.response.data.decode().find("Contest has already been started") >= 0)

    def test_start_ok(self):
        out = self.admin_handler.start('admin token', '1.2.3.4')

        start_time = datetime.datetime.strptime(out["start_time"], "%Y-%m-%dT%H:%M:%S").timestamp()
        self.assertTrue(start_time >= datetime.datetime.now().timestamp() - 10)

        self.assertEqual(start_time, Database.get_meta('start_time', type=int))

    def test_set_extra_time_invalid_token(self):
        with self.assertRaises(Forbidden) as ex:
            self.admin_handler.set_extra_time('invalid token', None, None)

        self.assertTrue(ex.exception.response.data.decode().find("Invalid admin token") >= 0)

    def test_set_extra_time_global(self):
        self.admin_handler.set_extra_time('admin token', 42, '1.2.3.4')

        self.assertEqual(42, Database.get_meta('extra_time', type=int))

    def test_set_extra_time_user(self):
        Database.c.execute("INSERT INTO users (token, name, surname, extra_time) VALUES ('user token', 'a', 'b', 0)")

        self.admin_handler.set_extra_time('admin token', 42, '1.2.3.4', 'user token')

        user = Database.get_user('user token')
        self.assertEqual(42, user["extra_time"])

    def test_status_invalid_token(self):
        with self.assertRaises(Forbidden) as ex:
            self.admin_handler.status('invalid token', None)

        self.assertTrue(ex.exception.response.data.decode().find("Invalid admin token") >= 0)

    def test_status(self):
        Database.set_meta('start_time', 1234)
        res = self.admin_handler.status('admin token', '1.2.3.4')

        start_time = int(datetime.datetime.strptime(res["start_time"], "%Y-%m-%dT%H:%M:%S").timestamp())

        self.assertEqual(start_time, Database.get_meta('start_time', type=int))
        self.assertEqual(0, Database.get_meta('extra_time', default=0))

    def test_user_list_invalid_token(self):
        with self.assertRaises(Forbidden) as ex:
            self.admin_handler.user_list('invalid token', None)

        self.assertTrue(ex.exception.response.data.decode().find("Invalid admin token") >= 0)

    def test_user_list(self):
        # TODO implement this test
        self.admin_handler.user_list('admin token', None)
