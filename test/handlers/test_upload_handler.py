#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017 - Edoardo Morassutto <edoardo.morassutto@gmail.com>
import os
import unittest

from unittest.mock import patch

from werkzeug.exceptions import Forbidden

from src.config import Config
from src.database import Database
from src.handlers.upload_handler import UploadHandler
from test.utils import Utils


class TestInfoHandler(unittest.TestCase):

    def setUp(self):
        Utils.prepare_test()
        self.handler = UploadHandler()

    @patch("src.contest_manager.ContestManager.evaluate_output", return_value='{"validation":42}')
    @patch("src.database.Database.gen_id", return_value="outputid")
    def test_upload_output(self, gen_mock, eval_mock):
        Utils.start_contest()
        self._insert_data()

        res = self.handler.upload_output(input_id="inputid", _ip="1.1.1.1",
                                         _file_content="foobar".encode(), _file_name="output.txt")
        self.assertEqual("outputid", res["id"])
        self.assertIn("output.txt", res["path"])
        self.assertEqual(42, res["validation"])
        self.assertEqual("inputid", res["input"])
        self.assertEqual(6, res["size"])
        path = os.path.join(Config.storedir, res["path"])
        with open(path, "r") as file:
            self.assertEqual("foobar", file.read())

    def test_upload_output_invalid_input(self):
        Utils.start_contest()
        with self.assertRaises(Forbidden) as ex:
            self.handler.upload_output(input_id="invalid input", _ip="1.1.1.1", _file_content="foo", _file_name="bar")

        self.assertIn("No such input", ex.exception.response.data.decode())

    @patch("src.database.Database.gen_id", return_value="sourceid")
    def test_upload_source(self, gen_mock):
        Utils.start_contest()
        self._insert_data()

        res = self.handler.upload_source(input_id="inputid", _ip="1.1.1.1",
                                         _file_content="foobar".encode(), _file_name="source.txt")
        self.assertEqual("sourceid", res["id"])
        self.assertIn("source.txt", res["path"])
        self.assertEqual("inputid", res["input"])
        self.assertEqual(6, res["size"])
        path = os.path.join(Config.storedir, res["path"])
        with open(path, "r") as file:
            self.assertEqual("foobar", file.read())

    def test_upload_source_invalid_input(self):
        Utils.start_contest()
        with self.assertRaises(Forbidden) as ex:
            self.handler.upload_source(input_id="invalid input", _ip="1.1.1.1", _file_content="foo", _file_name="bar")

        self.assertIn("No such input", ex.exception.response.data.decode())

    def _insert_data(self):
        Database.add_user("token", "", "")
        Database.add_task("poldo", "", "", 42, 1)
        Database.add_user_task("token", "poldo")
        Database.add_input("inputid", "token", "poldo", 1, "/path", 42)
