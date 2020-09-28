#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017-2019 - Edoardo Morassutto <edoardo.morassutto@gmail.com>
# Copyright 2018 - William Di Luigi <williamdiluigi@gmail.com>
from datetime import datetime, timezone
import unittest
from unittest.mock import patch

from werkzeug.exceptions import Forbidden

from terry.database import Database
from terry.handlers.info_handler import InfoHandler
from terry.logger import Logger
from test.utils import Utils


class TestInfoHandler(unittest.TestCase):
    def setUp(self):
        Utils.prepare_test()
        self.handler = InfoHandler()

        self.log_backup = Logger.LOG_LEVEL
        Logger.LOG_LEVEL = 9001  # disable the logs

    def tearDown(self):
        Logger.LOG_LEVEL = self.log_backup

    def test_get_contest_not_started(self):
        res = self.handler.get_contest()

        self.assertFalse(res["has_started"])

    def test_contest_started(self):
        Database.add_task("poldo", "", "", 42, 1)
        Database.set_meta("start_time", 1234)

        res = self.handler.get_contest()
        self.assertTrue(res["has_started"])
        self.assertEqual(
            datetime.fromtimestamp(1234, timezone.utc).isoformat(), res["start_time"]
        )
        self.assertEqual(1, len(res["tasks"]))
        self.assertEqual("poldo", res["tasks"][0]["name"])

    def test_get_input(self):
        Database.add_user("token", "", "")
        Database.add_task("poldo", "", "", 42, 1)
        Database.add_input("inputid", "token", "poldo", 1, "/path", 42)
        Utils.start_contest()

        res = self.handler.get_input(input_id="inputid", _ip="1.1.1.1")
        self.assertEqual("inputid", res["id"])
        self.assertEqual("token", res["token"])
        self.assertEqual("poldo", res["task"])

    def test_get_input_invalid_id(self):
        Utils.start_contest()
        with self.assertRaises(Forbidden) as ex:
            self.handler.get_input(input_id="invalid input", _ip="1.1.1.1")

        response = ex.exception.response.data.decode()
        self.assertIn("No such input", response)

    def test_get_output(self):
        Database.add_user("token", "", "")
        Database.add_task("poldo", "", "", 42, 1)
        Database.add_input("inputid", "token", "poldo", 1, "/path", 42)
        Database.add_output("outputid", "inputid", "/path", 42, b'{"validation":42}')
        Utils.start_contest()

        res = self.handler.get_output(output_id="outputid", _ip="1.1.1.1")
        self.assertEqual("outputid", res["id"])
        self.assertEqual(42, res["validation"])

    def test_get_output_invalid_id(self):
        Utils.start_contest()
        with self.assertRaises(Forbidden) as ex:
            self.handler.get_output(output_id="invalid output", _ip="1.1.1.1")

        response = ex.exception.response.data.decode()
        self.assertIn("No such output", response)

    def test_get_source(self):
        Utils.start_contest()
        Database.add_user("token", "", "")
        Database.add_task("poldo", "", "", 42, 1)
        Database.add_input("inputid", "token", "poldo", 1, "/path", 42)
        Database.add_source("sourceid", "inputid", "/path", 42)

        res = self.handler.get_source(source_id="sourceid", _ip="1.1.1.1")
        self.assertEqual("sourceid", res["id"])

    def test_get_source_invalid_id(self):
        Utils.start_contest()
        with self.assertRaises(Forbidden) as ex:
            self.handler.get_source(source_id="invalid source", _ip="1.1.1.1")

        response = ex.exception.response.data.decode()
        self.assertIn("No such source", response)

    def test_get_submission(self):
        Utils.start_contest()
        Database.add_user("token", "", "")
        Database.add_task("poldo", "", "", 42, 1)
        Database.add_input("inputid", "token", "poldo", 1, "/path", 42)
        Database.add_output(
            "outputid", "inputid", "/path", 42, b'{"validation":42,"feedback":42}'
        )
        Database.add_source("sourceid", "inputid", "/path", 42)
        Database.add_submission("subid", "inputid", "outputid", "sourceid", 42)

        res = self.handler.get_submission(submission_id="subid", _ip="1.1.1.1")
        self.assertEqual("subid", res["id"])
        self.assertEqual("inputid", res["input"]["id"])
        self.assertEqual("outputid", res["output"]["id"])
        self.assertEqual("sourceid", res["source"]["id"])
        self.assertEqual(42, res["feedback"])

    def test_get_submission_invalid_id(self):
        Utils.start_contest()
        with self.assertRaises(Forbidden) as ex:
            self.handler.get_submission(
                submission_id="invalid submission", _ip="1.1.1.1"
            )

        response = ex.exception.response.data.decode()
        self.assertIn("No such submission", response)

    def test_get_user_invalid_token(self):
        Utils.start_contest()
        with self.assertRaises(Forbidden) as ex:
            self.handler.get_user(token="invalid token", _ip="1.1.1.1")

        response = ex.exception.response.data.decode()
        self.assertIn("No such user", response)

    def test_get_user(self):
        now = int(datetime.utcnow().timestamp())
        Database.set_meta("start_time", now)
        Database.set_meta("contest_duration", 1000)

        Database.set_meta("extra_time", 50)
        Database.add_user("token", "", "")
        Database.set_extra_time("token", 30)
        Database.add_task("poldo", "", "", 42, 1)
        Database.add_user_task("token", "poldo")
        Database.add_input("inputid", "token", "poldo", 1, "/path", 42)
        Database.set_user_attempt("token", "poldo", 1)

        res = self.handler.get_user(token="token", _ip="1.1.1.1")
        end_time = datetime.fromtimestamp(now + 1080, timezone.utc).isoformat()
        self.assertEqual(end_time, res["end_time"])
        self.assertEqual("poldo", res["tasks"]["poldo"]["name"])
        self.assertEqual("inputid", res["tasks"]["poldo"]["current_input"]["id"])

    def test_get_user_windowed(self):
        now = int(datetime.utcnow().timestamp())
        Database.set_meta("start_time", now)
        Database.set_meta("contest_duration", 1000)
        Database.set_meta("window_duration", 100)

        Database.add_user("token", "", "")
        Database.set_start_delay("token", 10)
        Database.add_task("poldo", "", "", 42, 1)
        Database.add_user_task("token", "poldo")
        Database.add_input("inputid", "token", "poldo", 1, "/path", 42)
        Database.set_user_attempt("token", "poldo", 1)

        res = self.handler.get_user(token="token", _ip="1.1.1.1")
        end_time = datetime.fromtimestamp(now + 110, timezone.utc).isoformat()
        self.assertEqual(end_time, res["end_time"])

    def test_get_user_windowed_almost_finished(self):
        now = int(datetime.utcnow().timestamp())
        Database.set_meta("start_time", now - 90)
        Database.set_meta("contest_duration", 1000)
        Database.set_meta("window_duration", 100)

        Database.add_user("token", "", "")
        Database.set_start_delay("token", 10)
        Database.add_task("poldo", "", "", 42, 1)
        Database.add_user_task("token", "poldo")
        Database.add_input("inputid", "token", "poldo", 1, "/path", 42)
        Database.set_user_attempt("token", "poldo", 1)

        res = self.handler.get_user(token="token", _ip="1.1.1.1")
        end_time = datetime.fromtimestamp(now + 20, timezone.utc).isoformat()
        self.assertEqual(end_time, res["end_time"])

    def test_get_user_windowed_partial_window(self):
        now = int(datetime.utcnow().timestamp())
        Database.set_meta("start_time", now)
        Database.set_meta("contest_duration", 1000)
        Database.set_meta("window_duration", 100)

        Database.add_user("token", "", "")
        Database.set_start_delay("token", 990)
        Database.add_task("poldo", "", "", 42, 1)
        Database.add_user_task("token", "poldo")
        Database.add_input("inputid", "token", "poldo", 1, "/path", 42)
        Database.set_user_attempt("token", "poldo", 1)

        res = self.handler.get_user(token="token", _ip="1.1.1.1")
        end_time = datetime.fromtimestamp(now + 1000, timezone.utc).isoformat()
        self.assertEqual(end_time, res["end_time"])

    def test_get_user_no_current_attempt(self):
        Utils.start_contest(since=100, duration=200)
        Database.add_user("token", "", "")
        Database.add_task("poldo", "", "", 42, 1)
        Database.add_user_task("token", "poldo")

        res = self.handler.get_user(token="token", _ip="1.1.1.1")
        self.assertEqual(None, res["tasks"]["poldo"]["current_input"])

    def test_get_submissions(self):
        Utils.start_contest()
        Database.add_user("token", "", "")
        Database.add_task("poldo", "", "", 42, 1)
        Database.add_input("inputid", "token", "poldo", 1, "/path", 42)
        Database.add_output(
            "outputid", "inputid", "/path", 42, b'{"validation":42,"feedback":42}'
        )
        Database.add_source("sourceid", "inputid", "/path", 42)
        Database.add_submission("subid", "inputid", "outputid", "sourceid", 42)

        res = self.handler.get_submissions(token="token", task="poldo", _ip="1.1.1.1")
        self.assertEqual(1, len(res["items"]))
        self.assertEqual("subid", res["items"][0]["id"])

    def test_get_submissions_invalid_token(self):
        Utils.start_contest()
        with self.assertRaises(Forbidden) as ex:
            self.handler.get_submissions(
                token="invalid token", task="poldo", _ip="1.1.1.1"
            )

        response = ex.exception.response.data.decode()
        self.assertIn("No such user", response)

    def test_get_submissions_invalid_task(self):
        Utils.start_contest()
        Database.add_user("token", "", "")
        with self.assertRaises(Forbidden) as ex:
            self.handler.get_submissions(
                token="token", task="invalid task", _ip="1.1.1.1"
            )

        response = ex.exception.response.data.decode()
        self.assertIn("No such task", response)

    @patch(
        "terry.handlers.info_handler.InfoHandler.patch_output",
        return_value={"id": "outputid"},
    )
    def test_patch_submission(self, mock):
        Utils.start_contest()
        submission = {
            "id": "subid",
            "nested_item": 42,
            "output_result": b'{"feedback":123}',
        }

        res = InfoHandler.patch_submission(submission)
        self.assertEqual("subid", res["id"])
        self.assertEqual(42, res["nested"]["item"])
        self.assertEqual(123, res["feedback"])
        self.assertEqual("outputid", res["output"]["id"])

    def test_patch_output(self):
        Utils.start_contest()
        output = {
            "id": "outputid",
            "date": 1234,
            "path": "/path",
            "size": 42,
            "result": b'{"validation":42}',
        }

        res = InfoHandler.patch_output(output)
        self.assertEqual("outputid", res["id"]),
        self.assertEqual(
            datetime.fromtimestamp(1234, timezone.utc).isoformat(), res["date"]
        )
        self.assertEqual("/path", res["path"])
        self.assertEqual(42, res["validation"])
        self.assertEqual(42, res["size"])
