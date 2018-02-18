#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017-2018 - Edoardo Morassutto <edoardo.morassutto@gmail.com>

import unittest
from unittest.mock import patch

from werkzeug.exceptions import Forbidden, BadRequest

from terry.database import Database
from terry.handlers.contest_handler import ContestHandler
from terry.logger import Logger
from test.utils import Utils


class TestContestHandler(unittest.TestCase):

    def setUp(self):
        Utils.prepare_test()
        self.handler = ContestHandler()
        self.inputid = "inputid"

        self.log_backup = Logger.LOG_LEVEL
        Logger.LOG_LEVEL = 9001  # disable the logs

    def tearDown(self):
        Logger.LOG_LEVEL = self.log_backup

    def test_compute_score(self):
        self._insert_data()
        self.assertEqual(21, ContestHandler.compute_score('poldo',
                                                          b'{"score":0.5}'))

    def test_update_user_score(self):
        self._insert_data()

        ContestHandler.update_user_score('token', 'poldo', 42)

        Database.c.execute(
            "SELECT score FROM user_tasks WHERE token = 'token' AND task = "
            "'poldo'")
        row = Database.c.fetchone()
        self.assertEqual(42, row[0])

    def test_update_user_score_less(self):
        self._insert_data()
        Database.c.execute("UPDATE user_tasks SET score = 40")

        ContestHandler.update_user_score('token', 'poldo', 20)

        Database.c.execute(
            "SELECT score FROM user_tasks WHERE token = 'token' AND task = "
            "'poldo'")
        row = Database.c.fetchone()
        self.assertEqual(40, row[0])

    def test_generate_input_invalid_token(self):
        Utils.start_contest()
        self._insert_data()

        with self.assertRaises(Forbidden) as ex:
            self.handler.generate_input(token='invalid token', task='poldo',
                                        _ip='1.1.1.1')

        self.assertIn("No such user", ex.exception.response.data.decode())

    def test_generate_input_invalid_task(self):
        Utils.start_contest()
        self._insert_data()

        with self.assertRaises(Forbidden) as ex:
            self.handler.generate_input(token='token', task='invalid task',
                                        _ip='1.1.1.1')

        self.assertIn("No such task", ex.exception.response.data.decode())

    @patch("terry.contest_manager.ContestManager.get_input",
           return_value=('inputid', '/path'))
    @patch("terry.storage_manager.StorageManager.get_file_size", return_value=42)
    def test_generate_input_already_have(self, get_file_size_mock,
                                         get_input_mock):
        Utils.start_contest()
        self._insert_data()
        self.handler.generate_input(token='token', task='poldo', _ip='1.1.1.1')

        with self.assertRaises(Forbidden) as ex:
            self.handler.generate_input(token='token', task='poldo',
                                        _ip='1.1.1.1')

        self.assertIn("You already have a ready input",
                      ex.exception.response.data.decode())

    @patch("terry.contest_manager.ContestManager.get_input",
           return_value=('inputid', '/path'))
    @patch("terry.storage_manager.StorageManager.get_file_size", return_value=42)
    @patch("terry.database.Database.register_ip", return_value=None)
    def test_generate_input_transaction_broken(self, register_mock,
                                               get_file_size_mock,
                                               get_input_mock):
        Utils.start_contest()
        self._insert_data()
        with self.assertRaises(Exception) as ex:
            with patch("terry.database.Database.commit",
                       side_effect=Exception("ops...")):
                self.handler.generate_input(token='token', task='poldo',
                                            _ip='1.1.1.1')
        self.assertIn("ops...", ex.exception.args[0])
        self.assertIsNone(Database.get_input("inputid"))

    @patch("terry.contest_manager.ContestManager.get_input",
           return_value=('inputid', '/path'))
    @patch("terry.storage_manager.StorageManager.get_file_size", return_value=42)
    def test_generate_input(self, get_file_size_mock, get_input_mock):
        Utils.start_contest()
        self._insert_data()
        response = self.handler.generate_input(token='token', task='poldo',
                                               _ip='1.1.1.1')

        self.assertEqual("inputid", response["id"])
        self.assertEqual("/path", response["path"])
        self.assertEqual(42, response["size"])
        self.assertEqual("token", response["token"])
        self.assertEqual("poldo", response["task"])
        self.assertEqual(1, response["attempt"])

        Database.c.execute("SELECT * FROM user_tasks WHERE token = 'token'")
        row = Database.c.fetchone()
        self.assertEqual("token", row[0])
        self.assertEqual("poldo", row[1])
        self.assertEqual(1, row[3])

    def test_submit_invalid_output(self):
        Utils.start_contest()
        self._insert_data()

        with self.assertRaises(Forbidden) as ex:
            self.handler.submit(output_id='invalid output',
                                source_id='invalid source', _ip='1.1.1.1')

        self.assertIn("No such output", ex.exception.response.data.decode())

    @patch("terry.contest_manager.ContestManager.get_input",
           return_value=('inputid', '/path'))
    @patch("terry.storage_manager.StorageManager.get_file_size", return_value=42)
    def test_sumbit_invalid_source(self, g_f_s_mock, g_i_mock):
        Utils.start_contest()
        self._insert_data()

        self.handler.generate_input(token='token', task='poldo', _ip='1.1.1.1')
        Database.c.execute(
            "INSERT INTO outputs (id, input, path, size, result) "
            "VALUES ('outputid', 'inputid', '/output', 42, '{}')")
        with self.assertRaises(Forbidden) as ex:
            self.handler.submit(output_id='outputid',
                                source_id='invalid source', _ip='1.1.1.1')

        self.assertIn("No such source", ex.exception.response.data.decode())

    @patch("terry.contest_manager.ContestManager.get_input",
           return_value=("inputid", '/path'))
    @patch("terry.storage_manager.StorageManager.get_file_size", return_value=42)
    def test_sumbit_not_matching(self, g_f_s_mock, g_i_mock):
        Utils.start_contest()
        self._insert_data(token="token", task="poldo")
        self._insert_data(token="token2", task="poldo")
        backup = Logger.LOG_LEVEL
        Logger.LOG_LEVEL = 9001

        self.handler.generate_input(token='token', task='poldo', _ip='1.1.1.1')
        g_i_mock.return_value = ("inputid2", "/path")
        self.handler.generate_input(token='token2', task='poldo', _ip='1.1.1.1')

        Database.c.execute(
            "INSERT INTO outputs (id, input, path, size, result) "
            "VALUES ('outputid', 'inputid', '/output', 42, '{}')")
        Database.c.execute("INSERT INTO sources (id, input, path, size) "
                           "VALUES ('sourceid', 'inputid2', '/source', 42)")
        with self.assertRaises(Forbidden) as ex:
            self.handler.submit(output_id='outputid', source_id='sourceid',
                                _ip='1.1.1.1')

        self.assertIn("The provided pair of source-output is invalid",
                      ex.exception.response.data.decode())
        Logger.LOG_LEVEL = backup

    @patch("terry.contest_manager.ContestManager.get_input",
           return_value=("inputid", '/path'))
    @patch("terry.storage_manager.StorageManager.get_file_size", return_value=42)
    def test_submit_db_broken(self, g_i_mock, g_f_s_mock):
        Utils.start_contest()
        self._insert_data()
        self.handler.generate_input(token='token', task='poldo', _ip='1.1.1.1')
        Database.c.execute(
            "INSERT INTO outputs (id, input, path, size, result) "
            "VALUES ('outputid', 'inputid', '/output', 42,"
            "'{\"score\":0.5,\"feedback\":{\"a\":1},\"validation\":{"
            "\"b\":2}}')")
        Database.c.execute("INSERT INTO sources (id, input, path, size) "
                           "VALUES ('sourceid', 'inputid', '/source', 42)")
        with patch("terry.database.Database.get_input", return_value=None):
            with Utils.nostderr() as stderr:
                with self.assertRaises(BadRequest) as ex:
                    self.handler.submit(output_id='outputid',
                                        source_id='sourceid', _ip='1.1.1.1')
        self.assertIn("WRONG_INPUT", ex.exception.response.data.decode())
        self.assertIn("The provided input in invalid",
                      ex.exception.response.data.decode())

    @patch("terry.database.Database.gen_id", return_value="subid")
    @patch("terry.database.Database.add_submission", return_value=None)
    @patch("terry.contest_manager.ContestManager.get_input",
           return_value=("inputid", '/path'))
    @patch("terry.storage_manager.StorageManager.get_file_size", return_value=42)
    def test_submit_broken_transaction(self, gen_i_mock, a_s_mock, g_f_s_mock,
                                       g_i_mock):
        Utils.start_contest()
        self._insert_data()
        self.handler.generate_input(token='token', task='poldo', _ip='1.1.1.1')

        Database.c.execute(
            "INSERT INTO outputs (id, input, path, size, result) "
            "VALUES ('outputid', 'inputid', '/output', 42,"
            ":result)",
            {
                "result": b'{\"score\":0.5,\"feedback\":{\"a\":1},'
                          b'\"validation\":{\"b\":2}}'})
        Database.c.execute("INSERT INTO sources (id, input, path, size) "
                           "VALUES ('sourceid', 'inputid', '/source', 42)")

        with self.assertRaises(BadRequest) as ex:
            self.handler.submit(output_id='outputid', source_id='sourceid',
                                _ip='1.1.1.1')
        self.assertIn("Error inserting the submission",
                      ex.exception.response.data.decode())
        self.assertIsNone(Database.get_submission("subid"))

    @patch("terry.contest_manager.ContestManager.get_input",
           return_value=("inputid", '/path'))
    @patch("terry.storage_manager.StorageManager.get_file_size", return_value=42)
    def test_submit(self, g_f_s_mock, g_i_mock):
        Utils.start_contest()
        self._insert_data()
        self.handler.generate_input(token='token', task='poldo', _ip='1.1.1.1')

        Database.c.execute(
            "INSERT INTO outputs (id, input, path, size, result) "
            "VALUES ('outputid', 'inputid', '/output', 42,"
            ":result)",
            {
                "result": b'{\"score\":0.5,\"feedback\":{\"a\":1},'
                          b'\"validation\":{\"b\":2}}'})
        Database.c.execute("INSERT INTO sources (id, input, path, size) "
                           "VALUES ('sourceid', 'inputid', '/source', 42)")

        response = self.handler.submit(output_id='outputid',
                                       source_id='sourceid', _ip='1.1.1.1')
        self.assertEqual("token", response["token"])
        self.assertEqual("poldo", response["task"])
        self.assertEqual(21, response["score"])
        self.assertEqual("inputid", response["input"]["id"])
        self.assertEqual("sourceid", response["source"]["id"])
        self.assertEqual("outputid", response["output"]["id"])
        self.assertEqual(1, response["feedback"]["a"])
        self.assertEqual(2, response["output"]["validation"]["b"])

        user_task = Database.get_user_task("token", "poldo")
        self.assertEqual(21, user_task["score"])
        self.assertEqual(response["id"],
                         Database.get_submission(response["id"])["id"])

    def _insert_data(self, token="token", task="poldo"):
        try:
            Database.c.execute("""
                INSERT INTO tasks (name, title, statement_path, max_score, num)
                VALUES ('%s', '', '', 42, 0)
            """ % task)
        except:
            pass
        try:
            Database.c.execute("""
                INSERT INTO users (token, name, surname)
                VALUES ('%s', '', '')
            """ % token)
        except:
            pass
        try:
            Database.c.execute("""
                INSERT INTO user_tasks (token, task, score) VALUES ('%s', '%s', 0)
            """ % (token, task))
        except:
            pass
