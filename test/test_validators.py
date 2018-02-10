#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017 - Edoardo Morassutto <edoardo.morassutto@gmail.com>

import datetime
import unittest

from werkzeug.exceptions import Forbidden, BadRequest

from src.config import Config
from src.database import Database
from src.logger import Logger
from src.validators import Validators
from test.utils import Utils


class TestValidators(unittest.TestCase):
    def setUp(self):
        Utils.prepare_test()
        self.token_backup = Config.admin_token
        Config.admin_token = 'admin token'

        self.log_backup = Logger.LOG_LEVEL
        Logger.LOG_LEVEL = 9001 # disable the logs

    @Validators.during_contest
    def only_during_contest(self, token=None):
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
    def register_ip(self, token=None, input_id=None, output_id=None, source_id=None, submission_id=None):
        pass

    def test_during_contest_not_started(self):
        with self.assertRaises(Forbidden):
            self.only_during_contest()

    def test_during_contest_ended(self):
        Utils.start_contest(since=100, duration=20)
        with self.assertRaises(Forbidden):
            self.only_during_contest()

    def test_during_contest_extra_time(self):
        Utils.start_contest(since=100, duration=20)
        Database.add_user("token", "", "")
        Database.set_extra_time("token", 100)
        self.only_during_contest(token="token")

    def test_admin_only(self):
        Utils.prepare_test()
        Logger.set_log_level(9001)
        self.admin_only(admin_token=Config.admin_token, _ip="1.1.1.1")

    def test_validate_file(self):
        self.file(file={"content":"foobar".encode(),"name":"file.txt"})

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
        Database.add_submission("submissionid", "inputid", "outputid", "sourceid", 42)
        submission = self.valid_submission_id(submission_id="submissionid")
        self.assertEqual("submissionid", submission["id"])

    def test_valid_token_invalid_id(self):
        with self.assertRaises(Forbidden):
            self.valid_token(token="foobar")

    def test_valid_token(self):
        self._insert_data()
        user = self.valid_token(token="token")
        self.assertEqual("token", user["token"])

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
        Database.add_submission("submissionid", "inputid", "outputid", "sourceid", 42)
        self.register_ip(submission_id="submissionid", _ip="1.1.1.1")
        users = Database.get_users()
        self.assertEqual("1.1.1.1", users[0]["ip"][0]["ip"])

    def test_validate_token(self):
        Validators._validate_admin_token('admin token', '1.2.3.4')

    def test_validate_invalid_token(self):
        with self.assertRaises(Forbidden) as ex:
            Validators._validate_admin_token('wrong token', '1.2.3.4')

        self.assertIn("Invalid admin token", ex.exception.response.data.decode())

        Logger.c.execute("SELECT * FROM logs WHERE category = 'LOGIN_ADMIN'")
        row = Logger.c.fetchone()
        self.assertIn("login failed", row[3])
        self.assertIn("1.2.3.4", row[3])

    def test_validate_token_log_ip(self):
        Validators._validate_admin_token('admin token', '1.2.3.4')

        Logger.c.execute("SELECT * FROM logs WHERE category = 'LOGIN_ADMIN'")
        row = Logger.c.fetchone()
        self.assertIn("new ip", row[3])
        self.assertIn("1.2.3.4", row[3])

    def test_validate_token_default(self):
        Config.admin_token = Config.default_values["admin_token"]
        Validators._validate_admin_token(Config.admin_token, '1.2.3.4')

        Logger.c.execute("SELECT * FROM logs WHERE category = 'ADMIN'")
        row = Logger.c.fetchone()
        self.assertEqual("Using default admin token!", row[3])

    def _insert_data(self):
        Database.add_user("token", "", "")
        Database.add_task("poldo", "Poldo", "/path", 42, 1)
        Database.add_input("inputid", "token", "poldo", 1, "/path", 42)
        Database.add_output("outputid", "inputid", "/path", 42, "{}")
        Database.add_source("sourceid", "inputid", "/path", 42)
