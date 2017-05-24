#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017 - Edoardo Morassutto <edoardo.morassutto@gmail.com>
import unittest

import datetime

from unittest.mock import patch
from werkzeug.exceptions import Forbidden

from src.database import Database
from src.handlers.info_handler import InfoHandler
from test.utils import Utils


class TestInfoHandler(unittest.TestCase):
    def setUp(self):
        Utils.prepare_test()
        self.handler = InfoHandler()

    def test_get_contest_not_started(self):
        res = self.handler.get_contest()

        self.assertFalse(res["has_started"])

    def test_contest_started(self):
        Database.add_task("poldo", "", "", 42, 1)
        Database.set_meta("start_time", 1234)

        res = self.handler.get_contest()
        self.assertEqual(datetime.datetime.fromtimestamp(1234).isoformat(), res["has_started"])
        self.assertEqual(1, len(res["tasks"]))
        self.assertEqual("poldo", res["tasks"][0]["name"])

    def test_get_input(self):
        Database.add_user("token", "", "")
        Database.add_task("poldo", "", "", 42, 1)
        Database.add_input("inputid", "token", "poldo", 1, "/path", 42)

        res = self.handler.get_input("inputid", "1.1.1.1")
        self.assertEqual("inputid", res["id"])
        self.assertEqual("token", res["token"])
        self.assertEqual("poldo", res["task"])

    def test_get_input_invalid_id(self):
        with self.assertRaises(Forbidden) as ex:
            self.handler.get_input("invalid input", "1.1.1.1")

        response = ex.exception.response.data.decode()
        self.assertTrue(response.find("You cannot get the required input") >= 0)

    def test_get_output(self):
        Database.add_user("token", "", "")
        Database.add_task("poldo", "", "", 42, 1)
        Database.add_input("inputid", "token", "poldo", 1, "/path", 42)
        Database.add_output("outputid", "inputid", "/path", 42, '{"validation":42}')

        res = self.handler.get_output("outputid", "1.1.1.1")
        self.assertEqual("outputid", res["id"])
        self.assertEqual(42, res["validation"])

    def test_get_output_invalid_id(self):
        with self.assertRaises(Forbidden) as ex:
            self.handler.get_output("invalid output", "1.1.1.1")

        response = ex.exception.response.data.decode()
        self.assertTrue(response.find("You cannot get the required output") >= 0)

    def test_get_source(self):
        Database.add_user("token", "", "")
        Database.add_task("poldo", "", "", 42, 1)
        Database.add_input("inputid", "token", "poldo", 1, "/path", 42)
        Database.add_source("sourceid", "inputid", "/path", 42)

        res = self.handler.get_source("sourceid", "1.1.1.1")
        self.assertEqual("sourceid", res["id"])

    def test_get_source_invalid_id(self):
        with self.assertRaises(Forbidden) as ex:
            self.handler.get_source("invalid source", "1.1.1.1")

        response = ex.exception.response.data.decode()
        self.assertTrue(response.find("You cannot get the required source") >= 0)

    def test_get_submission(self):
        Database.add_user("token", "", "")
        Database.add_task("poldo", "", "", 42, 1)
        Database.add_input("inputid", "token", "poldo", 1, "/path", 42)
        Database.add_output("outputid", "inputid", "/path", 42, '{"validation":42,"feedback":42}')
        Database.add_source("sourceid", "inputid", "/path", 42)
        Database.add_submission("subid", "inputid", "outputid", "sourceid", 42)

        res = self.handler.get_submission("subid", "1.1.1.1")
        self.assertEqual("subid", res["id"])
        self.assertEqual("inputid", res["input"]["id"])
        self.assertEqual("outputid", res["output"]["id"])
        self.assertEqual("sourceid", res["source"]["id"])
        self.assertEqual(42, res["feedback"])

    def test_get_submission_invalid_id(self):
        with self.assertRaises(Forbidden) as ex:
            self.handler.get_submission("invalid submission", "1.1.1.1")

        response = ex.exception.response.data.decode()
        self.assertTrue(response.find("You cannot get the required submission") >= 0)

    def test_get_user_invalid_token(self):
        with self.assertRaises(Forbidden) as ex:
            self.handler.get_user("invalid token", "1.1.1.1")

        response = ex.exception.response.data.decode()
        self.assertTrue(response.find("Invalid login") >= 0)

    def test_get_user(self):
        Database.set_meta("start_time", int(datetime.datetime.now().timestamp() - 100))
        Database.set_meta("contest_duration", 200)
        Database.set_meta("extra_time", 50)
        Database.add_user("token", "", "")
        Database.set_extra_time("token", 30)
        Database.add_task("poldo", "", "", 42, 1)
        Database.add_user_task("token", "poldo")
        Database.add_input("inputid", "token", "poldo", 1, "/path", 42)
        Database.set_user_attempt("token", "poldo", 1)

        res = self.handler.get_user("token", "1.1.1.1")
        self.assertEqual(180, res["remaining_time"])
        self.assertEqual("poldo", res["tasks"]["poldo"]["name"])
        self.assertEqual("inputid", res["tasks"]["poldo"]["current_input"]["id"])

    def test_get_user_no_current_attempt(self):
        Database.set_meta("start_time", int(datetime.datetime.now().timestamp() - 100))
        Database.set_meta("contest_duration", 200)
        Database.add_user("token", "", "")
        Database.add_task("poldo", "", "", 42, 1)
        Database.add_user_task("token", "poldo")

        res = self.handler.get_user("token", "1.1.1.1")
        self.assertEqual(None, res["tasks"]["poldo"]["current_input"])

    def test_get_submissions(self):
        Database.add_user("token", "", "")
        Database.add_task("poldo", "", "", 42, 1)
        Database.add_input("inputid", "token", "poldo", 1, "/path", 42)
        Database.add_output("outputid", "inputid", "/path", 42, '{"validation":42,"feedback":42}')
        Database.add_source("sourceid", "inputid", "/path", 42)
        Database.add_submission("subid", "inputid", "outputid", "sourceid", 42)

        res = self.handler.get_submissions("token", "poldo", "1.1.1.1")
        self.assertEqual(1, len(res["items"]))
        self.assertEqual("subid", res["items"][0]["id"])

    def test_get_submissions_invalid_token(self):
        with self.assertRaises(Forbidden) as ex:
            self.handler.get_submissions("invalid token", "poldo", "1.1.1.1")

        response = ex.exception.response.data.decode()
        self.assertTrue(response.find("Invalid login") >= 0)

    def test_get_submissions_invalid_task(self):
        Database.add_user("token", "", "")
        with self.assertRaises(Forbidden) as ex:
            self.handler.get_submissions("token", "invalid task", "1.1.1.1")

        response = ex.exception.response.data.decode()
        self.assertTrue(response.find("Invalid task") >= 0)

    @patch("src.handlers.info_handler.InfoHandler.patch_output", return_value={"id":"outputid"})
    def test_patch_submission(self, mock):
        submission = {
            "id": "subid",
            "nested_item": 42,
            "output_result": '{"feedback":123}'
        }

        res = InfoHandler.patch_submission(submission)
        self.assertEqual("subid", res["id"])
        self.assertEqual(42, res["nested"]["item"])
        self.assertEqual(123, res["feedback"])
        self.assertEqual("outputid", res["output"]["id"])

    def test_patch_output(self):
        output = {
            "id": "outputid",
            "date": 1234,
            "path": "/path",
            "size": 42,
            "result": '{"validation":42}'
        }

        res = InfoHandler.patch_output(output)
        self.assertEqual("outputid", res["id"]),
        self.assertEqual(datetime.datetime.fromtimestamp(1234).isoformat(), res["date"])
        self.assertEqual("/path", res["path"])
        self.assertEqual(42, res["validation"])
        self.assertEqual(42, res["size"])
