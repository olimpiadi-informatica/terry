#!/usr/bin/env python3
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright 2017 - Edoardo Morassutto <edoardo.morassutto@gmail.com>
import os
import platform
import shutil
import tempfile
import unittest
from unittest.mock import patch, call

import gevent
from gevent import queue
from werkzeug.exceptions import Forbidden, NotFound, InternalServerError

from src import crypto
from src.config import Config
from src.contest_manager import ContestManager
from src.database import Database
from src.logger import Logger
from test.utils import Utils


class TestContestManager(unittest.TestCase):

    def setUp(self):
        Utils.prepare_test()

        self.log_backup = Logger.LOG_LEVEL
        Logger.LOG_LEVEL = 9001  # disable the logs
        self.tempdir = None

    def tearDown(self):
        Logger.LOG_LEVEL = self.log_backup

    def _setup_encrypted_file(self):
        self.tempdir = Utils.new_tmp_dir()
        enc_path = os.path.join(self.tempdir, "pack.zip.enc")
        dec_path = os.path.join(self.tempdir, "pack.zip")
        shutil.copy(os.path.join(os.path.dirname(__file__),
                                 "./assets/pack.zip.enc"), enc_path)
        Config.encrypted_file = enc_path
        Config.decrypted_file = dec_path

    def test_system_extension(self):
        sys_ext = ContestManager.system_extension()
        system = platform.system().lower()
        machine = platform.machine()

        self.assertEqual('.', sys_ext[0])
        self.assertTrue(sys_ext.find(system) >= 0)
        self.assertTrue(sys_ext.find(machine) >= 0)

    def test_extract_contest_malformed_token(self):
        with self.assertRaises(Forbidden):
            ContestManager.extract_contest("without dashes")

    def test_extract_contest_not_uploaded(self):
        Config.encrypted_file = "/not/exists"
        with self.assertRaises(NotFound):
            ContestManager.extract_contest("EDOOOO-XXXX-XXXX-XXXX-XXXX")

    def test_extract_contest_wrong_password(self):
        self._setup_encrypted_file()
        with self.assertRaises(Forbidden):
            ContestManager.extract_contest("EDOOOO-XXXX-XXXX-XXXX-XXXX")

    def test_extract_contest_unknown_username(self):
        self._setup_encrypted_file()
        with self.assertRaises(Forbidden):
            ContestManager.extract_contest("FOOBAR-ZVXJ-2IIH-LX5B-ZIGJ")

    def test_extract_contest(self):
        self._setup_encrypted_file()
        # see test/assets/README.md
        ContestManager.extract_contest("EDOOOO-HGKU-2VPK-LBXL-B6NA")

    def test_extract_no_priv(self):
        self._setup_encrypted_file()
        os.chmod(Config.encrypted_file, 0o000)
        with self.assertRaises(InternalServerError):
            ContestManager.extract_contest("EDOOOO-HGKU-2VPK-LBXL-B6NA")

    def test_extract_bad_zip(self):
        self.tempdir = Utils.new_tmp_dir()
        enc_path = os.path.join(self.tempdir, "pack.zip.enc")
        dec_path = os.path.join(self.tempdir, "pack.zip")
        Config.encrypted_file = enc_path
        Config.decrypted_file = dec_path
        with open(enc_path, "wb") as f:
            invalid_zip = b"this is not a zip"
            encrypted = crypto.encode(b"fooobar", invalid_zip, b"metadata")
            f.write(encrypted)
            password = crypto.gen_user_password("XXXXXX", b"YYY", b"fooobar")
        with self.assertRaises(Forbidden) as e:
            ContestManager.extract_contest(password)

    def test_import_contest(self):
        path = Utils.new_tmp_dir()
        self._prepare_contest_dir(path)
        Config.statementdir = Utils.new_tmp_dir()
        os.makedirs(os.path.join(Config.statementdir, "poldo"))

        contest = ContestManager.import_contest(path)
        self.assertTrue(os.path.isfile(
            os.path.join(Config.statementdir, "poldo", "statement.md")))

        self.assertEqual(18000, contest["duration"])
        self.assertEqual(1, len(contest["tasks"]))
        task = contest["tasks"][0]
        self.assertEqual("poldo", task["name"])
        self.assertEqual("Poldo", task["description"])
        self.assertEqual(42, task["max_score"])
        checker = os.path.join(path, "poldo", "managers",
                               "checker.linux.x86_64")
        validator = os.path.join(path, "poldo", "managers",
                                 "validator.linux.x86_64")
        generator = os.path.join(path, "poldo", "managers",
                                 "generator.linux.x86_64")
        self.assertEqual(checker, task["checker"])
        self.assertEqual(validator, task["validator"])
        self.assertEqual(generator, task["generator"])
        self.assertEqual(
            os.path.join(Config.web_statementdir, "poldo", "statement.md"),
            task["statement_path"])
        self.assertEqual(0o755, os.stat(checker).st_mode & 0o777)
        self.assertEqual(0o755, os.stat(validator).st_mode & 0o777)
        self.assertEqual(0o755, os.stat(generator).st_mode & 0o777)

        self.assertEqual(1, len(contest["users"]))
        user = contest["users"][0]
        self.assertEqual("token", user["token"])
        self.assertEqual("Test", user["name"])
        self.assertEqual("User", user["surname"])

    def test_import_contest_removes_file(self):
        path = Utils.new_tmp_dir()
        self._prepare_contest_dir(path)
        Config.statementdir = Utils.new_tmp_dir()
        self._write_file(Config.statementdir, "poldo", "foobar")

        self.assertTrue(
            os.path.isfile(os.path.join(Config.statementdir, "poldo")))
        ContestManager.import_contest(path)
        self.assertTrue(
            os.path.isdir(os.path.join(Config.statementdir, "poldo")))

    def test_read_from_disk_missing_dir(self):
        Logger.LOG_LEVEL = self.log_backup
        with Utils.nostderr() as stderr:
            Config.contest_path = "/not/existing/path"
            ContestManager.read_from_disk()

        self.assertIn("Contest not found", stderr.buffer)

    def test_read_from_disk(self):
        path = Utils.new_tmp_dir()
        self._prepare_contest_dir(path)
        Config.statementdir = Utils.new_tmp_dir()
        Config.contest_path = path
        ContestManager.read_from_disk()

        self.assertEqual(18000, Database.get_meta("contest_duration", type=int))
        tasks = Database.get_tasks()
        self.assertEqual(1, len(tasks))
        self.assertEqual("poldo", tasks[0]["name"])
        self.assertEqual("Poldo", tasks[0]["title"])
        self.assertEqual(42, tasks[0]["max_score"])
        self.assertEqual(0, tasks[0]["num"])

        users = Database.get_users()
        self.assertEqual(1, len(users))
        self.assertEqual("token", users[0]["token"])
        self.assertEqual("Test", users[0]["name"])
        self.assertEqual("User", users[0]["surname"])
        self.assertEqual(0, users[0]["extra_time"])

        user_tasks = Database.get_user_task("token", "poldo")
        self.assertEqual("token", user_tasks["token"])
        self.assertEqual("poldo", user_tasks["task"])
        self.assertEqual(0, user_tasks["score"])
        self.assertIsNone(user_tasks["current_attempt"])

        self.assertTrue(Database.get_meta("contest_imported", type=bool))
        self.assertTrue(ContestManager.has_contest)
        self.assertIn("poldo", ContestManager.tasks)
        self.assertIn("poldo", ContestManager.input_queue)

    @patch("src.database.Database.add_task", side_effect=Exception("ops..."))
    def test_read_from_disk_transaction_failed(self, add_task_mock):
        path = Utils.new_tmp_dir()
        self._prepare_contest_dir(path)
        Config.statementdir = Utils.new_tmp_dir()
        Config.contest_path = path
        with self.assertRaises(Exception) as ex:
            ContestManager.read_from_disk()
        self.assertEqual("ops...", ex.exception.args[0])
        self.assertIsNone(Database.get_meta("contest_duration"))

    @patch("gevent.subprocess.call")
    @patch("src.database.Database.gen_id", return_value="inputid")
    def test_worker(self, gen_id_mock, call_mock):
        call_mock.side_effect = TestContestManager._valid_subprocess_call
        ContestManager.tasks["poldo"] = {"generator": "/gen",
                                         "validator": "/val"}

        with patch("src.logger.Logger.error",
                   side_effect=TestContestManager._stop_worker_loop):
            with patch("gevent.queue.Queue.put",
                       side_effect=NotImplementedError("Stop loop")):
                with self.assertRaises(NotImplementedError) as ex:
                    ContestManager.worker("poldo")

    @patch("gevent.subprocess.call", return_value=42)
    @patch("src.database.Database.gen_id", return_value="inputid")
    def test_worker_generator_fails(self, gen_id_mock, call_mock):
        ContestManager.tasks["poldo"] = {"generator": "/gen",
                                         "validator": "/val"}

        with patch("src.logger.Logger.error",
                   side_effect=TestContestManager._stop_worker_loop):
            with patch("gevent.queue.Queue.put",
                       side_effect=NotImplementedError("Stop loop")):
                with self.assertRaises(Exception) as ex:
                    ContestManager.worker("poldo")
                self.assertIn("Error 42 generating input", ex.exception.args[0])

    @patch("gevent.subprocess.call")
    @patch("src.database.Database.gen_id", return_value="inputid")
    def test_worker_validator_fails(self, gen_id_mock, call_mock):
        call_mock.side_effect = TestContestManager._broken_val_subprocess_call
        ContestManager.tasks["poldo"] = {"generator": "/gen",
                                         "validator": "/val"}

        with patch("src.logger.Logger.error",
                   side_effect=TestContestManager._stop_worker_loop):
            with patch("gevent.queue.Queue.put",
                       side_effect=NotImplementedError("Stop loop")):
                with self.assertRaises(Exception) as ex:
                    ContestManager.worker("poldo")
                self.assertIn("Error 42 validating input", ex.exception.args[0])

    def test_start(self):
        ContestManager.tasks = {"task1": "1!!", "task2": "2!!!"}
        with patch("gevent.spawn") as mock:
            ContestManager.start()
            mock.assert_has_calls([call(ContestManager.worker, "task1"),
                                   call(ContestManager.worker, "task2")],
                                  any_order=True)

    def test_get_input(self):
        input_path = Utils.new_tmp_file()
        ContestManager.input_queue["poldo"] = gevent.queue.Queue(1)
        ContestManager.input_queue["poldo"].put(
            {"id": "inputid", "path": input_path})

        input = ContestManager.get_input("poldo", 42)
        self.assertEqual("inputid", input[0])
        self.assertIn("poldo_input_42.txt", input[1])

    @patch("src.logger.Logger.warning",
           side_effect=lambda *args: exec("raise NotImplementedError(*args)"))
    def test_get_input_queue_underrun(self, warning_mock):
        ContestManager.input_queue["poldo"] = gevent.queue.Queue(1)
        with self.assertRaises(NotImplementedError) as ex:
            ContestManager.get_input("poldo", 42)
        self.assertIn("Empty queue for task poldo!", ex.exception.args[1])

    @patch("gevent.subprocess.check_output", return_value="yee")
    def test_evaluate_output(self, check_mock):
        ContestManager.tasks["poldo"] = {"checker": "/gen"}
        output = ContestManager.evaluate_output("poldo", "/input", "/output")
        self.assertEqual("yee", output)

    @patch("gevent.subprocess.check_output",
           side_effect=NotImplementedError("ops ;)"))
    def test_evaluate_output_failed(self, check_mock):
        ContestManager.tasks["poldo"] = {"checker": "/gen"}

        Logger.LOG_LEVEL = self.log_backup
        with self.assertRaises(NotImplementedError) as ex:
            with Utils.nostderr() as stderr:
                ContestManager.evaluate_output("poldo", "/input", "/output")
        self.assertIn("Error while evaluating output", stderr.buffer)
        self.assertEqual("ops ;)", ex.exception.args[0])

    @staticmethod
    def _stop_worker_loop(cat, text):
        if "Stop loop" not in text:
            raise Exception(text)
        raise NotImplementedError()

    @staticmethod
    def _valid_subprocess_call(params, stdout=None, stdin=None):
        if stdout is not None:
            os.write(stdout, "hello!".encode())
        if stdin is not None:
            content = os.read(stdin, 6).decode()
            if content != "hello!":
                raise Exception("Pipe broken")
        return 0

    @staticmethod
    def _broken_val_subprocess_call(params, stdout=None, stdin=None):
        if stdout is not None:
            os.write(stdout, "hello!".encode())
        if stdin is not None:
            return 42
        return 0

    def _prepare_contest_dir(self, path):
        self._write_file(path, "contest.yaml",
                         "duration: 18000\n"
                         "tasks:\n"
                         "    - poldo\n"
                         "users:\n"
                         "    - token: token\n"
                         "      name: Test\n"
                         "      surname: User\n")
        self._write_file(path, "poldo/task.yaml",
                         "name: poldo\n"
                         "description: Poldo\n"
                         "max_score: 42")
        self._write_file(path, "poldo/statement/statement.md", "# Poldo")
        self._write_file(path, "poldo/managers/generator.linux.x86_64",
                         "#!/usr/bin/bash\n"
                         "echo 42\n")
        self._write_file(path, "poldo/managers/validator.linux.x86_64",
                         "#!/usr/bin/bash\n"
                         "exit 0\n")
        self._write_file(path, "poldo/managers/checker.linux.x86_64",
                         "#!/usr/bin/bash\n"
                         "echo '{\"validation\":{},\"feedback\":{},"
                         "\"score\":0.5}'")

    def _write_file(self, prefix, filename, content):
        path = os.path.join(prefix, filename)
        dir = os.path.dirname(path)
        os.makedirs(dir, exist_ok=True)
        with open(path, "w") as file:
            file.write(content)
