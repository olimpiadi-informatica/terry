#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017-2018 - Edoardo Morassutto <edoardo.morassutto@gmail.com>
# Copyright 2018 - Luca Versari <veluca93@gmail.com>
# Copyright 2018 - Massimo Cairo <cairomassimo@gmail.com>
import datetime
import os.path
import subprocess
import unittest
from unittest.mock import patch

import yaml
from werkzeug.exceptions import Forbidden, BadRequest, NotFound

from terry import crypto
from terry.config import Config
from terry.database import Database
from terry.handlers.admin_handler import AdminHandler
from terry.logger import Logger
from test.test_logger import TestLogger
from test.utils import Utils


class TestAdminHandler(unittest.TestCase):
    def setUp(self):
        Utils.prepare_test()
        self.admin_handler = AdminHandler()

        Database.set_meta("admin_token", "admin token")

        self.log_backup = Logger.LOG_LEVEL
        Logger.LOG_LEVEL = 9001  # disable the logs

    def tearDown(self):
        Logger.LOG_LEVEL = self.log_backup

    def test_upload_pack_already_extracted(self):
        Database.set_meta("admin_token", "totally the real token")
        with self.assertRaises(Forbidden):
            self.admin_handler.upload_pack(file={
                "content": "foobar".encode(),
                "name": "pack.zip.enc"
            })

    def test_upload_pack_already_uploaded(self):
        path = os.path.join(Utils.new_tmp_dir(), "pack.zip.enc")
        with open(path, "wb") as f:
            f.write(b"hola!")
        Config.encrypted_file = path
        Database.del_meta("admin_token")
        with self.assertRaises(Forbidden):
            self.admin_handler.upload_pack(file={
                "content": "foobar".encode(),
                "name": "pack.zip.enc"
            })

    def test_upload_pack(self):
        Utils.setup_encrypted_file()
        upload_path = os.path.join(
            os.path.dirname(__file__), "../assets/pack.zip.enc")
        os.remove(Config.encrypted_file)

        with open(upload_path, "rb") as f:
            content = f.read()
        Database.del_meta("admin_token")

        self.admin_handler.upload_pack(file={
            "content": content,
            "name": "pack.zip.enc"
        })
        self.assertTrue(os.path.exists(Config.encrypted_file))

    def test_upload_invalid_pack(self):
        enc_path = os.path.join(Utils.new_tmp_dir(), "pack.zip.enc")
        Config.encrypted_file = enc_path

        Database.del_meta("admin_token")
        with self.assertRaises(Forbidden):
            self.admin_handler.upload_pack(file={
                "content": b"totally not a pack",
                "name": "pack.zip.enc"
            })
        self.assertFalse(os.path.exists(enc_path))

    def test_append_log_invalid_secret(self):
        Config.append_log_secret = "yep"
        with self.assertRaises(Forbidden):
            self.admin_handler.append_log(
                append_log_secret="nope",
                level="ERROR",
                category="TESTING",
                message="You shall not pass!")

    def test_append_log_invalid_level(self):
        Config.append_log_secret = "yep"
        with self.assertRaises(BadRequest):
            self.admin_handler.append_log(
                append_log_secret="yep",
                level="BARABBA",
                category="TESTING",
                message="You shall not pass!")

    def test_append_log(self):
        Config.append_log_secret = "yep"
        self.admin_handler.append_log(
            append_log_secret="yep",
            level="ERROR",
            category="TESTING",
            message="Message")
        Logger.c.execute("SELECT * FROM logs WHERE category = 'TESTING'")
        row = Logger.c.fetchone()
        self.assertEqual('TESTING', row[1])
        self.assertEqual(Logger.ERROR, int(row[2]))
        self.assertEqual('Message', row[3])

    def test_log_invalid_token(self):
        with self.assertRaises(Forbidden) as ex:
            self.admin_handler.log(
                start_date=None,
                end_date=None,
                level=None,
                category=None,
                admin_token='invalid token',
                _ip=None)

        self.assertIn("Invalid admin token",
                      ex.exception.response.data.decode())

    def test_log_get_dates(self):
        TestLogger.load_logs()

        start_date = datetime.datetime.fromtimestamp(
            datetime.datetime.now().timestamp() - 10).isoformat()
        end_date = datetime.datetime.fromtimestamp(
            datetime.datetime.now().timestamp() + 10).isoformat()

        res = self.admin_handler.log(
            start_date=start_date,
            end_date=end_date,
            level='INFO',
            admin_token='admin token',
            _ip='1.2.3.4')
        self.assertEqual(3, len(
            res["items"]))  # NOTE: there is also the LOGIN_ADMIN row

    def test_log_category(self):
        TestLogger.load_logs()

        start_date = datetime.datetime.fromtimestamp(
            datetime.datetime.now().timestamp() - 10).isoformat()
        end_date = datetime.datetime.fromtimestamp(
            datetime.datetime.now().timestamp() + 10).isoformat()

        res = self.admin_handler.log(
            start_date=start_date,
            end_date=end_date,
            level='DEBUG',
            admin_token='admin token',
            _ip='1.2.3.4',
            category='CATEGORY')
        self.assertEqual(2, len(res["items"]))

    def test_log_invalid_level(self):
        with self.assertRaises(BadRequest):
            self.admin_handler.log(
                start_date=None,
                end_date=None,
                level='NOT-EXISTING-LEVEL',
                admin_token='admin token',
                _ip='1.2.3.4')

    def test_log_invalid_date(self):
        with self.assertRaises(BadRequest):
            self.admin_handler.log(
                start_date="i'm not a date",
                end_date=None,
                level='ERROR',
                admin_token='admin token',
                _ip='1.2.3.4')

    def test_start_invalid_token(self):
        with self.assertRaises(Forbidden) as ex:
            self.admin_handler.start(admin_token='invalid token', _ip=None)

        self.assertIn("Invalid admin token",
                      ex.exception.response.data.decode())

    def test_start_already_started(self):
        Database.set_meta('start_time', 12345)

        with self.assertRaises(Forbidden) as ex:
            self.admin_handler.start(admin_token='admin token', _ip='1.2.3.4')

        self.assertIn("Contest has already been started",
                      ex.exception.response.data.decode())

    @patch('terry.contest_manager.ContestManager.start')
    def test_start_ok(self, start_mock):
        out = self.admin_handler.start(
            admin_token='admin token', _ip='1.2.3.4')

        start_time = datetime.datetime.strptime(
            out["start_time"], "%Y-%m-%dT%H:%M:%S").timestamp()
        self.assertTrue(start_time >= datetime.datetime.now().timestamp() - 10)

        self.assertEqual(start_time, Database.get_meta('start_time', type=int))
        start_mock.assert_called_once_with()

    def test_set_extra_time_invalid_admin_token(self):
        with self.assertRaises(Forbidden) as ex:
            self.admin_handler.set_extra_time(
                admin_token='invalid token', extra_time=None, _ip=None)

        self.assertIn("Invalid admin token",
                      ex.exception.response.data.decode())

    def test_set_extra_time_invalid_token(self):
        with self.assertRaises(Forbidden) as ex:
            self.admin_handler.set_extra_time(
                admin_token='admin token',
                extra_time=42,
                token="foobar",
                _ip=None)

        self.assertIn("No such user", ex.exception.response.data.decode())

    def test_set_extra_time_global(self):
        self.admin_handler.set_extra_time(
            admin_token='admin token', extra_time=42, _ip='1.2.3.4')

        self.assertEqual(42, Database.get_meta('extra_time', type=int))

    def test_set_extra_time_user(self):
        Database.c.execute(
            "INSERT INTO users (token, name, surname, extra_time) VALUES ("
            "'user token', 'a', 'b', 0)")

        self.admin_handler.set_extra_time(
            admin_token='admin token',
            extra_time=42,
            _ip='1.2.3.4',
            token='user token')

        user = Database.get_user('user token')
        self.assertEqual(42, user["extra_time"])

    def test_status_invalid_token(self):
        with self.assertRaises(Forbidden) as ex:
            self.admin_handler.status(admin_token='invalid token', _ip=None)

        self.assertIn("Invalid admin token",
                      ex.exception.response.data.decode())

    def test_status(self):
        Database.set_meta('start_time', 1234)
        res = self.admin_handler.status(
            admin_token='admin token', _ip='1.2.3.4')

        start_time = int(
            datetime.datetime.strptime(res["start_time"],
                                       "%Y-%m-%dT%H:%M:%S").timestamp())

        self.assertEqual(start_time, Database.get_meta('start_time', type=int))
        self.assertEqual(0, Database.get_meta('extra_time', default=0))

    def test_user_list_invalid_token(self):
        with self.assertRaises(Forbidden) as ex:
            self.admin_handler.user_list(admin_token='invalid token', _ip=None)

        self.assertIn("Invalid admin token",
                      ex.exception.response.data.decode())

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

    def test_pack_status_no_pack(self):
        Config.encrypted_file = "/cake/is/a/lie"
        status = self.admin_handler.pack_status()
        self.assertFalse(status["uploaded"])

    def test_pack_status(self):
        pack = Utils.new_tmp_file()
        Config.encrypted_file = pack
        encrypted = crypto.encode(b"fooobarr", b"#bellavita", b"foo: bar")
        with open(pack, "wb") as f:
            f.write(encrypted)
        status = self.admin_handler.pack_status()
        self.assertTrue(status["uploaded"])
        self.assertEqual(status["foo"], "bar")

    def test_download_results(self):
        Config.storedir = Utils.new_tmp_dir()
        wd = os.getcwd()
        try:
            os.chdir(Config.storedir)
            with open('db.sqlite3_for_test', 'w') as f:
                pass
            zip_location = self.admin_handler.download_results(
                admin_token='admin token', _ip='1.2.3.4')['path']
            with open(os.path.join(Config.storedir, zip_location)) as f:
                pass
        finally:
            os.chdir(wd)

    def test_failed_download_results(self):
        Config.storedir = Utils.new_tmp_dir()
        wd = os.getcwd()
        try:
            os.chdir(Config.storedir)
            with self.assertRaises(subprocess.CalledProcessError) as ex:
                self.admin_handler.download_results(
                    admin_token='admin token', _ip='1.2.3.4')
        finally:
            os.chdir(wd)

    def test_drop_contest_no_pack(self):
        Config.encrypted_file = "/not/exists"
        with self.assertRaises(NotFound):
            self.admin_handler.drop_contest("LALLA-BALALLA")

    def test_drop_contest_loaded_wrong_token(self):
        Utils.setup_encrypted_file()
        Database.set_meta("admin_token", "UHUHU-HUHU")
        with self.assertRaises(Forbidden):
            self.admin_handler.drop_contest("LALLA-BALALLA")

    def test_drop_contest_not_loaded_wrong_token(self):
        Utils.setup_encrypted_file()
        Database.del_meta("admin_token")
        with self.assertRaises(Forbidden):
            self.admin_handler.drop_contest("AAAAAA-CZKW-CCJS")

    def test_drop_contest_not_deletable(self):
        Utils.setup_encrypted_file()
        Database.del_meta("admin_token")
        with open(Config.encrypted_file, "wb") as f:
            f.write(Utils.build_pack(yaml.dump({"deletable": False})))
        with self.assertRaises(Forbidden):
            self.admin_handler.drop_contest(Utils.ZIP_TOKEN)

    def test_drop_contest(self):
        Utils.setup_encrypted_file()
        Database.del_meta("admin_token")
        with open(Config.encrypted_file, "wb") as f:
            f.write(Utils.build_pack(yaml.dump({"deletable": True})))
        self.admin_handler.drop_contest(Utils.ZIP_TOKEN)
        self.assertFalse(os.path.exists(Config.storedir))
        self.assertFalse(os.path.exists(Config.statementdir))
        self.assertFalse(os.path.exists(Config.contest_path))
        self.assertFalse(os.path.exists(Config.encrypted_file))
        self.assertFalse(os.path.exists(Config.decrypted_file))
        self.assertTrue(os.path.exists(Config.db))
