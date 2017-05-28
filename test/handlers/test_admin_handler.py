#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017 - Edoardo Morassutto <edoardo.morassutto@gmail.com>
import os
import unittest
import datetime
import shutil

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

    @patch('src.contest_manager.ContestManager.read_from_disk')
    @patch('src.contest_manager.ContestManager.start')
    def test_extract(self, start_mock, read_mock):
        self._prepare_zip()

        ContestManager.has_contest = False
        self.admin_handler.extract(admin_token='admin token', filename='contest.zip',
                                   password='password', _ip='1.2.3.4')

        read_mock.assert_called_once_with()
        start_mock.assert_called_once_with()

    def test_already_extracted(self):
        ContestManager.has_contest = True
        with self.assertRaises(Forbidden) as ex:
            self.admin_handler.extract(admin_token='admin token', filename='/foo/bar.zip',
                                       password='passwd', _ip='1.2.3.4')

        self.assertIn("Contest already loaded", ex.exception.response.data.decode())

    def test_extract_invalid_token(self):
        with self.assertRaises(Forbidden) as ex:
            self.admin_handler.extract(admin_token='invalid token', filename='/foo/bar.zip',
                                       password='passwd', _ip='1.2.3.4')

        self.assertIn("Invalid admin token", ex.exception.response.data.decode())

    def test_extract_file_not_found(self):
        ContestManager.has_contest = False
        with self.assertRaises(FileNotFoundError):
            self.admin_handler.extract(admin_token='admin token', filename='/foo/bar.zip',
                                       password='passwd', _ip='1.2.3.4')

    @patch('src.contest_manager.ContestManager.read_from_disk')
    @patch('src.contest_manager.ContestManager.start')
    def test_extract_wrong_password(self, start_mock, read_mock):
        self._prepare_zip()

        with self.assertRaises(RuntimeError) as ex:
            self.admin_handler.extract(admin_token='admin token', filename='contest.zip',
                                       password="passwd", _ip='1.2.3.4')
        self.assertIn("Bad password", ex.exception.args[0])

    def test_log_invalid_token(self):
        with self.assertRaises(Forbidden) as ex:
            self.admin_handler.log(start_date=None, end_date=None, level=None,
                                   category=None, admin_token='invalid token', _ip=None)

        self.assertIn("Invalid admin token", ex.exception.response.data.decode())

    def test_log_get_dates(self):
        TestLogger.load_logs()

        start_date = datetime.datetime.fromtimestamp(datetime.datetime.now().timestamp() - 10).isoformat()
        end_date = datetime.datetime.fromtimestamp(datetime.datetime.now().timestamp() + 10).isoformat()

        res = self.admin_handler.log(start_date=start_date, end_date=end_date, level='WARNING',
                                     admin_token='admin token', _ip='1.2.3.4')
        self.assertEqual(3, len(res["items"])) # NOTE: there is also the LOGIN_ADMIN row

    def test_log_category(self):
        TestLogger.load_logs()

        start_date = datetime.datetime.fromtimestamp(datetime.datetime.now().timestamp() - 10).isoformat()
        end_date = datetime.datetime.fromtimestamp(datetime.datetime.now().timestamp() + 10).isoformat()

        res = self.admin_handler.log(start_date=start_date, end_date=end_date, level='DEBUG',
                                     admin_token='admin token', _ip='1.2.3.4', category='CATEGORY')
        self.assertEqual(2, len(res["items"]))

    def test_log_invalid_level(self):
        with self.assertRaises(BadRequest):
            self.admin_handler.log(start_date=None, end_date=None, level='NOT-EXISTING-LEVEL',
                                   admin_token='admin token', _ip='1.2.3.4')

    def test_start_invalid_token(self):
        with self.assertRaises(Forbidden) as ex:
            self.admin_handler.start(admin_token='invalid token', _ip=None)

        self.assertIn("Invalid admin token", ex.exception.response.data.decode())

    def test_start_already_started(self):
        Database.set_meta('start_time', 12345)

        with self.assertRaises(Forbidden) as ex:
            self.admin_handler.start(admin_token='admin token', _ip='1.2.3.4')

        self.assertIn("Contest has already been started", ex.exception.response.data.decode())

    def test_start_ok(self):
        out = self.admin_handler.start(admin_token='admin token', _ip='1.2.3.4')

        start_time = datetime.datetime.strptime(out["start_time"], "%Y-%m-%dT%H:%M:%S").timestamp()
        self.assertTrue(start_time >= datetime.datetime.now().timestamp() - 10)

        self.assertEqual(start_time, Database.get_meta('start_time', type=int))

    def test_set_extra_time_invalid_token(self):
        with self.assertRaises(Forbidden) as ex:
            self.admin_handler.set_extra_time(admin_token='invalid token', extra_time=None, _ip=None)

        self.assertIn("Invalid admin token", ex.exception.response.data.decode())

    def test_set_extra_time_global(self):
        self.admin_handler.set_extra_time(admin_token='admin token', extra_time=42, _ip='1.2.3.4')

        self.assertEqual(42, Database.get_meta('extra_time', type=int))

    def test_set_extra_time_user(self):
        Database.c.execute("INSERT INTO users (token, name, surname, extra_time) VALUES ('user token', 'a', 'b', 0)")

        self.admin_handler.set_extra_time(admin_token='admin token', extra_time=42, _ip='1.2.3.4', token='user token')

        user = Database.get_user('user token')
        self.assertEqual(42, user["extra_time"])

    def test_status_invalid_token(self):
        with self.assertRaises(Forbidden) as ex:
            self.admin_handler.status(admin_token='invalid token', _ip=None)

        self.assertIn("Invalid admin token", ex.exception.response.data.decode())

    def test_status(self):
        Database.set_meta('start_time', 1234)
        res = self.admin_handler.status(admin_token='admin token', _ip='1.2.3.4')

        start_time = int(datetime.datetime.strptime(res["start_time"], "%Y-%m-%dT%H:%M:%S").timestamp())

        self.assertEqual(start_time, Database.get_meta('start_time', type=int))
        self.assertEqual(0, Database.get_meta('extra_time', default=0))

    def test_user_list_invalid_token(self):
        with self.assertRaises(Forbidden) as ex:
            self.admin_handler.user_list(admin_token='invalid token', _ip=None)

        self.assertIn("Invalid admin token", ex.exception.response.data.decode())

    def test_user_list(self):
        Database.add_user("token", "Name", "Surname")
        Database.add_user("token2", "", "")
        Database.register_ip("token", "1.2.3.4")
        Database.register_ip("token", "1.2.3.5")

        res = self.admin_handler.user_list(admin_token='admin token', _ip=None)
        self.assertEqual(2, len(res["items"]))
        user1 = next(i for i in res["items"] if i["token"] == "token")
        user2 = next(i for i in res["items"] if i["token"] == "token2")

        self.assertEqual("token", user1["token"])
        self.assertEqual("Name", user1["name"])
        self.assertEqual("Surname", user1["surname"])
        self.assertEqual(2, len(user1["ip"]))

        self.assertEqual("token2", user2["token"])
        self.assertEqual(0, len(user2["ip"]))

    def _prepare_zip(self):
        ContestManager.has_contest = False
        Config.contest_zips = Utils.new_tmp_dir("contest_zips")
        os.makedirs(Config.contest_zips, exist_ok=True)
        here = os.path.dirname(__file__)
        shutil.copyfile(os.path.join(here, "..", "assets", "contest.zip"),
                        os.path.join(Config.contest_zips, "contest.zip"))
