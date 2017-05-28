#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017 - Edoardo Morassutto <edoardo.morassutto@gmail.com>

import unittest

from werkzeug.exceptions import Forbidden

from src.config import Config
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
