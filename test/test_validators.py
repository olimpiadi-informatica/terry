#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017-2018 - Edoardo Morassutto <edoardo.morassutto@gmail.com>
# Copyright 2018 - William Di Luigi <williamdiluigi@gmail.com>

import unittest
from unittest.mock import patch

import jwt
from werkzeug.exceptions import Forbidden
from werkzeug.test import EnvironBuilder
from werkzeug.wrappers import Request

from terry.config import Config
from terry.database import Database
from terry.logger import Logger
from terry.validators import Validators
from test.utils import Utils


class TestValidators(unittest.TestCase):
    def setUp(self):
        Utils.prepare_test()
        Database.set_meta("admin_token", "ADMIN-TOKEN")

        self.log_backup = Logger.LOG_LEVEL
        Logger.LOG_LEVEL = 9001  # disable the logs

    @Validators.during_contest
    def only_during_contest(self, token=None):
        pass

    @Validators.contest_started
    def only_contest_started(self):
        pass

    @Validators.admin_only
    def admin_only(self):
        pass

    @Validators.validate_file
    def file(self, file):
        return file

    @Validators.validate_input_id
    def valid_input_id(self, input):
        return input

    @Validators.validate_output_id
    def valid_output_id(self, output):
        return output

    @Validators.validate_source_id
    def valid_source_id(self, source):
        return source

    @Validators.validate_submission_id
    def valid_submission_id(self, submission):
        return submission

    @Validators.validate_token
    def valid_token(self, user):
        return user

    @Validators.validate_task
    def valid_task(self, task):
        return task

    @Validators.register_user_ip
    def register_ip(self, token=None, input_id=None, output_id=None,
                    source_id=None, submission_id=None):
        pass

    def test_during_contest_not_started(self):
        with self.assertRaises(Forbidden):
            self.only_during_contest()

    def test_during_contest_ended(self):
        Utils.start_contest(since=100, duration=20)
        with self.assertRaises(Forbidden):
            self.only_during_contest()

    def test_started_contest_not_started(self):
        with self.assertRaises(Forbidden):
            self.only_contest_started()

    def test_started_contest_ended(self):
        Utils.start_contest(since=100, duration=20)
        self.only_contest_started()

    def test_during_contest_extra_time(self):
        Utils.start_contest(since=100, duration=20)
        Database.add_user("token", "", "")
        Database.set_extra_time("token", 100)
        self.only_during_contest(token="token")

    def test_admin_only(self):
        Utils.prepare_test()
        Database.set_meta("admin_token", "ADMIN-TOKEN")
        Logger.set_log_level(9001)
        self.admin_only(admin_token="ADMIN-TOKEN", _ip="1.1.1.1")

    def test_admin_only_invalid_token(self):
        Utils.prepare_test()
        Database.set_meta("admin_token", "ADMIN-TOKEN")
        Logger.set_log_level(9001)
        with self.assertRaises(Forbidden):
            self.admin_only(admin_token="WRONG-TOKEN", _ip="1.1.1.1")

    def test_admin_only_with_spaces(self):
        Utils.prepare_test()
        Database.set_meta("admin_token", "ADMIN-TOKEN")
        Logger.set_log_level(9001)
        self.admin_only(admin_token="  ADMIN-TOKEN  ", _ip="1.1.1.1")

    def test_admin_only_lower_case(self):
        Utils.prepare_test()
        Database.set_meta("admin_token", "ADMIN-TOKEN")
        Logger.set_log_level(9001)
        self.admin_only(admin_token="admin-token", _ip="1.1.1.1")

    def test_validate_file(self):
        self.file(file={"content": "foobar".encode(), "name": "file.txt"})

    def test_valid_input_id_invalid_id(self):
        with self.assertRaises(Forbidden):
            self.valid_input_id(input_id="foobar")

    def test_valid_input_id(self):
        self._insert_data()
        input = self.valid_input_id(input_id="inputid")
        self.assertEqual("inputid", input["id"])

    def test_valid_output_id_invalid_id(self):
        with self.assertRaises(Forbidden):
            self.valid_output_id(output_id="foobar")

    def test_valid_output_id(self):
        self._insert_data()
        output = self.valid_output_id(output_id="outputid")
        self.assertEqual("outputid", output["id"])

    def test_valid_source_id_invalid_id(self):
        with self.assertRaises(Forbidden):
            self.valid_source_id(source_id="foobar")

    def test_valid_source_id(self):
        self._insert_data()
        source = self.valid_source_id(source_id="sourceid")
        self.assertEqual("sourceid", source["id"])

    def test_valid_submission_id_invalid_id(self):
        with self.assertRaises(Forbidden):
            self.valid_submission_id(submission_id="foobar")

    def test_valid_submission_id(self):
        self._insert_data()
        Database.add_submission("submissionid", "inputid", "outputid",
                                "sourceid", 42)
        submission = self.valid_submission_id(submission_id="submissionid")
        self.assertEqual("submissionid", submission["id"])

    def test_wrong_token_no_jwt(self):
        Config.jwt_secret = None
        with self.assertRaises(Forbidden):
            self.valid_token(token="nope")

    @patch("terry.validators.Validators._get_user_from_sso", return_value=42)
    def test_wrong_token_jwt_sso(self, sso):
        Config.jwt_secret = "jwt_token"
        builder = EnvironBuilder(headers=[("Cookie", "token=cookie")])
        request = Request(builder.get_environ())
        user = self.valid_token(token="lallabalalla", _request=request)
        self.assertEqual(42, user)
        sso.assert_called_once_with("cookie", "lallabalalla")

    def test_wrong_token_jwt_no_sso(self):
        Config.jwt_secret = "jwt_token"
        builder = EnvironBuilder()
        request = Request(builder.get_environ())
        with self.assertRaises(Forbidden):
            self.valid_token(token="lallabalalla", _request=request)

    def test_ok_token_no_jwt_disabled(self):
        Config.jwt_secret = None
        self._insert_data()
        Database.c.execute("UPDATE users SET sso_user = 0")
        user = self.valid_token(token="token")
        self.assertEqual("token", user["token"])

    def test_ok_token_no_jwt_enabled(self):
        Config.jwt_secret = None
        self._insert_data()
        Database.c.execute("UPDATE users SET sso_user = 1")
        with self.assertRaises(Forbidden):
            self.valid_token(token="token")

    def test_ok_token_jwt_disabled(self):
        Config.jwt_secret = "jwt_token"
        self._insert_data()
        Database.c.execute("UPDATE users SET sso_user = 0")
        user = self.valid_token(token="token")
        self.assertEqual("token", user["token"])

    @patch("terry.validators.Validators._get_user_from_sso", return_value=42)
    def test_ok_token_jwt_enabled(self, sso):
        Config.jwt_secret = "jwt_token"
        builder = EnvironBuilder(headers=[("Cookie", "token=token")])
        request = Request(builder.get_environ())
        self._insert_data()
        Database.c.execute("UPDATE users SET sso_user = 1")
        user = self.valid_token(token="token", _request=request)
        self.assertEqual(42, user)
        sso.assert_called_once_with("token", "token")

    def test_valid_task_invalid_id(self):
        with self.assertRaises(Forbidden):
            self.valid_task(task="foobar")

    def test_valid_task(self):
        self._insert_data()
        task = self.valid_task(task="poldo")
        self.assertEqual("poldo", task["name"])

    def test_register_ip_token(self):
        self._insert_data()
        self.register_ip(token="token", _ip="1.1.1.1")
        users = Database.get_users()
        self.assertEqual("1.1.1.1", users[0]["ip"][0]["ip"])

    def test_register_ip_input(self):
        self._insert_data()
        self.register_ip(input_id="inputid", _ip="1.1.1.1")
        users = Database.get_users()
        self.assertEqual("1.1.1.1", users[0]["ip"][0]["ip"])

    def test_register_ip_output(self):
        self._insert_data()
        self.register_ip(output_id="outputid", _ip="1.1.1.1")
        users = Database.get_users()
        self.assertEqual("1.1.1.1", users[0]["ip"][0]["ip"])

    def test_register_ip_source(self):
        self._insert_data()
        self.register_ip(source_id="sourceid", _ip="1.1.1.1")
        users = Database.get_users()
        self.assertEqual("1.1.1.1", users[0]["ip"][0]["ip"])

    def test_register_ip_submission(self):
        self._insert_data()
        Database.add_submission("submissionid", "inputid", "outputid",
                                "sourceid", 42)
        self.register_ip(submission_id="submissionid", _ip="1.1.1.1")
        users = Database.get_users()
        self.assertEqual("1.1.1.1", users[0]["ip"][0]["ip"])

    def test_validate_token(self):
        Validators._validate_admin_token('ADMIN-TOKEN', '1.2.3.4')

    @patch("terry.contest_manager.ContestManager.extract_contest")
    @patch("terry.contest_manager.ContestManager.read_from_disk")
    def test_validate_token_no_token(self, read, extract):
        Database.del_meta("admin_token")
        Validators._validate_admin_token("ADMIN-TOKEN", '1.2.3.4')
        extract.assert_called_once_with("ADMIN-TOKEN")
        read.assert_called_once_with()

    def test_validate_invalid_token(self):
        with self.assertRaises(Forbidden) as ex:
            Validators._validate_admin_token('wrong token', '1.2.3.4')

        self.assertIn("Invalid admin token",
                      ex.exception.response.data.decode())

        Logger.c.execute("SELECT * FROM logs WHERE category = 'LOGIN_ADMIN'")
        row = Logger.c.fetchone()
        self.assertIn("login failed", row[3])
        self.assertIn("1.2.3.4", row[3])

    def test_validate_token_log_ip(self):
        Validators._validate_admin_token('ADMIN-TOKEN', '1.2.3.4')

        Logger.c.execute("SELECT * FROM logs WHERE category = 'LOGIN_ADMIN'")
        row = Logger.c.fetchone()
        self.assertIn("new ip", row[3])
        self.assertIn("1.2.3.4", row[3])

    def test_sso_invalid_jwt(self):
        Config.jwt_secret = "lalla"
        self._insert_data()
        with self.assertRaises(Forbidden):
            Validators._get_user_from_sso("uhuhu", "token")

    def test_sso_different_username(self):
        Config.jwt_secret = "lalla"
        payload = {"username": "koh", "firstName": "koh"}
        token = jwt.encode(payload, Config.jwt_secret)
        self._insert_data()
        with self.assertRaises(Forbidden):
            Validators._get_user_from_sso(token, "token")

    def test_sso_new_user(self):
        Config.jwt_secret = "lalla"
        self._insert_data()
        payload = {"username": "koh", "firstName": "koh"}
        token = jwt.encode(payload, Config.jwt_secret)
        user = Validators._get_user_from_sso(token, "koh")
        self.assertEqual("koh", user["token"])
        self.assertEqual("koh", Database.get_user("koh")["token"])

    def test_sso_existing_user(self):
        Config.jwt_secret = "lalla"
        self._insert_data()
        payload = {"username": "token", "firstName": "koh"}
        token = jwt.encode(payload, Config.jwt_secret)
        user = Validators._get_user_from_sso(token, "token")
        self.assertEqual("token", user["token"])

    def _insert_data(self):
        Database.add_user("token", "", "")
        Database.add_task("poldo", "Poldo", "/path", 42, 1)
        Database.add_input("inputid", "token", "poldo", 1, "/path", 42)
        Database.add_output("outputid", "inputid", "/path", 42, "{}")
        Database.add_source("sourceid", "inputid", "/path", 42)
